#!/usr/bin/env python3
"""给 r2-v3 里缺语音的动作补语音（voice fill r1）。

    python3 tools/app-pack/voice_fill_r1.py --root <voice root> --catalog <r2-v3 catalog.json> --ids a,b,...

与正式生产同一套：definition.py 的 voiceScript（文案取 catalog/production/v3-text/<id>.json）+ voice.py
（zh-CN-XiaoxiaoNeural +6% / en-US-JennyNeural +4%、-16 LUFS、限幅、单声道 AAC 64k 44.1k、HipLab 逐句检查）。
本机没有 masters，所以 cue points 用 spec_pulse.mjs 按 engine.js 的 pulseAt 逐帧算出脉冲（与 masters 记录的
pulse 逐帧相同，已用 12 个样例 masters 核对），再走 definition.cue_points 同一算法。
产物：<root>/packages/<id>/{definition.json, voice-manifest.json, voice/{zh,en}/*.m4a}。已存在的不覆盖。
"""
import argparse, hashlib, json, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(REPO / 'tools/action-package-v3'))
sys.path.insert(0, str(HERE))
import definition as D  # noqa: E402
import text as T  # noqa: E402
import voice as V  # noqa: E402
from build_r2_v3 import recipe_path  # noqa: E402


# 单词句 TTS 收尾太急（h-supine-cactus-chest en「Breathe」：尾部静音 31 ms < 40，r2-v1 起就因此检查失败）。
# 只换合成输入（加省略号，读音与时长不变、尾部自然留白），manifest 里的 text 仍是原文；记在 provenance.ttsInput。
TTS_INPUT = {('en', 'Breathe'): 'Breathe\u2026'}
_make_clip = V.make_clip


def _make_clip_tts_input(root, text, lang, dest):
    t2 = TTS_INPUT.get((lang, text))
    if not t2: return _make_clip(root, text, lang, dest)
    c = _make_clip(root, t2, lang, dest)
    c['text'] = text; c['provenance']['ttsInput'] = t2
    return c


V.make_clip = _make_clip_tts_input


def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


def definition_for(root: Path, aid: str, act: dict) -> Path:
    pdir = root / 'packages' / aid
    out = pdir / 'definition.json'
    if out.exists(): return out
    rp = recipe_path(aid); rec = json.load(open(REPO / rp, encoding='utf-8'))
    spec = rec['spec']
    pulse = json.loads(subprocess.check_output(['node', str(HERE / 'spec_pulse.mjs'), '--specs', spec,
                                                '--fps', str(act['rhythm']['fps'])], cwd=REPO))[spec]
    if abs(pulse['durationSeconds'] - act['rhythm']['durationSeconds']) > 1e-6:
        raise SystemExit(f'{aid}: spec 时长 {pulse["durationSeconds"]} ≠ 目录 {act["rhythm"]["durationSeconds"]}')
    cues = D.cue_points(pulse)
    cues['method'] += ' — computed from spec pulse track (spec_pulse.mjs), masters not on this machine'
    text = T.load(aid); tpath = T.TEXT_DIR / f'{aid}.json'
    d = {k: text[k] for k in ('name', 'purpose', 'cues', 'commonErrors', 'tags', 'unilateral', 'defaultDose')}
    d['cautions'] = text.get('cautions', [])
    if text['unilateral']: d['startingSide'] = text['startingSide']
    if text.get('training'): d['training'] = text['training']
    doc = {
        'format': D.FORMAT, 'id': aid,
        'text': {'path': str(tpath.relative_to(REPO)), 'sha256': sha(tpath), 'reviewStatus': text['reviewStatus']},
        'recipe': {'path': rp, 'sha256': sha(REPO / rp), 'spec': spec, 'specSha256Lf': rec.get('specSha256Lf')},
        'productionModel': act.get('source', {}).get('model'),
        'definition': d,
        'voiceScript': {
            'name': text['name'], 'primaryCue': next(c['text'] for c in text['cues'] if c['primary']),
            'phase.start': text['phases']['start'], 'phase.peak': text['phases']['peak'], 'phase.end': text['phases']['end']},
        'rhythm': {'durationSeconds': pulse['durationSeconds'], 'fps': pulse['fps'], 'cuePoints': cues,
                   'binding': {'phase.start': 'start', 'phase.peak': 'peak', 'phase.end': 'end'},
                   'playback': 'name + primaryCue before the set; phase lines at their cue points every rep, scheduled to END by the next cue point (skip a line that cannot fit, never cut or overlap)'},
        'review': {'editorial': 'pending' if text['reviewStatus'].startswith('draft') else 'passed'},
    }
    V.write_once(out, doc)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', type=Path, required=True); ap.add_argument('--catalog', required=True)
    ap.add_argument('--ids', required=True)
    a = ap.parse_args(); root = a.root.resolve()
    acts = {x['id']: x for x in json.load(open(a.catalog, encoding='utf-8'))['actions']}
    rc = 0
    for aid in a.ids.split(','):
        try:
            definition_for(root, aid, acts[aid])
            if not (root / 'packages' / aid / 'voice-manifest.json').exists():
                s = V.action(root, aid)
            else:
                m = json.load(open(root / 'packages' / aid / 'voice-manifest.json', encoding='utf-8')); s = m['summary']
            m = json.load(open(root / 'packages' / aid / 'voice-manifest.json', encoding='utf-8'))
            print(json.dumps({'id': aid, 'status': m['status'], **s}, ensure_ascii=False), flush=True)
            if m['status'] != 'technical-passed': rc = 1
        except Exception as e:
            print(json.dumps({'id': aid, 'error': str(e)[:400]}, ensure_ascii=False), flush=True); rc = 1
    return rc


if __name__ == '__main__': sys.exit(main())
