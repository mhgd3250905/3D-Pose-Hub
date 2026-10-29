import fs from 'node:fs';
const fit=JSON.parse(fs.readFileSync(new URL('./grip-fit-32mm.json',import.meta.url),'utf8'));
export const POSE='armfix-power-32mm';
export async function installGrip(page){
 return page.evaluate(({fit,pose})=>{
  const V=window.__v2p,P=window.__props,T=window.__toonT,v=flareInspector.viewer;
  if(!window.__armfixR1||!V?.hands?.on||window.__armfixGrip)throw Error('Grip requires fresh armfix native hand');
  if(fit.handScale!==1||fit.radius!==.016||fit.worstPenetrationM>1e-5||fit.selfIntersection.left.pairs)throw Error('Unqualified grip fit');
  if(V.poses[pose])throw Error('Grip pose already exists');V.poses[pose]=structuredClone(fit.targets);
  const previous=P.place;
  P.place=function(o){const s=o.userData.spec;
   if(!s?.armfixGrip)return previous.call(this,o);
   if(s.armfixGrip!==pose||s.type!=='dumbbell'||!['leftHand','rightHand'].includes(s.attach))throw Error('Unsupported explicit grip prop');
   const side=s.attach.startsWith('left')?'left':'right',mirror=x=>x.map((n,i)=>side==='right'&&i===0?-n:n),b=v.coach.getObjectByName(s.attach),q=b.getWorldQuaternion(new T.Quaternion());
   const axis=new T.Vector3(...mirror(fit.axis)).normalize(),rot=new T.Quaternion().setFromUnitVectors(new T.Vector3(1,0,0),axis);
   o.position.copy(new T.Vector3(...mirror(fit.center)).applyQuaternion(q).add(b.getWorldPosition(new T.Vector3())));o.quaternion.copy(q).multiply(rot);o.updateMatrixWorld(true);
  };
  window.__armfixGrip={pose,fit,remove(){if(P.place!==this.place)throw Error('Grip callback replaced');P.place=previous;delete V.poses[pose];delete window.__armfixGrip;}};window.__armfixGrip.place=P.place;
  return {pose,radius:fit.radius,sourceHandScale:1};
 },{fit,pose:POSE});
}
export function prepareGripSpec(source){
 const props=source.props.map(p=>p.type==='dumbbell'&&['leftHand','rightHand'].includes(p.attach)?{...p,armfixGrip:POSE}:structuredClone(p));
 const sides=props.filter(p=>p.armfixGrip).map(p=>p.attach.startsWith('left')?'left':'right');if(!sides.length)throw Error('No supported dumbbell');
 return {...structuredClone(source),runtimeModel:{profile:'training-human-v3-armfix',version:'0.1.0-r1'},props,v2plus:{...source.v2plus,handPose:Object.fromEntries(sides.map(s=>[s,POSE]))}};
}
