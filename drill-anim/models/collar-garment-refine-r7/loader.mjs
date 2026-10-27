// Experimental inner-garment refinement for collar-weld-r26. Original assets
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
  if(window.__collarShared?.mesh?.name!=='V3_Head_Neck_Torso_Shared_R26' || window.__collarGarmentRefinement || !garment?.isSkinnedMesh)throw Error('expected active collar and original garment');
  const originalGeo=garment.geometry, originalMaterial=garment.material,n=originalGeo.attributes.position.count;
  if(Array.isArray(originalMaterial)||originalGeo.groups.length||n!==data.sourceVertexCount)throw Error('unexpected garment geometry or material');
  const oldIndex=originalGeo.index?.array;
  if(!oldIndex||oldIndex.length!==sourceIndex.length||sourceIndex.some((x,i)=>oldIndex[i]!==x))throw Error('garment source index differs from captured topology');
  if(data.sourceBoneNames.some((x,i)=>garment.skeleton.bones[i]?.name!==x))throw Error('garment skeleton differs');
  for(const [id,pos] of Object.entries(data.samples))for(let k=0;k<3;k++)if(Math.abs(originalGeo.attributes.position.getComponent(+id,k)-pos[k])>1e-6)throw Error(`garment source position differs ${id}`);
  const moves=data.sourceMoves;
  if(!moves||moves.localDeltas.length!==moves.ids.length*3||moves.worldDeltas.length!==moves.ids.length*3||moves.normalValues.length!==moves.ids.length*3||new Set(moves.ids).size!==moves.ids.length||moves.ids.some(i=>i<0||i>=n))throw Error('invalid internal garment moves');
  const count=n+data.additions.length,geo=originalGeo.clone();
  for(const [name,a] of Object.entries(originalGeo.attributes)){
   if(a.count!==n)throw Error(`unsupported garment attribute ${name}`);
   const raw=name==='skinIndex'?new Uint16Array(count*a.itemSize):new Float32Array(count*a.itemSize);
   for(let i=0;i<n;i++)for(let k=0;k<a.itemSize;k++)raw[i*a.itemSize+k]=a.getComponent(i,k);
   if(name==='position'||name==='normal')for(const [row,id]of moves.ids.entries())for(let k=0;k<3;k++)raw[id*a.itemSize+k]=name==='position'?raw[id*a.itemSize+k]+moves.localDeltas[row*3+k]:moves.normalValues[row*3+k];
   for(const [row,entry] of data.additions.entries())for(let k=0;k<a.itemSize;k++){
    let value=entry.triangle.reduce((sum,id,i)=>sum+entry.barycentric[i]*raw[id*a.itemSize+k],0);
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
  const material=originalMaterial.clone(),originalCompile=originalMaterial.onBeforeCompile,textures=[],textureRecords=[];
  function refreshTextures(force=false){
   for(const r of textureRecords){
    if(!force&&r.version===r.source.version)continue;
    const src=r.source.image.data,dst=r.texture.image.data;if(src.length>dst.length)throw Error('garment source texture grew');dst.fill(0);dst.set(src);
    if(r.name==='uVR'||r.name==='uV2pT')for(const [row,id]of moves.ids.entries())for(let k=0;k<3;k++)dst[id*4+k]+=moves.worldDeltas[row*3+k];
    for(const [row,entry]of data.additions.entries())for(let k=0;k<4;k++)dst[(n+row)*4+k]=entry.triangle.reduce((sum,id,i)=>sum+entry.barycentric[i]*dst[id*4+k],0);
    r.version=r.source.version;r.texture.needsUpdate=true;
   }
  }
  material.onBeforeCompile=function(shader,renderer){
   originalCompile.call(this,shader,renderer);
   for(const name of ['uVT','uVR','uMMT','uV2pT']){
    const uniform=shader.uniforms[name],old=uniform?.value;if(!old?.image?.data)continue;
    const width=old.image.width,height=Math.max(old.image.height,Math.ceil(count/width));
    const src=old.image.data,dst=new src.constructor(width*height*4);
    const tex=new T.DataTexture(dst,width,height,T.RGBAFormat,T.FloatType);tex.magFilter=tex.minFilter=T.NearestFilter;textures.push(tex);textureRecords.push({name,source:old,texture:tex,version:-1});uniform.value=tex;
   }
   refreshTextures();
  };
  material.customProgramCacheKey=()=>originalMaterial.customProgramCacheKey()+'-inner-collar-refine-r7';material.needsUpdate=true;
  garment.geometry=geo;garment.material=material;
  const engine=window.__drill,originalSelect=engine.selectModelProfile;
  function select(spec){const result=originalSelect.call(this,spec),active=!!window.__v2p.torso?.on;garment.geometry=active?geo:originalGeo;garment.material=active?material:originalMaterial;return result;}
  engine.selectModelProfile=select;window.__collarGarmentRefinement={garment,geo,material,originalGeo,originalMaterial,textures,textureRecords,refreshTextures,engine,originalSelect,select};
  return {newVertices:data.additions.length,movedVertices:moves.ids.length,changedFaces:data.changedFaces,maxRestOffsetMm:data.maxOffsetMm,sourceBoundaryMoved:false};
 },[data,sourceIndex,refinedIndex]);
}

export async function detachGarmentRefinement(page){
 return page.evaluate(()=>{const s=window.__collarGarmentRefinement;if(!s)return false;if(s.engine.selectModelProfile!==s.select)throw Error('profile wrapper replaced');s.engine.selectModelProfile=s.originalSelect;s.garment.geometry=s.originalGeo;s.garment.material=s.originalMaterial;s.geo.dispose();s.material.dispose();s.textures.forEach(t=>t.dispose());delete window.__collarGarmentRefinement;return true;});
}
