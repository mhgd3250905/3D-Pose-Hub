#!/usr/bin/env python3
"""Compose a labelled grid of key-frame PNGs (label = file name).  python3 grid_sheet.py out.jpg [--cols 3] [--px 480] a.png b.png ..."""
import sys, os
from PIL import Image, ImageDraw
a = sys.argv[1:]; out = a.pop(0); cols, px = 3, 480
while a and a[0].startswith('--'):
    k, v = a.pop(0), a.pop(0); cols, px = (int(v), px) if k == '--cols' else (cols, int(v))
lab = 22; rows = (len(a) + cols - 1) // cols; sheet = Image.new('RGB', (cols * px, rows * (px + lab)), (245, 245, 245)); d = ImageDraw.Draw(sheet)
for k, f in enumerate(a):
    im = Image.open(f).convert('RGBA'); im = Image.alpha_composite(Image.new('RGBA', im.size, (236, 236, 232, 255)), im).convert('RGB').resize((px, px), Image.LANCZOS)
    x, y = (k % cols) * px, (k // cols) * (px + lab); sheet.paste(im, (x, y + lab)); d.text((x + 6, y + 5), os.path.basename(f)[:-4], fill=(40, 40, 40))
os.makedirs(os.path.dirname(out) or '.', exist_ok=True); sheet.save(out, quality=88); print(out, sheet.size)
