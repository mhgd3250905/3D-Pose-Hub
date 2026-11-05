// o-seated-ham-sc1: self-collision fix r1 (pose-fix r1, 2026-11-05) of o-seated-ham. Only the hand targets move: a measured additive
// offset (hand's own frame, metres) keeps palm/fingers on the surface of the armfix-r2 body instead of inside it. Motion,
// timing, legs, poles, hand orientation and camera are the source's. Offsets: tools/pose-fix-r1/hand-push.mjs push mode: out of the real solved surfaces + 4 mm,
// max offset per side (mm): {"left":26}.
// Self-collision d10 before (mm): {"leftHand>leftThigh":20.3}
// after (mm): {}
import base from './o-seated-ham.js';
import { withPalmOffsets } from '../lib/palm-offset-sc1.mjs';
const OFF = {"left":[[0,-0.0008,0.0256,0.0061],[0.5,-0.0008,0.0256,0.0061],[1,0.0001,0.0213,0.0055],[1.5,0,0,0],[2,0,0,0],[2.5,0,0,0],[3,0,0,0],[3.5,0,0,0],[4,0,0,0],[4.5,0,0,0],[5,0,0,0],[5.5,0,0,0],[6,0,0,0],[6.5,0.0003,0.0191,0.0052],[7,-0.0008,0.0256,0.0061],[7.5,-0.0008,0.0256,0.0061]]};
export default withPalmOffsets(base, 'o-seated-ham-sc1', OFF);
