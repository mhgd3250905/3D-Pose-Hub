// Knee fix r1 (2026-11-06): old home-anim specs set the standing pelvis height (~0.884-0.894 m) for the old leg
// (thigh 0.353 + shin 0.410 = 0.763 m, ss-geo REST). The v3 armfix-r2 leg is 0.410 + 0.417 = 0.827 m and the feet are
// pinned to the floor, so a plain stand solved to ~46-48 deg knee flexion. Root fix: rescale the pelvis height above an
// anchor by the leg-length ratio, y' = A + S (y - A), which keeps the intended knee angle at every depth (stand stays
// straight, squat bottom stays deep). Optional per-action additive pelvis-y correction tracks (kn1y) fine-tune knee targets.
// Pure data transform of an already-built spec; the original spec files are untouched.
export const S = (0.410 + 0.417) / (0.353 + 0.410);
export const A = 0.149;              // anchor (m): 0.888 -> ~0.950, the height of the revised rN specs that measure 1-8 deg
export const g = y => A + S * (y - A);
const num = x => typeof x === 'number';
// kind of pelvis-y animation in the spec
export function pelvisKind(s) {
  const b = s.pose.base, D = s.pose.deltas || {};
  const ys = Object.entries(D).filter(([, d]) => d && Array.isArray(d.pelvis) && num(d.pelvis[1]));
  if (!ys.length) return { kind: 'const', y: b.pelvis[1] };
  if (ys.length === 1 && b.pelvis[1] === 0 && ys[0][1].pelvis[1] === 1 && Object.keys(ys[0][1]).length === 1) return { kind: 'track', key: ys[0][0] };
  return { kind: 'mixed', keys: ys.map(([k]) => k) };
}
const r5 = x => +(+x).toFixed(5);
// rescale pelvis heights with g (or a custom map)
export function liftPelvis(s, map = g) {
  const b = s.pose.base, D = s.pose.deltas, k = pelvisKind(s);
  if (k.kind === 'const') b.pelvis[1] = r5(map(b.pelvis[1]));
  else if (k.kind === 'track') for (const row of s.timeline.tracks[k.key]) row[1] = r5(map(row[1]));
  else { const d = map(b.pelvis[1]) - b.pelvis[1]; b.pelvis[1] = r5(b.pelvis[1] + d); for (const kk of k.keys) D[kk].pelvis[1] = r5(D[kk].pelvis[1] + d); }
  return k;
}
// additive pelvis-y correction dy(t) (m), sampled on the spec's frame grid, as its own linear track 'kn1y'
export function addPelvisY(s, dyAt) {
  const b = s.pose.base, dur = s.timeline.duration, fps = 30, n = Math.round(dur * fps);
  const ref = Object.values(s.timeline.tracks).find(t => Array.isArray(t) && t.length && Array.isArray(t[0]));
  const times = ref ? ref.map(r => r[0]) : Array.from({ length: n + 1 }, (_, i) => +(i / fps).toFixed(4));
  s.timeline.tracks.kn1y = times.map(t => [t, r5(dyAt(t)), 'linear']);
  const p = []; p[0] = {}; p[1] = b.pelvis[1] + 1; s.pose.deltas.kn1y = { pelvis: p };
}
