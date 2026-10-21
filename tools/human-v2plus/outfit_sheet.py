# Compose the compression-outfit review sheets from tools/human-v2plus/outfit.mjs raw PNGs.
#   python3 outfit_sheet.py <outdir from outfit.mjs> <sheet dir>
import sys, os
from PIL import Image, ImageDraw, ImageFont
RAW = os.path.join(sys.argv[1], 'raw'); DST = sys.argv[2]; os.makedirs(DST, exist_ok=True)
BG = (24, 24, 28)
def font(sz):
    f = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
    return ImageFont.truetype(f, sz) if os.path.exists(f) else ImageFont.load_default()
F, FS = font(22), font(17)
def tile(name, W):
    p = os.path.join(RAW, name)
    if not os.path.exists(p): return Image.new('RGB', (W, W), (60, 0, 0))
    t = Image.open(p).convert('RGBA'); bg = Image.new('RGBA', t.size, BG + (255,)); bg.alpha_composite(t); return bg.convert('RGB').resize((W, W), Image.LANCZOS)
def sheet(title, rows, W, out):
    cols = max(len(r[1]) for r in rows); H0 = 50; LH = 30
    im = Image.new('RGB', (cols * W, H0 + len(rows) * (W + LH)), BG); d = ImageDraw.Draw(im); d.text((12, 12), title, fill='white', font=F)
    for ri, (lab, tiles) in enumerate(rows):
        y = H0 + ri * (W + LH)
        for ci, (cap, img) in enumerate(tiles):
            im.paste(img, (ci * W, y + LH)); d.text((ci * W + 10, y + 5), f'{cap} · {lab}' if lab else cap, fill='white', font=FS)
    im.save(out, quality=90); print('wrote', out)
for did, ts in [('triceps-A', ['0.00', '2.10']), ('scapular-B', ['0.40', '1.90']), ('h-squat', ['0.20', '1.20'])]:
    rows = [(f't={float(t):.2f}s', [('v2plus current clothes', tile(f'{did}-t{t}-clothes.png', 600)), ('v2plus compression outfit', tile(f'{did}-t{t}-compression.png', 600))])
            for t in ts if os.path.exists(os.path.join(RAW, f'{did}-t{t}-clothes.png'))]
    if rows: sheet(f'{did}: current clothes (left) vs compression outfit (right), same spec / solve / camera', rows, 600, os.path.join(DST, f'compare-{did}.jpg'))
for hl in ['plain', 'hl']:
    rows = [(v, [('current clothes', tile(f'stand-{v}-{hl}-clothes.png', 420)), ('compression', tile(f'stand-{v}-{hl}-compression.png', 420))]) for v in ['front', 'side', 'back']]
    # one row: front pair | side pair | back pair
    row = [(f'{v} · {c}', t) for v, pair in rows for c, t in pair]
    t = 'standing h-squat t=0, ' + ('highlights on (front: chest/abs/deltoids/quads; side: deltoids/obliques/glutes/quads; back: lats/scapular/glutes/hamstrings/triceps)' if hl == 'hl' else 'no highlight')
    sheet(t, [('', row)], 420, os.path.join(DST, f'standing-{hl}.jpg'))
C = ['waist', 'waist-back', 'cuff', 'thigh', 'collar']
rows = [(c, [('current clothes', tile(f'close-{c}-clothes.png', 440)), ('compression', tile(f'close-{c}-compression.png', 440))]) for c in C]
pr = [(rows[i][0] + (' | ' + rows[i + 1][0] if i + 1 < len(rows) else ''), rows[i][1] + (rows[i + 1][1] if i + 1 < len(rows) else [])) for i in range(0, len(rows), 2)]
sheet('close-ups: waist hem front/back, sleeve cuff, shorts hem / thigh, V-neck collar (highlights on to show continuity)', pr, 440, os.path.join(DST, 'closeups.jpg'))
