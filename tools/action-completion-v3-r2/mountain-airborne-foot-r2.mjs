// Opt-in action correction; frozen engine, source r6 and geometry components stay intact.
// Must be installed explicitly by a candidate runner before sampling h-mountain-climber-r8.
export function followFootQuaternion(T, footWorld, shinWorld, restFootWorld, restShinWorld, u) {
  const x=Math.max(0,Math.min(1,u/.4)),w=x*x*(3-2*x);
  if(w===0)return footWorld.clone();
  const desired=shinWorld.clone().multiply(restShinWorld.clone().invert())
    .multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/18))
    .multiply(restFootWorld);
  return footWorld.clone().slerp(desired,w).normalize();
}
export async function install(page){
  await page.evaluate(source=>{window.__mountainFootFollowQuaternion=(0,eval)('('+source+')');},followFootQuaternion.toString());
  return page.evaluate(installMountainFootFollowInPage);
}
export function installMountainFootFollowInPage(){
  const T=window.__toonT,E=window.__drill,v=flareInspector.viewer;
  if(window.__mountainFootFollowR2)throw Error('Mountain foot follow already installed');
  if(!E?.applyAt||!v?.motion)throw Error('Pose engine must be ready');
  const saved=v.motion.capturePose();v.motion.reset();v.coach.updateMatrixWorld(true);
  const sides={};for(const side of ['left','right']){
    const foot=v.coach.getObjectByName(side+'Foot'),shin=v.coach.getObjectByName(side+'Shin');
    if(!foot||!shin)throw Error('Missing foot/shin bones');
    sides[side]={foot,shin,restFoot:foot.getWorldQuaternion(new T.Quaternion()),restShin:shin.getWorldQuaternion(new T.Quaternion())};
  }
  v.motion.applyPose(saved,{playback:false});v.coach.updateMatrixWorld(true);
  const original=E.applyAt,api={version:'0.1.0-r2',status:'candidate-pending-r8-gpu',last:null};
  function wrapped(spec,time,warm){
    const result=original.call(this,spec,time,warm);
    if(spec.id!=='h-mountain-climber-r8')return result;
    const report={time,sides:{}};
    for(const side of ['left','right']){
      const data=sides[side],u=result.params[side==='left'?'uL':'uR']??0;
      const before=data.foot.getWorldPosition(new T.Vector3()),old=data.foot.getWorldQuaternion(new T.Quaternion());
      const desired=window.__mountainFootFollowQuaternion(T,old,data.shin.getWorldQuaternion(new T.Quaternion()),data.restFoot,data.restShin,u);
      if(u>0){const parent=data.foot.parent.getWorldQuaternion(new T.Quaternion());data.foot.quaternion.copy(parent.invert().multiply(desired));v.coach.updateMatrixWorld(true);}
      const error=data.foot.getWorldPosition(new T.Vector3()).distanceTo(before)*1000;
      if(error>1e-5)throw Error('Airborne foot correction moved ankle');
      report.sides[side]={u,anklePositionDeltaMm:error,rotationDegrees:old.angleTo(desired)*180/Math.PI,supportUnchanged:u===0};
    }
    api.last=report;return result;
  }
  E.applyAt=wrapped;api.detach=()=>{if(E.applyAt!==wrapped)throw Error('Another applyAt wrapper depends on mountain foot follow');E.applyAt=original;delete window.__mountainFootFollowR2;};
  window.__mountainFootFollowR2=api;return {version:api.version,status:api.status};
}

