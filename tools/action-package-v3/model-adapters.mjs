// Model registry for scripted production.
//
// Recipes are authored against one model (today training-human-v3-armfix 0.1.0-r2).
// Production may render them on another model only when it is registered here,
// declares the authoring model in `compatibleWith`, supports every component the
// recipe installs, and its measured rig signature (bone names + rest bone lengths)
// matches the authoring model's reference within tolerance. A pure material change
// (a skin) needs no new model: see skins/ and browser-package-layers.js.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE=path.dirname(fileURLToPath(import.meta.url));
const REPO=path.resolve(HERE,'../..');
const fail=(ok,message)=>{if(!ok)throw Error(message);};
export const key=m=>`${m.profile}@${m.version}`;
export const REGISTRY_FILE=path.join(HERE,'models.json');

export function registry(file=REGISTRY_FILE){
  const r=JSON.parse(fs.readFileSync(file,'utf8'));
  fail(r.format==='pose-hub-package-models@1'&&Array.isArray(r.models),'Bad model registry');
  for(const m of r.models){
    fail(m.profile&&m.version&&m.loader&&m.rigSignature&&Array.isArray(m.compatibleWith)&&Array.isArray(m.components),'Model entry incomplete: '+JSON.stringify(m.profile));
    fail(fs.existsSync(path.join(REPO,m.loader)),'Model loader missing: '+m.loader);
  }
  return r;
}

/** Recipe components a model must support (corrections, hand adapters, correctives). */
export function recipeComponents(recipe){
  const c=new Set();
  for(const j of recipe.jointCorrections??[])c.add('correction:'+j.profile);
  if(recipe.fixedCorrectionStack)c.add('fixed-stack:'+recipe.fixedCorrectionStack.profile);
  if(recipe.nativeWristCorrective)c.add('native-wrist-corrective:hand-wrist-corrective-r1');
  if(recipe.wristTwistRuntime)c.add('wrist-twist:hands-native-'+recipe.wristTwistRuntime.version);
  for(const s of ['left','right'])if(recipe.hands?.[s])c.add('hand:'+recipe.hands[s]);
  return [...c].sort();
}

/** Pick the production model. Default = the recipe's own authoring model. */
export function resolveModel(requested,recipe,file){
  const r=registry(file),authoring=key(recipe.model);
  const want=requested??authoring;
  const m=r.models.find(x=>key(x)===want);
  fail(m,`Model ${want} is not registered in models.json`);
  fail(key(m)===authoring||m.compatibleWith.includes(authoring),`Model ${want} does not declare compatibility with recipe model ${authoring}`);
  const missing=recipeComponents(recipe).filter(c=>!m.components.includes(c)&&!m.components.includes(c.split(':')[0]+':*'));
  fail(!missing.length,`Model ${want} does not support recipe components: ${missing.join(', ')}`);
  const ref=r.models.find(x=>key(x)===authoring);
  fail(ref,'Authoring model missing from registry: '+authoring);
  return {...m,authoring,referenceSignature:ref.rigSignature,tolerance:r.tolerance};
}

/** Measured in the page after applyV3 + motion.reset(): rest bone lengths of the coach skeleton. */
export async function measureRig(page){
  return page.evaluate(()=>{
    const v=flareInspector.viewer;v.motion.reset();v.coach.updateMatrixWorld(true);
    const seen=new Map();
    v.coach.traverse(o=>{if(o.isSkinnedMesh)for(const b of o.skeleton.bones)if(!seen.has(b.name))seen.set(b.name,b);});
    const T=__toonT,a=new T.Vector3(),b=new T.Vector3(),lengths={};
    for(const[name,bone]of seen){if(!bone.parent?.isBone)continue;bone.getWorldPosition(a);bone.parent.getWorldPosition(b);lengths[name]=Math.round(a.distanceTo(b)*1e5)/1e5;}
    return {format:'pose-hub-rig-signature@1',bones:[...seen.keys()].sort(),lengthsMetres:Object.fromEntries(Object.entries(lengths).sort())};
  });
}

export function compareRig(reference,measured,tolerance={absoluteMetres:.002,relative:.01}){
  const missing=reference.bones.filter(b=>!measured.bones.includes(b));
  const off=[];
  for(const[name,len]of Object.entries(reference.lengthsMetres)){
    const got=measured.lengthsMetres[name];if(got===undefined)continue;
    const limit=Math.max(tolerance.absoluteMetres,len*tolerance.relative);
    if(Math.abs(got-len)>limit)off.push({bone:name,reference:len,measured:got});
  }
  return {ok:!missing.length&&!off.length,missingBones:missing,lengthMismatches:off,tolerance};
}

export async function checkModelCompatibility(page,adapter){
  const file=path.join(REPO,adapter.referenceSignature);
  const measured=await measureRig(page);
  if(!fs.existsSync(file)){
    // Reference capture mode: only the authoring model may create its own reference.
    fail(key(adapter)===adapter.authoring,'Reference rig signature missing for '+adapter.authoring);
    return {ok:true,referenceCreated:false,measured,note:'No reference yet; run tools/action-package-v3/rig-signature.mjs once for the authoring model.'};
  }
  const result=compareRig(JSON.parse(fs.readFileSync(file,'utf8')),measured,adapter.tolerance);
  fail(result.ok,'Rig signature mismatch: '+JSON.stringify(result).slice(0,800));
  return {...result,reference:adapter.referenceSignature,model:key(adapter)};
}
