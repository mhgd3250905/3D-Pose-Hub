// Thomas supplement r1 (2026-11-19): shared builder for the seated forearm drills t-self-resisted-wrist-flexion,
// t-self-resisted-wrist-extension and t-seated-forearm-rotation. Base = forearms-B-r4 (seated on a flat bench, torso leaning
// 66 deg, right forearm resting on the right thigh with the wrist just past the knee at W = [-0.11, 0.518, 0.46], right forearm roll
// -180 (et1)). Head +Y, front +Z, body left = +X; hands in world coordinates; the body is static (no solver vars).
//  - flex: right palm up; the hand curls up from 30 deg extension to 60 deg flexion and lowers again while the left palm presses
//          down on the right palm (left palm on the right palm, fingers across it toward -X).
//  - ext:  right palm down; the hand lifts from 30 deg flexion to 50 deg extension against the left palm on the back of the hand.
//  - rot:  right hand grips a light dumbbell near one end (handle across the palm, the long end sticking out past the thumb); the
//          forearm stays on the thigh and turns the palm from up (supinated) to down (pronated) and back, 65 deg each way of
//          thumb-up; the left hand rests on the left knee as in forearms-B.
// Hand-on-hand contact is authored geometry (palm centre 85 mm along the fingers from the wrist, hand half-thickness 30 mm), no
// touch solver; left wrist targets the analytic right-palm surface every frame (build(): exact per-frame coordinate tracks).
import base from './forearms-B-r4.js';
import { build, keys } from '../lib/home-anim.mjs';
const W = [-0.11, 0.518, 0.46], DEG = Math.PI / 180, PALM = 0.085, HALF = 0.03, DUR = 8;
const add = (a, b) => a.map((x, i) => x + b[i]), mul = (a, k) => a.map(x => x * k);
const r5 = a => a.map(x => +x.toFixed(5));
export function wristDrill(kind, id, name, nameEn, item) {
  const s = structuredClone(base);
  s.id = id; s.name = name; s.nameEn = nameEn;
  const desc = structuredClone(s.pose.base);
  let extra = {}, hl;
  if (kind === 'flex' || kind === 'ext') {
    // a(t): wrist angle, + = fingers up. flex (palm up): -30 -> +60; ext (palm down): -30 -> +50 (fingers up = extension)
    const lo = -30, hi = kind === 'flex' ? 60 : 50;
    const a = keys([[0, lo], [0.4, lo], [1.9, hi], [2.4, hi], [3.8, lo], [4.0, lo], [4.4, lo], [5.9, hi], [6.4, hi], [7.8, lo]], DUR);
    const up = kind === 'flex' ? 1 : -1;                                        // palm normal at a = 0: up (+Y) or down (-Y)
    const f = t => [0, Math.sin(a(t) * DEG), Math.cos(a(t) * DEG)];
    const n = t => { const r = a(t) * DEG; return [0, up * Math.cos(r), -up * Math.sin(r)]; };    // palm normal, perpendicular to f
    const top = t => kind === 'flex' ? n(t) : mul(n(t), -1);                      // the surface the left palm presses on
    const pc = t => add(add(W, mul(f(t), PALM)), mul(top(t), HALF));
    desc.hands.right = { mode: 'free', frame: 'world', relax: 0.15, wrist: W, finger: t => r5(f(t)), normal: t => r5(n(t)), pole: [-0.11, 0.3, 0.2],
      elbowTwist: kind === 'flex' ? s.pose.base.hands.right.elbowTwist : s.pose.base.hands.right.elbowTwist + 180,
      upperArmTwist: s.pose.base.hands.right.upperArmTwist ?? 0 };
    // left palm on that surface: palm normal = -top, fingers across toward -X, wrist PALM back along +X and HALF off the surface
    desc.hands.left = { mode: 'free', frame: 'world', relax: 0.1, wrist: t => r5(add(add(pc(t), mul(top(t), HALF)), [PALM, 0, 0])), finger: [-1, 0, 0], normal: t => r5(mul(top(t), -1)),
      poleUp: [0.6, 0.7, -0.3], upperArmTwist: 0, elbowTwist: 0 };
    extra = { effort: t => (a(t) - lo) / (hi - lo) };
    hl = { groups: ['forearms'], side: 'right', pulseTrack: 'effort', pulseBase: 0.35 };
  } else {
    // forearm rotation: thumb-up (r = 0) to palm up (r = +65) and palm down (r = -65); 1 rep = up -> down -> up (4 s), 2 reps
    const r = keys([[0, 65], [0.3, 65], [1.9, -65], [2.2, -65], [3.8, 65], [4.0, 65], [4.3, 65], [5.9, -65], [6.2, -65], [7.8, 65]], DUR);
    // fingers point forward along the forearm (+Z); thumb-up palm normal points toward -X... body midline (+X); roll about +Z
    const n = t => { const q = r(t) * DEG; return [Math.cos(q), Math.sin(q), 0]; };                    // r=+90 would be palm up
    desc.hands.right = { mode: 'free', frame: 'world', relax: 0, wrist: W, finger: [0, 0, 1], normal: t => r5(n(t)), pole: [-0.11, 0.3, 0.2],
      elbowTwist: t => r(t), upperArmTwist: 0 };   // forearm roll follows the hand (h-standing-forearm-rotation convention: 0 = thumb up)
    // left hand stays on the left knee as authored in forearms-B, but without its touch solve: the per-frame contact search made
    // every solve ~5x slower and the browser preview never finished; the authored wrist already rests on the knee (static body).
    delete desc.hands.left.touch;
    extra = { effort: t => Math.abs(r(t)) / 65 };
    hl = { groups: ['forearms'], side: 'right', pulseTrack: 'effort', pulseBase: 0.35 };
  }
  const P = build(DUR, desc, extra);
  s.timeline = { duration: DUR, tracks: P.tracks };
  s.pose = { base: P.base, deltas: { ...P.deltas, effort: {} } };
  s.highlight = hl;
  s.props = s.props.filter(p => p.type === 'bench' || (kind === 'rot' && (p.type === 'gripHand' || p.type === 'dumbbell')));
  if (kind === 'rot') {
    // the same dumbbell as forearms-B, slid 0.11 m along the grip axis so the hand holds it near one end (the long end past the thumb)
    const db = s.props.find(p => p.type === 'dumbbell'), g = s.props.find(p => p.type === 'gripHand');
    if (!db || !g) throw Error('forearms-B dumbbell/grip props expected');
    db.offset = db.offset.map((x, i) => +(x + 0.11 * AXIS[i]).toFixed(4)); db.length = 0.28;
  }
  s.keyFrames = kind === 'rot' ? [0.2, 1.1, 2.0] : [0.2, 1.9, 3.8];
  s.stillAt = kind === 'rot' ? 1.1 : 1.9;
  s.camera = { ...s.camera, drift: 0, at: s.stillAt };
  s.qa = { ...s.qa, touch: [], allowContact: [...s.qa.allowContact, 'handL|handR', 'forearmL|forearmR', 'handL|forearmR'] };
  s.thomasSupplement = { version: 'r1', item, status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
  return s;
}
import { G as GRIP } from '../lib/grip.mjs';
const AXIS = GRIP.right.a;
