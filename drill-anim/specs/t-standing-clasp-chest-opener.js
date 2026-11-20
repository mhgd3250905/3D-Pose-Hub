// t-standing-clasp-chest-opener 背后十指交扣扩胸（站姿） (standing chest opener, fingers interlaced behind the back) · Flare 2.0 r3
// batch 2b (2026-11-21), new id. Standard: tools/flare2-moves-r3/standards/t-standing-clasp-chest-opener.md.
// Standing tall, feet hip-width. The hands are behind the back with the fingers interlaced (palms facing each other) resting low on the
// back, elbows soft. Then the elbows straighten and the clasped hands draw down and back AWAY from the body (shoulder extension ~40 deg),
// the shoulder blades squeeze together and down, the chest lifts and opens (small upper-back extension, ribs not flaring, no leaning
// forward); hold; release back to the start. Symmetric (no mirror).
// Facing +Z, head +Y, body left = +X. Hands = free in the chest frame. The clasp = the interlace of t-neck-wrist-finger-wakeup r2 (V5
// finger shape SHAPES.interlace, searched in r2 against the hand-vs-hand clash check: right hand 15.2 mm "higher" across the finger axis,
// each hand turned 10 deg about its palm normal; r3 2b: middle/end finger joints curled +38/+22 deg so the fingers wrap the back of
// the other hand, half palm gap 20.4 -> 23.5 mm, clash 5.9 mm in the sandbox), rotated from "fingers forward" (in front of the chest) to "fingers down
// and back along the arms" (about the body's left-right axis by 90 deg + the shoulder-extension angle).
// Loop 8 s: 0-0.8 s start (hands clasped low on the back), 0.8-2.3 s straighten + lift back, 2.3-6.3 s hold, 6.3-7.6 s release.
import { build, keys, sg, r4 } from '../lib/home-anim.mjs';
import { SHAPES, perFrame, V } from '../lib/flare2-r3.mjs';
const DUR = 8;
// clasp finger pose: the r2 interlace (MCP spread / interleave) with the middle and end finger joints curled further so the fingers wrap
// over the back of the other hand instead of poking straight out past it (sandbox close-up, r3 2b)
const CLASP = SHAPES.interlace.map((x, i) => (i < 16 && (i % 4 === 1 || i % 4 === 2)) ? x + (i % 4 === 1 ? 38 : 22) : x);
const p = keys([[0, 0], [0.8, 0], [2.3, 1], [6.3, 1], [7.6, 0]], DUR);
const PHI0 = 20, PHI1 = 40;                       // clasp angle behind the trunk (shoulder extension of the arm line), start / hold, deg
const UA = 0.2567, FA = 0.2281, reach = e => Math.sqrt(UA * UA + FA * FA - 2 * UA * FA * Math.cos(e * Math.PI / 180));
const E0 = 150, E1 = 178;                         // elbow angle start (soft) / hold (straight)
const G = 0.0235, DY = 0.0152, TW = -10;          // r2 interlace geometry (right hand offset across the fingers, twist); half palm gap 20.4 -> 23.5 mm for the curled fingers (clash 5.9 mm)
const F0 = V.norm([0, 0.26, 0.97]);               // r2 finger axis of the front clasp (fingers forward, a bit up)
const SHX = 0.1879, SHY = 1.3702, SHZ = -0.0042;  // rest shoulder joints (lib/ss-geo REST)
const SHIFT = t => r4([0, -0.006 * p(t), -0.016 * p(t)]);   // shoulder blades back and down at the hold
const phi = t => PHI0 + (PHI1 - PHI0) * p(t), elb = t => E0 + (E1 - E0) * p(t);
// clasp centre (chest rest frame): on the mid-line, at the elbow's reach from the shoulders, angle phi behind the trunk
const centre = t => { const R = reach(elb(t)), lat = SHX - G, D = Math.sqrt(R * R - lat * lat), a = phi(t) * Math.PI / 180, s = SHIFT(t);
  return [0, SHY + s[1] - D * Math.cos(a), SHZ + s[2] - D * Math.sin(a)]; };
// front clasp -> behind: rotate about +X by 90 + phi (Z -> fingers down and back)
const toBack = (v, t) => V.rot(v, [1, 0, 0], 90 + phi(t));
const palmN = s => s === 'right' ? [1, 0, 0] : [-1, 0, 0];   // right palm faces +X (toward the left hand), left palm -X
const clasp = (s, t) => { const off = toBack([sg(s) * G, s === 'right' ? DY : -DY, 0], t), n = palmN(s);
  return { w: V.add(centre(t), off), f: V.rot(toBack(F0, t), n, TW), n }; };
const hand = s => ({ mode: 'free', frame: 'chest', relax: 0,
  wrist: t => r4(clasp(s, t).w), finger: t => r4(V.norm(clasp(s, t).f)), normal: palmN(s),
  poleUp: t => { const a = phi(t) * Math.PI / 180; return r4([sg(s) * 0.42, SHY - 0.26 * Math.cos(a), SHZ - 0.26 * Math.sin(a) - 0.12]); } });
const P = build(DUR, {
  pelvis: [0, 0.9519701718590191, 0.00404579831150554],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] },
  chest: { waist: [[[1, 0, 0], t => +(-5 * p(t)).toFixed(3)]] },
  shoulders: { shift: SHIFT },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [0.12, 0.0], heading: 6, pitch: 0, poleLow: [0.2, 0.55, 1] },
    right: { mode: 'floor', at: [-0.12, 0.0], heading: -6, pitch: 0, poleLow: [-0.2, 0.55, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { open: p });
export default {
  id: 't-standing-clasp-chest-opener', name: '背后十指交扣扩胸', nameEn: 'Standing Clasped-Hands Chest Opener',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  v5: { scapulaShift: true },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  v5r2: { fps: 30, hands: { left: perFrame(DUR, () => CLASP), right: perFrame(DUR, () => CLASP) } },
  highlight: { groups: ['chest', 'deltoids'], side: 'both', pulseTrack: 'open', pulseBase: 0.3 },
  camera: { dir: [-1, 0.12, -0.45], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm', 'leftElbow', 'rightElbow'], pad: 0.15, k: 0.85, drift: 0, at: 4, fitTimeline: true },
  frame: { mode: 'fit', width: 640, height: 900, cx: 512, cy: 505 },
  stillAt: 4,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'],
    blobs: [{ j: 'leftAnkle', rx: 44, ry: 11, a: 0.6 }, { j: 'rightAnkle', rx: 44, ry: 11, a: 0.6 }], bands: [] },
  props: [],
  keyFrames: [0.4, 2.3, 4.0, 7.0],
  qa: { pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }], straight: [], allowContact: [] },
  flare2: { version: 'r3', batch: '2b', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false,
    doseBrief: '表：静态拉伸；草稿保持 20 秒 × 2 次（秒数/次数待定）', doseStatus: 'draft (AI, 开哥 to confirm)' },
};
