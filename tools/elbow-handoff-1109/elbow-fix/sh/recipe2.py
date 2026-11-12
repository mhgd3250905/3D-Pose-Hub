import json,sys,hashlib,re
# python3 recipe2.py id new_spec_rel why_file   -> rewrites recipe spec/sha/selectedSpec and the elbowTwistFix block (r2)
R='/workspace/work/elbow-scan-wt/'
id,new,whyf=sys.argv[1:4]
rf=json.load(open('/workspace/work/elbow-fix/recipes.json'))[id]
txt=open(rf,encoding='utf8').read();rec=json.loads(txt)
e=rec['elbowTwistFix'];cur=rec['spec']
code=open(R+new,encoding='utf8').read().replace('\r\n','\n');sha=hashlib.sha256(code.encode()).hexdigest()
T=txt.replace(f'"spec": "{cur}"',f'"spec": "{new}"',1).replace(f'"specSha256Lf": "{rec["specSha256Lf"]}"',f'"specSha256Lf": "{sha}"',1)
if rec.get('source',{}).get('selectedSpec')==cur: T=T.replace(f'"selectedSpec": "{cur}"',f'"selectedSpec": "{new}"',1)
blk={'branch':'codex/elbow-twist-r1','date':'2026-11-09','from':e['from'],'to':new,'supersedes':e['to'],
     'why':open(whyf,encoding='utf8').read().strip(),'reviewed':False,'qaStatus':'candidate-awaiting-gpu-and-user-review','elbowTwistFix':'r2'}
i=T.rfind(',\n  "elbowTwistFix": {')
assert i>0 and T.rstrip().endswith('}')
body=json.dumps(blk,ensure_ascii=False,indent=2).replace('\n','\n  ')
T=T[:i]+',\n  "elbowTwistFix": '+body+'\n}\n'
chk=json.loads(T);assert chk['spec']==new and chk['specSha256Lf']==sha and chk['elbowTwistFix']['elbowTwistFix']=='r2'
for k in rec:
    if k not in('spec','specSha256Lf','elbowTwistFix','source'): assert chk[k]==rec[k],k
open(rf,'w',encoding='utf8').write(T if txt.endswith('\n') else T.rstrip('\n'))
print(rf)
