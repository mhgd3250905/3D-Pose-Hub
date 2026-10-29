// Independent source-based precondition for a new scale-1 palm calibration.
// This never calls the old r5 installer or relaxes its 1.18/rest preconditions.
(function(){
window.__assertArmfixContactBase=function(expected){
  const fail=(ok,message)=>{if(!ok)throw Error('armfix-contact guard: '+message);};
  fail(expected?.format==='pose-hub-armfix-contact-guard@1'&&expected.handScale===1,'independent scale-1 authority required');
  fail(window.__armfixR1?.profile==='training-human-v3-armfix'&&window.__armfixR1.version==='0.1.0-r1'&&window.__armfixR1.handScale===1,'fresh armfix-r1 base required');
  fail(!window.__v3ContactR5&&!window.__armfixContactR2&&!window.__armfixContactUsedR2,'old/previous calibration present; discard page');
  const T=__toonT,v=flareInspector.viewer,H=window.__v2p?.hands?.mesh;
  fail(H?.isSkinnedMesh&&H.visible&&__v2p.hands.on,'visible native hand mesh required');
  const names=H.skeleton.bones.map(b=>b.name),data=expected.handMesh;
  fail(H.geometry.attributes.position.count===data.n,'native mesh vertex count changed');
  fail(names.length===52&&JSON.stringify(names)===JSON.stringify(expected.boneNames),'52-bone source identity/order mismatch');
  const saved=H.skeleton.bones.map(b=>({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone(),parent:b.parent}));
  const curRef=__v2p.cur,cur={...curRef},setter=__v2p.setHandPose;
  const report={authority:expected.sourcePins,handScale:1,checkedBones:52,checkedFingerBones:0,
    meshVertices:data.n,seamVerticesExcluded:data.n-data.seamFirst,checkedVertices:0,
    sourceMeshMaxErrorMm:0,worstVertex:null,maxFingerPivotErrorMm:0,maxArmRestVectorErrorMm:0,
    sides:{left:{checkedVertices:0,maxErrorMm:0},right:{checkedVertices:0,maxErrorMm:0}},
    note:'Matches the actual source recipe/mesh at reset; does not claim left/right source symmetry or production acceptance.'};
  try{
    for(const key of Object.keys(expected.palmPose)){
      const actual=__v2p.poses['palm-floor']?.[key],wanted=expected.palmPose[key];
      fail(Array.isArray(actual)&&actual.length===4&&actual.every((n,i)=>Number.isFinite(n)&&Math.abs(n-wanted[i])<1e-12),'original palm-floor pose changed: '+key);
    }
    __v2p.setHandPose('left','palm-floor',1);__v2p.setHandPose('right','palm-floor',1);
    v.coach.updateMatrixWorld(true);H.skeleton.update();
    const point=name=>{const b=v.coach.getObjectByName(name);fail(b?.isBone,'missing live Bone '+name);return b.getWorldPosition(new T.Vector3());};
    for(const side of ['left','right']){
      const sh=point(side+'UpperArm'),el=point(side+'Forearm'),wr=point(side+'Hand');
      for(const [actual,wanted]of[[el.clone().sub(sh),expected.armVectors[side].upperArm],[wr.clone().sub(el),expected.armVectors[side].forearm]]){
        const error=actual.distanceTo(new T.Vector3(...wanted))*1000;
        report.maxArmRestVectorErrorMm=Math.max(report.maxArmRestVectorErrorMm,error);
        fail(error<=.10,'live arm is not independent source reset pose: '+side+' error '+error+' mm');
      }
      for(const finger of ['thumb','index','middle','ring','pinky'])for(let j=1;j<=3;j++){
        const name='v2p_'+(side==='left'?'L':'R')+'_'+finger+j,b=v.coach.getObjectByName(name),wanted=expected.fingerRest[side][finger+j];
        fail(b?.isBone&&b.parent?.name===wanted.parent,'finger parent mismatch: '+name);
        const error=b.position.distanceTo(new T.Vector3(...wanted.position))*1000;
        report.maxFingerPivotErrorMm=Math.max(report.maxFingerPivotErrorMm,error);report.checkedFingerBones++;
        fail(error<=.001&&Math.abs(b.quaternion.x)+Math.abs(b.quaternion.y)+Math.abs(b.quaternion.z)<=1e-10&&Math.abs(b.quaternion.w-1)<=1e-10,'finger source pivot/rest mismatch: '+name);
        fail(b.scale.distanceTo(new T.Vector3(1,1,1))<1e-10,'finger scale changed: '+name);
      }
    }
    const binary=atob(data.u16),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    const q=new Uint16Array(bytes.buffer),pv=new T.Vector3(),wanted=new T.Vector3();
    fail(q.length===data.n*3&&Number.isInteger(data.seamFirst)&&data.seamFirst>0&&data.seamFirst<=data.n,'source quantized mesh authority invalid');
    const si=H.geometry.attributes.skinIndex,sw=H.geometry.attributes.skinWeight;
    for(let i=0;i<data.seamFirst;i++){
      H.getVertexPosition(i,pv).applyMatrix4(H.matrixWorld);
      wanted.set(...[0,1,2].map(k=>data.lo[k]+q[i*3+k]*data.scale[k]));
      const error=pv.distanceTo(wanted)*1000;
      let bi=0,weight=-1;for(let k=0;k<4;k++)if(sw.getComponent(i,k)>weight){weight=sw.getComponent(i,k);bi=si.getComponent(i,k);}
      const side=/^(?:right|v2p_R_)/.test(names[bi])?'right':'left';
      report.checkedVertices++;report.sides[side].checkedVertices++;
      report.sides[side].maxErrorMm=Math.max(report.sides[side].maxErrorMm,error);
      if(error>report.sourceMeshMaxErrorMm){report.sourceMeshMaxErrorMm=error;report.worstVertex=i;}
    }
    fail(report.checkedFingerBones===30&&report.checkedVertices===data.seamFirst,'incomplete source/pivot check');
    fail(report.sourceMeshMaxErrorMm<=.15,'actual hand mesh differs from independent scale-1 source by '+report.sourceMeshMaxErrorMm+' mm at vertex '+report.worstVertex);
    return report;
  }finally{
    for(const x of saved){fail(x.b.parent===x.parent,'precondition changed a parent');x.b.position.copy(x.p);x.b.quaternion.copy(x.q);x.b.scale.copy(x.s);}
    __v2p.cur=curRef;for(const key of Object.keys(curRef))delete curRef[key];Object.assign(curRef,cur);
    fail(__v2p.setHandPose===setter,'precondition changed hand setter');v.coach.updateMatrixWorld(true);
  }
};
})();
