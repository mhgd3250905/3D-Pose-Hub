"""Evaluate the actual runtime source, actual saved geometry and dense track.

The actual displayed meshes are exported by the dedicated preview entry. This
checker evaluates their calibrated palettes independently with NumPy/SciPy.
Run from the recovered CPU workspace (strict triangle test is hash-verified).
"""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import argparse,json,sys
from pathlib import Path
import numpy as np
from scipy.spatial.transform import Rotation
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).parent))
from audit_recovered_shoulder import B,C,selected,strict_pairs
from dual_quaternion_diagnosis import mul

def frame(f,n):
    f=np.array(f,float);n=np.array(n,float);f/=np.linalg.norm(f);n-=f*(f@n);n/=np.linalg.norm(n)
    return np.column_stack([np.cross(f,n),f,n])

class Mesh:
    def __init__(self,d):
        self.name=d['name'];self.names=d['bones'];self.J=np.array(d['joints']).reshape(-1,4).astype(int);self.W=np.array(d['weights']).reshape(-1,4)
        self.bind=np.array(d['bindPositions']).reshape(-1,3);self.hom=np.c_[self.bind,np.ones(len(self.bind))]
        self.palette=np.array(d['palette']).reshape(-1,4,4).transpose(0,2,1);self.faces=np.array(d['faces']).reshape(-1,3)
        self.dq=(self.W*np.isin(np.array(self.names)[self.J],['leftScapula','leftUpperArm','leftForearm'])).sum(1)>0
        if self.name=='Hands':self.dq[:]=True
        self.canonical=(self.hom@self.palette[0].T)[:,:3]
        self.side={s:(self.W*np.array([[n.startswith(s)or n.startswith('v2p_'+s[0].upper()+'_')for n in np.array(self.names)[js]]for js in self.J])).sum(1)>0 for s in ['left','right']}
    def points(self,T):
        Q=np.array([T.get(n,(np.eye(3),np.zeros(3)))[0]for n in self.names]);t=np.array([T.get(n,(np.eye(3),np.zeros(3)))[1]for n in self.names])
        X=np.zeros_like(self.bind)
        for k in range(4):
            x=np.einsum('nij,nj->ni',self.palette[self.J[:,k]],self.hom)[:,:3]
            X+=self.W[:,k,None]*(np.einsum('nij,nj->ni',Q[self.J[:,k]],x)+t[self.J[:,k]])
        ids=np.flatnonzero(self.dq)
        if len(ids):
            qr=Rotation.from_matrix(Q).as_quat();qd=.5*mul(np.c_[t,np.zeros(len(t))],qr);J=self.J[ids];W=self.W[ids];ref=qr[J[np.arange(len(J)),W.argmax(1)]]
            sign=np.where(np.einsum('nki,ni->nk',qr[J],ref)<0,-1.,1.);w=W*sign;r=(qr[J]*w[:,:,None]).sum(1);d=(qd[J]*w[:,:,None]).sum(1)
            norm=np.linalg.norm(r,axis=1)[:,None];r/=norm;d/=norm;d-=r*np.sum(r*d,axis=1)[:,None];conj=r.copy();conj[:,:3]*=-1
            X[ids]=Rotation.from_quat(r).apply(self.canonical[ids])+2*mul(d,conj)[:,:3]
        return X

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--preview',required=True);ap.add_argument('--profile',required=True);ap.add_argument('--out',required=True);ap.add_argument('--dense',action='store_true');a=ap.parse_args();out=Path(a.out)
    if out.exists():raise FileExistsError(out)
    preview,profile=Path(a.preview),Path(a.profile);data=json.loads((profile/'trajectory.json').read_text());meshes={d['name']:Mesh(d)for d in json.loads((preview/'calibration.json').read_text())}
    rig=json.loads((profile.parent/'hands-native-r3/hands-rig.json').read_text());tip=np.array(rig['fingers']['middle']['joints'][-1]);refs={s:frame(tip*np.array([1 if s=='left'else -1,1,1]),rig['palmar'])for s in ['left','right']}
    nt=len(meshes['Torso'].bind);Fraw=np.vstack([meshes['Torso'].faces,meshes['Mesh005'].faces+nt]);weld=np.arange(nt+len(meshes['Mesh005'].bind))
    for i,owner in data['weld']:weld[i]=owner
    F=weld[Fraw];outside=np.setdiff1d(np.arange(len(F)),selected)
    local=np.flatnonzero(np.isin(F,[2774,10956,18483]).any(1));edgeFaces={}
    for fi,face in enumerate(F[local]):
        for u,w in zip(face,np.roll(face,1)):edgeFaces.setdefault(tuple(sorted((int(u),int(w)))),[]).append(fi)
    adjacent=np.array([ids for ids in edgeFaces.values()if len(ids)==2])
    def local_shape(Z):
        tri=Z[F[local]];normal=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);area=np.linalg.norm(normal,axis=1);normal/=area[:,None]
        angles=np.degrees(np.arccos(np.clip((normal[adjacent[:,0]]*normal[adjacent[:,1]]).sum(1),-1,1)))
        return dict(faces=local.tolist(),minimumDoubleAreaM2=float(area.min()),maximumDihedralDegrees=float(angles.max()),p95DihedralDegrees=float(np.percentile(angles,95)))
    canonical=np.vstack([meshes['Torso'].canonical,meshes['Mesh005'].canonical]);restShape=local_shape(canonical[weld])
    def evaluate(row):
        T={n:(Rotation.from_quat(b['q']).as_matrix(),np.array(b['t']))for n,b in row['bones'].items()}
        for side in ['left','right']:
            Q=frame(row['leftFinger']if side=='left'else[1,0,0],[0,1 if side=='left'else-1,0])@refs[side].T
            axis=np.array(row['leftFinger']if side=='left'else[1,0,0]);Q=Rotation.from_rotvec(axis*np.deg2rad(data['leftPalmRollDegrees']if side=='left'else data['rightPalmRollDegrees'])).as_matrix()@Q
            T[side+'Hand']=(Q,np.array(row['joints'][side+'Wrist'])-Q@np.array(data['pivots'][side+'Hand']))
        for m in meshes.values():
            for n in m.names:
                if n.startswith('v2p_'):T[n]=T['leftHand'if n.startswith('v2p_L_')else'rightHand']
        X={n:m.points(T)for n,m in meshes.items()};Z=np.vstack([X['Torso'],X['Mesh005']]);original=Z.copy()
        seam=max(np.linalg.norm(Z[i]-Z[owner])for i,owner in data['weld'])
        if seam>1e-6:raise ValueError('Actual source seam mismatch '+str(seam))
        for d in data['fair']:Z[d['vertex']]=(1-row['fairAmount'])*Z[d['vertex']]+row['fairAmount']*Z[d['neighbors']].mean(0)
        Z=Z[weld]
        X['Torso']=Z[:nt];X['Mesh005']=Z[nt:]
        return X,Z,float(np.linalg.norm(Z-original,axis=1).max()*1000),float(seam*1000)
    def faces(n,side,kind):
        m=meshes[n];names=np.array(m.names)[m.J]
        mask=(m.W*np.isin(names,[side+'UpperArm',side+'Forearm'])).sum(1)>0 if kind=='arm'else m.side[side]
        return m.faces[mask[m.faces].all(1)]
    arms={s:{n:faces(n,s,'arm')for n in ['Torso','Limbs']}for s in ['left','right']};hands={s:faces('Hands',s,'hand')for s in ['left','right']}
    posefiles=sorted(preview.glob('geometry-*.json'));replay=[]
    for file in posefiles:
        actual=json.loads(file.read_text());X,_,_,_=evaluate(actual['row']);errs={m['name']:float(np.linalg.norm(X[m['name']]-np.array(m['points']).reshape(-1,3),axis=1).max()*1000)for m in actual['meshes']}
        replay.append(dict(frame=actual['row']['frame'],maxErrorMm=max(errs.values()),byMesh=errs))
    frames=range(241)if a.dense else sorted({0,30,40,50,60,70,80,90,150,174,200,210,240})
    results=[];cache={}
    for f in frames:
        row=data['track'][f];key=round(row['q'],12)
        if key in cache:
            results.append({**cache[key],'frame':f,'q':row['q']});continue
        X,Z,delta,seam=evaluate(row);si,sh,cp=strict_pairs(Z,F[selected],F[selected],True);ex,_,cp2=strict_pairs(Z,F[selected],F[outside])
        rawsi,rawsh,rawcp=strict_pairs(Z,Fraw[selected],Fraw[selected],True);rawex,_,rawcp2=strict_pairs(Z,Fraw[selected],Fraw[outside])
        sur={'torso':X['Torso'][meshes['Torso'].faces],'head':X['Toon_Mannequin_Head_v5'][meshes['Toon_Mannequin_Head_v5'].faces]}
        for side in ['left','right']:
            sur[side+'_arm']=np.concatenate([X[n][arms[side][n]]for n in ['Torso','Limbs']]);sur[side+'_hand']=X['Hands'][hands[side]]
        pairs=[('left_arm','head'),('left_arm','right_arm'),('left_hand','head'),('left_hand','torso'),('left_hand','right_arm'),('left_hand','right_hand'),('right_hand','head'),('right_hand','torso'),('right_hand','left_arm')]
        collisions={aa+'|'+bb:B.collision(sur[aa],sur[bb])['hits']for aa,bb in pairs}
        handself={s:len(strict_pairs(X['Hands'],hands[s],hands[s],True)[0])for s in ['left','right']}
        floor={n:float(x[np.unique(meshes[n].faces),1].min()*1000)for n,x in X.items()}
        mm=meshes['Hands'];palm=(mm.W*(np.array(mm.names)[mm.J]=='rightHand')).sum(1)>.85
        support=C.tri_band(X['Hands'],mm.faces,palm)
        lengths={}
        for side in ['left','right']:
            for aa,bb in [('Shoulder','Elbow'),('Elbow','Wrist'),('Hip','Knee'),('Knee','Ankle')]:
                actual=np.linalg.norm(np.array(row['joints'][side+aa])-np.array(row['joints'][side+bb]));original=np.linalg.norm(B.j0[side+aa]-B.j0[side+bb]);lengths[side+aa+'-'+bb]=float((actual-original)*1000)
        r=dict(frame=f,q=row['q'],internal=len(si),external=len(ex),shared=int((sh>0).sum()),coplanar=cp+cp2,
            rawUnwelded=dict(internal=len(rawsi),external=len(rawex),shared=int((rawsh>0).sum()),coplanar=rawcp+rawcp2),
            sourceAliasErrorMm=seam,fairMaxMm=delta,localShoulderShape=local_shape(Z),floorsMm=floor,collisions=collisions,handSelf=handself,rightPalmBand=support,boneLengthDeltaMm=lengths)
        results.append(r);cache[key]=r;print(json.dumps(r),flush=True)
    report=dict(kind='independent-CPU-replay-of-actual-displayed-runtime-source',dense=a.dense,replay=replay,frames=results,
        repeatedPoseCache='q rounded at 1e-12; all integer render frames represented when dense=true',uniquePoses=len(cache),
        restLocalShoulderShape=restShape,reviewed=False,releaseEligible=False)
    out.write_text(json.dumps(report,indent=2),encoding='utf-8')
if __name__=='__main__':main()
