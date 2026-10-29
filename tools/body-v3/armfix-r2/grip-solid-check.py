"""Read-only finite-dumbbell QA from 17 exported actual CPU-skinned frames.

Usage: python grip-solid-check.py CAPTURE_DIRECTORY OUTPUT.json
A positive axial slab margin is a rigorous sufficient plate/cap separation proof:
all triangle points are convex combinations of vertices between the inner planes.
Failure of this conservative proof is NOT by itself a plate collision witness.
"""
import argparse,hashlib,json,re,sys
from pathlib import Path
import numpy as np
REPO=Path(__file__).resolve().parents[3]
TOL=1e-5

def rod_surface_gap(points,faces,axis,center,radius):
    """Same triangle-interior/edge infinite-cylinder test as grip-check.py."""
    q=points-center;q=q-np.outer(q@axis,axis);dist=np.linalg.norm(q,axis=1);tri=q[faces]
    u=tri[:,1]-tri[:,0];v=tri[:,2]-tri[:,0];w=-tri[:,0]
    uu=(u*u).sum(1);uv=(u*v).sum(1);vv=(v*v).sum(1);uw=(u*w).sum(1);vw=(v*w).sum(1);det=uu*vv-uv*uv;safe=np.abs(det)>1e-20
    b=np.zeros(len(tri));e=b.copy();b[safe]=(uw[safe]*vv[safe]-vw[safe]*uv[safe])/det[safe];e[safe]=(vw[safe]*uu[safe]-uw[safe]*uv[safe])/det[safe]
    inside=safe&(b>=0)&(e>=0)&(b+e<=1);best=np.full(len(tri),np.inf)
    best[inside]=np.linalg.norm(tri[inside,0]+b[inside,None]*u[inside]+e[inside,None]*v[inside],axis=1)
    for j,k in [(0,1),(1,2),(2,0)]:
        x=tri[:,j];edge=tri[:,k]-x;den=(edge*edge).sum(1);t=np.clip(-(x*edge).sum(1)/np.maximum(den,1e-30),0,1)
        best=np.minimum(best,np.linalg.norm(x+t[:,None]*edge,axis=1))
    return float(best.min()-radius),dist-radius

def local_points(world,inverse):
    m=np.array(inverse,dtype=float).reshape(4,4).T
    return (np.c_[world,np.ones(len(world))]@m.T)[:,:3]

def recipe():
    p=REPO/'drill-anim/page/props.js';raw=p.read_bytes();text=raw.decode()
    for expression in [r'len\s*\*\s*0\.55',r'len\s*\*\s*0\.2',r'len\s*\*\s*0\.37',r'CylinderGeometry\(0\.016,\s*0\.016']:
        if not re.search(expression,text):raise ValueError('dumbbell primitive recipe changed; review checker: '+expression)
    return {'path':'drill-anim/page/props.js','lines':[31,32,33],'sha256Lf':hashlib.sha256(raw.replace(b'\r\n',b'\n')).hexdigest(),'rodLengthFraction':.55,'plateCentreFraction':.37,'plateHalfThicknessFraction':.1,'plateSides':6,'rodSides':16}

def audit_capture(capture):
    files=list(capture.glob('input-*.json'));inputs=[]
    for file in files:
        d=json.loads(file.read_bytes());time=float(d['frame'])/float(d['fps']);inputs.append((time,file,d))
    inputs.sort(key=lambda x:x[0]);times=[x[0] for x in inputs]
    if len(times)!=17 or not np.allclose(times,np.arange(17)*.5,rtol=0,atol=1e-10):raise ValueError('require 17 samples at 0..8 seconds by 0.5')
    rows=[];states={'left':[],'right':[]};r=recipe()
    for time,file,d in inputs:
        p=np.asarray(d['mesh']['positionsWorld'],dtype=float).reshape(-1,3);faces=np.asarray(d['mesh']['index'],dtype=int).reshape(-1,3)
        if not np.isfinite(p).all():raise ValueError('nonfinite mesh')
        si=np.asarray(d['mesh']['skinIndex'],dtype=int).reshape(-1,4);sw=np.asarray(d['mesh']['skinWeight'],dtype=float).reshape(-1,4);names=np.array([b['name'] for b in d['mesh']['bones']]);dominant=names[si[np.arange(len(si)),sw.argmax(1)]]
        assigned=np.zeros(len(p),dtype=int);assigned_faces=np.zeros(len(faces),dtype=int);row={'time':time,'file':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'sides':{}}
        for side in ['left','right']:
            # Includes the full wrist collar, even where Forearm dominates.
            mask=np.array([name.startswith(side) or name.startswith('v2p_'+('L' if side=='left' else 'R')+'_') for name in dominant]);ids=np.where(mask)[0];assigned+=mask
            if not len(ids):raise ValueError('empty native hand '+side)
            face_mask=mask[faces].all(1);assigned_faces+=face_mask;tf=faces[face_mask]
            targets=[t for t in d['targets'] if t['side']==side and t['kind']=='rod-cylinder']
            if len(targets)!=1:raise ValueError('one measured dumbbell per hand required')
            t=targets[0];source=t['source'];length=float(source.get('length') or .30);plate=float(source.get('plate') or .055);axis=np.array(t['axisWorld'],dtype=float);center=np.array(t['centerWorld'],dtype=float);radius=float(t['radius'])
            if source.get('type')!='dumbbell' or not np.isclose(length,.30,atol=1e-12) or not np.isclose(plate,.042,atol=1e-12) or not np.isclose(t['length'],length*.55,atol=1e-10) or not np.isclose(radius,.016,atol=1e-12) or not np.isclose(np.linalg.norm(axis),1,atol=1e-8):raise ValueError('unexpected dumbbell source/actual rod dimensions')
            inner=length*(.37-.1);outer=length*(.37+.1);rodhalf=t['length']/2
            axial=(p[ids]-center)@axis;lo=float(axial.min());hi=float(axial.max());negative=lo+inner;positive=inner-hi;slab=negative>0 and positive>0
            rodgap,radial=rod_surface_gap(p,tf,axis,center,radius)
            groups=d['current'][side]['vertexGroups'];contacts={}
            for finger in ['thumb','index','middle','ring','pinky']:
                ix=groups['distal'].get(finger,[])
                if not ix:raise ValueError('missing distal group '+side+' '+finger)
                contacts[finger]=float(radial[ix].min())
            if not groups['palm']:raise ValueError('missing palm group')
            contacts['palm']=float(radial[groups['palm']].min())
            lp=local_points(p[ids],d['current'][side]['handInverseWorld']);lc=local_points(center.reshape(1,3),d['current'][side]['handInverseWorld'])[0]
            localaxis=local_points((center+axis).reshape(1,3),d['current'][side]['handInverseWorld'])[0]-lc
            localradial=lp-lc;localradial-=np.outer(localradial@localaxis,localaxis);localradial=np.linalg.norm(localradial,axis=1)-radius
            localcontacts={name:float(localradial[np.searchsorted(ids,groups['distal'][name] if name!='palm' else groups['palm'])].min()) for name in contacts}
            if max(abs(localcontacts[k]-contacts[k]) for k in contacts)>1e-7:raise ValueError('hand-local/world contact mismatch or unexpected hand scale')
            states[side].append({'world':p[ids],'local':lp,'center':center,'axis':axis,'localCenter':lc,'localAxis':localaxis,'contacts':localcontacts,'pose':d['current'][side]['currentFingerQuaternions']})
            passed=slab and inner<rodhalf and rodgap>=-TOL and all(-TOL<=x<=.002 for x in contacts.values())
            row['sides'][side]={'nativeVerticesIncludingWrist':len(ids),'triangles':len(tf),'sourceLengthM':length,'plateRadiusM':plate,'plateInnerAbsM':inner,'plateOuterAbsM':outer,'rodHalfLengthM':rodhalf,'axialBoundsM':[lo,hi],'negativePlatePlaneGapM':negative,'positivePlatePlaneGapM':positive,'wholeHandStrictlyBetweenPlates':slab,'rodTriangleMinGapM':rodgap,'contactsM':contacts,'pass':passed}
        if not np.all(assigned==1) or not np.all(assigned_faces==1):raise ValueError('native mesh side assignment incomplete or overlapping')
        rows.append(row)
    loops={};local={}
    for side,samples in states.items():
        a,b=samples[0],samples[-1];world=float(np.max(np.linalg.norm(a['world']-b['world'],axis=1)));prop=max(float(np.linalg.norm(a['center']-b['center'])),float(np.linalg.norm(a['axis']-b['axis'])))
        angles=max(abs(x-y) for key,xs in a['pose'].items() for x,y in zip(xs,b['pose'][key]));loops[side]={'worldVertexMaxM':world,'propTransformMax':prop,'fingerQuaternionMax':angles,'pass':max(world,prop,angles)<=1e-7}
        shape=max(float(np.max(np.linalg.norm(x['local']-a['local'],axis=1))) for x in samples);prop_local=max(max(float(np.linalg.norm(x['localCenter']-a['localCenter'])),float(np.linalg.norm(x['localAxis']-a['localAxis']))) for x in samples);drift={k:max(abs(x['contacts'][k]-a['contacts'][k]) for x in samples) for k in a['contacts']}
        local[side]={'handLocalVertexMaxDriftM':shape,'propLocalTransformMaxDrift':prop_local,'contactMaxDriftM':drift,'pass':max(prop_local,max(drift.values()))<=TOL}
    passed=all(x['pass'] for row in rows for x in row['sides'].values()) and all(x['pass'] for x in loops.values()) and all(x['pass'] for x in local.values())
    return {'format':'pose-hub-finite-dumbbell-qa@1','checker':{'path':'tools/body-v3/armfix-r2/grip-solid-check.py','sha256Lf':hashlib.sha256(Path(__file__).read_bytes().replace(b'\r\n',b'\n')).hexdigest()},'pass':passed,'samples':len(rows),'recipe':r,'frames':rows,'loop0to8':loops,'localContact':local,'scope':'Actual exported CPU-skinned native hand triangles, full wrist collar, infinite circumscribed rod cylinder, and rigorous axial slab separation from both finite hexagonal plates and rod end caps.','limits':['Slab proof failure is conservative and does not alone prove a plate intersection.','Hand-local whole-mesh drift includes the forearm-driven wrist collar and is diagnostic only; distal/palm contact drift and prop-local transforms gate pass.','No self-intersection, forearm/body beyond native hand collar, shader displacement, visual acceptance or unsampled continuous-time guarantee.','Source dimensions are checked; plate radial geometry need not be approximated when strict axial separation passes.']}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('capture',type=Path);ap.add_argument('output',type=Path);a=ap.parse_args()
    if a.output.exists():raise SystemExit('Output exists; choose a new report path')
    report=audit_capture(a.capture);a.output.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'pass':report['pass'],'samples':report['samples'],'worstPlateGapMm':min(min(s['negativePlatePlaneGapM'],s['positivePlatePlaneGapM'])*1000 for f in report['frames'] for s in f['sides'].values()),'loopPass':all(x['pass'] for x in report['loop0to8'].values()),'localPass':all(x['pass'] for x in report['localContact'].values()),'report':str(a.output)}));sys.exit(0 if report['pass'] else 1)
if __name__=='__main__':main()
