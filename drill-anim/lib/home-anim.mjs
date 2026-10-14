// Function-driven pose descriptors for the home-fitness batch (h-* specs). Pure math, no browser.
// build(DUR, desc): `desc` is an ordinary pose descriptor (pose.base) whose leaves may be functions of t (seconds),
// returning a number or an array of numbers. Each function leaf becomes per-frame 'linear' coordinate tracks: the base
// value is 0 and the track's delta sets that one coordinate to 1, so the blended descriptor reproduces f(t) exactly
// (engine blend = base + sum p_k (delta_k - base)). This keeps arcs exact (a straight arm stays straight, a foot stays on
// its path) without hand-tuned bow tracks. Returns { tracks, base, deltas }.
import { track, REST, sg, DEG, r4 } from './ss-geo.mjs';
export { REST, sg, DEG, r4 };
export function build(DUR, desc, extraTracks = {}) {
  const tracks = {}, deltas = {}; let n = 0;
  for (const [k, v] of Object.entries(extraTracks)) tracks[k] = typeof v === 'function' ? track(DUR, v) : v;
  const setDelta = (key, path) => {
    const root = {}; let cur = root;
    for (let i = 0; i < path.length; i++) {
      const k = path[i], last = i === path.length - 1;
      const nextIsIdx = !last && typeof path[i + 1] === 'number';
      const child = last ? 1 : (nextIsIdx ? [] : {});
      if (Array.isArray(cur)) { for (let j = 0; j < k; j++) if (cur[j] === undefined) cur[j] = {}; cur[k] = child; }
      else cur[k] = child;
      cur = child;
    }
    deltas[key] = root;
  };
  const walk = (node, path) => {
    if (typeof node === 'function') {
      const v0 = node(0);
      if (Array.isArray(v0)) return v0.map((_, i) => { const key = 'k' + (n++); tracks[key] = track(DUR, t => node(t)[i]); setDelta(key, path.concat(i)); return 0; });
      const key = 'k' + (n++); tracks[key] = track(DUR, node); setDelta(key, path); return 0;
    }
    if (Array.isArray(node)) return node.map((x, i) => walk(x, path.concat(i)));
    if (node && typeof node === 'object') { const o = {}; for (const k of Object.keys(node)) o[k] = walk(node[k], path.concat(k)); return o; }
    return node;
  };
  const base = walk(desc, []);
  return { tracks, base, deltas };
}
// eased piecewise keys [[t, v], ...] (cosine between keys, wraps to the first value at DUR)
export function keys(K, DUR) {
  return t => { t = ((t % DUR) + DUR) % DUR;
    for (let i = 0; i < K.length; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1] || [DUR, K[0][1]];
      if (t >= ta && t < tb) return va + (vb - va) * (1 - Math.cos(Math.PI * (t - ta) / (tb - ta))) / 2; }
    return K[0][1]; };
}
// smooth breathing 0..1 with the given period
export const breath = (period, phase = 0) => t => (1 - Math.cos(2 * Math.PI * (t / period + phase))) / 2;
export const lerp = (a, b, p) => Array.isArray(a) ? a.map((x, i) => x + (b[i] - x) * p) : a + (b - a) * p;
const _add = (a, b) => a.map((x, i) => x + b[i]);
export const add = _add;
export const sub = (a, b) => a.map((x, i) => x - b[i]);
export const mul = (a, k) => a.map(x => x * k);
export const norm = a => { const l = Math.hypot(...a); return a.map(x => x / l); };
// rest-frame arm: unit direction from the shoulder for flexion phi (0 = hanging down, 90 = forward, 180 = overhead) and
// abduction psi (sideways, + = away from the body), and the wrist at reach AR along it
export const armDir = (s, phi, psi = 0) => { const f = phi * DEG, a = psi * DEG;
  return norm([sg(s) * Math.sin(a), -Math.cos(f) * Math.cos(a), Math.sin(f) * Math.cos(a)]); };
export const armWrist = (s, phi, psi = 0, AR = 0.484, dx = 0) => { const S = REST.shoulder(s); const d = armDir(s, phi, psi); return [S[0] + d[0] * AR - sg(s) * dx, S[1] + d[1] * AR, S[2] + d[2] * AR]; };
