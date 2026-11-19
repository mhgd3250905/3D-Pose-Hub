// Thomas supplement r2 (2026-11-19): shared builder for the seated forearm drills t-self-resisted-wrist-flexion (6a),
// t-self-resisted-wrist-extension (6b) and t-seated-forearm-rotation (7). Replaces _thomas-sup-wrist-r1.mjs.
// Why r2: r1 took forearms-B's torso (chest.body 66 deg = the whole upper body turned rigidly about the pelvis pivot). The V5 spine
// chain cannot reach that torso pivot (fit error 126 mm, 30 mm stretch cap) so the V5 body sat 96 mm off the solved pose and the
// drawn forearm floated above the thigh. r2 leans the way a person does on a bench: pelvis tipped forward (hips.rot) plus a modest
// waist bend (chest.waist, about the waist joint), which the V5 spine follows (see tools/thomas-sup/standards/<id>.md).
// Head +Y, front +Z, body left = +X; hands in world coordinates; the body is static (no solver vars). Only the right side moves
// (the App mirrors for the left side).
//  - flex: right palm up, forearm on the right thigh, wrist just past the knee; the hand curls up from extension into flexion
//          against the left palm pressing on the right palm (fingers across), and lowers again under control.
//  - ext:  right palm down; the hand lifts from flexion into extension against the left palm on the back of the hand.
//  - rot:  right hand grips a light dumbbell near one end; the forearm stays on the thigh and turns the palm from up to down and
//          back about the forearm axis; the left hand rests on the left thigh.
import { build, keys } from '../lib/home-anim.mjs';
import { G as GRIP, gripAttach } from '../lib/grip.mjs';
const DEG = Math.PI / 180, DUR = 8;
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], unit = a => mul(a, 1 / Math.hypot(...a));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const r5 = a => a.map(x => +x.toFixed(5));
// rotate v about unit axis k by angle (Rodrigues)
const rot = (v, k, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c))); };

export const P = {
  pelvis: [0, 0.585, -0.03], hipTilt: 30, waistBend: 26, twist: 0,   // twist: waist turn about +Y (- = chest toward the right side)
  W: [-0.11, 0.518, 0.46], E: [-0.15, 0.53, 0.23],           // right wrist / elbow targets (elbow = where the forearm line starts)
  kneePoleR: [-0.16, 0.5, 1.2], kneePoleL: [0.16, 0.5, 1.2],
  pole: [-0.13, 0.3, 0.2], poleL: [0.6, 0.7, -0.3],
  palm: 0.085, half: 0.03,                                     // palm centre along the fingers from the wrist; hand half-thickness
  extDeg: 45, flexDeg: 70, elbowTwistR: -180,
  supDeg: 80, proDeg: 80, dbSlide: 0.132,                      // forearm rotation; dumbbell slid along the grip axis (held near one end)
  restL: { wrist: [0.12, 0.57, 0.36], finger: [-0.05, -0.45, 1], normal: [0, -1, -0.3] },
};

export function wristDrill(kind, id, name, nameEn, item, o = {}) {
  const p = { ...P, ...o };
  const W = p.W, fd = unit(sub(W, p.E));                     // forearm direction (elbow -> wrist)
  const lat = unit(cross(fd, [0, 1, 0]));                     // horizontal axis across the forearm (toward body right, -X)
  const upF = unit(cross(lat, fd));                            // up, perpendicular to the forearm
  const s = {
    id, name, nameEn,
    timeline: { duration: DUR, tracks: {} },
    pose: { base: {
      pelvis: p.pelvis,
      hips: { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], p.hipTilt]] },
      chest: { waist: [[[1, 0, 0], p.waistBend], [[0, 1, 0], p.twist]] },
      hands: {},
      feet: {
        right: { mode: 'floor', at: [-0.15, 0.40], heading: -6, pitch: 0, pole: p.kneePoleR },
        left: { mode: 'floor', at: [0.15, 0.40], heading: 6, pitch: 0, pole: p.kneePoleL },
      },
      constraints: [], solve: { vars: [], reg: {} },
    }, deltas: {} },
    camera: { dir: [-1, 0.3, 0.3], fit: ['rightPalm', 'rightElbow', 'rightWrist', 'rightKnee'], pad: 0.12, k: 1.0, drift: 0, at: 2 },
    frame: { mode: 'fit', width: 760, height: 800, cx: 580, cy: 545 },
    shadow: { joints: ['rightToe', 'leftToe', 'rightAnkle', 'leftAnkle', 'pelvis'], blobs: [{ j: 'rightAnkle', rx: 40, ry: 10, a: 0.6 }, { j: 'leftAnkle', rx: 40, ry: 10, a: 0.6 }], bands: [] },
    props: [{ type: 'bench', at: [0, 0, -0.08], yaw: 0, length: 1.0, height: 0.44 }],
    qa: { pins: [{ c: 'footR', when: 'always' }, { c: 'footL', when: 'always' }], straight: [], touch: [],
      allowContact: ['forearmR|thighR', 'handL|thighL', 'forearmL|thighL', 'forearmL|shinL', 'handL|handR', 'forearmL|forearmR', 'handL|forearmR'] },
  };
  const desc = s.pose.base;
  let extra = {}, hl;
  if (kind === 'flex' || kind === 'ext') {
    // a(t): wrist angle about lat, + = fingers up. flex (palm up): lo = extension, hi = flexion; ext (palm down): lo = flexion, hi = extension
    const lo = kind === 'flex' ? -p.extDeg : -p.flexDeg, hi = kind === 'flex' ? p.flexDeg : p.extDeg;
    // 1 rep / 8 s: rest low 0-1.0, lift (concentric) 1.0-3.2, squeeze 3.2-4.0, lower (eccentric) 4.0-7.0, rest low 7.0-8.0
    const a = keys([[0, lo], [1.0, lo], [3.2, hi], [4.0, hi], [7.0, lo]], DUR);
    const up = kind === 'flex' ? 1 : -1;                                          // palm normal at a = 0: up or down
    const f = t => rot(fd, lat, a(t) * DEG);                                      // + a = fingers up (rotation about lat)
    const n = t => rot(mul(upF, up), lat, a(t) * DEG);
    const top = t => kind === 'flex' ? n(t) : mul(n(t), -1);                       // the surface the left palm presses on
    const pc = t => add(add(W, mul(f(t), p.palm)), mul(top(t), p.surf ?? p.half)); // centre of that surface (surf: its height off the hand axis)
    desc.hands.right = { mode: 'free', frame: 'world', relax: 0.15, wrist: W, finger: t => r5(f(t)), normal: t => r5(n(t)), pole: p.pole,
      elbowTwist: p.elbowTwistR + (kind === 'ext' ? 180 : 0), upperArmTwist: p.upperArmTwistR ?? 0 };
    // left palm on that surface: palm normal = -top, fingers across toward -X (lat), wrist back along -lat and off the surface
    desc.hands.left = { mode: 'free', frame: 'world', relax: 0.1,
      wrist: t => r5(add(add(pc(t), mul(top(t), p.half)), mul(lat, -p.palm))), finger: r5(lat), normal: t => r5(mul(top(t), -1)),
      poleUp: p.poleL, upperArmTwist: p.upperArmTwistL ?? 0, elbowTwist: p.elbowTwistL ?? 0 };
    extra = { effort: t => (a(t) - lo) / (hi - lo) };
    hl = { groups: ['forearms'], side: 'right', pulseTrack: 'effort', pulseBase: 0.35 };
    s.keyFrames = [0.5, 3.6, 5.5]; s.stillAt = 3.6;
  } else {
    // forearm rotation about the forearm axis: q = 0 thumb up; + = toward palm up (supination), - = palm down (pronation)
    // 1 rep / 8 s: palm up 0-0.6, turn down 0.6-3.4 (2.8 s), palm down 3.4-4.2, turn up 4.2-7.4, palm up 7.4-8
    const q = keys([[0, p.supDeg], [0.6, p.supDeg], [3.4, -p.proDeg], [4.2, -p.proDeg], [7.4, p.supDeg]], DUR);
    const n0 = mul(lat, -1);                                                       // thumb-up palm normal = toward the midline
    const n = t => rot(n0, fd, q(t) * DEG);
    desc.hands.right = { mode: 'free', frame: 'world', relax: 0, wrist: W, finger: r5(fd), normal: t => r5(n(t)), pole: p.pole,
      elbowTwist: t => p.elbowTwistR + q(t) * (p.rollShare ?? 1), upperArmTwist: p.upperArmTwistR ?? 0 };
    desc.hands.left = { mode: 'free', frame: 'world', relax: 0.1, wrist: p.restL.wrist, finger: p.restL.finger, normal: p.restL.normal, poleUp: p.poleL,
      upperArmTwist: p.upperArmTwistL ?? 0, elbowTwist: p.elbowTwistL ?? 0 };
    extra = { effort: t => Math.abs(q(t)) / Math.max(p.supDeg, p.proDeg) };
    hl = { groups: ['forearms'], side: 'right', pulseTrack: 'effort', pulseBase: 0.35 };
    s.keyFrames = [0.3, 2.0, 3.8]; s.stillAt = 2.0;
    const DBA = gripAttach('right');
    s.props.push({ type: 'gripHand', side: 'right' },
      { type: 'dumbbell', length: 0.28, plate: 0.045, attach: 'rightHand', rot: DBA.rot, offset: DBA.offset.map((x, i) => +(x + p.dbSlide * GRIP.right.a[i]).toFixed(4)) });
  }
  const B = build(DUR, desc, extra);
  s.timeline = { duration: DUR, tracks: B.tracks };
  s.pose = { base: B.base, deltas: { ...B.deltas, effort: {} } };
  s.highlight = hl;
  s.camera = { ...s.camera, at: s.stillAt, ...(o.camera || {}) };
  // close-up (forearm + hand, PDF 机位): the body is cut by the canvas edge, so its ground shadow would be too; V5 opt-in no ground shadow
  if (p.closeUp) s.v5 = { groundShadow: false };
  s.thomasSupplement = { version: 'r2', item, status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
  return s;
}
