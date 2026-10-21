// Chair-supported single-leg hinge: front +X, left = -Z; left stance knee stays softly bent.
// Right palm fixed on stable chair back, right leg follows the flat trunk. 6 to 40 deg hinge, two slow reps/8s.
// Stable non-wheeled chair must not slide or tip. Single-side demonstration; mirror only after checking setup.
const A0 = 6, A1 = 40;                                            // torso pitch forward, deg
const SH = [0.1879, 1.3702, -0.0042], AR = 0.475;              // rest shoulder, relaxed arm radius; wrist forward offset removed to stay reachable
const wr = (x, a) => { const r = a * Math.PI / 180; return [x, +(SH[1] - AR * Math.cos(r)).toFixed(4), +(SH[2] + AR * Math.sin(r)).toFixed(4)]; };
const DUR = 8, K = [[0, 0], [0.3, 0], [1.7, 1], [2.3, 1], [3.7, 0], [4.3, 0], [5.7, 1], [6.3, 1], [7.7, 0]];
const pAt = t => { for (let i = 0; i < K.length; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1] || [DUR, K[0][1]];
  if (t >= ta && t < tb) return va + (vb - va) * (1 - Math.cos(Math.PI * (t - ta) / (tb - ta))) / 2; } return K[0][1]; };
const TS = Array.from({ length: DUR * 30 }, (_, k) => k / 30);
const P = TS.map(t => [+t.toFixed(4), +pAt(t).toFixed(5), 'linear']);
const BOW = TS.map(t => { const p = pAt(t); return [+t.toFixed(4), +(4 * p * (1 - p)).toFixed(5), 'linear']; });
const bowW = x => { const a = wr(x, A0), b = wr(x, A1), m = wr(x, (A0 + A1) / 2); return a.map((v, i) => +(v + m[i] - (a[i] + b[i]) / 2).toFixed(4)); };
const ankR = ph => { const r = ph * Math.PI / 180, dy = -0.7622, dz = -0.0243; return [-0.083, +(0.852 + dy * Math.cos(r) - dz * Math.sin(r)).toFixed(4), +(0.0057 + dz * Math.cos(r) + dy * Math.sin(r)).toFixed(4)]; };
const bowA = (() => { const a = ankR(18), b = ankR(0), m = ankR(9); return a.map((v, i) => +(v + m[i] - (a[i] + b[i]) / 2).toFixed(4)); })();
const hand = (x, a) => ({ mode: 'free', frame: 'chest', wrist: wr(x, a), finger: [0, -Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)], normal: [-Math.sign(x), 0, 0.15], poleUp: [Math.sign(x) * 0.3, 1.2, -0.5] });
export default {
  id: 'o-supported-single-leg-rdl', name: '扶椅单腿髋铰链', nameEn: 'Chair-Supported Single-Leg Hip Hinge',
  modelProfile: 'training-human-v2', alignClavicles: false, fps: 15,
  timeline: { duration: DUR, tracks: { hinge: P, bow: BOW } },
  pose: {
    base: {
      pelvis: [0.0, 0.88, 0],
      hips: { up: [0, 1, 0], front: [1, 0, 0], rot: [[[0, 0, 1], -A0]] },
      hands: { left: hand(0.205, A0), right: {mode:'free',frame:'world',palmAt:[0.417,0.9849,0.205],finger:[1,0,0],normal:[0,-1,0],pole:[0.1,1.1,0.5]} },
      feet: {
        left: { mode: 'floor', at: [0.0, -0.085], heading: 90, pitch: 0 },
        right: { mode: 'free', frame: 'hips', ankle: ankR(18), rot: [[[1, 0, 0], 18]], poleLow: [-0.09, 0.5, 0.6] },
      },
      constraints: [
        { type: 'reach', limb: 'leftLeg', angle: 168, weight: 1 },
        { type: 'joint', joint: 'pelvis', axis: [1, 0, 0], value: 0.0, weight: 0.6 },
        { type: 'joint', joint: 'pelvis', axis: [0, 0, 1], value: 0.0, weight: 0.3 },
      ],
      solve: { vars: ['px', 'py', 'pz'], reg: { px: 0.3, py: 0.3, pz: 0.3 } },
    },
    deltas: {
      hinge: { hips: { rot: [[[0, 0, 1], -A1]] }, hands: { left: hand(0.205, A1) }, feet: { right: { ankle: ankR(0), rot: [[[1, 0, 0], 0]] } },
        constraints: [{}, { value: -0.06 }, {}] },
      bow: { hands: { left: { wrist: bowW(0.205) } }, feet: { right: { ankle: bowA } } },
    },
  },
  highlight: { groups: ['hamstrings','glute-max'], side: 'left', pulseAt: [2.0, 6.0], pulseWidth: 0.7, pulseBase: 0.3 },
  camera: { dir: [-0.2, 0.14, -1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'rightAnkle', 'leftAnkle'], pad: 0.12, k: 0.9, drift: 0, at: 0, fitTimeline:true },
  frame: { mode: 'fit', width: 800, height: 760, cx: 512, cy: 550 },
  stillAt: 0,
  shadow: { joints: ['leftToe', 'leftAnkle', 'pelvis'], blobs: [{ j: 'leftAnkle', dx: 15, rx: 60, ry: 13, a: 0.7 }], bands: [] },
  props: [{type:'chair',at:[0.60,0,0.205],yaw:90,height:0.45,width:0.60,depth:0.42,back:0.58}],
  keyFrames: [0,1,2,3,4,6,7],
  qa: {
    pins: [{ c: 'footL', when: 'always' },{c:'handR',when:'always'}],
    straight: [{ j: 'knee.right', min: 176, when: 'params.hinge>0.6' }, { j: 'knee.left', min: 160 }],
    allowContact: [],
  },
};
