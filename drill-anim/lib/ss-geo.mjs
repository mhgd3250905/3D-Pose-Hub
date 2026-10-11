// Rest-frame limb geometry helpers for spec authoring (sitting-strength drills). Pure math, no browser.
// Rest pose: standing, facing +Z, body left = +X, floor y = 0 (joint values measured from the rig, see the ss probe).
export const REST = {
  pelvis: [0, 0.8996, 0.0102], shoulderCenter: [0, 1.3702, -0.0042], head: [0, 1.5422, 0.0109],
  hip: s => [sg(s) * 0.0815, 0.852, 0.0057], shoulder: s => [sg(s) * 0.1879, 1.3702, -0.0042],
};
export const TH = 0.3530, SH = 0.4098, UA = 0.2567, FA = 0.2281;
export const DEG = Math.PI / 180;
export const sg = s => (s === 'left' ? 1 : -1);
export const r4 = a => a.map(x => +x.toFixed(4));
const add = (a, b) => a.map((x, i) => x + b[i]), sub = (a, b) => a.map((x, i) => x - b[i]), mul = (a, k) => a.map(x => x * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = a => mul(a, 1 / Math.hypot(...a));
// Rodrigues: rotate v about unit axis k by deg (right-handed)
export const rot = (v, k, deg) => { k = norm(k); const c = Math.cos(deg * DEG), s = Math.sin(deg * DEG);
  return add(add(mul(v, c), mul(cross(k, v), s)), mul(k, dot(k, v) * (1 - c))); };
export const rotAbout = (p, centre, k, deg) => add(centre, rot(sub(p, centre), k, deg));
// sagittal leg in the rest frame: flex = hip flexion (thigh forward, deg), knee = knee flexion (0 = straight) -> {knee, ankle}
// extra: [[axis, deg], ...] rotations of the whole leg about the hip (rest axes), applied in order
export function leg(s, flex, knee, extra = []) {
  const H = REST.hip(s); const f = flex * DEG, g = (flex - knee) * DEG;
  let K = add(H, mul([0, -Math.cos(f), Math.sin(f)], TH)), A = add(K, mul([0, -Math.cos(g), Math.sin(g)], SH));
  for (const [ax, d] of extra) { K = rotAbout(K, H, ax, d); A = rotAbout(A, H, ax, d); }
  return { hip: H, knee: r4(K), ankle: r4(A) };
}
// rotation about the hip->ankle axis (clamshell: feet stay together, the knee orbits that line)
export function legAboutHA(s, flex, knee, deg) {
  const L = leg(s, flex, knee); const ax = sub(L.ankle, L.hip); const K = rotAbout(L.knee, L.hip, ax, deg);
  return { hip: L.hip, knee: r4(K), ankle: L.ankle };
}
// world image of a rest axis under a hips descriptor {up, front, rot:[[axis,deg]..]} (same convention as engine basisQ/orient)
export function restToWorld(h, a) {
  const y = norm(h.up); let z = h.front.slice(); z = norm(sub(z, mul(y, dot(z, y)))); const x = norm(cross(y, z));
  let w = add(add(mul(x, a[0]), mul(y, a[1])), mul(z, a[2]));
  for (const [ax, d] of h.rot || []) w = rot(w, ax, d);   // rotList premultiplies in list order -> apply in order
  return r4(w);
}
// rest-frame rotation list -> world rotation list for a free foot carried by the hips (conjugate each axis)
export const footRotW = (h, list) => list.map(([ax, d]) => [restToWorld(h, ax), d]);
// rest point -> world, given pelvis world position P and hips descriptor
export const restPtW = (h, P, p) => r4(add(P, restToWorld(h, sub(p, REST.pelvis))));
// cosine-eased piecewise keys sampled per frame as 'linear' tracks (so several tracks can share one eased curve)
export function sampler(K, dur) { return t => { for (let i = 0; i < K.length; i++) { const [ta, va] = K[i], [tb, vb] = K[i + 1] || [dur, K[0][1]];
  if (t >= ta && t < tb) return va + (vb - va) * (1 - Math.cos(Math.PI * (t - ta) / (tb - ta))) / 2; } return K[0][1]; }; }
export const frames = (dur, fps = 30) => Array.from({ length: Math.round(dur * fps) }, (_, k) => k / fps);
export const track = (dur, fn) => frames(dur).map(t => [+t.toFixed(4), +fn(t).toFixed(5), 'linear']);
