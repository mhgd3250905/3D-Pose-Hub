// h-chair-step-up-r2-sc1: self-collision fix r1 (pose-fix r1, 2026-11-05) of h-chair-step-up-r2. Only the hand targets move: a measured additive
// offset (hand's own frame, metres) keeps palm/fingers on the surface of the armfix-r2 body instead of inside it. Motion,
// timing, legs, poles, hand orientation and camera are the source's. Offsets: tools/pose-fix-r1/hand-push.mjs push mode: out of the real solved surfaces + 4 mm,
// max offset per side (mm): {"left":28,"right":29}.
// Self-collision d10 before (mm): {"leftHand>torso":22.3,"rightHand>torso":23,"torso>rightThigh":19.4,"rightThigh>torso":17.7,"torso>leftThigh":19.2,"leftThigh>torso":18}
// after (mm): {"torso>rightThigh":19.4,"rightThigh>torso":17.7,"torso>leftThigh":19.2,"leftThigh>torso":18}
import base from './h-chair-step-up-r2.js';
import { withPalmOffsets } from '../lib/palm-offset-sc1.mjs';
const OFF = {"left":[[0,0.0281,-0.0023,-0.0029],[0.5,0.0281,-0.0023,-0.0029],[1,0.0281,-0.0023,-0.0029],[1.5,0.0281,-0.0023,-0.0029],[2,0.0281,-0.0023,-0.0029],[2.5,0.0281,-0.0023,-0.0029],[3,0.0281,-0.0023,-0.0029],[3.5,0.0281,-0.0023,-0.0029],[4,0.0281,-0.0023,-0.0029],[4.5,0.0281,-0.0023,-0.0029],[5,0.0281,-0.0023,-0.0029],[5.5,0.0281,-0.0023,-0.0029],[6,0.0281,-0.0023,-0.0029],[6.5,0.0281,-0.0023,-0.0029],[7,0.0281,-0.0023,-0.0029],[7.5,0.0281,-0.0023,-0.0029]],"right":[[0,-0.0287,-0.0013,-0.004],[0.5,-0.0287,-0.0013,-0.004],[1,-0.0287,-0.0013,-0.004],[1.5,-0.0287,-0.0013,-0.004],[2,-0.0287,-0.0013,-0.004],[2.5,-0.0287,-0.0013,-0.004],[3,-0.0287,-0.0013,-0.004],[3.5,-0.0287,-0.0013,-0.004],[4,-0.0287,-0.0013,-0.004],[4.5,-0.0287,-0.0013,-0.004],[5,-0.0287,-0.0013,-0.004],[5.5,-0.0287,-0.0013,-0.004],[6,-0.0287,-0.0013,-0.004],[6.5,-0.0287,-0.0013,-0.004],[7,-0.0287,-0.0013,-0.004],[7.5,-0.0287,-0.0013,-0.004]]};
export default withPalmOffsets(base, 'h-chair-step-up-r2-sc1', OFF);
