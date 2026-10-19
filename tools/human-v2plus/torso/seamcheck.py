# offline check: dihedral angle across each weld (torso face vs neighbouring existing face), rest pose. Run in the build workdir.
from common import *
from meshops import *
d=np.load('final.npz'); V,F,N=d['V'],d['F'],d['N']; nMC=int(d['nMC']); z=np.load('fair.npz',allow_pickle=True); seam=z['seam']
fn=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]); fn/=np.linalg.norm(fn,axis=1,keepdims=True)
emap={}
for fi,f in enumerate(F):
    for a,b in ((f[0],f[1]),(f[1],f[2]),(f[2],f[0])): emap[(min(a,b),max(a,b))]=fi
res={}
for mesh in (TEE,BODY):
    Fm=np.array(M[mesh]['index']).reshape(-1,3); inv,first=weld(P[mesh]); keep=z['keepT'] if mesh==TEE else z['keepB']; Fk=Fm[keep]; Pm=P[mesh]
    fnm=np.cross(Pm[Fk[:,1]]-Pm[Fk[:,0]],Pm[Fk[:,2]]-Pm[Fk[:,0]]); fnm/=np.maximum(np.linalg.norm(fnm,axis=1,keepdims=True),1e-12)
    Fw=inv[Fk]; em={}
    for fi,f in enumerate(Fw):
        for a,b in ((f[0],f[1]),(f[1],f[2]),(f[2],f[0])): em[(min(a,b),max(a,b))]=fi
    groups={}
    for k,s in enumerate(seam):
        if s[1]==mesh: groups.setdefault(s[0],[]).append(k)
    for name,ks in groups.items():
        angs=[]
        for i in range(len(ks)):
            k1,k2=ks[i],ks[(i+1)%len(ks)]; a,b=nMC+k1,nMC+k2
            ft=emap.get((min(a,b),max(a,b))); wa,wb=inv[int(seam[k1][2])],inv[int(seam[k2][2])]; fm=em.get((min(wa,wb),max(wa,wb)))
            if ft is None or fm is None: continue
            angs.append(np.degrees(np.arccos(np.clip(fn[ft]@fnm[fm],-1,1))))
        angs=np.array(angs); res[name]=(len(angs),angs.mean().round(1),np.percentile(angs,90).round(1),angs.max().round(1))
print('dihedral across seam (deg): n, mean, p90, max'); [print(k,v) for k,v in res.items()]
