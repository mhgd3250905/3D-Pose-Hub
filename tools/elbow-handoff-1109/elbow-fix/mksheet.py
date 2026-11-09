import sys,json,os;sys.path.insert(0,'/workspace/work/pylib')
from PIL import Image,ImageDraw,ImageFont
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',14)
c=json.load(open('choice.json'));jobs=json.load(open('jobs-ba.json'));D='png-ba'
def crop(f,H):
  im=Image.open(f).convert('RGB');bb=Image.eval(im,lambda x:255-x).getbbox()
  if bb:im=im.crop((max(0,bb[0]-8),max(0,bb[1]-8),min(im.width,bb[2]+8),min(im.height,bb[3]+8)))
  return im.resize((max(1,int(im.width*H/im.height)),H))
rows=[]
for j in jobs:
  for s,t in j['t'].items():
    fs=[f"{D}/{j['id']}-{s}-{k}.png" for k in('before-prod','after-prod','before-close','after-close')]
    if not all(os.path.exists(f) for f in fs):continue
    y=c[j['id']]['sides'][s];b=y['base'];m=y['best']['m']
    rows.append((f"{j['id']} {s} t={t}  ratio {b['ratio']:.2f}->{m['ratio']:.2f}  twist {b['twMax']:.0f}->{m['twMax']:.0f}  (before | after | before close | after close)",fs))
H=230;per=6
for k in range(0,len(rows),per):
  R=[(lab,[crop(f,H) for f in fs]) for lab,fs in rows[k:k+per]]
  W=max(sum(i.width+6 for i in ims) for _,ims in R)+10;S=Image.new('RGB',(W,len(R)*(H+26)),'white');d=ImageDraw.Draw(S);y0=0
  for lab,ims in R:
    d.text((6,y0+4),lab,fill='black',font=F);x=6
    for i,im in enumerate(ims):S.paste(im,(x,y0+22));x+=im.width+6
    y0+=H+26
  out=f'before-after-{k//per+1:02d}.png';S.save(out);print(out,S.size)
