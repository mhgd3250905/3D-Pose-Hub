// h-open-book-r10: top-arm head/feet lean fix of h-open-book-r9.js (2026-11-08). Only the top arm's elevation changes.
// User review of r9 (production camera, t~2 s): the raised top arm leans toward the feet; it should stand straight up from the
// shoulder, slightly toward the head (upper arm ~90-100 deg to the trunk, measured from the feet direction).
// Measured r9 (world): upper arm vs trunk axis (pelvis->shoulder centre) only 92.6 deg at t=2 (100 at the start) and 8.3 deg
// toward the feet from world vertical, because the trunk axis itself rises ~10.5 deg toward the head (side bend) and r9's fixed
// 4 deg chest-frame elevation sweeps in a plane that is not perpendicular to that axis.
// r10: the chest-frame elevation becomes a function of the opening p (table below, fitted on the production chain) so the
// upper arm holds ~96 deg to the trunk axis at the ends and ~99.5 deg at the straight-up moment (t~2 s, p 0.55), which reads
// vertical-to-slightly-head-ward in the production camera. Everything else (chest 55 deg, bottom arm, legs, pillow, timing,
// palm plane, no forearm twist) is r9's.
import { make } from './h-open-book-r9.js';
// [p, chest-frame elevation deg toward the head]
export const ELEV_TABLE = [[0, 0.0], [0.0955, 2.78], [0.25, 6.86], [0.4477, 10.4], [0.5523, 11.0], [0.6545, 10.46], [0.8346, 7.14], [0.9568, 3.46], [1, 2.0]];
// cubic Hermite through the table (finite-difference slopes, flat at p=0 and p=1 where the pose holds)
export const elev = q => { const T = ELEV_TABLE, n = T.length; if (q <= T[0][0]) return T[0][1]; if (q >= T[n - 1][0]) return T[n - 1][1];
  const m = i => (i === 0 || i === n - 1) ? 0 : (T[i + 1][1] - T[i - 1][1]) / (T[i + 1][0] - T[i - 1][0]);
  let i = 1; while (q > T[i][0]) i++;
  const [p0, e0] = T[i - 1], [p1, e1] = T[i], h = p1 - p0, u = (q - p0) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * e0 + (u3 - 2 * u2 + u) * h * m(i - 1) + (-2 * u3 + 3 * u2) * e1 + (u3 - u2) * h * m(i); };
const r9 = make({ ELEV: elev });
export default { ...r9, id: 'h-open-book-r10' };
