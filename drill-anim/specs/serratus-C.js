// serratus-C 吊环俯卧撑加前伸 (ring push-up plus). Head points -X, body faces the floor, body left = +Z.
// Low rings (grip section GY above the floor) hang at z = +-RZ under the shoulders; the hands sit on the ring's lower section in the
// dip-bar neutral grip (ring tangent along X, fingers down and out, palm down and in, ring in the finger-root crease) and never move.
// Each ring leans 35 deg outward so its upper half and the strap clear the forearm (cue: rings stay close to the body, not flared).
// 'd' = push-up depth (elbows 178.5 -> 82 deg, rigid plank pivoting on the toes); 'scap' = the "plus": at the top the shoulder
// blades protract 3 cm (upper back rounds) and hold.
// Loop 8 s = 2 even reps of 4 s: 1.2 s down / 0.2 s bottom / 1.0 s press / 0.5 s plus / 0.6 s hold / 0.5 s release.
const TH = -24;
const RZ = 0.22, GY = 0.17, BR = 0.014, GS = 0.0, FX = 1.13, FZ = 0.10, TILT = 35 * Math.PI / 180;
const A = 65 * Math.PI / 180, GF = 0.148, GN = 0.035 + (BR - 0.016);
const fdir = sg => [0, -Math.sin(A), sg * Math.cos(A)], ndir = sg => [0, -Math.cos(A), -sg * Math.sin(A)];
const wristAt = sg => { const f = fdir(sg), n = ndir(sg); return [GS - f[0] * GF - n[0] * GN, GY - f[1] * GF - n[1] * GN, sg * RZ - f[2] * GF - n[2] * GN]; };
const hand = sg => ({ mode: 'free', frame: 'world', wrist: wristAt(sg), finger: fdir(sg), normal: ndir(sg), poleUp: [sg * 0.24, 0.92, 0.05] });
const ring = sg => ({ grip: [0, GY, sg * RZ], axis: [1, 0, 0], up: [0, Math.cos(TILT), sg * Math.sin(TILT)], anchor: [0, 2.9, sg * (RZ + 0.30)] });
const rep = s => [[s, 0], [s + 1.2, 1], [s + 1.4, 1], [s + 2.4, 0]];
const plus = s => [[s + 2.4, 0], [s + 2.9, 1], [s + 3.5, 1], [s + 4.0, 0]];
export default {
  id: 'serratus-C', name: '吊环俯卧撑加前伸', nameEn: 'Ring Push-Up Plus',
  timeline: { duration: 8, tracks: { d: [...rep(0), ...rep(4)], scap: [[0, 0], ...plus(0), ...plus(4)] } },
  pose: {
    base: {
      pelvis: [0.42, 0.45, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], TH]] },
      chest: { waist: [[[0, 0, 1], 0]] },
      shoulders: { shift: [0, 0, 0] },
      hands: { right: hand(-1), left: hand(1) },
      feet: { right: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: 64 }, left: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: 64 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'reach', limb: 'rightLeg', angle: 178 }, { type: 'reach', limb: 'leftLeg', angle: 178 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.08 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.08 },
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: 0.0, weight: 0.08 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 1, py: 1, h0: 0.01 } },
    },
    deltas: {
      d: { constraints: [{ angle: 82 }, { angle: 82 }, {}, {}, {}, {}, { value: -0.05 }] },
      scap: { shoulders: { shift: [0, 0, 0.03] } },
    },
  },
  highlight: { groups: ['serratus'], side: 'both', pulseTrack: 'scap', pulseBase: 0.35 },
  camera: { dir: [1.1, 0.35, 1], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.14, k: 0.6, drift: 2, at: 0 },   // v2: was [0.18, 0.42, 1] / drift 4 - the near strap crossed the neck at f0/f120; now the near strap stays >=59 px from the head centre (head r 39 px) all loop
  frame: { mode: 'fit', width: 800, cx: 512, cy: 560 },
  shadow: { joints: ['rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'rightToe', mid: 'pelvis', rx: 70, ry: 16, a: 0.22, dy: 6, sag: 0.3 }] },
  props: [{ type: 'rings', r: BR, rings: [ring(-1), ring(1)] }],
  keyFrames: [0.6, 1.3, 3.2],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176, when: 'params.d<0.001' }, { j: 'elbow.left', min: 176, when: 'params.d<0.001' }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }],
    allowContact: ['upperArmR|torso', 'upperArmL|torso', 'forearmR|torso', 'forearmL|torso'],
  },
};
