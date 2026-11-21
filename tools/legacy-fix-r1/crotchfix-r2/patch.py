import numpy as np, json
def quant(sw):
    q=np.floor(sw*255).astype(int);rem=255-q.sum(1)
    fr=sw*255-q;o=np.argsort(-fr,axis=1)
    for r in range(4):
        add=(rem>r);np.add.at(q,(np.where(add)[0],o[add,r]),1)
    return q
def make_patch(M,g,Wn,params,version='crotchfix-v5-r1'):
    m=M[g['mi']];Wv=Wn[g['inv']]
    si=np.argsort(-Wv,axis=1,kind='stable')[:,:4];sw=np.take_along_axis(Wv,si,1);sw/=sw.sum(1,keepdims=True)
    q=quant(sw);si[q==0]=0
    # canonical original for comparison
    oq=np.round(m['sw']*255).astype(int);osi=m['si'].copy()
    def canon(si_,q_):
        W=np.zeros((len(si_),len(m['bones'])),int)
        for k in range(4): np.add.at(W,(np.arange(len(si_)),si_[:,k]),q_[:,k])
        return W
    changed=np.where((canon(si,q)!=canon(osi,oq)).any(1))[0]
    nsi=osi.copy();nq=oq.copy();nsi[changed]=si[changed];nq[changed]=q[changed]
    cs=0
    for i in changed:
        for c in range(4): cs+=int((i%97+1)*(c+1)*int(round(m['sw'][i,c]*1000))*(int(m['si'][i,c])+1))
    V=[]
    for i in changed: V+= [int(i)]+[int(x) for x in nsi[i]]+[int(x) for x in nq[i]]
    patch=dict(format='v5-crotchfix-weights@1',version=version,model='tools/v5/runtime/model/coach-v3r3-wristfix.glb',modelMd5='68dcdd9847ab6ea2d6fdce14c2ad4480',
               mesh=m['name'],vertexCount=len(m['pos']),bones=m['bones'],params=params,origChecksum=cs,count=len(changed),v=V)
    return patch,(nq/255.0,nsi)
