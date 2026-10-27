// Template copied by prepare-assets into a new model directory. Experimental.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import * as base from '../training-human-v3-completed-r6/loader.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const PROFILE='training-human-v3-shoulder-completed',VERSION='1.0.0-r3';
const files=['left.json','right.json','gate.json','normals.json','rest-meta.json','provenance.json','runtime-current-r1.js','lifecycle-r1.js','loader.mjs'];
const read=f=>fs.readFileSync(path.join(here,f),'utf8'),json=f=>JSON.parse(read(f));
export async function verify(){await base.verify();const manifest=json('manifest.json');const baseManifest=fs.readFileSync(path.join(repo,'drill-anim/models/training-human-v3-completed-r6/manifest.json'),'utf8').replace(/\r\n/g,'\n');if(crypto.createHash('sha256').update(baseManifest,'utf8').digest('hex')!==manifest.baseManifestSha256)throw Error('P5 base manifest SHA mismatch');if(manifest.version!=='1.0.0-r3'||Object.keys(manifest.files).sort().join('|')!==files.slice().sort().join('|'))throw Error('P5 candidate manifest mismatch');for(const f of files){const hash=crypto.createHash('sha256').update(read(f).replace(/\r\n/g,'\n'),'utf8').digest('hex');if(hash!==manifest.files[f])throw Error('P5 candidate SHA mismatch: '+f);}return {status:'experimental-unreviewed',version:manifest.version};}
export async function boot(options){await verify();return base.boot(options);}
export async function applyV3(page,spec,options={}){
 await verify();let baseReady=false;
 try{
  const result=await base.applyV3(page,spec,options);baseReady=true;
  const signature=()=>page.evaluate(()=>{const mesh=window.__v2p.hands.mesh,bones=mesh.skeleton.bones;if(bones.length!==52)throw Error('P5 expected 52 bones');window.__p5OriginalBones=bones.map(b=>({bone:b,parent:b.parent,matrix:b.matrix.toArray()}));return bones.length;});
  await signature();for(const f of ['runtime-current-r1.js','lifecycle-r1.js'])await page.addScriptTag({content:read(f)});
  const data=['left.json','right.json','gate.json','normals.json','rest-meta.json'].map(json);
  const cloth=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/collar-garment-refine-r7/refinement.json'),'utf8'));
  const p5=await page.evaluate(args=>window.__installShoulderLifecycleR1(...args),[...data,cloth]);
  await page.evaluate(()=>{const bones=window.__v2p.hands.mesh.skeleton.bones;if(bones.length!==52||bones.some((b,i)=>{const x=window.__p5OriginalBones[i];return b!==x.bone||b.parent!==x.parent||b.matrix.elements.some((v,k)=>v!==x.matrix[k]);}))throw Error('P5 changed bones');});
  return {...result,baseProfile:result.profile,baseVersion:result.version,profile:PROFILE,version:VERSION,p5,scope:'experimental unreviewed; P5 partial detach required before base'};
 }catch(error){if(baseReady){try{await page.evaluate(()=>window.__shoulderLifecycleR1?.detach());}catch{}try{await base.detachGeometryLayers(page);}catch{}}throw new Error('P5 candidate setup failed; discard page',{cause:error});}
}
export async function setAuto(page,value){return page.evaluate(v=>window.__shoulderLifecycleR1.setAuto(v),value);}
export async function setAmounts(page,amounts){return page.evaluate(a=>window.__shoulderLifecycleR1.setAmounts(a),amounts);}
export async function detachGeometryLayers(page){
 const p5=await page.evaluate(()=>{if(!window.__shoulderLifecycleR1)throw Error('P5 candidate is not active');return window.__shoulderLifecycleR1.detach();});
 const partial=await base.detachGeometryLayers(page);return {p5,base:partial,lifecycle:'base persistent ankle/normal/wrist hooks remain; new page required'};
}
