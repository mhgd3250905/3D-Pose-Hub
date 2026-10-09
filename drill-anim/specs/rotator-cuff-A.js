// rotator-cuff-A 俯撑交替触肩 (plank shoulder taps). High plank on flat pinned hands and tucked toes;
// alternate hands lift and tap the opposite shoulder (2 s per tap, 4 taps per 8 s loop); hips stay square,
// a 1.5 cm weight shift toward the support hand. Head points +X, body faces the floor (-Y), body left = -Z.
const TH = 18;                       // plank incline, degrees (solved further by 'h0')
const HX = 0.0, HZ = 0.205;          // hands under the shoulders
const FX = -1.17, FZ = 0.11;        // toes, feet slightly apart (more stable, per cue)
const tapWin = s => [[s, 0], [s + 0.2, 0], [s + 0.75, 1], [s + 1.0, 1], [s + 1.55, 0]];
const env = starts => starts.flatMap(tapWin).sort((a, b) => a[0] - b[0]);
const floorHand = z => ({ mode: 'floor', at: [HX, z], finger: [1, 0], poleUp: [Math.sign(z) * -0.24, 0.95, 0.18] });
export default {
  id: 'rotator-cuff-A', name: '俯撑交替触肩', nameEn: 'Plank Shoulder Taps',
  timeline: { duration: 8, tracks: { tapR: [[0, 0], ...env([0.0, 4.0]).slice(1)], tapL: [[0, 0], ...env([2.0, 6.0])] } },
  pose: {
    base: {
      pelvis: [-0.42, 0.40, 0],
      hips: { up: [1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], TH], [[1, 0, 0], 0]] },
      hands: {
        // body right = +Z. right hand plants at +Z and taps the LEFT shoulder (rest +X side) - and vice versa
        right: { plant: floorHand(HZ), free: { mode: 'free', frame: 'chest', palmAt: [0.188, 1.443, -0.001], finger: [0.35, 0.25, -0.9], normal: [-0.1, -0.95, -0.3], poleUp: [-0.10, 1.12, 0.40] }, w: 0, arc: 0.10, arcDir: [0.98, -0.2, 0], touch: { clear: 0.0015, from: 0.7 } },
        left: { plant: floorHand(-HZ), free: { mode: 'free', frame: 'chest', palmAt: [-0.188, 1.443, -0.001], finger: [-0.35, 0.25, -0.9], normal: [0.1, -0.95, -0.3], poleUp: [0.10, 1.12, 0.40] }, w: 0, arc: 0.10, arcDir: [0.98, -0.2, 0], touch: { clear: 0.0015, from: 0.7 } },
      },
      feet: {
        right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: 66 },
        left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: 66 },
      },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5, weight: 1 }, { type: 'reach', limb: 'leftArm', angle: 178.5, weight: 1 },
        { type: 'reach', limb: 'rightLeg', angle: 178, weight: 1 }, { type: 'reach', limb: 'leftLeg', angle: 178, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [0, 0, 1], value: 0, weight: 0.3 },
      ],
      solve: { vars: ['px', 'py', 'pz', 'h0', 'h1'], reg: { px: 1, py: 1, pz: 1, h0: 0.05, h1: 0.4 } },
    },
    deltas: {
      // param = absolute values at 1
      tapR: { hands: { right: { w: 1 } }, constraints: [{}, {}, {}, {}, { value: -0.008 }] },
      tapL: { hands: { left: { w: 1 } }, constraints: [{}, {}, {}, {}, { value: 0.008 }] },
    },
  },
  highlight: { groups: ['rotator-cuff'], side: 'both', pulseAt: [0.875, 2.875, 4.875, 6.875], pulseWidth: 0.4, pulseBase: 0.25 },
  camera: { dir: [1, 0.68, 0.0], driftPeriod: 4, // camera sways +-28 deg so each tapping hand is seen from its own side (tapR at 0.875 s -> camera at -Z)
    fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.16, k: 1.0, drift: 28 },
  frame: { mode: 'fit', width: 820, height: 760, cx: 512, cy: 520 },
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'rightToe', mid: 'pelvis', rx: 70, ry: 16, a: 0.28, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [-0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0, 0.875, 2.875],
  qa: {
    pins: [{ c: 'handR', when: 'locked.right' }, { c: 'handL', when: 'locked.left' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172, when: 'locked.right' }, { j: 'elbow.left', min: 172, when: 'locked.left' }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    touch: [{ side: 'right', when: 'params.tapR>0.999' }, { side: 'left', when: 'params.tapL>0.999' }],
    allowContact: ['handR|upperArmL', 'handL|upperArmR', 'handR|torso', 'handL|torso', 'forearmR|torso', 'forearmL|torso'],
  },
};
