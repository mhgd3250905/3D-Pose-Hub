// v41 face candidates (user: "the face is ugly"). Snow ships one face and no alternative face
// textures/shape keys survive in the slim GLB, so candidates are small, reproducible edits of the
// existing cartoon parts. Nothing here touches public/coach unless you pass that path as output.
//   node tools/face/make-face-candidates.mjs <in.glb> <outDir>
//   A  softer eyes : warm dark-brown iris instead of pale olive (reads as a friendlier, less staring
//                    look). Optional eyes:k widens iris+pupil on the eyeball; tried at 1.28 and rejected:
//                    the sclera's own cornea rim then shows as a ring around the pupil.
//   B  A + brows 30% thinner about their own centre line and lifted 1.5 mm
//   C  B + nose tip 12% smaller (smooth radial falloff, 2.4 cm) and lips 8% narrower
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {posed} from '../cloth/cloth-lib.mjs';
globalThis.createImageBitmap ??= async()=>({width:1,height:1,close(){}});
const [src,outDir]=process.argv.slice(2);fs.mkdirSync(outDir,{recursive:true});
const buf=fs.readFileSync(src);
const {scene}=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');scene.updateMatrixWorld(true);
const three={};scene.traverse(o=>{if(!o.isSkinnedMesh)return;let n=o;while(n&&!/^Coach_/.test(n.name))n=n.parent;(three[n.name]??=[]).push(o);});
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const sm=(x,a,b)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
async function variant(tag,steps){
  const doc=await io.read(src),nodes=Object.fromEntries(doc.getRoot().listNodes().filter(n=>n.getMesh()).map(n=>[n.getName(),n]));
  // world <-> local per primitive (uniform quantisation scale fitted from the bind pose)
  const prims=name=>nodes[name].getMesh().listPrimitives().map((prim,k)=>{const W=posed(three[name][k]),P=prim.getAttribute('POSITION'),n=P.getCount(),l=[],m=[];let num=0,den=0;
    for(let a=0;a<400;a++){const i1=Math.floor(a*n/400),i2=(i1+Math.floor(n/2))%n;P.getElement(i1,l);P.getElement(i2,m);for(let c=0;c<3;c++){num+=(l[c]-m[c])*(W[i1*3+c]-W[i2*3+c]);den+=(l[c]-m[c])**2;}}
    const sc=num/den;return {prim,W,P,n,sc,move(i,to){const v=[];P.getElement(i,v);P.setElement(i,v.map((x,c)=>x+(to[c]-W[i*3+c])/sc));}};});
  const V=(W,i)=>new THREE.Vector3(W[i*3],W[i*3+1],W[i*3+2]);
  if(steps.irisColor){const mat=doc.getRoot().listMaterials().find(m=>/hazel iris/.test(m.getName()));mat.setBaseColorFactor(steps.irisColor);}
  if(steps.eyes){const [white,iris,pupil]=prims('Coach_Eyes');
    for(const side of [1,-1]){const sel=(p,i)=>Math.sign(p.W[i*3])===side;const cen=new THREE.Vector3();let c=0;for(let i=0;i<white.n;i++)if(sel(white,i)){cen.add(V(white.W,i));c++;}cen.multiplyScalar(1/c);
      const ax=new THREE.Vector3();for(let i=0;i<iris.n;i++)if(sel(iris,i))ax.add(V(iris.W,i).sub(cen));ax.normalize();
      for(const p of [iris,pupil])for(let i=0;i<p.n;i++){if(!sel(p,i))continue;const r=V(p.W,i).sub(cen),th=r.angleTo(ax);if(th<1e-6)continue;
        const k=p===pupil?steps.eyes*1.06:steps.eyes,axis=new THREE.Vector3().crossVectors(ax,r).normalize();p.move(i,cen.clone().add(r.applyAxisAngle(axis,th*(k-1))).toArray());}}
  }
  if(steps.brows){const [b]=prims('Coach_Brows');const bins=new Map(),key=x=>Math.round(x*400);
    for(let i=0;i<b.n;i++){const k=key(b.W[i*3]);const e=bins.get(k)??[0,0,0];e[0]+=b.W[i*3+1];e[1]+=b.W[i*3+2];e[2]++;bins.set(k,e);}
    for(let i=0;i<b.n;i++){const e=bins.get(key(b.W[i*3])),cy=e[0]/e[2];b.move(i,[b.W[i*3],cy+(b.W[i*3+1]-cy)*steps.brows+.0015,b.W[i*3+2]]);}}
  if(steps.nose){const face=prims('Coach_Face');let tip=null;for(let i=0;i<face[0].n;i++){const p=V(face[0].W,i);if(Math.abs(p.x)<.01&&p.y>1.5&&p.y<1.65&&(!tip||p.z>tip.z))tip=p;}
    const c=tip.clone().add(new THREE.Vector3(0,0,-.018)),R=.024;
    // lips: the lip primitives and the skin around them narrow toward the mouth centre
    let mouth=new THREE.Vector3(),mc=0;for(const k of [2,3])for(let i=0;i<face[k].n;i++){mouth.add(V(face[k].W,i));mc++;}mouth.multiplyScalar(1/mc);
    for(const p of face)for(let i=0;i<p.n;i++){const q=V(p.W,i);let moved=false;const d=q.distanceTo(tip);
      if(d<R){const f=1-sm(d,0,R);q.sub(c).multiplyScalar(1-steps.nose*f).add(c);moved=true;}
      const dm=Math.hypot((q.x-mouth.x)/.035,(q.y-mouth.y)/.015);if(dm<1.6&&q.z>mouth.z-.03){const f=1-sm(dm,0.9,1.6);q.x=mouth.x+(q.x-mouth.x)*(1-steps.lips*f);moved=true;}
      if(moved)p.move(i,q.toArray());}}
  await io.write(`${outDir}/face-${tag}.glb`,doc);console.log('wrote',tag);
}
const IRIS=[0.20,0.115,0.065,1];
await variant('A',{irisColor:IRIS});
await variant('B',{irisColor:IRIS,brows:.7});
await variant('C',{irisColor:IRIS,brows:.7,nose:.12,lips:.08});
