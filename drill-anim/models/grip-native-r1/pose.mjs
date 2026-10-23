// Fixed rod frame fitted to the native-r3 hand, not the legacy baked grip.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), fit=require('./fit.json');
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0), scale=(a,k)=>a.map(x=>x*k), sub=(a,b)=>a.map((x,i)=>x-b[i]);
const unit=a=>scale(a,1/Math.hypot(...a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function basis(a,p){a=unit(a);p=unit(sub(p,scale(a,dot(p,a))));return [a,p,cross(a,p)];}
const frames={left:[[.98253144,.05483374,.17783482],[.06068526,-.99777448,-.02762938]],right:[[-.98253144,.05483374,.17783482],[-.06068526,-.99777448,-.02762938]]};
export function nativeGripPose(side,bar,axis,palm){
 const mirror=v=>v.map((x,i)=>i===0&&side==='right'?-x:x);
 const local=basis(mirror(fit.axis),[0,-1,0]),world=basis(axis,scale(palm,-1));
 const rotate=v=>[0,1,2].map(i=>world.reduce((sum,e,k)=>sum+e[i]*dot(local[k],v),0));
 return {wrist:sub(bar,rotate(mirror(fit.center))),finger:rotate(frames[side][0]),normal:rotate(frames[side][1])};
}
