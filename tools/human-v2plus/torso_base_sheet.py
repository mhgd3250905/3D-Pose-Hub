# Compose the base-mesh torso review sheets from tools/human-v2plus/torso-base.mjs raw PNGs.
#   python3 torso_base_sheet.py <outdir from torso-base.mjs> <sheet dir>
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
A, B = ('compression (current PR)', 'compression'), ('base-mesh torso', 'torso')
for did, ts in [('triceps-A', ['0.00', '2.10']), ('scapular-B', ['0.40', '1.90']), ('h-squat', ['0.20', '1.20'])]:
    rows = [(f't={float(t):.2f}s', [(c, tile(f'{did}-t{t}-{k}.png', 600)) for c, k in (A, B)]) for t in ts if os.path.exists(os.path.join(RAW, f'{did}-t{t}-compression.png'))]
    if rows: sheet(f'{did}: compression outfit (left) vs base-mesh torso (right), same spec / solve / camera', rows, 600, os.path.join(DST, f'compare-{did}.jpg'))
for hl in ['plain', 'hl']:
    row = [(f'{v} · {c}', tile(f'stand-{v}-{hl}-{k}.png', 420)) for v in ['front', 'side', 'back'] for c, k in (A, B)]
    t = 'standing h-squat t=0, ' + ('highlights on (front: chest/abs/deltoids/quads; side: deltoids/obliques/glutes/quads; back: lats/scapular/glutes/hamstrings/triceps)' if hl == 'hl' else 'no highlight')
    sheet(t, [('', row)], 420, os.path.join(DST, f'standing-{hl}.jpg'))
C = ['neck', 'neck-back', 'shoulder', 'armpit', 'arm-weld', 'arm-weld-front', 'waist', 'hip-back']
tl = [[(f'{c} · {cap}', tile(f'close-{c}-{k}.png', 440)) for cap, k in (A, B)] for c in C]
pr = [('', tl[i] + tl[i + 1]) for i in range(0, len(tl), 2)]
sheet('standing close-ups: neck seam front/back, shoulder, armpit, arm weld ring back/front (no highlight), waist, hip/glutes', pr, 440, os.path.join(DST, 'closeups-standing.jpg'))
row = [(f'{c} · {cap}', tile(f'squatclose-{c}-{k}.png', 440)) for c in ['hip', 'hip-back', 'shoulder'] for cap, k in (A, B)]
sheet('deep squat (h-squat t=1.20) close-ups: hip crease front, hip/glute back, shoulder', [('', row)], 440, os.path.join(DST, 'closeups-squat.jpg'))
row = [(f'{c} · {cap}', tile(f'hangclose-{c}-{k}.png', 440)) for c in ['armpit-front', 'armpit-back', 'shoulders-front'] for cap, k in (A, B)]
sheet('dead hang (scapular-B t=0.40) close-ups, arms overhead: armpit/shoulder front, back, both shoulders', [('', row)], 440, os.path.join(DST, 'closeups-hang.jpg'))
