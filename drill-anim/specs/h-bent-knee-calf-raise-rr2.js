// rr2 (Hark review 2026-10-23): rr1 legs, pelvis solve, heel range, rhythm and camera unchanged. rr1's arms float
// forward palms-up at chest height, which reads as a reach rather than a calf raise; rr2 rests both hands on the
// hips (still no external hand support). Sparse keyframe check only, full GPU pending.
import rr1 from './h-bent-knee-calf-raise-rr1.js';
const s=structuredClone(rr1);s.id='h-bent-knee-calf-raise-rr2';
const handOnHip=side=>{const g=side==='left'?1:-1;
  return {mode:'free',frame:'hips',palmAt:[g*0.152,1.05,0.05],finger:[-g*0.05,-0.35,0.94],normal:[-g,0,0],poleUp:[g*0.6,1.15,-0.3],
    touch:{clear:0.0015,from:0.0,solve:'bisect',iters:16}};};
s.pose.base.hands={left:handOnHip('left'),right:handOnHip('right')};
export default s;
