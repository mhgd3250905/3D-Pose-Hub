// Synthetic geometry swaps, same-geometry profile switches and direct calls.
import fs from 'node:fs';import * as T from 'three';
import {install,detach} from '../../../drill-anim/models/completed-profile-normal-sync-r4/loader.mjs';
const dir='drill-anim/models/',files=['training-human-v2plus-torso-base.json','training-human-v2plus-limbs-base.json','hands-native-c1r2/hands-base.json'];
const ids=[...new Set(files.flatMap(f=>{const x=JSON.parse(fs.readFileSync(dir+f,'utf8')).seam;return x.vid.filter((_,i)=>x.mesh[i]==='Mesh005');}))];
const additions=JSON.parse(fs.readFileSync(dir+'collar-garment-refine-r7/refinement.json','utf8')).additions,n=8671;
const original=new T.BufferGeometry(),refined=new T.BufferGeometry();original.setAttribute('normal',new T.BufferAttribute(new Float32Array(n*3),3));refined.setAttribute('normal',new T.BufferAttribute(new Float32Array((n+7)*3),3));
for(let i=0;i<n;i++){original.attributes.normal.setXYZ(i,.1,.2,.3);refined.attributes.normal.setXYZ(i,.1,.2,.3);}
const garment={geometry:refined},state={garment,geo:refined,originalGeo:original,refreshTextures(){this.refreshed=(this.refreshed||0)+1;}},V={__pieceNormalsR1:true};
function update(value){const a=garment.geometry.attributes.normal;for(const i of ids)a.setXYZ(i,value,2*value,3*value);}
V.setHands=value=>update(value);V.setOutfit=value=>update(value);
const engine={selectModelProfile(spec){V.setOutfit(spec.value);V.setHands(spec.value);garment.geometry=spec.on?refined:original;}};
globalThis.window={__drill:engine,__v2p:V,__collarGarmentRefinement:state};const page={evaluate:async(fn,arg)=>fn(arg)};
const result=await install(page);if(result.garmentSeamVertices!==ids.length||result.refinedVertices!==7)throw Error('wrong selection');
function check(on,value){const a=garment.geometry.attributes.normal;for(const i of ids)for(let c=0;c<3;c++)if(Math.abs(a.getComponent(i,c)-value*(c+1))>1e-6)throw Error('seam normal stale');if(on)for(const x of additions)for(let c=0;c<3;c++){const expected=x.triangle.reduce((s,id,j)=>s+x.barycentric[j]*a.getComponent(id,c),0);if(Math.abs(a.getComponent(x.newIndex,c)-expected)>1e-6)throw Error('new vertex normal stale');}}
for(const [on,value] of [[false,.25],[true,.35],[true,.40],[false,.45],[true,.55]]){engine.selectModelProfile({on,value});check(on,value);}
V.setHands(.65);check(true,.65);V.setOutfit(.75);check(true,.75);
if(!state.refreshed)throw Error('texture refresh was not invoked');if(!await detach(page)||window.__completedNormalSyncR4)throw Error('detach failed');
console.log(JSON.stringify({seamVertices:ids.length,refinedVertices:7,profileTransitions:5,directControls:2,status:'pass',limitations:'synthetic profile only'}));
