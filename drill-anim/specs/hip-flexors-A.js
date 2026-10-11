// hip-flexors-A 坐姿直腿抬腿（压缩）(seated pike leg lifts, compression), v2. Long sit, legs straight and together; the torso
// leans FORWARD over the legs (pelvis tipped forward + rounded upper back) and the hands are flat on the mat beside the knees
// (HZ 0.22: at 0.17 the hands sat 22.7 mm inside the shins),
// elbows nearly straight; both straight legs lift off the mat (heels ~6 cm up), hold, lower. v1 leaned back 34° with the hands
// behind the hips - the drill's listed mistake. Side camera so the heel lift reads.
// Front (legs) points +X, up +Y, body left = -Z.
const HX = 0.42, HZ = 0.22, FX = 0.83, FZ = 0.07, LIFT = 0.06, PT = 18, WB = 18;
const floorHand = (z, side) => ({ mode: 'floor', at: [HX, z], finger: [1, Math.sign(z) * 0.15], poleUp: [side === 'right' ? -0.35 : 0.35, 1.0, -0.3] });
export default {
  id: 'hip-flexors-A', name: '坐姿直腿抬腿（压缩）', nameEn: 'Seated Pike Leg Lifts',
  timeline: { duration: 8, tracks: { lift: [[0, 0], [0.4, 0], [1.2, 1], [2.6, 1], [3.4, 0], [4.4, 0], [5.2, 1], [6.6, 1], [7.4, 0]] } },
  pose: {
    base: {
      pelvis: [0.0, 0.135, 0],
      hips: { up: [0, 1, 0], front: [1, 0, 0], rot: [[[0, 0, 1], -PT]] },
      chest: { waist: [[[0, 0, 1], -WB]] },
      shoulders: { shift: [0, -0.04, 0] },
      hands: { right: floorHand(HZ, 'right'), left: floorHand(-HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, FZ], heading: 90, pitch: -60, lift: 0 }, left: { mode: 'floor', at: [FX, -FZ], heading: 90, pitch: -60, lift: 0 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 177 }, { type: 'reach', limb: 'leftArm', angle: 177 },
        { type: 'reach', limb: 'rightLeg', angle: 178.5, weight: 2 }, { type: 'reach', limb: 'leftLeg', angle: 178.5, weight: 2 },
        { type: 'joint', joint: 'pelvis', axis: [0, 1, 0], value: 0.133, weight: 0.5 },
      ],
      solve: { vars: ['px', 'py', 'h0', 'c0'], reg: { px: 1, py: 0.2, h0: 1, c0: 0.5 } },
    },
    deltas: { lift: { feet: { right: { lift: LIFT }, left: { lift: LIFT } } } },
  },
  highlight: { groups: ['hip-flexors'], panels: ['quadRect'], side: 'both',   // + rectus femoris (the app lists 髂腰肌 · 股直肌 for this group): the iliopsoas patch hides in the hip fold when leaning forward
    pulseAt: [1.9, 5.9], pulseWidth: 0.8, pulseBase: 0.25 },
  camera: { dir: [0.1, 0.24, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftKnee'], pad: 0.14, k: 0.85, drift: 0.9, at: 1.9 },
  frame: { mode: 'fit', width: 860, cx: 512, cy: 560 },
  stillAt: 1.9,
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightAnkle', 'leftAnkle', 'pelvis'],
    blobs: [{ j: 'rightPalm', rx: 45, ry: 12, a: 0.7 }, { j: 'leftPalm', rx: 45, ry: 12, a: 0.7 }, { j: 'pelvis', rx: 90, ry: 22, a: 0.55 }],
    bands: [{ from: 'pelvis', to: 'rightAnkle', mid: 'pelvis', rx: 50, ry: 12, a: 0.25, dy: 4, sag: 0.2 }] },
  props: [{ type: 'mat', at: [0.35, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.2, 0.8, 1.9],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'params.lift<0.001' }, { c: 'footL', when: 'params.lift<0.001' }],
    straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: ['handR|thighR', 'handL|thighL', 'forearmR|thighR', 'forearmL|thighL', 'thighL|thighR', 'shinL|shinR', 'footL|footR'],
  },
};
