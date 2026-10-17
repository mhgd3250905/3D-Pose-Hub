// Portable migration of accepted HipLab 2026-10-17 media; original spec stays frozen.
// HipLab revision 20261017: smaller supine knee-drop range.
// The frozen source counter-rotates the waist by the full 55-degree pelvis roll.
// Preflight measured 55.2 degrees relative torso rotation (original limit <45).
// Use a 38-degree roll on both sides, recomputing pelvis ellipse, chest settling,
// and foot orientation together. Keep chest level, timing, camera, props, model,
// original QA thresholds/contact allowances, and frozen source untouched.
import source from './h-supine-twist.js';
import { build, keys, armDir, sg, r4, DEG, norm } from '../lib/home-anim.mjs';
import { leg, restToWorld, REST } from '../lib/ss-geo.mjs';
const DUR = 8, ROLL = 38, ADD = 12;
const s = keys([[0, 0], [0.3, 0], [1.7, 1], [2.9, 1], [4.0, 0], [4.3, 0], [5.7, -1], [6.9, -1]], DUR);   // +1 knees right
const th = t => ROLL * s(t);
const hipsAt = t => ({ up: [-1, 0, 0], front: [0, 1, 0], rot: [[[1, 0, 0], th(t)]] });
const pelvis = t => { const a = Math.abs(th(t)) * DEG, A = 0.165, B = 0.12;
  return r4([0, Math.sqrt((A * Math.sin(a)) ** 2 + (B * Math.cos(a)) ** 2) + 0.002, 0.03 * Math.sin(th(t) * DEG)]); };
const arch = t => { const lift = pelvis(t)[1] - pelvis(0)[1]; return Math.asin(Math.min(0.3, lift / 0.36)) / DEG; };   // head end back down onto the mat
const F = 90, K = 95, PITCH = 8;
const legPose = side => ({ mode: 'free', frame: 'hips',
  ankle: t => leg(side, F, K, [[[0, 1, 0], -ADD * s(t)]]).ankle,
  rot: [[t => restToWorld(hipsAt(t), [1, 0, 0]), PITCH - (F - K)], [t => restToWorld(hipsAt(t), [0, 1, 0]), t => -ADD * s(t)]],
  poleLow: t => { const L = leg(side, F, K, [[[0, 1, 0], -ADD * s(t)]]); return r4([L.knee[0], L.knee[1] + 0.3, L.knee[2] + 0.25]); } });
const hand = side => { const S = REST.shoulder(side), d = norm([sg(side) * 0.97, 0.12, -0.125]), AR = 0.484;
  return { mode: 'free', frame: 'chest', wrist: r4([S[0] + d[0] * AR, S[1] + d[1] * AR, S[2] + d[2] * AR]), finger: r4(d), normal: [0, 0, 1],
    poleUp: r4([S[0] + sg(side) * 0.25, S[1], S[2] - 0.3]), relax: 0.6 }; };
const P = build(DUR, {
  pelvis,
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[1, 0, 0], th]] },
  chest: { waist: [[[1, 0, 0], t => -th(t)], [[0, 0, 1], arch]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: legPose('left'), right: legPose('right') },
  constraints: [],
  solve: { vars: [], reg: {} },
}, { tw: t => Math.abs(s(t)) });
export default {
  ...source, fps: 30, modelProfile: 'training-human-v2', alignClavicles: false,
  timeline: { ...source.timeline, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
};
