// hands-native r6 page runtime (pose-fix r1, 2026-11-05): hands-native r5 wrist-twist with two changes, everything else identical.
//  1) theta (hand roll about the forearm axis) is kept continuous frame to frame instead of being wrapped to [-180,180]:
//     r5 snapped the forearm half a turn in one frame whenever theta crossed 180 deg (0.5 x 360).
//  2) the part moved onto the forearm bone is capped: |share*theta| <= capDeg (default 40), so the elbow skin never
//     carries a non-physiological rigid roll. Frames must be rendered in time order (production already does).
// Opt-in only: a recipe sets "wristTwistRuntime": {"version":"r6","capDeg":40}; recipe-scene.mjs removes the r5 render
// wrapper and installs this one. r5 stays frozen and is still the default for every other recipe.
(function(){
 const E=window.__drill,T=window.__toonT,v=flareInspector.viewer;if(!E||E.__wristTwistR6)return;
 const share=Math.min(1,Math.max(0,window.__wristTwistShare??0.5));
 v.motion.reset();v.coach.updateMatrixWorld(true);
 const W=o=>o.getWorldQuaternion(new T.Quaternion()),P=o=>o.getWorldPosition(new T.Vector3());
 const axisL=(fa,h)=>P(h).sub(P(fa)).normalize().applyQuaternion(W(fa).invert());   // forearm->hand direction in forearm-local
 const rest={};for(const s of['left','right']){const fa=v.coach.getObjectByName(s+'Forearm'),h=v.coach.getObjectByName(s+'Hand');rest[s]={q:W(fa).invert().multiply(W(h))};}
 const stats=window.__wristTwistStats={max:{left:0,right:0},applied:{left:0,right:0},capped:{left:0,right:0}};const last={};const CAP=(window.__wristTwistCapDeg??40)*Math.PI/180;
 E.__wristTwistR6Reset=()=>{for(const k of Object.keys(last))delete last[k];};
 let saved=[];
 const adjust=()=>{saved=[];v.coach.updateMatrixWorld(true);for(const s of['left','right']){const fa=v.coach.getObjectByName(s+'Forearm'),h=v.coach.getObjectByName(s+'Hand');if(!fa||!h)continue;
   const qf=W(fa),qh=W(h),a=axisL(fa,h),d=rest[s].q.clone().invert().multiply(qf.clone().invert().multiply(qh));
   let th=2*Math.atan2(d.x*a.x+d.y*a.y+d.z*a.z,d.w);if(th>Math.PI)th-=2*Math.PI;if(th<-Math.PI)th+=2*Math.PI;
   if(last[s]!==undefined){while(th-last[s]>Math.PI)th-=2*Math.PI;while(th-last[s]<-Math.PI)th+=2*Math.PI;}last[s]=th;
   const raw=share*th,phi=Math.max(-CAP,Math.min(CAP,raw));if(phi!==raw)stats.capped[s]++;saved.push([fa,fa.quaternion.clone()],[h,h.quaternion.clone()]);
   fa.quaternion.multiply(new T.Quaternion().setFromAxisAngle(a,phi));fa.updateMatrixWorld(true);
   const qp=W(h.parent);h.quaternion.copy(qp.invert().multiply(qh));h.updateMatrixWorld(true);   // hand keeps its world orientation
   stats.max[s]=Math.max(stats.max[s],Math.abs(th)*180/Math.PI);stats.applied[s]=phi*180/Math.PI;}
  v.coach.updateMatrixWorld(true);};
 // Applied around each render only (the motion layer re-solves bones every update), then restored, so poses/QA stay untouched.
 const R=v.renderer,render=R.render.bind(R);R.render=function(scene,camera){adjust();try{return render(scene,camera);}finally{for(const [o,q] of saved)o.quaternion.copy(q);v.coach.updateMatrixWorld(true);saved=[];}};
 E.__wristTwistR6={share,capDeg:CAP*180/Math.PI};
})();
