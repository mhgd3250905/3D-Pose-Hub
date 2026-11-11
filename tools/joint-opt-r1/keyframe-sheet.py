"""OFF | ON keyframe comparison sheet for one action (joint-opt r1 production trial). No judgement, fixed layout.

python tools/joint-opt-r1/keyframe-sheet.py --on <on root>/masters/<id> --off <off-ref root>/masters/<id> \
    --frames 90,180 --skin realistic --layer body-highlight --background #101013 --out <sheet.jpg> --json <stats.json>

Each row = one frame: OFF full | ON full | OFF zoom | ON zoom. The zoom box is the bounding box of the pixels that
differ (max channel diff > threshold after compositing on the background), padded; with no difference the row
says "identical" and the zoom cells repeat the full frame. Writes per-frame diff statistics to --json.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

PREFIX = {'body': 'm', 'body-highlight': 'h', 'mask': 'k'}


def comp(path: Path, bg):
    im = np.asarray(Image.open(path).convert('RGBA')).astype(np.float32) / 255.0
    a = im[..., 3:4]
    out = im[..., :3] * a + np.array(bg, np.float32)[None, None, :] / 255.0 * (1 - a)
    return (out * 255 + 0.5).clip(0, 255).astype(np.uint8)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--on', type=Path, required=True)
    ap.add_argument('--off', type=Path, required=True)
    ap.add_argument('--frames', required=True)
    ap.add_argument('--skin', default='realistic')
    ap.add_argument('--layer', default='body-highlight')
    ap.add_argument('--background', default='#101013')
    ap.add_argument('--cell', type=int, default=480)
    ap.add_argument('--threshold', type=int, default=8)
    ap.add_argument('--pad', type=int, default=48)
    ap.add_argument('--min-box', type=int, default=256)
    ap.add_argument('--label', default='')
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--json', type=Path, required=True)
    a = ap.parse_args(argv)
    bg = tuple(int(a.background[i:i + 2], 16) for i in (1, 3, 5))
    frames = [int(x) for x in a.frames.split(',')]
    if a.out.exists() or a.json.exists():
        raise SystemExit('output exists: ' + str(a.out))
    C, H = a.cell, 26
    font = ImageFont.load_default()
    sheet = Image.new('RGB', (4 * C, H + len(frames) * (C + H)), bg)
    d = ImageDraw.Draw(sheet)
    d.text((6, 6), f'{a.label}  OFF | ON (shoulder-axilla r2)  skin {a.skin} / {a.layer}  zoom = bbox of changed pixels', fill=(230, 230, 230), font=font)
    stats = []
    for r, f in enumerate(frames):
        name = f'{PREFIX[a.layer]}-{f:04d}.png'
        pf, pn = a.off / a.skin / a.layer / name, a.on / a.skin / a.layer / name
        if not pf.exists() or not pn.exists():
            raise SystemExit(f'missing frame {f}: {pf if not pf.exists() else pn}')
        A, B = comp(pf, bg), comp(pn, bg)
        if A.shape != B.shape:
            raise SystemExit(f'size mismatch at frame {f}')
        diff = np.abs(A.astype(np.int16) - B.astype(np.int16)).max(axis=2)
        mask = diff > a.threshold
        n = int(mask.sum())
        h, w = mask.shape
        if n:
            ys, xs = np.nonzero(mask)
            x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
            side = max(x1 - x0, y1 - y0) + 2 * a.pad
            side = min(max(side, a.min_box), min(w, h))
            cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
            bx = int(min(max(cx - side // 2, 0), w - side)); by = int(min(max(cy - side // 2, 0), h - side))
            box = (bx, by, bx + side, by + side)
        else:
            box = (0, 0, w, h)
        y = H + r * (C + H)
        cells = [(A, None), (B, None), (A, box), (B, box)]
        for c, (img, bx) in enumerate(cells):
            im = Image.fromarray(img)
            if bx:
                im = im.crop(bx)
            sheet.paste(im.resize((C, C), Image.LANCZOS), (c * C, y + H))
        if n:  # outline of the zoom box on the full cells
            s = C / w
            for c in (0, 1):
                d.rectangle([c * C + box[0] * s, y + H + box[1] * s, c * C + box[2] * s, y + H + box[3] * s], outline=(255, 210, 0), width=2)
        txt = f'frame {f}   changed px (>{a.threshold}) {n}   max diff {int(diff.max())}' + ('   identical' if n == 0 else '')
        d.text((6, y + 6), txt, fill=(230, 230, 230), font=font)
        for c, lab in enumerate(['OFF', 'ON', 'OFF zoom', 'ON zoom']):
            d.text((c * C + 6, y + H + 6), lab, fill=(255, 210, 0), font=font)
        stats.append({'frame': f, 'changedPixels': n, 'maxDiff': int(diff.max()), 'box': list(map(int, box)) if n else None,
                      'offSha256': hashlib.sha256(pf.read_bytes()).hexdigest(), 'onSha256': hashlib.sha256(pn.read_bytes()).hexdigest(),
                      'bytesIdentical': pf.read_bytes() == pn.read_bytes()})
    a.out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(a.out, quality=88)
    a.json.write_text(json.dumps({'format': 'pose-hub-joint-keyframe-sheet@1', 'skin': a.skin, 'layer': a.layer, 'threshold': a.threshold,
                                  'frames': stats, 'sheet': a.out.name}, indent=1) + '\n')
    print(json.dumps({'event': 'sheet', 'out': str(a.out), 'changed': [s['changedPixels'] for s in stats]}))


if __name__ == '__main__':
    main()
