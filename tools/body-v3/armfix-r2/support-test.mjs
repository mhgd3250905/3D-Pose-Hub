import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import {makeRestPresets,ASSIST_BEND_FRACTIONS} from './hand-rest-presets.mjs';
const rig=JSON.parse(fs.readFileSync('drill-anim/models/hands-native-c1r2/hands-rig.json','utf8'));
const rest=makeRestPresets(rig);assert.deepEqual(rest.relaxed,rig.poses.relaxed);assert.notStrictEqual(rest.relaxed,rig.poses.relaxed);
for(const k of Object.keys(rest.assist)){const q=new T.Quaternion(...rest.assist[k]),r=new T.Quaternion(...rest.relaxed[k]);assert.ok(Math.abs(q.angleTo(new T.Quaternion())-r.angleTo(new T.Quaternion())*ASSIST_BEND_FRACTIONS[k.replace(/[123]$/,'')])<1e-10);}
assert.throws(()=>makeRestPresets({poses:{relaxed:{}}}),/complete/);
const src=fs.readFileSync(new URL('./support-runtime.js',import.meta.url),'utf8');assert.doesNotMatch(src,/getVertexPosition|for\s*\(const\s*\[step|scoreClearances/,'runtime must not fit or skin vertices');
const positions=new T.BufferAttribute(new Float32Array([0,0,0,.1,0,0,0,.01,0]),3),indices=new T.BufferAttribute(new Uint16Array([0,1,2]),1),si=new T.BufferAttribute(new Uint16Array(12),4),sw=new T.BufferAttribute(new Float32Array([1,0,0,0,1,0,0,0,1,0,0,0]),4);
const geom=new T.BufferGeometry();geom.setAttribute('position',positions);geom.setAttribute('skinIndex',si);geom.setAttribute('skinWeight',sw);geom.setIndex(indices);
const bones=['leftHand','rightHand'].map(name=>{const b=new T.Bone();b.name=name;return b;}),mesh={geometry:geom,skeleton:{bones},visible:true};
function fingerprint(){let h=2166136261;for(const[a,k]of [[positions,1e7],[si,1],[sw,1e7],[indices,1]])for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++){h^=Math.round(a.getComponent(i,j)*k);h=Math.imul(h,16777619);}return(h>>>0).toString(16).padStart(8,'0');}
const FK=['thumb','index','middle','ring','pinky'].flatMap(f=>[1,2,3].map(j=>f+j)),pose=Object.fromEntries(FK.map(k=>[k,[0,0,0,1]]));
pose.thumb1=[.1,.2,.3,Math.sqrt(.86)];
const data={format:'pose-hub-fixed-support@1',sourceId:'synthetic',handScale:1,coordinateFrame:'motion-rest-delta',mesh:{vertices:3,indices:3,bones:bones.map(b=>b.name),fingerprint:fingerprint()},sides:Object.fromEntries(['left','right'].map(s=>[s,{pose:structuredClone(pose),longitudinal:[s==='left'?1:-1,0,0],palmarNormal:[0,-1,0],wristHeightM:.025}]))};
let calls=0;const motion={getGroundHandPose(){calls++;return'fallback';}},oldGround=motion.getGroundHandPose,cur={left:'relaxed',right:'relaxed'},oldPose={},V={hands:{on:true,mesh},poses:{relaxed:rest.relaxed,'palm-floor':oldPose},cur,setHandPose(side,name){const p=this.poses[name];assert.ok(p);const a=p.thumb1;bones[side==='left'?0:1].quaternion.fromArray(side==='right'?[a[0],-a[1],-a[2],a[3]]:a);this.cur[side]=name;}};
const oldSet=V.setHandPose,window={__toonT:T,__v2p:V},ctx={window,flareInspector:{viewer:{motion}},structuredClone};vm.runInNewContext(src,ctx);
assert.throws(()=>window.__installFixedSupport(data,{sourceId:'wrong'}),/identity/);assert.strictEqual(V.setHandPose,oldSet);
const bad=structuredClone(data);bad.mesh.fingerprint='wrong';assert.throws(()=>window.__installFixedSupport(bad,{sourceId:'synthetic'}),/mesh mismatch/);
const fixed=window.__installFixedSupport(data,{sourceId:'synthetic'});assert.deepEqual(cur,{left:'relaxed',right:'relaxed'});assert.strictEqual(V.poses['palm-floor'],oldPose);
V.setHandPose('left','support');V.setHandPose('right','palm-floor');assert.ok(bones[0].quaternion.angleTo(new T.Quaternion(...pose.thumb1))<1e-7);assert.ok(bones[1].quaternion.angleTo(new T.Quaternion(.1,-.2,-.3,Math.sqrt(.86)))<1e-7);
for(const side of ['left','right'])for(const f of [[1,0,0],[0,0,1],[-1,0,0],[.3,0,-.7]]){const g=motion.getGroundHandPose(side,f,[.2,9,.1]),q=new T.Quaternion(...g.handQuaternion),n=new T.Vector3(0,-1,0).applyQuaternion(q),l=new T.Vector3(side==='left'?1:-1,0,0).applyQuaternion(q);assert.ok(n.distanceTo(new T.Vector3(0,-1,0))<1e-12);assert.ok(l.distanceTo(new T.Vector3(...f).normalize())<1e-12);assert.equal(g.wrist[1],.025);assert.equal(g.wrist[0],.2);}
assert.throws(()=>motion.getGroundHandPose('left',[0,1,0]),/horizontal/);
V.hands.on=false;assert.equal(motion.getGroundHandPose('left',[1,0,0]),'fallback');assert.equal(calls,1);V.hands.on=true;
assert.equal(fixed.remove().removed,true);assert.strictEqual(V.setHandPose,oldSet);assert.strictEqual(motion.getGroundHandPose,oldGround);assert.deepEqual(Object.keys(V.poses).sort(),['palm-floor','relaxed']);
// Offline calibration failure must restore transforms, registry and selection.
const calibrate=fs.readFileSync(new URL('./support-calibrate-runtime.js',import.meta.url),'utf8');for(const fail of ['setHandPose','updateMatrixWorld']){
 const b=new T.Bone();b.position.set(1,2,3);b.quaternion.setFromAxisAngle(new T.Vector3(1,0,0),.5);const snapshot={p:b.position.toArray(),q:b.quaternion.toArray()},c={left:'relaxed',right:'assist'},originalPose={};let count=0;
 const v2p={hands:{on:true,mesh:{visible:true,skeleton:{bones:[b],update(){}}}},poses:{'palm-floor':originalPose},cur:c,setHandPose(side){b.position.x=99;b.quaternion.identity();this.cur[side]='palm-floor';if(fail==='setHandPose'&&++count===2)throw Error('injected setHandPose');}};
 const win={__toonT:T,__v2p:v2p},context={window:win,flareInspector:{viewer:{coach:{updateMatrixWorld(){if(fail==='updateMatrixWorld'&&++count===1)throw Error('injected updateMatrixWorld');}}}}};vm.runInNewContext(calibrate,context);
 assert.throws(()=>win.__calibrateFixedSupport({rig,sourceId:'synthetic',handScale:1}),/injected/);assert.deepEqual(b.position.toArray(),snapshot.p);assert.deepEqual(b.quaternion.toArray(),snapshot.q);assert.strictEqual(v2p.cur,c);assert.deepEqual(c,{left:'relaxed',right:'assist'});assert.deepEqual(Object.keys(v2p.poses),['palm-floor']);assert.strictEqual(v2p.poses['palm-floor'],originalPose);
}
// Actual captured hand binds are far from identity; landmarks and sampled
// vertices must share that frame before the palm-plane fit.
const calSource=fs.readFileSync(new URL('./support-calibrate-runtime.js',import.meta.url),'utf8').replaceAll('\r\n','\n');
const axesStart=calSource.indexOf(' const sideAxes='),axesEnd=calSource.indexOf(' const cand=',axesStart);
const bindQ={left:new T.Quaternion(-.12598516702574056,.1739240492304456,-.7013041978722027,.6797430285303471),right:new T.Quaternion(-.12598516702574056,-.1739240492304456,.7013041978722027,.6797430285303471)};
const axes=new Function('T','V','opts','bindQ',calSource.slice(axesStart,axesEnd)+'return sideAxes;')(T,a=>new T.Vector3(...a),{rig},bindQ);
for(const side of ['left','right']){const a=axes(side),sign=side==='left'?1:-1,localL=['index','middle','ring','pinky'].reduce((v,f)=>v.add(new T.Vector3(...rig.fingers[f].joints[3])),new T.Vector3());localL.x*=sign;localL.normalize();const localN=new T.Vector3(...rig.palmar);localN.x*=sign;localN.addScaledVector(localL,-localN.dot(localL)).normalize();assert.ok(a.L0.distanceTo(localL.clone().applyQuaternion(bindQ[side]))<1e-12);assert.ok(a.N0.distanceTo(localN.clone().applyQuaternion(bindQ[side]))<1e-12);assert.ok(a.L0.distanceTo(localL)>1,'test must use a meaningfully nonidentity bind');}
// Exercise the real weighted refinement on a mixed-weight distal surface.
// This finger begins 3 mm above a palm plane and must approach without piercing.
{
 const scene=new T.Group(),hand=new T.Bone();hand.name='leftHand';scene.add(hand);const fs=[];let parent=hand;
 for(let j=1;j<=3;j++){const b=new T.Bone();b.name='v2p_L_index'+j;b.position.x=j===1?.06:.03;parent.add(b);fs.push(b);parent=b;}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([.03,-.02,0,.08,-.01,0,.15,-.017,0,.16,-.016,0],3));g.setAttribute('skinIndex',new T.Uint16BufferAttribute([0,0,0,0,1,0,0,0,2,3,0,0,3,0,0,0],4));g.setAttribute('skinWeight',new T.Float32BufferAttribute([1,0,0,0,1,0,0,0,.5,.5,0,0,1,0,0,0],4));
 const H=new T.SkinnedMesh(g,new T.MeshBasicMaterial());scene.add(H);scene.updateMatrixWorld(true);H.bind(new T.Skeleton([hand,...fs]));H.skeleton.update();
 const start=calSource.indexOf(' const refinement='),end=calSource.indexOf(' v.coach.updateMatrixWorld(true);H.skeleton.update();\n for(let i=',start);assert.ok(end>start);
 const code=calSource.slice(start,end).replace("for(const side of ['left','right'])","for(const side of ['left'])")+'return refinement;';
 const fp={left:{index:{deg:[0,0,0]}}},sp={left:{}},result=new Function('T','PF','invW','H','bindQ','names','sw','si','pv','FN','rig','v','V','fingerReport','sidePoses',code)(T,{left:{N:new T.Vector3(0,-1,0),ax:{L0:new T.Vector3(1,0,0)}}},{left:new T.Matrix4()},H,{left:new T.Quaternion()},H.skeleton.bones.map(b=>b.name),g.attributes.skinWeight,g.attributes.skinIndex,new T.Vector3(),['index'],{fingers:{index:{flexAxis:[0,0,-1]}}},{coach:scene},a=>new T.Vector3(...a),fp,sp);
 const r=result.left.index;assert.ok(r.before.distalMinClearMm>2.9);assert.ok(r.after.distalMinClearMm>=.2&&r.after.distalMinClearMm<=.6,JSON.stringify(r));assert.ok(r.after.minClearMm>=.14);assert.ok(r.deltaDegrees.every(x=>Math.abs(x)<=12));assert.equal(Object.keys(sp.left).length,3);
}
console.log('support/rest preset tests passed: fixed frame headings, handedness, source guard, teardown, calibration rollback, fixed light-touch assist');
