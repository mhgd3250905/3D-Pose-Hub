#!/usr/bin/env python3
"""V5 ground-shadow check on rendered masters (2026-11-17).
  python tools/v5/check-shadow.py --root <run-dir> --ids a,b,c [--json out.json]
Per action, over every master frame (masters/<id>/v5-toon/body/m-NNNN.png) and the per-frame records render-masters-v5.mjs wrote
into layer-manifest.json:
  - pixel: no shadow pixel on the 1-px border of the master canvas. Shadow pixels = 0 < alpha <= 64 (the shadow is drawn at
    opacity 0.14 = alpha ~36) with the pixel 3 px further in also 0 < alpha <= 64 (so the anti-aliased rim of an opaque body or prop
    is not counted). Opaque body/prop pixels on the border are reported (info only: the recipe camera is the V4 one, e.g. the mat
    corner of h-forearm-plank touches the right edge in V4 too);
  - analytic: the ground-shadow box (caster vertices projected along the V5 sun) stays >= 4 px inside the canvas, and casters +
    shadow stay inside the V5 sun's ortho shadow frustum (lightHalfNeeded <= lightHalf - 0.1 m). Exception (2026-11-17, erectors-A):
    a frame whose record carries shadowEdge (the render guard found the shadow leaving the canvas only on an opaque prop that leaves
    it too, e.g. the exercise mat) passes when, re-read from the master, the border over each recorded span is opaque (alpha > 64);
    such frames are counted in shadowUnderPropEdgeFrames;
  - only the V5 sun casts (the hub key light's shadow is muted).
Exit 0 = all pass, 2 = a failure (printed per action)."""
import argparse, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('--root', required=True); ap.add_argument('--ids', required=True); ap.add_argument('--json')
a = ap.parse_args()
root = Path(a.root); res = []; bad = False
for aid in a.ids.split(','):
    man = json.loads((root / 'masters' / aid / 'layer-manifest.json').read_text())
    size = man['size']; edge_px = 0; edge_frames = 0; opaque_px = 0; opaque_frames = 0; gap = size; box = [size, size, 0, 0]
    under_frames = 0; under_bad = 0; mg = 4 * size / 1080
    for f in man['frames']:
        rec = f['files']['v5-toon/body']
        al = np.asarray(Image.open(root / rec['path']).getchannel('A'))
        border = np.concatenate([al[0], al[-1], al[:, 0], al[:, -1]])
        inner = np.concatenate([al[3], al[-4], al[:, 3], al[:, -4]])
        sh = lambda x: (x > 0) & (x <= 64)
        n = int((sh(border) & sh(inner)).sum()); edge_px += n; edge_frames += n > 0
        o = int((border > 64).sum()); opaque_px += o; opaque_frames += o > 0
        se = f['v5'].get('shadowEdge')
        if se:
            under_frames += 1
            lines = {'left': al[:, 0], 'right': al[:, -1], 'top': al[0], 'bottom': al[-1]}
            for k, e in se.items():
                i0, i1 = max(0, round(e['span'][0])), min(size - 1, round(e['span'][1]))
                under_bad += not (i0 <= i1 and bool((lines[k][i0:i1 + 1] > 64).all()))
        ys, xs = np.nonzero(al)
        if len(xs):
            b = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
            box = [min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3])]
            gap = min(gap, b[0], b[1], size - b[2], size - b[3])
    v = [f['v5'] for f in man['frames']]
    g = lambda x: min(x['shadowBox'][0], x['shadowBox'][1], size - x['shadowBox'][2], size - x['shadowBox'][3])
    sh_gap = min(g(x) for x in v); free_gap = min([g(x) for x in v if not x.get('shadowEdge')] or [size])
    lh = max(x['lightHalfNeeded'] for x in v); half = v[0]['lightHalf']
    muted = man['v5']['setup'].get('mutedShadowLights')
    r = {'id': aid, 'frames': len(v), 'size': size, 'shadowEdgePixels': edge_px, 'shadowEdgeFrames': edge_frames, 'opaqueEdgeFrames(info)': opaque_frames, 'alphaBox': box,
         'pixelMinGapPx': gap, 'shadowMinGapPx': round(sh_gap, 1), 'shadowUnderPropEdgeFrames': under_frames, 'shadowUnderPropEdgeBad': under_bad, 'lightHalfNeeded': lh, 'lightHalf': half, 'mutedShadowLights': muted}
    r['ok'] = edge_px == 0 and free_gap >= mg and under_bad == 0 and lh <= half - 0.1 and bool(muted)
    bad |= not r['ok']; res.append(r); print(json.dumps(r))
if a.json:
    Path(a.json).write_text(json.dumps(res, indent=1) + '\n')
sys.exit(2 if bad else 0)
