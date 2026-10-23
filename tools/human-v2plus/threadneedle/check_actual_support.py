"""Supplement dense replay with contacts on the 13 actual captured surfaces."""
import os
os.environ['OPENBLAS_NUM_THREADS']='1'
import argparse,json,sys
from pathlib import Path
import numpy as np
sys.dont_write_bytecode=True
sys.path.insert(0,str(Path(__file__).parent))
from audit_recovered_shoulder import B,C
sys.path.insert(0,str(Path(__file__).parent))
from check_candidate import Mesh

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--preview',required=True);ap.add_argument('--profile',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
    out=Path(a.out)
    if out.exists():raise FileExistsError(out)
    directory=Path(a.preview);data=json.loads((Path(a.profile)/'trajectory.json').read_text());meshes={d['name']:Mesh(d)for d in json.loads((directory/'calibration.json').read_text())}
    torso,limbs,hands=[meshes[n]for n in ['Torso','Limbs','Hands']]
    mask=np.linalg.norm(torso.canonical-np.array(data['pivots']['leftScapula']),axis=1)<.08
    armNames=['leftUpperArm','leftForearm','rightUpperArm','rightForearm'];core=(torso.W*np.isin(np.array(torso.names)[torso.J],armNames)).sum(1)==0
    corefaces=torso.faces[core[torso.faces].all(1)]
    armfaces={}
    for side in ['left','right']:
        armfaces[side]={}
        for n,m in [('Torso',torso),('Limbs',limbs)]:
            active=(m.W*np.isin(np.array(m.names)[m.J],[side+'UpperArm',side+'Forearm'])).sum(1)>0
            armfaces[side][n]=m.faces[active[m.faces].any(1)]
    rows=[]
    for file in sorted(directory.glob('geometry-*.json')):
        capture=json.loads(file.read_text());X={m['name']:np.array(m['points']).reshape(-1,3)for m in capture['meshes']};j={n:np.array(v)for n,v in capture['row']['joints'].items()}
        la=np.concatenate([X[n][armfaces['left'][n]]for n in ['Torso','Limbs']]);ra=np.concatenate([X[n][armfaces['right'][n]]for n in ['Torso','Limbs']]);head=X['Toon_Mannequin_Head_v5'][meshes['Toon_Mannequin_Head_v5'].faces]
        knee={}
        for side in ['left','right']:
            km=np.linalg.norm(limbs.canonical-np.array(data['pivots'][side+'Patella']),axis=1)<.06
            knee[side]=C.tri_band(X['Limbs'],limbs.faces,km)
        aa=j['leftElbow'][[0,2]];da=(j['leftWrist']-j['leftElbow'])[[0,2]];bb=j['rightShoulder'][[0,2]];db=(j['rightElbow']-j['rightShoulder'])[[0,2]]
        cross=np.linalg.lstsq(np.c_[da,-db],bb-aa,rcond=None)[0];gap=(j['rightShoulder']+cross[1]*(j['rightElbow']-j['rightShoulder']))[1]-(j['leftElbow']+cross[0]*(j['leftWrist']-j['leftElbow']))[1]
        rows.append(dict(frame=capture['row']['frame'],q=capture['row']['q'],shoulderBand=C.tri_band(X['Torso'],torso.faces,mask),kneeBands=knee,
            armHeadAnyInfluence=B.collision(la,head)['hits'],armsAnyInfluence=B.collision(la,ra)['hits'],forearmTorsoCore=B.collision(X['Limbs'][armfaces['left']['Limbs']],X['Torso'][corefaces])['hits'],
            threadIntersection=cross.tolist(),threadVerticalGapMm=float(gap*1000),leftWrist=j['leftWrist'].tolist(),leftShoulder=j['leftShoulder'].tolist()))
    out.write_text(json.dumps(dict(kind='actual-surface-support-and-boundary-arm-check',frames=rows),indent=2),encoding='utf-8')
    print(json.dumps(rows),flush=True)
if __name__=='__main__':main()
