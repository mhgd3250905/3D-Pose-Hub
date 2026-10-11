// adductors-A 哥萨克蹲 (Cossack squat), alternating sides. Wide stance facing the camera (+Z), up +Y, body left = +X.
// 'R' 0..1 squats onto the right leg (-X): pelvis drops and shifts right, right knee bends deep with the heel flat and the
// knee over the turned-out toes; the left leg stays straight (reach constraint) and its foot rolls onto the heel, toes up.
// 'L' mirrors it. Feet are turned out HO degrees. The rolling foot pivots about its heel: its ankle offset along the foot's
// heading is computed per frame from the pitch (coordinate tracks lx/lz/rx/rz: unit deltas that repeat the base value on the other axis) so the heel stays put.
// wR/wL switch the leg reach weights quickly (straight leg stiff, squat leg free) so the straight knee never bends mid-descent.
// Torso leans forward 25° at the hips (chest 17°); arms stay straight forward ~horizontal (chest-frame angle tracks the lean).
// 8 s: right 1.3 s down / 0.7 s hold / 1.3 s up / 0.7 s stand, then the left side identically.
const FX = 0.45, PY0 = 0.80, PY1 = 0.48, PX1 = 0.31, LEAN = 25, WB = -8, TOE = -50, HO = 20;
const HEEL = [-0.0824, -0.0456];                                        // heel pivot rel. the ankle (y, along-foot), fitted from the heel-contact vertices (slide <1 mm)
const DEG = Math.PI / 180;
const az = th => { const r = th * DEG; return -(HEEL[0] * Math.sin(r) + HEEL[1] * Math.cos(r)) + HEEL[1]; };  // ankle shift keeping the heel
const DUR = 8, KR = [[0, 0], [0.3, 0], [1.6, 1], [2.3, 1], [3.6, 0]], KL = [[4.3, 0], [5.6, 1], [6.3, 1], [7.6, 0]];
const pAt = (K, t) => { if (t < K[0][0] || t >= K[K.length - 1][0]) return 0; for (let i = 0; i < K.length - 1; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1];
  if (t >= ta && t < tb) return va + (vb - va) * (1 - Math.cos(Math.PI * (t - ta) / (tb - ta))) / 2; } return 0; };
const TS = Array.from({ length: DUR * 30 }, (_, k) => k / 30);
const lin = f => TS.map(t => [+t.toFixed(4), +f(t).toFixed(5), 'linear']);
const sw = p => { const u = Math.min(1, p / 0.22); return u * u * (3 - 2 * u); };      // fast weight switch
const AR = 0.4847, AU0 = 4, CH = LEAN + WB;                                             // arm length, world elevation, chest tilt at p=1
const S0 = 1.3702, Z0 = -0.0042;
const wrY = a => S0 + AR * Math.sin(a * DEG), wrZ = a => Z0 + AR * Math.cos(a * DEG);
const FIN = [0, wrY(AU0) - S0, wrZ(AU0) - Z0];                                         // finger = shoulder->wrist direction (flat hand in line with the arm)
const hand = x => ({ mode: 'free', frame: 'chest', wrist: [x, wrY(AU0), wrZ(AU0)], finger: FIN, normal: [0, -1, 0], relax: 0.25, poleUp: [Math.sign(x) * 0.5, 1.0, 0.0] });
const P = t => pAt(KR, t) + pAt(KL, t);
const hR = HO * DEG;   // left foot heading +HO (toes toward +X), right -HO
export default {
  id: 'adductors-A', name: '哥萨克蹲', nameEn: 'Cossack Squat',
  timeline: { duration: DUR, tracks: {
    R: lin(t => pAt(KR, t)), L: lin(t => pAt(KL, t)), wR: lin(t => sw(pAt(KR, t))), wL: lin(t => sw(pAt(KL, t))),
    lx: lin(t => az(TOE * pAt(KR, t)) * Math.sin(hR)), lz: lin(t => az(TOE * pAt(KR, t)) * Math.cos(hR)),
    rx: lin(t => -az(TOE * pAt(KL, t)) * Math.sin(hR)), rz: lin(t => az(TOE * pAt(KL, t)) * Math.cos(hR)),
    wy: lin(t => wrY(AU0 + CH * P(t)) - wrY(AU0)), wz: lin(t => wrZ(AU0 + CH * P(t)) - wrZ(AU0)) } },
  pose: {
    base: {
      pelvis: [0, PY0, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
      chest: { waist: [[[1, 0, 0], 0]] },
      hands: { left: hand(0.19), right: hand(-0.19) },
      feet: {
        left: { mode: 'floor', at: [FX, 0], heading: HO, pitch: 0, pole: [FX + 0.3, 0.5, 0.55] },
        right: { mode: 'floor', at: [-FX, 0], heading: -HO, pitch: 0, pole: [-FX - 0.3, 0.5, 0.55] },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 177.5, weight: 1 }, { type: 'reach', limb: 'rightLeg', angle: 177.5, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: PY0, weight: 0.2 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0, weight: 0.2 },
      ],
      solve: { vars: ['px', 'py'], reg: { px: 0.3, py: 0.3 }, iters: 60 },
    },
    deltas: {
      R: { hips: { rot: [[[1, 0, 0], LEAN]] }, chest: { waist: [[[1, 0, 0], WB]] }, feet: { left: { pitch: TOE } },
        constraints: [{}, {}, { value: PY1, weight: 1 }, { value: -PX1 }] },
      L: { hips: { rot: [[[1, 0, 0], LEAN]] }, chest: { waist: [[[1, 0, 0], WB]] }, feet: { right: { pitch: TOE } },
        constraints: [{}, {}, { value: PY1, weight: 1 }, { value: PX1 }] },
      wR: { constraints: [{ weight: 4 }, { weight: 0 }, {}, {}] },
      wL: { constraints: [{ weight: 0 }, { weight: 4 }, {}, {}] },
      lx: { feet: { left: { at: [FX + 1, 0] } } }, lz: { feet: { left: { at: [FX, 1] } } },
      rx: { feet: { right: { at: [-FX + 1, 0] } } }, rz: { feet: { right: { at: [-FX, 1] } } },
      wy: { hands: { left: { wrist: [0.19, wrY(AU0) + 1, wrZ(AU0)], finger: [0, FIN[1] + 1, FIN[2]] }, right: { wrist: [-0.19, wrY(AU0) + 1, wrZ(AU0)], finger: [0, FIN[1] + 1, FIN[2]] } } },
      wz: { hands: { left: { wrist: [0.19, wrY(AU0), wrZ(AU0) + 1], finger: [0, FIN[1], FIN[2] + 1] }, right: { wrist: [-0.19, wrY(AU0), wrZ(AU0) + 1], finger: [0, FIN[1], FIN[2] + 1] } } },
    },
  },
  highlight: { groups: ['adductors'], side: 'both', pulseAt: [1.95, 5.95], pulseWidth: 0.7, pulseBase: 0.3 },
  camera: { dir: [0.0, 0.25, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftKnee', 'rightKnee'], pad: 0.12, k: 0.75, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 2000, height: 800, cx: 512, cy: 525 },
  stillAt: 0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', rx: 50, ry: 12, a: 0.65 }, { j: 'rightAnkle', rx: 50, ry: 12, a: 0.65 }],
    bands: [{ from: 'leftAnkle', to: 'rightAnkle', mid: 'pelvis', rx: 60, ry: 12, a: 0.25, dy: 4, sag: 0.0 }] },
  props: [],
  keyFrames: [0, 1.95, 5.95],
  qa: {
    pins: [{ c: 'footR', when: 'params.L<0.001' }, { c: 'footL', when: 'params.R<0.001' }],
    straight: [{ j: 'knee.left', min: 176, when: 'params.R>0.001' }, { j: 'knee.right', min: 176, when: 'params.L>0.001' },
      { j: 'elbow.left', min: 174 }, { j: 'elbow.right', min: 174 }],
    allowContact: ['thighL|thighR', 'shinL|shinR', 'footL|footR', 'thighR|shinR', 'thighL|shinL', 'torso|thighR', 'torso|thighL'],
  },
};
