# Compose the review sheets from tools/human-v2plus/compare.mjs raw PNGs.
#   python3 sheet.py <outdir from compare.mjs> <sheet dir>
import sys, os, json
from PIL import Image, ImageDraw, ImageFont, ImageChops
RAW = os.path.join(sys.argv[1], 'raw'); DST = sys.argv[2]; os.makedirs(DST, exist_ok=True)
BG = (24, 24, 28)
def font(sz):
    for f in ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()
F, FS = font(22), font(17)
def tile(name, W):
    p = os.path.join(RAW, name)
    if not os.path.exists(p): im = Image.new('RGB', (W, W), (60, 0, 0)); return im
    t = Image.open(p).convert('RGBA'); bg = Image.new('RGBA', t.size, BG + (255,)); bg.alpha_composite(t); return bg.convert('RGB').resize((W, W), Image.LANCZOS)
def diff(a, b, W):
    A = Image.open(os.path.join(RAW, a)).convert('RGBA'); B = Image.open(os.path.join(RAW, b)).convert('RGBA')
    d = ImageChops.difference(A, B).convert('L').point(lambda v: 255 if v > 24 else 0)
    base = Image.new('RGBA', A.size, BG + (255,)); base.alpha_composite(A); g = base.convert('L').convert('RGB')
    g = Image.blend(g, Image.new('RGB', g.size, BG), 0.55); red = Image.new('RGB', g.size, (255, 60, 60)); g.paste(red, mask=d)
    return g.resize((W, W), Image.LANCZOS)
def sheet(title, rows, W, out, labels=None):
    cols = max(len(r[1]) for r in rows); H0 = 50; LH = 30
    im = Image.new('RGB', (cols * W, H0 + len(rows) * (W + LH)), BG); d = ImageDraw.Draw(im); d.text((12, 12), title, fill='white', font=F)
    for ri, (lab, tiles) in enumerate(rows):
        y = H0 + ri * (W + LH)
        for ci, (cap, img) in enumerate(tiles):
            im.paste(img, (ci * W, y + LH)); d.text((ci * W + 10, y + 5), f'{cap} · {lab}' if lab else cap, fill='white', font=FS)
    im.save(out, quality=90); print('wrote', out)
M = json.load(open(os.path.join(sys.argv[1], 'metrics.json'))) if os.path.exists(os.path.join(sys.argv[1], 'metrics.json')) else {}
for did, ts in [('triceps-A', ['0.00', '2.10']), ('scapular-B', ['0.40', '1.90']), ('h-squat', ['0.20', '1.20'])]:
    rows = []
    for t in ts:
        tag = f'{did}-t{t}'; W = 560
        if not os.path.exists(os.path.join(RAW, tag + '-v2.png')): continue
        rows.append((f't={float(t):.2f}s', [('training-human-v2', tile(tag + '-v2.png', W)), ('training-human-v2plus', tile(tag + '-v2plus.png', W)),
                                            ('pixels that differ (red)', diff(tag + '-v2.png', tag + '-v2plus.png', W))]))
    if rows: sheet(f'{did}: v2 (left) vs v2plus (right), same spec / solve / camera; right column = changed pixels', rows, 560, os.path.join(DST, f'compare-{did}.jpg'))
G12 = ['deltoids', 'chest', 'abs', 'lats', 'glute-max', 'quadriceps', 'hamstrings', 'obliques', 'scapular', 'triceps', 'rotator-cuff', 'hip-flexors']
W = 300
for view in ['front', 'back']:
    rows = [('', [(g, tile(f'hl-{g}-{view}.png', W)) for g in G12[:6]]), ('', [(g, tile(f'hl-{g}-{view}.png', W)) for g in G12[6:]])]
    sheet(f'v2plus designed muscle regions, 12 groups, {view} (standing, h-squat t=0)', rows, W, os.path.join(DST, f'muscle-highlights-{view}.jpg'))
GX = ['hip-abductors', 'adductors', 'erectors', 'serratus', 'biceps', 'forearms', 'calves', 'traps']
rows = [(v, [(g, tile(f'hlx-{g}-{v}.png', 260)) for g in GX]) for v in ['front', 'back']]
sheet('v2plus: the other groups used by specs', rows, 260, os.path.join(DST, 'muscle-highlights-extra.jpg'))
rows = [('', [('front border close-up (chest, abs, obliques)', tile('hl-zoom-front.png', 640)), ('back border close-up (lats, scapular, glute-max)', tile('hl-zoom-back.png', 640))])]
sheet('v2plus region borders at 1:1 zoom: per-pixel anti-aliased curves, same across tee / shorts', rows, 640, os.path.join(DST, 'muscle-borders-zoom.jpg'))
# hands
rows = []
for did in ['triceps-A', 'scapular-B']:
    for side in ['left', 'right']:
        if os.path.exists(os.path.join(RAW, f'hand-{did}-{side}-v2.png')):
            rows.append((f'{did} {side}', [('v2', tile(f'hand-{did}-{side}-v2.png', 420)), ('v2plus', tile(f'hand-{did}-{side}-v2plus.png', 420))]))
if rows:
    # two pairs per row
    pr = [(rows[i][0] + ' | ' + rows[i + 1][0], rows[i][1] + rows[i + 1][1]) for i in range(0, len(rows) - 1, 2)]
    sheet('hands on the floor (triceps-A) and on the bar (scapular-B): v2 | v2plus', pr, 420, os.path.join(DST, 'hands-floor-bar.jpg'))
P = ['rest', 'open', 'relaxed', 'palm-floor', 'grip-bar', 'band-grip']
if os.path.exists(os.path.join(RAW, 'pose-rest-front.png')):
    rows = [(v + ' view', [(p, tile(f'pose-{p}-{v}.png', 300)) for p in P]) for v in ['front', 'outer', 'inner']]
    sheet('v2plus named hand poses (left hand; rest = the v2 authored hand, unchanged)', rows, 300, os.path.join(DST, 'hand-poses.jpg'))
