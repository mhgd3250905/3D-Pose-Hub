import json,glob
from PIL import Image,ImageDraw,ImageFont
from summ import load,summ
F=ImageFont.truetype(sorted(glob.glob('/workspace/work/thomas-promo/fonts/NotoSansCJK*'))[-1],14)
D=load('r5e.jsonl')['forearms-A'];MN={'0before':'before','1r4':'r4','2r5':'e1'};TAG={'0before':'修前','1r4':'r4','2r5':'r5'}
DIR={1.175:'手指朝前',3.175:'手指朝外',5.175:'手指朝后(朝膝)',7.175:'手背贴地',5.5:'手指朝后·前摇最深'}
S=260;j=json.load(open('jobs-r5render.json'))[0];rows=[]
for sh in j['shots']:
    side,t=sh['side'],sh['t'];ims=[]
    for k in ['prod','close']:
        for v in j['vars']:
            im=Image.open(f"png5/forearms-A-{side}-{t}-{v['tag']}-{k}.png").convert('RGB');im.thumbnail((S,S));ims.append(im)
    parts=[]
    for v in j['vars']:
        r=D[MN[v['tag']]];row=min(r['rows'],key=lambda x:abs(x['t']-t))[side];m=summ(r['rows'],side)
        parts.append(f"{TAG[v['tag']]}: 本帧肘{row['ratio']:.2f}/扭{abs(row['tw']):.0f}° 肩{row['shW']:.2f}/扭{abs(row['shTw']):.0f}° 手腕扭{abs(row['htw']):.0f}° | 全程最差 肘{m['el']:.2f} 肩{m['shW']:.2f}")
    img=Image.new('RGB',(S*6,S+80),'white');d=ImageDraw.Draw(img)
    d.text((6,2),f"forearms-A  {'右' if side=='right' else '左'}臂  t={t}  {DIR[t]}    列：修前 / r4 / r5 生产机位 | 修前 / r4 / r5 肩肘特写",fill='black',font=F)
    for i,p in enumerate(parts): d.text((6,20+i*18),p,fill=(180,40,20) if i==2 else (60,60,60),font=F)
    for i,im in enumerate(ims): img.paste(im,(i*S,76))
    rows.append(img)
H=sum(r.height for r in rows);sheet=Image.new('RGB',(S*6,H),'white');y=0
for r in rows: sheet.paste(r,(0,y));y+=r.height
sheet.save('/workspace/work/elbow-fix/shoulder-ba-forearms-A-r5.png');print(sheet.size)
