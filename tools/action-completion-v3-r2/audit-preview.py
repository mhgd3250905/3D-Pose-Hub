"""Audit saved preview candidates against current recipes, without approving content."""
import argparse, hashlib, json, subprocess
from pathlib import Path

def read(p): return json.loads(p.read_text(encoding='utf-8'))
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()

def audit(root, recipes, decode=False, output=None):
    rows=[]
    overrides=read(recipes/'review-overrides.json').get('actions',{}) if (recipes/'review-overrides.json').exists() else {}
    for file in sorted(recipes.glob('groups/*/*.json')):
        recipe=read(file)
        if not isinstance(recipe,dict) or recipe.get('format')!='pose-hub-action-recipe@1' or recipe.get('templateReview',{}).get('status')=='accepted': continue
        captures=[p for p in sorted((root/recipe['id']).glob('*/capture.json')) if read(p).get('complete') and (p.parent/'review/review.json').exists()]
        errors=[]; notes=[]
        override=overrides.get(recipe['id'])
        if override and not override.get('resolved'): errors.append('User requested changes: '+override['reason'])
        row={'id':recipe['id'],'recipe':str(file),'reviewed':False,'releaseEligible':False}
        if not captures:
            row.update(errors=['No completed preview'],passed=False);rows.append(row);continue
        cap=captures[-1];data=read(cap);review=read(cap.parent/'review/review.json')
        row.update(capture=str(cap),attempt=cap.parent.name,recipeSha256=data['recipeSha256'])
        if data['recipeSha256']!=sha(file): errors.append('Preview does not match current recipe')
        if review['captureSha256']!=sha(cap): errors.append('Capture hash changed after review creation')
        for name,pin in review['files'].items():
            p=cap.parent/'review'/name
            if not p.exists() or sha(p)!=pin['sha256']: errors.append('Review media hash mismatch: '+name)
        visual_path=cap.parent/'visual-review.json';visual=read(visual_path) if visual_path.exists() else {}
        if not visual.get('passedAsCandidate'): errors.append('Agent visual candidate review unresolved')
        if data.get('mode')!='preview' or data.get('size',999)>480: errors.append('Not a low-resolution preview')
        stressed=sum(any(side.get('stress') for side in (m.get('actualRenderWristDiagnostics') or {}).values()) for m in data['metrics'])
        if stressed: errors.append('Fixed wrist deformation stress on '+str(stressed)+' frames')
        for label in ['ankle','elbow']:
            stressed=sum(any(side.get('stress') for side in ((m.get('jointCorrections') or {}).get(label) or {}).get('sides',{}).values()) for m in data['metrics'])
            if stressed: errors.append(label+' deformation stress on '+str(stressed)+' frames')
        if any(x.get('profile','').startswith('upper-arm-contour-') for x in recipe.get('jointCorrections',[])):
            upper=[(m.get('jointCorrections') or {}).get('upperArm') for m in data['metrics']]
            if any(x is None for x in upper): errors.append('Upper-arm actual-render samples missing')
            if any(x and (x.get('stress') or x.get('maxSeamGapMm',999)>.01) for x in upper): errors.append('Upper-arm contour seam/stress unresolved')
        for name,track in data['rotationPath']['tracks'].items():
            if 'Relative' in name and (track['totalAngularTravelDeg']>=360 or track['maxAdjacentShortestDeg']>35 or track['endpointShortestDeg']>5):
                notes.append({'channel':name,**track})
        if notes: errors.append('Relative wrist/ankle rotation needs explicit resolution')
        if decode:
            video=cap.parent/'review/preview.mp4'
            result=subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],capture_output=True,text=True)
            if result.returncode or result.stderr.strip(): errors.append('Video decode failed: '+result.stderr[-500:])
        row.update(errors=errors,rotationFlags=notes,passed=not errors)
        rows.append(row)
    report={'format':'pose-hub-preview-audit@1','requested':30,'count':len(rows),'passed':len(rows)==30 and all(r['passed'] for r in rows),'videoDecodeChecked':decode,'reviewed':False,'releaseEligible':False,'actions':rows}
    (output or root/'candidate-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'count':len(rows),'passed':sum(r['passed'] for r in rows),'issues':[{k:r[k] for k in ['id','errors']} for r in rows if not r['passed']]},ensure_ascii=True))
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('root',type=Path);p.add_argument('recipes',type=Path);p.add_argument('--decode',action='store_true');p.add_argument('--output',type=Path);a=p.parse_args();audit(a.root,a.recipes,a.decode,a.output)
