"""Coordinate a reachable threading endpoint with volume-preserving shoulder skin.

Single bounded pose family; fixed knees and right support wrist, adjustable
threading wrist, body and scapula. All outputs remain diagnostic until replay.
"""
import argparse,json,sys
from pathlib import Path
import numpy as np
from scipy.optimize import least_squares
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).parent))
from natural_shoulder_endpoint import models,P,B,C,Rot,p,inspect
from dual_quaternion_diagnosis import points

INITIAL=np.array([-37.57,26.99,-25.,10.,12.,.33,.045,.29,89.,0.])

def geometry(v):
    b,z,tw,theta,phi,wx,wy,wz,alpha,rolladd=v
    x=P.G['x'].copy();x[:2]=b,z;j,T,reach,_=C.make(x,twist=tw);Qt=T['torso'][0]
    Qs=Qt@B.rz(theta)@B.ry(-phi)
    sh=B.apply(T['torso'],B.rig['torso'])+Qs@(B.rig['leftShoulder']-B.rig['torso'])
    W=np.array([wx,wy,wz]);u=W-sh;u/=np.linalg.norm(u)
    down=np.array([0.,-1.,0.]);down-=u*(down@u);down/=np.linalg.norm(down)
    pole=np.cos(np.deg2rad(alpha))*down+np.sin(np.deg2rad(alpha))*np.cross(u,down)
    el,wr,over=B.two_bone(sh,W,P.G['L1'],P.G['L2'],sh+pole)
    j.update(leftShoulder=sh,leftElbow=el,leftWrist=wr);T=B.bone_tf(j,Qt)
    T['leftScapula']=(Qs,sh-Qs@B.rig['leftShoulder'])
    Qbase=T['leftUpperArm'][0];fore=(wr-el)@Qbase;fore/=np.linalg.norm(fore)
    roll=np.arctan2(-np.cross(C.axis,fore)[2],fore[2]-C.axis[2]*np.dot(C.axis,fore))+np.deg2rad(rolladd)
    Q=Qbase@Rot.from_rotvec(C.axis*roll).as_matrix();T['leftUpperArm']=(Q,sh-Q@B.rig['leftShoulder'])
    tv=points(models['Torso'],T);lv=points(models['Limbs'],T);ov=points(models['Mesh005'],T);hv=B.apply(T['torso'],B.headbind)
    waist=float(Rot.from_matrix(B.rz(z)@B.QP@B.ry(tw)@B.QP.T).magnitude()*180/np.pi)
    # XZ intersection of threading forearm and the supporting upper arm.
    a=el[[0,2]];da=(wr-el)[[0,2]];b0=j['rightShoulder'][[0,2]];db=(j['rightElbow']-j['rightShoulder'])[[0,2]]
    cross=np.linalg.lstsq(np.c_[da,-db],b0-a,rcond=None)[0]
    gap=(j['rightShoulder']+cross[1]*(j['rightElbow']-j['rightShoulder']))[1]-(el+cross[0]*(wr-el))[1]
    return dict(j=j,T=T,tv=tv,lv=lv,ov=ov,hv=hv,over=over,waist=waist,roll=roll,cross=cross,gap=gap)

def residual(v):
    s=geometry(v);tv,lv,hv=s['tv'],s['lv'],s['hv']
    return np.r_[1000*(tv[C.smask,1].min()-.001),
        4000*max(-.0005-tv[:,1].min(),0),2000*max(-.0005-lv[:,1].min(),0),
        1000*max(.005-hv[:,1].min(),0),1000*max(s['over']+.012,0),
        3*max(s['waist']-44.,0),30*np.maximum(-s['cross']+.05,0),
        30*np.maximum(s['cross']-.95,0),1000*max(.05-s['gap'],0),
        .01*(v[:5]-INITIAL[:5]),.5*(v[5:8]-INITIAL[5:8]),.003*(v[8:]-INITIAL[8:])]

def main():
    global INITIAL
    ap=argparse.ArgumentParser();ap.add_argument('--output',required=True);ap.add_argument('--from-archive',action='store_true');a=ap.parse_args();out=Path(a.output)
    if out.exists():raise FileExistsError(out)
    if a.from_archive:INITIAL=np.array([-37.571187757,26.989542862,-25.,25.,24.,.30,.028980476285,.34,89.21228156,25.])
    fit=least_squares(residual,INITIAL,bounds=([-60,-5,-60,-5,0,.20,.025,.20,40,-30],[-15,40,-10,30,30,.50,.09,.38,140,30]),max_nfev=100,diff_step=1e-4,x_scale='jac')
    s=geometry(fit.x);X=np.vstack([s['tv'],s['ov']]);r=inspect('reachable-volume-preserving-endpoint',X)
    r.update(params=fit.x.tolist(),nfev=fit.nfev,residual=residual(fit.x).tolist(),overMm=s['over']*1000,waistDegrees=s['waist'],threadIntersection=s['cross'].tolist(),threadVerticalGapMm=s['gap']*1000,
        shoulderBand=C.tri_band(s['tv'],B.torso.ix,C.smask),joints={k:v.tolist()for k,v in s['j'].items()},
        floorMm={k:float(s[k][:,1].min()*1000)for k in ['tv','lv','hv']},status='CPU_ENDPOINT_ONLY_NOT_ACCEPTED')
    out.write_text(json.dumps(r,indent=2),encoding='utf-8');np.savez_compressed(out.with_suffix('.npz'),positions=X,faces=p['F'])
    print(json.dumps({k:v for k,v in r.items()if k!='joints'}),flush=True)

if __name__=='__main__':main()
