// lats-B 弹力带直臂下拉 (banded straight-arm pulldown). Standing tall with a slight hip hinge facing a door frame (+Z),
// a band anchored at the top of the frame runs to both hands (v2: fists on two D-handles, palms facing down-back).
// 'pull' sweeps both straight arms (elbow ~177 deg) on the arc around the shoulder from ~85 deg shoulder flexion (front,
// about shoulder height) down to the sides of the thighs, holds 1 s with the lats squeezed, and returns slowly.
// Wrists move on the circle around the shoulder (tracks c = cos, s = sin of the shoulder angle). 2 reps / 8 s.
// Head points +Y, front faces +Z, body left = +X (rest frame; hands in the chest frame).
// v2 (Hark self-QA #91): the band ends on two D-handles (dHandle #23 + anchor/band-to-anchor-name #82), each held in a closed
// power grip (fist baked by P.bakeGrip, relax 0); the D-loops swivel toward the band's anchor on the door frame. v1: relaxed
// half-open hands with the band tied straight into the hand bones.
// D-handle grip 20 cm, slid 1 cm along its axis (shift): the 13/16 cm grips left the hand's heel 4-5 mm through the D-loop's first leg.
const S = sg => [sg * 0.188, 1.37, -0.004];
const UA = 0.25678, FA = 0.22805, R = Math.sqrt(UA * UA + FA * FA + 2 * UA * FA * Math.cos(3.2 * Math.PI / 180));   // 176.8 deg elbow
const A0 = 84, A1 = -2;                                   // shoulder flexion: start (front) / end (by the thighs)
// v2: wrists 85 mm outside the shoulders (v1 50 mm): with the 20 cm D-handle grips running across the body the handles' inner ends
// swept 2-3 mm through the thighs as the hands passed them (probe pr-lats4/5)
const DX = 0.085 / R, KK = Math.sqrt(1 - DX * DX);           // wrists outside the shoulders, on the exact circle round the shoulder
const wr = (sg, a) => { const r = a * Math.PI / 180, s = S(sg); return [+(s[0] + sg * DX * R).toFixed(4), +(s[1] - R * KK * Math.cos(r)).toFixed(4), +(s[2] + R * KK * Math.sin(r)).toFixed(4)]; };
// wrist = shoulder + lateral + R*KK*(cos a * down + sin a * front): tracks 'c' and 's' carry cos a and sin a, so every frame is on the circle
const base = sg => { const s = S(sg); return [+(s[0] + sg * DX * R).toFixed(4), s[1], s[2]]; };
const dC = sg => { const b = base(sg); return [b[0], +(b[1] - R * KK).toFixed(4), b[2]]; };
const dS = sg => { const b = base(sg); return [b[0], b[1], +(b[2] + R * KK).toFixed(4)]; };
const DUR = 8, K = [[0, 0], [0.3, 0], [1.4, 1], [2.4, 1], [3.8, 0], [4.3, 0], [5.4, 1], [6.4, 1], [7.8, 0], [8, 0]];
const pAt = t => { for (let i = 0; i < K.length - 1; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1];
  if (t >= ta && t < tb) return va + (vb - va) * (1 - Math.cos(Math.PI * (t - ta) / (tb - ta))) / 2; } return 0; };
const TS = Array.from({ length: DUR * 30 }, (_, k) => k / 30);
const P = TS.map(t => [+t.toFixed(4), +pAt(t).toFixed(5), 'linear']);
const ang = t => (A0 + (A1 - A0) * pAt(t)) * Math.PI / 180;
const TC = TS.map(t => [+t.toFixed(4), +Math.cos(ang(t)).toFixed(6), 'linear']);
const TSN = TS.map(t => [+t.toFixed(4), +Math.sin(ang(t)).toFixed(6), 'linear']);
// v2: overhand (pronated) grip all the way: palm normal = finger turned -90 deg about X (palm down at the front, palm back by the
// thighs), so each D-handle's grip runs across the body and its loop can swivel toward the anchor in front (v1's normal was
// nearly parallel to the finger -> the hand twisted to a neutral grip at the bottom and the band would run up through the forearm)
const hand = (sg, a) => ({ mode: 'free', frame: 'chest', relax: 0, wrist: wr(sg, a), finger: [0, -Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)].map(v => +v.toFixed(3)), normal: [0, -Math.sin(a * Math.PI / 180), -Math.cos(a * Math.PI / 180)].map(v => +v.toFixed(3)), poleUp: [sg * 0.5, 0.6, -0.8] });
const FY = 2.06, FZ = 0.95;                               // band anchor at the top of the door frame
export default {
  id: 'lats-B', name: '弹力带直臂下拉', nameEn: 'Banded Straight-Arm Pulldown',
  timeline: { duration: DUR, tracks: { pull: P, c: TC, s: TSN } },
  pose: {
    base: {
      pelvis: [0, 0.875, -0.03],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 12]] },
      chest: { body: [[[1, 0, 0], -2]] },
      hands: { right: { ...hand(-1, A0), wrist: base(-1) }, left: { ...hand(1, A0), wrist: base(1) } },
      feet: {
        right: { mode: 'floor', at: [-0.11, 0.0], heading: -5, pitch: 0 },
        left: { mode: 'floor', at: [0.11, 0.0], heading: 5, pitch: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 174, weight: 1 }, { type: 'reach', limb: 'rightLeg', angle: 174, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: {
      pull: { hands: { right: { finger: hand(-1, A1).finger, normal: hand(-1, A1).normal }, left: { finger: hand(1, A1).finger, normal: hand(1, A1).normal } } },
      c: { hands: { right: { wrist: dC(-1) }, left: { wrist: dC(1) } } },
      s: { hands: { right: { wrist: dS(-1) }, left: { wrist: dS(1) } } },
    },
  },
  highlight: { groups: ['lats'], side: 'both', pulseTrack: 'pull', pulseBase: 0.3 },
  // v2: zoomed out so the door frame's top bar and the band anchor are in the picture (v1 cut them off at the top edge)
  camera: { dir: [-1, 0.15, -0.35], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'leftPalm'], pad: 0.36, k: 1.0, drift: 4, at: 1.9 },
  frame: { mode: 'fit', width: 640, height: 700, cx: 540, cy: 585 },
  stillAt: 0.1,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }], bands: [] },
  props: [
    { type: 'pullupBar', at: [0, 0, FZ], width: 0.9, height: FY + 0.04 },
    { type: 'anchor', name: 'door', at: [0, FY, FZ] },
    { type: 'dHandle', side: 'right', name: 'hR', toward: 'door', lean: 0.25, len: 0.20, shift: 0.01 },
    { type: 'dHandle', side: 'left', name: 'hL', toward: 'door', lean: 0.25, len: 0.20, shift: 0.01 },
    { type: 'band', from: [-0.03, FY, FZ], to: 'hR', r: 0.007, sag: 0, colour: '#7a4a32' },
    { type: 'band', from: [0.03, FY, FZ], to: 'hL', r: 0.007, sag: 0, colour: '#7a4a32' },
  ],
  keyFrames: [0.2, 0.9, 1.9],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }],
    allowContact: ['handR|thighR', 'handL|thighL'],
  },
};
