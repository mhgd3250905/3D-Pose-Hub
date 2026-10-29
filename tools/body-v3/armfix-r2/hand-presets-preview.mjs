// Fresh GPU review of fixed hand presets. Does not update production assets/specs.
import fs from 'node:fs';
import path from 'node:path';
import {SOURCE,imp,readJson,pinnedRuntime,verifyRuntimeSelection,sourcePins,saveJson,saveImage,measureHands,handPictures,initView} from './hand-qa-runtime.mjs';
import {makeGripPreset,installGrip,prepareGripSpec} from './grip-symmetric-install.mjs';
import {exportGripInput} from './grip-symmetric-export.mjs';
import {calibrateSupport} from './support-calibrate.mjs';
import {installSupport} from './support-install.mjs';
import {installRestPresets} from './hand-rest-presets.mjs';
const [out,runtimeFile,supportFile]=process.argv.slice(2);if(!out||!runtimeFile||fs.existsSync(out))throw Error('New output directory and pinned runtime required');
const rt=pinnedRuntime(runtimeFile);const runtimeSelection=await verifyRuntimeSelection(rt);fs.mkdirSync(out,{recursive:true});
const model=await imp('drill-anim/models/training-human-v3-armfix-r2/loader.mjs');
const {loadTheme}=await imp('drill-anim/lib/config.mjs'),theme=loadTheme();
const source=(await imp('drill-anim/specs/h-db-reverse-curl-r2.js')).default;
const spec=prepareGripSpec(source),rig=readJson('drill-anim/models/'+SOURCE+'/hands-rig.json');
const {b,p}=await model.boot({size:640,pr:1,theme});
const report={format:'pose-hub-four-hand-preview@1',source:SOURCE,runtimeSelection,reviewed:false,releaseEligible:false,frames:[],limits:['Hand preset and representative-pose review only. Unmodified legacy action targets are not certified for new body proportions.','Four fixed shapes; only the 32 mm grasp is calibrated. No automatic fit to arbitrary props.']};
try{
 report.gpu=await p.evaluate(()=>{const g=flareInspector.viewer.renderer.getContext(),e=g.getExtension('WEBGL_debug_renderer_info');return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER);});
 if(report.gpu!==rt.actualWebGLRenderer)throw Error('Unexpected GPU renderer');
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 report.setup=await model.applyV3(p,spec);await initView(p);
 const support=supportFile?JSON.parse(fs.readFileSync(supportFile,'utf8')):await calibrateSupport(p,{rig,sourceId:SOURCE,sourcePins:sourcePins()});saveJson(path.join(out,'support-fixed.json'),support);
 report.support=await installSupport(p,support);report.rest=await installRestPresets(p,rig);
 const grasp=makeGripPreset();saveJson(path.join(out,'grasp-fixed.json'),grasp);report.grasp=await installGrip(p,grasp);
 async function bodyPicture(name){const uri=await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer,C=new T.OrthographicCamera(-1.12,1.12,1.12,-1.12,.01,20),target=new T.Vector3(0,.85,0);C.position.copy(target).add(new T.Vector3(2,.5,4));C.lookAt(target);C.updateMatrixWorld();v.renderer.clear(true,true,true);v.renderer.render(v.scene,C);return v.renderer.domElement.toDataURL('image/png');});saveImage(path.join(out,name+'-body.png'),uri);}
 async function savePose(name,{pictures=true,plane=null}={}){
  const data=await measureHands(p);saveJson(path.join(out,name+'-mesh.json'),data);
  const row={name,plane,sides:Object.fromEntries(Object.entries(data.sides).map(([s,x])=>[s,{pose:x.pose,upperArmMm:x.upperArmMm,forearmMm:x.forearmMm}]))};
  for(const side of Object.values(row.sides))if(Math.abs(side.upperArmMm-256.7805)>.2||Math.abs(side.forearmMm-228.0465)>.2)throw Error('Hand installation changed arm lengths');
  if(pictures){for(const side of ['left','right']){const images=await handPictures(p,{pose:name,side,prop:name.startsWith('grasp')});for(const [view,uri]of Object.entries(images))saveImage(path.join(out,name+'-'+side+'-'+view+'.png'),uri);}await bodyPicture(name);}
  report.frames.push(row);console.log('captured '+name);
 }
 async function neutral(pose,lift=0){await p.evaluate(({s,pose,lift})=>{
  const E=__drill,R=E.R,a=lift*Math.PI/180,hands={};
  for(const side of ['left','right']){const sign=side==='left'?1:-1,S=R[side+'Shoulder'],L=(E.L[side+'UpperArm']+E.L[side+'Forearm'])*.9995;
   hands[side]={mode:'free',frame:'world',wrist:[S[0]+sign*Math.sin(a||.08)*L,S[1]-Math.cos(a||.08)*L,S[2]],finger:[sign*Math.sin(a||.08),-Math.cos(a||.08),0],normal:lift?[0,0,1]:[-sign,0,0],pole:[S[0],S[1],S[2]-.4],relax:1};}
  const feet=Object.fromEntries(['left','right'].map(side=>[side,{mode:'free',frame:'world',ankle:R[side+'Ankle'].slice(),rot:[],pole:[R[side+'Hip'][0],.5,.4]}]));
  const d={...s,id:'hand-diagnostic',props:[],v2plus:{...s.v2plus,handPose:{left:pose,right:pose}},timeline:{duration:8,tracks:{}},pose:{base:{pelvis:R.pelvis.slice(),hips:{up:[0,1,0],front:[0,0,1],rot:[]},chest:{waist:[]},hands,feet,constraints:[],solve:{vars:[],reg:{}}},deltas:{}}};
  for(const o of __props.list)o.visible=false;E.applyAt(d,0,null);flareInspector.viewer.coach.updateMatrixWorld(true);
 },{s:spec,pose,lift});}
 for(const pose of ['relaxed','assist']){await neutral(pose);await savePose(pose);}
 // Representative light wall touch: the author places the fixed hand at the plane.
 await p.evaluate(s=>{
  const E=__drill,R=E.R,hands={};for(const side of ['left','right']){const sign=side==='left'?1:-1;hands[side]={mode:'free',frame:'world',wrist:[sign*.23,1.02,.3],finger:[0,1,0],normal:[0,0,1],pole:[sign*.45,.95,.02]};}
  const feet=Object.fromEntries(['left','right'].map(side=>[side,{mode:'free',frame:'world',ankle:R[side+'Ankle'].slice(),rot:[],pole:[R[side+'Hip'][0],.5,.4]}]));
  window.__assistFixtureSpec={...s,id:'fixed-assist-wall-fixture',props:[],v2plus:{...s.v2plus,handPose:{left:'assist',right:'assist'}},timeline:{duration:8,tracks:{}},pose:{base:{pelvis:R.pelvis.slice(),hips:{up:[0,1,0],front:[0,0,1],rot:[]},chest:{waist:[]},hands,feet,constraints:[],solve:{vars:[],reg:{}}},deltas:{}}};
  E.applyAt(__assistFixtureSpec,0,null);
 },spec);
 const wallMeasure=await measureHands(p),wall=.38,shifts=Object.fromEntries(Object.entries(wallMeasure.sides).map(([side,d])=>[side,wall-Math.max(...d.ids.map(i=>wallMeasure.positions[i*3+2]))]));
 await p.evaluate(({shifts,wall})=>{const E=__drill,T=__toonT;for(const side of ['left','right'])__assistFixtureSpec.pose.base.hands[side].wrist[2]+=shifts[side];E.applyAt(__assistFixtureSpec,0,null);
  const mesh=new T.Mesh(new T.BoxGeometry(.9,.5,.02),new T.MeshBasicMaterial({color:0x86afc9,transparent:true,opacity:.2,depthWrite:false}));mesh.position.set(0,1.16,wall+.01);mesh.userData.qaHandSurface=true;flareInspector.viewer.scene.add(mesh);window.__qaWall=mesh;
 },{shifts,wall});
 await savePose('assist-wall',{plane:{normal:[0,0,-1],offset:wall}});
 await p.evaluate(()=>{__qaWall.visible=false;});
 for(const lift of [45,90,160]){await neutral('relaxed',lift);await savePose('raise-'+lift,{pictures:lift===90});}
 // A fixed hand remains unchanged in local space during the entire sampled curl.
 await p.evaluate(([s,th])=>{for(const prop of s.props)__props.add(th,prop);},[spec,theme]);
 const gripDir=path.join(out,'grip-cycle');fs.mkdirSync(gripDir);
 for(let k=0;k<=16;k++){
  const t=k*.5;await p.evaluate(([s,t])=>{__drill.applyAt(s,t,null);__props.update();for(const o of __props.list)o.visible=true;},[spec,t]);
  const data=await exportGripInput(p,spec,{frame:Math.round(t*30)});saveJson(path.join(gripDir,'input-'+t+'.json'),data);
  if([0,4,8,12,16].includes(k))await savePose('grasp-'+t,{pictures:[0,4,16].includes(k)});
 }
 const bear=(await imp('drill-anim/specs/h-bear-plank-r3.js')).default;
 const supportSpec={...bear,nativeHands:{},runtimeModel:spec.runtimeModel,v2plus:{...bear.v2plus,handPose:{left:'support',right:'support'}}};
 for(const t of [0,2,4,8]){
  await p.evaluate(([s,t])=>{for(const o of __props.list)o.visible=false;__drill.applyAt(s,t,null);},[supportSpec,t]);
  await savePose('support-'+t,{pictures:[0,2].includes(t),plane:{normal:[0,1,0],offset:0}});
 }
 const single=structuredClone(supportSpec);single.id='fixed-single-support-fixture';single.v2plus.handPose.right='relaxed';single.pose.base.hands.right={mode:'free',frame:'world',wrist:[-.08,.28,.3],finger:[.8,-.4,0],normal:[0,0,1],pole:[-.2,.6,.5]};
 await p.evaluate(s=>__drill.applyAt(s,0,null),single);await savePose('support-single',{plane:{normal:[0,1,0],offset:0,sides:['left']}});
 report.pageErrors=errors;if(errors.length)throw Error('Page errors');saveJson(path.join(out,'report.json'),report);
 console.log(JSON.stringify({out,gpu:report.gpu,frames:report.frames.length,support: Object.fromEntries(Object.entries(support.sides).map(([s,d])=>[s,{wristHeightM:d.wristHeightM,contact:d.contact}]))}));
}catch(error){saveJson(path.join(out,'failure.json'),{error:String(error),stack:error.stack,report});throw error;}finally{await b.close();}
