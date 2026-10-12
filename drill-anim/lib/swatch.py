# python3 lib/swatch.py <out.png> <font.ttc> '<json [[label, frame.png], ...]>'  -> side-by-side theme comparison sheet
import sys, json, os
from PIL import Image, ImageDraw, ImageFont
OUT, FONT, tiles = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
W = 640; H = 76
f = ImageFont.truetype(FONT, 22); fs = ImageFont.truetype(FONT, 16)
S = Image.new('RGB', (W * len(tiles), W + H), (18, 18, 20)); d = ImageDraw.Draw(S)
for i, (label, png) in enumerate(tiles):
    S.paste(Image.open(png).convert('RGB').resize((W, W), Image.LANCZOS), (i * W, H))
    name, sub = label, ''
    if label.endswith('.json') and os.path.exists(label):
        name = os.path.basename(label); sub = json.load(open(label)).get('name', '').split('(')[-1].rstrip(')')
    d.text((i * W + 12, 10), name, font=f, fill=(220, 220, 225)); d.text((i * W + 12, 44), sub[:70], font=fs, fill=(160, 160, 166))
S.save(OUT); print('saved', OUT)
