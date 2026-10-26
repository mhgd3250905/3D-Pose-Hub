// hands-native r5 page runtime: share the hand's twist about the forearm axis with the forearm bone so the
// visible wrist seam (native hand vs frozen forearm/sleeve) no longer carries the whole pronation/supination.
// Opt-in: injected only by native-open-r1 for nativeHands.version '1.0.0-r5'. Hand world orientation is unchanged.
(function(){
 const E=window.__drill,T=window.__toonT,v=flareInspector.viewer;if(!E||E.__wristTwistR5)return;
 const share=Math.min(1,Math.max(0,window.__wristTwistShare??0.5));
 v.motion.reset();v.coach.updateMatrixWorld(true);
 const W=o=>o.getWorldQuaternion(new T.Quaternion()),P=o=>o.getWorldPosition(new T.Vector3());
 const axisL=(fa,h)=>P(h).sub(P(fa)).normalize().applyQuaternion(W(fa).invert());   // forearm->hand direction in forearm-local
 const rest={};for(const s of['left','right']){const fa=v.coach.getObjectByName(s+'Forearm'),h=v.coach.getObjectByName(s+'Hand');rest[s]={q:W(fa).invert().multiply(W(h))};}
 const stats=window.__wristTwistStats={max:{left:0,right:0},applied:{left:0,right:0}};
 let saved=[];
 const adjust=()=>{saved=[];v.coach.updateMatrixWorld(true);for(const s of['left','right']){const fa=v.coach.getObjectByName(s+'Forearm'),h=v.coach.getObjectByName(s+'Hand');if(!fa||!h)continue;
   const qf=W(fa),qh=W(h),a=axisL(fa,h),d=rest[s].q.clone().invert().multiply(qf.clone().invert().multiply(qh));
   let th=2*Math.atan2(d.x*a.x+d.y*a.y+d.z*a.z,d.w);if(th>Math.PI)th-=2*Math.PI;if(th<-Math.PI)th+=2*Math.PI;
   const phi=share*th;saved.push([fa,fa.quaternion.clone()],[h,h.quaternion.clone()]);
   fa.quaternion.multiply(new T.Quaternion().setFromAxisAngle(a,phi));fa.updateMatrixWorld(true);
   const qp=W(h.parent);h.quaternion.copy(qp.invert().multiply(qh));h.updateMatrixWorld(true);   // hand keeps its world orientation
   stats.max[s]=Math.max(stats.max[s],Math.abs(th)*180/Math.PI);stats.applied[s]=phi*180/Math.PI;}
  v.coach.updateMatrixWorld(true);};
 // Applied around each render only (the motion layer re-solves bones every update), then restored, so poses/QA stay untouched.
 const R=v.renderer,render=R.render.bind(R);R.render=function(scene,camera){adjust();try{return render(scene,camera);}finally{for(const [o,q] of saved)o.quaternion.copy(q);v.coach.updateMatrixWorld(true);saved=[];}};
 E.__wristTwistR5={share};
})();
