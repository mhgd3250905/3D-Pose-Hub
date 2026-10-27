import json,base64,numpy as np,sys
def load(st):
  g=json.load(open(f'/workspace/body-v3/joints/{st}.json'));M={}
  for k,m in g['meshes'].items():
    A=np.frombuffer(base64.b64decode(m['A']),np.float32).reshape(-1,6).astype(float);F=np.array(m['idx']).reshape(-1,3) if m['idx'] else None
    M[k]=(A[:,:3],A[:,3:],F)
  return M,{k:np.array(v) for k,v in g['bones'].items()}
from scipy.spatial import cKDTree
def bverts(F,P=None):
  if P is not None:
    _,inv=np.unique(np.round(P/1e-5).astype(np.int64),axis=0,return_inverse=True);inv=inv.ravel();G=inv[F]
    e=np.sort(np.vstack([G[:,[0,1]],G[:,[1,2]],G[:,[2,0]]]),1);u,c=np.unique(e,axis=0,return_counts=True);bw=np.unique(u[c==1]);return np.where(np.isin(inv,bw)&np.isin(np.arange(len(P)),np.unique(F)))[0]
  e=np.sort(np.vstack([F[:,[0,1]],F[:,[1,2]],F[:,[2,0]]]),1);u,c=np.unique(e,axis=0,return_counts=True);return np.unique(u[c==1])
def used(F):return np.unique(F)
def gap(M,a,b,ymin=-9,ymax=9):
  Pa,Na,Fa=M[a];Pb,Nb,Fb=M[b];bv=bverts(Fa,Pa);bv=bv[(Pa[bv,1]>ymin)&(Pa[bv,1]<ymax)];ub=used(Fb);t=cKDTree(Pb[ub]);d,i=t.query(Pa[bv]);j=ub[i]
  if len(bv)==0:return dict(n=0)
  ang=np.degrees(np.arccos(np.clip((Na[bv]*Nb[j]).sum(1),-1,1)))
  return dict(n=len(bv),gap_mm_p50=round(np.median(d)*1e3,2),gap_mm_max=round(d.max()*1e3,2),nrm_deg_p50=round(float(np.median(ang)),1),nrm_deg_max=round(float(ang.max()),1))
def pen(M,a,b,ya=(-9,9),excl=0.02,thr=0.002):
  # verts of a lying inside b (behind b's nearest-vertex normal), excluding a verts near b's open boundary
  Pa,Na,Fa=M[a];Pb,Nb,Fb=M[b];ua=used(Fa);ua=ua[(Pa[ua,1]>ya[0])&(Pa[ua,1]<ya[1])];ub=used(Fb)
  d,i=cKDTree(Pb[ub]).query(Pa[ua]);j=ub[i];depth=-((Pa[ua]-Pb[j])*Nb[j]).sum(1)
  bb=bverts(Fb,Pb);db,_=cKDTree(Pb[bb]).query(Pa[ua]);m=(db>excl)&(d<0.03)&(depth>thr)
  return dict(n=int(m.sum()),max_mm=round(float(depth[m].max()*1e3),1) if m.any() else 0,y=[round(float(Pa[ua][m][:,1].min()),3),round(float(Pa[ua][m][:,1].max()),3)] if m.any() else None)
def segd(P,a,b):
  u=b-a;t=np.clip(((P-a)@u)/(u@u),0,1);return np.linalg.norm(P-a-t[:,None]*u,axis=1),t
def collapse(M0,B0,M1,B1,mesh,segs,center,rad=0.06):
  P0=M0[mesh][0];P1=M1[mesh][0];c=B0[center];sel=np.linalg.norm(P0-c,axis=1)<rad
  d0=np.min([segd(P0[sel],B0[x],B0[y])[0] for x,y in segs],0);d1=np.min([segd(P1[sel],B1[x],B1[y])[0] for x,y in segs],0)
  r=d1/np.maximum(d0,1e-4);return dict(n=int(sel.sum()),ratio_p5=round(float(np.percentile(r,5)),2),ratio_min=round(float(r.min()),2),frac_below_0p7=round(float((r<0.7).mean()),3),ratio_p95=round(float(np.percentile(r,95)),2))
def profile(M,mesh,a,b,B,ext=0.05,step=0.004):
  # mean radius per slice along a->b around joint b (per 8 sectors), returns max adjacent-slice step (mm)
  P=M[mesh][0];u=B[b]-B[a];L=np.linalg.norm(u);u/=L;t=(P-B[b])@u;m=np.abs(t)<ext;Q=P[m]-B[b];tt=t[m]
  rr=Q-np.outer(tt,u);r=np.linalg.norm(rr,axis=1);ref=np.cross(u,[0,0,1.]);ref/=np.linalg.norm(ref);ang=np.arctan2(rr@np.cross(u,ref),rr@ref);sec=((ang+np.pi)/(2*np.pi)*8).astype(int)%8
  bins=np.arange(-ext,ext+1e-9,step);T=np.full((len(bins),8),np.nan)
  for i,x in enumerate(bins):
    for s in range(8):
      k=(np.abs(tt-x)<step/2)&(sec==s)
      if k.sum()>=3:T[i,s]=np.percentile(r[k],90)
  D=np.abs(np.diff(T,axis=0));D2=np.abs(T[2:]-2*T[1:-1]+T[:-2])
  return dict(step_mm_max=round(float(np.nanmax(D)*1e3),1),curv_mm_max=round(float(np.nanmax(D2)*1e3),1),at_mm=int(round(bins[np.nanargmax(np.nanmax(D2,1))+1]*1e3)))
