#!/usr/bin/env python3
"""Import exact HipLab clips, optionally synthesize missing lines, audit every file.

All media, raw caches, Python dependencies and temporary audio stay below --root.
No network requests occur without --synthesize. No source repository is changed.
"""
import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor

REPO = Path(__file__).resolve().parents[2]


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def safe_under(root, relative):
    relative = Path(relative)
    if relative.is_absolute() or '..' in relative.parts:
        raise ValueError('media reference must be relative and remain under root')
    out = (root / relative).resolve()
    if not out.is_relative_to(root.resolve()):
        raise ValueError('media reference escapes root')
    return out


def entries(script):
    for action, lines in script['actions'].items():
        for key, text in lines.items():
            for lang in script['languages']:
                yield action, key, lang, text[lang], f'voice/{lang}/{action}/{key}.m4a'
    for key, text in script['common'].items():
        for lang in script['languages']:
            yield 'common', key, lang, text[lang], f'voice/common/{lang}/{key}.m4a'


def run(args):
    root = Path(args.root).resolve()
    work = root / 'work' / 'voice'
    work.mkdir(parents=True, exist_ok=True)
    os.environ['TMP'] = os.environ['TEMP'] = str(work)
    tempfile.tempdir = str(work)
    sys.path.insert(0, str(root / 'work' / 'python-deps'))
    import hiplab_audio as A
    script_path = REPO / 'catalog/voice-v2/script.json'
    script = json.loads(script_path.read_text(encoding='utf-8'))
    destination = REPO / 'catalog/voice-v2/manifest.json'
    previous_by_path = {}
    if destination.exists():
        previous = json.loads(destination.read_text(encoding='utf-8'))
        for record in list(previous.get('actions', {}).values()) + [previous.get('sharedVocabulary', {})]:
            for lang, lines in record.get('lines', {}).items():
                for old in lines.values():
                    if old.get('ref'):
                        previous_by_path[old['ref']['path']] = (lang, previous.get('voices', {}).get(lang), old)
    source = Path(args.hiplab).resolve()
    source_manifest = source / 'assets/voice/manifest.json'
    original = json.loads(source_manifest.read_text(encoding='utf-8'))
    by_text = {}
    for lang, voice in original['voices'].items():
        for key, text in original['lines'].items():
            clip = source / 'assets/voice' / lang / f'{key}.m4a'
            if lang in text and clip.is_file():
                by_text.setdefault((lang, voice, text[lang]), (clip, key))

    manifest = {'schema': 'pose-hub-voice@2', 'scriptSha256': sha(script_path),
                'voices': script['voices'], 'rates': script['rates'], 'voiceProfile': {lang: {'voice': script['voices'][lang], 'rate': script['rates'][lang]} for lang in script['languages']},
                'auditStandard': {'lufsTarget': -16, 'lufsTolerance': 1, 'truePeakMaxDbtp': -1,
                             'codec': 'aac', 'sampleRate': 44100, 'channels': 1},
                'contentReview': script['reviewStatus'], 'manualListening': 'pending',
                'sourceManifestSha256': sha(source_manifest), 'actions': {},
                'sharedVocabulary': {'lines': {}}, 'networkErrors': []}
    jobs = []
    for action, key, lang, text, relative in entries(script):
        dest = safe_under(root, relative)
        dest.parent.mkdir(parents=True, exist_ok=True)
        item = {'text': text, 'role': key.split('.')[0], 'status': 'pending', 'ref': None}
        record = manifest['sharedVocabulary'] if action == 'common' else manifest['actions'].setdefault(action, {'lines': {}})
        record['lines'].setdefault(lang, {})[key] = item
        matching = by_text.get((lang, script['voices'][lang], text))
        if matching:
            clip, original_key = matching
            # Reuse bytes only when both text and voice match the source manifest.
            digest = sha(clip)
            if dest.exists() and sha(dest) != digest:
                raise RuntimeError(f'Existing media differs: {dest}; use a new root for new production')
            if not dest.exists():
                shutil.copyfile(clip, dest)
            item['provenance'] = {'kind': 'imported', 'source': 'HipLab/assets/voice',
                                  'sourceKey': original_key, 'sourceSha256': digest,
                                  'sourceRate': 'HipLab build_voice.py RATE; not stored per clip'}
            jobs.append((dest, item, key, lang, text, relative, None))
        else:
            if dest.exists():
                old_lang, old_voice, old = previous_by_path.get(relative, (None, None, {}))
                if (old_lang != lang or old_voice != script['voices'][lang] or old.get('text') != text
                        or old.get('ref', {}).get('sha256') != sha(dest)):
                    raise RuntimeError(f'Existing generated media lacks matching text/voice/hash provenance: {dest}; use a new root')
            fingerprint = hashlib.sha256(f"{script['voices'][lang]}|{script['rates'][lang]}|{text}".encode()).hexdigest()
            raw = work / 'raw' / f'{fingerprint}.mp3'
            item['provenance'] = {'kind': 'new-text-or-translation', 'review': 'pending-user-review',
                                  'voice': script['voices'][lang], 'rate': script['rates'][lang]}
            jobs.append((dest, item, key, lang, text, relative, raw))

    async def generate():
        import edge_tts
        for dest, item, key, lang, text, relative, raw in jobs:
            if raw is None:
                continue
            raw.parent.mkdir(parents=True, exist_ok=True)
            if not raw.exists():
                try:
                    await asyncio.wait_for(edge_tts.Communicate(text, script['voices'][lang],
                                                               rate=script['rates'][lang]).save(str(raw)), 40)
                except Exception as exc:
                    # Stop at the first network failure. Preserve explicit pending state.
                    manifest['networkErrors'].append({'lang': lang, 'key': key, 'error': str(exc),
                                                       'type': type(exc).__name__})
                    if raw.exists() and raw.stat().st_size == 0:
                        raw.unlink()
                    break
            if not dest.exists():
                A._process(raw, dest)
            item['provenance']['rawSha256'] = sha(raw)

    if args.synthesize:
        asyncio.run(generate())

    def audit(job):
        dest, item, key, lang, text, relative, raw = job
        if not dest.exists():
            item['pendingReason'] = 'missing exact HipLab clip and synthesis unavailable or not requested'
            return
        decoded = A.decode(dest)
        audit_result = A.audit_clip(dest, text, lang, round(len(decoded) / A.SR * 1000), raw)
        item['audit'] = audit_result
        item['audit']['rawComparison'] = bool(raw and raw.exists())
        item['ref'] = {'root': 'media', 'path': relative, 'sha256': sha(dest),
                       'bytes': dest.stat().st_size, 'durationSeconds': round(len(decoded) / A.SR, 6),
                       'sampleRate': A.SR, 'channels': 1, 'codec': 'aac'}
        item['status'] = 'failed' if audit_result['fails'] else 'passed'

    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(audit, jobs))
    statuses = [job[1]['status'] for job in jobs]
    manifest['summary'] = {state: statuses.count(state) for state in ['passed', 'pending', 'failed']}
    manifest['summary']['total'] = len(statuses)
    for record in list(manifest['actions'].values()) + [manifest['sharedVocabulary']]:
        record['status'] = 'passed' if all(v['status'] == 'passed' for lines in record['lines'].values() for v in lines.values()) else 'incomplete'
    destination.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'manifest': str(destination), 'summary': manifest['summary'],
                      'networkErrors': manifest['networkErrors']}, ensure_ascii=False))
    return 0 if manifest['summary']['passed'] == len(statuses) else 1


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True, help='approved media root, e.g. F:/PoseHub-v2-pilot')
    parser.add_argument('--hiplab', required=True, help='read-only HipLab checkout')
    parser.add_argument('--synthesize', action='store_true', help='use free online Edge TTS for missing exact text')
    raise SystemExit(run(parser.parse_args()))
