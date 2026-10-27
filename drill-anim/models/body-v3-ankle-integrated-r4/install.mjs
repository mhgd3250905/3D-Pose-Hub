// Install r17-equivalent ankle changes after v3 initialization, before L2.
// This is an integration candidate; equivalence needs a real-scene retest.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
import {verify as verifyR17} from '../body-v3-ankle-r17/loader.mjs';
import {applyAnkleR7Shape} from './ankle-r7-shape.mjs';import {installAnkleMaterials} from './material-r1.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const PROFILE='body-v3-ankle-integrated-r4',VERSION='0.0.0-r4';
export function verify(){const m=JSON.parse(fs.readFileSync(path.join(here,'manifest-r4.json'),'utf8'));if(m.id!==PROFILE||m.version!==VERSION)throw Error('unsupported ankle integration manifest');verifyR17();for(const [rel,want]of Object.entries(m.sourceSha256)){const data=fs.readFileSync(path.join(repo,rel));const digest=crypto.createHash('sha256').update(Buffer.from(data.toString('utf8').replaceAll('\r\n','\n'))).digest('hex');if(digest!==want)throw Error('ankle integration SHA mismatch '+rel);}return m;}
async function seams(page,table){return page.evaluate(table=>{
 const T=window.__toonT,v=window.flareInspector.viewer,body=v.coach.getObjectByName('Coach_Body'),limb=window.__v2p.limbs.mesh;
 v.coach.updateMatrixWorld(true);body.skeleton.update();limb.skeleton.update();
 const vector=(m,id)=>m.getVertexPosition(id,new T.Vector3()).applyMatrix4(m.matrixWorld).toArray();
 const attrs=(m,id)=>{const p=m.geometry.attributes.position,ix=m.geometry.attributes.skinIndex,w=m.geometry.attributes.skinWeight,weights={};for(let i=0;i<4;i++){const n=m.skeleton.bones[ix.getComponent(id,i)]?.name,z=w.getComponent(id,i);if(z){if(!n)throw Error('invalid seam bone');weights[n]=(weights[n]||0)+z;}}return {p:[p.getX(id),p.getY(id),p.getZ(id)],weights};};
 return table.map(([side,bi,li])=>({side,bi,li,body:attrs(body,bi),limb:attrs(limb,li),bodyWorld:vector(body,bi),limbWorld:vector(limb,li)}));
 },table);}
async function syncSeams(page,table){return page.evaluate(table=>{
 const T=window.__toonT,v=window.flareInspector.viewer,body=v.coach.getObjectByName('Coach_Body'),limb=window.__v2p.limbs.mesh;
 v.coach.updateMatrixWorld(true);body.skeleton.update();limb.skeleton.update();
 const bp=body.geometry.attributes.position,bn=body.geometry.attributes.normal,bj=body.geometry.attributes.skinIndex,bw=body.geometry.attributes.skinWeight;
 const lp=limb.geometry.attributes.position,ln=limb.geometry.attributes.normal,lj=limb.geometry.attributes.skinIndex,lw=limb.geometry.attributes.skinWeight;
 const references=[lp,ln,lj,lw],names=limb.skeleton.bones.map(b=>b.name),byName=new Map(names.map((n,i)=>[n,i]));
 const S=new T.Matrix4(),B=new T.Matrix4(),M=new T.Matrix4(),q=new T.Vector3(),nn=new T.Vector3(),N3=new T.Matrix3();
 const skin=(mesh,index)=>{const j=mesh.geometry.attributes.skinIndex,w=mesh.geometry.attributes.skinWeight,e=S.elements.fill(0);for(let k=0;k<4;k++){const weight=w.getComponent(index,k);if(!weight)continue;B.fromArray(mesh.skeleton.boneMatrices,j.getComponent(index,k)*16);for(let c=0;c<16;c++)e[c]+=weight*B.elements[c];}return M.copy(mesh.matrixWorld).multiply(mesh.bindMatrixInverse).multiply(S).multiply(mesh.bindMatrix);};
 for(const [,bi,li]of table){
  body.getVertexPosition(bi,q).applyMatrix4(body.matrixWorld);
  for(let k=0;k<4;k++){const original=bj.getComponent(bi,k),weight=bw.getComponent(bi,k),name=body.skeleton.bones[original]?.name,mapped=byName.get(name);if(weight&&mapped===undefined)throw Error('ankle seam missing mapped bone '+name);lj.setComponent(li,k,mapped??0);lw.setComponent(li,k,weight);}
  const bodyMatrix=skin(body,bi).clone();nn.fromBufferAttribute(bn,bi).applyMatrix3(new T.Matrix3().getNormalMatrix(bodyMatrix)).normalize();
  const limbMatrix=skin(limb,li).clone();if(Math.abs(limbMatrix.determinant())<1e-12)throw Error('ankle seam singular skin matrix');q.applyMatrix4(limbMatrix.clone().invert());lp.setXYZ(li,q.x,q.y,q.z);
  N3.setFromMatrix4(limbMatrix).transpose();nn.applyMatrix3(N3).normalize();ln.setXYZ(li,nn.x,nn.y,nn.z);
 }
 for(const attr of references){attr.needsUpdate=true;if(attr.isInterleavedBufferAttribute)attr.data.needsUpdate=true;}
 if(references.some((x,i)=>x!==[limb.geometry.attributes.position,limb.geometry.attributes.normal,limb.geometry.attributes.skinIndex,limb.geometry.attributes.skinWeight][i]))throw Error('limb attributes replaced');
 return {pairs:table.length,limbAttributeReferencesPreserved:true};
 },table);}
function checkSeams(before,after){let maxGapMm=0,maxPositionChangeMm=0,maxWeightDifference=0,maxWeightChange=0;for(let i=0;i<before.length;i++){
 const a=before[i],b=after[i];if(a.side!==b.side||a.bi!==b.bi||a.li!==b.li)throw Error('ankle seam identity changed');
 const gap=Math.hypot(...b.bodyWorld.map((q,k)=>q-b.limbWorld[k]))*1000;maxGapMm=Math.max(maxGapMm,gap);const names=new Set([...Object.keys(b.body.weights),...Object.keys(b.limb.weights)]);for(const n of names)maxWeightDifference=Math.max(maxWeightDifference,Math.abs((b.body.weights[n]||0)-(b.limb.weights[n]||0)));
 for(const piece of ['body','limb']){maxPositionChangeMm=Math.max(maxPositionChangeMm,Math.hypot(...a[piece].p.map((q,k)=>q-b[piece].p[k]))*1000);const names=new Set([...Object.keys(a[piece].weights),...Object.keys(b[piece].weights)]);for(const n of names)maxWeightChange=Math.max(maxWeightChange,Math.abs((a[piece].weights[n]||0)-(b[piece].weights[n]||0)));}
 }if(maxGapMm>.001||maxWeightDifference>1e-5)throw Error('ankle seam invariant failed '+JSON.stringify({maxGapMm,maxPositionChangeMm,maxWeightDifference,maxWeightChange}));return {pairs:before.length,maxGapMm,maxPositionChangeMm,maxWeightDifference,maxWeightChange};}
export async function install(page){
 verify();const source=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/training-human-v2plus-limbs-base.json'),'utf8')).seam;
 const table=source.ring.flatMap((r,i)=>r==='ankle_left'||r==='ankle_right'?[[r,source.vid[i],source.first+i]]:[]);
 if(table.length!==56||table.some((_,i)=>!Number.isInteger(table[i][1])||!Number.isInteger(table[i][2])))throw Error('unexpected ankle seam source');
 const preflight=await page.evaluate(()=>{const V=window.__v2p,v=window.flareInspector?.viewer;
  if(!v?.coach||!V?.limbs?.mesh||!V?.torso?.mesh||!V?.hands?.mesh)throw Error('ankle integrated r1 requires initialized v3 torso/limbs/hands');
  if(V.limbs.on||V.torso.on||V.hands.on)throw Error('ankle integration requires all v2plus profile pieces off before reset');
  if(V.__pieceNormalsR1)throw Error('ankle integration must run before L2 piece normals');
  if(window.__ankleIntegratedR1||window.__ankleIntegratedR1Failed||window.__ankleIntegratedR2||window.__ankleIntegratedR2Failed||window.__ankleIntegratedR3||window.__ankleIntegratedR3Failed||window.__ankleIntegratedR4||window.__ankleIntegratedR4Failed||v.coach.getObjectByName('Coach_Body')?.userData.ankleR6Fit)throw Error('ankle integration already installed or failed');
  const priorV2pOn=V.on;if(V.on)V.enable(false);v.motion.reset();v.coach.updateMatrixWorld(true);return {priorV2pOn,profileDisabled:!V.on};
 });
 const before=await seams(page,table);checkSeams(before,before);
 try{const geometry=await applyAnkleR7Shape(page),sync=await syncSeams(page,table),after=await seams(page,table),seam=checkSeams(before,after),materials=await installAnkleMaterials(page);
  await page.evaluate(()=>{window.__ankleIntegratedR4={installed:true};});return {profile:PROFILE,version:VERSION,preflight,geometry,sync,seam,materials,limitation:'candidate; compare initialized-v3 result against r17 before integration'};
 }catch(error){await page.evaluate(message=>{window.__ankleIntegratedR4Failed=message;},String(error));throw error;}
}
