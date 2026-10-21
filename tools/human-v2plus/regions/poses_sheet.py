#!/usr/bin/env python3
"""Compose the baked-regions pose check sheet from regions-poses.mjs output: one row per pose (whole figure / close-up / other side)."""
import sys, os, glob
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
files = sorted(glob.glob(os.path.join(src, 'raw', '*-t*.png')))
rows = {}
for f in files: n = os.path.basename(f)[:-4]; rows.setdefault(n.rsplit('-', 1)[0], []).append(n)
h = 480; lab = 22
def load(n):
    im = Image.open(os.path.join(src, 'raw', n + '.png')).convert('RGBA'); bg = Image.new('RGBA', im.size, (236, 236, 232, 255))
    im = Image.alpha_composite(bg, im).convert('RGB'); return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)
R = [[(n, load(n)) for n in ns] for ns in rows.values()]
W = max(sum(im.width for _, im in r) for r in R); sheet = Image.new('RGB', (W, len(R) * (h + lab)), (245, 245, 245)); d = ImageDraw.Draw(sheet)
for i, r in enumerate(R):
    x = 0
    for n, im in r: sheet.paste(im, (x, i * (h + lab) + lab)); d.text((x + 6, i * (h + lab) + 5), n, fill=(40, 40, 40)); x += im.width
os.makedirs(os.path.dirname(out), exist_ok=True); sheet.save(out, quality=88); print(out, sheet.size)
