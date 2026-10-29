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
module=importlib.util.spec_from_file_location('review_builder',HERE/'make-review-r2.py')
review=importlib.util.module_from_spec(module);module.loader.exec_module(review)

def summarize(root):
    d=json.loads((root/'capture.json').read_text(encoding='utf-8'))
    flags=[]
    if d.get('bicepsContactSampling'):
        samples=[m for m in d['metrics'] if m.get('bicepsSurfaceContact')]
        if len(samples)<3: flags.append({'kind':'biceps-contact-samples-missing','count':len(samples)})
        for m in samples:
            s=m['bicepsSurfaceContact'];gap=s.get('minSignedGapMm');hand=s.get('allHandRegion',{})
            if gap is None or gap < -1 or gap > 4 or not s.get('nearWithin2Mm') or hand.get('penetratingBelowMinus1Mm',1)>0:
                flags.append({'kind':'biceps-palm-contact-review','frame':m['frame'],'palmGapMm':gap,'nearWithin2Mm':s.get('nearWithin2Mm'),'handPenetrating':hand.get('penetratingBelowMinus1Mm')})
    if d.get('chairContactSampling'):
        samples=[m for m in d['metrics'] if m.get('chairSurfaceContact')]
        if len(samples)<3: flags.append({'kind':'chair-contact-samples-missing','count':len(samples)})
        for m in samples:
            for side in ['left','right']:
                rows=m['chairSurfaceContact'].get('sides',{}).get(side,{}).get('surfaces',[])
                skin=next((r for r in rows if r['mesh']=='V2P_Base_Limbs'),{})
                gap=skin.get('minSignedGapMm')
                if gap is None or gap < -0.5 or gap > 4:
                    flags.append({'kind':'chair-elbow-contact-review','frame':m['frame'],'side':side,'gapMm':gap})
    missing_surface=[m['frame'] for m in d['metrics'] if not (m.get('bodySurface') or {}).get('vertexCount')]
    if missing_surface: flags.append({'kind':'body-surface-missing','frames':missing_surface})
    below=[m for m in d['metrics'] if (m.get('bodySurface') or {}).get('minClearance',0)<-0.002]
    if below:
        worst=min(below,key=lambda m:m['bodySurface']['minClearance'])
        flags.append({'kind':'body-surface-below-floor-review','count':len(below),'frame':worst['frame'],'clearanceMm':worst['bodySurface']['minClearance']*1000,'point':worst['bodySurface']['minimum'],'note':'Existing qa.py floor tolerance -2mm; raw values retained. CPU skin excludes shader displacement/discard; inspect actual visibility.'})
    if d.get('actionCorrectiveSetup'):
        invalid=[]
        prior_draw=0
        band=d['actionCorrectiveSetup']['id']=='fixed-band-handles-r1'
        native=d['actionCorrectiveSetup']['id'] in ['native-action-hand-pose-r1','native-action-hand-pose-r2']
        for m in d['metrics']:
            state=m.get('actionCorrective') or {}
            if native:
                wanted=d['actionCorrectiveSetup'].get('sides',{})
                sides=state.get('sides',{})
                ok=bool(wanted) and state.get('applied') is True and state.get('specId')==d['specId'] and set(sides)==set(wanted)
                for side,s in sides.items():
                    ok=ok and s.get('applied') is True and s.get('maxQuaternionDistance',1)<1e-6 and s.get('alias')==s.get('selected')==wanted.get(side,{}).get('alias')
                if not ok: invalid.append(m['frame'])
                continue
            if band:
                sides=state.get('sides',{})
                ok=state.get('completed') is True and state.get('drawId',0)>prior_draw and set(sides)=={'left','right'}
                for s in sides.values():
                    ok=ok and s.get('connectorResidualMm',999)<1e-5 and s.get('bandHandClearanceLowerBoundMm',-1)>0
                    ok=ok and all(isinstance(s.get(k),list) and len(s[k])==n and all(math.isfinite(v) for v in s[k]) for k,n in [('connectorWorld',3),('footAnchorWorld',3),('handMatrixWorld',16)])
                if not ok: invalid.append(m['frame'])
                prior_draw=state.get('drawId',0)
                continue
            if abs(state.get('time',-1)-m['time'])>1e-8 or set(state.get('sides',{})) != {'left','right'}:
                invalid.append(m['frame']); continue
            if any(s.get('anklePositionDeltaMm',999)>1e-5 or (s.get('u')==0 and not s.get('supportUnchanged')) for s in state['sides'].values()): invalid.append(m['frame'])
        if invalid: flags.append({'kind':'action-corrective-missing-or-anchor-changed','frames':invalid})
    if d.get('fixedCorrectionSetup'):
        if d['fixedCorrectionSetup'].get('elbow'):
            missing=[m['frame'] for m in d['metrics'] if not (m.get('jointCorrections') or {}).get('elbow')]
            if missing: flags.append({'kind':'fixed-elbow-correction-not-sampled','frames':missing})
            vertices=d['fixedCorrectionSetup'].get('elbowSetup',{}).get('vertices',[])
            if not vertices or any(v.get('selected',0)<=0 for v in vertices): flags.append({'kind':'fixed-elbow-correction-empty-region'})
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
        # Deliberate local detail crops are not full-body framing checks.
        if record['view'].startswith('detail-'): continue
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
        command=['node',str(HERE/'render-finalization-r8.mjs'),'--recipe',str(recipe.resolve()),'--runtime',args.runtime,'--out',str(target),'--phase','preview','--size','480','--preview-fps','12','--lane',str(args.lane)]
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
