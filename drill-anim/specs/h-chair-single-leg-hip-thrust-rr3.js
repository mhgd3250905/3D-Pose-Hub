// rr3 (Hark review 2026-10-23): rr2 motion, support, camera and timing unchanged. Only the hands change:
// rr2's chest-frame free hands float above the head while the trunk reclines; rr3 rests both hands on the hips
// like the w-chair-hip-thrust base (no hand support). Sparse keyframe check only, full GPU pending.
import rr2 from './h-chair-single-leg-hip-thrust-rr2.js';
const s=structuredClone(rr2);s.id='h-chair-single-leg-hip-thrust-rr3';
const handOnHip=side=>{const g=side==='left'?1:-1;
  return {mode:'free',frame:'hips',palmAt:[g*0.152,1.05,0.05],finger:[-g*0.05,-0.35,0.94],normal:[-g,0,0],poleUp:[g*0.6,1.15,-0.3],
    touch:{clear:0.0015,from:0.0,solve:'bisect',iters:16}};};
s.pose.base.hands={left:handOnHip('left'),right:handOnHip('right')};
export default s;
