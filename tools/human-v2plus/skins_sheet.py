# skins (M9) sheet: composite each transparent PNG (skins.mjs) over its skin's suggested background (radial centre -> edge), label, grid.
#   python3 tools/human-v2plus/skins_sheet.py <dir> <out.jpg>
import sys, json, os
from PIL import Image, ImageDraw, ImageFont
D, OUT = sys.argv[1], sys.argv[2]; M = json.load(open(os.path.join(D, 'skins.json')))
SK = list(M['skins'].keys()); ROWS = M['rows']; THEME_BG = {'centre': [60, 58, 60], 'edge': [22, 22, 25]}
def bg(sz, b):
    import math; im = Image.new('RGB', (sz, sz)); px = im.load(); c, e = b['centre'], b['edge']
    for y in range(sz):
        for x in range(sz):
            r = min(1.0, math.hypot(x - sz / 2, y - sz * 0.45) / (sz * 0.72)); px[x, y] = tuple(int(c[i] + (e[i] - c[i]) * r * r) for i in range(3))
    return im
tiles = []
for rk in ROWS:
    row = []
    for sk in SK:
        f = os.path.join(D, f'{rk}-{sk}.png')
        if not os.path.exists(f): continue
        fg = Image.open(f).convert('RGBA'); sz = fg.size[0]; im = bg(sz, M['skins'][sk]['bg'] or THEME_BG).convert('RGBA'); im.alpha_composite(fg); row.append((sk, im.convert('RGB')))
    tiles.append(row)
sz = tiles[0][0][1].size[0]; H = 26; W = len(tiles[0]) * sz
sheet = Image.new('RGB', (W, len(tiles) * sz + H), (18, 18, 20)); d = ImageDraw.Draw(sheet)
try: font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
except Exception: font = ImageFont.load_default()
for j, (sk, _) in enumerate(tiles[0]): d.text((j * sz + 8, 4), sk, fill=(235, 235, 235), font=font)
for i, row in enumerate(tiles):
    for j, (sk, im) in enumerate(row): sheet.paste(im, (j * sz, H + i * sz))
sheet.save(OUT, quality=88); print(OUT, sheet.size)
