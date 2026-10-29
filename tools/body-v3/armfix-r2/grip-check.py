import argparse,json,sys
from pathlib import Path
import numpy as np
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'human-v2plus/hands-native'))
from check import audit
ap=argparse.ArgumentParser();ap.add_argument('capture',type=Path);ap.add_argument('output',type=Path);a=ap.parse_args()
if a.output.exists():raise SystemExit('Output exists')
rows=[]
for file in sorted(a.capture.glob('input-*.json')):
 d=json.loads(file.read_bytes());p=np.array(d['mesh']['positionsWorld']).reshape(-1,3);f=np.array(d['mesh']['index']).reshape(-1,3);result={'file':file.name,'sides':{}}
 for side in ['left','right']:
  groups=d['current'][side]['vertexGroups'];ids=np.array(groups['all']);triIds=np.where(np.isin(f,ids).all(1))[0];target=next(t for t in d['targets'] if t['side']==side and t['kind']=='rod-cylinder');axis=np.array(target['axisWorld']);c=np.array(target['centerWorld']);radius=target['radius'];q=p-c;q-=np.outer(q@axis,axis);dist=np.linalg.norm(q,axis=1);tri=q[f[triIds]]
  # Distance from an infinite cylinder axis to each triangle interior and edges.
  u=tri[:,1]-tri[:,0];v=tri[:,2]-tri[:,0];w=-tri[:,0];uu=(u*u).sum(1);uv=(u*v).sum(1);vv=(v*v).sum(1);uw=(u*w).sum(1);vw=(v*w).sum(1);det=uu*vv-uv*uv;safe=np.abs(det)>1e-20
  b=np.zeros(len(tri));e=b.copy();b[safe]=(uw[safe]*vv[safe]-vw[safe]*uv[safe])/det[safe];e[safe]=(vw[safe]*uu[safe]-uw[safe]*uv[safe])/det[safe];inside=safe&(b>=0)&(e>=0)&(b+e<=1)
  best=np.full(len(tri),np.inf);best[inside]=np.linalg.norm(tri[inside,0]+b[inside,None]*u[inside]+e[inside,None]*v[inside],axis=1)
  for j,k in [(0,1),(1,2),(2,0)]:
   x=tri[:,j];edge=tri[:,k]-x;den=(edge*edge).sum(1);t=np.clip(-(x*edge).sum(1)/np.maximum(den,1e-30),0,1);best=np.minimum(best,np.linalg.norm(x+t[:,None]*edge,axis=1))
  selfcheck=audit(p,f,{side:triIds})[side]
  contacts={name:float(np.min(dist[indices])-radius) for name,indices in {**groups['distal'],'palm':groups['palm']}.items()}
  result['sides'][side]={'surfaceMinGapM':float(best.min()-radius),'vertexMinGapM':float(dist[ids].min()-radius),'contacts':contacts,'selfIntersectionPairs':selfcheck['pairs']}
 rows.append(result)
report={'frames':rows,'pass':bool(rows) and all(s['surfaceMinGapM']>=-1e-5 and s['selfIntersectionPairs']==0 and all(-1e-5<=x<=.002 for x in s['contacts'].values()) for row in rows for s in row['sides'].values()),'limits':'Static sampled hand surfaces against an infinite circumscribed cylinder; no claim about plates, forearms or continuous-time collision.'}
a.output.write_bytes((json.dumps(report,indent=2)+'\n').encode());print(json.dumps(report,indent=2));sys.exit(0 if report['pass'] else 1)
