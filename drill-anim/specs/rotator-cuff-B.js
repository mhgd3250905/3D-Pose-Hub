// rotator-cuff-B 弹力带肘贴体侧外旋 (banded external rotation, elbow at the side), right arm. Standing tall with a band post
// on the body's LEFT (+X) at elbow height; a small rolled towel is squeezed between the right elbow and the ribs. Elbow bent
// 90 deg, forearm level, thumb up. 'rot' swings the forearm on the circle around the elbow from across the belly (~35 deg
// inward) out to ~50 deg of external rotation against the band, holds 1 s, and returns slowly; the elbow never leaves the
// towel. Left arm hangs relaxed. 2 reps / 8 s.  Head +Y, front +Z, body left = +X (rest frame; hands in the chest frame).
// v2: the elbow sits 7 cm out from the shoulder line (upper arm abducted ~16 deg) so the rolled towel really fits between the
// upper arm and the ribs (v1's EL x -0.218 left the upper arm against the torso: no room, the towel cut 23-26 mm into the arm)
const SH = [-0.188, 1.37, -0.004], UA = 0.25678, ELX = -0.258;
const EL = [ELX, +(SH[1] - Math.sqrt(UA * UA - (ELX - SH[0]) ** 2 - SH[2] ** 2)).toFixed(4), 0.0];   // right elbow (rest coords), |EL - SH| = UA
const FA = 0.22805, A0 = -35, A1 = 50;
// v2: elbow pole on the shoulder->elbow line extended (2 EL - S): it lies in the plane (shoulder, wrist, EL) for every wrist on
// the circle, so the IK elbow stays at EL through the whole rotation (v1's fixed pole let the elbow drift ~10 cm outward)
const POLE = EL.map((x, i) => +(2 * x - SH[i]).toFixed(4));
const wr = a => { const r = a * Math.PI / 180; return [+(EL[0] - FA * Math.sin(r)).toFixed(4), EL[1], +(EL[2] + FA * Math.cos(r)).toFixed(4)]; };
const bowW = () => { const a = wr(A0), b = wr(A1), m = wr((A0 + A1) / 2); return a.map((v, i) => +(v + m[i] - (a[i] + b[i]) / 2).toFixed(4)); };
const hand = a => { const r = a * Math.PI / 180; return { mode: 'free', frame: 'chest', relax: 0, wrist: wr(a), finger: [+(-Math.sin(r)).toFixed(3), 0.05, +Math.cos(r).toFixed(3)], normal: [+Math.cos(r).toFixed(3), 0, +Math.sin(r).toFixed(3)], poleUp: POLE }; };
const DUR = 8, K = [[0, 0], [0.3, 0], [1.3, 1], [2.3, 1], [3.8, 0], [4.3, 0], [5.3, 1], [6.3, 1], [7.8, 0], [8, 0]];
const pAt = t => { for (let i = 0; i < K.length - 1; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1];
  if (t >= ta && t < tb) return va + (vb - va) * (1 - Math.cos(Math.PI * (t - ta) / (tb - ta))) / 2; } return 0; };
const TS = Array.from({ length: DUR * 30 }, (_, k) => k / 30);
const P = TS.map(t => [+t.toFixed(4), +pAt(t).toFixed(5), 'linear']);
const BOW = TS.map(t => { const p = pAt(t); return [+t.toFixed(4), +(4 * p * (1 - p)).toFixed(5), 'linear']; });
const relaxed = sg => ({ mode: 'free', frame: 'chest', wrist: [sg * 0.275, 0.905, -0.03], finger: [-sg * 0.05, -1, 0.1], normal: [-sg, 0, 0.1], poleUp: [sg * 0.3, 1.1, -0.5] });
const PX = 0.6, PZ = 0.3, TIE = 1.02;
export default {
  id: 'rotator-cuff-B', name: '弹力带肘贴体侧外旋', nameEn: 'Banded External Rotation',
  timeline: { duration: DUR, tracks: { rot: P, bow: BOW } },
  pose: {
    base: {
      pelvis: [0, 0.88, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { body: [[[1, 0, 0], 0]] },
      hands: { right: hand(A0), left: relaxed(1) },
      feet: {
        right: { mode: 'floor', at: [-0.11, 0.0], heading: -5, pitch: 0 },
        left: { mode: 'floor', at: [0.11, 0.0], heading: 5, pitch: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 178, weight: 1 }, { type: 'reach', limb: 'rightLeg', angle: 178, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 1, py: 0.2, pz: 0.2 } },
    },
    deltas: {
      rot: { hands: { right: hand(A1) } },
      bow: { hands: { right: { wrist: bowW() } } },
    },
  },
  highlight: { groups: ['rotator-cuff'], side: 'right', pulseTrack: 'rot', pulseBase: 0.3 },
  camera: { dir: [-0.75, 0.28, -0.75], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'leftPalm', 'rightElbow'], pad: 0.12, k: 1.0, drift: 2, at: 2.0 },
  frame: { mode: 'fit', width: 600, height: 860, cx: 560, cy: 520 },
  stillAt: 2.0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.65 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.65 }], bands: [] },
  props: [
    { type: 'bandPost', at: [PX, 0, PZ], height: 1.3, tieY: TIE },
    // v2: the band ends on a D-handle held in a closed power grip (dHandle #23, anchor + band-to-anchor-name #82); the D-loop
    // swivels so its ring points at the band's tie point on the post
    { type: 'anchor', name: 'post', at: [PX - 0.04, TIE, PZ] },
    { type: 'dHandle', side: 'right', name: 'hR', toward: 'post', lean: 0.25, len: 0.16 },
    { type: 'band', from: [PX - 0.04, TIE, PZ], to: 'hR', r: 0.007, sag: 0, colour: '#7a4a32' },
    // rolled towel squeezed between the right elbow and the ribs (follows the elbow joint, stays level). v2: placed in the
    // measured gap between the distal upper arm and the ribs, 4 cm above the elbow joint (v1 sat 23-26 mm inside the arm)
    { type: 'foamRoller', r: 0.026, length: 0.11, yaw: 90, follow: [{ bone: 'rightForearm', offset: [0, 0, 0] }], offset: [0.0895, 0.04, -0.036] },
  ],
  keyFrames: [0.3, 1.0, 1.8],
  qa: {
    pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [],
    allowContact: ['handL|thighL', 'upperArmR|torso'],
  },
};
