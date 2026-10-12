// in-page helper: turns the flare coach into a posed muscle-map body (rest-pose positions retargeted onto the
// mannequin muscle-map frame, carried as a vertex attribute so the panels ride with the skinning).
window.__posedMuscle = async function(opts={}){
  const ver=(await (await fetch('/src/viewer.js')).text()).match(/three\.js\?v=(\w+)/)[1];
  const T=await import('/node_modules/.vite/deps/three.js?v='+ver);
  const MM=await import('/src/muscle-map.js');
  const v=flareInspector.viewer;v.playing=false;
  v.motion.reset();v.coach.updateMatrixWorld(true);
  const J=v.motion.getMetrics().joints;const P=a=>new T.Vector3(...a);
  const Q={shoulder:[.19,1.36,-.005],elbow:[.29,1.085,-.005],wrist:[.365,.875,.02],palm:[.39,.80,.04],hip:[.09,.86,0],knee:[.12,.47,0],ankle:[.15,.08,-.02],toe:[.17,.03,.13]};
  const q=(k,side)=>{const a=Q[k];return new T.Vector3(side==='left'?a[0]:-a[0],a[1],a[2]);};
  const seg={UpperArm:['Shoulder','Elbow','shoulder','elbow'],Forearm:['Elbow','Wrist','elbow','wrist'],Hand:['Wrist','Palm','wrist','palm'],
    Thigh:['Hip','Knee','hip','knee'],Patella:['Knee','Ankle','knee','ankle'],Shin:['Knee','Ankle','knee','ankle'],Foot:['Ankle','Toe','ankle','toe']};
  const X={};
  for(const side of ['left','right'])for(const [b,[a0,a1,k0,k1]] of Object.entries(seg)){
    const P0=P(J[side+a0]),P1=P(J[side+a1]),Q0=q(k0,side),Q1=q(k1,side);
    const R=new T.Quaternion().setFromUnitVectors(P1.clone().sub(P0).normalize(),Q1.clone().sub(Q0).normalize());
    const s=Q1.distanceTo(Q0)/P1.distanceTo(P0);X[side+b]={P0,Q0,R,s};}
  const uniforms=MM.createMuscleUniforms();uniforms.mmMulti.value=1;uniforms.mmReveal.value=1;uniforms.mmTime.value=0;
  const info=[];const hide=opts.hide||(n=>false);
  v.coach.traverse(o=>{if(!o.isMesh)return;info.push(o.name);
    if(hide(o.name)){o.visible=false;return;}
    if(!o.isSkinnedMesh)return;
    const g=o.geometry,n=g.attributes.position.count,out=new Float32Array(n*3),tmp=new T.Vector3(),acc=new T.Vector3(),w=new T.Vector4(),ix=new T.Vector4(),t2=new T.Vector3();
    const si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bones=o.skeleton.bones;
    for(let i=0;i<n;i++){o.getVertexPosition(i,tmp);tmp.applyMatrix4(o.matrixWorld);
      ix.fromBufferAttribute(si,i);w.fromBufferAttribute(sw,i);acc.set(0,0,0);let tot=0;
      for(let k=0;k<4;k++){const wt=w.getComponent(k);if(wt<=0)continue;const name=bones[ix.getComponent(k)]?.name;const x=X[name];
        if(x){t2.copy(tmp).sub(x.P0).applyQuaternion(x.R).multiplyScalar(x.s).add(x.Q0);}else t2.copy(tmp);
        acc.addScaledVector(t2,wt);tot+=wt;}
      acc.multiplyScalar(1/(tot||1));out[i*3]=acc.x;out[i*3+1]=acc.y;out[i*3+2]=acc.z;}
    g.setAttribute('mmRest',new T.BufferAttribute(out,3));
    const clothing=opts.clothing?.(o.name)||false;
    const m=new T.MeshStandardMaterial({color:0xffffff,roughness:.62,metalness:0,transparent:clothing});
    MM.applyMuscleMap(m,uniforms,{clothing});const ob=m.onBeforeCompile;
    m.onBeforeCompile=sh=>{ob(sh);sh.vertexShader='attribute vec3 mmRest;\n'+sh.vertexShader.replace('vMmPos = transformed;','vMmPos = mmRest;');};
    m.customProgramCacheKey=()=>'posed-mm'+(clothing?'-c':'');o.material=m;o.castShadow=true;});
  window.__pm={T,MM,uniforms,v,J};return info;
};
