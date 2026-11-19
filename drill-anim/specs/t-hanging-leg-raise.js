// t-hanging-leg-raise 悬垂举腿 (hanging straight-leg raise) · Thomas supplement r1 (2026-11-19), derived from h-straight-arm-hang-native.
// Pull-up bar hang, hands shoulder-width (the same bar, grip and arm solve as the straight-arm hang), shoulders held down (arms
// 178 deg, no shoulders.shift: V5 copies bone rotations only). Both legs stay straight and together and lift from hanging to level
// with the floor, 1 s hold, then lower slowly over 3 s; no swing. The pelvis tips back a little as the legs rise (hip pitch -10 deg)
// and the body moves back 4 cm to stay balanced under the bar. Head up (+Y), body faces +Z, body left = +X (t-* convention).
// Legs from the armfix leg() helper (world leg direction -> hips-frame ankle, knee pole and foot rotation for the current hip pitch).
// Loop 8 s, one rep: 0.6 s hang, 1.6 s raise, 1.0 s hold, 3.0 s lower, 1.8 s hang.
// r2 (precision pass, standard tools/thomas-sup/standards/t-hanging-leg-raise.md):
//  - active hang: shoulder blades pulled down 15 mm the whole set (shoulders.shift, drawn by V5 via v5.scapulaShift); r1 hung passive;
//  - legs rise to just above level (95 deg from straight down; r1 88) and stay together and parallel (spread 3 -> 0.5 deg per leg);
//  - no swing: the centre of mass stays under the bar the whole rep (r1 hung 5.4 cm behind it): pelvis Z re-balanced (P0 + PK * sin(leg angle));
//  - camera: true side view tilted 17 deg toward the back (r1 29 deg toward the front): the bar post is drawn behind the back, not
//    across the raised legs.
import previous from './h-straight-arm-hang-native.js';
import { leg, legFields, dirW, scripted, curve } from './_thomas-armfix-r1.mjs';
const T = 8, u = curve([[0, 0], [0.6, 0], [2.2, 1], [3.2, 1], [6.2, 0]], T);
const s = structuredClone(previous);
s.id = 't-hanging-leg-raise'; s.name = '悬垂举腿'; s.nameEn = 'Hanging Straight-Leg Raise';
// V5 hubGraspHands (opt-in, r3 2026-11-19, 开哥「单杠双杠应该用我们专门的抓握手模」): both hands drawn with the hub's accepted bar-grasp fist.
s.v5 = { scapulaShift: true, hubGraspHands: ['left', 'right'] };
const b = s.pose.base;
b.shoulders = { shift: [0, -0.015, 0] };   // chest frame: 15 mm scapular depression (active hang)
b.hips = { up: [0, 1, 0], front: [0, 0, 1], rot: [[[1, 0, 0], 0]] };
b.feet = { left: { mode: 'free', frame: 'hips' }, right: { mode: 'free', frame: 'hips' } };
// pelvis Z = P0 + PK * sin(leg angle from straight down): the legs' forward moment grows with that sine, so the hips move back by it
// and the centre of mass stays under the bar (P0, PK from the sandbox CoM check, 2026-11-19). r3: the fixed fist now really holds the
// bar (fixedBarGrip.bars), so the support point is the bar line (z 0.02) rather than the r2 wrist targets: P0 -0.018 -> +0.019.
const P0 = 0.019, PK = -0.0965, ELEV = 95;   // top leg elevation from straight down (deg)
const fn = t => { const k = u(t), pitch = -10 * k, elev = -88 + (ELEV - 2) * k, o = { 'hips.rot.0.1': pitch, 'pelvis.2': P0 + PK * Math.sin((elev + 90) * Math.PI / 180) };
  for (const side of ['left', 'right']) Object.assign(o, legFields(side, leg(side, dirW(side === 'left' ? 1 : -1, elev, 0.5), pitch, 25 + 10 * k, 178)));
  return o; };
const S = scripted(b, fn, T);
S.tracks.up = Array.from({ length: T * 30 }, (_, i) => [+(i / 30).toFixed(5), +u(i / 30).toFixed(5), 'linear']);
s.timeline = { duration: T, tracks: S.tracks };
s.pose.deltas = { ...S.deltas, up: {} };
s.highlight = { groups: ['hipFlexors', 'abs'], side: 'both', pulseTrack: 'up', pulseBase: 0.3 };
s.props = s.props.filter(p => p.type !== 'wall');   // the door-frame walls of the hang would hide the side view; the bar keeps its own posts
s.camera = { ...s.camera, dir: [1, 0.12, -0.3], at: 2.7, drift: 0 };
s.stillAt = 2.7; s.keyFrames = [0.3, 2.7, 4.7];
s.qa = { ...(s.qa || {}), straight: [{ j: 'elbow.right', min: 176 }, { j: 'elbow.left', min: 176 }, { j: 'knee.right', min: 172 }, { j: 'knee.left', min: 172 }] };
s.thomasSupplement = { version: 'r2', item: '8', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
