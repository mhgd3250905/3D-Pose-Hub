// h-bilateral-upper-back-hug-rr3-et3-sc1 (same hand offsets as et2-sc1, base et3): self-collision fix r1 (pose-fix r1, 2026-11-05) of h-bilateral-upper-back-hug-rr3-et2. Only the hand targets move: a measured additive
// offset (hand's own frame, metres) keeps palm/fingers on the surface of the armfix-r2 body instead of inside it. Motion,
// timing, legs, poles, hand orientation and camera are the source's. Offsets: tools/pose-fix-r1/hand-push.mjs push mode: out of the real solved surfaces + 4 mm,
// max offset per side (mm): {"right":31}.
// Self-collision d10 before (mm): {"torso>rightUpperArm":35.1,"rightHand>leftUpperArm":25.4,"torso>leftUpperArm":14.6}
// after (mm): {"torso>rightUpperArm":36.7,"torso>leftUpperArm":14.6}
import base from './h-bilateral-upper-back-hug-rr3-et3.js';
import { withPalmOffsets } from '../lib/palm-offset-sc1.mjs';
const OFF = {"right":[[0,0.0199,-0.0172,0.0168],[0.3,0.0199,-0.0172,0.0168],[0.6,0.0199,-0.0172,0.0168],[0.9,0.0199,-0.0174,0.0166],[1.2,0.0201,-0.0176,0.0163],[1.5,0.0198,-0.0184,0.0158],[1.8,0.02,-0.0187,0.0154],[2.1,0.0204,-0.0185,0.0151],[2.4,0.0203,-0.0187,0.0149],[2.7,0.0203,-0.0187,0.0149],[3,0.0203,-0.0187,0.0149],[3.3,0.0203,-0.0187,0.0149],[3.6,0.0203,-0.0187,0.0149],[3.9,0.0203,-0.0187,0.0149],[4.2,0.0203,-0.0187,0.0149],[4.5,0.0203,-0.0187,0.0149],[4.8,0.0203,-0.0187,0.0149],[5.1,0.0203,-0.0187,0.0149],[5.4,0.0203,-0.0187,0.0149],[5.7,0.0203,-0.0187,0.015],[6,0.0202,-0.0187,0.0152],[6.3,0.02,-0.0185,0.0156],[6.6,0.0198,-0.0182,0.016],[6.9,0.0201,-0.0174,0.0164],[7.2,0.0199,-0.0173,0.0167],[7.5,0.0199,-0.0172,0.0168],[7.8,0.0199,-0.0172,0.0168]]};
export default withPalmOffsets(base, 'h-bilateral-upper-back-hug-rr3-et3-sc1', OFF);
