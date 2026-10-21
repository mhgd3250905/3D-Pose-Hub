# pairs <name>-torso.jpg | <name>-limbs.jpg from limbs-poses.mjs into a labelled grid:  limbs_sheet.py <dir> <out.jpg> [prefix,...] [--cols N]
import sys, os, glob
from PIL import Image, ImageDraw
d,out=sys.argv[1],sys.argv[2]; args=sys.argv[3:]; cols=2
if '--cols' in args: i=args.index('--cols'); cols=int(args[i+1]); args=args[:i]+args[i+2:]
pref=args[0].split(',') if args else None
names=sorted(set(os.path.basename(f).rsplit('-',1)[0] for f in glob.glob(os.path.join(d,'*.jpg'))))
if pref: names=[n for p in pref for n in names if n.startswith(p)]
tiles=[]
for n in names:
    ims=[]
    for v,lab in (('torso','current (v2 limbs)'),('limbs','limbs: base')):
        f=os.path.join(d,f'{n}-{v}.jpg')
        if not os.path.exists(f): continue
        im=Image.open(f).convert('RGB'); ImageDraw.Draw(im).text((6,4),f'{n}  {lab}',fill=(255,255,0)); ims.append(im)
    w=sum(i.width for i in ims); h=max(i.height for i in ims); t=Image.new('RGB',(w,h)); x=0
    for i in ims: t.paste(i,(x,0)); x+=i.width
    tiles.append(t)
W=max(t.width for t in tiles); H=max(t.height for t in tiles); rows=(len(tiles)+cols-1)//cols
S=Image.new('RGB',(W*cols,H*rows),(20,20,20))
for k,t in enumerate(tiles): S.paste(t,((k%cols)*W,(k//cols)*H))
S.save(out,quality=86); print(out,S.size)
