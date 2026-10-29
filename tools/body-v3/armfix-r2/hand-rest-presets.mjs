// Relaxed and assisting hands share the same native topology and wrist.
// Assist is a fixed light touch: extended index/middle, progressively softer ring/pinky.
export const REST_POSES=Object.freeze({relaxed:'relaxed',assist:'assist'});
export const ASSIST_BEND_FRACTIONS=Object.freeze({thumb:.6,index:.2,middle:.3,ring:.5,pinky:.7});
export function makeRestPresets(rig){
 const keys=['thumb','index','middle','ring','pinky'].flatMap(f=>[1,2,3].map(j=>f+j)),relaxed=rig?.poses?.relaxed;
 if(!relaxed||Object.keys(relaxed).sort().join('|')!==keys.slice().sort().join('|'))throw Error('hand-rest: complete native relaxed pose required');
 const assist={};
 for(const key of keys){const q=relaxed[key];if(!Array.isArray(q)||q.length!==4||q.some(x=>!Number.isFinite(x))||Math.abs(q.reduce((n,x)=>n+x*x,0)-1)>1e-6)throw Error('hand-rest: malformed quaternion');
  // Fixed identity-to-relaxed slerp in the rig coordinate frame, shortest arc.
  const sign=q[3]<0?-1:1,a=q.map(x=>x*sign),angle=Math.acos(Math.max(-1,Math.min(1,a[3]))),fraction=ASSIST_BEND_FRACTIONS[key.replace(/[123]$/,'')];
  const scale=angle<1e-10?fraction:Math.sin(angle*fraction)/Math.sin(angle);assist[key]=[a[0]*scale,a[1]*scale,a[2]*scale,Math.cos(angle*fraction)];
 }
 return {relaxed:structuredClone(relaxed),assist};
}
export async function installRestPresets(page,rig){
 const poses=makeRestPresets(rig);
 return page.evaluate(poses=>{
  const V=window.__v2p;if(!V?.hands?.on||window.__fixedRestPresets)throw Error('hand-rest: fresh native hands required');
  const prior=Object.fromEntries(Object.keys(poses).map(k=>[k,{own:Object.hasOwn(V.poses,k),value:V.poses[k]}]));
  for(const [key,value]of Object.entries(poses))V.poses[key]=value;
  window.__fixedRestPresets={poses,remove(){for(const key of Object.keys(poses))if(V.poses[key]!==poses[key])throw Error('hand-rest: registry conflict');for(const key of Object.keys(poses)){if(prior[key].own)V.poses[key]=prior[key].value;else delete V.poses[key];}delete window.__fixedRestPresets;return {removed:true};}};
  return {names:Object.keys(poses),assist:'fixed light touch with extended index/middle; action supplies wrist placement; appearance acceptance pending'};
 },poses);
}
