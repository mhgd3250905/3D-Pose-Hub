# Point a production recipe at a revised spec and refresh its LF SHA:  python3 repoint-recipe.py <recipeId> <specPath>
import json,hashlib,sys,pathlib
rid,spec=sys.argv[1],sys.argv[2]
p=pathlib.Path('catalog/production/remaining219-r1/recipes')/(rid+'.json');r=json.loads(p.read_text('utf-8'))
old=r['spec'];r['spec']=spec;r['specSha256Lf']=hashlib.sha256(pathlib.Path(spec).read_bytes().replace(b'\r\n',b'\n')).hexdigest()
if isinstance(r.get('source'),dict) and 'selectedSpec' in r['source']:r['source']['selectedSpec']=spec
r.setdefault('groundContactFix',{})['r1']={'from':old,'to':spec,'date':'2026-11-03','branch':'fix/ground-contact-r1'}
p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n','utf-8');print(rid,old,'->',spec)
