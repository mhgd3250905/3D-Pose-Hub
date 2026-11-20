import sys, numpy as np
sys.path.insert(0, 'fit')
from PIL import Image, ImageDraw, ImageFont
from rig import proj
FT = '/workspace/work/hiplab/assets/fonts/NotoSansSC.ttf'
F = ImageFont.truetype(FT, 26); f2 = ImageFont.truetype(FT, 19)
KS = [25, 27, 28, 29, 30, 32]
ORIG = {25: '脚底斜朝镜头，脚尖朝左下', 27: '脚底朝镜头，脚在脸前方', 28: '脚底朝镜头，脚尖朝左下', 29: '脚底朝镜头，脚尖朝左下', 30: '脚底朝镜头，脚尖朝左下', 32: '脚底朝镜头（斜），脚尖朝左'}
def load(zp):
    Z = np.load(zp); xf = np.load(zp.replace('.npz', '_xf.npz')); B, o = xf['B'], xf['o']
    P = {k[2:]: Z[k] @ B + o for k in Z.files if k.startswith('P_')}; W = {k[2:]: np.einsum('ji,njk->nik', B, Z[k]) for k in Z.files if k.startswith('W_')}
    return P, W
S = {'b': load('fit/r3re.npz'), 'a': load('fit/r5.npz')}
CR = (290, 30, 650, 390); TS = 360
def bb3(k):
    m = None
    for src in ('../r4/vid3d/f-%03d.png', 'vid3d/f-%03d.png'):
        a = np.array(Image.open(src % k).convert('RGB')).astype(int); bg = a[5, 5]; mm = np.abs(a - bg).max(2) > 25; mm[400:] = False
        m = mm if m is None else (m | mm)
    ys, xs = np.nonzero(m); cx = (xs.min() + xs.max()) / 2; cy = (ys.min() + ys.max()) / 2; h = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2 + 20
    x0 = int(min(max(cx - h, 0), 960 - 2 * h)); y0 = int(min(max(cy - h, 0), 540 - 2 * h)); return (x0, y0, x0 + int(2 * h), y0 + int(2 * h))
def sole(tag, k):
    P, W = S[tag]; i = 4 * k; A = P['rightFoot'][i]; Wf = W['rightFoot'][i]
    c = A + Wf @ np.array([0, -0.05, 0.05]); n = Wf @ np.array([0, -1.0, 0]); tc = -c / np.linalg.norm(c); return proj(c) / 2, float(n @ tc), proj(c + n * 0.15) / 2
def lab(d, xy, t, font, fill=(0, 0, 0, 160), col='white'):
    b = d.textbbox(xy, t, font=font); d.rounded_rectangle((b[0] - 6, b[1] - 4, b[2] + 6, b[3] + 6), 6, fill=fill); d.text(xy, t, font=font, fill=col)
cols = ['原片', '修前 r4（原片机位）', '修后 r5（原片机位）', '修前 侧视', '修后 侧视']
Wd = TS * 5; H = 50 + TS * len(KS)
out = Image.new('RGB', (Wd, H), (255, 255, 255)); d0 = ImageDraw.Draw(out)
for c, t in enumerate(cols): d0.text((c * TS + 10, 10), t, font=F, fill='black')
for r, k in enumerate(KS):
    y0 = 50 + r * TS; tiles = []
    o = Image.open('vidsrc/s-%03d.png' % k).convert('RGB').crop(CR)
    tiles.append((o, ORIG[k], None))
    for tag, src in (('b', '../r4/vid3d/f-%03d.png'), ('a', 'vid3d/f-%03d.png')):
        im = Image.open(src % k).convert('RGB'); c, cs, tip = sole(tag, k)
        col = (0, 170, 60) if cs > 0.3 else (220, 30, 30) if cs < -0.1 else (230, 150, 0)
        tiles.append((im.crop(bb3(k)), ('脚底朝镜头' if cs > 0.3 else '脚底背对镜头' if cs < -0.1 else '脚底侧对镜头') + f' cos{cs:+.2f}', col))
    for tag in ('b', 'a'):
        im = Image.open(f'shots/{tag}-side{k:03d}.png').convert('RGB').crop((40, 0, 700, 660)).resize((TS, TS))
        dd = ImageDraw.Draw(im); dd.text((8, TS - 30), '← 镜头一侧', font=f2, fill=(60, 60, 60)); tiles.append((im, None, None))
    for c, (im, t, col) in enumerate(tiles):
        im = im.resize((TS, TS)); d = ImageDraw.Draw(im, 'RGBA')
        if c == 0: lab(d, (8, 8), f'{k / 30:.2f} s · {10118 + k}', f2)
        if t: lab(d, (8, TS - 34), t, f2, fill=(0, 0, 0, 170) if col is None else col + (220,))
        out.paste(im, (c * TS, y0))
    d0.line((0, y0, Wd, y0), fill=(200, 200, 200), width=2)
for c in range(1, 5): d0.line((c * TS, 0, c * TS, H), fill=(200, 200, 200), width=2)
out.save('foot_fix_cmp.jpg', quality=88); print(out.size)
