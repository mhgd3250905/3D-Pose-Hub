import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as T from 'three';
import {payload,contactMath} from './fixed-band-handles-r1.mjs';
const window={__toonT:T},context=vm.createContext({window});vm.runInContext(fs.readFileSync(new URL('../../drill-anim/page/engine.js',import.meta.url),'utf8'),context);const E=window.__drill;
const probe=(s,t)=>{const d=E.blend(s.pose.base,s.pose.deltas,E.sample(s.timeline,t)),limbs={};for(const side of ['left','right']){const h=d.hands[side];assert.equal(h.frame,'world');limbs[side]={wrist:h.wrist,handQuaternion:E.handQ(side,new T.Vector3(...h.finger),new T.Vector3(...h.normal)).toArray()};}return {requested:{limbs}};};
const data=payload(),math=contactMath(T),report={format:'fixed-towel-axis-cpu-r1',engine:'drill-anim/page/engine.js: E.sample/E.blend/E.handQ; world-frame hand descriptors only',actions:[],reviewed:false,releaseEligible:false};
for(const [oldId,id,attempt]of [['h-towel-pulldown-r6','h-towel-pulldown-r7','attempt06'],['h-towel-behind-r5','h-towel-behind-r6','attempt05']]){
 const old=(await import('../../drill-anim/specs/'+oldId+'.js')).default,s=(await import('../../drill-anim/specs/'+id+'.js')).default,stable=id.replace(/-r\d+$/,''),captureFile='F:/PoseHub-v2-production/remaining32-template-r2-20261029/overnight/'+stable+'/'+attempt+'/capture.json',capture=JSON.parse(fs.readFileSync(captureFile)),p=s.props.find(p=>p.type==='band');
 for(const key of ['pose','camera','qa','nativeHands','runtimeModel','highlight','keyFrames'])assert.deepEqual(s[key],old[key],key+' changed');
 const changed=Object.keys(s.timeline.tracks).filter(k=>JSON.stringify(s.timeline.tracks[k])!==JSON.stringify(old.timeline.tracks[k]));
 for(const k of changed)assert(['left','right'].some(side=>['finger','normal'].some(field=>old.pose.deltas[k]?.hands?.[side]?.[field])),'Non-hand orientation track changed');
 const row={id,oldId,captureFile,framesAt60Fps:481,changedTracks:changed,sides:{},wristPathDeltaMaxMm:0,baselineRequestedToCapturedQuaternionMaxDegrees:0,maximumHandRotationChangeDegrees:0,minimumCenterlineSurfaceDistanceMm:Infinity,minimumOuterRadiusGapMm:Infinity,centerlineCrossingSamples:0,maximumAxisAngleDegrees:0,loop:{}},ends=[];
 for(const side of ['left','right'])row.sides[side]={minimumOuterRadiusGapMm:Infinity,centerlineCrossingSamples:0,maximumAxisAngleDegrees:0};
 const faces=Object.fromEntries(['left','right'].map(side=>[side,math.triangles(data.sides[side].hand)])),maps=Object.fromEntries(['left','right'].map(side=>[side,new T.Matrix4().fromArray(data.sides[side].map).transpose()]));
 for(let f=0;f<=480;f++){
  const t=f/60,now=probe(s,t),before=probe(old,t),world={},centers={};
  for(const side of ['left','right']){const n=now.requested.limbs[side],o=before.requested.limbs[side],q=new T.Quaternion(...n.handQuaternion),oldQ=new T.Quaternion(...o.handQuaternion);world[side]=new T.Matrix4().compose(math.V(n.wrist),q,new T.Vector3(1,1,1)).multiply(maps[side]);centers[side]=math.V(data.sides[side].hand.cylinder.center).applyMatrix4(world[side]);row.wristPathDeltaMaxMm=Math.max(row.wristPathDeltaMaxMm,math.V(n.wrist).distanceTo(math.V(o.wrist))*1000);row.maximumHandRotationChangeDegrees=Math.max(row.maximumHandRotationChangeDegrees,q.angleTo(oldQ)*180/Math.PI);
   if(f%2===0){const actual=new T.Quaternion(...capture.metrics[f/2].actualRenderRotations[side].hand.worldQuaternion);row.baselineRequestedToCapturedQuaternionMaxDegrees=Math.max(row.baselineRequestedToCapturedQuaternionMaxDegrees,oldQ.angleTo(actual)*180/Math.PI);}
  }
  for(const side of ['left','right']){const inv=world[side].clone().invert(),a=centers[side].clone().applyMatrix4(inv),b=centers[side==='left'?'right':'left'].clone().applyMatrix4(inv),distance=math.segmentDistance(a,b,faces[side]),angle=Math.acos(Math.min(1,Math.abs(b.clone().sub(a).normalize().dot(math.V(data.sides[side].hand.cylinder.axis)))))*180/Math.PI,gap=(distance-p.r)*1000;row.minimumCenterlineSurfaceDistanceMm=Math.min(row.minimumCenterlineSurfaceDistanceMm,distance*1000);row.minimumOuterRadiusGapMm=Math.min(row.minimumOuterRadiusGapMm,gap);row.maximumAxisAngleDegrees=Math.max(row.maximumAxisAngleDegrees,angle);row.sides[side].minimumOuterRadiusGapMm=Math.min(row.sides[side].minimumOuterRadiusGapMm,gap);row.sides[side].maximumAxisAngleDegrees=Math.max(row.sides[side].maximumAxisAngleDegrees,angle);if(distance<1e-8){row.centerlineCrossingSamples++;row.sides[side].centerlineCrossingSamples++;}}
  if(f===0||f===480)ends.push(now.requested);
 }
 row.loop.exact=JSON.stringify(ends[0])===JSON.stringify(ends[1]);assert(row.loop.exact);assert(row.wristPathDeltaMaxMm<1e-9);assert.equal(row.centerlineCrossingSamples,0);assert(row.maximumAxisAngleDegrees<.05);assert(row.baselineRequestedToCapturedQuaternionMaxDegrees<.02);
 row.status='CPU-passed-geometric-axis-candidate-awaiting-GPU';report.actions.push(row);
}
report.limits=['CPU world orientation is derived by the actual engine descriptor handQ and checked against old captured quaternions. New GPU still required.','Forearm twist distribution and wrist bridge appearance under changed hand orientation are not CPU approved.','34 mm behind towel exceeds fixed 32 mm shaft diameter by 2 mm; measured negative outer-radius gap is a conservative bound, not penetration depth.','Frozen hand geometry and contact budget remain unchanged.'];
const output=process.argv[2];if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
