// Candidate preview only. Does not modify production recipes, specs or frozen models.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const [outArg,runtimeArg]=process.argv.slice(2);
if(!outArg||!runtimeArg)throw Error('Usage: node tools/body-v3/armfix-r1/preview.mjs <new-output-directory> <pinned-runtime.json>');
const OUT=path.resolve(outArg);
if(fs.existsSync(OUT))throw Error('Output already exists; use a new revision directory');
fs.mkdirSync(OUT,{recursive:true});
const runtime=JSON.parse(fs.readFileSync(runtimeArg,'utf8'));
if(runtime.format!=='pose-hub-render-runtime@1')throw Error('Pinned runtime required');
for(const ref of [runtime.playwrightModule,runtime.browserExecutable]){const raw=fs.readFileSync(ref.path);if(raw.length!==ref.bytes||crypto.createHash('sha256').update(raw).digest('hex')!==ref.sha256)throw Error('Pinned runtime changed');}
process.env.PLAYWRIGHT_MODULE=runtime.playwrightModule.path;
process.env.CHROMIUM_ARGS=runtime.chromiumArgs.join(' ');
// APP_URL comes from the environment or ignored local config.
const imp=rel=>import(pathToFileURL(path.join(REPO,rel)).href);
const {loadTheme}=await imp('drill-anim/lib/config.mjs');
const baseSpec=(await imp('drill-anim/specs/h-standing-arm-extension-stretch.js')).default;
const report={format:'pose-hub-arm-proportion-diagnostic@1',scope:'Arm correction candidate; standard poses use measured candidate lengths; old action is diagnostic only',models:[]};
for(const name of ['armfix-r1']){
 let browser;
 try{
  const model=name==='v2plus'?await imp('drill-anim/lib/human-v2plus.mjs'):await imp('drill-anim/models/training-human-v3-armfix-r1/loader.mjs');
  const boot=name==='v2plus'?(await imp('drill-anim/lib/boot.mjs')).boot:model.boot;
  const spec={...structuredClone(baseSpec),modelProfile:name==='v2plus'?'training-human-v2plus':'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'},props:[],highlight:{groups:[],side:'both'}};
  const opened=await boot({size:640,pr:1,theme:loadTheme()});browser=opened.b;const page=opened.p;
  const gpu=await page.evaluate(()=>{const g=flareInspector.viewer.renderer.getContext(),e=g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);});
  if(gpu!==runtime.actualWebGLRenderer)throw Error('GPU differs from pinned runtime: '+gpu);
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const setup=name==='v2plus'?await model.applyHumanV2plus(page,spec):await model.applyV3(page,spec);
  await page.evaluate(s=>{
   const v=flareInspector.viewer;v.animate=()=>{};v.playing=false;
   __drill.selectModelProfile(s);v.motion.reset();v.coach.updateMatrixWorld(true);
   __setHighlight({groups:[],side:'both'});__glowU.value=0;__rimU.value=1;__toonUni.uBreath.value=0;__toonUni.uPulse.value=0;
   for(const o of [v.shadowCatcher,v.stageFloor,v.stageGrid,v.stageRing])if(o)o.visible=false;
   v.scene.background=null;v.renderer.setClearColor(0xf0f2f4,1);
   window.__proportionOrtho=new __toonT.OrthographicCamera(-1.15,1.15,1.15,-1.15,.01,20);
  },spec);
  const row={model:name,setup,gpu,frames:[],pageErrors:errors};
  async function save(pose,view){
   const item=await page.evaluate(([pose,view])=>{
    const v=flareInspector.viewer,T=__toonT,C=__proportionOrtho;
    const target=new T.Vector3(0,.85,0);C.position.copy(target).add(view==='side'?new T.Vector3(4,0,0):new T.Vector3(0,0,4));
    C.lookAt(target);C.updateProjectionMatrix();C.updateMatrixWorld();
    v.coach.updateMatrixWorld(true);v.renderer.render(v.scene,C);
    const metrics=v.motion.getMetrics(),J={...metrics.joints,...(__drill._jo||{})},p=k=>new T.Vector3(...J[k]);
    const distance=(a,b)=>p(a).distanceTo(p(b))*1000,angle=(a,b,c)=>p(a).sub(p(b)).angleTo(p(c).sub(p(b)))*180/Math.PI;
    const sides={},liveBones={};
    for(const side of ['left','right']){const names=[side+'UpperArm',side+'Forearm',side+'Hand'];const points=names.map(n=>{const b=v.coach.getObjectByName(n);if(!b?.isBone)throw Error('Missing bone '+n);return b.getWorldPosition(new T.Vector3());});liveBones[side]={upperArmMm:points[0].distanceTo(points[1])*1000,forearmMm:points[1].distanceTo(points[2])*1000,points:points.map(p=>p.toArray())};}
    const handRig=window.__v2p?.hands?.mesh?.skeleton;
    const fingers=handRig?.bones.filter(b=>/^v2p_[LR]_(thumb|index|middle|ring|pinky)[123]$/.test(b.name)).map(b=>({name:b.name,local:b.position.toArray(),scale:b.scale.toArray()}))||[];
    for(const side of ['left','right'])sides[side]={upperArmMm:distance(side+'Shoulder',side+'Elbow'),forearmMm:distance(side+'Elbow',side+'Wrist'),
      elbowDegrees:angle(side+'Shoulder',side+'Elbow',side+'Wrist'),kneeDegrees:angle(side+'Hip',side+'Knee',side+'Ankle'),
      shoulder:J[side+'Shoulder'],elbow:J[side+'Elbow'],wrist:J[side+'Wrist']};
    return {pose,view,sides,liveBones,fingers,segmentLengths:metrics.segmentLengths,expectedLengths:metrics.expectedLengths,
      image:v.renderer.domElement.toDataURL('image/png')};
   },[pose,view]);
   const file=name+'-'+pose+'-'+view+'.png';fs.writeFileSync(path.join(OUT,file),Buffer.from(item.image.split(',')[1],'base64'),{flag:'wx'});delete item.image;
   for(const side of [...Object.values(item.sides),...Object.values(item.liveBones)]){if(Math.abs(side.upperArmMm-256.7805)>.2||Math.abs(side.forearmMm-228.0465)>.2)throw Error('Incorrect live arm length');if(!Object.values(side).flat().every(x=>typeof x!=='number'||Number.isFinite(x)))throw Error('Nonfinite joint');}
   if((pose==='arms-down'||pose.startsWith('lift-'))&&Object.values(item.sides).some(s=>s.elbowDegrees<174||s.kneeDegrees<174))throw Error('Calibrated diagnostic pose unexpectedly bends');
   row.frames.push({...item,file});
  }
  await save('rest','front');
  // Diagnostic standing uses each rig's own measured lengths, not old fixed wrist coordinates.
  await page.evaluate(s=>{
   const E=__drill,R=E.R,T=__toonT;
   const hands={};
   for(const side of ['left','right']){
    const sign=side==='left'?1:-1,S=R[side+'Shoulder'],length=E.L[side+'UpperArm']+E.L[side+'Forearm'];
    hands[side]={mode:'free',frame:'world',wrist:[S[0]+sign*.08*length,S[1]-Math.sqrt(1-.08**2)*length*.9995,S[2]],
      finger:[0,-1,0],normal:[-sign,0,0],pole:[S[0]+sign*.05,S[1]-.25,S[2]-.3],relax:.5};
   }
   const feet=Object.fromEntries(['left','right'].map(side=>[side,{mode:'free',frame:'world',ankle:R[side+'Ankle'].slice(),rot:[],pole:[R[side+'Hip'][0],.5,.4]}]));
   const neutral={...s,id:'diagnostic-arms-down',timeline:{duration:8,tracks:{}},pose:{base:{pelvis:R.pelvis.slice(),hips:{up:[0,1,0],front:[0,0,1],rot:[]},chest:{waist:[]},hands,feet,constraints:[],solve:{vars:[],reg:{}}},deltas:{}}};
   E.applyAt(neutral,0,null);__props?.update();flareInspector.viewer.coach.updateMatrixWorld(true);
  },spec);
  await save('arms-down','front');await save('arms-down','side');
  for(const lift of [45,90,160]){
   await page.evaluate(([s,lift])=>{
    const E=__drill,R=E.R,a=lift*Math.PI/180,hands={};
    for(const side of ['left','right']){const sign=side==='left'?1:-1,S=R[side+'Shoulder'],L=(E.L[side+'UpperArm']+E.L[side+'Forearm'])*.9995;
     hands[side]={mode:'free',frame:'world',wrist:[S[0]+sign*Math.sin(a)*L,S[1]-Math.cos(a)*L,S[2]],finger:[sign*Math.sin(a),-Math.cos(a),0],normal:[0,0,1],pole:[S[0],S[1],S[2]-.4],relax:.5};}
    const feet=Object.fromEntries(['left','right'].map(side=>[side,{mode:'free',frame:'world',ankle:R[side+'Ankle'].slice(),rot:[],pole:[R[side+'Hip'][0],.5,.4]}]));
    E.applyAt({...s,id:'diagnostic-arm-lift',timeline:{duration:8,tracks:{}},pose:{base:{pelvis:R.pelvis.slice(),hips:{up:[0,1,0],front:[0,0,1],rot:[]},chest:{waist:[]},hands,feet,constraints:[],solve:{vars:[],reg:{}}},deltas:{}}},0,null);
   },[spec,lift]);
   await save('lift-'+lift,'front');await save('lift-'+lift,'side');
  }
  for(const t of [0,3.5]){
   await page.evaluate(([s,t])=>{flareInspector.viewer.motion.reset();__drill.applyAt(s,t,null);__toonUni.uBreath.value=0;__setHighlight({groups:[],side:'both'});},[spec,t]);
   await save('action-t'+String(t).replace('.','_'),'front');await save('action-t'+String(t).replace('.','_'),'side');
  }
  if(errors.length)throw Error('Browser errors: '+errors.join(';'));
  report.models.push(row);console.log(JSON.stringify({model:name,frames:row.frames.map(x=>({pose:x.pose,view:x.view,left:x.sides.left}))}));
 }finally{if(browser)await browser.close();}
}
fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
