// Foot orientation helper for `feet.<side>.mode: 'free'` (frame 'world') specs.
// A free foot's `rot` is applied to the rest foot (toes +Z, sole facing -Y, body left = +X).
// footRot(toe, axisDown, restAxis) returns a one-entry rot list [[axis, deg]] that turns the rest foot so that
//   - the toes point along `toe` (world, need not be unit), and
//   - the rest-frame direction `restAxis` (e.g. [-1, 0, 0] = the RIGHT foot's outer edge or the LEFT foot's inner edge)
//     faces `axisDown` (world; usually [0, -1, 0] so that edge rests on the floor).
// `axisDown` is made orthogonal to `toe` first. Pure math, no engine state; additive helper (2026-10-17, HipLab media fix).
const sub = (a, b) => a.map((x, i) => x - b[i]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
const r6 = x => Math.round(x * 1e6) / 1e6;

// 3x3 rotation (columns = images of rest X, Y, Z) -> [axis, deg]
function axisAngle(m) {
  const [[a, b, c], [d, e, f], [g, h, i]] = m;   // rows
  const tr = a + e + i, cos = Math.max(-1, Math.min(1, (tr - 1) / 2)), ang = Math.acos(cos);
  if (ang < 1e-9) return [[0, 1, 0], 0];
  let ax;
  if (Math.PI - ang > 1e-6) ax = norm([h - f, c - g, d - b]);
  else {   // 180 deg: axis from the symmetric part
    const xx = Math.sqrt(Math.max(0, (a + 1) / 2)), yy = Math.sqrt(Math.max(0, (e + 1) / 2)), zz = Math.sqrt(Math.max(0, (i + 1) / 2));
    ax = norm([xx, Math.sign(b || 1) * yy, Math.sign(c || 1) * zz]);
  }
  return [ax.map(r6), r6(ang * 180 / Math.PI)];
}

export function footRot(toe, axisDown = [0, -1, 0], restAxis = [-1, 0, 0]) {
  const z = norm(toe);
  let w = sub(axisDown, z.map(x => x * dot(axisDown, z)));
  w = norm(w);
  // restAxis must be orthogonal to the rest toe direction (+Z); its image is w, the rest +Z image is z
  const ra = norm([restAxis[0], restAxis[1], 0]);
  const rb = cross([0, 0, 1], ra);          // rest axis completing a right-handed (ra, rb, +Z) frame
  const wb = cross(z, w);                    // its image
  // R maps ra -> w, rb -> wb, Z -> z ; R = [w wb z] * [ra rb Z]^T
  const A = [w, wb, z], B = [ra, rb, [0, 0, 1]];
  const m = [0, 1, 2].map(r => [0, 1, 2].map(c => A[0][r] * B[0][c] + A[1][r] * B[1][c] + A[2][r] * B[2][c]));
  return [axisAngle(m)];
}

// toe direction tilted from `along` (e.g. the shin direction) toward `toward` by `deg` degrees
export function tilt(along, toward, deg) {
  const u = norm(along); let v = sub(toward, u.map(x => x * dot(toward, u))); v = norm(v);
  const r = deg * Math.PI / 180; return u.map((x, i) => r6(x * Math.cos(r) + v[i] * Math.sin(r)));
}
