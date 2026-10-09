// forearms-C 壶铃倒握行走 (bottoms-up kettlebell carry). Slow walk with a light kettlebell held bottoms-up in the RIGHT hand: forearm
// vertical, wrist neutral, elbow in front of and below the shoulder, bell balanced above the fist. Left arm relaxed with a small swing.
// Camera tracks the walker (body-centred frame): the pelvis stays put and each planted foot slides back at walking speed, so the loop is
// seamless - the same picture as a camera dollying beside someone walking on an untextured floor.
// 10 steps / 8 s (1.25 steps/s), step 0.45 m, speed 0.5625 m/s; stance 1.05 s, swing 0.55 s. Every pose value is keyed per frame:
// each track drives one scalar through a +1 delta (value = track), linear between frame keys.
// Head points +Y, front faces +Z, body left = +X. KETTLEBELL = placeholder prop (kbBottomsUp) until colleague 1's shared kettlebell lands.
const FPS = 30, N = 240, TL = 8, STEP = 0.8, SW = 0.55, V = 0.45 / STEP, STANCE = 2 * STEP - SW;
const cosE = u => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;
const footAt = (t, t0) => {            // t0 = this foot's heel strike; returns {z, lift, pitch, stance}
  let r = ((t - t0) % (2 * STEP) + 2 * STEP) % (2 * STEP); const ex = V * STANCE;   // excursion during stance
  // stance: heel strike toes-up 10 deg rolling flat over the first 15 %, heel rises (toes-down up to 22 deg) over the last 30 %
  if (r < STANCE) { const a = r / STANCE; return { z: ex / 2 - V * r, lift: 0, pitch: a < 0.15 ? -10 * (1 - a / 0.15) : a > 0.7 ? 22 * cosE((a - 0.7) / 0.3) : 0, st: 1 }; }
  const u = (r - STANCE) / SW, e = cosE(u); return { z: -ex / 2 + ex * e, lift: 0.055 * Math.sin(Math.PI * u), pitch: 22 - 32 * cosE(u) - 8 * Math.sin(Math.PI * u), st: 0 };
};
const T = { lz: [], llift: [], lpitch: [], rz: [], rlift: [], rpitch: [], px: [], wl: [], wr: [], lw: [] };
for (let f = 0; f < N; f++) { const t = f / FPS, L = footAt(t, 0), R = footAt(t, STEP);
  const k = (n, val) => T[n].push([t, +val.toFixed(5), 'linear']);
  k('lz', L.z); k('llift', L.lift); k('lpitch', L.pitch); k('rz', R.z); k('rlift', R.lift); k('rpitch', R.pitch);
  k('px', 0.018 * Math.cos(Math.PI * t / STEP));                     // weight shifts toward the stance foot
  k('wl', L.st); k('wr', R.st); k('lw', 0.05 * Math.sin(Math.PI * t / STEP - Math.PI / 2)); }
const XL = 0.095, XR = -0.095;
export default {
  id: 'forearms-C', name: '壶铃倒握行走', nameEn: 'Bottoms-Up Kettlebell Carry',
  timeline: { duration: TL, tracks: T },
  pose: {
    base: {
      pelvis: [0, 0.88, 0],
      hips: { up: [0, 1, 0], front: [0, 0, 1] },
      chest: { body: [[[1, 0, 0], 2]] },
      hands: {
        right: { mode: 'free', frame: 'chest', relax: 0, wrist: [-0.37, 1.44, 0.16], finger: [-0.02, 1, 0.03], normal: [1, 0, 0], poleUp: [-0.45, 1.05, 0.35] },
        left: { mode: 'free', frame: 'chest', wrist: [0.255, 0.91, 0.03], finger: [-0.05, -1, 0.06], normal: [-1, 0, 0.1], poleUp: [0.3, 1.1, -0.5] },
      },
      feet: {
        left: { mode: 'floor', at: [XL, 0], heading: 3, pitch: 0, lift: 0 },
        right: { mode: 'floor', at: [XR, 0], heading: -3, pitch: 0, lift: 0 },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 177, weight: 0 },
        { type: 'reach', limb: 'rightLeg', angle: 177, weight: 0 },
      ],
      solve: { vars: ['py'], reg: { py: 0.05 } },
    },
    deltas: {
      lz: { feet: { left: { at: [XL, 1] } } }, llift: { feet: { left: { lift: 1 } } }, lpitch: { feet: { left: { pitch: 1 } } },
      rz: { feet: { right: { at: [XR, 1] } } }, rlift: { feet: { right: { lift: 1 } } }, rpitch: { feet: { right: { pitch: 1 } } },
      px: { pelvis: [1, 0.88, 0] },
      wl: { constraints: [{ weight: 1 }, {}] }, wr: { constraints: [{}, { weight: 1 }] },
      lw: { hands: { left: { wrist: [0.255, 0.91, 1.03] } } },
    },
  },
  highlight: { groups: ['forearms'], side: 'right', pulseBase: 0.55 },
  camera: { dir: [-0.5, 0.12, 0.85], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'leftAnkle', 'rightAnkle'], pad: 0.22, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 480, height: 700, cx: 512, cy: 560 },
  stillAt: 0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 40, ry: 10, a: 0.55 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.55 }],
    bands: [{ from: 'rightAnkle', to: 'leftAnkle', mid: 'pelvis', rx: 55, ry: 12, a: 0.22, dy: 4, sag: 0.0 }] },
  props: [{ type: 'kbBottomsUp', side: 'right', r: 0.07, horn: 0.065, len: 0.11, shift: 0.01 }],
  keyFrames: [0.0, 0.8, 1.6],
  qa: { pins: [], straight: [], allowContact: ['handL|thighL'] },
};
