import sys
from PIL import Image, ImageDraw, ImageFont
FT = ImageFont.truetype('/workspace/work/hiplab/assets/fonts/NotoSansSC.ttf', 22)
def grid(rows, out, cw=300, ch=360):
    S = Image.new('RGB', (cw * max(len(r[1]) for r in rows) + 90, ch * len(rows)), 'white'); d = ImageDraw.Draw(S)
    for ri, (lab, fs) in enumerate(rows):
        d.text((6, ri * ch + ch // 2 - 30), lab, fill='black', font=FT)
        for ci, (f, cap) in enumerate(fs):
            im = Image.open(f).convert('RGB').resize((cw, ch)); S.paste(im, (90 + ci * cw, ri * ch)); d.text((96 + ci * cw, ri * ch + 4), cap, fill='black', font=FT)
    S.save(out, quality=88)
