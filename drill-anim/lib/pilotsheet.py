# python3 lib/pilotsheet.py <out.png> <font> <ref_dir> '<json [[id, title, cdir, [t1, t2]], ...]>'
# one row per drill: reference | key frame 1 | key frame 2   (cdir = composited frame dir, 30 fps)
import sys, json
from PIL import Image, ImageDraw, ImageFont
OUT, FONT, REF, rows = sys.argv[1], sys.argv[2], sys.argv[3], json.loads(sys.argv[4])
W = 480; H = 40; f = ImageFont.truetype(FONT, 20); fs = ImageFont.truetype(FONT, 16)
S = Image.new('RGB', (W * 3, (W + H) * len(rows)), (18, 18, 20)); d = ImageDraw.Draw(S)
for r, (sid, title, cdir, ts) in enumerate(rows):
    y = r * (W + H)
    tiles = [Image.open(f'{REF}/{sid}.png').convert('RGB')] + [Image.open(f'{cdir}/{round(t * 30):04d}.png').convert('RGB') for t in ts]
    for i, im in enumerate(tiles):
        S.paste(im.resize((W, W), Image.LANCZOS), (i * W, y + H))
        d.text((i * W + 10, y + 10), 'reference' if i == 0 else f't = {ts[i-1]:.2f} s', font=fs, fill=(200, 200, 205))
    d.text((W * 3 - 10, y + 8), f'{sid}  {title}', font=f, fill=(255, 140, 90), anchor='ra')
S.save(OUT); print('saved', OUT)
