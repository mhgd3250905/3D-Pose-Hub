# python3 lib/comp.py <frame dir> <spec.json> <theme.json> <outdir> [a:b]  -> composited 1080 frames <outdir>/NNNN.png
# generalised from toon-test comp6.py (v7): background, floor shadows, ember outline/halo, highlight bloom. Defaults reproduce v7.
import json,sys,os,glob,numpy as np
from PIL import Image,ImageFilter
from scipy import ndimage as nd
D,SP,TH,OUT=sys.argv[1:5];rng=sys.argv[5] if len(sys.argv)>5 else None
spec=json.load(open(SP));th=json.load(open(TH));os.makedirs(OUT,exist_ok=True)
W=spec.get('size',1080);K=W/1024
met={}
for f in glob.glob(D+'/met-*.json'):
    for r in json.load(open(f)):met['still' if r['f']<0 else '%04d'%r['f']]=r
pl=spec.get('frame',{'mode':'v7','width':750,'left':165,'top':300})
plf=OUT+'/place.json'
if os.path.exists(plf):P0=json.load(open(plf));s,ox,oy=P0['s'],P0['ox'],P0['oy']
else:
    A0=np.array(Image.open(D+'/g-still.png'))[...,3]  # body-only silhouette (props are not in the glow pass)
    ys,xs=np.nonzero(A0>10);x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
    if pl['mode']=='v7':s=pl['width']*K/(x1-x0);ox=pl['left']*K-x0*s;oy=pl['top']*K-y0*s
    else:  # fit: scale so the still's bbox width (or height) fills width px, centred at (cx,cy)
        s=min(pl['width']*K/(x1-x0),pl.get('height',9999)*K/(y1-y0));ox=pl.get('cx',512)*K-(x0+x1)/2*s;oy=pl.get('cy',512)*K-(y0+y1)/2*s
    json.dump({'s':s,'ox':ox,'oy':oy},open(plf,'w'))
bg=th['background'];yy,xx=np.mgrid[0:W,0:W].astype(float)
yq,xq=(np.mgrid[0:W//4,0:W//4].astype(float)*4+1.5)
r=np.hypot((xx-512*K)/(620*K),(yy-470*K)/(560*K));rc=np.clip(r,0,1)
BG=np.array(bg['centre'],float)*(1-rc**1.4)[...,None]+np.array(bg['edge'],float)*(rc**1.4)[...,None]
wc=spec.get('warm',[470,560,260,170])
BG+=np.exp(-(((xx-wc[0]*K)/(wc[2]*K))**2+((yy-wc[1]*K)/(wc[3]*K))**2))[...,None]*np.array(bg['warm'],float)
fb=spec.get('floorBand',[800,520,70,450])
BG+=(np.exp(-((yy-fb[0]*K)/(fb[2]*K))**2)*np.exp(-((xx-fb[1]*K)/(fb[3]*K))**2))[...,None]*np.array(bg['floorBand'],float)
ember=np.array(th['rim']['outline'],float);halok=th['rim'].get('halo',0.12)
def place(im):
    im=im.resize((round(im.width*s),round(im.height*s)),Image.LANCZOS)
    c=Image.new('RGBA',(W,W),(0,0,0,0));c.paste(im,(round(ox),round(oy)),im);return c
sh_spec=spec.get('shadow',{})
def comp(nm):
    m=met[nm];fig0=Image.open(f'{D}/m-{nm}.png').convert('RGBA');pr=fig0.width/W
    P=lambda k:(m['proj'][k][0]*pr*s+ox,m['proj'][k][1]*pr*s+oy)
    fig=place(fig0);gl=place(Image.open(f'{D}/g-{nm}.png').convert('RGBA'))
    sh=np.zeros((W//4,W//4))
    def ell(c,rx,ry,a):
        nonlocal sh;sh=np.maximum(sh,a*np.exp(-(((xq-c[0])/(rx*K))**2+((yq-c[1])/(ry*K))**2)))
    for bl in sh_spec.get('blobs',[]):
        p=P(bl['j']);ell((p[0]+bl.get('dx',0)*K,p[1]+bl.get('dy',0)*K),bl['rx'],bl['ry'],bl['a'])
    for bd in sh_spec.get('bands',[]):
        a=np.array(P(bd['from']));b=np.array(P(bd['to']));pv=np.array(P(bd.get('mid','pelvis')))
        hk=1.0
        if 'hipK' in bd:c0,c1,h0,lo,hi=bd['hipK'];hk=np.clip(c0-c1*(m['hipMid'][1]-h0),lo,hi)
        tp=np.dot(pv-a,b-a)/max(np.dot(b-a,b-a),1e-6)
        for t in np.linspace(0,1,40):
            p=a+(b-a)*t;w=np.exp(-((t-tp)/0.25)**2)
            ell((p[0],p[1]+bd.get('dy',10)*K),bd['rx'],bd['ry'],bd['a']*(1-bd.get('sag',0.5)*np.sin(t*np.pi))*(1+(hk-1)*w))
    sh=nd.gaussian_filter(sh,1*K);sh=np.array(Image.fromarray((sh*65535).astype(np.uint16).astype(np.int32),'I').resize((W,W),Image.BILINEAR)).astype(float)/65535
    o=BG*(1-0.75*sh[...,None])
    fa=np.array(gl)[...,3].astype(float)/255   # body silhouette -> ember outline/halo
    fm=np.array(fig)[...,3].astype(float)/255  # body + props -> paint
    ring=nd.gaussian_filter(np.clip(nd.grey_dilation(fa,size=(3,3))-fa,0,1),0.8)
    halo=np.array(Image.fromarray((np.clip(nd.grey_dilation(fa,size=(9,9))-fa,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5*K))).astype(float)/255
    fr=np.array(fig).astype(float)
    if spec.get('props'):o=o*(1-fm[...,None])+fr[...,:3]*fm[...,None]   # props first, so the body outline draws over the mat
    o=o+halo[...,None]*ember*halok;o=o*(1-ring[...,None]*.7)+ember*ring[...,None]*.7
    o=o*(1-fa[...,None])+fr[...,:3]*fa[...,None]
    inner=np.clip(fa-nd.grey_erosion(fa,size=(3,3)),0,1)*0.6;o=o*(1-inner[...,None])+ember*inner[...,None]
    g=np.array(gl).astype(float);g=g[...,:3]*(g[...,3:]/255);gi=Image.fromarray(np.clip(g,0,255).astype(np.uint8))
    bloom=np.array(gi.filter(ImageFilter.GaussianBlur(9*K))).astype(float)+0.9*np.array(gi.filter(ImageFilter.GaussianBlur(22*K))).astype(float)
    o=255-(255-o)*(1-np.clip(bloom/255,0,1))
    Image.fromarray(np.clip(o,0,255).astype(np.uint8)).save(f'{OUT}/{nm}.png')
    edge=fa[:2].max()+fa[-2:].max()+fa[:,:2].max()+fa[:,-2:].max()
    return edge
names=sorted(met)
if rng:a,b_=map(int,rng.split(':'));names=[n for n in names if n!='still' and a<=int(n)<b_]
edges={n:comp(n) for n in names}
json.dump({k:float(v) for k,v in edges.items()},open(f'{OUT}/edge-{rng or "all"}.json','w'))
print('done',len(names))
