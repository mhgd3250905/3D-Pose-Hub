# contact_sheet.py <rows.json> <out.png> : rows = [{id, name, title, lines:[...], images:[paths]}]; low-res evidence sheet (one row per issue).
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
FONT = '/workspace/work/fonts/NotoSansSC-Regular.otf'
rows = json.load(open(sys.argv[1])); out = sys.argv[2]
TH = 200; LW = 330; PAD = 6
f1 = ImageFont.truetype(FONT, 17); f2 = ImageFont.truetype(FONT, 13)
def load(p):
    im = Image.open(p).convert('RGBA'); bg = Image.new('RGBA', im.size, (232, 232, 232, 255)); bg.alpha_composite(im)
    im = bg.convert('RGB'); s = TH / im.height; return im.resize((max(1, int(im.width * s)), TH))
built = []
for r in rows:
    ims = [load(p) for p in r['images'] if os.path.exists(p)]
    w = LW + sum(i.width + PAD for i in ims); row = Image.new('RGB', (w, TH + 2 * PAD), 'white'); d = ImageDraw.Draw(row)
    d.text((PAD, PAD), r['title'], fill=(160, 20, 20) if r.get('sev') == 1 else (170, 100, 0), font=f1)
    y = PAD + 24
    for ln in r['lines']:
        # wrap at ~22 CJK chars
        while ln:
            d.text((PAD, y), ln[:24], fill=(30, 30, 30), font=f2); ln = ln[24:]; y += 17
            if y > TH: break
    x = LW
    for i, lab in zip(ims, r.get('labels', [''] * len(ims))):
        row.paste(i, (x, PAD)); d.text((x + 3, PAD + TH - 16), lab, fill=(60, 60, 60), font=f2); x += i.width + PAD
    built.append(row)
W = max(b.width for b in built); H = sum(b.height + 2 for b in built)
sheet = Image.new('RGB', (W, H), (200, 200, 200)); y = 0
for b in built: sheet.paste(b, (0, y)); y += b.height + 2
sheet.save(out, optimize=True); print(out, sheet.size)
