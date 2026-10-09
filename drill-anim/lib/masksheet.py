import sys,json,numpy as np
from PIL import Image,ImageDraw,ImageFont
D,OUT,FONT=sys.argv[1:4];info=json.load(open(D+'/info.json'));f=ImageFont.truetype(FONT,22);fs=ImageFont.truetype(FONT,15)
G=list(info);W=360;cols=6;rows=(len(G)+cols-1)//cols
S=Image.new('RGB',(W*cols,(W+56)*rows),(22,22,25));d=ImageDraw.Draw(S)
for i,g in enumerate(G):
    a=Image.open(f'{D}/{g}.png').convert('RGBA');m=np.array(Image.open(f'{D}/{g}-mask.png').convert('L')).astype(float)/255
    bg=Image.new('RGBA',a.size,(48,48,52,255));bg.alpha_composite(a)
    ys,xs=np.nonzero(np.array(a)[...,3]>10);cx,cy=(xs.min()+xs.max())/2,(ys.min()+ys.max())/2;h=(ys.max()-ys.min())*0.56   # crop to the figure
    im=bg.crop((int(cx-h),int(cy-h),int(cx+h),int(cy+h))).convert('RGB').resize((W,W),Image.LANCZOS)
    x,y=(i%cols)*W,(i//cols)*(W+56);S.paste(im,(x,y+56));cov=float((m>0.5).mean()*100)
    d.text((x+10,y+6),g,font=f,fill=(120,220,255));d.text((x+10,y+34),f"panels {info[g]['panels']} · mask {cov:.2f}% of canvas",font=fs,fill=(170,170,175))
S.save(OUT);print('saved',OUT)
