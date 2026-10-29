// CPU-only authoring derivative. Produces new files; never modifies source specs or hash tables.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createDescriptorProbe} from './thomas-reachability-cpu.mjs';
import {reachableThomas} from '../../drill-anim/specs/_thomas-reachable-r1.mjs';
const [calibrationFile,sourceFile,newId,reportFile]=process.argv.slice(2);
if(!reportFile)throw Error('Usage: node bake-thomas-reachability.mjs CALIBRATION SOURCE_JS NEW_ID REPORT_JSON');
const calibration=JSON.parse(fs.readFileSync(calibrationFile,'utf8'));
const source=(await import(pathToFileURL(path.resolve(sourceFile)).href)).default;
const dir=path.dirname(path.resolve(sourceFile)), specFile=path.join(dir,newId+'.js'),dataFile=path.join(dir,'_'+newId+'-reach-data.mjs');
for(const f of [specFile,dataFile,reportFile])if(fs.existsSync(f))throw Error('Refusing to overwrite '+f);
const oldHip={left:[.081543,.9159351718590191,.003696798311505538],right:[-.081543,.9159351718590191,.003696798311505538]};
const data={sourceId:source.id,id:newId,calibrationIdentity:{file:path.basename(calibrationFile),
  sha256:crypto.createHash('sha256').update(fs.readFileSync(calibrationFile)).digest('hex'),
  model:{profile:'training-human-v3-armfix',version:'0.1.0-r2'},R:calibration.R,L:calibration.L},
  armMarginMetres:.0001,hipOriginDelta:Object.fromEntries(['left','right'].map(s=>[s,calibration.R[s+'Hip'].map((x,i)=>x-oldHip[s][i])])),absoluteTracks:{},summary:{}};
const candidate=reachableThomas(source,data);candidate.pose.base.solve=structuredClone(source.pose.base.solve);
const probe=createDescriptorProbe(calibration),T=source.timeline.duration,n=Math.round(T*30),samples=[];
const keys=['pelvis.0','pelvis.1','pelvis.2'];
const sourceSolve=source.pose.base.solve?.vars??[];
for(const variable of sourceSolve)if(/^c\d+$/.test(variable))keys.push(`chest.waist.${+variable.slice(1)}.1`);
for(const key of keys)data.absoluteTracks[key]=[];
let maxRootCorrection=0;
for(let frame=0;frame<n;frame++){
  const time=frame/30;
  // An identical zero seed gives identical endpoint poses on every invocation.
  const r=probe(candidate,time),P=r.requested.pelvis.slice(),circles=[];
  for(const side of ['left','right']){
    const arm=r.reach[side],offset=arm.shoulder.map((v,i)=>v-P[i]),dz=arm.shoulder[2]-arm.wrist[2];
    const a=calibration.L[side+'UpperArm'],b=calibration.L[side+'Forearm'];
    const angle=r.descriptor.constraints.find(c=>c.type==='reach'&&c.limb===side+'Arm')?.angle??177.5;
    const length=Math.min(a+b-data.armMarginMetres,Math.sqrt(a*a+b*b-2*a*b*Math.cos(angle*Math.PI/180)));
    const radiusSquared=length*length-dz*dz;
    if(radiusSquared<=0)throw Error(`No planar reachable root: ${side} frame ${frame}`);
    circles.push({center:[arm.wrist[0]-offset[0],arm.wrist[1]-offset[1]],radius:Math.sqrt(radiusSquared)});
  }
  // Both calibrated wrists stay fixed. Their different surface heights require a tiny
  // lateral root adjustment if both elbows are to meet the same straight-arm intent.
  const [c0,c1]=circles,delta=c1.center.map((v,i)=>v-c0.center[i]),distance=Math.hypot(...delta),e=delta.map(v=>v/distance);
  if(distance<1e-8||distance>c0.radius+c1.radius||distance<Math.abs(c0.radius-c1.radius))throw Error('Support circles do not intersect');
  const along=(c0.radius*c0.radius-c1.radius*c1.radius+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,c0.radius*c0.radius-along*along));
  const center=c0.center.map((v,i)=>v+along*e[i]),perpendicular=[-e[1],e[0]];
  const alternatives=[-1,1].map(sign=>center.map((v,i)=>v+sign*height*perpendicular[i]));
  alternatives.sort((a,b)=>Math.hypot(a[0]-P[0],a[1]-P[1])-Math.hypot(b[0]-P[0],b[1]-P[1]));
  const correction=Math.hypot(alternatives[0][0]-P[0],alternatives[0][1]-P[1]);maxRootCorrection=Math.max(maxRootCorrection,correction);
  // Above 3 mm, author intent needs a separate decision, not an automatic body move.
  if(correction>.003)throw Error(`Root correction ${correction*1000} mm exceeds authoring limit at frame ${frame}`);
  [P[0],P[1]]=alternatives[0];
  for(let axis=0;axis<3;axis++)data.absoluteTracks['pelvis.'+axis].push([time,P[axis]]);
  for(const variable of sourceSolve)if(/^c\d+$/.test(variable)){
    const index=+variable.slice(1),key=`chest.waist.${index}.1`;
    data.absoluteTracks[key].push([time,r.descriptor.chest.waist[index][1]+(r.x[variable]??0)]);
  }
  samples.push({frame,time,oldRequestedPelvis:r.requested.pelvis,newRequestedPelvis:P,rootCorrectionMm:correction*1000,x:r.x});
}
data.summary={frames:n,deterministicSeed:true,maxRootCorrectionMm:maxRootCorrection*1000,
  rootMethod:'Nearest intersection of both elbow-reach circles at the authored solved root Z',
  temporalSamplingFps:30,scope:'CPU requested-geometry audit; mesh contact and visual acceptance pending'};
const final=reachableThomas(source,data),check=createDescriptorProbe(calibration),ranges={};
for(const side of ['left','right'])ranges[side]={armExcessMaxMm:-Infinity,legExcessMaxMm:-Infinity,elbowDegrees:[Infinity,-Infinity],unlockedFrames:0};
// Check half-steps too, because interpolation changes rotations between 30fps authored keys.
for(let frame=0;frame<=n*2;frame++){
  const r=check(final,frame/60);
  for(const side of ['left','right']){
    const q=r.reach[side],v=ranges[side];v.armExcessMaxMm=Math.max(v.armExcessMaxMm,(q.armDistance-q.armMaximum)*1000);
    v.legExcessMaxMm=Math.max(v.legExcessMaxMm,(q.legDistance-q.legMaximum)*1000);v.unlockedFrames+=!q.handLocked;
    v.elbowDegrees[0]=Math.min(v.elbowDegrees[0],q.requestedElbowDegrees);v.elbowDegrees[1]=Math.max(v.elbowDegrees[1],q.requestedElbowDegrees);
  }
}
data.summary.reachAt60Fps=ranges;
for(const r of Object.values(ranges))if(r.armExcessMaxMm>0||r.legExcessMaxMm>.005||r.unlockedFrames)
  throw Error('Requested geometry still unreachable: '+JSON.stringify(ranges));
const get=p=>p.split('.').reduce((o,k)=>o[+k===+k?+k:k],final.pose.base);
for(const key of keys)if(!Number.isFinite(get(key)))throw Error('Nonfinite baked base '+key);
fs.writeFileSync(dataFile,'// Generated by bake-thomas-reachability.mjs; calibrated source derivative.\nexport default '+JSON.stringify(data)+';\n');
fs.writeFileSync(specFile,`import source from './${path.basename(sourceFile)}';\nimport calibration from './${path.basename(dataFile)}';\nimport {reachableThomas} from './_thomas-reachable-r1.mjs';\nexport default reachableThomas(source,calibration);\n`);
fs.writeFileSync(reportFile,JSON.stringify({calibrationFile,sourceFile,specFile,dataFile,summary:data.summary,samples},null,2)+'\n');
console.log(JSON.stringify({specFile,dataFile,reportFile,summary:data.summary}));
