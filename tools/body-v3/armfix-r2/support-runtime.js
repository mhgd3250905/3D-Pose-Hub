// Fixed support preset. No mesh fitting, optimization or per-frame vertex reads.
(function(){
window.__installFixedSupport=function(data,{sourceId}={}){
 const T=window.__toonT,V=window.__v2p,v=flareInspector.viewer,m=v.motion,H=V?.hands?.mesh;
 if(window.__fixedSupport||!H||!V.hands.on||!H.visible)throw Error('support: fresh active native hands required');
 if(data?.format!=='pose-hub-fixed-support@1'||data.handScale!==1||data.coordinateFrame!=='motion-rest-delta'||!sourceId||sourceId!==data.sourceId)throw Error('support: fixed source identity mismatch');
 function fingerprint(H){let h=2166136261;for(const [a,k]of [[H.geometry.attributes.position,1e7],[H.geometry.attributes.skinIndex,1],[H.geometry.attributes.skinWeight,1e7],[H.geometry.index,1]]){if(!a)throw Error('support: missing indexed skin attribute');for(let i=0;i<a.count;i++)for(let j=0;j<a.itemSize;j++){h^=Math.round(a.getComponent(i,j)*k);h=Math.imul(h,16777619);}}return (h>>>0).toString(16).padStart(8,'0');}
 if(H.geometry.attributes.position.count!==data.mesh.vertices||H.geometry.index?.count!==data.mesh.indices||fingerprint(H)!==data.mesh.fingerprint||H.skeleton.bones.map(b=>b.name).join('|')!==data.mesh.bones.join('|'))throw Error('support: calibrated mesh mismatch');
 const FN=['thumb','index','middle','ring','pinky'],keys=FN.flatMap(f=>[1,2,3].map(j=>f+j)),aliases={left:'__fixed-support-left',right:'__fixed-support-right'};
 const vec=a=>{if(!Array.isArray(a)||a.length!==3||a.some(x=>!Number.isFinite(x)))throw Error('support: invalid frame');return new T.Vector3(...a);};
 const frame=(f,n)=>{const y=f.clone().normalize(),z=n.clone().addScaledVector(y,-n.dot(y)).normalize(),x=new T.Vector3().crossVectors(y,z).normalize();return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z));};
 const fixed={};
 for(const side of ['left','right']){
  const d=data.sides?.[side],p=d?.pose,L=vec(d?.longitudinal),N=vec(d?.palmarNormal);
  if(!p||Object.keys(p).sort().join('|')!==keys.slice().sort().join('|')||keys.some(k=>!Array.isArray(p[k])||p[k].length!==4||p[k].some(x=>!Number.isFinite(x))||Math.abs(p[k].reduce((a,b)=>a+b*b,0)-1)>1e-6)||Math.abs(L.length()-1)>1e-6||Math.abs(N.length()-1)>1e-6||Math.abs(L.dot(N))>1e-6||!Number.isFinite(d.wristHeightM)||d.wristHeightM<=0||d.wristHeightM>.15)throw Error('support: malformed fixed pose/frame');
  fixed[side]={pose:structuredClone(p),inverseFrame:frame(L,N).invert(),height:d.wristHeightM};
 }
 const oldSet=V.setHandPose,oldGround=m.getGroundHandPose,prior=Object.fromEntries(Object.values(aliases).map(a=>[a,{own:Object.hasOwn(V.poses,a),value:V.poses[a]}]));
 for(const side of ['left','right'])V.poses[aliases[side]]=fixed[side].pose;
 const setter=function(side,name,k=1){if(name!=='support'&&name!=='palm-floor')return oldSet.call(this,side,name,k);if(!fixed[side])throw Error('support: invalid hand side');const result=oldSet.call(this,side,aliases[side],k);this.cur[side]=name;return result;};
 // getGroundHandPose is the engine floor-support API, so every call uses
 // the fixed floor frame; explicit support/palm-floor selects finger shape.
 const ground=function(side,direction,position){
  if(!fixed[side])throw Error('support: invalid hand side');if(!V.hands.on||!V.hands.mesh.visible)return oldGround.call(this,side,direction,position);
  if(V.hands.mesh!==H)throw Error('support: mesh replaced; discard page');
  const f=vec(direction);f.y=0;if(f.lengthSq()<1e-8)throw Error('support: horizontal finger direction required');f.normalize();
  const q=frame(f,new T.Vector3(0,-1,0)).multiply(fixed[side].inverseFrame),w=position?vec(position):new T.Vector3(side==='left'?.215:-.215,0,0);w.y=fixed[side].height;
  return {wrist:w.toArray(),handQuaternion:q.toArray(),fingerDirection:f.toArray()};
 };
 V.setHandPose=setter;m.getGroundHandPose=ground;
 return window.__fixedSupport={sourceId,pose:'support',data,remove(){if(V.setHandPose!==setter||m.getGroundHandPose!==ground)throw Error('support: hook conflict; discard page');for(const side of ['left','right'])if(V.poses[aliases[side]]!==fixed[side].pose)throw Error('support: pose conflict; discard page');V.setHandPose=oldSet;m.getGroundHandPose=oldGround;for(const a of Object.values(aliases)){if(prior[a].own)V.poses[a]=prior[a].value;else delete V.poses[a];}delete window.__fixedSupport;return {removed:true};}};
};
})();
