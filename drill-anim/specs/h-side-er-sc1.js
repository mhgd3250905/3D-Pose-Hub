// h-side-er-sc1: self-collision fix r1 (pose-fix r4, 2026-11-05) of h-side-er. Only the hand targets move: a measured additive
// offset (hand's own frame, metres) keeps palm/fingers on the surface of the armfix-r2 body instead of inside it. Motion,
// timing, legs, poles, hand orientation and camera are the source's. Offsets: tools/pose-fix-r1/hand-push.mjs push mode: out of the real solved surfaces + 4 mm,
// max offset per side (mm): {"right":83}.
// Self-collision d10 before (mm): {"leftFoot>rightFoot":12.3,"rightFoot>leftFoot":11.7,"rightForearm>torso":35,"torso>rightForearm":34.1}
// after (mm): {"leftFoot>rightFoot":12.3,"rightFoot>leftFoot":11.7}
import base from './h-side-er.js';
import { withPalmOffsets } from '../lib/palm-offset-sc1.mjs';
const OFF = {"right":[[0,-0.0776,0.0244,0.0178],[0.5,-0.0673,0.0182,0.0054],[1,-0.0029,0.0089,0.001],[1.5,0,0,0],[2,0,0,0],[2.5,0,0,0],[3,-0.0014,0.0337,0.0032],[3.5,-0.0712,0.024,0.0121],[4,-0.0776,0.0244,0.0178],[4.5,-0.0673,0.0182,0.0054],[5,-0.0029,0.0089,0.001],[5.5,0,0,0],[6,0,0,0],[6.5,0,0,0],[7,-0.0014,0.0337,0.0032],[7.5,-0.0712,0.024,0.0121]]};
export default withPalmOffsets(base, 'h-side-er-sc1', OFF);
