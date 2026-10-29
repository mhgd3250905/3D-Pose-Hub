"""Bounded, serial low-resolution preview batch. Caller checks quota between batches."""
import argparse
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import math
from PIL import Image

HERE=Path(__file__).resolve().parent
REPO=HERE.parent.parent
module=importlib.util.spec_from_file_location('review_builder',HERE/'make-review.py')
review=importlib.util.module_from_spec(module);module.loader.exec_module(review)

def summarize(root):
    d=json.loads((root/'capture.json').read_text(encoding='utf-8'))
    flags=[]
    if d.get('fixedCorrectionSetup'):
        invalid = []
        for m in d['metrics']:
            restore = m.get('fixedCorrectionRestore') or {}
            wrist = restore.get('wristRestore') or {}
            if restore.get('phase') != 'ready' or not all(wrist.get(k) is True for k in ['positionsNormalsExact','boneTransformsExact','cacheExact']):
                invalid.append(m['frame'])
        if invalid: flags.append({'kind':'fixed-composition-restore-missing-or-failed','frames':invalid})
    for name,track in d['rotationPath']['tracks'].items():
        if track['maxAdjacentShortestDeg']>35: flags.append({'kind':'rotation-step','channel':name,'degrees':track['maxAdjacentShortestDeg']})
        if track['endpointShortestDeg']>5: flags.append({'kind':'loop-seam','channel':name,'degrees':track['endpointShortestDeg']})
        if 'Relative' in name and track['totalAngularTravelDeg']>=360: flags.append({'kind':'cumulative-relative-rotation-review','channel':name,'degrees':track['totalAngularTravelDeg']})
    warnings=sum(bool(m['solverWarn']) for m in d['metrics'])
    stressed=sum(any(side.get('stress') for side in (m.get('actualRenderWristDiagnostics') or {}).values()) for m in d['metrics'])
    if stressed: flags.append({'kind':'fixed-wrist-stress-frames','count':stressed})
    for label in ['ankle','elbow']:
        stressed=sum(any(side.get('stress') for side in ((m.get('jointCorrections') or {}).get(label) or {}).get('sides',{}).values()) for m in d['metrics'])
        if stressed: flags.append({'kind':label+'-deformation-stress-frames','count':stressed})
    upper_stress=sum(bool((m.get('jointCorrections') or {}).get('upperArm',{}).get('stress')) for m in d['metrics'] if (m.get('jointCorrections') or {}).get('upperArm'))
    if upper_stress: flags.append({'kind':'upper-arm-deformation-stress-frames','count':upper_stress})
    if warnings: flags.append({'kind':'solver-warning-frames','count':warnings})
    edges=[]
    for record in d['images']:
        im=Image.open(root/record['path']);box=im.getchannel('A').point(lambda x:255 if x>8 else 0).getbbox()
        if not box or min(box[0],box[1])==0 or box[2]==im.width or box[3]==im.height: edges.append(record['path'])
    if edges: flags.append({'kind':'canvas-edge','paths':edges})
    heights={}
    angles={}
    def angle(a,b,c):
        u=[a[i]-b[i] for i in range(3)];v=[c[i]-b[i] for i in range(3)]
        den=math.sqrt(sum(x*x for x in u)*sum(x*x for x in v))
        return math.degrees(math.acos(max(-1,min(1,sum(u[i]*v[i] for i in range(3))/max(den,1e-12)))))
    for side in ['left','right']:
        for part in ['Wrist','Palm','Knee','Ankle','Toe']:
            values=[m['joints'][side+part][1] for m in d['metrics'] if side+part in m['joints']]
            heights[side+part]=[min(values),max(values)]
        for label,parts in [('elbow',['Shoulder','Elbow','Wrist']),('knee',['Hip','Knee','Ankle'])]:
            values=[angle(*(m['joints'][side+p] for p in parts)) for m in d['metrics']]
            angles[side+label]=[min(values),max(values)]
    result={'id':d['stableId'],'capture':str(root/'capture.json'),'review':str(root/'review/preview.mp4'),'complete':True,'flags':flags,'jointHeightRanges':heights,'jointAngleRanges':angles,'solverWarningSamples':list(dict.fromkeys(str(m['solverWarn']) for m in d['metrics'] if m['solverWarn']))[:5],'reviewed':False,'releaseEligible':False,'userReviewStatus':'pending','agentVisualReview':'pending'}
    (root/'triage.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);p.add_argument('--runtime',required=True);p.add_argument('--attempt',default='attempt01');p.add_argument('--lane',type=int,choices=[1,2],default=1);p.add_argument('recipes',nargs='+',type=Path);args=p.parse_args()
    args.out.mkdir(parents=True,exist_ok=True)
    for recipe in args.recipes:
        data=json.loads(recipe.read_text(encoding='utf-8'));target=args.out/data['id']/args.attempt
        if target.exists():
            print(json.dumps({'id':data['id'],'status':'skipped-existing','out':str(target)}),flush=True);continue
        log=args.out/(data['id']+'-'+args.attempt+'.log')
        command=['node',str(HERE/'render-finalization-r1.mjs'),'--recipe',str(recipe.resolve()),'--runtime',args.runtime,'--out',str(target),'--phase','preview','--size','480','--preview-fps','12','--lane',str(args.lane)]
        with log.open('w',encoding='utf-8') as stream:
            proc=subprocess.run(command,cwd=REPO,stdout=stream,stderr=subprocess.STDOUT)
        if proc.returncode:
            print(json.dumps({'id':data['id'],'status':'failed','log':str(log)}),flush=True)
            # A GPU crash, lock conflict or resource failure needs diagnosis before another launch.
            text=log.read_text(encoding='utf-8')
            if any(s in text for s in ['memory below','context lost','Target closed','crashed','completion-render.lock','GPU differs']): sys.exit(2)
            continue
        try:
            review.build(target/'capture.json')
            result=summarize(target)
            print(json.dumps({'id':result['id'],'status':'preview-ready','flags':[{k:v for k,v in f.items() if k!='paths'}|({'count':len(f['paths'])} if 'paths' in f else {}) for f in result['flags']]},ensure_ascii=True),flush=True)
        except Exception as error:
            print(json.dumps({'id':data['id'],'status':'review-build-failed','error':str(error)}),flush=True)
