"""Check the authored 28-point ankle seams in reset and posed snapshots."""
import argparse,base64,hashlib,json
from pathlib import Path
import numpy as np

p=argparse.ArgumentParser(description=__doc__);p.add_argument('audit_dir',type=Path);p.add_argument('seam_json',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
if a.output.exists():raise FileExistsError(a.output)
seam=json.loads(a.seam_json.read_text(encoding='utf8'))['seam'];out={'seamSha256':hashlib.sha256(a.seam_json.read_bytes()).hexdigest(),'states':{}}
for state in ['rest','plank']:
    path=a.audit_dir/(state+'.json');meshes=json.loads(path.read_text(encoding='utf8'))['meshes'];xyz={}
    for name in ['Coach_Body','V2P_Base_Limbs']:
        m=meshes[name];xyz[name]=(np.frombuffer(base64.b64decode(m['A']),np.float32).reshape(-1,6)[:,:3].astype(float),set(m['idx']))
    out['states'][state]={'snapshotSha256':hashlib.sha256(path.read_bytes()).hexdigest()}
    for side in ['left','right']:
        rows=[(seam['vid'][i],seam['first']+i) for i,r in enumerate(seam['ring']) if r=='ankle_'+side and seam['mesh'][i]=='Coach_Body']
        if len(rows)!=28:raise ValueError(f'unexpected seam identity count {side}: {len(rows)}')
        b,l=xyz['Coach_Body'],xyz['V2P_Base_Limbs'];ds=np.array([np.linalg.norm(b[0][i]-l[0][j])*1000 for i,j in rows]);used=sum(i in b[1] and j in l[1] for i,j in rows)
        out['states'][state][side]={'authoredPairs':len(rows),'bothReferencedByIndex':used,'gapMmMax':float(ds.max()),'pairs':rows}
with a.output.open('x',encoding='utf8') as f:json.dump(out,f,indent=2)
print(json.dumps({s:{x:{k:v for k,v in y.items() if k!='pairs'} for x,y in d.items() if x!='snapshotSha256'} for s,d in out['states'].items()},indent=2))
