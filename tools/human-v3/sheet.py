#!/usr/bin/env python3
"""Compose the training-human-v3 prototype sheets from compare.mjs raw passes.
usage: python3 tools/human-v3/sheet.py <outdir-with-raw> <dest-dir>
Writes JPGs: compare-<drill>.jpg (legacy | v3 per key time), muscle-ids.jpg, muscle-highlights.jpg, skinning-lbs-vs-dqs.jpg"""
import sys, os, glob, json
from PIL import Image, ImageDraw, ImageFont
SRC, DST = sys.argv[1], sys.argv[2]; RAW = os.path.join(SRC, 'raw'); os.makedirs(DST, exist_ok=True)
FONT = next((f for f in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'] if os.path.exists(f)), None)
font = lambda s: ImageFont.truetype(FONT, s) if FONT else ImageFont.load_default()
def bg(w, h):
    im = Image.new('RGB', (w, h), (20, 20, 22)); d = ImageDraw.Draw(im)
    for y in range(h): c = int(30 - 14 * abs(y / h - 0.45)); d.line([(0, y), (w, y)], fill=(c, c, c + 2))
    return im
def tile(path, size, label=None):
    im = bg(size, size); p = Image.open(path).convert('RGBA').resize((size, size), Image.LANCZOS); im.paste(p, (0, 0), p)
    if label: d = ImageDraw.Draw(im); d.rectangle([0, 0, size, 34], fill=(0, 0, 0)); d.text((10, 5), label, font=font(20), fill=(235, 235, 235))
    return im
def grid(tiles, cols, title, out, size):
    rows = (len(tiles) + cols - 1) // cols; W = cols * size; H = rows * size + 50
    im = Image.new('RGB', (W, H), (12, 12, 14)); d = ImageDraw.Draw(im); d.text((12, 10), title, font=font(26), fill=(255, 255, 255))
    for i, t in enumerate(tiles): im.paste(t, ((i % cols) * size, 50 + (i // cols) * size))
    im.save(out, quality=88); print(out, im.size)
met = json.load(open(os.path.join(SRC, 'metrics.json'))) if os.path.exists(os.path.join(SRC, 'metrics.json')) else {}
drills = sorted({os.path.basename(f).rsplit('-t', 1)[0] for f in glob.glob(RAW + '/*-old.png')})
for dr in drills:
    ts = sorted({os.path.basename(f)[len(dr) + 2:].split('-')[0] for f in glob.glob(f'{RAW}/{dr}-t*-old.png')}, key=float)
    tiles = []
    for t in ts:
        m = met.get(f'{dr}-t{t}', {}).get('v3', {})
        con = ' '.join(f"{k}:{v.get('errMm')}mm" for k, v in m.items() if isinstance(v, dict) and v.get('contact'))
        tiles += [tile(f'{RAW}/{dr}-t{t}-old.png', 560, f'legacy v2 · t={t}s'), tile(f'{RAW}/{dr}-t{t}-v3.png', 560, f'v3 proto · t={t}s')]
    grid(tiles, 2, f'{dr}: legacy training-human-v2 (left) vs training-human-v3 prototype (right) - same spec, same solve, same camera', f'{DST}/compare-{dr}.jpg', 560)
views = ['front', 'back', 'side']
if os.path.exists(f'{RAW}/ids-front.png'):
    grid([tile(f'{RAW}/ids-{v}.png', 520, f'all muscle IDs · {v}') for v in views], 3, 'v3 per-vertex muscle IDs (BodyParts3D projection; one colour per ID, grey = no muscle / garment-only)', f'{DST}/muscle-ids.jpg', 520)
    gs = ['deltoids', 'chest', 'abs', 'lats', 'glute-max', 'quadriceps', 'hamstrings', 'obliques', 'scapular', 'triceps', 'rotator-cuff', 'hip-flexors']
    t = []
    for g in gs:
        v = 'back' if g in ('lats', 'glute-max', 'hamstrings', 'scapular', 'triceps', 'rotator-cuff') else 'front'
        t.append(tile(f'{RAW}/hl-{g}-{v}.png', 400, f'{g} · {v}'))
    grid(t, 6, 'v3 highlight from muscle IDs (spec group ids -> v3 IDs; deep groups use _MUSCLE_DEEP)', f'{DST}/muscle-highlights.jpg', 400)
sk = sorted({os.path.basename(f)[5:].rsplit('-', 1)[0] for f in glob.glob(RAW + '/skin-*-lbs.png')})
if sk:
    t = []
    for s in sk: t += [tile(f'{RAW}/skin-{s}-{m}.png', 420, f'{s} · {lab}') for m, lab in (('lbs', 'LBS'), ('hybrid', 'DQS hinge-only'), ('dqs', 'DQS everywhere'))]
    grid(t, 3, 'v3 skinning: linear blend | dual quaternion on elbow/knee/wrist/ankle only (proposed) | dual quaternion everywhere', f'{DST}/skinning-lbs-vs-dqs.jpg', 420)
