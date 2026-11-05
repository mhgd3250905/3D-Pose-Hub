// h-lateral-step-lunge-sc1: self-collision fix r1 (pose-fix r1, 2026-11-05) of h-lateral-step-lunge. Only the hand targets move: a measured additive
// offset (hand's own frame, metres) keeps palm/fingers on the surface of the armfix-r2 body instead of inside it. Motion,
// timing, legs, poles, hand orientation and camera are the source's. Offsets: tools/pose-fix-r1/hand-push.mjs push mode: out of the real solved surfaces + 4 mm,
// max offset per side (mm): {"left":31,"right":31}.
// Self-collision d10 before (mm): {"leftHand>leftThigh":25.3,"rightHand>rightThigh":25.5}
// after (mm): {}
import base from './h-lateral-step-lunge.js';
import { withPalmOffsets } from '../lib/palm-offset-sc1.mjs';
const OFF = {"left":[[0,0,0,0],[0.5,0,0,0],[1,0,0,0],[1.5,0,0,0],[2,0.0116,0.0034,-0.0012],[2.5,0.0284,0.0007,-0.0132],[3,0.0276,0.0014,-0.012],[3.5,0,0,0],[4,0,0,0],[4.5,0,0,0],[5,0,0,0],[5.5,0,0,0],[6,0,0,0],[6.5,0,0,0],[7,0,0,0],[7.5,0,0,0],[8,0,0,0],[8.5,0,0,0],[9,0,0,0],[9.5,0,0,0]],"right":[[0,0,0,0],[0.5,0,0,0],[1,0,0,0],[1.5,0,0,0],[2,0,0,0],[2.5,0,0,0],[3,0,0,0],[3.5,0,0,0],[4,0,0,0],[4.5,0,0,0],[5,0,0,0],[5.5,0,0,0],[6,0,0,0],[6.5,0,0,0],[7,-0.0113,0.0035,-0.0009],[7.5,-0.0284,-0.0006,-0.0136],[8,-0.0278,0.0008,-0.012],[8.5,0,0,0],[9,0,0,0],[9.5,0,0,0]]};
export default withPalmOffsets(base, 'h-lateral-step-lunge-sc1', OFF);
