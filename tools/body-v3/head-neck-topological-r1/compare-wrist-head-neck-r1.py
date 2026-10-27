"""Compare two serial reference/combined captures; no visual acceptance implied."""
import json
from pathlib import Path
import sys
import numpy as np
from PIL import Image

reference,combined,out=map(Path,sys.argv[1:])
if out.exists():raise SystemExit('output already exists')
reports=[json.loads((p/'report.json').read_text(encoding='utf-8')) for p in (reference,combined)]
assert [r['mode'] for r in reports]==['reference','combined'] and all(not r['pageErrors'] for r in reports)
cases=['long-flex','short-flex','long-ext','long-rot']; views=['neck','left','right'];result={}
for case in cases:
    result[case]={}
    for view in views:
        name=case+'-'+view+'.png'; a=np.asarray(Image.open(reference/name).convert('RGB'),dtype=np.int16);b=np.asarray(Image.open(combined/name).convert('RGB'),dtype=np.int16)
        if a.shape!=b.shape:raise ValueError('image dimensions differ: '+name)
        diff=np.max(np.abs(a-b),axis=2);count=int((diff>4).sum());result[case][view]={'changedPixelsOver4':count,'totalPixels':int(diff.size),'maxChannelDifference':int(diff.max())}
        if (view=='neck' or case=='short-flex') and count>20:raise ValueError('unexpected visible change: '+name+' '+str(count))
        if case=='long-flex' and view in ['left','right'] and count<=20:raise ValueError('long sleeve gradient not visible: '+name+' '+str(count))
with out.open('x',encoding='utf-8') as f:json.dump(result,f,indent=2)
print(json.dumps(result))
