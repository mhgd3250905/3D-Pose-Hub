// Quaternion path evidence. Endpoint equivalence cannot certify a safe motion path.
const RAD=180/Math.PI;
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const norm=q=>{const n=Math.hypot(...q);if(!Number.isFinite(n)||n<1e-10)throw Error('Invalid sampled quaternion');return q.map(x=>x/n);};
const multiply=(a,b)=>[
  a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
  a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
  a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
  a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const inverse=q=>[-q[0],-q[1],-q[2],q[3]];
const angle=q=>2*Math.atan2(Math.hypot(q[0],q[1],q[2]),Math.max(0,q[3]))*RAD;
export function analyzeQuaternionPath(rows){
  const samples=[],integrated=[0,0,0];let previous=null,total=0,max=0;
  for(const row of rows){
    let q=norm(row.quaternion);if(previous&&dot(previous,q)<0)q=q.map(x=>-x);
    let stepDeg=0,vector=[0,0,0];
    if(previous){let delta=norm(multiply(inverse(previous),q));if(delta[3]<0)delta=delta.map(x=>-x);stepDeg=angle(delta);const n=Math.hypot(...delta.slice(0,3));vector=n<1e-10?[0,0,0]:delta.slice(0,3).map(x=>x/n*stepDeg);total+=stepDeg;max=Math.max(max,stepDeg);for(let i=0;i<3;i++)integrated[i]+=vector[i];}
    samples.push({frame:row.frame,time:row.time,continuousQuaternion:q,stepShortestDeg:stepDeg,deltaRotationVectorDeg:vector});previous=q;
  }
  let endpoint=null;
  if(samples.length){let delta=norm(multiply(inverse(samples[0].continuousQuaternion),samples.at(-1).continuousQuaternion));if(delta[3]<0)delta=delta.map(x=>-x);endpoint=angle(delta);}
  return {sampleCount:samples.length,totalAngularTravelDeg:total,maxAdjacentShortestDeg:max,endpointShortestDeg:endpoint,integratedLocalDeltaVectorDeg:integrated,samples};
}
export function rotationPathSummary(metrics){
  const tracks={},missing=[];
  for(const side of ['left','right'])for(const channel of ['upperArm.localQuaternion','forearmRelativeUpperArm','hand.localQuaternion','forearm.localQuaternion','foot.localQuaternion','lowerLeg.localQuaternion','handRelativeForearm','footRelativeLowerLeg']){
    const rows=[];
    for(const m of metrics){let value=m.rotations?.[side];for(const key of channel.split('.'))value=value?.[key];if(Array.isArray(value)&&value.length===4)rows.push({frame:m.frame,time:m.time,quaternion:value});}
    const key=side+'.'+channel;if(rows.length!==metrics.length)missing.push({channel:key,found:rows.length,expected:metrics.length});
    tracks[key]=analyzeQuaternionPath(rows);
  }
  return {format:'pose-hub-rotation-path@2',sampling:'every solved frame including separate loop endpoint',tracks,missing,
    limits:['Shortest adjacent quaternion deltas retain sampled path travel, not just angles modulo 360.','A turn greater than 180 degrees between samples is ambiguous; review interpolation and increase sampling when needed.','Integrated local delta vectors are path diagnostics, not a universal anatomical twist decomposition.','Angle magnitude or endpoint equivalence alone does not prove contact, distortion, or visual acceptance.']};
}
