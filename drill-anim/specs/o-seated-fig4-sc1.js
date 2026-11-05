// o-seated-fig4-sc1: self-collision fix r1 (pose-fix r1, 2026-11-05) of o-seated-fig4. Only the hand targets move: a measured additive
// offset (hand's own frame, metres) keeps palm/fingers on the surface of the armfix-r2 body instead of inside it. Motion,
// timing, legs, poles, hand orientation and camera are the source's. Offsets: tools/pose-fix-r1/hand-push.mjs push mode: out of the real solved surfaces + 4 mm,
// max offset per side (mm): {"right":118}.
// Self-collision d10 before (mm): {"rightFoot>leftThigh":44.9,"rightFoot>leftShin":33.6,"leftThigh>rightFoot":15.7,"leftHand>rightShin":12.6,"leftHand>rightFoot":12.6,"rightHand>rightShin":48.7,"rightHand>rightThigh":29}
// after (mm): {"rightFoot>leftThigh":44.9,"rightFoot>leftShin":33.6,"leftThigh>rightFoot":15.7,"leftHand>rightShin":12.6,"leftHand>rightFoot":12.6}
import base from './o-seated-fig4.js';
import { withPalmOffsets } from '../lib/palm-offset-sc1.mjs';
const OFF = {"right":[[0,-0.0306,0.0516,-0.0295],[0.5,-0.0306,0.0516,-0.0295],[1,-0.0307,0.0535,-0.0354],[1.5,-0.0617,0.0531,-0.0486],[2,-0.082,0.0509,-0.0187],[2.5,-0.0431,0.058,-0.0155],[3,-0.0474,0.0597,0.0092],[3.5,-0.0935,0.0233,0.0686],[4,-0.0659,0.0607,-0.0136],[4.5,-0.0769,0.0096,0.0711],[5,-0.0643,0.0485,0.0094],[5.5,-0.0633,0.0652,-0.0167],[6,-0.0558,0.0532,-0.0418],[6.5,-0.0313,0.0545,-0.0369],[7,-0.0306,0.0516,-0.0295],[7.5,-0.0306,0.0516,-0.0295]]};
export default withPalmOffsets(base, 'o-seated-fig4-sc1', OFF);
