"""keyframe check sheet: top = clipA01 mirrored source, bottom = r21 3D (video camera); 6 key moments."""
from PIL import Image, ImageDraw, ImageFont, ImageOps
F = ImageFont.truetype('/workspace/work/hiplab/assets/fonts/NotoSansSC.ttf', 26)
R = '/workspace/work/b2000/ref2/clipA01/precision/frames/'; D = '/workspace/work/b2000/r21/'
K = [(384, '站姿'), (465, '左手撑地'), (492, '分腿双手倒立'), (507, '叠掌'), (525, '旋转·背面'), (584, '落脚')]
w, h = 302, 540; S = Image.new('RGB', (w * len(K), h * 2 + 40), 'white'); d = ImageDraw.Draw(S)
for n, (f, t) in enumerate(K):
    S.paste(ImageOps.mirror(Image.open(R + '%05d.png' % f).convert('RGB')).resize((w, h)), (n * w, 40))
    S.paste(Image.open(D + 'vid3d/f-%03d.png' % (f - 384)).convert('RGB').resize((w, h)), (n * w, 40 + h))
    d.text((n * w + 8, 4), f'{f} {t}', font=F, fill='black')
S.save(D + 'keys_r21.jpg', quality=85)
