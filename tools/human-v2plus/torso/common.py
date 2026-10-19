# shared inputs for the sculpted-torso build (tools/human-v2plus/torso/build.sh): the v2 rest dump from probe.mjs and the
# compression outfit (its tightened tee/shorts are the shape scaffold).
import json, os, numpy as np, collections
REPO=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../..'))
REST=os.environ.get('HV2P_REST',os.path.join(REPO,'output/human-v2plus-work/rest.json'))
OUTF=os.environ.get('HV2P_OUTFIT',os.path.join(REPO,'drill-anim/models/training-human-v2plus-outfit.json'))
rest=json.load(open(REST)); M=rest['meshes']; outfit=json.load(open(OUTF))
def arr(k,f,c=3): return np.array(M[k][f],dtype=np.float64).reshape(-1,c)
TEE,TRIM,SH,BODY='Mesh005','Mesh005_1','Coach_Training_Shorts','Coach_Body'
P={k:arr(k,'P') for k in (TEE,TRIM,SH,BODY,'Mesh001')}
PC={}
for k in (TEE,TRIM,SH):
    Q=P[k].copy(); D=outfit['meshes'][k]; idx=np.array(D['idx']); d=np.array(D['d']).reshape(-1,3)*1e-5; Q[idx]+=d; PC[k]=Q
def bone_mass(k,pat):
    J=arr(k,'J',4).astype(int); W=arr(k,'W',4); names=M[k]['bones']
    hit=np.array([any(p in n for p in pat) for n in names]); return (W*hit[J]).sum(1)
def weld(Pt):
    key=np.round(Pt/2e-5).astype(np.int64); u,idx,inv=np.unique(key,axis=0,return_index=True,return_inverse=True); return inv.ravel(),idx
def boundary_loops(k, Pt=None):
    Pt=P[k] if Pt is None else Pt; F=np.array(M[k]['index']).reshape(-1,3); inv,first=weld(P[k])
    Fw=inv[F]; E=np.concatenate([Fw[:,[0,1]],Fw[:,[1,2]],Fw[:,[2,0]]])
    Es=np.sort(E,1); uu,c=np.unique(Es,axis=0,return_counts=True); bset=set(map(tuple,uu[c==1]))
    nxt={}
    for a,b in E:
        if (min(a,b),max(a,b)) in bset: nxt[a]=b
    loops=[]; seen=set()
    for s in nxt:
        if s in seen: continue
        L=[s]; seen.add(s); x=nxt[s]
        while x!=s and x not in seen: L.append(x); seen.add(x); x=nxt.get(x,s)
        loops.append([int(first[i]) for i in L])   # original vertex ids (first duplicate)
    return loops
