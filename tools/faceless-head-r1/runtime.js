// Independent geometry component. Frozen armfix-r2 sources remain untouched.
window.installFacelessHeadR1 = function(data) {
  if (__armfixR2?.profile!=='training-human-v3-armfix'||__armfixR2?.version !== '0.1.0-r2' || window.__facelessHead) throw Error('Unexpected model/lifecycle');
  if(data.format!=='pose-hub-faceless-head@1'||data.version!=='0.1.0-r1')throw Error('Unexpected component version');
  const T=__toonT, mesh=__collarShared.mesh, old=mesh.geometry, materials=mesh.material;
  if (old.attributes.position.count!==data.sourceVertices) throw Error('Head source changed');
  const n=data.nearest.length, geometry=new T.BufferGeometry();
  for (const [name,a] of Object.entries(old.attributes)) {
    const array=new a.array.constructor(n*a.itemSize);
    for(let i=0;i<n;i++) for(let c=0;c<a.itemSize;c++) array[i*a.itemSize+c]=a.getComponent(data.nearest[i],c);
    geometry.setAttribute(name,new T.BufferAttribute(array,a.itemSize,a.normalized));
  }
  const si=geometry.attributes.skinIndex, sw=geometry.attributes.skinWeight;
  const head=mesh.skeleton.bones.findIndex(b=>b.name==='head');
  if(head<0) throw Error('No head bone');
  mesh.updateWorldMatrix(true,false);mesh.skeleton.update();
  const p=new T.Vector3(), norm=new T.Vector3();
  for(let i=0;i<n;i++) {
    if(data.exact[i]) continue;
    const y=data.positions[i*3+1], t=T.MathUtils.smoothstep(y,1.475,1.53);
    const weights=new Map([[head,t]]);
    for(let k=0;k<4;k++){const bone=si.getComponent(i,k); weights.set(bone,(weights.get(bone)||0)+sw.getComponent(i,k)*(1-t));}
    const entries=[...weights].filter(x=>x[1]>1e-9).sort((a,b)=>b[1]-a[1]).slice(0,4),sum=entries.reduce((s,x)=>s+x[1],0);
    for(let k=0;k<4;k++){si.setComponent(i,k,entries[k]?.[0]??0);sw.setComponent(i,k,(entries[k]?.[1]??0)/sum);}
    const blend=new T.Matrix4();blend.elements.fill(0);
    for(let k=0;k<4;k++) {const j=si.getComponent(i,k),w=sw.getComponent(i,k),m=new T.Matrix4().multiplyMatrices(mesh.skeleton.bones[j].matrixWorld,mesh.skeleton.boneInverses[j]); for(let c=0;c<16;c++)blend.elements[c]+=m.elements[c]*w;}
    const world=new T.Matrix4().multiplyMatrices(mesh.matrixWorld,mesh.bindMatrixInverse).multiply(blend).multiply(mesh.bindMatrix);
    p.fromArray(data.positions,i*3).applyMatrix4(world.clone().invert());geometry.attributes.position.setXYZ(i,p.x,p.y,p.z);
    norm.fromArray(data.normals,i*3).applyMatrix3(new T.Matrix3().setFromMatrix4(world).transpose()).normalize();geometry.attributes.normal.setXYZ(i,norm.x,norm.y,norm.z);
  }
  const indices=[];
  for(let part=0;part<materials.length;part++){const start=indices.length;for(let f=0;f<data.faceMaterials.length;f++)if(data.faceMaterials[f]===part)indices.push(...data.index.slice(f*3,f*3+3));geometry.addGroup(start,indices.length-start,part);}
  geometry.setIndex(indices);geometry.computeBoundingSphere();
  const errors=[];
  const remapped=materials.map((original,part)=>{
    const mat=original.clone(),compile=original.onBeforeCompile;
    mat.onBeforeCompile=function(sh,renderer){
      compile.call(this,sh,renderer);
      for(const name of ['uVT','uVR','uMMT','uV2pT','uNeckSeamSkin','uCollarRimMask']){
        const uniform=sh.uniforms[name],texture=uniform?.value;if(!texture?.image?.data)continue;
        const src=texture.image.data,width=texture.image.width,height=Math.ceil(n/width),dst=new src.constructor(width*height*4);
        for(let i=0;i<n;i++){
          for(let c=0;c<4;c++)dst[i*4+c]=src[data.nearest[i]*4+c];
          if(!data.exact[i]&&name==='uVT'){dst.set([1,0,0,0],i*4);}
          if(!data.exact[i]&&['uVR','uV2pT','uMMT'].includes(name))for(let c=0;c<3;c++)dst[i*4+c]=data.positions[i*3+c];
        }
        const tex=new T.DataTexture(dst,width,height,texture.format,texture.type);
        for(const key of ['magFilter','minFilter','wrapS','wrapT','colorSpace'])tex[key]=texture[key];tex.needsUpdate=true;sh.uniforms[name]={...uniform,value:tex};
      }
      if(part===1){const needle='vec3 lit=mix(shc,alb,b);';if(!sh.fragmentShader.includes(needle))errors.push('Missing head lighting');sh.fragmentShader=sh.fragmentShader.replace(needle,'vec3 lit=mix(shc,alb,smoothstep(-0.25,0.85,nl));');}
    };
    mat.customProgramCacheKey=()=>original.customProgramCacheKey()+'|faceless-head-r1';return mat;
  });
  for(const id of data.preservedVertexIds)for(const [name,a] of Object.entries(old.attributes))for(let c=0;c<a.itemSize;c++)if(a.getComponent(id,c)!==geometry.attributes[name].getComponent(id,c))throw Error('Retained attribute changed: '+name);
  window.__facelessHead={version:'0.1.0-r1',mesh,geometry,errors,preservedVertexIds:data.preservedVertexIds,
    enable(on){mesh.geometry=on?geometry:old;mesh.material=on?remapped:materials;},
    report(){return {...data.qa,errors:[...errors]};}};
  __facelessHead.enable(true);
};
