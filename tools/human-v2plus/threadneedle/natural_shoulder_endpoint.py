"""Bounded natural-shoulder endpoint fit using captured skin palettes.

Preserves knees, support wrist, threading wrist, segment lengths and original
shoulder-support goal. This is CPU diagnosis until actual runtime validation.
"""
import argparse,json,sys
from pathlib import Path
import numpy as np
from scipy.optimize import least_squares
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).parent))
from audit_recovered_shoulder import P,B,C,Rot,p,inspect
from runtime_skin import load_capture

models=load_capture('../actual-rest-matrices-normalized.json')
pivots={r['name']:r['pivot']for r in json.load(open('posehub_v2plus_20261021/runtime/public/coach/coach-rig.json'))['bones']}
for name in ['Torso','Limbs','Mesh005']:models[name].use_canonical_frame(pivots)

def geometry(v):
    b,z,tw,theta,phi=v;x=P.G['x'].copy();x[:2]=b,z
    j,T,reach,_=C.make(x,twist=tw);Qt=T['torso'][0]
    Qs=Qt@B.rz(theta)@B.ry(-phi);sh=B.apply(T['torso'],B.rig['torso'])+Qs@(B.rig['leftShoulder']-B.rig['torso'])
    W=P.FINAL[-1,5:8].copy();u=W-sh;u/=np.linalg.norm(u)
    vdown=np.array([0.,-1.,0.]);vdown-=u*(vdown@u);vdown/=np.linalg.norm(vdown)
    pole=np.cos(np.deg2rad(89.21228156))*vdown+np.sin(np.deg2rad(89.21228156))*np.cross(u,vdown)
    el,wr,over=B.two_bone(sh,W,P.G['L1'],P.G['L2'],sh+pole)
    j.update(leftShoulder=sh,leftElbow=el,leftWrist=wr);T=B.bone_tf(j,Qt);T['leftScapula']=(Qs,sh-Qs@B.rig['leftShoulder'])
    Qbase=T['leftUpperArm'][0];fore=(wr-el)@Qbase;fore/=np.linalg.norm(fore)
    roll=np.arctan2(-np.cross(C.axis,fore)[2],fore[2]-C.axis[2]*np.dot(C.axis,fore))
    Q=Qbase@Rot.from_rotvec(C.axis*roll).as_matrix();T['leftUpperArm']=(Q,sh-Q@B.rig['leftShoulder'])
    tv=models['Torso'].points(T);lv=models['Limbs'].points(T);ov=models['Mesh005'].points(T);hv=B.apply(T['torso'],B.headbind)
    waist=float(Rot.from_matrix(B.rz(z)@B.QP@B.ry(tw)@B.QP.T).magnitude()*180/np.pi)
    return dict(j=j,T=T,tv=tv,lv=lv,ov=ov,hv=hv,reach=reach,over=over,waist=waist,roll=roll)

def residual(v):
    s=geometry(v);tv,lv,hv=s['tv'],s['lv'],s['hv']
    return np.r_[1000*(tv[C.smask,1].min()-.001),
                 4000*max(-.001-tv[:,1].min(),0),
                 2000*max(-.001-lv[:,1].min(),0),
                 1000*max(.003-hv[:,1].min(),0),
                 1000*max(s['over']+.008,0),
                 2*max(s['waist']-44.5,0),
                 .003*np.array([v[0]+37.57,v[1]-26.99,v[2]+25,v[3],v[4]])]

def main():
    a=argparse.ArgumentParser();a.add_argument('--output',required=True);args=a.parse_args();out=Path(args.output)
    if out.exists():raise FileExistsError(out)
    initial=np.array([-37.571187757,26.989542862,-25.,0.,0.])
    fit=least_squares(residual,initial,bounds=([-65,-10,-65,-5,0],[-10,40,-5,30,30]),max_nfev=80,diff_step=1e-4,xtol=1e-8,ftol=1e-8,gtol=1e-8)
    s=geometry(fit.x);X=np.vstack([s['tv'],s['ov']]);r=inspect('natural-shoulder-bounded-endpoint',X)
    r.update(params=fit.x.tolist(),variables=['body_deg','waist_world_z_deg','chest_twist_deg','shoulder_elevation_deg','shoulder_protraction_deg'],nfev=fit.nfev,solverSuccess=bool(fit.success),residual=residual(fit.x).tolist(),waistDegrees=s['waist'],upperArmRollDegrees=float(np.rad2deg(s['roll'])),shoulderBand=C.tri_band(s['tv'],B.torso.ix,C.smask),joints={k:v.tolist()for k,v in s['j'].items()},floorMm={'torso':float(s['tv'][:,1].min()*1000),'limbs':float(s['lv'][:,1].min()*1000),'head':float(s['hv'][:,1].min()*1000)},status='CPU_ENDPOINT_ONLY_NOT_ACCEPTED')
    out.write_text(json.dumps(r,indent=2),encoding='utf-8');np.savez_compressed(out.with_suffix('.npz'),positions=X,faces=p['F'])
    print(json.dumps({k:v for k,v in r.items()if k!='joints'}),flush=True)

if __name__=='__main__':main()
