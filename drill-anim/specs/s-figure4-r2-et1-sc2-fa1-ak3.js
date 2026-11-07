// s-figure4 ak3 (2026-11-07, user: the crossed ankle must sit on the other knee as the pivot, and the lifted leg does the work;
// matched against Physitrack / Hinge Health / SmartWorkout supine figure-4 steps). New motion: lying on the back, left foot planted;
// the outer right ankle rests on the left thigh just above the knee (6-8 cm) with the right knee open. 'open' 0 -> 1: the left foot
// lifts and the left thigh is drawn toward the chest (hip flexion 54 -> 100 deg, left shin to ~tabletop), and the right ankle and
// foot ride rigidly with the left thigh (pivot), so the right hip flexes and the right glute stretches. Right ankle = fixed point
// of the left thigh plus a small normal correction (N0/N1/NM) measured so the shin stays on the thigh all loop (|gap| <= 1.8 mm).
// Right foot keeps its rest relation to the right shin all loop (DF ~15, toe-in ~0, eversion ~14): it follows an analytic
// right-shin estimate (2-bone IK + measured knee-swing table PHI + shin roll 63*open).
// Arms stay on the mat (hands-behind-thigh grip is a separate step). Timing: rest 0-0.6 s, lift to 2.6 s, hold to 4.8 s, down by 6.8 s.
import base from './s-figure4-r2-et1-sc2-fa1-ak2.js';
import { build, keys } from '../lib/home-anim.mjs';
const s = structuredClone(base);
s.id = 's-figure4-r2-et1-sc2-fa1-ak3';
const DUR = 8, DEG = Math.PI / 180;
const p = keys([[0, 0], [0.6, 0], [2.6, 1], [4.8, 1], [6.8, 0]], DUR);
const H = [0.082, 0.109, 0.048], K0 = [0.105, 0.442, 0.286], A0 = [0.11, 0.084, 0.5];
const F0 = Math.atan2(K0[1] - H[1], K0[2] - H[2]) / DEG, G0 = Math.atan2(A0[1] - K0[1], A0[2] - K0[2]) / DEG;
const F1 = 100, G1 = 5;
const rx = (v, c, d) => { const a = d * DEG, y = v[1] - c[1], z = v[2] - c[2];   // rotate about +X through c; + = +Z toward +Y
  return [v[0], c[1] + y * Math.cos(a) + z * Math.sin(a), c[2] - y * Math.sin(a) + z * Math.cos(a)].map(x => +x.toFixed(5)); };
const dF = t => (F1 - F0) * p(t), dG = t => (G1 - G0) * p(t);
const knee = t => rx(K0, H, dF(t));
const ankleL = t => { const k = knee(t); return rx([k[0] + A0[0] - K0[0], k[1] + A0[1] - K0[1], k[2] + A0[2] - K0[2]], k, dG(t)); };
// right ankle rides a fixed point of the left thigh (rigid with it), plus a small lift along the thigh's anterior normal
const AR = [0.13, 0.461, 0.14], N0 = 0.0145, N1 = 0.0322, NM = -0.0034;
const nrm = t => { const u = [K0[0]-H[0], K0[1]-H[1], K0[2]-H[2]]; const L = Math.hypot(...u); const n0 = [0, -u[2]/L, u[1]/L]; return rx([H[0], H[1]+n0[1], H[2]+n0[2]], H, dF(t)).map((x,i)=>x-H[i]); };
const ankleR = t => { const q = p(t), lift = N0 + (N1 - N0) * q + NM * 4 * q * (1 - q), a = rx(AR, H, dF(t)), n = nrm(t); return a.map((x, i) => +(x + n[i] * lift).toFixed(5)); };
const RB = s.pose.base.feet.right.rot[0];
const P0 = [-1.0, -0.15, 0.25], P1 = [-1.0, -0.6, 0.25];
const poleR = t => P0.map((x, i) => x + (P1[i] - x) * p(t));
// right foot follows an analytic estimate of the solved right shin (2-bone IK: hip fixed, thigh 0.41, shin 0.417, knee toward the pole),
// i.e. its rest-frame relation to the shin is kept all loop instead of riding with the left thigh.
const HR = [-0.082, 0.109, 0.048], TL = 0.41, SL = 0.417;
const sub = (a, b) => a.map((x, i) => x - b[i]), dot = (a, b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2], nz = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
const cr = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
// solved-knee correction: the engine's knee sits phi deg about the hip->ankle axis from the plain pole-plane estimate (measured, L4 probe)
const PHI = [[0, 2.18], [0.0955, 1.88], [0.3455, 0.12], [0.5, -1.61], [0.9045, -10.57], [1, -13.06]];
const phiK = q => { for (let i = 1; i < PHI.length; i++) if (q <= PHI[i][0]) { const [a0, b0] = PHI[i-1], [a1, b1] = PHI[i]; return b0 + (b1 - b0) * (q - a0) / (a1 - a0); } return PHI[PHI.length-1][1]; };
const kneeR = t => { const A = ankleR(t), d = sub(A, HR), D = Math.hypot(...d), u = nz(d); const pl = poleR(t); const pp = nz(sub(pl, u.map(x => x * dot(pl, u))));
  const a = (TL*TL - SL*SL + D*D) / (2*D), h = Math.sqrt(Math.max(0, TL*TL - a*a)); const ph = phiK(p(t)) * DEG, w2 = cr(u, pp);
  const r = pp.map((x, i) => x * Math.cos(ph) + w2[i] * Math.sin(ph)); return HR.map((x, i) => x + u[i]*a + r[i]*h); };
const frameR = t => { const A = ankleR(t), K = kneeR(t); const sv = nz(sub(A, K)), nv = nz(cr(sub(K, HR), sv)), w = cr(sv, nv); return [sv, nv, w]; };
const RF = frameR(0);
const qa = (ax, d) => { const l = Math.hypot(...ax), h = d * DEG / 2, s_ = Math.sin(h) / l; return [ax[0]*s_, ax[1]*s_, ax[2]*s_, Math.cos(h)]; };
const qm = (a, b) => [a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1], a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0], a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3], a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
const qFromM = m => { const [m00,m01,m02,m10,m11,m12,m20,m21,m22] = m, tr = m00 + m11 + m22; let x, y, z, w;
  if (tr > 0) { const S = Math.sqrt(tr + 1) * 2; w = 0.25 * S; x = (m21 - m12) / S; y = (m02 - m20) / S; z = (m10 - m01) / S; }
  else if (m00 > m11 && m00 > m22) { const S = Math.sqrt(1 + m00 - m11 - m22) * 2; w = (m21 - m12) / S; x = 0.25 * S; y = (m01 + m10) / S; z = (m02 + m20) / S; }
  else if (m11 > m22) { const S = Math.sqrt(1 + m11 - m00 - m22) * 2; w = (m02 - m20) / S; x = (m01 + m10) / S; y = 0.25 * S; z = (m12 + m21) / S; }
  else { const S = Math.sqrt(1 + m22 - m00 - m11) * 2; w = (m10 - m01) / S; x = (m02 + m20) / S; y = (m12 + m21) / S; z = 0.25 * S; }
  return [x, y, z, w]; };
const ROLL = 63;
const footR = t => { const F = frameR(t); // delta = sum_k F[k] (x) RF[k]   (maps the rest shin frame onto the current one)
  const m = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) m.push(F[0][i]*RF[0][j] + F[1][i]*RF[1][j] + F[2][i]*RF[2][j]);
  let q = qm(qFromM(m), qa(RB[0], RB[1])); if (ROLL) q = qm(qa(F[0], ROLL * p(t)), q);
  const w = Math.max(-1, Math.min(1, q[3])); const ang = 2 * Math.acos(w) / DEG, sn = Math.sqrt(1 - w * w) || 1;
  return { ax: [q[0]/sn, q[1]/sn, q[2]/sn].map(x => +x.toFixed(5)), ang: +ang.toFixed(4) }; };
const B = s.pose.base;
const desc = { ...B, feet: {
  left: { mode: 'free', frame: 'world', ankle: ankleL, rot: [[[1, 0, 0], t => -dG(t)]], pole: [0.12, 1.0, 0.3] },
  right: { ...B.feet.right, ankle: ankleR, rot: [[t => footR(t).ax, t => footR(t).ang]], pole: poleR },
} };
const PP = build(DUR, desc, { open: p });
s.timeline = { duration: DUR, tracks: PP.tracks };
s.pose = { base: PP.base, deltas: PP.deltas };
s.qa = { ...s.qa, pins: [] };
export default s;
