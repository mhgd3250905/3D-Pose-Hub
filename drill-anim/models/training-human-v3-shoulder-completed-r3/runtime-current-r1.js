// Experimental P5 installer. No init, pose reset, bone edits or shader edits.
// Candidate data are the independent left/right bind-offset tables. For P3,
// torso ID i maps once to shared ID headCount+i; the common ring is not copied.
(function () {
  window.__installCurrentShouldersR1 = function (left, right, config) {
    const T=window.__toonT, viewer=window.flareInspector?.viewer, state=window.__v2p?.torso;
    const source=state?.mesh, shared=window.__collarShared, mesh=shared?.mesh || source;
    if(!T||!viewer?.coach||!state?.on||!source?.isSkinnedMesh||!mesh?.isSkinnedMesh||!mesh.visible)throw Error('shoulder-current-r1: active torso required');
    if(mesh.userData.__currentShouldersR1)throw Error('shoulder-current-r1: already installed');
    if(left.sourceSha256!==right.sourceSha256||left.count!==right.count||left.seamFirst!==right.seamFirst||source.geometry.attributes.position.count!==left.count)throw Error('shoulder-current-r1: incompatible sources');
    const offset=shared ? mesh.geometry.attributes.position.count-left.count : 0;
    if(shared && (shared.torso!==source || !shared.head || offset!==shared.head.geometry.attributes.position.count || offset!==14511))throw Error('shoulder-current-r1: unverified shared topology');
    const geom=mesh.geometry, count=geom.attributes.position.count, existing=Object.values(geom.morphAttributes), oldCount=existing.length?existing[0].length:0;
    if(existing.some(a=>a.length!==oldCount)||oldCount&&(!geom.morphTargetsRelative||mesh.morphTargetInfluences?.length!==oldCount))throw Error('shoulder-current-r1: incompatible existing morphs');
    if(!Array.from(Array.isArray(mesh.material)?mesh.material:[mesh.material]).every(m=>m?.isMeshToonMaterial))throw Error('shoulder-current-r1: expected toon materials');
    const names=mesh.skeleton.bones.map(b=>b.name),sourceNames=source.skeleton.bones.map(b=>b.name),indices=new Map(names.map((n,i)=>[n,i]));
    if(indices.size!==names.length||['torso','leftUpperArm','leftForearm','rightUpperArm','rightForearm'].some(n=>!indices.has(n)))throw Error('shoulder-current-r1: missing/duplicate bones');
    const center=Object.fromEntries(['left','right'].map(side=>[side,config.centersXYZW[side].map(v=>new T.Quaternion(...v).normalize())]));
    const a=new T.Matrix4(),b=new T.Matrix4(),q=new T.Quaternion(),sk=new T.Matrix4(),bone=new T.Matrix4();
    function relative(parent,child,c) {a.fromArray(mesh.skeleton.boneMatrices,16*indices.get(parent));b.fromArray(mesh.skeleton.boneMatrices,16*indices.get(child));if(Math.abs(a.determinant())<1e-12)throw Error('shoulder-current-r1: singular bone');q.setFromRotationMatrix(a.invert().multiply(b)).normalize();return q.angleTo(c)*180/Math.PI;}
    function gate(side) {const d=[relative('torso',side+'UpperArm',center[side][0]),relative(side+'UpperArm',side+'Forearm',center[side][1])];const amount=d.reduce((z,v,i)=>{const inner=config.innerDegrees[i],outer=config.outerDegrees[i];if(!(outer>inner))throw Error('shoulder-current-r1: invalid gate');const x=Math.max(0,Math.min(1,(outer-v)/(outer-inner)));return z*x*x*(3-2*x);},1);return {amount,degrees:d};}
    function skinWorld(m,i) {const g=m.geometry,e=sk.elements.fill(0),si=g.attributes.skinIndex,sw=g.attributes.skinWeight;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(!w)continue;bone.fromArray(m.skeleton.boneMatrices,si.getComponent(i,k)*16);for(let j=0;j<16;j++)e[j]+=w*bone.elements[j];}return new T.Matrix4().copy(m.matrixWorld).multiply(m.bindMatrixInverse).multiply(sk).multiply(m.bindMatrix);}
    viewer.coach.updateMatrixWorld(true);source.skeleton.update();mesh.skeleton.update();
    const dense=[new Float32Array(count*3),new Float32Array(count*3)],seen=new Set();let maxMappingDiff=0;
    for(const [side,data] of [[0,left],[1,right]]){
      const raw=atob(data.bindOffsetsF32);if(raw.length!==data.vertexIds.length*12)throw Error('shoulder-current-r1: offset length');const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),v=new DataView(bytes.buffer);
      data.vertexIds.forEach((id,i)=>{
        if(!Number.isInteger(id)||id<0||id>=data.seamFirst||seen.has(id))throw Error('shoulder-current-r1: bad/overlapping vertex');seen.add(id);
        const dest=offset+id,delta=[0,1,2].map(k=>v.getFloat32(12*i+4*k,true));if(!delta.every(Number.isFinite))throw Error('shoulder-current-r1: bad offset');
        if(shared){const src=skinWorld(source,id).elements.slice(),dst=skinWorld(mesh,dest).elements;for(let j=0;j<16;j++)maxMappingDiff=Math.max(maxMappingDiff,Math.abs(src[j]-dst[j]));}
        dense[side].set(delta,dest*3);
      });
    }
    if(maxMappingDiff>1e-5)throw Error('shoulder-current-r1: shared torso skin mapping mismatch '+maxMappingDiff);
    const before=mesh.morphTargetInfluences?.slice()||[];
    for(const [name,attrs] of Object.entries(geom.morphAttributes))if(name!=='position'){
      const size=attrs[0]?.itemSize||geom.attributes[name]?.itemSize;if(!size)throw Error('shoulder-current-r1: unknown morph attribute '+name);
      for(let i=0;i<2;i++)attrs.push(new T.Float32BufferAttribute(new Float32Array(count*size),size));
    }
    if(!geom.morphAttributes.position){geom.morphAttributes.position=[];for(let i=0;i<oldCount;i++)geom.morphAttributes.position.push(new T.Float32BufferAttribute(new Float32Array(count*3),3));}
    geom.morphAttributes.position.push(...dense.map(x=>new T.Float32BufferAttribute(x,3)));geom.morphTargetsRelative=true;mesh.updateMorphTargets();
    for(let i=0;i<oldCount;i++)mesh.morphTargetInfluences[i]=before[i];mesh.morphTargetInfluences[oldCount]=0;mesh.morphTargetInfluences[oldCount+1]=0;
    geom.dispose();for(const m of Array.isArray(mesh.material)?mesh.material:[mesh.material])m.needsUpdate=true;
    let auto=false;const previous=mesh.onBeforeRender;
    const controller={mesh,source,offset,morphIndices:[oldCount,oldCount+1],normalTargetsInstalled:false,
      update(){viewer.coach.updateMatrixWorld(true);mesh.skeleton.update();const result={left:gate('left'),right:gate('right')};if(auto){mesh.morphTargetInfluences[oldCount]=result.left.amount;mesh.morphTargetInfluences[oldCount+1]=result.right.amount;}return result;},
      setAuto(value){auto=!!value;return this.update();},
      setAmounts(values){if(values.length!==2||values.some(x=>!Number.isFinite(x)||x<0||x>1))throw Error('shoulder-current-r1: bad amount');auto=false;values.forEach((v,i)=>mesh.morphTargetInfluences[oldCount+i]=v);},
      report(){return {offset,vertices:seen.size,sideVertices:[left.vertexIds.length,right.vertexIds.length],morphIndices:this.morphIndices,amounts:this.morphIndices.map(i=>mesh.morphTargetInfluences[i]),auto,maxMappingDiff,sourceBoneCount:sourceNames.length,targetBoneCount:names.length,normalTargetsInstalled:this.normalTargetsInstalled};}
    };
    mesh.onBeforeRender=function(...args){previous.apply(this,args);if(auto)controller.update();};mesh.userData.__currentShouldersR1=controller;
    return controller.report();
  };
})();
