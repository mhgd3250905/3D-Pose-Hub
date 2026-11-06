import * as T from '../../node_modules/three/build/three.module.js';
const [df=5,roll=0]=process.argv.slice(2).map(Number);
const RS=new T.Quaternion(-0.41628,0.56988,0.6449,0.42021).normalize();// solved right shin delta (vs bind) at mid (t=1.45)
const sUp=new T.Vector3(0.115-(-0.275),0.436-0.428,0.069-0.217).multiplyScalar(-1).normalize(); // ankle->knee
const bz=new T.Vector3(0,0,1),bx=new T.Vector3(1,0,0);
let q=RS.clone();
// dorsiflex: rotate about the foot's mediolateral axis so the toe moves toward the knee
const t0=bz.clone().applyQuaternion(q);const ax=new T.Vector3().crossVectors(t0,sUp).normalize();
q=new T.Quaternion().setFromAxisAngle(ax,df*Math.PI/180).multiply(q);
// shin-axis roll (toe-out +) optional
if(roll)q=new T.Quaternion().setFromAxisAngle(sUp,roll*Math.PI/180).multiply(q);
const w=Math.min(1,Math.abs(q.w))*Math.sign(q.w||1);const ang=2*Math.acos(w)*180/Math.PI,s=Math.sqrt(1-w*w)||1;
const axis=[q.x/s,q.y/s,q.z/s].map(v=>+(v*Math.sign(q.w||1)).toFixed(4));
console.log(JSON.stringify({rot:[[axis,+ang.toFixed(4)]],toe:bz.clone().applyQuaternion(q).toArray().map(v=>+v.toFixed(3)),sole:new T.Vector3(0,-1,0).applyQuaternion(q).toArray().map(v=>+v.toFixed(3))}));
