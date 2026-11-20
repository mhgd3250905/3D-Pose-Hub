// t-neck-wrist-finger-wakeup 站姿颈-腕-指唤醒 (standing neck / wrist / finger wake-up, non-weight-bearing) · Flare 2.0 warm-up v2,
// r2 batch 1 (2026-11-21). Standard: tools/flare2-moves-r2/standards/t-neck-wrist-finger-wakeup.md.
// Standing tall, feet hip-width. One 21 s loop = the three parts in order (45 s dose ~ 2 loops):
//   A 0-6.6 s   slow neck half-rolls, both directions: right ear toward the right shoulder -> chin down -> left ear to the left
//               shoulder and back. Never past the side: no backward head tilt (head extension 0 by construction).
//   B 6.6-14.6 s hands rise to the chest, fingers spread, palms press together (合掌; r2 fallback from interlaced fingers), the joined
//               hands draw two slow horizontal figure-8s (the wrists roll / bend with it), then unclasp.
//   C 14.6-21 s arms forward at chest height, palms down: make a fist / spread the fingers wide x3, then the arms come down.
// The hub rig draws no head or finger motion, so the head roll and every finger pose are V5-only (spec v5r2, read by
// tools/flare2-moves-r2/v5/v5r2-ext.js); the hub solves the body, arms and wrists. Frame: head +Y, front +Z, body left +X.
import { build, armWrist, armDir, sg, r4 } from '../lib/home-anim.mjs';
import { mix, perFrame, win, V } from '../lib/flare2-r2.mjs';
const DUR = 21, PELY = 0.957, FX = 0.10;
// ---- part A: head (deg; flex + chin down, lat + right ear to right shoulder)
const LAT = 38, FLEX = 34;
const headAt = t => {
  if (t < 0.6 || t > 7.0) return [0, 0, 0];
  if (t < 1.4) { const w = win(t, 0.6, 1.4); return [0, LAT * w, 0]; }               // neutral -> right tilt
  if (t < 6.2) { const half = t < 3.8 ? (t - 1.4) / 2.4 : 1 - (t - 3.8) / 2.4;        // R -> chin down -> L -> back to R
    const ph = Math.PI * (0.5 - 0.5 * Math.cos(Math.PI * half)); return [FLEX * Math.sin(ph), LAT * Math.cos(ph), 0]; }
  const w = win(t, 6.2, 7.0); return [0, LAT * (1 - w), 0];                           // right tilt -> neutral
};
// ---- arms. hang = relaxed at the sides; clasp = palms together in front of the chest; fwd = forward, palms down (part C)
const hangW = s => r4(armWrist(s, 3, 7, 0.481)), hangF = s => r4(armDir(s, 3, 7));
const hangN = s => [-sg(s), 0.05, 0.02];                                               // palm toward the thigh
// r2 fallback (2026-11-21): palms pressed together (合掌) instead of interlaced fingers - the interlace searched offline still
// read as crossed wrists with fingers poking through in the sandbox close-ups, so the wrists circle with the palms together.
const C0 = [0, 1.20, 0.27], G = 0.027, DY = 0, TW = 0;   // clasp centre, half wrist gap (palm surfaces touch), no offset
const F0 = V.norm([0, 0.80, 0.60]);                                                    // fingers: up and forward (prayer hands)
// clasp motion: horizontal figure-8 of the clasp centre + roll / pitch of the clasp (wrists circle with it)
const FIG0 = 8.4, FIG = 2.4;
const fig = t => { const u = t < FIG0 || t > FIG0 + 2 * FIG ? 0 : (t - FIG0) / FIG; const a = 2 * Math.PI * u;
  return { c: [0.055 * Math.sin(a), 0.03 * Math.sin(2 * a), 0.01 * Math.sin(2 * a)], roll: 24 * Math.sin(a), pitch: 14 * Math.sin(2 * a) }; };
const claspPose = (s, t, gap) => { const f = fig(t); const off = [sg(s) * gap, s === 'right' ? DY : -DY, 0];   // right wrist at -X (body right), right hand higher
  const o = V.rot(V.rot(off, [0, 0, 1], f.roll), [1, 0, 0], -f.pitch), fd = V.rot(V.rot(F0, [0, 0, 1], f.roll), [1, 0, 0], -f.pitch);
  return { w: V.add(V.add(C0, f.c), o), f: fd }; };
// palm normals: right palm faces +X (toward the left hand), left palm faces -X
const palmN = s => s === 'right' ? [1, 0, 0] : [-1, 0, 0];
const clasp = (s, t, gap) => { const p = claspPose(s, t, gap); const f = fig(t), n = V.rot(V.rot(palmN(s), [0, 0, 1], f.roll), [1, 0, 0], -f.pitch);
  return { w: p.w, f: V.rot(p.f, n, TW), n }; };
const fwdW = s => [sg(s) * 0.15, 1.19, 0.36], fwdF = [0, -0.08, 1], fwdN = [0, -1, 0];
// arm blend weights: A hang, B (up 6.6-7.6, approach 7.6-8.0 gap 0.09 -> G, separate 13.6-14.0, down/forward 14.0-14.8), C fwd, down 20.2-21
const lerp = (a, b, w) => a.map((x, i) => x + (b[i] - x) * w);
const armAt = (s, t) => {
  const H = { w: hangW(s), f: hangF(s), n: hangN(s) };
  if (t < 6.6 || t >= 20.9) return H;
  if (t < 7.6) { const w = win(t, 6.6, 7.6), c = clasp(s, t, 0.09); return { w: lerp(H.w, c.w, w), f: V.norm(lerp(H.f, c.f, w)), n: V.norm(lerp(H.n, c.n, w)) }; }
  if (t < 13.6) { const g = 0.09 + (G - 0.09) * win(t, 7.6, 8.0); return clasp(s, t, g); }
  if (t < 14.0) { const g = G + (0.09 - G) * win(t, 13.6, 14.0); return clasp(s, t, g); }
  const c = clasp(s, 14.0, 0.09), Fw = { w: fwdW(s), f: V.norm(fwdF), n: fwdN };
  if (t < 14.8) { const w = win(t, 14.0, 14.8); return { w: lerp(c.w, Fw.w, w), f: V.norm(lerp(c.f, Fw.f, w)), n: V.norm(lerp(c.n, Fw.n, w)) }; }
  if (t < 20.2) return Fw;
  const w = win(t, 20.2, 20.9); return { w: lerp(Fw.w, H.w, w), f: V.norm(lerp(Fw.f, H.f, w)), n: V.norm(lerp(Fw.n, H.n, w)) };
};
// ---- fingers (V5 only)
const REPS = [15.0, 16.6, 18.2];   // each: fist 0-0.45, hold to 0.65, spread 0.65-1.1, hold to 1.45, ease to rest 1.45-1.6 (last rep: spread held)
const handAt = (s, t) => {
  if (t < 6.6) return mix({ relax: 1 });
  if (t < 7.6) { const w = win(t, 6.6, 7.6); return mix({ relax: 1 - w, spread: w }); }
  if (t < 8.0) return mix({ spread: 1 });
  if (t < 8.4) { const w = win(t, 8.0, 8.4); return mix({ spread: 1 - w }); }
  if (t < 13.2) return mix({});
  if (t < 13.6) { const w = win(t, 13.2, 13.6); return mix({ spread: w }); }
  if (t < 15.0) { const w = win(t, 13.6, 14.6); return mix({ spread: 1 - w, rest: w }); }
  for (const r of REPS) if (t >= r && t < r + 1.6) { const a = t - r;
    if (a < 0.65) { const w = win(a, 0, 0.45); return mix({ rest: 1 - w, fist: w }); }
    if (a < 1.45 || r === REPS[2]) { const w = win(a, 0.65, 1.1); return mix({ fist: 1 - w, spread: w }); }
    const w = win(a, 1.45, 1.6); return mix({ spread: 1 - w, rest: w }); }
  if (t < 19.8) return mix({ rest: 1 });
  const w = win(t, 19.8, 20.9); return mix({ spread: 1 - w, relax: w });
};
const pole = (s, t) => { const k = t < 6.6 || t >= 20.9 ? 0 : t < 7.6 ? win(t, 6.6, 7.6) : t < 20.2 ? 1 : 1 - win(t, 20.2, 20.9);
  return r4(lerp([sg(s) * 0.25, 1.0, -0.8], [sg(s) * 0.6, 0.85, -0.1], k)); };
const hand = s => ({ mode: 'free', frame: 'chest', wrist: t => r4(armAt(s, t).w), finger: t => r4(armAt(s, t).f), normal: t => r4(armAt(s, t).n), poleUp: t => pole(s, t) });
const P = build(DUR, {
  pelvis: [0, PELY, 0.012],
  hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 2]] },
  chest: { waist: [[[1, 0, 0], 0]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: {
    left: { mode: 'floor', at: [FX, 0.005], heading: 4, pole: [0.25, 0.6, 1] },
    right: { mode: 'floor', at: [-FX, 0.005], heading: -4, pole: [-0.25, 0.6, 1] },
  },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { part: t => (t < 6.6 ? 0 : t < 14.6 ? 1 : 2) });
export default {
  id: 't-neck-wrist-finger-wakeup', name: '站姿颈腕指唤醒', nameEn: 'Standing Neck, Wrist & Finger Wake-Up',
  modelProfile: 'training-human-v2plus', fps: 30, size: 1080, alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' },
  timeline: { duration: DUR, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
  v5r2: { fps: 30, head: perFrame(DUR, headAt).map(r4), hands: { left: perFrame(DUR, t => handAt('left', t)), right: perFrame(DUR, t => handAt('right', t)) } },
  highlight: { groups: ['forearms'], side: 'both', pulseTrack: 'part', pulseBase: 0.3 },
  camera: { dir: [0.25, 0.12, 1], fit: ['head', 'leftToe', 'rightToe', 'pelvis', 'leftPalm', 'rightPalm'], pad: 0.12, k: 1, drift: 0, at: 10 },
  frame: { mode: 'fit', width: 640, height: 860, cx: 512, cy: 512 },
  stillAt: 10,
  shadow: { joints: ['leftToe', 'rightToe', 'leftAnkle', 'rightAnkle', 'pelvis'], blobs: [], bands: [] },
  props: [],
  keyFrames: [3.8, 10.2, 15.5],
  qa: {
    pins: [{ c: 'footL', when: 'always' }, { c: 'footR', when: 'always' }],
    straight: [{ j: 'knee.left', min: 165 }, { j: 'knee.right', min: 165 }],
    allowContact: ['thighL|thighR', 'upperArmL|torso', 'upperArmR|torso', 'forearmL|forearmR'],
  },
  flare2: { version: 'r2', batch: 1, status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false },
};
