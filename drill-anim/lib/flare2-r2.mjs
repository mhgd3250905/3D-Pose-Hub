// Flare 2.0 moves r2 (2026-11-21): helpers for the r2 specs (t-* warm-up v2 / cool-down batch 1). Pure math, no browser.
// v5r2 = opt-in V5 extension read by tools/flare2-moves-r2/v5/v5r2-ext.js (per-frame head rotation and finger poses at 30 fps).
// Hand pose = 19 numbers [iM,iP,iD,iA, mM,mP,mD,mA, rM,rP,rD,rA, lM,lP,lD,lA, tF,tA,tI] (deg; see v5r2-ext.js FINGER).
export const FPS = 30;
export const SHAPES = {
  open: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // relaxed hanging hand: fingers softly curved
  relax: [14, 18, 8, 0, 16, 20, 9, 0, 18, 22, 10, 0, 20, 24, 10, 0, 6, 6, 8],
  // resting lightly on the head: almost straight, soft
  rest: [8, 8, 4, 0, 8, 8, 4, 0, 9, 9, 4, 0, 10, 10, 4, 0, 0, 4, 4],
  // closed fist (fingertips into the palm, thumb across index/middle)
  fist: [82, 98, 58, -3, 86, 98, 58, 0, 88, 98, 58, -3, 90, 96, 56, -5, 30, 28, 38],
  // fingers spread wide (slight MCP extension)
  spread: [-12, 0, 0, 16, -12, 0, 0, 3, -12, 0, 0, 12, -14, 0, 0, 22, -6, -24, -6],
  // interlaced (searched offline against the hand-vs-hand clash check with the clasp of t-neck-wrist-finger-wakeup: right hand 2 x 15 mm
  // higher, palms 2 x 20 mm apart, each hand turned 10 deg about its palm normal; see tools/flare2-moves-r2/standards/t-neck-wrist-finger-wakeup.md)
  interlace: [76, 17, 16, -5, 60, 17, 16, -8, 92, 17, 16, -4, 86, 17, 16, 8, -9, 1, 19],
  // fingers straight and held back by the other hand (wrist-flexor stretch)
  pulled: [-28, 0, 0, 2, -30, 0, 0, 0, -30, 0, 0, 2, -28, 0, 0, 4, 0, 0, 0],
  // the pulling hand: fingers wrapped lightly over the other hand's fingers
  hook: [34, 44, 24, 0, 36, 46, 24, 0, 38, 46, 24, 0, 40, 46, 22, 0, 10, 20, 14],
};
// mix of shapes {name: weight} (weights need not sum to 1; the remainder is 'open')
export const mix = (w) => SHAPES.open.map((_, i) => +Object.entries(w).reduce((a, [k, x]) => a + x * SHAPES[k][i], 0).toFixed(2));
// sample f(t) at 30 fps over one loop: frame i = t = i / 30 (the renderer's frame time)
export const perFrame = (DUR, f) => Array.from({ length: Math.round(DUR * FPS) }, (_, i) => f(i / FPS));
export const ss = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
export const win = (t, a, b) => ss((t - a) / (b - a));   // 0 before a, 1 after b
// world-space helpers
export const V = {
  add: (a, b) => a.map((x, i) => x + b[i]), sub: (a, b) => a.map((x, i) => x - b[i]), mul: (a, k) => a.map(x => x * k),
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  norm: (a) => { const l = Math.hypot(...a); return a.map(x => x / l); },
  rot: (v, k, deg) => { const l = Math.hypot(...k); k = k.map(x => x / l); const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180);
    const cr = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]], d = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
    return v.map((x, i) => x * c + cr[i] * s + k[i] * d * (1 - c)); },
};
