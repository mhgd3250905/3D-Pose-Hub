#!/usr/bin/env python3
"""逐个下载目录里每个媒体文件（含 poster），核对 bytes/SHA。
用法：verify_media.py <catalog.json> <result.json> [poster输出目录]"""
import json,hashlib,urllib.request,concurrent.futures as cf,os,sys
c=json.load(open(sys.argv[1]))
jobs=[]
for a in c['actions']:
    for k in ('video','cover','thumbnail','poster'):
        f=a['files'][k]; jobs.append((a['id'],k,f))
def run(j):
    i,k,f=j
    for t in range(3):
        try:
            b=urllib.request.urlopen(urllib.request.Request(f['downloadUrl'],headers={'User-Agent':'posehub-verify'}),timeout=60).read()
            break
        except Exception as e: err=str(e); b=None
    if b is None: return dict(id=i,kind=k,ok=False,err=err)
    h=hashlib.sha256(b).hexdigest()
    if k=='poster': (open(os.path.join(sys.argv[3],i+'.webp'),'wb').write(b) if len(sys.argv)>3 else None)
    return dict(id=i,kind=k,ok=(len(b)==f['bytes'] and h==f['sha256']),bytes=len(b),sha256=h)
out=[]
with cf.ThreadPoolExecutor(6) as ex:
    for n,r in enumerate(ex.map(run,jobs)):
        out.append(r)
        if n%100==0: print(n,flush=True)
json.dump(out,open(sys.argv[2],'w'),indent=0)
print('done',sum(r['ok'] for r in out),len(out))
