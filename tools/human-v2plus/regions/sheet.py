#!/usr/bin/env python3
"""Compose the baked-regions draft sheet: front plain | back plain | front highlight | back highlight (+ optional close-ups)."""
import sys, os, glob
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
names = ['stand-front-plain', 'stand-back-plain', 'stand-front-hl', 'stand-back-hl'] + sorted(os.path.basename(f)[:-4] for f in glob.glob(os.path.join(src, 'raw', 'close-*.png')))
def load(n):
    im = Image.open(os.path.join(src, 'raw', n + '.png')).convert('RGBA'); bg = Image.new('RGBA', im.size, (236, 236, 232, 255)); return Image.alpha_composite(bg, im).convert('RGB')
ims = [load(n) for n in names]
h = 520; ims = [im.resize((round(im.width * h / im.height), h), Image.LANCZOS) for im in ims]
W = sum(im.width for im in ims); sheet = Image.new('RGB', (W, h + 22), (245, 245, 245)); d = ImageDraw.Draw(sheet); x = 0
for n, im in zip(names, ims): sheet.paste(im, (x, 22)); d.text((x + 6, 5), n, fill=(40, 40, 40)); x += im.width
os.makedirs(os.path.dirname(out), exist_ok=True); sheet.save(out, quality=88); print(out, sheet.size)
