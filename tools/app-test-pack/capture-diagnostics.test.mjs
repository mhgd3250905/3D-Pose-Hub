import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {buildTechnicalCaptureSources,installTechnicalFrame} from './capture-diagnostics.mjs';
import {parseArgs,checkPreview} from './render_latest.mjs';
const engine=fs.readFileSync(new URL('../../drill-anim/page/engine.js',import.meta.url),'utf8');
const layers=fs.readFileSync(new URL('../../drill-anim/tools/v2/browser-layers.js',import.meta.url),'utf8');
const built=buildTechnicalCaptureSources(engine,layers);

test('whole-source SHA and exact reversible diagnostic edits are pinned',()=>{
 assert.ok(built.evidence.retained.includes('original applyAt and warm x'));
 assert.match(built.technicalFrame,/E\.applyAt\(spec, t, warm\)/);
 assert.doesNotMatch(built.technicalFrame,/E\.metrics\(spec/);
 assert.doesNotMatch(built.technicalFrame,/E\.handClip\(/);
 assert.match(built.layersSource,/updateMatrixWorld\(true\);v\.coach\.traverse\(o=>\{if\(o\.isSkinnedMesh\)o\.skeleton\.update\(\);\}\);metrics\.visibleSurface/);
 for(const [e,l] of [[engine+'\n//edit',layers],[engine,layers+'\n//edit']])assert.throws(()=>buildTechnicalCaptureSources(e,l),/source SHA changed/);
});

function fixture(){
 const stats={solver:0,diagnostic:0,metrics:0,vertices:0,worldUpdates:0,skeletonUpdates:0};
 const state={pose:{t:0,shift:0}};
 class V {
  constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z});}
  clone(){return new V(this.x,this.y,this.z);}
  copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this;}
  sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}
  multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
  applyAxisAngle(_,a){const x=this.x,z=this.z;this.x=x*Math.cos(a)+z*Math.sin(a);this.z=-x*Math.sin(a)+z*Math.cos(a);return this;}
  applyMatrix4(){return this;}
  project(){return this.multiplyScalar(.2);}
  toArray(){return [this.x,this.y,this.z];}
 }
 const joints=()=>({pelvis:[state.pose.shift,.5,0],head:[state.pose.shift,1.7,.1],
  leftHip:[-.1,.5,0],rightHip:[.1,.5,0],leftWrist:[-.4,.7,.1],rightWrist:[.4,.7,.1]});
 const material={colorWrite:true,depthWrite:true,onBeforeCompile(){},customProgramCacheKey(){return 'fixture';}};
 const mesh={name:'visible-body',isMesh:true,isSkinnedMesh:true,visible:true,material,matrixWorld:{},
  geometry:{drawRange:{start:0,count:3},index:{count:3,getX:i=>i},attributes:{position:{count:3}}},
  skeleton:{update(){stats.skeletonUpdates++;}},
  getVertexPosition(i,p){stats.vertices++;p.x=i;p.y=state.pose.t+i;p.z=0;return p;}};
 const catcher={visible:false};let snapshot;
 const viewer={coach:{updateMatrixWorld(){stats.worldUpdates++;},traverse:f=>f(mesh)},
  motion:{getMetrics:()=>({joints:joints()})},shadowCatcher:catcher,scene:{traverse:f=>f(mesh)},
  camera:{position:new V(0,1,3),matrixWorld:{elements:[1,2,3]},projectionMatrix:{elements:[4,5,6]},
   lookAt(p){this.target=p.toArray();},updateMatrixWorld(){}},
  renderer:{shadowMap:{},domElement:{toDataURL:()=>JSON.stringify(snapshot)},render(){
   const shader={uniforms:{},fragmentShader:'void main(){float d=0.5;vec3 lit;vec3 cyl;lit=mix(lit,cyl,d*0.94);}'};
   material.onBeforeCompile(shader,this);
   snapshot={pose:{...state.pose},camera:viewer.camera.position.toArray(),target:viewer.camera.target,
    breath:context.__toonUni.uBreath.value,pulse:context.__toonUni.uPulse.value,
    layer:catcher.visible?'shadow':shader.uniforms.uV2LayerPass.value===1?'highlight':'body',
    colorWrite:material.colorWrite,depthWrite:material.depthWrite,glow:context.__glowU.value};
  }}};
 const E={_jo:{},cam0:{pos:new V(0,1,3),tgt:new V(0,.7,0)},selectModelProfile(){},pulseAt:(_,__,t)=>Math.sin(t),
  meshCache(){if(!state.cached){state.cached=[{o:mesh}];state.cacheAt=state.pose.t;}return state.cached;},
  handClip(sides,opts){viewer.coach.updateMatrixWorld(true);for(const l of this.meshCache())l.o.skeleton.update();
   if(opts?.actualSolver)stats.solver++;else stats.diagnostic++;
   return {left:{minMm:7+state.cacheAt,normal:[1,0,0]},right:{minMm:9,normal:[0,1,0]}};},
  applyAt(spec,t,warm){const c=t>=(spec.contactAfterSeconds??0)?this.handClip(['left'],{actualSolver:true}).left:{minMm:0};
   state.pose={t,shift:c.minMm/1000+(warm?.seed??0)/1000};
   this._jo={head:[state.pose.shift,1.7,.1]};
   return {x:{seed:t+1},params:{t},locked:{left:false,right:true},touch:{left:c.minMm}};},
  metrics(){stats.metrics++;return {joints:{...joints(),...this._jo},minY:.001,diagnosticOnly:true};}};
 const T={Vector3:V,MeshDepthMaterial:class{dispose(){}},RGBADepthPacking:3201};
 const context=vm.createContext({console,window:null,__toonT:T,__drill:E,E,V:a=>new V(...a),
  __toonUni:{uBreath:{value:0},uPulse:{value:0}},__glowU:{value:0},__setHighlight(){},flareInspector:{viewer}});
 context.window=context;
 vm.runInContext('__drill.frame = ('+built.expectedFrame+');',context);
 return {context,E,stats,state,viewer,page:{evaluate:(f,args)=>vm.runInContext('('+f.toString()+')('+JSON.stringify(args)+')',context)}};
}

test('motion/contact solver, warm x and three render-state passes stay equal in VM',async()=>{
 const baseline=fixture(),fast=fixture();
 const motion=fast.E.applyAt,contact=fast.E.handClip;
 await installTechnicalFrame(fast.page,built);
 assert.equal(fast.E.applyAt,motion);assert.equal(fast.E.handClip,contact);
 vm.runInContext(layers,baseline.context);vm.runInContext(built.layersSource,fast.context);
 const spec={timeline:{duration:8},camera:{drift:.9,orbitDegrees:8,frontSweepDegrees:2},highlight:{},shadow:{joints:['leftWrist']},contactAfterSeconds:4};
 let warm=null;
 for(const f of [0,63,120,239,240]){
  const args=JSON.stringify([spec,f/30,f,warm,['body','highlight','shadow']]);
  const a=vm.runInContext('__v2Layers.capture(...'+args+')',baseline.context);
  const b=vm.runInContext('__v2Layers.capture(...'+args+')',fast.context);
  for(const layer of ['body','highlight','shadow'])assert.equal(b[layer],a[layer],layer+' state differed at '+f);
  assert.equal(JSON.stringify(b.metrics.x),JSON.stringify(a.metrics.x));
  assert.equal(JSON.stringify(b.metrics.J),JSON.stringify(a.metrics.J));warm=a.metrics.x;
 }
 assert.equal(fast.stats.solver,baseline.stats.solver);assert.equal(fast.stats.solver,3);
 assert.equal(fast.state.cacheAt,baseline.state.cacheAt);assert.equal(fast.state.cacheAt,0);
 assert.equal(baseline.stats.diagnostic,5);assert.equal(fast.stats.diagnostic,0);
 assert.equal(baseline.stats.metrics,5);assert.equal(fast.stats.metrics,0);
 assert.equal(baseline.stats.vertices,15);assert.equal(fast.stats.vertices,0);
 assert.equal(fast.stats.worldUpdates,baseline.stats.worldUpdates);
 assert.equal(fast.stats.skeletonUpdates,baseline.stats.skeletonUpdates);
});

test('unexpected active frame is refused, including special CPU/profile overrides',async()=>{
 const f=fixture();f.E.frame=function customCpuFrame(){};
 await assert.rejects(installTechnicalFrame(f.page,built),/not the pinned frozen driver/);
});

test('mode is opt-in and matching preview identity binds diagnostic mode',()=>{
 assert.equal(parseArgs(['preview']).technicalDiagnosticsOnly,undefined);
 assert.equal(parseArgs(['preview','--technical-diagnostics-only']).technicalDiagnosticsOnly,true);
 const identity={tool:'test',toolSha256:'a',sourceSha256:'b',specId:'s',actionId:'s',profile:{},fps:30,durationSeconds:8,
  frameCount:240,size:1080,cameraDistanceScale:3.2,captureDiagnosticsMode:'original',runtimeSha256:'c'};
 const preview={...identity,mode:'preview',complete:true,frames:[0,60,239,240],sequences:{body:{},highlight:{},shadow:{}}};
 checkPreview(preview,identity);
 assert.throws(()=>checkPreview(preview,{...identity,captureDiagnosticsMode:'technical-diagnostics-only'}),/provenance/);
});
