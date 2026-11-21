"""left: original clip01 (source.720 -> 960x540), right: r4 3D (Pose Studio v0 camera = video camera), 1x then 0.5x slow. -> airflare_compare.mp4"""
import subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont
F = ImageFont.truetype('/workspace/work/fl-pin/webapp/src/fonts/nsc-700.woff2', 34); f2 = ImageFont.truetype('/workspace/work/fl-pin/webapp/src/fonts/nsc-700.woff2', 24)
D = '/workspace/work/airflare/r4/'; N = 156
def tag(d, xy, t, font):
    x, y = xy; b = d.textbbox((x, y), t, font=font); d.rounded_rectangle((b[0] - 10, b[1] - 6, b[2] + 10, b[3] + 8), 8, fill=(0, 0, 0, 150)); d.text((x, y), t, font=font, fill='white')
def frame(k, slow):
    S = Image.new('RGB', (1920, 540)); S.paste(Image.open(D + 'vidsrc/s-%03d.png' % k).convert('RGB'), (0, 0)); S.paste(Image.open(D + 'vid3d/f-%03d.png' % k).convert('RGB'), (960, 0))
    O = Image.new('RGBA', S.size, (0, 0, 0, 0)); d = ImageDraw.Draw(O)
    tag(d, (24, 20), '原片', F); tag(d, (984, 20), '3D', F)
    tag(d, (24, 486), f'{k / 30:.2f} s  ·  原片帧 {10118 + k}', f2); tag(d, (1640, 486), '0.5x 慢放' if slow else '1x', f2)
    S = Image.alpha_composite(S.convert('RGBA'), O).convert('RGB'); d = ImageDraw.Draw(S); d.line((960, 0, 960, 540), fill='white', width=3); return S
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', '1920x540', '-r', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', D + 'airflare_compare.mp4'], stdin=subprocess.PIPE)
for k in range(N): p.stdin.write(frame(k, False).tobytes())
for k in range(N):
    b = frame(k, True).tobytes(); p.stdin.write(b); p.stdin.write(b)
p.stdin.close(); p.wait(); print('done', p.returncode)
