"""2000 r21 compare video: left reference, right 3D (Pose Studio v0 camera = clipA01 camera, mirrored).
Part 1: clipA01 00384-00612 mirrored (1x then 0.5x). Part 2: clipB 00040-00066 stacked spin, TIME-REVERSED (clip B spins the
other way; reversed it matches r21's right-pivot clockwise spin) beside the 3D spin, 0.5x. -> 2000_compare.mp4 (1216x1080)"""
import subprocess, json
from PIL import Image, ImageDraw, ImageFont, ImageOps
F = ImageFont.truetype('/workspace/work/hiplab/assets/fonts/NotoSansSC.ttf', 30); f2 = ImageFont.truetype('/workspace/work/hiplab/assets/fonts/NotoSansSC.ttf', 22)
R = '/workspace/work/b2000/ref2/'; D = '/workspace/work/b2000/r21/'
FA = 29.97
def tag(d, xy, t, font):
    x, y = xy; b = d.textbbox((x, y), t, font=font); d.rounded_rectangle((b[0] - 8, b[1] - 5, b[2] + 8, b[3] + 7), 8, fill=(0, 0, 0, 160)); d.text((x, y), t, font=font, fill='white')
def r3d(k): return Image.open(D + 'vid3d/f-%03d.png' % k).convert('RGB').resize((604, 1080))
def frameA(k, slow):
    S = Image.new('RGB', (1216, 1080), (20, 20, 20))
    S.paste(ImageOps.mirror(Image.open(R + 'clipA01/precision/frames/%05d.png' % (384 + k)).convert('RGB')), (0, 0)); S.paste(r3d(k), (612, 0))
    O = Image.new('RGBA', S.size, (0, 0, 0, 0)); d = ImageDraw.Draw(O)
    tag(d, (18, 18), 'clipA01（镜像）', F); tag(d, (630, 18), '3D r21', F)
    tag(d, (18, 1030), f'{k / FA:.2f} s · 原片帧 {384 + k}', f2); tag(d, (1060, 1030), '0.5x' if slow else '1x', f2)
    return Image.alpha_composite(S.convert('RGBA'), O).convert('RGB')
def frameB(j, k):
    S = Image.new('RGB', (1216, 1080), (20, 20, 20))
    S.paste(Image.open(R + 'clipB/precision/frames/%05d.png' % j).convert('RGB').resize((604, 604)), (0, 238)); S.paste(r3d(k), (612, 0))
    O = Image.new('RGBA', S.size, (0, 0, 0, 0)); d = ImageDraw.Draw(O)
    tag(d, (18, 18), 'clipB 叠撑段（倒放对齐方向）', F); tag(d, (630, 18), '3D r21 叠撑旋转', F)
    tag(d, (18, 1030), f'clipB 帧 {j} ↔ clipA01 帧 {384 + k}', f2); tag(d, (1060, 1030), '0.5x', f2)
    return Image.alpha_composite(S.convert('RGBA'), O).convert('RGB')
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '1216x1080', '-r', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', D + '2000_compare.mp4'], stdin=subprocess.PIPE)
N = 229
for k in range(N): p.stdin.write(frameA(k, False).tobytes())
for k in range(N):
    b = frameA(k, True).tobytes(); p.stdin.write(b); p.stdin.write(b)
for n, j in enumerate(range(66, 39, -1)):   # B reversed, paired with the 3D spin from clipA01 frame 509
    b = frameB(j, 509 - 384 + n).tobytes(); p.stdin.write(b); p.stdin.write(b)
p.stdin.close(); p.wait(); print('done', p.returncode)
