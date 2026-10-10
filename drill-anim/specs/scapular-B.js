// scapular-B 单杠肩胛引体 (scapular pull-up). Dead hang from a doorway pull-up bar, overhand grip a little wider than the
// shoulders, arms straight the whole time. 'dep' pulls the shoulder blades down and back (scapular depression +
// retraction): the body rises a few centimetres with the elbows still locked, holds 1 s, and sinks back to a passive hang.
// The hands never move on the bar; legs hang straight and together. 2 reps / 8 s.
// Head points +Y, front faces +Z, body left = +X. Bar along X at height BH, z = BZ.
const BH = 2.2, BZ = 0.02, BX = 0.27;
// hand frame: fingers up (tilted 15 deg back), palm facing forward-up; bar centre at GF along the fingers + GN along the
// palm normal from the wrist (same fit as the parallette grip: bar in the finger-root crease)
const A = 15 * Math.PI / 180, GF = 0.148, GN = 0.035;
const fdir = [0, Math.cos(A), -Math.sin(A)], ndir = [0, Math.sin(A), Math.cos(A)];
const wristAt = sg => [sg * BX, +(BH - fdir[1] * GF - ndir[1] * GN).toFixed(4), +(BZ - fdir[2] * GF - ndir[2] * GN).toFixed(4)];
const hand = sg => ({ mode: 'free', frame: 'world', relax: 2.2, wrist: wristAt(sg), finger: [sg * 0.05, fdir[1], fdir[2]], normal: ndir, poleUp: [sg * 0.6, 1.6, -0.3] });
const foot = sg => ({ mode: 'free', frame: 'hips', ankle: [sg * 0.075, 0.0893, 0.0], rot: [[[1, 0, 0], 22]], poleLow: [sg * 0.08, 0.5, 0.8] });
const rep = s => [[s + 0.4, 0], [s + 1.4, 1], [s + 2.4, 1], [s + 3.6, 0]];
export default {
  id: 'scapular-B', name: '单杠肩胛引体', nameEn: 'Scapular Pull-Up',
  timeline: { duration: 8, tracks: { dep: [[0, 0], ...rep(0), ...rep(4)] } },
  pose: {
    base: {
      pelvis: [0, 1.25, -0.03],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      shoulders: { shift: [0, 0.035, 0.0] },
      hands: { right: hand(-1), left: hand(1) },
      feet: { right: foot(-1), left: foot(1) },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178 }, { type: 'reach', limb: 'leftArm', angle: 178 },
      ],
      solve: { vars: ['py', 'pz'], reg: { py: 0.02, pz: 0.3 } },
    },
    deltas: { dep: { shoulders: { shift: [0, -0.03, -0.015] } } },
  },
  highlight: { groups: ['scapular'], side: 'both', pulseTrack: 'dep', pulseBase: 0.3 },
  camera: { dir: [0.55, 0.05, -1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'leftPalm'], pad: 0.1, k: 1.0, drift: 2, at: 1.9 },
  frame: { mode: 'fit', width: 560, height: 900, cx: 540, cy: 530 },
  stillAt: 1.9,
  shadow: { joints: ['leftToe', 'rightToe', 'pelvis'], blobs: [{ j: 'pelvis', rx: 60, ry: 12, a: 0.35 }], bands: [] },
  props: [{ type: 'pullupBar', at: [0, 0, BZ], width: 0.86, height: BH }],
  keyFrames: [0.4, 1.4, 1.9],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
