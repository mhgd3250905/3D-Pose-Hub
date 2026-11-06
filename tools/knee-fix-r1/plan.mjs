// Per-action knee-fix plan. Default for every listed action: liftPelvis with kn-lib g (+ corr/<id>.json if present).
// custom(spec) runs after the lift, before the correction track is added.
import { S } from './kn-lib.mjs';
import { REST } from '../../drill-anim/lib/ss-geo.mjs';
const isNum = x => typeof x === 'number';
// delta keys whose only leaf is the given path set to 1 (home-anim function-leaf tracks)
const keyAt = (s, pathArr) => Object.entries(s.pose.deltas).filter(([, d]) => { let c = d; for (const p of pathArr) { if (c == null) return false; c = c[p]; } return c === 1; }).map(([k]) => k);
const mapTrack = (s, k, f) => { for (const r of s.timeline.tracks[k]) r[1] = +f(r[1]).toFixed(5); };
export const PLAN = {
  // straight leg raised forward: ankle target (hips frame, rest coords) was set for the old 0.763 m leg; scale the whole
  // arc about the rest hip by the leg ratio so the raised leg stays long (base + every delta, so blends scale too)
  'hip-flexors-C': { note: 'raised right leg ankle arc scaled about the hip by the v3/old leg ratio',
    custom: s => { const H = [-0.0815, 0.852, 0.0057], sc = a => a.map((x, i) => +(H[i] + S * (x - H[i])).toFixed(5));
      s.pose.base.feet.right.ankle = sc(s.pose.base.feet.right.ankle);
      for (const d of Object.values(s.pose.deltas)) if (d.feet?.right?.ankle) d.feet.right.ankle = sc(d.feet.right.ankle); } },
  // straight-leg raise (world-frame ankle built from the old pelvis): follow the lifted pelvis and lengthen the leg
  'h-band-straight-leg-raise': { note: 'working-leg ankle follows the lifted pelvis and is lengthened about the hip by the leg ratio',
    custom: s => { const PEL = [0, 0.8936, 0.0102], dyP = s.pose.base.pelvis[1] - PEL[1];
      const Hw = REST.hip('right').map((x, i) => PEL[i] + x - REST.pelvis[i]);
      const ks = [0, 1, 2].map(i => keyAt(s, ['feet', 'right', 'ankle', i])[0]);
      const tr = ks.map(k => s.timeline.tracks[k]);
      for (let f = 0; f < tr[0].length; f++) { const A = tr.map(t => t[f][1]);
        for (let i = 0; i < 3; i++) tr[i][f][1] = +(Hw[i] + S * (A[i] - Hw[i]) + (i === 1 ? dyP : 0)).toFixed(5); }
      for (let i = 0; i < 3; i++) { const pk = keyAt(s, ['feet', 'right', 'pole', i])[0]; if (pk && i === 1) mapTrack(s, pk, v => v + dyP); } } },
  // lateral lunge: the "straight" leg could not reach on the longer v3 leg; step 30 % wider (and pelvis shift with it)
  'h-lateral-step-lunge': { note: 'step width and pelvis side shift x1.3 so the trailing leg can stay straight',
    custom: s => { for (const sd of ['left', 'right']) for (const k of keyAt(s, ['feet', sd, 'at', 0])) mapTrack(s, k, x => Math.sign(x) * (0.10 + (Math.abs(x) - 0.10) * 1.3));
      for (const k of keyAt(s, ['pelvis', 0])) mapTrack(s, k, x => x * 1.3); } },
};
