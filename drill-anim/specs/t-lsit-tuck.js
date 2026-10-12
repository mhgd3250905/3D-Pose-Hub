import { floorDrill, curve, qaStd, dirW, reach } from './_thomas.mjs';
// t-lsit-tuck L 撑↔团身 (L-sit to tuck). Head up (+Y), body faces +Z, body left = +X.
// Press up into a tuck support (knees bent and pulled in, feet hovering just off the floor), extend both legs straight into an
// L-sit, tuck back (2 reps), sit down. The pelvis tips back (posterior tilt) in the tuck. Loop 8 s.
const T = 8, up = curve([[0, 0], [0.6, 0], [1.4, 1], [7.0, 1], [7.7, 0]], T);
const ext = curve([[0, 0], [1.6, 0], [2.5, 1], [3.1, 1], [4.0, 0], [4.5, 0], [5.4, 1], [6.0, 1], [6.9, 0]], T);
const seat = [0, 0.0, 0.60], tuck = [0, -0.03, 0.605];          // hip -> ankle (world): seated knees-up sit / tuck support
const lsit = dirW(1, 7, 3).map(v => v * reach(179)); lsit[0] = 0;
const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const leg = (sg, u, e) => { const r = mix(mix(seat, tuck, u), lsit, e); r[0] = sg * Math.sin(3 * Math.PI / 180) * Math.hypot(r[1], r[2]); return { rel: r, pf: 20 + 25 * u * e }; };
export default floorDrill({
  id: 't-lsit-tuck', name: 'L 撑↔团身', nameEn: 'L-Sit to Tuck', T,
  hands: { left: [0.28, 0.08, [0.15, 1]], right: [-0.28, 0.08, [-0.15, 1]] },
  fn: t => { const u = up(t), e = ext(t); return { pitch: 4 + 8 * e, py: 0.134 + 0.03 * u, pw: 3 - 2 * u,  shift: 0.06 * u, elbow: 145 + 32.5 * Math.min(1, u * 1.6), legs: { left: leg(1, u, e), right: leg(-1, u, e) } }; },
  tags: { ext },
  highlight: { groups: ['abs', 'hip-flexors'], side: 'both', pulseAt: [2.8, 5.7], pulseWidth: 0.7, pulseBase: 0.3 },
  camera: { dir: [0.9, 0.22, 0.6], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 4, at: 2.8 },
  keyFrames: [1.5, 2.8, 4.3],
  qa: qaStd({ straightLegs: [{ j: 'knee.right', min: 176, when: 'params.ext>0.999' }, { j: 'knee.left', min: 176, when: 'params.ext>0.999' }] }),
});
