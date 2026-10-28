// Independent r2 adaptation reads fixed symmetric source seam IDs.
// The piece-normal hooks precede garment geometry swaps and can also update
// seam normals without a swap. Keep the seven refined normals consistent.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export async function install(page){
 const files=['training-human-v2plus-torso-base.json','training-human-v2plus-limbs-base.json','hands-native-c1r2-symmetric-r1/hands-base.json'];
 const seams=files.map(f=>JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models',f),'utf8')).seam);
 const ids=[...new Set(seams.flatMap(s=>s.vid.filter((_,i)=>s.mesh[i]==='Mesh005')))];
 const additions=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/collar-garment-refine-r7/refinement.json'),'utf8')).additions;
 return page.evaluate(([ids,additions])=>{
  const engine=window.__drill,V=window.__v2p,garment=window.__collarGarmentRefinement;
  if(!engine||!garment||!V?.__pieceNormalsR1||window.__completedNormalSyncR4)throw Error('completed normals sync: expected installed piece normals and collar garment');
  const original=engine.selectModelProfile,originalHands=V.setHands,originalOutfit=V.setOutfit;
  if(typeof originalHands!=='function'||typeof originalOutfit!=='function')throw Error('completed normals sync: missing profile controls');
  function refresh(){
   garment.refreshTextures();
   if(garment.garment.geometry!==garment.geo)return;
   const dst=garment.geo.attributes.normal;
   for(const a of additions){const n=[0,0,0];for(let i=0;i<3;i++)for(let c=0;c<3;c++)n[c]+=a.barycentric[i]*dst.getComponent(a.triangle[i],c);dst.setXYZ(a.newIndex,...n);}
   dst.needsUpdate=true;if(dst.isInterleavedBufferAttribute)dst.data.needsUpdate=true;
  }
  function setHands(...args){const value=originalHands.apply(this,args);refresh();return value;}
  function setOutfit(...args){const value=originalOutfit.apply(this,args);refresh();return value;}
  function select(...args){
   const previous=garment.garment.geometry,result=original.apply(this,args),next=garment.garment.geometry;
   if(previous!==next){
    const src=previous.attributes.normal,dst=next.attributes.normal;
    if(!src||!dst||ids.some(i=>i<0||i>=src.count||i>=dst.count))throw Error('completed normals sync: invalid source normals');
    for(const id of ids)dst.setXYZ(id,src.getX(id),src.getY(id),src.getZ(id));
    dst.needsUpdate=true;if(dst.isInterleavedBufferAttribute)dst.data.needsUpdate=true;
   }
   refresh();return result;
  }
  V.setHands=setHands;V.setOutfit=setOutfit;engine.selectModelProfile=select;
  window.__completedNormalSyncR4={engine,V,original,originalHands,originalOutfit,select,setHands,setOutfit};
  return {garmentSeamVertices:ids.length,refinedVertices:additions.length};
 },[ids,additions]);
}
export async function detach(page){return page.evaluate(()=>{const x=window.__completedNormalSyncR4;if(!x)return false;if(x.engine.selectModelProfile!==x.select||x.V.setHands!==x.setHands||x.V.setOutfit!==x.setOutfit)throw Error('completed normals sync: profile wrapper replaced');x.engine.selectModelProfile=x.original;x.V.setHands=x.originalHands;x.V.setOutfit=x.originalOutfit;delete window.__completedNormalSyncR4;return true;});}
