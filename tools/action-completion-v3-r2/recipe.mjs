// Explicit per-action production input. No source spec or frozen model is changed.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

export const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const MODEL=Object.freeze({profile:'training-human-v3-armfix',version:'0.1.0-r2'});
export const HAND_MODES=Object.freeze(['native','support','relaxed','assist','dumbbell-grasp','fixed-grasp','bar-grasp']);
import {adapt as adaptFixedBarGrip,SHAFT_RADIUS_M} from './fixed-bar-grip-r1.mjs';
const BAR_PROPS=['parallettes','dipBars','pullupBar'];
const fail=(ok,message)=>{if(!ok)throw Error(message);};
export const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export const readJson=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
export function repoFile(relative){
  fail(typeof relative==='string'&&relative.length>0&&!path.isAbsolute(relative),'Repository-relative file required');
  const file=path.resolve(REPO,relative);
  fail(file.startsWith(REPO+path.sep)&&fs.statSync(file).isFile(),'File must remain inside repository');
  return file;
}

export function adaptRecipe(source,recipe){
  fail(recipe?.format==='pose-hub-action-recipe@1','Expected pose-hub-action-recipe@1 recipe');
  fail(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(recipe.id??''),'Safe stable action ID required');
  fail(recipe.model?.profile===MODEL.profile&&recipe.model.version===MODEL.version,'Recipe must select explicit armfix-r2');
  fail(recipe.output?.groundShadow===false&&recipe.output.cameraMotion===false&&recipe.output.wholeCycleContentRect===true&&recipe.output.fps===30,'Explicit no-shadow/fixed-camera/whole-cycle/30fps output required');
  fail(recipe.camera&&typeof recipe.camera==='object'&&!Array.isArray(recipe.camera),'Explicit camera recipe required');
  const hands=recipe.hands;
  for(const side of ['left','right'])fail(HAND_MODES.includes(hands?.[side]),'Explicit supported hand mode required: '+side);
  const spec=structuredClone(source);
  if(recipe.output.exerciseMat===false)spec.props=(spec.props??[]).filter(prop=>prop.type!=='mat'||prop.required===true);
  if(recipe.output.exerciseMat===true&&recipe.output.matProp!==undefined&&!(spec.props??[]).some(prop=>prop.type==='mat')){
    const m=recipe.output.matProp;
    fail(m?.type==='mat'&&Array.isArray(m.at)&&m.at.length===3&&m.at.every(Number.isFinite)&&Array.isArray(m.size)&&m.size.length===3&&m.size.every(x=>Number.isFinite(x)&&x>0&&x<4)&&Number.isFinite(m.yaw??0),'Recipe matProp must be a bounded mat prop');
    spec.props=[...(spec.props??[]),{type:'mat',at:[...m.at],size:[...m.size],yaw:m.yaw??0}];
  }
  spec.runtimeModel={...MODEL};spec.modelProfile='training-human-v2plus-hands-native';
  spec.nativeHands=source.nativeHands?.twistShare===undefined?{}:{twistShare:source.nativeHands.twistShare};
  spec.v2plus={...spec.v2plus,torso:'base',limbs:'base',hands:'base'};
  spec.camera={...spec.camera,...structuredClone(recipe.camera)};
  if(recipe.appearance!==undefined){
    const highlight=recipe.appearance?.highlight;
    fail(highlight&&/^#[0-9a-f]{6}$/i.test(highlight.color??''),'Appearance highlight requires an RGB hex color');
    fail(Array.isArray(highlight.shade)&&highlight.shade.length===3&&highlight.shade.every(x=>Number.isFinite(x)&&x>=0&&x<=1),'Highlight shade requires three finite values in [0,1]');
    fail(Array.isArray(highlight.intensity)&&highlight.intensity.length===2&&highlight.intensity.every(x=>Number.isFinite(x)&&x>=0&&x<=1)&&highlight.intensity[0]<=highlight.intensity[1],'Highlight intensity requires ordered finite min/max in [0,1]');
    spec.renderAppearance=structuredClone(recipe.appearance);
    if(highlight.material!==undefined){
      fail(highlight.material.type==='translucent-glow-r1','Unsupported highlight material');
      for(const key of ['opacity','emission','fresnel'])fail(Number.isFinite(highlight.material[key])&&highlight.material[key]>=0&&highlight.material[key]<=1,'Highlight material '+key+' must be in [0,1]');
    }
  }
  for(const key of ['drift','orbitDegrees','frontSweepDegrees'])fail(spec.camera[key]===0,'Camera motion must explicitly be zero: '+key);
  fail(spec.camera.fitTimeline===true,'Whole-cycle camera fitting required');
  spec.v2plus.handPose={...spec.v2plus.handPose};
  const modeToPose={support:'palm-floor',relaxed:'relaxed',assist:'open'};
  for(const side of ['left','right'])if(modeToPose[hands[side]])spec.v2plus.handPose[side]=modeToPose[hands[side]];
  let barGripReport=null;
  if(hands.left==='bar-grasp'||hands.right==='bar-grasp'){
    fail(hands.left==='bar-grasp'&&hands.right==='bar-grasp','bar-grasp must be used on both hands');
    const props=spec.props??[];
    fail(props.some(p=>BAR_PROPS.includes(p.type)),'bar-grasp needs a fixed bar prop: '+BAR_PROPS.join('/'));
    fail(props.every(p=>!['dumbbell','kettlebell','kbBottomsUp','landmine','band','grip','dHandle'].includes(p.type)),'bar-grasp cannot hold another implement');
    // Grip sections of the bars are made the frozen fist's 32 mm so the closed fingers sit on the bar surface.
    spec.props=props.filter(p=>p.type!=='gripHand').map(p=>BAR_PROPS.includes(p.type)?{...p,r:SHAFT_RADIUS_M}:p);
    barGripReport=adaptFixedBarGrip(spec,recipe.fixedBarGrip?.bars??{});
    spec.v2plus.handPose={left:'open',right:'open'};
  }
  const grasp=['left','right'].filter(side=>['dumbbell-grasp','fixed-grasp','bar-grasp'].includes(hands[side]));
  const bandGrasp=hands.left==='fixed-grasp'&&hands.right==='fixed-grasp';
  const barGrasp=hands.left==='bar-grasp';
  if(grasp.length&&!barGrasp){
    fail(grasp.length===2,'Accepted wrist installer requires both hands; one-hand grasp needs a separate adapter');
    fail(hands.left===hands.right,'Fixed grip mode must match on both hands');
    const props=spec.props??[],dumbbells=props.filter(p=>p.type==='dumbbell');
    if(bandGrasp){
      fail(props.some(p=>p.type==='band')&&props.every(p=>!['dumbbell','kettlebell','kbBottomsUp','landmine','grip','dHandle'].includes(p.type)),'Fixed grip without dumbbells currently supports explicit band actions only');
      spec.props=props.filter(p=>p.type!=='gripHand');
    }else{
      fail(dumbbells.length===2&&['left','right'].every(side=>dumbbells.filter(p=>p.attach===side+'Hand').length===1),'Both hands must each have exactly one source dumbbell');
      fail(props.every(p=>!['kettlebell','kbBottomsUp','landmine','band','grip','dHandle'].includes(p.type)),'Dumbbell template cannot substitute another held implement');
      spec.props=props.filter(p=>p.type!=='dumbbell'&&p.type!=='gripHand');
      // Optional: the frozen dumbbell fist holds a kettlebell instead (dumbbells hidden, straight grip on the fist's shaft axis).
      if(recipe.fixedKettlebell){
        const k=recipe.fixedKettlebell;
        fail(['leftHand','rightHand'].includes(k.attach)&&k.model==='straight-grip-kettlebell-r1','Unsupported fixedKettlebell');
        spec.props.push({type:'kettlebell',attach:k.attach,fixedKettlebellGrasp:'webxr-dumbbell-fist',model:k.model});
      }
    }
    spec.v2plus.handPose={left:'open',right:'open'};
  }
  return {spec,handSetup:{modes:{...hands},adapter:grasp.length?'webxr-dumbbell-wrist-r1':'symmetric-native',
    poses:spec.v2plus.handPose,removedSourceDumbbells:grasp.length&&!bandGrasp&&!barGrasp?2:0,showDumbbells:!bandGrasp&&!barGrasp&&!recipe.fixedKettlebell,barGrip:barGripReport,
    status:grasp.length?'fixed-template-accepted-action-validation-pending':'native-candidate-action-validation-pending',
    notes:grasp.length?['Fixed hand and dumbbell are one rigid combination; no duplicate action dumbbells.']:['support uses native palm-floor; assist uses native open; relaxed uses native relaxed.','These are explicit native poses, not acceptance of four completed new fixed hand assets.']}};
}

export async function prepareRecipe(recipeFile){
  const absolute=path.resolve(recipeFile),bytes=fs.readFileSync(absolute),recipe=readJson(absolute);
  const specFile=repoFile(recipe.spec),raw=fs.readFileSync(specFile);
  fail(sha(Buffer.from(raw.toString('utf8').replaceAll('\r\n','\n')))===recipe.specSha256Lf,'Recipe source spec LF SHA changed');
  const source=(await import(pathToFileURL(specFile).href)).default;
  const adapted=adaptRecipe(source,recipe);
  let poseAdapterFile=null,poseAdapterReport=null;
  if(recipe.poseAdapter){
    fail(recipe.poseAdapter.module==='tools/action-completion-v3-r2/pose-adapter.mjs','Only the reviewed completion pose adapter entry is allowed');
    poseAdapterFile=repoFile(recipe.poseAdapter.module);
    const adapter=await import(pathToFileURL(poseAdapterFile).href);
    fail(typeof adapter.adaptSpec==='function','Pose adapter must export adaptSpec');
    const result=await adapter.adaptSpec(adapted.spec,recipe.poseAdapter.options??{});
    if(result?.spec){adapted.spec=result.spec;poseAdapterReport=result.report??null;}else adapted.spec=result;
    fail(adapted.spec&&typeof adapted.spec==='object','Pose adapter returned no spec');
    fail(adapted.spec.runtimeModel?.profile===MODEL.profile&&adapted.spec.runtimeModel.version===MODEL.version,'Pose adapter changed the selected model');
    fail(JSON.stringify(adapted.spec.camera)===JSON.stringify({...source.camera,...recipe.camera}),'Pose adapter cannot change the camera recipe');
  }
  const cameraScale=recipe.cameraScale??1.15;
  fail(Number.isFinite(cameraScale)&&cameraScale>=1&&cameraScale<=3,'Camera scale must be 1..3');
  return {...adapted,recipe,recipeFile:absolute,recipeSha256:sha(bytes),specFile,sourceRuntimeModel:source.runtimeModel??null,
    cameraScale,poseAdapterFile,poseAdapterReport};
}
