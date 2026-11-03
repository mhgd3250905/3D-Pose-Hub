#!/usr/bin/env python3
"""results.jsonl -> per-action.json (per region lowest vertex over the sampled cycle, joint min y).
usage: per_action.py <results.jsonl> <per-action.json> [sourceCommit]"""
import json, sys
acts=[]
for line in open(sys.argv[1]):
    r=json.loads(line); F=r['frames']; reg={}; jm={}
    for f in F:
        for k,v in f['regions'].items():
            y=round(v['minY']*1000,1); e=reg.setdefault(k,{'minMm':y,'frame':f['f'],'maxOfFrameMinMm':y})
            if y<e['minMm']: e['minMm'],e['frame']=y,f['f']
            if y>e['maxOfFrameMinMm']: e['maxOfFrameMinMm']=y
        for k,y in f['joints'].items(): jm[k]=min(jm.get(k,9e9),round(y*1000,1))
    acts.append({'id':r['id'],'recipe':r['recipe'],'spec':r['spec'],'loopFrames':r['loopFrames'],'sampledFrames':[f['f'] for f in F],
                 'props':r['props'],'hands':r['hands'],'shadowBlobJoints':r['shadowBlobJoints'],'regionMin':dict(sorted(reg.items())),'jointMinYmm':jm})
json.dump({'format':'pose-hub-ground-audit@1','sourceCommit':sys.argv[3] if len(sys.argv)>3 else 'ed49ffb (origin/main, contains 9b67e5d)',
           'floor':'world y=0','stride':16,'actions':acts},open(sys.argv[2],'w'),ensure_ascii=False,indent=1)
print(len(acts),'actions')
