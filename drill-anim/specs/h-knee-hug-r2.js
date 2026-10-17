// Portable migration of accepted HipLab 2026-10-17 media; original spec stays frozen.
// Versioned repair of the frozen h-knee-hug; original source/QA stay intact.
// Original preview: hip flexion reached 135.5 deg (strict limit <135), and
// each hand penetrated the other hand by 3.05 mm at the deepest hug.
// Retain the 8 s/two-breath rhythm and pelvic curl. Ease the deepest hip
// flexion from nominal 135 to 132 deg, leaving room for the rig's ~0.7 deg
// measured offset. Align the fingers 20 rather than 40 deg inward along
// their own shin, so the two grips no longer converge across the midline.
import source from './h-knee-hug.js';
import { build, keys, sg, r4, DEG, norm } from '../lib/home-anim.mjs';
import { leg } from '../lib/ss-geo.mjs';

const DUR = source.timeline.duration;
const p = keys([[0, 0], [0.4, 0], [2.2, 1], [2.9, 1], [4.0, 0], [4.4, 0], [6.2, 1], [6.9, 1]], DUR);
const F = t => 127 + 5 * p(t), K = t => 137 + 5 * p(t), TH = t => 14 + 8 * p(t), ABD = 7;
const W0 = [-0.141, 0.123], P0 = [0, 0.122];
const pelvis = t => {
  const a = TH(t) * DEG, rx = P0[0] - W0[0], ry = P0[1] - W0[1];
  return r4([W0[0] + rx * Math.cos(a) - ry * Math.sin(a), W0[1] + rx * Math.sin(a) + ry * Math.cos(a), 0]);
};
const L3 = (s, t) => leg(s, F(t), K(t), [[[0, 0, 1], sg(s) * ABD]]);
const legPose = s => ({ mode: 'free', frame: 'hips', ankle: t => L3(s, t).ankle,
  rot: [[[0, 0, 1], t => -(8 - (F(t) - K(t))) - TH(t) + 22]],
  poleLow: t => { const L = L3(s, t); return r4([L.knee[0] + sg(s) * 0.15, L.knee[1] + 0.2, L.knee[2] + 0.5]); } });
const sub = (a, b) => a.map((x, i) => x - b[i]);
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const handGeo = (s, t) => {
  const L = L3(s, t), ds = norm(sub(L.ankle, L.knee)), n = norm(cross(sub(L.knee, L.hip), ds));
  let an = norm(cross(ds, n));
  const g = (F(t) - K(t)) * DEG;
  if (an[1] * Math.sin(g) + an[2] * Math.cos(g) < 0) an = an.map(x => -x);
  const lateral = norm(cross(an, ds)).map(x => x * Math.sign(cross(an, ds)[0] * sg(s) || 1));
  const contact = norm(an.map((a, i) => a * 0.85 + lateral[i] * 0.53));
  const c = Math.cos(20 * DEG), si = Math.sin(20 * DEG);
  return { palm: r4(L.knee.map((k, i) => k + ds[i] * 0.07 + contact[i] * 0.062)),
    normal: r4(contact.map(x => -x)), finger: r4(norm(ds.map((d, i) => d * c - lateral[i] * si))) };
};
const hand = s => ({ mode: 'free', frame: 'hips', palmAt: t => handGeo(s, t).palm,
  finger: t => handGeo(s, t).finger, normal: t => handGeo(s, t).normal,
  poleLow: [sg(s) * 0.7, 1.05, 0.15], relax: 0.5 });
const P = build(DUR, {
  pelvis,
  hips: { up: [-1, 0, 0], front: [0, 1, 0], rot: [[[0, 0, 1], TH]] },
  chest: { waist: [[[0, 0, 1], t => -TH(t)]] },
  hands: { left: hand('left'), right: hand('right') },
  feet: { left: legPose('left'), right: legPose('right') },
  constraints: [], solve: { vars: [], reg: {} },
}, { hug: p });

export default {
  ...source, fps: 30, modelProfile: 'training-human-v2', alignClavicles: false,
  timeline: { ...source.timeline, tracks: P.tracks },
  pose: { base: P.base, deltas: P.deltas },
};
