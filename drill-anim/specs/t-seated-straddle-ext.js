import { floorDrill, curve, qaStd, dirW, reach } from './_thomas.mjs';
// t-seated-straddle-ext 坐姿分腿屈伸 (seated straddle extension). Head up (+Y), body faces +Z, body left = +X.
// Sitting, hands flat on the floor beside / slightly behind the hips, trunk leaning back a little; the feet stay off the floor
// the whole time: pull both knees in (tuck), then kick both legs out straight into a wide straddle, pull back in.
// 3 even reps per 8 s loop after a short setup... kept continuous: 4 reps of 2 s (in 0.8, out 0.8, holds 0.2).
const T = 8, ext = t => curve([[0, 0], [0.1, 0], [0.5, 1], [0.6, 1], [1.0, 0]], 1)(((t % 2) / 2));
const tuck = [0.14, 0.10, 0.50];                      // hip -> ankle (world, left side; mirrored) for the knees-in position
const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const leg = (sg, e) => { const out = dirW(1, 14, 40).map(v => v * reach(179)); const r = mix(tuck, out, e); r[0] *= sg; return { rel: r, pf: 25 + 15 * e }; };
export default floorDrill({
  id: 't-seated-straddle-ext', name: '坐姿分腿屈伸', nameEn: 'Seated Straddle Extension', T,
  hands: { left: [0.24, -0.08, [0.2, 1]], right: [-0.24, -0.08, [-0.2, 1]] },
  fn: t => { const e = ext(t); return { pitch: -20 - 4 * e, py: 0.134, pw: 3, elbow: 172, legs: { left: leg(1, e), right: leg(-1, e) } }; },
  tags: { ext },
  highlight: { groups: ['abs', 'hip-flexors'], side: 'both', pulseTrack: 'ext', pulseBase: 0.3 },
  camera: { dir: [0.15, 0.25, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 2, driftPeriod: 8, at: 1.1 },
  keyFrames: [0.1, 0.6, 1.1],
  qa: qaStd({ straightLegs: [{ j: 'knee.right', min: 176, when: 'params.ext>0.999' }, { j: 'knee.left', min: 176, when: 'params.ext>0.999' }] }),
});
