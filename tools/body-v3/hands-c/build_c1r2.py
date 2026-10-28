# hands-native-c1r2 from c1: one Loop subdivision (wrist seam verts/edges fixed), monotone wrist transition
# (per-angle radius + centre blended from the forearm ring to the hand section at XE), Taubin smoothing in the band,
# recomputed area-weighted normals with seam normals shared with the limbs piece.
import json,base64,copy,sys,numpy as np
from scipy.spatial.transform import Rotation
REPO='/workspace/ph/';M=REPO+'drill-anim/models/'
SRC=M+'hands-native-c1/';OUT=M+'hands-native-c1r2/';XE=float(sys.argv[1]) if len(sys.argv)>1 else 0.010
rest=json.load(open('/workspace/hands-src/rest/rest.json'))
d=json.load(open(SRC+'hands-base.json'));B=len(d['bones'])
u=lambda s,t:np.frombuffer(base64.b64decode(s),t)
p=d['pos'];X=np.array(p['lo'])+u(p['u16'],np.uint16).reshape(-1,3)*np.array(p['scale'])
F=u(d['index']['u16'],np.uint16).reshape(-1,3).astype(int)
J=u(d['joints']['u8'],np.uint8).reshape(-1,4);Wq=u(d['weights']['u8'],np.uint8).reshape(-1,4)/255
n=len(X);first=d['seam']['first'];W=np.zeros((n,B))
for k in range(4):np.add.at(W,(np.arange(n),J[:,k]),Wq[:,k])
seam=np.arange(n)>=first
# ---- Loop subdivision, seam fixed ----
E2={}
for f in F:
  for a,b,c in((f[0],f[1],f[2]),(f[1],f[2],f[0]),(f[2],f[0],f[1])):E2.setdefault((min(a,b),max(a,b)),[]).append(c)
nb=[set() for _ in range(n)]
for (a,b) in E2:nb[a].add(b);nb[b].add(a)
newP=[];newW=[];mid={}
for (a,b),opp in E2.items():
  if seam[a] and seam[b]:continue
  q=(X[a]+X[b])/2 if len(opp)!=2 else .375*(X[a]+X[b])+.125*(X[opp[0]]+X[opp[1]])
  mid[(a,b)]=first+len(newP);newP.append(q);newW.append((W[a]+W[b])/2)
X2=X.copy()
for i in range(first):
  k=len(nb[i]);beta=3/(8*k) if k>3 else 3/16;X2[i]=(1-k*beta)*X[i]+beta*X[list(nb[i])].sum(0)
m=len(newP);shift=lambda i:i if i<first else i+m
P=np.vstack([X2[:first],np.array(newP),X[first:]]);Wd=np.vstack([W[:first],np.array(newW),W[first:]])
mid={k:v for k,v in mid.items()}
FF=[]
for f in F:
  a,b,c=[int(x) for x in f];g=lambda x,y:mid.get((min(x,y),max(x,y)))
  poly=[]
  for x,y in((a,b),(b,c),(c,a)):
    poly.append(shift(x));mm=g(x,y)
    if mm is not None:poly.append(mm)
  # cut corners whose both sides are split, then fan the rest
  corners=[shift(a),shift(b),shift(c)]
  while len(poly)>3:
    L=len(poly);done=False
    for i in range(L):
      if poly[i] in corners and poly[i-1] not in corners and poly[(i+1)%L] not in corners:
        FF.append([poly[i-1],poly[i],poly[(i+1)%L]]);poly.pop(i);done=True;break
    if not done:
      for i in range(1,len(poly)-1):FF.append([poly[0],poly[i],poly[i+1]])
      poly=[]
  if len(poly)==3:FF.append(poly)
FF=np.array(FF);n2=len(P);first2=first+m;seam2=np.arange(n2)>=first2
# ---- monotone wrist transition, per side in hand-local (left frame; right mirrored) ----
def ss(x):x=np.clip(x,0,1);return x*x*(3-2*x)
def per(th,ang,val):o=np.argsort(ang);return np.interp(th,ang[o],val[o],period=2*np.pi)
adj=[set() for _ in range(n2)]
for f in FF:
  for i in range(3):adj[f[i]].add(f[(i+1)%3]);adj[f[i]].add(f[(i+2)%3])
diag={}
for side,sign in(('left',1),('right',-1)):
  hb=rest['bones'][side+'Hand'];T=Rotation.from_quat(hb['q']).as_matrix();h0=np.array(hb['p'])
  sid=np.where(P[:,0]*sign>0)[0];L=((P[sid]-h0)@T)*[sign,1,1]
  isS=seam2[sid];S=L[isS];c0=S[:,1:].mean(0)
  a0=np.arctan2(S[:,2]-c0[1],S[:,1]-c0[0]);r0=np.hypot(S[:,2]-c0[1],S[:,1]-c0[0])
  sec=np.abs(L[:,0]-XE)<.003;ce=L[sec&~isS,1:].mean(0)
  ae=np.arctan2(L[sec,2]-ce[1],L[sec,1]-ce[0]);re=np.hypot(L[sec,2]-ce[1],L[sec,1]-ce[0])
  K=48;bins=np.linspace(-np.pi,np.pi,K,endpoint=False)+np.pi/K;rb=np.full(K,np.nan)
  for k in range(K):
    dd=np.abs((ae-bins[k]+np.pi)%(2*np.pi)-np.pi);w=dd<np.pi/K*1.6
    if w.any():rb[k]=re[w].max()
  ok=~np.isnan(rb);rb=np.interp(bins,bins[ok],rb[ok],period=2*np.pi)
  for _ in range(3):rb=.25*np.roll(rb,1)+.5*rb+.25*np.roll(rb,-1)
  band=~isS&(L[:,0]<XE)
  Q=L[band];th0=np.arctan2(Q[:,2]-c0[1],Q[:,1]-c0[0]);xs=per(th0,a0,S[:,0])
  uu=np.clip((Q[:,0]-xs)/(XE-xs),0,1);s=ss(uu)
  c=c0+(ce-c0)*s[:,None];th=np.arctan2(Q[:,2]-c[:,1],Q[:,1]-c[:,0])
  r=per(th,a0,r0)*(1-s)+per(th,bins,rb)*s
  Q[:,1:]=c+np.stack([np.cos(th),np.sin(th)],1)*r[:,None];L[band]=Q
  # Taubin smoothing in the band and 12 mm beyond, seam fixed
  mov=~isS&(L[:,0]<XE+.012);loc=-np.ones(n2,int);loc[sid]=np.arange(len(sid))
  for it in range(12):
    for lam in(.5,-.53):
      Ln=L.copy()
      for j in np.where(mov)[0]:
        nn=[loc[q] for q in adj[sid[j]] if loc[q]>=0]
        Ln[j]=L[j]+lam*(L[nn].mean(0)-L[j])
      L=Ln
  P[sid]=((L*[sign,1,1])@T.T)+h0
  diag[side]={'XE_mm':XE*1e3,'seamX_mm':[round(S[:,0].min()*1e3,1),round(S[:,0].max()*1e3,1)],'bandVerts':int(band.sum())}
# ---- normals ----
def an(v,f):
  nn=np.zeros_like(v);fn=np.cross(v[f[:,1]]-v[f[:,0]],v[f[:,2]]-v[f[:,0]])
  for k in range(3):np.add.at(nn,f[:,k],fn)
  return nn
hn=an(P,FF);N=hn/np.linalg.norm(hn,axis=1)[:,None]
limb=json.load(open(M+'training-human-v2plus-limbs-base.json'))
lp=limb['pos'];LP=np.array(lp['lo'])+u(lp['u16'],np.uint16).reshape(-1,3)*np.array(lp['scale']);LF=u(limb['index']['u16'],np.uint16).reshape(-1,3).astype(int)
body=np.array(rest['meshes']['Coach_Body']['P']).reshape(-1,3)
for i,vid in enumerate(limb['seam']['vid']):
  if limb['seam']['mesh'][i]=='Coach_Body':LP[limb['seam']['first']+i]=body[vid]
ln=an(LP,LF);look={(mm,v):limb['seam']['first']+i for i,(mm,v) in enumerate(zip(limb['seam']['mesh'],limb['seam']['vid']))}
lid=[];lnr=[]
for k,vid in enumerate(d['seam']['vid']):
  li=look[('Coach_Body',vid)];v=hn[first2+k]+ln[li];v/=np.linalg.norm(v);N[first2+k]=v;lid.append(li);lnr.append(v)
# ---- pack ----
idx=np.argsort(-Wd,axis=1)[:,:4];w=np.take_along_axis(Wd,idx,1);w/=w.sum(1)[:,None]
qw=np.round(w*255).astype(int);qw[:,0]+=255-qw.sum(1)
lo=P.min(0)-.001;st=(P.max(0)+.001-lo)/65535;b64=lambda a:base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
nd=copy.deepcopy(d);nd.update(n=n2,pos={'lo':lo.tolist(),'scale':st.tolist(),'u16':b64(np.round((P-lo)/st).astype('<u2'))},
 nrm={'i8':b64(np.round(N*127).astype('i1'))},index={'u16':b64(FF.astype('<u2'))},joints={'u8':b64(idx.astype('u1'))},weights={'u8':b64(qw.astype('u1'))},
 limbsNrm={'idx':lid,'i8':b64(np.round(np.array(lnr)*127).astype('i1'))})
nd['seam']['first']=first2
nd['source']=d['source']+f' c1r2: one Loop subdivision (wrist seam verts and seam-seam edges fixed); wrist transition rebuilt per angle from the forearm ring to the hand section at hand-local x={XE*1e3:.0f} mm (smoothstep radius+centre, monotone), Taubin-smoothed to x+12 mm; area-weighted normals recomputed, seam normals shared with the limbs piece.'
nd['report']={**d['report'],'c1r2':{**diag,'vertices':n2,'faces':len(FF)}}
import os;os.makedirs(OUT,exist_ok=True);json.dump(nd,open(OUT+'hands-base.json','w'),separators=(',',':'))
print(json.dumps(nd['report']['c1r2']))
