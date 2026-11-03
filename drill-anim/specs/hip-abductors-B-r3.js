// hip-abductors-B r3 (2026-10-30, review #16): the ankle targets were built for the old rig's legs (thigh 0.353 + shin 0.410 m);
// the current model's legs are 0.410 + 0.417 m, so the "straight" targets were 7.8 % short and both knees bent ~43 deg (one leg
// read as tucked toward the head). Every ankle target (base, open, bow) is pushed out along its hip->ankle line to the current
// straight-leg reach (178 deg knee), less 1 % so the solver never hits its real-leg-length clamp. Timeline, arms, band, camera unchanged.
import prior from './hip-abductors-B-r2.js';
const spec = structuredClone(prior);
spec.id = 'hip-abductors-B-r3';
const HIP = { left: [0.081543, 0.85197, 0.00565], right: [-0.081543, 0.85197, 0.00565] };
const TH = 0.40974, SH = 0.41677, R = Math.sqrt(TH * TH + SH * SH + 2 * TH * SH * Math.cos(2 * Math.PI / 180));
const fix = (side, a) => { const h = HIP[side], d = a.map((x, i) => x - h[i]), L = Math.hypot(...d); return d.map((x, i) => +(h[i] + x * R * 0.99 / L).toFixed(4)); };
for (const f of [spec.pose.base.feet, spec.pose.deltas.open.feet, spec.pose.deltas.bow.feet])
  for (const side of ['left', 'right']) if (Array.isArray(f[side]?.ankle)) f[side].ankle = fix(side, f[side].ankle);
export default spec;
