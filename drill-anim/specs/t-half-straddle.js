import { floorDrill, curve, qaStd, leg, dirW } from './_thomas.mjs';
// t-half-straddle 半分腿支撑 (half straddle support). Head up (+Y), body faces +Z, body left = +X.
// Wide straddle sit, hands flat between the thighs; press the floor away (arms locked, shoulders down) and lift the hips off the
// floor while the heels stay planted - the half version of the straddle support; hold, sit back down. Loop 8 s.
const T = 8, up = curve([[0, 0], [0.7, 0], [1.7, 1], [6.5, 1], [7.5, 0]], T);
// feet fixed in the world where the seated straddle puts them (pelvis at y 0.134, z 0): hip + reach * dir(elev -1.2, spread 44)
const foot = sg => { const L = leg(sg > 0 ? 'left' : 'right', dirW(sg, -1.2, 44), 0, 8);
  return { mode: 'free', frame: 'world', ankle: [L.ankle[0], L.ankle[1] - 0.8996 + 0.134, L.ankle[2] - 0.0102], rot: L.rot.slice(1, 3), pole: [sg * 0.5, 1.2, 0.5] }; };
export default floorDrill({
  id: 't-half-straddle', name: '半分腿支撑', nameEn: 'Half Straddle Support', T,
  hands: { left: [0.075, 0.24, [0.25, 1]], right: [-0.075, 0.24, [-0.25, 1]] },
  feetDesc: { left: foot(1), right: foot(-1) },
  constraints: [{ type: 'reach', limb: 'leftLeg', angle: 179, weight: 2 }, { type: 'reach', limb: 'rightLeg', angle: 179, weight: 2 }],
  solve: { vars: ['py', 'pz', 'c0', 'h0'], reg: { py: 0.3, pz: 0.05, c0: 0.05, h0: 0.05 }, iters: 60 },
  fn: t => { const u = up(t); return { pitch: 8 + 12 * u, py: 0.134 + 0.05 * u, pw: 0.6, shift: 0.05 * u, elbow: 160 + 17.5 * Math.min(1, u * 1.6) }; },
  tags: { up },
  highlight: { groups: ['triceps', 'hip-flexors'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 },
  camera: { dir: [0.35, 0.22, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee', 'rightKnee'], pad: 0.16, k: 1.0, drift: 3, at: 3.5 },
  keyFrames: [0.3, 1.2, 3.5],
  qa: qaStd({ more: { pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }] } }),
});
