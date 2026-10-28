import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
export const defaultRecipePath=path.resolve(here,'../../../drill-anim/models/webxr-dumbbell-wrist-r1/recipe.json');
const resolveFile=(base,file)=>path.resolve(base,file);
function pinned(record,base){const file=resolveFile(base,record.file),b=fs.readFileSync(file);if(!record.sha256||hash(b)!==record.sha256||(record.bytes!==undefined&&b.length!==record.bytes))throw Error('Wrist join source hash mismatch: '+file);return JSON.parse(b);}
function checkFiles(manifest,base){
 if(!Array.isArray(manifest.files)||!manifest.files.length)throw Error('Missing wrist package file pins');
 for(const record of manifest.files){const file=resolveFile(base,record.file),b=fs.readFileSync(file);if(!record.sha256||hash(b)!==record.sha256||b.length!==record.bytes)throw Error('Wrist package hash mismatch: '+file);}
}

// Read the authored template's actual prop geometry, including its complete node
// transforms. No visual primitive is substituted for the accepted dumbbell.
function propFromGlb(file){
 const bytes=fs.readFileSync(file);let json,bin;
 for(let o=12;o<bytes.length;){const n=bytes.readUInt32LE(o),type=bytes.readUInt32LE(o+4),b=bytes.subarray(o+8,o+8+n);if(type===0x4e4f534a)json=JSON.parse(b.toString('utf8'));if(type===0x004e4942)bin=b;o+=8+n;}
 const widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},types={5121:[1,'readUInt8'],5123:[2,'readUInt16LE'],5125:[4,'readUInt32LE'],5126:[4,'readFloatLE']};
 const accessor=i=>{const a=json.accessors[i],v=json.bufferViews[a.bufferView],[size,read]=types[a.componentType],width=widths[a.type],out=[];for(let j=0;j<a.count;j++)for(let k=0;k<width;k++)out.push(bin[read]((v.byteOffset||0)+(a.byteOffset||0)+j*(v.byteStride||width*size)+k*size));return out;};
 const wanted=[];
 function visit(i,chain,inside=false){const n=json.nodes[i],next=[...chain,{matrix:n.matrix,translation:n.translation,rotation:n.rotation,scale:n.scale}],isProp=inside||n.name==='fixed_project_dumbbell';if(isProp&&n.mesh!==undefined)for(const p of json.meshes[n.mesh].primitives){const m=json.materials?.[p.material];wanted.push({name:n.name,positions:accessor(p.attributes.POSITION),normals:accessor(p.attributes.NORMAL),indices:accessor(p.indices),transforms:next,color:m?.pbrMetallicRoughness?.baseColorFactor?.slice(0,3)||[.12,.14,.16]});}for(const j of n.children||[])visit(j,next,isProp);}
 for(const i of json.scenes[json.scene||0].nodes)visit(i,[]);
 if(wanted.length!==3)throw Error('Expected shaft and two actual template plates: '+file);
 return {file,sha256:hash(bytes),primitives:wanted};
}

export function verify({recipePath=defaultRecipePath,templateDir}={}){
 recipePath=path.resolve(recipePath);
 const base=path.dirname(recipePath),bytes=fs.readFileSync(recipePath),recipe=JSON.parse(bytes),hands={};
 if(recipe.packageManifest){const manifest=JSON.parse(fs.readFileSync(resolveFile(base,recipe.packageManifest)));checkFiles(manifest,path.dirname(resolveFile(base,recipe.packageManifest)));if(!manifest.runtime?.sha256||hash(fs.readFileSync(path.join(here,'runtime.js')))!==manifest.runtime.sha256)throw Error('Wrist runtime hash mismatch');}
 for(const side of ['left','right'])hands[side]=pinned(recipe.sources.hands[side],base);
 const neutral=pinned(recipe.sources.neutral,base),reference=pinned(recipe.sources.limbReference,base);
 const dir=templateDir?path.resolve(templateDir):recipe.templateDir?resolveFile(base,recipe.templateDir):path.join(path.dirname(path.dirname(resolveFile(base,recipe.sources.hands.left.file))),'template-package');
 const templateManifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));
 const props=Object.fromEntries(['left','right'].map(side=>[side,propFromGlb(path.join(dir,side+'-hand-with-dumbbell.glb'))]));
 for(const [side,prop] of Object.entries(props)){const pin=templateManifest.files?.find(r=>r.file===side+'-hand-with-dumbbell.glb');if(!pin||prop.sha256!==pin.sha256||fs.statSync(prop.file).size!==pin.bytes)throw Error('Wrist template prop hash mismatch: '+prop.file);}
 const index=reference.limbs.index,indexBytes=Buffer.alloc(index.length*4);index.forEach((value,i)=>indexBytes.writeUInt32LE(value,i*4));
 if(index.length!==recipe.sourcePins.limbs.sourceIndexCount||hash(indexBytes)!==recipe.sourcePins.limbs.sourceIndexUint32LESha256)throw Error('Wrist limb source index pin mismatch');
 return {recipe,hands,props,neutralLimbWorld:neutral.limbWorld,sourceLimbIndex:index,sourcePins:{recipeFile:recipePath,recipeSha256:hash(bytes),hands:Object.fromEntries(Object.entries(recipe.sources.hands).map(([side,r])=>[side,{...r,file:resolveFile(base,r.file)}])),limbs:recipe.sourcePins.limbs,props:Object.fromEntries(Object.entries(props).map(([k,v])=>[k,{file:v.file,sha256:v.sha256}]))}};
}

export async function install(page,options={}){
 const payload=verify(options);payload.options={enabled:options.enabled!==false,showDumbbells:options.showDumbbells!==false};
 await page.evaluate(data=>{window.__webxrWristJoinOptions=data;},payload);
 await page.addScriptTag({content:fs.readFileSync(path.join(here,'runtime.js'),'utf8')});
 return page.evaluate(()=>({version:__webxrWristJoin.version,active:__webxrWristJoin.active,config:__webxrWristJoin.config}));
}
export async function detach(page){return page.evaluate(()=>window.__webxrWristJoin?.detach());}
