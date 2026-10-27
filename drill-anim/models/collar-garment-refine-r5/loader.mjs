// Experimental inner-garment refinement for collar-weld-r25. Original assets
// and garment boundary remain intact; detach restores the original mesh data.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));

export async function applyGarmentRefinement(page) {
 const data=JSON.parse(fs.readFileSync(path.join(dir,'refinement.json'),'utf8'));
 const sourceIndex=JSON.parse(fs.readFileSync(path.join(dir,'source-index.json'),'utf8'));
 const refinedIndex=JSON.parse(fs.readFileSync(path.join(dir,'refined-index.json'),'utf8'));
 return page.evaluate(([data,sourceIndex,refinedIndex])=>{
  const T=window.__toonT, garment=flareInspector.viewer.coach.getObjectByName('Mesh005');
  if(window.__collarShared?.mesh?.name!=='V3_Head_Neck_Torso_Shared_R25' || window.__collarGarmentRefinement || !garment?.isSkinnedMesh)throw Error('expected active collar and original garment');
  const originalGeo=garment.geometry, originalMaterial=garment.material,n=originalGeo.attributes.position.count;
  if(Array.isArray(originalMaterial)||originalGeo.groups.length||n!==data.sourceVertexCount)throw Error('unexpected garment geometry or material');
  const oldIndex=originalGeo.index?.array;
  if(!oldIndex||oldIndex.length!==sourceIndex.length||sourceIndex.some((x,i)=>oldIndex[i]!==x))throw Error('garment source index differs from captured topology');
  if(data.sourceBoneNames.some((x,i)=>garment.skeleton.bones[i]?.name!==x))throw Error('garment skeleton differs');
  for(const [id,pos] of Object.entries(data.samples))for(let k=0;k<3;k++)if(Math.abs(originalGeo.attributes.position.getComponent(+id,k)-pos[k])>1e-6)throw Error(`garment source position differs ${id}`);
  const count=n+data.additions.length,geo=originalGeo.clone();
  for(const [name,a] of Object.entries(originalGeo.attributes)){
   if(a.count!==n)throw Error(`unsupported garment attribute ${name}`);
   const raw=name==='skinIndex'?new Uint16Array(count*a.itemSize):new Float32Array(count*a.itemSize);
   for(let i=0;i<n;i++)for(let k=0;k<a.itemSize;k++)raw[i*a.itemSize+k]=a.getComponent(i,k);
   for(const [row,entry] of data.additions.entries())for(let k=0;k<a.itemSize;k++){
    let value=entry.triangle.reduce((sum,id,i)=>sum+entry.barycentric[i]*a.getComponent(id,k),0);
    if(name==='position')value=entry.localPosition[k];
    if(name==='skinIndex'||name==='skinWeight'){
     const weights=Object.entries(entry.skinWeights).sort((x,y)=>Number(x[0])-Number(y[0]));
     value=name==='skinIndex'?Number(weights[k]?.[0]??0):Number(weights[k]?.[1]??0);
    }
    raw[(n+row)*a.itemSize+k]=value;
   }
   geo.setAttribute(name,new T.BufferAttribute(raw,a.itemSize,false));
  }
  geo.setIndex(new T.BufferAttribute(new Uint32Array(refinedIndex),1));geo.setDrawRange(0,refinedIndex.length);
  const material=originalMaterial.clone(),originalCompile=originalMaterial.onBeforeCompile,textures=[];
  material.onBeforeCompile=function(shader,renderer){
   originalCompile.call(this,shader,renderer);
   for(const name of ['uVT','uVR','uMMT','uV2pT']){
    const uniform=shader.uniforms[name],old=uniform?.value;if(!old?.image?.data)continue;
    const width=old.image.width,height=Math.max(old.image.height,Math.ceil(count/width));
    const src=old.image.data,dst=new src.constructor(width*height*4);dst.set(src);
    for(const [row,entry] of data.additions.entries())for(let k=0;k<4;k++)dst[(n+row)*4+k]=entry.triangle.reduce((sum,id,i)=>sum+entry.barycentric[i]*src[id*4+k],0);
    const tex=new T.DataTexture(dst,width,height,T.RGBAFormat,T.FloatType);tex.magFilter=tex.minFilter=T.NearestFilter;tex.needsUpdate=true;textures.push(tex);uniform.value=tex;
   }
  };
  material.customProgramCacheKey=()=>originalMaterial.customProgramCacheKey()+'-inner-collar-refine-r5';material.needsUpdate=true;
  garment.geometry=geo;garment.material=material;
  const engine=window.__drill,originalSelect=engine.selectModelProfile;
  function select(spec){const result=originalSelect.call(this,spec),active=!!window.__v2p.torso?.on;garment.geometry=active?geo:originalGeo;garment.material=active?material:originalMaterial;return result;}
  engine.selectModelProfile=select;window.__collarGarmentRefinement={garment,geo,material,originalGeo,originalMaterial,textures,engine,originalSelect,select};
  return {newVertices:data.additions.length,changedFaces:data.changedFaces,maxRestOffsetMm:data.maxOffsetMm,sourceBoundaryMoved:false};
 },[data,sourceIndex,refinedIndex]);
}

export async function detachGarmentRefinement(page){
 return page.evaluate(()=>{const s=window.__collarGarmentRefinement;if(!s)return false;if(s.engine.selectModelProfile!==s.select)throw Error('profile wrapper replaced');s.engine.selectModelProfile=s.originalSelect;s.garment.geometry=s.originalGeo;s.garment.material=s.originalMaterial;s.geo.dispose();s.material.dispose();s.textures.forEach(t=>t.dispose());delete window.__collarGarmentRefinement;return true;});
}
