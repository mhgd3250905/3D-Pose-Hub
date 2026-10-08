// v41 cloth fit (user, 2026-10-08: in the flare the tee collar opened under the neck and the inside
// of the shirt showed; the chest skin also poked through the front of the collar).
// Cause: Snow's skin patches under the clothes (neck/chest under the collar, upper arms under the
// sleeves, thighs under the shorts) and the clothes over them carry different deformation weights,
// so in strong poses (raised / supporting arms, shoulder give) they move apart: skin pokes out or the
// opening lifts off. Fix: one shared deformation across each opening.
//  * skin covered by cloth takes the cloth's weights (IDW of the K nearest cloth vertices), ramping
//    in from the opening edge: a = smoothstep(dEdge, EDGE[0], EDGE[1]);
//  * cloth near its opening edge and on the skin takes the skin's weights by (1 - a), faded out
//    where the cloth stands off the skin: (1 - smoothstep(dSkin, NEAR[0], NEAR[1])).
// Positions, normals, UVs, materials and topology are untouched; only JOINTS_0/WEIGHTS_0 change.
//   npm i --no-save @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4
//   node tools/cloth/fit-cloth-weights.mjs public/coach/flare-coach-before-v41.glb public/coach/flare-coach.glb
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {Grid,posed,vertexNormals} from './cloth-lib.mjs';
globalThis.createImageBitmap ??= async()=>({width:1,height:1,close(){}});
const [src,dst]=process.argv.slice(2);
export const CFG={K:6,EDGE:[0,.03],NEAR:[.015,.03],COVER:.05,...JSON.parse(process.env.FIT??'{}')};
const SKIN=['Coach_Body','Coach_Face'],CLOTH=['Coach_Training_Tee','Coach_Training_Shorts'];
const buf=fs.readFileSync(src);
const {scene}=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
scene.updateMatrixWorld(true);
const three={};scene.traverse(o=>{if(!o.isSkinnedMesh)return;let n=o;while(n&&!/^Coach_/.test(n.name))n=n.parent;(three[n.name]??=[]).push(o);});
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const doc=await io.read(src);
const nodes=Object.fromEntries(doc.getRoot().listNodes().filter(n=>n.getMesh()).map(n=>[n.getName(),n]));
// one record set per group: rest positions, normals, named weights, welded boundary
function gather(names){const R={P:[],N:[],W:[],ref:[],tri:[]};const v=new THREE.Vector3(),nm=new THREE.Matrix3();
  for(const name of names){const node=nodes[name],joints=node.getSkin().listJoints().map(j=>j.getName());
    node.getMesh().listPrimitives().forEach((prim,k)=>{const m=three[name][k],g=m.geometry,base=R.W.length;nm.getNormalMatrix(m.matrixWorld);
      const J=prim.getAttribute('JOINTS_0'),W=prim.getAttribute('WEIGHTS_0'),j=[],w=[];
      // bind-pose world positions through the skin (quantisation offsets live in the inverse binds)
      const PP=posed(m),NN=vertexNormals(m,PP);
      for(let i=0;i<g.attributes.position.count;i++){R.P.push(PP[i*3],PP[i*3+1],PP[i*3+2]);R.N.push(NN[i*3],NN[i*3+1],NN[i*3+2]);
        J.getElement(i,j);W.getElement(i,w);const o={};for(let c=0;c<4;c++)if(w[c]>0)o[joints[j[c]]]=(o[joints[j[c]]]||0)+w[c];R.W.push(o);R.ref.push([name,k,i]);}
      const ix=g.index;for(let f=0;f<ix.count;f++)R.tri.push(base+ix.getX(f));});}
  // welded open edges
  const key=i=>`${Math.round(R.P[i*3]*2e4)},${Math.round(R.P[i*3+1]*2e4)},${Math.round(R.P[i*3+2]*2e4)}`,id=new Map(),wd=[];
  for(let i=0;i<R.W.length;i++){const k=key(i);if(!id.has(k))id.set(k,id.size);wd.push(id.get(k));}
  const E=new Map();for(let f=0;f<R.tri.length;f+=3)for(let e=0;e<3;e++){let a=wd[R.tri[f+e]],b=wd[R.tri[f+(e+1)%3]];if(a>b)[a,b]=[b,a];const k=a*4194304+b;E.set(k,(E.get(k)||0)+1);}
  const bw=new Set();for(const [k,c] of E)if(c===1){bw.add(Math.floor(k/4194304));bw.add(k%4194304);}
  R.edge=R.W.map((_,i)=>bw.has(wd[i]));R.P=new Float32Array(R.P);R.N=new Float32Array(R.N);return R;}
const S=gather(SKIN),C=gather(CLOTH);
const skinGrid=new Grid(S.P,.02),clothGrid=new Grid(C.P,.02);
const edgeIdx=C.edge.map((e,i)=>e?i:-1).filter(i=>i>=0),EP=new Float32Array(edgeIdx.length*3);edgeIdx.forEach((i,k)=>EP.set(C.P.subarray(i*3,i*3+3),k*3));
const edgeGrid=new Grid(EP,.02);
const sm=(x,a,b)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
const dEdge=(x,y,z)=>{const r=edgeGrid.knn(x,y,z,1,4);return r.length?r[0][1]:1;};
const idw=(src,nn)=>{const o={};let t=0;for(const [q,d] of nn){const iw=1/Math.max(d,1e-4)**2;t+=iw;for(const [b,x] of Object.entries(src.W[q]))o[b]=(o[b]||0)+iw*x;}for(const b in o)o[b]/=t;return o;};
// One weight field across each opening: a = smoothstep(dEdge, EDGE[0], EDGE[1]) runs from the skin's
// weights at the opening edge (a = 0) to the cloth's weights under the cloth (a = 1). Covered skin and
// cloth lying on the skin both take that field, so they deform identically there.
const plan=[];// [ref, own, target, s]
for(let i=0;i<S.W.length;i++){const x=S.P[i*3],y=S.P[i*3+1],z=S.P[i*3+2];const nn=clothGrid.knn(x,y,z,CFG.K,3);if(!nn.length||nn[0][1]>CFG.COVER)continue;
  const q=nn[0][0],inside=(x-C.P[q*3])*C.N[q*3]+(y-C.P[q*3+1])*C.N[q*3+1]+(z-C.P[q*3+2])*C.N[q*3+2]<0;if(!inside)continue;
  const de=dEdge(x,y,z),a=sm(de,...CFG.EDGE);if(a>0)plan.push([S.ref[i],S.W[i],idw(C,nn),a,'skin']);}
for(let i=0;i<C.W.length;i++){const x=C.P[i*3],y=C.P[i*3+1],z=C.P[i*3+2];const nn=skinGrid.knn(x,y,z,CFG.K,2);if(!nn.length)continue;
  const s=(1-sm(dEdge(x,y,z),...CFG.EDGE))*(1-sm(nn[0][1],...CFG.NEAR));if(s>0)plan.push([C.ref[i],C.W[i],idw(S,nn),s,'cloth']);}
const report={};
for(const [[name,k,i],own,other,s,kind] of plan){const node=nodes[name],joints=node.getSkin().listJoints().map(j=>j.getName()),idx=Object.fromEntries(joints.map((n,c)=>[n,c]));
  const prim=node.getMesh().listPrimitives()[k];const mix={};for(const b of new Set([...Object.keys(own),...Object.keys(other)]))mix[b]=(1-s)*(own[b]||0)+s*(other[b]||0);
  const top=Object.entries(mix).filter(([b])=>b in idx).sort((a,b)=>b[1]-a[1]).slice(0,4),sum=top.reduce((a,[,x])=>a+x,0);
  const qv=top.map(([,x])=>Math.round(x/sum*255));qv[0]+=255-qv.reduce((a,x)=>a+x,0);
  const nj=[0,0,0,0],nw=[0,0,0,0];top.forEach(([b],c)=>{nj[c]=idx[b];nw[c]=qv[c]/255;});
  prim.getAttribute('JOINTS_0').setElement(i,nj);prim.getAttribute('WEIGHTS_0').setElement(i,nw);
  const r=report[`${kind}:${name}#${k}`]??={changed:0,full:0};r.changed++;if(s>.999)r.full++;}
await io.write(dst,doc);
console.log(JSON.stringify({cfg:CFG,report}));
