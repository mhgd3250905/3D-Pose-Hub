import { gripPose } from '../lib/grip.mjs';
// chest-B 平行杆深幅俯卧撑 (deep parallette push-up). Head points -X, body faces the floor, body left = +Z.
// Neutral grip: the bars run along X at z = +-BZ (bar centre height BH); both hands are world-pinned on the bars for the
// whole loop (same relaxed-hand grip fit as triceps-B). Rigid plank pivoting about the tucked toes; 'down' bends the elbows
// (about 45 deg from the ribs) until the chest sinks between the hands, below bar height; at the top 'prot' pushes the
// shoulder blades forward (protraction). 2 reps per 7 s loop.
const BZ = 0.21, BH = 0.16;   // v2: bars 0.42 apart so the wrists (now straight over the bars, closed grip) stay where v1 had them (+-0.19)
const A = 30 * Math.PI / 180, GF = 0.148, GN = 0.035;   // hand tilt (palm mostly down, fingers out over the bar) + bar centre in the hand frame (fit shared with triceps-B)
const fdir = sg => [0, -Math.sin(A), sg * Math.cos(A)], ndir = sg => [0, -Math.cos(A), -sg * Math.sin(A)];
const wristAt = sg => { const f = fdir(sg), n = ndir(sg); return [-f[0] * GF - n[0] * GN, BH - f[1] * GF - n[1] * GN, sg * BZ - f[2] * GF - n[2] * GN]; };
// body right = -Z (rest -X): the elbow pole sits behind and outside the elbow so the elbows travel back at ~45 deg
// v2: closed power grip round the bar (baked fist, lib/grip.mjs + gripHand props): wrist over the bar, thumb toward the head, palm facing in
const hand = (sg, side) => ({ mode: 'free', frame: 'world', ...gripPose(side, [0, BH, sg * BZ], [-1, 0, 0], [0, 0, sg]), poleUp: [side === 'right' ? -0.30 : 0.30, 0.92, 0.06] });
const FX = 1.12, FZ = 0.10;
const rep = s => [[s + 0.6, 0], [s + 2.0, 1], [s + 2.25, 1], [s + 3.3, 0]];   // 0.6 s top, 1.4 s down, 0.25 s bottom, 1.05 s press
export default {
  id: 'chest-B', name: '平行杆深幅俯卧撑', nameEn: 'Deep Parallette Push-Up',
  timeline: { duration: 7, tracks: {
    down: [[0, 0], ...rep(0), ...rep(3.5)],
    prot: [[0, 1], [0.35, 0], [3.25, 0], [3.45, 1], [3.5, 1], [3.85, 0], [6.75, 0], [6.95, 1]],
  } },
  pose: {
    base: {
      pelvis: [0.45, 0.62, 0],
      hips: { up: [-1, 0, 0], front: [0, -1, 0], rot: [[[0, 0, 1], -25]] },
      shoulders: { shift: [0, 0, 0] },
      hands: { right: hand(-1, 'right'), left: hand(1, 'left') },
      feet: { right: { mode: 'floor', at: [FX, -FZ], heading: -90, pitch: 62 }, left: { mode: 'floor', at: [FX, FZ], heading: -90, pitch: 62 } },
      constraints: [
        { type: 'reach', limb: 'rightArm', angle: 178.5 }, { type: 'reach', limb: 'leftArm', angle: 178.5 },
        { type: 'reach', limb: 'rightLeg', angle: 179.6, weight: 4 }, { type: 'reach', limb: 'leftLeg', angle: 179.6, weight: 4 },
        { type: 'legAlign', limb: 'rightLeg', flex: 0, weight: 0.6 }, { type: 'legAlign', limb: 'leftLeg', flex: 0, weight: 0.6 },   // v2: 0.08 -> 0.6 keeps the hips straight (plank) at the shallower 72 deg bottom
        { type: 'joint', joint: 'shoulderCenter', axis: [1, 0, 0], value: -0.03, weight: 0.3 },
      ],
      solve: { vars: ['px', 'py', 'h0'], reg: { px: 0.05, py: 0.05, h0: 0.01 } },
    },
    deltas: {
      down: { constraints: [{ angle: 72 }, { angle: 72 }, {}, {}, {}, {}, { value: -0.09, weight: 0.3 }] },
      prot: { shoulders: { shift: [0, 0, 0.025] } },
    },
  },
  highlight: { groups: ['chest'], side: 'both', pulseAt: [2.1, 5.6], pulseWidth: 0.6, pulseBase: 0.25 },
  camera: { dir: [-0.8, 0.18, 0.9], fit: ['head', 'leftPalm', 'rightPalm', 'leftToe', 'rightToe', 'pelvis', 'leftShoulder', 'rightShoulder'], pad: 0.18, k: 1.0, drift: 5, at: 2.0 },
  frame: { mode: 'fit', width: 840, height: 640, cx: 512, cy: 540 },
  shadow: { joints: ['rightPalm', 'leftPalm', 'rightToe', 'leftToe', 'pelvis', 'shoulderCenter'],
    blobs: [{ j: 'rightToe', rx: 34, ry: 10, a: 0.6 }, { j: 'leftToe', rx: 34, ry: 10, a: 0.6 }],
    bands: [{ from: 'shoulderCenter', to: 'rightToe', mid: 'pelvis', rx: 70, ry: 16, a: 0.25, dy: 6, sag: 0.3 }] },
  props: [{ type: 'parallettes', at: [0, 0, 0], yaw: 90, length: 0.42, height: BH, gap: 2 * BZ }, { type: 'gripHand', side: 'right' }, { type: 'gripHand', side: 'left' }],
  qaProps: [-1, 1].map(sg => ({ a: [-0.21, BH, sg * BZ], b: [0.21, BH, sg * BZ], r: 0.016 })),
  keyFrames: [0, 2.1, 3.45],
  qa: {
    pins: [{ c: 'handR', when: 'always' }, { c: 'handL', when: 'always' }, { c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }],
    straight: [{ j: 'elbow.right', min: 176, when: 'params.down<0.001' }, { j: 'elbow.left', min: 176, when: 'params.down<0.001' }, { j: 'knee.right', min: 176 }, { j: 'knee.left', min: 176 }],
    allowContact: [],
  },
};
