# r28d = r27b + spin, compromise: head only brought into the same vertical plane as the arms (not ahead of them).
# Small body carry along chest (<=10 cm) + mild neck flexion (<=15 deg); elbows keep their own bend direction; hands fixed.
import json, copy, numpy as np, sys
sys.argv=[sys.argv[0]]
exec(open('/workspace/work/b2000/r28/make_r28b.py').read().split('# neck sign check')[0])
W,P=fk(F[600]); fw=W['torso']@np.array([0,0,1.0]); t=copy.deepcopy(F[600]); setneck(t,F[600],10); W2,P2=fk(t)
SG=1 if (headpt(W2,P2)-headpt(W,P))@fw>0 else -1
S0,S1,E0_,E1_=500,524,716,760
def armz(W,P):
    T=W['torso']; o=P['neck']; return np.mean([(T.T@(P[s+b]-o))[2] for s in ('right','left') for b in ('Forearm','Hand')])
def apply(f,tt,aa):
    W0,P0=fk(F[f]); fh=W0['torso']@np.array([0,0,1.0]); fh[1]=0; fh/=np.linalg.norm(fh)
    fr=copy.deepcopy(F[f]); fr['p']=list(np.round(np.array(F[f]['p'])+fh*tt,5)); setneck(fr,F[f],SG*aa)
    for sd in ('right','left'):
        W,P=fk(fr); ik(fr,sd,P0[sd+'Hand'],W0[sd+'Hand'],P[sd+'Forearm'])
    return fr
T_=np.zeros(N); A_=np.zeros(N)
for f in range(S0,E1_+1,4):
    W,P=fk(F[f]); d0=armz(W,P)-(W['torso'].T@(headpt(W,P)-P['neck']))[2]
    if d0<=0: continue
    best=(1e9,0,0)
    for tt in np.arange(0,0.101,0.02):
        for aa in range(0,16,5):
            fr=apply(f,tt,aa); W2,P2=fk(fr)
            d=armz(W2,P2)-(W2['torso'].T@(headpt(W2,P2)-P2['neck']))[2]
            c=max(0,d)**2+(tt/0.1)**2*0.0015+(aa/15)**2*0.001
            if c<best[0]: best=(c,tt,aa)
    T_[f]=best[1]; A_[f]=best[2]
ks=list(range(S0,E1_+1,4)); T_=np.interp(np.arange(N),ks,T_[ks]); A_=np.interp(np.arange(N),ks,A_[ks])
k=np.hanning(25); k/=k.sum()
Ts=np.convolve(np.pad(T_,12,mode='edge'),k,'valid'); As=np.convolve(np.pad(A_,12,mode='edge'),k,'valid')
env=np.array([sm((f-S0)/(S1-S0))*(1-sm((f-E0_)/(E1_-E0_))) for f in range(N)])
for f in range(S0,E1_+1):
    if env[f]>1e-4: G[f]=apply(f,Ts[f]*env[f],As[f]*env[f])
print('max t cm',round((Ts*env).max()*100,1),'max neck',round((As*env).max(),1))
a['frames']=G; a['name']=a['name'].replace('r27b','r28d')
a['source']+='; r28d: spin head brought into the arms plane (small carry + mild neck), hands fixed'
json.dump(a,open('anim-2000-r28d.json','w'),ensure_ascii=False,separators=(',',':'))
