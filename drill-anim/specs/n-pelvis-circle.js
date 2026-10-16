// n-pelvis-circle 站姿骨盆画圈 (standing pelvis circles, hands on hips) · N HipLab 开胯 MVP 新增.
// Standing, feet a little wider than the hips, knees soft, hands on the hips. The pelvis draws slow, big circles (forward ->
// left -> back -> right), tilting with the circle (tips forward as it goes back, hikes the side it travels to) while the feet
// stay planted and the shoulders stay roughly level over the feet. One circle each way / 8 s (opening move of the office set
// and the sitting-break reminder). Facing +Z, head +Y, body left = +X (frame of h-hip-gate). No solver: pelvis path and tilts
// are prescribed, the waist counter-rotates, the legs reach the planted feet by IK.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
const DUR = 8, RX = 0.06, RZ = 0.06, TILT = 9, HIKE = 5;
const sm = x => (1 - Math.cos(Math.PI * x)) / 2;
// phase angle: 0..2pi over 0.2-3.8 s (counter-clockwise from above), back the other way 4.2-7.8 s
const th = t => { t = ((t % DUR) + DUR) % DUR; if (t < 0.2 || t >= 7.8) return 0; if (t < 3.8) return 2 * Math.PI * sm((t - 0.2) / 3.6);
  if (t < 4.2) return 2 * Math.PI; return 2 * Math.PI * (1 - sm((t - 4.2) / 3.6)); };
const amp = t => { t = ((t % DUR) + DUR) % DUR; return Math.min(1, Math.max(0, Math.min(t / 0.6, (DUR - t) / 0.6, 1))) ; };
// circle starts and ends at the front point; amplitude ramps in/out at the loop seam so the pose is centred at t=0
const cx = t => RX * amp(t) * Math.sin(th(t)), cz = t => RZ * amp(t) * Math.cos(th(t));
const tiltF = t => -TILT * cz(t) / RZ;          // pelvis forward (z +) = posterior tilt, back = anterior tilt
const tiltS = t => HIKE * cx(t) / RX;           // travels left (x +) -> hikes left hip
const handHip = s => ({ mode: 'free', frame: 'hips', palmAt: [sg(s) * 0.16, 0.99, 0.02], finger: [-sg(s) * 0.1, -0.3, 0.95], normal: [-sg(s), 0, 0], poleUp: [sg(s) * 0.6, 1.15, -0.3],
  touch: { clear: 0.001, from: 0.0, solve: 'bisect', iters: 16 } });
const P = build(DUR, {
  pelvis: t => r4([cx(t), 0.878, 0.0 + cz(t)]),
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], tiltF], [[0, 0, 1], tiltS]] },
  chest: { waist: [[[1, 0, 0], t => -tiltF(t) * 0.8], [[0, 0, 1], t => -tiltS(t) * 1.3]] },
  hands: { left: handHip('left'), right: handHip('right') },
  feet: {
    left: { mode: 'floor', at: [0.14, 0.0], heading: 8, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.14, 0.0], heading: -8, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { circle: t => amp(t) });
export default {
  id: 'n-pelvis-circle', name: '站姿骨盆画圈', nameEn: 'Standing Pelvis Circles',
  modelProfile: 'training-human-v2', fps: 15, alignClavicles: false,
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  highlight: { groups: ['hip-flexors', 'glute-max', 'hip-abductors'], side: 'both', pulseTrack: 'circle', pulseBase: 0.3 },
  camera: { dir: [0.75, 0.35, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftElbow', 'rightElbow'], pad: 0.14, k: 0.9, drift: 3, at: 1.0, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 840, cx: 512, cy: 515 },
  stillAt: 1.1,
  shadow: { joints: ['leftToe', 'leftAnkle', 'rightAnkle', 'rightToe', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 46, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 46, ry: 11, a: 0.6 }],
    bands: [{ from: 'leftAnkle', to: 'rightAnkle', mid: 'pelvis', rx: 70, ry: 13, a: 0.25, dy: 4, sag: 0.0 }] },
  props: [],
  keyFrames: [0.2, 1.1, 2.0],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    touch: [{ side: 'left', max_gap: 1.5 }, { side: 'right', max_gap: 1.5 }],
    allowContact: ['handL|torso', 'handR|torso', 'forearmL|torso', 'forearmR|torso'],
  },
};
