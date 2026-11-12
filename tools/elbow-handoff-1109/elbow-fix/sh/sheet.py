import json,sys,os
from PIL import Image,ImageDraw,ImageFont
from summ import load,summ
# python3 sheet.py jobs-r.json pngdir metrics.jsonl[,more] outprefix
jobs=json.load(open(sys.argv[1]));P=sys.argv[2];D={}
for f in sys.argv[3].split(','):
    for k,v in load(f).items(): D.setdefault(k,{}).update(v)
out=sys.argv[4]
try: F=ImageFont.truetype(sorted(__import__('glob').glob('/workspace/work/thomas-promo/fonts/NotoSansCJK*'))[-1],14)
except Exception:
    import glob;c=glob.glob('/usr/share/fonts/**/*CJK*',recursive=True)+glob.glob('/usr/share/fonts/**/*.tt[fc]',recursive=True);F=ImageFont.truetype(c[0],15)
TAG={'0before':'修前原始','1r1':'上一版(r1)','2new':'新版(r2)'}
MN={'0before':'before','1r1':'r1','2new':'r2new'}
S=260
for j in jobs:
    rows=[]
    for sh in j['shots']:
        side,t=sh['side'],sh['t'];ims=[];labs=[]
        for k in ['prod','close']:
            for v in j['vars']:
                f=f"{P}/{j['id']}-{side}-{t}-{v['tag']}-{k}.png"
                im=Image.open(f).convert('RGB');im.thumbnail((S,S));ims.append(im)
        hdr=f"{j['id']}  {side}  t={t}   "
        parts=[]
        for v in j['vars']:
            r=D[j['id']].get(MN[v['tag']])
            if r:
                m=summ(r['rows'],side);parts.append(f"{TAG[v['tag']]}: 肘{m['el']:.2f} 扭{m['tw']:.0f}° 肩{m['shW']:.2f}/R5 {m['shR5']:.2f} 肩扭{m['shTw']:.0f}° 肘窝{m['pit']} 掌{m['palm']}")
        W=S*6;img=Image.new('RGB',(W,S+66),'white');d=ImageDraw.Draw(img)
        d.text((6,2),hdr+'   列：修前 / r1 / r2 生产机位 | 修前 / r1 / r2 肩肘特写',fill='black',font=F)
        d.text((6,20),'   '.join(parts[:2]),fill=(60,60,60),font=F);d.text((6,38),parts[2] if len(parts)>2 else '',fill=(180,40,20),font=F)
        for i,im in enumerate(ims): img.paste(im,(i*S,62))
        rows.append(img)
    H=sum(r.height for r in rows);sheet=Image.new('RGB',(S*6,H),'white');y=0
    for r in rows: sheet.paste(r,(0,y));y+=r.height
    fn=f"{out}{j['id']}.png";sheet.save(fn);print(fn)
