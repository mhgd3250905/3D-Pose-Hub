# Pose fix r1 recipe edits (only the listed recipes; shared install chain untouched).
#   python3 recipe-edit.py twist <id> [capDeg]        -> opt in to hands-native r6 wrist twist
#   python3 recipe-edit.py spec  <id> <specPath> why  -> point the recipe at a new -sc1/-et1 spec version, refresh LF SHA
import json,hashlib,sys,pathlib,glob
def find(i):
    c=glob.glob(f'catalog/production/remaining219-r1/recipes/{i}.json')+glob.glob(f'catalog/production/remaining32-r4/groups/*/{i}.json')
    assert len(c)==1,(i,c);return pathlib.Path(c[0])
cmd,rid=sys.argv[1],sys.argv[2];p=find(rid);r=json.loads(p.read_text('utf-8'))
fx=r.setdefault('poseFixR1',{'branch':'fix/limb-twist-collision-r1','date':'2026-11-05'})
if cmd=='twist':
    cap=float(sys.argv[3]) if len(sys.argv)>3 else 40
    r['wristTwistRuntime']={'version':'r6','capDeg':cap};fx['wristTwist']={'from':'hands-native-r5 (wrap +-180, uncapped)','to':f'hands-native-r6 (continuous, cap {cap:g} deg)'}
elif cmd=='spec':
    spec,why=sys.argv[3],sys.argv[4];old=r['spec'];r['spec']=spec
    r['specSha256Lf']=hashlib.sha256(pathlib.Path(spec).read_bytes().replace(b'\r\n',b'\n')).hexdigest()
    if isinstance(r.get('source'),dict) and 'selectedSpec' in r['source']:r['source']['selectedSpec']=spec
    fx.setdefault('spec',[]).append({'from':old,'to':spec,'why':why})
p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n','utf-8');print(rid,cmd,'ok')
