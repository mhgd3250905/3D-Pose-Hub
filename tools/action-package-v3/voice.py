"""Voice layer for a v3 action package: definition.json voiceScript -> processed, audited m4a + voice-manifest.json.

    python3 tools/action-package-v3/voice.py --root <prod root> --id <action>
    python3 tools/action-package-v3/voice.py --root <prod root> --common      # shared vocabulary (once per root)

Same production standard as the V2 pilot (tools/voice-v2): HipLab voices zh-CN-XiaoxiaoNeural +6% /
en-US-JennyNeural +4%, free Edge TTS, edge-trim, one fixed gain to -16 LUFS, limiter, mono AAC 64k 44.1 kHz,
and the HipLab per-clip audit. Raw TTS is cached by sha256(voice|rate|text) under <root>/voice-cache, so a
re-run (or a text that did not change) never calls the network again. A network failure stops this action
with an error (produce.py logs it and moves on); nothing is marked passed that was not measured.
Phase lines are checked against the animation's cue points: a line longer than its gap is flagged
'schedule-early' (consumer starts it early / skips it), never cut.
"""
from __future__ import annotations
import argparse, asyncio, hashlib, json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(REPO / 'tools/voice-v2'))
sys.path.insert(0, '/workspace/work/pylib')
import hiplab_audio as A  # noqa: E402

PROFILES = {'zh': {'voice': 'zh-CN-XiaoxiaoNeural', 'rate': '+6%'}, 'en': {'voice': 'en-US-JennyNeural', 'rate': '+4%'}}
STANDARD = {'lufsTarget': -16, 'lufsTolerance': 1, 'truePeakMaxDbtp': -1, 'codec': 'aac', 'sampleRate': 44100, 'channels': 1,
            'bitrateKbps': 64, 'process': f'hiplab {A.PROCESS_VERSION}'}
ROLES = {'name': 'intro', 'primaryCue': 'intro', 'phase.start': 'phase', 'phase.peak': 'phase', 'phase.end': 'phase'}
NEXT = {'phase.start': ('start', 'peak'), 'phase.peak': ('peak', 'end'), 'phase.end': ('end', None)}


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


async def tts(text: str, lang: str, raw: Path):
    import edge_tts
    raw.parent.mkdir(parents=True, exist_ok=True)
    tmp = raw.with_suffix('.part')
    await asyncio.wait_for(edge_tts.Communicate(text, PROFILES[lang]['voice'], rate=PROFILES[lang]['rate']).save(str(tmp)), 40)
    if tmp.stat().st_size < 500:
        raise RuntimeError(f'empty TTS for {text!r}')
    tmp.rename(raw)


def make_clip(root: Path, text: str, lang: str, dest: Path) -> dict:
    fp = hashlib.sha256(f"{PROFILES[lang]['voice']}|{PROFILES[lang]['rate']}|{text}".encode()).hexdigest()
    raw = root / 'voice-cache' / f'{fp}.mp3'
    if not raw.exists():
        asyncio.run(tts(text, lang, raw))
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        A._process(raw, dest)
    dur = len(A.decode(dest)) / A.SR
    audit = A.audit_clip(dest, text, lang, round(dur * 1000))
    return {'text': text, 'ref': {'path': str(dest.relative_to(root)), 'sha256': sha(dest), 'bytes': dest.stat().st_size,
                                  'durationSeconds': round(dur, 6)},
            'provenance': {'voice': PROFILES[lang]['voice'], 'rate': PROFILES[lang]['rate'], 'rawSha256': sha(raw), 'ttsFingerprint': fp},
            'audit': {'status': 'failed' if audit['fails'] else 'passed', 'fails': audit['fails'], 'lufs': audit.get('lufs'),
                      'truePeak': audit.get('true_peak'), 'leadMs': audit.get('lead_ms'), 'tailMs': audit.get('tail_ms')}}


def write_once(path: Path, data: dict):
    s = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
    if path.exists() and path.read_text('utf-8') != s:
        raise SystemExit(f'{path} exists with different content; outputs are immutable (new --root)')
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(s, 'utf-8')


def common(root: Path):
    script = json.loads((REPO / 'catalog/voice-v2/script.json').read_text('utf-8'))['common']
    out = {'format': 'pose-hub-voice-common@3', 'standard': STANDARD, 'voiceProfile': PROFILES, 'lines': {}}
    for lang in PROFILES:
        out['lines'][lang] = {k: make_clip(root, v[lang], lang, root / 'voice/common' / lang / f'{k}.m4a') for k, v in script.items()}
    bad = [f'{l}/{k}' for l in out['lines'] for k, c in out['lines'][l].items() if c['audit']['status'] != 'passed']
    out['summary'] = {'clips': sum(len(v) for v in out['lines'].values()), 'auditFailed': bad}
    write_once(root / 'voice/common/manifest.json', out)
    return out['summary']


def action(root: Path, aid: str):
    pdir = root / 'packages' / aid
    d = json.loads((pdir / 'definition.json').read_text('utf-8'))
    cues = d['rhythm']['cuePoints']
    out = {'format': 'pose-hub-voice@3', 'actionId': aid, 'definitionSha256': sha(pdir / 'definition.json'),
           'standard': STANDARD, 'voiceProfile': PROFILES, 'common': 'voice/common/manifest.json',
           'contentReview': 'pending' if d['text']['reviewStatus'].startswith('draft') else 'passed', 'manualListening': 'pending',
           'cuePoints': cues, 'lines': {}}
    for lang in PROFILES:
        L = {}
        for key, val in d['voiceScript'].items():
            c = make_clip(root, val[lang], lang, pdir / 'voice' / lang / f'{key}.m4a')
            c['role'] = ROLES[key]
            if key in NEXT:
                a, b = NEXT[key]
                gap = (cues[b] if b else d['rhythm']['durationSeconds']) - cues[a]
                c['schedule'] = {'at': cues[a], 'gapSeconds': round(gap, 3),
                                 'fit': 'fits' if c['ref']['durationSeconds'] <= gap else 'schedule-early'}
            L[key] = c
        out['lines'][lang] = L
    clips = [c for l in out['lines'].values() for c in l.values()]
    out['summary'] = {'clips': len(clips), 'auditFailed': [c['ref']['path'] for c in clips if c['audit']['status'] != 'passed'],
                      'scheduleEarly': [c['ref']['path'] for c in clips if c.get('schedule', {}).get('fit') == 'schedule-early']}
    out['status'] = 'technical-passed' if not out['summary']['auditFailed'] else 'technical-failed'
    write_once(pdir / 'voice-manifest.json', out)
    return out['summary']


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--root', type=Path, required=True)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--id')
    g.add_argument('--common', action='store_true')
    a = ap.parse_args(argv)
    root = a.root.resolve()
    s = common(root) if a.common else action(root, a.id)
    print(json.dumps({'id': a.id or 'common', **s}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    sys.exit(main())
