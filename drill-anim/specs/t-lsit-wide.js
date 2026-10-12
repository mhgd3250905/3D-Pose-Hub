// PR #106 wide-leg amplitude and gentle breathing, shown in continuous support.
// The original human skin, camera, leg roll and 60 mm shoulder depression stay.
import { floorDrill, qaStd, rotX } from './_thomas-pr106.mjs';

const T = 8;
// Three complete original 2.4 s breaths, then a quiet hold to join the loop.
const br = t => t < 7.2 ? 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 2.4) : 0;
const leg = b => ({ elev: 7.8 + b, spread: 34, pf: 43 });
const DEG = Math.PI / 180, waist = 44.8, tilt = -8, handZ = -0.1;
// Bind-pose offsets from the unchanged Snow asset. Align shoulder->wrist to
// pelvis->shoulder-centre in YZ, while allowing the original curved upper torso.
const lower = [0, 0.14120757, -0.00431367], upper = [0, 0.32948433, -0.01006523];
const trunk = rotX(upper, waist).map((x, i) => x + lower[i]);
const pitch = tilt - Math.atan2(trunk[2], trunk[1]) / DEG;
const normal = [0, -Math.sin(tilt * DEG), Math.cos(tilt * DEG)];
const shoulderPlane = -0.0310199214128 * Math.sin(tilt * DEG) + handZ * Math.cos(tilt * DEG)
  + 0.06 * Math.sin((pitch + waist - tilt) * DEG);

const spec = floorDrill({
  id: 't-lsit-wide', name: '宽腿L撑', nameEn: 'Wide-leg L-sit', T,
  hands: { left: [0.205, handZ, [1, 0]], right: [-0.205, handZ, [-1, 0]] },
  fn: t => ({ pitch, py: 0.134, pw: 0, shift: 0.06, elbow: 177.5,
    legs: { left: leg(br(t)), right: leg(br(t)) } }),
  solve: { vars: ['py', 'pz'], reg: { py: 0.01, pz: 0.01 }, iters: 80 },
  constraints: [{ type: 'joint', joint: 'rightShoulder', axis: normal, value: shoulderPlane, weight: 1 }],
  extra: () => ({ 'chest.waist.0.1': waist }),
  highlight: { groups: ['hip-flexors', 'abs'], panels: ['quadRect'], side: 'both', pulseAt: [2.5, 5.0], pulseWidth: 1.2, pulseBase: 0.3 },
  camera: { dir: [0.3, 0.2, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1, drift: 4, at: 3.5 },
  keyFrames: [0.3, 1.2, 3.5], qa: qaStd(),
});
export default { ...spec, alignBendPlanes: false, alignClavicles: true, solveShoulders: true };
