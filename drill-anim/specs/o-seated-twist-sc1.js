// o-seated-twist-sc1: self-collision fix r1 (pose-fix r1, 2026-11-05) of o-seated-twist. Only the hand targets move: a measured additive
// offset (hand's own frame, metres) keeps palm/fingers on the surface of the armfix-r2 body instead of inside it. Motion,
// timing, legs, poles, hand orientation and camera are the source's. Offsets: tools/pose-fix-r1/hand-push.mjs push mode: out of the real solved surfaces + 4 mm,
// max offset per side (mm): {"left":39,"right":39}.
// Self-collision d10 before (mm): {"leftHand>leftThigh":33.3,"rightHand>rightThigh":33.3}
// after (mm): {}
import base from './o-seated-twist.js';
import { withPalmOffsets } from '../lib/palm-offset-sc1.mjs';
const OFF = {"left":[[0,-0.0188,0.0341,0.0051],[0.5,-0.0188,0.0341,0.0051],[1,-0.002,0.0158,0.0025],[1.5,-0.0082,0.0137,0.0024],[2,0,0,0],[2.5,0.006,0.0085,0.0016],[3,0.0004,0.0118,0.0029],[3.5,0,0,0],[4,0,0,0],[4.5,-0.0014,0.0098,0.0025],[5,0.0049,0.0112,0.002],[5.5,0.0057,0.0071,0.0015],[6,0,0,0],[6.5,0.0043,0.0148,0.003],[7,-0.0188,0.0341,0.0051],[7.5,-0.0188,0.0341,0.0051]],"right":[[0,0.0186,0.0342,0.0056],[0.5,0.0186,0.0342,0.0056],[1,0,0,0],[1.5,0,0,0],[2,0,0,0],[2.5,0,0,0],[3,0,0,0],[3.5,0,0,0],[4,0,0,0],[4.5,0,0,0],[5,0,0,0],[5.5,0,0,0],[6,0,0,0],[6.5,0,0,0],[7,0.0186,0.0342,0.0056],[7.5,0.0186,0.0342,0.0056]]};
export default withPalmOffsets(base, 'o-seated-twist-sc1', OFF);
