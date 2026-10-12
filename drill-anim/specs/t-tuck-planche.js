import { floorDrill, curve, qaStd } from './_thomas-pr106.mjs';
// t-tuck-planche 团身俄挺 (tuck planche hold). Head up (+Y), body faces +Z, body left = +X. Side camera.
// From a crouch on the toes with the hands flat on the floor (fingers turned out), lean the shoulders forward past the hands,
// lock the arms, round the upper back, lift the feet and hold the body balanced on the hands with knees tucked under the chest;
// place the feet back down. Loop 8 s.
const T = 8, up = curve([[0, 0], [0.7, 0], [1.9, 1], [6.3, 1], [7.4, 0]], T);
const lean = up;   // weight shift forward leads the lift
const br = t => 0.5 - 0.5 * Math.cos(2 * Math.PI * t / 2.2);
const mix = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const crouch = [0.08, -0.19, -0.06], tuck = [0.08, -0.20, -0.08];             // hip -> ankle (world, left; mirrored)
const leg = (sg, u) => { const r = mix(crouch, tuck, u); r[0] *= sg; return { rel: r, pf: 35, kneeUp: [0, -0.6, 1] }; };
const original = floorDrill({
  id: 't-tuck-planche', name: '团身俄挺', nameEn: 'Tuck Planche', T,
  hands: { left: [0.20, 0.0, [0.75, 0.66]], right: [-0.20, 0.0, [-0.75, 0.66]] },
  poleUp: sg => [sg * 0.6, 0.2, -1],
  fn: t => { const u = up(t), l = lean(t), b = br(t) * u;
    return { pitch: 55 + 15 * l + 1.5 * b, py: 0.41 + 0.02 * u, pw: 1.5, pz: -0.20 - 0.10 * l, pzw: 0.8, shift: 0.02 + 0.02 * l, elbow: 170 + 7.5 * l,
      legs: { left: leg(1, u), right: leg(-1, u) } }; },
  tags: { up },
  highlight: { groups: ['deltoids', 'serratus'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [1, 0.18, 0.15], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.28, k: 1.0, drift: 4, at: 4 },
  keyFrames: [0.3, 1.4, 4],
  qa: qaStd({ straightLegs: [], more: { hipFlexMax: 150, pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'params.up<0.001' }, { c: 'footL', when: 'params.up<0.001' }] }, allow: ['torso|thighL', 'torso|thighR'] }),
});

// The last frame of the original approved 5 fps preview is f=234 / t=7.8 s.
// All descriptor tracks equal zero there, so original.pose.base is exactly that
// frame's descriptor. Preserve the original IK and shoulder path. Only orbit
// the camera; do not reanimate, resculpt, straighten or reinterpret the posture.
const holdDuration = 24;
export default {
  ...original,
  solveShoulders: false, alignBendPlanes: false,
  breath: 0,
  pose: { base: original.pose.base, deltas: {} },
  timeline: { duration: holdDuration, tracks: { up: [[0, 0, 'linear']] } },
  camera: { ...original.camera, drift: 0, orbitDegrees: 360, orbitDuration: holdDuration, at: 0 },
  stillAt: 0, keyFrames: [0, 6, 12, 18],
  restoration: { source: '3d20434213f4a42d93cfec17e285af382334e36d', sourceFrame: 234, sourceTime: 7.8,
    posture: 'original final preview frame', cameraOnly: true },
};
