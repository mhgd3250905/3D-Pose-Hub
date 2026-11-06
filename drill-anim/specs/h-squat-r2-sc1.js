// h-squat-r2-sc1: self-collision fix r1 (pose-fix r1, 2026-11-05) of h-squat-r2. Only the hand targets move: a measured additive
// offset (hand's own frame, metres) keeps palm/fingers on the surface of the armfix-r2 body instead of inside it. Motion,
// timing, legs, poles, hand orientation and camera are the source's. Offsets: tools/pose-fix-r1/hand-push.mjs push mode: out of the real solved surfaces + 4 mm,
// max offset per side (mm): {"left":29,"right":28}.
// Self-collision d10 before (mm): {"leftHand>leftThigh":22.9,"rightHand>rightThigh":22.5}
// after (mm): {}
import base from './h-squat-r2.js';
import { withPalmOffsets } from '../lib/palm-offset-sc1.mjs';
const OFF = {"left":[[0,0.0287,0.0018,0.0024],[0.5,0.028,0.0018,0.004],[1,0,0,0],[1.5,0,0,0],[2,0,0,0],[2.5,0,0,0],[3,0,0,0],[3.5,0.0197,0.0018,0.0082],[4,0.0287,0.0018,0.0024],[4.5,0.028,0.0018,0.004],[5,0,0,0],[5.5,0,0,0],[6,0,0,0],[6.5,0,0,0],[7,0,0,0],[7.5,0.0197,0.0018,0.0082]],"right":[[0,-0.0283,0.0014,0.0026],[0.5,-0.0276,0.002,0.0041],[1,0,0,0],[1.5,0,0,0],[2,0,0,0],[2.5,0,0,0],[3,0,0,0],[3.5,-0.0197,0.002,0.0078],[4,-0.0283,0.0014,0.0026],[4.5,-0.0276,0.002,0.0041],[5,0,0,0],[5.5,0,0,0],[6,0,0,0],[6.5,0,0,0],[7,0,0,0],[7.5,-0.0197,0.002,0.0078]]};
export default withPalmOffsets(base, 'h-squat-r2-sc1', OFF);
