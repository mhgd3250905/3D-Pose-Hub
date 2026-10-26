# Build hands-native-r4 from frozen r3: uniform scale S about the hand-bone origin, smoothstep blend 1->S over hand-local x in [0, BAND]
# so the wrist seam (x<=0, frozen forearm boundary) is untouched. Rig joints use the same mapping; bones/names/weights/poses unchanged.
import json,base64,numpy as np,sys,os,copy
exec(open('/workspace/hand-scale/frame.py').read().split("if __name__")[0])
S=float(sys.argv[1]) if len(sys.argv)>1 else 0.88;BAND=float(sys.argv[2]) if len(sys.argv)>2 else 0.035
OUT=os.environ.get('OUT','/workspace/ph/drill-anim/models/hands-native-r4/');PALM=float(os.environ.get('PALM','1'));WID=float(os.environ.get('WIDTH','1'));ZC=[0.0];os.makedirs(OUT,exist_ok=True)
R,t,res,d,X,dom,rig=handframe('hands-native-r3/hands-rig.json','hands-native-r3/hands-base.json')
def sm(x):u=np.clip(x/BAND,0,1);return 1+(S-1)*(u*u*(3-2*u))
RR=float(sys.argv[3]) if len(sys.argv)>3 else 0.87  # wrist-band radial narrowing
def ss(u):u=np.clip(u,0,1);return u*u*(3-2*u)
def rr(x):  # 1 at x<=0, RR over 12-28 mm, back to 1 at 45 mm
  return 1+(RR-1)*(ss(x/0.012)-ss((x-0.028)/0.017))
def phi_local(L,C=None):
  L=L.copy()
  if C is not None:
    k=rr(L[:,0])[:,None];c=C(L[:,0]);L[:,1:]=c+k*(L[:,1:]-c)
  return L*sm(L[:,0])[:,None]
def centroid_fn(L):
  bins=np.arange(-0.005,0.05,0.002);cs=[]
  for b in bins:
    m=np.abs(L[:,0]-b)<0.002;cs.append(L[m][:,1:].mean(0) if m.sum()>10 else np.zeros(2))
  cs=np.array(cs);return lambda x:np.stack([np.interp(x,bins,cs[:,0]),np.interp(x,bins,cs[:,1])],1)
Y=X.copy()
for sgn in (1,-1):
  sel=X[:,0]*sgn>0;P=X[sel].copy();P[:,0]*=sgn
  L=(P-t)@R;Cf=centroid_fn(L);L2=phi_local(L,Cf)
  if PALM!=1:
    dm=dom[sel];th=np.isin(dm,[f'v2p_{"L" if sgn==1 else "R"}_thumb2',f'v2p_{"L" if sgn==1 else "R"}_thumb3'])
    x=L[:,0];w=ss((x-0.020)/0.015)-ss((x-0.095)/0.020);w=w*(~th)  # palm band 20..115 mm (r3 local), fingers/wrist untouched
    pm=(L[:,0]>0.04)&(L[:,0]<0.09)&~th;yc=np.median(L2[pm,1])
    L2[:,1]=yc+(1+(PALM-1)*w)*(L2[:,1]-yc)
  if WID!=1:
    pm=(L[:,0]>0.04)&(L[:,0]<0.09);zc=np.median(L2[pm,2]);ZC[0]=zc if sgn==1 else ZC[0]
    ww=ss((L[:,0]-0.020)/0.015);L2[:,2]=zc+(1+(WID-1)*ww)*(L2[:,2]-zc)
  P2=L2@R.T+t
  if sgn==1:CL=Cf;P2[:,0]*=sgn;Y[sel]=P2
# keep seam vertices exactly
first=d['seam']['first'];Y[first:]=X[first:]
moved=np.linalg.norm(Y-X,axis=1)
lo=Y.min(0);sc=(Y.max(0)-lo)/65535;q=np.round((Y-lo)/sc).astype(np.uint16)
nd=copy.deepcopy(d);nd['pos']={'lo':lo.tolist(),'scale':sc.tolist(),'u16':base64.b64encode(q.tobytes()).decode()}
nd['source']=d['source']+f' r4: uniform hand scale {S} about the hand-bone origin, smoothstep blend over hand-local 0-{BAND*1000:.0f} mm; wrist-band radial narrowing {RR} (12-28 mm, back to 1 at 45 mm); wrist seam and forearm band unchanged; palm-thickness factor {PALM} (palm band only).'
nd['report']={**d['report'],'r4':{'scale':S,'wristRadial':RR,'palmThickness':PALM,'width':WID,'palmBandR3LocalMm':[20,35,95,115],'wristRadialBandMm':[0,12,28,45],'bandM':BAND,'maxVertexMoveMm':round(float(moved.max()*1000),2),'seamVerticesUnchanged':int(len(X)-first)}}
json.dump(nd,open(OUT+'hands-base.json','w'),separators=(',',':'))
nr=copy.deepcopy(rig)
for f,v in nr['fingers'].items():
  J=np.array(v['joints']);J2=phi_local(J,CL)
  if WID!=1:ww=ss((J[:,0]-0.020)/0.015);J2[:,2]=ZC[0]+(1+(WID-1)*ww)*(J2[:,2]-ZC[0])
  v['joints']=J2.round(6).tolist()
nr['doc']=rig['doc']+f' r4: joints mapped with the same scale as the mesh (S={S}, blend 0-{BAND*1000:.0f} mm hand-local x). Names, hierarchy, flex axes and poses unchanged.'
json.dump(nr,open(OUT+'hands-rig.json','w'),separators=(',',':'))
print(json.dumps(nd['report']['r4']),'fit resid max mm',round(float(res.max()*1000),1))
