#!/usr/bin/env python3
"""V5 batch preview: one row per action; columns = light start / peak / end keyframes + dark cover (v5-toon skin).
python tools/v5/batch-sheet.py --root <run-dir> --out <file.jpg> --ids a,b,c"""
import argparse, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SKIN = 'v5-toon'
COLS = [('light', 'start.720.png', 'start'), ('light', 'peak.720.png', 'peak'), ('light', 'end.720.png', 'end'), ('dark', 'cover.720.jpg', 'dark cover')]
CELL, LABEL, HEAD = 200, 230, 34


def font(size):
    for p in ['C:/Windows/Fonts/msyh.ttc', 'C:/Windows/Fonts/simhei.ttf', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
              '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
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
    im = Image.new('RGB', (LABEL + CELL * len(COLS), HEAD + CELL * len(ids)), (250, 250, 250))
    d = ImageDraw.Draw(im)
    for c, (_, _, lab) in enumerate(COLS):
        d.text((LABEL + c * CELL + 6, 8), lab, fill=(0, 0, 0), font=F)
    for r, i in enumerate(ids):
        y = HEAD + r * CELL
        pkg = root / 'packages' / i / 'package.json'
        ok = pkg.exists()
        d.text((6, y + 8), i, fill=(0, 0, 0) if ok else (200, 0, 0), font=F)
        if not ok:
            d.text((6, y + 34), 'FAILED / missing', fill=(200, 0, 0), font=Fs)
            continue
        raw = pkg.read_bytes()
        try:
            txt = raw.decode('utf-8')
        except UnicodeDecodeError:
            txt = raw.decode('gbk', errors='replace')  # compose.py writes locale encoding on Windows
        meta = json.loads(txt)
        d.text((6, y + 34), f"{meta.get('durationSeconds')} s  {meta.get('framesUsed')} frames", fill=(80, 80, 80), font=Fs)
        k = meta.get('keyframes', {})
        d.text((6, y + 56), f"start {k.get('start')} peak {k.get('peak')} end {k.get('end')}", fill=(80, 80, 80), font=Fs)
        for c, (theme, name, _) in enumerate(COLS):
            p = root / 'packages' / i / SKIN / theme / name
            if p.exists():
                im.paste(Image.open(p).convert('RGB').resize((CELL - 4, CELL - 4)), (LABEL + c * CELL + 2, y + 2))
            else:
                d.text((LABEL + c * CELL + 6, y + 8), 'missing', fill=(200, 0, 0), font=Fs)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    im.save(a.out, quality=82)


if __name__ == '__main__':
    main()
