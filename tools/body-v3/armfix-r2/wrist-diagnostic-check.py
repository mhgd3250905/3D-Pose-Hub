"""Read-only numerical analysis of actual render-time wrist grid captures."""
import argparse,json
from pathlib import Path
import numpy as np

def load(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def main():
 ap=argparse.ArgumentParser();ap.add_argument('directory',type=Path);ap.add_argument('--output',type=Path);ap.add_argument('--baseline',type=Path);a=ap.parse_args()
 report=load(a.directory/'report.json');ref=load(a.directory/'mesh-reference.json');F=np.array(ref['index']).reshape(-1,3);P0=np.array(ref['rest']).reshape(-1,3)
 out={'format':'pose-hub-wrist-bend-grid-analysis@1','mode':report['mode'],'twistShare':report['twistShare'],'source':str(a.directory),'rows':[],'limits':report['limits'],'checks':{'finite':True,'seamWithin0_1mm':True,'buffersRestoredExactly':True,'shareZeroMeasuredAxesMatchCommands':True if report['twistShare']==0 else None},'restorationMeasurement':{'required':report['mode']=='candidate','measuredRows':0,'missingRows':[],'failedRows':[],'status':'notMeasured'}}
 for row in report['rows']:
  d=load(a.directory/(row['name']+'.json'));P=np.array(d['world']).reshape(-1,3)
  zero=load(a.directory/('flex-0-twist-'+str(d['command']['twist'])+'.json'));Z=np.array(zero['world']).reshape(-1,3)
  assert d['renderTime'] is True and P.shape==P0.shape
  rr={'name':row['name'],'command':d['command'],'seam':d['seam'],'sides':{}}
  for side in ['left','right']:
   ids=set(ref['sides'][side]['ids']);sel=np.array([all(int(i) in ids for i in f) for f in F]);f=F[sel]
   area=lambda X:np.linalg.norm(np.cross(X[f[:,1]]-X[f[:,0]],X[f[:,2]]-X[f[:,0]]),axis=1)
   az=area(Z);valid=az>1e-14;ratio=area(P)[valid]/az[valid]
   E=np.unique(np.sort(np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1),axis=0);ez=np.linalg.norm(Z[E[:,1]]-Z[E[:,0]],axis=1);er=np.linalg.norm(P[E[:,1]]-P[E[:,0]],axis=1)/ez
   m={'measuredAngles':{k:d['frames'][side][k] for k in ['flexDegrees','swingDegrees','axialTwistDegrees']},'faces':int(len(f)),'degenerateNeutralFaces':int((~valid).sum()),'areaRatioVsSameTwistZeroFlex':{'min':float(ratio.min()),'p01':float(np.quantile(ratio,.01)),'median':float(np.median(ratio)),'max':float(ratio.max()),'below0_1':int((ratio<.1).sum()),'below0_25':int((ratio<.25).sum())},'edgeRatioVsSameTwistZeroFlex':{'min':float(er.min()),'p01':float(np.quantile(er,.01)),'p99':float(np.quantile(er,.99)),'max':float(er.max())}}
   if a.baseline:
    old=load(a.baseline/(row['name']+'.json'));O=np.array(old['world']).reshape(-1,3);delta=np.linalg.norm(P[list(ids)]-O[list(ids)],axis=1)*1000;m['candidateVsBaselineWorldDisplacementMm']={'max':float(delta.max()),'rms':float(np.sqrt(np.mean(delta**2)))}
   rr['sides'][side]=m
   if report['twistShare']==0:
    out['checks']['shareZeroMeasuredAxesMatchCommands'] &= abs(d['frames'][side]['flexDegrees']-d['command']['flex'])<.001 and abs(d['frames'][side]['swingDegrees']-abs(d['command']['flex']))<.001
  restore=d.get('restoreCheck');required_restore=['protectedGeometryReferences','positionsNormalsIndicesWeightsExact','boneRotationsRestored']
  if not isinstance(restore,dict) or any(k not in restore for k in required_restore):
   out['restorationMeasurement']['missingRows'].append(row['name']);out['checks']['buffersRestoredExactly']=False;rr['restorationStatus']='notMeasured'
  else:
   out['restorationMeasurement']['measuredRows']+=1
   passed=all(restore[k] is True for k in required_restore);out['checks']['buffersRestoredExactly'] &= passed;rr['restorationStatus']='passed' if passed else 'failed'
   if not passed:out['restorationMeasurement']['failedRows'].append(row['name'])
  out['rows'].append(rr);out['checks']['finite'] &= bool(np.isfinite(P).all());out['checks']['seamWithin0_1mm'] &= d['seam']['maxGapMm']<=.1
 out['restorationMeasurement']['status']='passed' if out['checks']['buffersRestoredExactly'] else ('failed' if out['restorationMeasurement']['failedRows'] else ('partiallyMeasured' if out['restorationMeasurement']['measuredRows'] else 'notMeasured'))
 out['worst']={s:{'minimumAreaRatio':min(r['sides'][s]['areaRatioVsSameTwistZeroFlex']['min'] for r in out['rows']),'maxCollapsedFacesBelow0_1':max(r['sides'][s]['areaRatioVsSameTwistZeroFlex']['below0_1'] for r in out['rows'])} for s in ['left','right']}
 if a.output:
  with a.output.open('x',encoding='utf-8') as f:json.dump(out,f,indent=2)
 print(json.dumps({'mode':out['mode'],'twistShare':out['twistShare'],'rows':len(out['rows']),'checks':out['checks'],'worst':out['worst'],'restorationMeasurement':out['restorationMeasurement']},indent=2))
 if report['mode']=='candidate' and not out['checks']['buffersRestoredExactly']:raise SystemExit('Candidate requires measured, passing restoration checks on every row; numerical report retained.')
if __name__=='__main__':main()
