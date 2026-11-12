// h-open-book-r9: open-book arm fix r1 (2026-11-08) of h-open-book-r8-gc1.js. Only the top (right) arm and the chest turn change;
// legs, pelvis, pillow, 8 s timing, keys, highlight and camera are r8-gc1's; bottom arm keeps r8's floor solve.
// Review of r8 (measured, production chain): the top arm already swept in the chest transverse plane (rest-frame (sin a,0,cos a)
// is perpendicular to the trunk), but it ended floating at shoulder height (wrist 0.38 m above the floor) with the elbow bent
// 23 deg, 57 deg horizontal abduction behind the chest frontal plane and only 32 deg of chest turn, and at the start the top hand
// hung 11 cm above the bottom arm instead of resting on it - the stretch read as the arm being pulled back, not the chest opening.
// r9: (1) chest turn 32 -> 55 deg, split R1 = 15 deg about the trunk's own (side-bent) axis + R2 = 40 deg about world X (r8's axis):
// pure world-X lowers the head into the pillow, pure trunk-axis lifts the bottom shoulder off the mat; this split keeps the head
// on the pillow (gap 0.2-6.9 mm) with the torso still on the mat (lowest skin 12.5 mm). (2) top arm straight (reach 0.4835 m,
// elbow 8.4 deg), at shoulder height (~4 deg toward the head in the chest frame), sweeping in the chest transverse plane from
// A0 = 42 deg (forward and down, palm resting on the bottom forearm, wrist extended 28 deg so the fingers lie level) through
// straight up to A1 = -150 deg (59.5 deg horizontal abduction behind the chest frontal plane); with the chest turn the hand ends
// ~5 cm above the floor behind. Palm normal turns with the arm in that plane (no forearm twist): down on the forearm at the
// start, toward the ceiling at the hold. Head is rigid with the chest in this rig, so it turns with the chest toward the hand.
// Bottom support wrist distance is capped at 99.5 % of the arm reach (it slides back <= 2 mm when the shoulder lifts).
import base from './h-open-book-r8-gc1.js';
import { REST, UA, FA, leg, rot, restToWorld, footRotW, r4 } from './_home-armfix-r1.mjs';
import { build, keys } from './_home-armfix-r1.mjs';
export function make({ R1 = 15, R2 = 40, A0 = 42, WX = 28, A1 = -150, ELEV = 4, REACH = 0.4835, RETR = 0, pole = [-0.2, 1.8, 0.05], RIGHT = null } = {}) {
const DUR = 8, TIP = 0;
const P0 = [-0.336029828141, 0.16916500072453428, -0.001954201688];
const hips = { up: [1, 0, 0], front: [0, 0, 1], rot: [[[0, 0, 1], TIP]] };
const p = keys([[0, 0], [0.4, 0], [3.4, 1], [4.6, 1], [7.6, 0]], DUR);
const FL = leg('left', 88, 92, [[[0, 1, 0], 2.4]]), FR = leg('right', 88, 92, [[[0, 1, 0], 9.4]]);
const poleOf = (H, A, K) => { const m = A.map((x, i) => (x + H[i]) / 2); return r4(K.map((x, i) => x + 2 * (x - m[i]))); };
const FROT = [[[1, 0, 0], 12]];
const WAIST = [0, 1.08554168, 0.0040458], SB = t => 16.77445327758789 + (-1.6117477416992188)*p(t) + 4.0764923095703125*p(t)**2;
// chest turn split: R1 about X before the side bend (about the trunk's own axis: head stays up, bottom shoulder lifts) and R2
// about world X after it (r8's turn: bottom shoulder stays down, head drops toward the pillow)
const CH = [[[1, 0, 0], t => -R1 * p(t)], [[0, 0, 1], SB], [[1, 0, 0], t => -R2 * p(t)]];
const SHR = [0, 0, -RETR];   // top scapula retracts (rest -Z) with the opening
const SR = REST.shoulder('right'), eOf = t => (typeof ELEV === 'function' ? ELEV(p(t)) : ELEV) * Math.PI / 180;   // ELEV may be a function of the opening p (r10)
const ang = t => A0 + (A1 - A0) * p(t);
const dR = t => { const a = ang(t) * Math.PI / 180, e = eOf(t); return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; };
const fa = t => (ang(t) - WX * (1 - p(t))) * Math.PI / 180;   // wrist a little extended at the start (fingers level), as r8
const fR = t => { const a = fa(t), e = eOf(t); return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; };
const nR = t => { const a = fa(t); return [Math.cos(a), 0, -Math.sin(a)]; };
const bottomShoulder=t=>{const w=restToWorld(hips,WAIST.map((x,k)=>x-REST.pelvis[k]));let d=restToWorld(hips,REST.shoulder('left').map((x,k)=>x-WAIST[k]));d=rot(rot(rot(d,[1,0,0],-R1*p(t)),[0,0,1],SB(t)),[1,0,0],-R2*p(t));return P0.map((x,k)=>x+w[k]+d[k]);};
// r8's support-arm solve; the forward wrist distance is capped at 99.5 % of the reach when the chest turn lifts the shoulder
const lowerArm=t=>{const S=bottomShoulder(t),ey=.036,wy=.0395,r1=Math.sqrt(UA*UA-(S[1]-ey)**2),r2=Math.sqrt(FA*FA-(wy-ey)**2),d=Math.min(.465,.995*(r1+r2)),z=(r1*r1-r2*r2+d*d)/(2*d),x2=r1*r1-z*z;if(x2<0)throw Error('Open-book support arm cannot reach');return{wrist:[S[0],wy,S[2]+d],elbow:[S[0]-Math.sqrt(x2),ey,S[2]+z]};};
const P = build(DUR, {
  pelvis: t => [P0[0], P0[1], P0[2]],
  hips,
  chest: { waist: CH },
  shoulders: { right: t => SHR.map(x => x * p(t)) },
  hands: {
    left: { mode: 'free', frame: 'world', wrist: t => r4(lowerArm(t).wrist), finger: [0,0,1], normal: [0,1,0], pole: t => r4(lowerArm(t).elbow), relax: 0.6 },
    right: RIGHT ? RIGHT({ p, SR, eOf, ang, WX }) : { mode: 'free', frame: 'chest', wrist: t => { const d = dR(t), q = p(t); return r4(SR.map((x, k) => x + SHR[k] * q + d[k] * REACH)); },
      finger: t => r4(fR(t)), normal: t => r4(nR(t)), poleUp: pole, relax: 0.6 },   // RIGHT (r11): optional top-hand override, default = r9
  },
  feet: {
    left: { mode: 'free', frame: 'hips', ankle: FL.ankle, rot: footRotW(hips, [[[0,1,0],2.4], ...FROT]), poleLow: poleOf(FL.hip, FL.ankle, FL.knee) },
    right: { mode: 'free', frame: 'hips', ankle: FR.ankle, rot: footRotW(hips, [[[0, 1, 0], 9.4], ...FROT]), poleLow: poleOf(FR.hip, FR.ankle, FR.knee) },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { open: p });
return { ...base, id: 'h-open-book-r9', timeline: { ...base.timeline, duration: DUR, tracks: P.tracks }, pose: { base: P.base, deltas: P.deltas },
  qa: { ...base.qa, straight: [{ j: 'elbow.right', min: 170 }] },
  reviewed: false, releaseEligible: false, qaStatus: 'candidate-awaiting-gpu-and-user-review' };
}
export default make();
