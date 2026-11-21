import json, numpy as np, os
D=os.environ.get('CF_DUMPS','/workspace/work/legacy-fix/b2/dumps')
def load_mesh(path=D+'/mesh.json'):
    npz=path.replace('.json','.npz')
    if os.path.exists(npz) and os.path.getmtime(npz)>os.path.getmtime(path):
        z=np.load(npz,allow_pickle=True);return z['M'].tolist()
    M=json.load(open(path));out=[]
    for m in M:
        n=len(m['pos'])//3
        d=dict(name=m['name'],pos=np.array(m['pos'],np.float64).reshape(n,3),nor=np.array(m['nor'],np.float64).reshape(n,3) if m['nor'] else None,
               si=np.array(m['si'],np.int64).reshape(n,4),sw=np.array(m['sw'],np.float64).reshape(n,4),index=np.array(m['index'],np.int64) if m['index'] else None,
               bind=np.array(m['bindMatrix']).reshape(4,4).T,bones=m['bones'],binv=np.array(m['boneInverses']).reshape(-1,4,4).transpose(0,2,1))
        out.append(d)
    np.savez(npz,M=np.array(out,dtype=object));return out
def h(p,Mx): return p@Mx[:3,:3].T+Mx[:3,3]
def prep(M):
    for m in M:
        m['bpos']=h(m['pos'],m['bind'])  # bind-space world (mesh at origin)
        nb=m['nor']@np.linalg.inv(m['bind'][:3,:3]).T if m['nor'] is not None else np.zeros_like(m['pos'])
        m['bnor']=nb/np.maximum(1e-12,np.linalg.norm(nb,axis=1,keepdims=True))
    return M
def bone_mats(m,sample):
    B=sample['B'];return np.stack([np.array(B[b]).reshape(4,4).T@m['binv'][j] for j,b in enumerate(m['bones'])])
def skin(m,sample,sw=None,si=None):
    sw=m['sw'] if sw is None else sw; si=m['si'] if si is None else si
    BM=bone_mats(m,sample)  # (nb,4,4)
    p=np.c_[m['bpos'],np.ones(len(m['bpos']))]
    out=np.zeros((len(p),3))
    for k in range(4):
        Mk=BM[si[:,k]]  # n,4,4
        out+=sw[:,k:k+1]*np.einsum('nij,nj->ni',Mk[:,:3,:],p)
    MW=np.array(sample['mw']).reshape(4,4).T
    return h(out,MW)

def groin_setup(M):
    m0=M[0];bi=lambda n:np.linalg.inv(m0['binv'][m0['bones'].index(n)])[:3,3]
    pel0=bi('pelvis');L=bi('leftThigh');R=bi('rightThigh');hy=(L[1]+R[1])/2;hx=abs(L[0]-R[0])/2
    GV=[]  # (mesh idx, vertex idx)
    for mi,m in enumerate(M):
        b=m['bpos'];sel=np.where((b[:,1]<hy+0.03)&(b[:,1]>hy-0.14)&(np.abs(b[:,0]-pel0[0])<0.8*hx))[0]
        for i in sel: GV.append((mi,i))
    GV=np.array(GV);B=np.array([M[mi]['bpos'][i]-pel0 for mi,i in GV]);Nn=np.array([M[mi]['bnor'][i] for mi,i in GV])
    # neighbours exactly like audit.mjs (grid cells 0.04, order: offsets a,b,c then cell insertion order)
    cell={};fl=np.floor(B/0.04).astype(int)
    for k in range(len(GV)): cell.setdefault(tuple(fl[k]),[]).append(k)
    NB=[]
    for k in range(len(GV)):
        cx,cy,cz=fl[k];nb=[]
        for a in (-1,0,1):
            for bb in (-1,0,1):
                for c in (-1,0,1):
                    Lst=cell.get((cx+a,cy+bb,cz+c))
                    if Lst:
                        for j in Lst:
                            if j!=k and ((B[j]-B[k])**2).sum()<0.0016: nb.append(j)
        if len(nb)>24:
            st=int(np.ceil(len(nb)/24));nb=[x for jj,x in enumerate(nb) if jj%st==0]
        NB.append(nb)
    return dict(GV=GV,B=B,N=Nn,NB=NB,pel0=pel0,hy=hy,hx=hx)
def bump(M,G,sample,W=None):
    """W: optional dict mesh_idx->(sw,si) overrides; returns (mm, k_at)"""
    P=np.array(sample['B']['pelvis']).reshape(4,4).T;inv=np.linalg.inv(P)
    pos={}
    for mi in np.unique(G['GV'][:,0]):
        m=M[mi];sw,si=(W or {}).get(mi,(None,None));pos[mi]=skin(m,sample,sw,si)
    X=np.array([pos[mi][i] for mi,i in G['GV']]);X=h(X,inv);Dd=X-G['B']
    best=-1e9;at=-1;vals=np.full(len(Dd),np.nan)
    for k,nb in enumerate(G['NB']):
        if len(nb)<6: continue
        v=(Dd[k]-Dd[nb].mean(0))@G['N'][k];vals[k]=v
        if v>best: best=v;at=k
    return best*1000,at,vals
