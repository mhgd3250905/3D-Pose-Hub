#!/usr/bin/env python3
"""V4 batch preview: one row per action, one column per skin (dark theme peak thumbnail).
python tools/v4/batch-sheet.py --root <run-dir> --out <file.jpg> --ids a,b,c"""
import argparse, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SKINS = ['realistic', 'tech-white', 'neon-night', 'neon-night-b', 'hologram']
CELL, LABEL, HEAD = 200, 230, 34


def font(size):
    for p in ['C:/Windows/Fonts/msyh.ttc', 'C:/Windows/Fonts/simhei.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', required=True); ap.add_argument('--out', required=True); ap.add_argument('--ids', required=True)
    a = ap.parse_args()
    root, ids = Path(a.root), [i for i in a.ids.split(',') if i]
    F, Fs = font(18), font(14)
    im = Image.new('RGB', (LABEL + CELL * len(SKINS), HEAD + CELL * len(ids)), (250, 250, 250))
    d = ImageDraw.Draw(im)
    for c, s in enumerate(SKINS):
        d.text((LABEL + c * CELL + 6, 8), s, fill=(0, 0, 0), font=F)
    for r, i in enumerate(ids):
        y = HEAD + r * CELL
        pkg = root / 'packages' / i / 'package.json'
        ok = pkg.exists()
        d.text((6, y + 8), i, fill=(0, 0, 0) if ok else (200, 0, 0), font=F)
        if not ok:
            d.text((6, y + 34), 'FAILED / missing', fill=(200, 0, 0), font=Fs)
            continue
        meta = json.loads(pkg.read_text(encoding='utf-8'))
        d.text((6, y + 34), f"{meta.get('durationSeconds')} s  {meta.get('framesUsed')} frames", fill=(80, 80, 80), font=Fs)
        for c, s in enumerate(SKINS):
            p = root / 'packages' / i / s / 'dark' / 'thumbnail.240.jpg'
            if p.exists():
                im.paste(Image.open(p).convert('RGB').resize((CELL - 4, CELL - 4)), (LABEL + c * CELL + 2, y + 2))
            else:
                d.text((LABEL + c * CELL + 6, y + 8), 'missing', fill=(200, 0, 0), font=Fs)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    im.save(a.out, quality=82)


if __name__ == '__main__':
    main()
