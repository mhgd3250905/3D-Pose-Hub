// Canonical r5 integration: separate fresh baseline and candidate pages, one browser at a time.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),out=process.argv[2];
const baselineDirectory=process.argv[3]==='--baseline'?process.argv[4]:null;if(!out||fs.existsSync(out)||(process.argv.length!==3&&!(process.argv.length===5&&baselineDirectory)))throw Error('Usage: node verify-live-r7.mjs <NEW output directory> [--baseline <completed-baseline-directory>]');
fs.mkdirSync(out);
const imp=f=>import(pathToFileURL(path.join(root,f)).href),base=await imp('drill-anim/models/training-human-v3-completed-r7/loader.mjs'),addon=await imp('drill-anim/models/training-human-v3-contact-r5/loader.mjs'),{loadTheme}=await imp('drill-anim/lib/config.mjs');
const full={modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'}};
const palm={...structuredClone((await imp('drill-anim/specs/h-kneeling-pushup-rr1.js')).default),...full,id:'v3-contact-palm-probe'};
for(const s of ['left','right']){const h=palm.pose.base.hands[s];palm.pose.base.hands[s]={mode:'floor',at:[h.at[0],h.at[1]],finger:[h.finger[0],h.finger[2]??0],relax:0,poleUp:h.poleUp};}
if(Object.values(palm.pose.deltas||{}).some(d=>d.hands))throw Error('Unexpected palm hand deltas');
const stand={...structuredClone((await imp('drill-anim/specs/h-bent-knee-calf-raise-rr7.js')).default),...full},side={...structuredClone((await imp('drill-anim/specs/h-side-leg-raise.js')).default),...full};
const stages=[],errors=[];let browser,page,timer,baseline,setup;
const write=(file,data)=>fs.writeFileSync(path.join(out,file),data,{flag:'wx'});
async function stage(name,run){
  const free=os.freemem()/1024**3;stages.push({stage:name,freeGiB:free});if(free<(browser?2:3.5))throw Error('Insufficient available memory before '+name);
  console.log(name,free.toFixed(2)+' GiB free');let timeout;
  try{return await Promise.race([run(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('Stage timeout '+name)),150000);})]);}finally{clearTimeout(timeout);}
}
const bones=()=>page.evaluate(()=>__v2p.hands.mesh.skeleton.bones.map(b=>({name:b.name,parent:b.parent?.name,position:b.position.toArray(),quaternion:b.quaternion.toArray(),scale:b.scale.toArray()})));
const pose=(spec,time,warm=null)=>page.evaluate(([s,t,w])=>{__drill.selectModelProfile(s);const r=__drill.applyAt(s,t,w);__toonUni.uBreath.value=0;__toonUni.uPulse.value=1;flareInspector.viewer.coach.updateMatrixWorld(true);return r;},[spec,time,warm]);
const probe=()=>page.evaluate(()=>__contactProbe2({lengthAxis:[1,0,0]}));
async function shot(kind,name){return stage(name,async()=>{const value=await page.evaluate(k=>__contactShot2(k),kind),buf=Buffer.from(value.split(',')[1],'base64');write(name+'.png',buf);return buf;});}
async function diagnostics(){await page.addScriptTag({content:fs.readFileSync(new URL('./diagnostics-r2.js',import.meta.url),'utf8')});await page.evaluate(()=>{const v=flareInspector.viewer;v.animate=()=>{};v.playing=false;__setHighlight({groups:[],side:'both'});__glowU.value=0;__rimU.value=1;__toonUni.uBreath.value=0;});}
async function open(model){const value=await stage('boot '+model.VERSION,()=>model.boot({size:480,pr:1,theme:loadTheme()}));browser=value.b;page=value.p;page.on('pageerror',e=>errors.push(String(e)));}
async function close(){if(browser){const b=browser;browser=null;await b.close();}}
try{
  if(baselineDirectory){
    const directory=path.resolve(baselineDirectory),prior=JSON.parse(fs.readFileSync(path.join(directory,'report.json'),'utf8'));
    if(prior.setup?.baseVersion!=='1.0.0-r7'||prior.pageErrors?.length)throw Error('Baseline is not a completed clean r7 run');
    baseline=JSON.parse(fs.readFileSync(path.join(directory,'baseline.json'),'utf8'));baseline.neutral={};
    for(const name of ['before-left','before-right','before-neck-side','before-neck-back']){const buf=fs.readFileSync(path.join(directory,name+'.png'));write(name+'.png',buf);if(name.startsWith('before-neck'))baseline.neutral[name.slice(7)]=buf;}
    write('baseline.json',JSON.stringify({palm:baseline.palm,fingerPose:baseline.fingerPose,reusedFrom:path.basename(directory)},null,2));
  }else{
  await open(base);await stage('baseline r7 apply',()=>base.applyV3(page,palm));await diagnostics();
  baseline={palm:{},neutral:{},fingerPose:null};
  for(const t of [0,2.1,4]){await pose(palm,t);baseline.palm[t]=await probe();if(t===0){baseline.fingerPose=(await bones()).filter(x=>x.name.startsWith('v2p_'));for(const s of ['left','right'])await shot(s,'before-'+s);}}
  await pose(stand,0);for(const kind of ['neck-side','neck-back'])baseline.neutral[kind]=await shot(kind,'before-'+kind);
  write('baseline.json',JSON.stringify({palm:baseline.palm,fingerPose:baseline.fingerPose},null,2));
  await close();
  }
  await open(addon);
  const evaluate=page.evaluate.bind(page);let captured=false;
  page.evaluate=async(fn,arg)=>{
    if(!captured&&String(fn).includes('v3-contact: expected fresh active full r7')){
      captured=true;
      await evaluate(()=>{
        const v=flareInspector.viewer,H=__v2p.hands.mesh;
        const control=()=>{const m=v.motion.getMetrics();return {mode:m.mode,time:m.time,angle:m.angle,groundLock:m.groundLock,bodyQuaternion:m.bodyQuaternion,pelvisQuaternion:m.pelvisQuaternion,torsoQuaternion:m.torsoQuaternion,warnings:m.warnings};};
        window.__contactAuditControl=control;
        window.__contactAuditBefore={mesh:H,bones:H.skeleton.bones.slice(),parents:H.skeleton.bones.map(b=>b.parent),local:H.skeleton.bones.map(b=>[b.position.toArray(),b.quaternion.toArray(),b.scale.toArray()]),curRef:__v2p.cur,cur:JSON.stringify(__v2p.cur),control:JSON.stringify(control()),ground:v.motion.getGroundHandPose,pose:__drill.pose,setHandPose:__v2p.setHandPose,poseKeys:Object.keys(__v2p.poses).sort().join('|'),palmPose:__v2p.poses['palm-floor']};
      });
    }
    return evaluate(fn,arg);
  };
  setup=await stage('canonical addon apply',()=>addon.applyV3(page,palm));page.evaluate=evaluate;
  if(!captured||setup.profile!==addon.PROFILE||setup.version!==addon.VERSION||setup.baseVersion!=='1.0.0-r7')throw Error('Canonical identity/precondition capture failed');
  const installState=await page.evaluate(()=>{const a=__contactAuditBefore,H=__v2p.hands.mesh;if(a.mesh!==H||a.bones.some((b,i)=>b!==H.skeleton.bones[i]||b.parent!==a.parents[i]||[b.position.toArray(),b.quaternion.toArray(),b.scale.toArray()].some((x,j)=>x.some((v,k)=>v!==a.local[i][j][k]))))throw Error('Installation changed bone identity or pose');if(__v2p.cur!==a.curRef||JSON.stringify(__v2p.cur)!==a.cur)throw Error('Installation changed hand selection');if(JSON.stringify(__contactAuditControl())!==a.control)throw Error('Installation changed motion controller state');return {bones:52,fingers:30,localTransformsAndReferencesUnchanged:true,handSelectionUnchanged:true,controllerStateUnchanged:true};});
  await diagnostics();const after={palm:{},neck:{},sideLeg:[]};
  for(const t of [0,2.1,4]){await pose(palm,t);after.palm[t]=await probe();if(t===0)for(const s of ['left','right'])await shot(s,'after-'+s);}
  await pose(stand,0);
  for(const kind of ['neck-side','neck-back']){const buf=await shot(kind,'after-neutral-'+kind);if(!buf.equals(baseline.neutral[kind]))throw Error('Neutral neck changed '+kind);}
  for(const [name,channel,angle]of [['flex','flex',40],['extend','flex',-35],['turn','rot',65],['side','side',30]]){await pose({...stand,neck:{[channel]:angle}},0);after.neck[name]=await page.evaluate(()=>__contactNeckSeam2());for(const kind of ['neck-side','neck-back'])await shot(kind,name+'-'+kind);}
  for(const enabled of [false,true]){
    await page.evaluate(x=>{__v3ReviewedPoseHookR5.enabled=x;},enabled);
    for(const t of [0,2,4,6,7.999]){
      const row=await page.evaluate(([s,t])=>{const v=flareInspector.viewer,T=__toonT;function collect(warm){v.motion.reset();const r=__drill.applyAt(s,t,warm);v.coach.updateMatrixWorld(true);const point=n=>v.coach.getObjectByName(n).getWorldPosition(new T.Vector3()).toArray();return {x:r.x,warnings:r.warn,touch:r.touch,pelvis:point('pelvis'),leftHand:point('leftHand'),rightHand:point('rightHand')};}return {cold:collect(null),warm:collect({pz:.2})};},[side,t]);
      after.sideLeg.push({enabled,time:t,...row});if(t===0||t===2)await shot('body',(enabled?'prepared':'original')+'-sideleg-'+t);
    }
  }
  await page.evaluate(()=>{__v3ReviewedPoseHookR5.enabled=true;});await pose(palm,0);
  const removed=await page.evaluate(()=>{const before=JSON.stringify(__contactAuditControl()),contact=__v3ContactR5.remove(),reviewed=__v3ReviewedPoseHookR5.remove();if(flareInspector.viewer.motion.getGroundHandPose!==__contactAuditBefore.ground||__drill.pose!==__contactAuditBefore.pose)throw Error('Layer hooks not restored');if(__v2p.setHandPose!==__contactAuditBefore.setHandPose||Object.keys(__v2p.poses).sort().join('|')!==__contactAuditBefore.poseKeys||__v2p.poses['palm-floor']!==__contactAuditBefore.palmPose)throw Error('Hand setter/registry aliases not restored');if(JSON.stringify(__contactAuditControl())!==before)throw Error('Removal changed controller state');return {contact,reviewed,hooksRestored:true,controllerStateUnchanged:true};});
  const fingerAfter=(await bones()).filter(x=>x.name.startsWith('v2p_'));
  if(JSON.stringify(fingerAfter)!==JSON.stringify(baseline.fingerPose))throw Error('Active hand pose not restored to legacy registry');
  const detached=await base.detachGeometryLayers(page);
  const report={setup,installState,before:{palm:baseline.palm},after,removed,activePalmPoseRestored:true,detached,stages,pageErrors:errors};
  const violations=[];
  for(const [time,sides]of Object.entries(after.palm))for(const [side,groups]of Object.entries(sides)){
    if(groups.all.belowMinus2mm!==0)violations.push(time+' '+side+' penetration beyond -2 mm');
    for(const region of ['palm','heel','thumbTip','indexTip','middleTip','ringTip','pinkyTip']){
      const stat=groups[region];if(!stat?.n||!Number.isFinite(stat.p10)||stat.p10>4||stat.within4mm<1)violations.push(time+' '+side+' '+region+' p10/contact threshold');
    }
  }
  for(const [name,seam]of Object.entries(after.neck))if(seam.sharedVertices!==162||seam.sharedEdges!==162||seam.edgesWithTwoFaces!==162||!Number.isFinite(seam.faceAngleMax))violations.push(name+' seam topology');
  report.acceptance={scope:'three sampled palm times; four neck angles; five side-leg times, not full-action acceptance',palm:{minimumAllowedMm:-2,maximumP10Mm:4,eachTipChecked:true},violations,passed:violations.length===0&&!errors.length};
  write('report.json',JSON.stringify(report,null,2));if(errors.length)throw Error('Page errors');if(violations.length)throw Error('Sampled acceptance failed: '+violations.join('; '));
  console.log('COMPLETE',JSON.stringify({installState,palm:after.palm,neck:after.neck,removed}));
}catch(error){write('failure.json',JSON.stringify({error:String(error),cause:String(error.cause||''),stages,before:baseline?.palm,setup,pageErrors:errors},null,2));throw error;}finally{clearTimeout(timer);await close();}
