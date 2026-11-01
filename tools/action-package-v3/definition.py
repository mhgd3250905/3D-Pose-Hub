"""Definition layer for a v3 action package: action text + recipe + rendered masters -> definition.json.

    python3 tools/action-package-v3/definition.py --root <prod root> --id <action>

Nothing is hand-timed: the voice cue points (phase start / peak / end) are read from the highlight
pulse the masters renderer recorded for every frame, so they follow the animation automatically.
Writes <root>/packages/<id>/definition.json (refuses to overwrite a different one).
"""
from __future__ import annotations
import argparse, hashlib, json, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import text as T  # noqa: E402

REPO = HERE.parents[1]
FORMAT = 'pose-hub-action-definition@3'


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def cue_points(manifest: dict) -> dict:
    """start = effort begins (pulse first rises past 25 % of its range), peak = first frame of the max plateau,
    end = pulse falls back below 50 % after the peak. Seconds into the loop; first rep only."""
    fps = manifest['fps']
    loop = [f for f in manifest['frames'] if not f['endpoint']]
    if not loop:
        raise ValueError('no frames in masters')
    pulses = [f['pulse'] for f in loop]
    lo, hi = min(pulses), max(pulses)
    sampled = not manifest['complete']
    if hi - lo < 1e-3:  # static hold: whole clip is the effort
        dur = manifest['durationSeconds']
        return {'start': 0.0, 'peak': round(dur / 2, 3), 'end': round(dur, 3), 'method': 'flat pulse (hold): 0 / mid / end', 'sampled': sampled}
    top = [i for i, p in enumerate(pulses) if p >= hi - 1e-6]
    # first plateau only (first rep); peak = the moment the plateau is reached (the line lands as the effort tops out)
    run = [top[0]]
    for i in top[1:]:
        if i == run[-1] + 1: run.append(i)
        else: break
    pk = run[0]
    st = next((i for i in range(pk + 1) if pulses[i] >= lo + 0.25 * (hi - lo)), 0)
    en = next((i for i in range(run[-1], len(pulses)) if pulses[i] < lo + 0.5 * (hi - lo)), len(pulses) - 1)
    t = lambda i: round(loop[i]['frame'] / fps, 3)
    return {'start': t(st), 'peak': t(pk), 'end': t(en), 'method': 'masters highlight pulse (25 % rise / plateau reached / 50 % fall)', 'sampled': sampled}


def build(root: Path, aid: str) -> dict:
    text = T.load(aid)
    tpath = T.TEXT_DIR / f'{aid}.json'
    mpath = root / 'masters' / aid / 'layer-manifest.json'
    manifest = json.loads(mpath.read_text('utf-8'))
    cues = cue_points(manifest)
    d = {k: text[k] for k in ('name', 'purpose', 'cues', 'commonErrors', 'tags', 'unilateral', 'defaultDose')}
    d['cautions'] = text.get('cautions', [])
    if text['unilateral']: d['startingSide'] = text['startingSide']
    if text.get('training'): d['training'] = text['training']  # app count/timer rhythm (ugk_trainer Rhythm)
    return {
        'format': FORMAT, 'id': aid,
        'text': {'path': str(tpath.relative_to(REPO)), 'sha256': sha(tpath), 'reviewStatus': text['reviewStatus']},
        'recipe': manifest['recipe'], 'productionModel': manifest['productionModel'],
        'definition': d,
        'voiceScript': {
            'name': text['name'], 'primaryCue': next(c['text'] for c in text['cues'] if c['primary']),
            'phase.start': text['phases']['start'], 'phase.peak': text['phases']['peak'], 'phase.end': text['phases']['end']},
        'rhythm': {'durationSeconds': manifest['durationSeconds'], 'fps': manifest['fps'], 'cuePoints': cues,
                   'binding': {'phase.start': 'start', 'phase.peak': 'peak', 'phase.end': 'end'},
                   'playback': 'name + primaryCue before the set; phase lines at their cue points every rep, scheduled to END by the next cue point (skip a line that cannot fit, never cut or overlap)'},
        'review': {'editorial': 'pending' if text['reviewStatus'].startswith('draft') else 'passed'},
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--root', type=Path, required=True)
    ap.add_argument('--id', required=True)
    a = ap.parse_args(argv)
    root = a.root.resolve()
    out = root / 'packages' / a.id / 'definition.json'
    data = json.dumps(build(root, a.id), ensure_ascii=False, indent=2) + '\n'
    if out.exists():
        if out.read_text('utf-8') == data:
            print(json.dumps({'id': a.id, 'definition': 'unchanged'})); return 0
        raise SystemExit(f'{out} exists with different content; outputs are immutable (new --root)')
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(data, 'utf-8')
    print(json.dumps({'id': a.id, 'definition': str(out.relative_to(root))}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
