// h-open-book-r11: top-arm elbow mirror fix of h-open-book-r10.js (2026-11-08). Only the top (right) forearm/hand changes.
// User review of r10 (production camera, t=2): the raised arm's elbow bend (angle AND direction) should mirror the bottom arm's.
// Measured r10 (production chain, each arm's own upper-arm frame): bottom arm flexion 32/31/26 deg at t=0.2/2/4, forearm bending
// toward the head (psi 5/14/57 deg from the head direction about the upper arm), palm 72/63/23 deg from the crease (legal, between
// supinated and neutral); top arm 8.4 deg bent toward the FEET (psi ~180) with the palm -90 deg from its crease (anatomically
// reversed: reads as a backward bend). The bottom arm's bend is natural, so it is kept and mirrored.
// r11: top upper arm = r10's measured upper-arm line (r10 shoulder-wrist line + 4 deg toward the head, which is where r10's
// straight-ish arm put the humerus), forearm flexed phi(p) in the mirrored bend plane psi(p) toward the head, palm rotated
// theta(p) from the crease (mirror of the bottom arm's values, quadratic in the opening p through t=0.2/2/4); wrist extension at
// the start (fingers level on the bottom forearm) as r9. Upper-arm sweep, ELEV(p), chest turn, bottom arm, legs, pillow, timing: r10.
import { make } from './h-open-book-r9.js';
import { elev } from './h-open-book-r10.js';
import { UA, FA, r4 } from './_home-armfix-r1.mjs';
const P2 = 0.5522642316338267;   // opening p at t=2 s
const q3 = (a, b, c) => q => { const l0 = (q - P2) * (q - 1) / (P2), l1 = q * (q - 1) / (P2 * (P2 - 1)), l2 = q * (q - P2) / (1 - P2); return a * l0 + b * l1 + c * l2; };
export const MIRROR = { flex: [32.0, 30.8, 26.3], psi: [5.1, 14.4, 57.0], theta: [71.6, 63.1, 23.1] };   // bottom arm, measured r10
export function rightHand({ flex = MIRROR.flex, psi = MIRROR.psi, theta = MIRROR.theta, UADEG = 4.0 } = {}) {
  const PHI = q3(...flex), PSI = q3(...psi), TH = q3(...theta), D = Math.PI / 180, sg = -1;
  const add = (a, b, k = 1) => a.map((x, i) => x + k * b[i]), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nz = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
  const rotAx = (v, k, ang) => { const c = Math.cos(ang), s = Math.sin(ang), kv = cr(k, v), kd = dot(k, v); return v.map((x, i) => x * c + kv[i] * s + k[i] * kd * (1 - c)); };
  return ({ p, SR, eOf, ang, WX }) => {
    const geo = t => { const q = p(t), a = ang(t) * D, e = eOf(t) + UADEG * D;
      const u = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];          // upper arm (chest rest frame)
      const h = nz(add([0, 1, 0], u, -u[1])), e2 = cr(u, h).map(x => sg * x);                     // head dir perp to u; mirrored 2nd axis
      const ps = PSI(q) * D, b = add(h.map(x => x * Math.cos(ps)), e2.map(x => x * Math.sin(ps)));   // forearm bend direction
      const ph = PHI(q) * D, f = add(u.map(x => x * Math.cos(ph)), b.map(x => x * Math.sin(ph)));     // forearm
      const E = add(SR, u, UA), W = add(E, f, FA);
      const dp = nz(add(b, f, -dot(b, f))), N = rotAx(dp, f, sg * TH(q) * D);                    // palm theta from the crease
      const w = WX * (1 - q) * D, fin = add(f.map(x => x * Math.cos(w)), N, -Math.sin(w)), nor = add(N.map(x => x * Math.cos(w)), f, Math.sin(w));
      const M = SR.map((x, i) => (x + W[i]) / 2), pole = add(E, add(E, M, -1), 2);
      return { W, fin, nor, pole }; };
    return { mode: 'free', frame: 'chest', wrist: t => r4(geo(t).W), finger: t => r4(geo(t).fin), normal: t => r4(geo(t).nor), poleUp: t => r4(geo(t).pole), relax: 0.6 };
  };
}
const r11 = make({ ELEV: elev, RIGHT: rightHand() });
export default { ...r11, id: 'h-open-book-r11' };
