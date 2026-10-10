// serratus-A 俯撑肩胛前伸 (push-up plus). High plank, arms locked straight the whole time; only the shoulder blades move:
// the chest sinks between the shoulders (retraction), then the floor is pushed away and the upper back rounds (protraction).
// Implemented with shoulders.shift (scapula moves against the chest; the solver keeps both arms straight, so the body rises/falls).
// Head points -X, body faces the floor, body left = +Z. Rest chest frame: +Z = front (toward the floor here), -Z = back.
const TH = -17;
const HZ = 0.19, FX = 1.21, FZ = 0.10;
// v2: two identical 3 s reps, including the wrap at 6 s: 0.3 s neutral, 1.0 s sink (scap -1), 1.0 s push to full protraction
// (scap +1), 0.3 s hold, 0.4 s back to neutral (v1's last key sat at 5.9 s, so the loop snapped back in 0.1 s)
const floorHand = (z, side) => ({ mode: 'floor', at: [0, z], finger: [-1, Math.sign(z) * 0.08], poleUp: [side === 'right' ? -0.30 : 0.30, 0.95, 0.10] });
export default {
  id: 'serratus-A', name: '俯撑肩胛前伸', nameEn: 'Push-Up Plus',
  timeline: { duration: 6, tracks: { scap: [[0, 0], [0.3, 0], [1.3, -1], [2.3, 1], [2.6, 1], [3.0, 0], [3.3, 0], [4.3, -1], [5.3, 1], [5.6, 1]] } },
  pose: {
    base: {
      pelvis: [0.42, 0.40, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], TH]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      shoulders: { shift: [0, 0, 0] },
      hands: { right: floorHand(-HZ, 'right'), left: floorHand(HZ, 'left') },
      feet: { right: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: 64 }, left: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: 64 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'reach', limb: 'rightLeg', angle: 178 }, { type: 'reach', limb: 'leftLeg', angle: 178 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.08 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.08 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.0, weight: 0.08 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
    },
    deltas: { scap: { shoulders: { shift: [0, 0, 0.03] } } },   // scap = +1 protraction (+3 cm), -1 retraction (-3 cm)
  },
  highlight: { groups: ['serratus'], side: 'both', pulseAt: [2.45, 5.45], pulseWidth: 0.6, pulseBase: 0.25 },
  camera: { dir: [-0.55, 0.42, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.12, k: 0.6, drift: 0.9 },
  frame: { mode: 'fit', width: 800, cx: 512, cy: 520 },
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'leftPalm', rx: 50, ry: 13, a: 0.7 }, { j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'rightToe', mid: 'pelvis', rx: 70, ry: 16, a: 0.28, dy: 6, sag: 0.3 }] },
  props: [{ type: 'mat', at: [0.55, 0, 0], size: [1.83, 0.61, 0.006] }],
  keyFrames: [0.15, 1.3, 2.45],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 172 }, { j: 'elbow.left', min: 172 }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso'],
  },
};
