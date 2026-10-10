// forearms-C 壶铃倒握行走 (bottoms-up kettlebell carry). Slow walk with a light kettlebell held bottoms-up in the RIGHT hand:
// closed power grip on the handle (baked grip), forearm vertical, wrist neutral, fist at chin height, elbow in front of and below the
// shoulder, bell upright directly above the fist (kbBottomsUp keeps it on world-up), clear of the head in the 3/4 front-left camera.
// Left arm relaxed with a small swing.
// Camera tracks the walker (body-centred frame): the pelvis stays put and each planted foot slides back at walking speed, so the loop is
// seamless - the same picture as a camera dollying beside someone walking on an untextured floor.
// 10 steps / 8 s (1.25 steps/s), step 0.32 m (slow, careful carry), speed 0.4 m/s; stance 0.88 s, swing 0.72 s; every step is exactly
// 24 frames (integer frame arithmetic, so all ten foot strikes land on frames 0, 24, 48 ...). Every pose value is keyed per frame:
// each track drives one scalar through a +1 delta (value = track), linear between frame keys.
// Pelvis height: no solver. PY (one 24-frame step, the same for both legs by symmetry) is baked from the leg geometry so the stance knee
// stays at 172-177 deg and the landing leg never over-reaches (v1 solved it with reach constraints whose weights flipped 0/1 in a frame:
// 25-30 deg knee snaps). PY is smooth and periodic: max knee change 4.9 deg/frame. Regenerate PY if feet/step change.
// Head points +Y, front faces +Z, body left = +X. KETTLEBELL = placeholder prop (kbBottomsUp) until colleague 1's shared kettlebell lands.
const FPS = 30, N = 240, TL = 8, STEP = 0.8, SW = 0.72, V = 0.32 / STEP, STANCE = 2 * STEP - SW;
const SF = 24, PF = 2 * SF;
const PY = [-0.002, -0.0002, 0.001, 0.0021, 0.0029, 0.0049, 0.0065, 0.0079, 0.0092, 0.0104, 0.0116, 0.0125, 0.0132, 0.0141, 0.0163, 0.0192, 0.0215, 0.023, 0.0233, 0.0223, 0.0199, 0.0162, 0.0113, 0.0052];
const cosE = u => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, u)))) / 2;
const footAt = (f, f0) => {            // f0 = this foot's heel-strike frame; returns {z, lift, pitch}
  const r = (((f - f0) % PF) + PF) % PF / FPS, ex = V * STANCE;   // time since heel strike (s), excursion during stance
  // stance: heel strike toes-up 10 deg rolling flat over the first 15 %, heel rises (toes-down up to 16 deg) from mid-stance on.
  if (r < STANCE) { const a = r / STANCE; return { z: ex / 2 - V * r, lift: 0, pitch: a < 0.15 ? -10 * (1 - a / 0.15) : a > 0.45 ? 16 * cosE((a - 0.45) / 0.55) : 0 }; }
  const u = (r - STANCE) / SW, e = cosE(u); return { z: -ex / 2 + ex * e, lift: 0.04 * Math.sin(Math.PI * u), pitch: 16 - 26 * cosE(u) - 8 * Math.sin(Math.PI * u) };
};
const T = { lz: [], llift: [], lpitch: [], rz: [], rlift: [], rpitch: [], px: [], py: [], lw: [] };
for (let f = 0; f < N; f++) { const t = f / FPS, L = footAt(f, 0), R = footAt(f, SF);
  const k = (n, val) => T[n].push([t, +val.toFixed(5), 'linear']);
  k('lz', L.z); k('llift', L.lift); k('lpitch', L.pitch); k('rz', R.z); k('rlift', R.lift); k('rpitch', R.pitch);
  k('px', 0.018 * Math.cos(Math.PI * f / SF));                     // weight shifts toward the stance foot
  k('py', PY[f % SF]); k('lw', 0.05 * Math.sin(Math.PI * f / SF - Math.PI / 2)); }
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
        right: { mode: 'free', frame: 'chest', relax: 0, wrist: [-0.29, 1.42, 0.16], finger: [0, 1, 0.02], normal: [1, 0, 0], poleUp: [-0.2, -0.6, 0.8] },
        left: { mode: 'free', frame: 'chest', wrist: [0.255, 0.91, 0.03], finger: [-0.05, -1, 0.06], normal: [-1, 0, 0.1], poleUp: [0.3, 1.1, -0.5] },
      },
      feet: {
        left: { mode: 'floor', at: [XL, 0], heading: 3, pitch: 0, lift: 0 },
        right: { mode: 'floor', at: [XR, 0], heading: -3, pitch: 0, lift: 0 },
      },
      solve: { vars: [] },
    },
    deltas: {
      lz: { feet: { left: { at: [XL, 1] } } }, llift: { feet: { left: { lift: 1 } } }, lpitch: { feet: { left: { pitch: 1 } } },
      rz: { feet: { right: { at: [XR, 1] } } }, rlift: { feet: { right: { lift: 1 } } }, rpitch: { feet: { right: { pitch: 1 } } },
      px: { pelvis: [1, 0.88, 0] },
      py: { pelvis: [0, 1.88, 0] },
      lw: { hands: { left: { wrist: [0.255, 0.91, 1.03] } } },
    },
  },
  highlight: { groups: ['forearms'], side: 'right', pulseBase: 0.55 },
  camera: { dir: [0.75, 0.12, 0.65], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'rightPalm', 'leftAnkle', 'rightAnkle'], pad: 0.22, k: 1.0, drift: 0.9, at: 0 },
  frame: { mode: 'fit', width: 480, height: 700, cx: 512, cy: 560 },
  stillAt: 0,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 40, ry: 10, a: 0.55 }, { j: 'rightAnkle', rx: 40, ry: 10, a: 0.55 }],
    bands: [{ from: 'rightAnkle', to: 'leftAnkle', mid: 'pelvis', rx: 55, ry: 12, a: 0.22, dy: 4, sag: 0.0 }] },
  props: [{ type: 'kbBottomsUp', side: 'right', r: 0.07, horn: 0.065, len: 0.11, shift: 0.01 }],
  keyFrames: [0.0, 0.8, 1.6],
  qa: { pins: [], straight: [], allowContact: ['handL|thighL'] },
};
