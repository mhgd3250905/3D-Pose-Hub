// Shared loader for the cloth tools: the coach GLB driven by the real runtime (coach-motion,
// spine helpers) in Node, plus rest/posed vertex access and a body-surface proximity map.
import fs from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
globalThis.createImageBitmap ??= async()=>({width:1,height:1,close(){}});
globalThis.ProgressEvent ??= class {constructor(t,v){Object.assign(this,v);}};
const R=new URL('../../',import.meta.url).pathname;
export const BODY=/^Coach_(Body|Face)/, CLOTH=/^Coach_(Training_Tee|Training_Shorts|Sneakers|Soles|Shoe_Details)/;
export async function loadCoach(glb=R+'public/coach/flare-coach.glb'){
  const {createCoachMotion}=await import(R+'src/coach-motion.js');const {createFlareRig}=await import(R+'src/flare-rig.js');
  const data=fs.readFileSync(glb);
  const {scene:model}=await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),'');
  const rigData=JSON.parse(fs.readFileSync(R+'public/coach/coach-rig.json','utf8'));
  const motion=createCoachMotion({model,driver:createFlareRig(),rigData});
  const meshes=[];model.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o)});
  const nameOf=m=>{let o=m;while(o&&!/^Coach_/.test(o.name))o=o.parent;return o?.name??m.name;};
  for(const m of meshes)m.userData.coach=nameOf(m);
  const seq=JSON.parse(fs.readFileSync(R+'public/coach/flare-sequence.json','utf8'));
  return {model,motion,meshes,seq,R};
}
export function posed(mesh,out){const p=mesh.geometry.attributes.position,n=p.count,v=new THREE.Vector3();out??=new Float32Array(n*3);
  mesh.updateMatrixWorld(true);for(let i=0;i<n;i++){mesh.getVertexPosition(i,v).applyMatrix4(mesh.matrixWorld);out[i*3]=v.x;out[i*3+1]=v.y;out[i*3+2]=v.z;}return out;}
export function vertexNormals(mesh,P){const ix=mesh.geometry.index,n=P.length/3,N=new Float32Array(n*3);const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  for(let f=0;f<ix.count;f+=3){const i=ix.getX(f),j=ix.getX(f+1),k=ix.getX(f+2);a.fromArray(P,i*3);b.fromArray(P,j*3).sub(a);c.fromArray(P,k*3).sub(a);b.cross(c);
    for(const q of [i,j,k]){N[q*3]+=b.x;N[q*3+1]+=b.y;N[q*3+2]+=b.z;}}
  for(let i=0;i<n;i++){const l=Math.hypot(N[i*3],N[i*3+1],N[i*3+2])||1;N[i*3]/=l;N[i*3+1]/=l;N[i*3+2]/=l;}return N;}
// welded-position boundary vertices (open edges of the cloth: collar, hems, cuffs)
export function boundary(mesh,P){const ix=mesh.geometry.index,key=i=>`${Math.round(P[i*3]*2e4)},${Math.round(P[i*3+1]*2e4)},${Math.round(P[i*3+2]*2e4)}`;
  const id=new Map(),w=new Int32Array(P.length/3);for(let i=0;i<w.length;i++){const k=key(i);if(!id.has(k))id.set(k,id.size);w[i]=id.get(k);}
  const E=new Map();for(let f=0;f<ix.count;f+=3)for(let e=0;e<3;e++){let a=w[ix.getX(f+e)],b=w[ix.getX(f+(e+1)%3)];if(a>b)[a,b]=[b,a];const k=a*4194304+b;E.set(k,(E.get(k)||0)+1);}
  const bw=new Set();for(const [k,c] of E)if(c===1){bw.add(Math.floor(k/4194304));bw.add(k%4194304);}
  const out=new Uint8Array(w.length);for(let i=0;i<w.length;i++)if(bw.has(w[i]))out[i]=1;return out;}
export class Grid{constructor(P,cell=.02){this.P=P;this.c=cell;this.m=new Map();for(let i=0;i<P.length/3;i++){const k=this.k(P[i*3],P[i*3+1],P[i*3+2]);let a=this.m.get(k);if(!a)this.m.set(k,a=[]);a.push(i);}}
  k(x,y,z){return `${Math.floor(x/this.c)},${Math.floor(y/this.c)},${Math.floor(z/this.c)}`;}
  knn(x,y,z,K=1,rad=2){const cx=Math.floor(x/this.c),cy=Math.floor(y/this.c),cz=Math.floor(z/this.c),best=[];
    for(let r=0;r<=rad;r++){for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++)for(let l=-r;l<=r;l++){if(Math.max(Math.abs(i),Math.abs(j),Math.abs(l))!==r)continue;const a=this.m.get(`${cx+i},${cy+j},${cz+l}`);if(!a)continue;
      for(const q of a){const d=(this.P[q*3]-x)**2+(this.P[q*3+1]-y)**2+(this.P[q*3+2]-z)**2;if(best.length<K||d<best[best.length-1][1]){best.push([q,d]);best.sort((u,v)=>u[1]-v[1]);if(best.length>K)best.pop();}}}
      if(best.length>=K&&Math.sqrt(best[best.length-1][1])<r*this.c)break;}
    return best.map(([q,d])=>[q,Math.sqrt(d)]);}}
