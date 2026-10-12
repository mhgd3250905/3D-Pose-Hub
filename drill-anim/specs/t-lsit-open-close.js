// PR #106 leg amplitude and opening rhythm, in the continuous support display
// approved by the user. Keep the original skin and 60 mm shoulder depression.
import { floorDrill, curve, qaStd, rotX } from './_thomas-pr106.mjs';

const T = 8;
const open = curve([[0, 0], [1.6, 0], [2.6, 1], [3.1, 1], [4.1, 0], [4.6, 0], [5.6, 1], [6.1, 1], [7.1, 0]], T);
const leg = o => ({ elev: 7.8 + 2 * o, spread: 2 + 22 * o, pf: 43 });
const DEG = Math.PI / 180, waist = 44.8, tilt = -8, handZ = -0.1;
// Snow bind-pose pelvis->waist and waist->shoulder-centre offsets. Author the
// whole visible trunk direction; the local upper segment retains its curvature.
const lower = [0, 0.14120757, -0.00431367], upper = [0, 0.32948433, -0.01006523];
const trunk = rotX(upper, waist).map((x, i) => x + lower[i]);
const pitch = tilt - Math.atan2(trunk[2], trunk[1]) / DEG;
const normal = [0, -Math.sin(tilt * DEG), Math.cos(tilt * DEG)];
const shoulderPlane = -0.0310199214128 * Math.sin(tilt * DEG) + handZ * Math.cos(tilt * DEG)
  + 0.06 * Math.sin((pitch + waist - tilt) * DEG);

const spec = floorDrill({
  id: 't-lsit-open-close', name: 'L撑开合', nameEn: 'L-sit Open-Close', T,
  // Fixed floor contacts. Sideways fingers keep the original hand skin clear
  // of both original leg paths while the wrist sits beneath the shoulder.
  hands: { left: [0.205, handZ, [1, 0]], right: [-0.205, handZ, [-1, 0]] },
  fn: t => ({ pitch, py: 0.134, pw: 0, shift: 0.06, elbow: 177.5,
    legs: { left: leg(open(t)), right: leg(open(t)) } }),
  solve: { vars: ['py', 'pz'], reg: { py: 0.01, pz: 0.01 }, iters: 80 },
  constraints: [{ type: 'joint', joint: 'rightShoulder', axis: normal, value: shoulderPlane, weight: 1 }],
  extra: () => ({ 'chest.waist.0.1': waist }),
  highlight: { groups: ['hip-flexors', 'adductors'], side: 'both', pulseAt: [2.85, 5.85], pulseWidth: 0.6, pulseBase: 0.3 },
  camera: { dir: [0.3, 0.25, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1, drift: 4, at: 2.85 },
  keyFrames: [1.5, 2.85, 4.4], qa: qaStd(),
});
export default { ...spec, alignBendPlanes: false, solveShoulders: true };
