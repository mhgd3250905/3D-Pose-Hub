import previous from './h-db-overhead-triceps-extension-rr1.js';

// Fixed upper arm; one anatomical bend plane for wrist and hand orientation.
// Preserve the verified hand-local grip, dumbbell dimensions, trunk and feet.
const s = structuredClone(previous);
s.id = 'h-db-overhead-triceps-extension-rr2';
const add = (a,b) => a.map((x,i)=>x+b[i]);
const sub = (a,b) => a.map((x,i)=>x-b[i]);
const mul = (a,k) => a.map(x=>x*k);
const dot = (a,b) => a.reduce((n,x,i)=>n+x*b[i],0);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = a => mul(a,1/Math.hypot(...a));
const shoulder = [-0.1879072,1.3586918,-0.0083789];
const elbow = [-0.264561060094395,1.5995748628258817,0.03674077020647755];
const forearmLength = 0.22804635532676243;
const upper = unit(sub(elbow,shoulder));
const back = unit(sub([0,0,-1],mul(upper,dot([0,0,-1],upper))));
const oldForearm = unit(sub([-0.263,1.522,-0.1777],elbow));
const oldFinger = [0.2947,-0.6447,-0.7053];
const oldNormal = [0.1471,0.7599,-0.6331];
function rotateFromOld(v,to) {
  const axis = cross(oldForearm,to), c = dot(oldForearm,to);
  return add(add(v,cross(axis,v)),mul(cross(axis,cross(axis,v)),1/(1+c)));
}
// The pole is the fixed elbow itself, so IK chooses the exact intended hinge.
s.pose.base.hands.right.pole = elbow;
delete s.pose.base.hands.right.poleUp;
const oldExtension = s.timeline.tracks.extension;
s.timeline.tracks = Object.fromEntries(['extension',...Array.from({length:9},(_,i)=>'k'+i)].map(k=>[k,[]]));
for(let frame=0;frame<=240;frame++) {
  const time=frame/30;
  // The original cycle timing is retained; only its geometric trajectory changes.
  const extension=oldExtension[Math.min(frame,239)][1];
  const flex=(180-(70+95*extension))*Math.PI/180;
  const direction=add(mul(upper,Math.cos(flex)),mul(back,Math.sin(flex)));
  const wrist=add(elbow,mul(direction,forearmLength));
  const values=[...wrist,...rotateFromOld(oldFinger,direction),...rotateFromOld(oldNormal,direction)];
  s.timeline.tracks.extension.push([time,extension,'linear']);
  values.forEach((value,i)=>s.timeline.tracks['k'+i].push([time,value,'linear']));
}
export default s;
