#!/usr/bin/env python3
"""V5 ground-shadow check on rendered masters (2026-11-17).
  python tools/v5/check-shadow.py --root <run-dir> --ids a,b,c [--json out.json]
Per action, over every master frame (masters/<id>/v5-toon/body/m-NNNN.png) and the per-frame records render-masters-v5.mjs wrote
into layer-manifest.json:
  - pixel: no pixel with alpha > 0 on the 1-px border of the master canvas (shadow or body), and the gap between the alpha bbox
    and the canvas edge;
  - analytic: the ground-shadow box (caster vertices projected along the V5 sun) stays >= 4 px inside the canvas, and casters +
    shadow stay inside the V5 sun's ortho shadow frustum (lightHalfNeeded <= lightHalf - 0.1 m);
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
    size = man['size']; edge_px = 0; edge_frames = 0; gap = size; box = [size, size, 0, 0]
    for f in man['frames']:
        rec = f['files']['v5-toon/body']
        al = np.asarray(Image.open(root / rec['path']).getchannel('A'))
        border = np.concatenate([al[0], al[-1], al[:, 0], al[:, -1]])
        n = int((border > 0).sum()); edge_px += n; edge_frames += n > 0
        ys, xs = np.nonzero(al)
        if len(xs):
            b = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]
            box = [min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3])]
            gap = min(gap, b[0], b[1], size - b[2], size - b[3])
    v = [f['v5'] for f in man['frames']]
    sh_gap = min(min(x['shadowBox'][0], x['shadowBox'][1], size - x['shadowBox'][2], size - x['shadowBox'][3]) for x in v)
    lh = max(x['lightHalfNeeded'] for x in v); half = v[0]['lightHalf']
    muted = man['v5']['setup'].get('mutedShadowLights')
    r = {'id': aid, 'frames': len(v), 'size': size, 'pixelEdgePixels': edge_px, 'pixelEdgeFrames': edge_frames, 'alphaBox': box,
         'pixelMinGapPx': gap, 'shadowMinGapPx': round(sh_gap, 1), 'lightHalfNeeded': lh, 'lightHalf': half, 'mutedShadowLights': muted}
    r['ok'] = edge_px == 0 and sh_gap >= 4 * size / 1080 and lh <= half - 0.1 and bool(muted)
    bad |= not r['ok']; res.append(r); print(json.dumps(r))
if a.json:
    Path(a.json).write_text(json.dumps(res, indent=1) + '\n')
sys.exit(2 if bad else 0)
