import json,numpy as np
from PIL import Image,ImageDraw
P='/workspace/work/airflare/precision/'
FIX={10145:{16:(932,612),22:(942,622),20:(832,686)}}
def med(d,m,cx,cy,r):
    y,x=np.ogrid[:1080,:1920]; s=((x-cx)**2+(y-cy)**2<r*r)&m
    return np.median(d[s]) if s.sum()>20 else np.nan
for f in range(10140,10156):
    a={p['id']:p for p in json.load(open(P+f'kp2d/{f}.json'))['keypoints']}
    g=lambda j: np.array(FIX.get(f,{}).get(j,(a[j]['x'],a[j]['y'])),float)
    d=np.array(Image.open(P+f'depth/{f}.png')).astype(float); m=np.array(Image.open(P+f'mask/{f}.png').convert('L'))>128
    poly=[tuple(g(j)) for j in (5,6,12,11)]; pm=Image.new('L',(1920,1080)); ImageDraw.Draw(pm).polygon(poly,fill=255); pm=(np.array(pm)>0)&m
    tor=np.median(d[pm]); foot=(g(16)+g(22)+g(20))/3
    print(f, f'{(f-10118)/30:.2f}s torso {tor:.0f} hipR {med(d,m,*g(12),15):.0f} knee {med(d,m,*g(14),15):.0f} ankle {med(d,m,*g(16),12):.0f} footc {med(d,m,*foot,15):.0f} toe {med(d,m,*g(20),10):.0f}  foot-torso {med(d,m,*foot,15)-tor:+.0f}')
