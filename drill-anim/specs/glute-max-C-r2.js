// glute-max-C-r2 (pose fix 2026-11-08, user review: knees fold the shins back toward the machine = anti-human angle).
// Measured on glute-max-C-et1 (v3 armfix): the ankle arc used the v2 leg length (LEG 0.763 m; v3 thigh 0.410 + shin 0.417 = 0.827 m)
// and a hips-frame knee pole that lies on the leg axis when the legs hang -> at the hang the knee bent 43 deg (136.6 deg) the WRONG
// way (kneecap pointing away from the machine, heel folded toward it), 2 'ankle limited to real leg length' warnings at the top and
// both wrists clamped (handle 2 cm out of reach) -> 2-4 solver warnings on every frame.
// r2: the ankle path is the exact world arc about the measured hip joint with L = 0.8245 m (soft knee ~172 deg, i.e. <= 8 deg bend) from
// hanging straight down (phi 0, the user-accepted bottom) up to in line with the torso (phi 90). Knee pole = the thigh's anterior
// direction (rotates with phi), so any residual bend is a normal knee flexion. Feet keep the original relaxed rotation (R0/R1 mapped to
// the world frame: +90 deg hips carry). Handles 25 mm closer to the shoulders (HZ 0.855) so both arms reach the grips (elbow ~167 deg).
// Weight plate moved outside the left leg (prop plateX 0.09 -> 0.21, horn half 0.12 -> 0.23): with straight hanging legs the default
// plate (x 0.075..0.105, r 0.11) sat inside the left shin. Timing (same eased profile), pad, pelvis, camera, highlight unchanged.
import base from './glute-max-C-et1.js';
import { build, r4 } from '../lib/home-anim.mjs';
const s = structuredClone(base);
s.id = 'glute-max-C-r2';
const DUR = 8, HIP = { right: [-0.0815, 1.0805, 0.0004], left: [0.0815, 1.0805, 0.0004] }, L = 0.8245, R0 = -40, R1 = 55;
const ez = x => 0.5 - 0.5 * Math.cos(Math.PI * x);
const prof = t => { const r = ((t % 4) + 4) % 4; return r < 1.0 ? ez(r / 1.0) : r < 1.6 ? 1 : r < 3.2 ? ez(1 - (r - 1.6) / 1.6) : 0; };
const ph = t => prof(t) * Math.PI / 2;
const ank = sg => t => { const p = ph(t); return r4([sg * 0.074, HIP.right[1] - L * Math.cos(p), HIP.right[2] - L * Math.sin(p)]); };
const pole = sg => t => { const p = ph(t), h = HIP.right; return r4([sg * 0.09, h[1] - 0.5 * L * Math.cos(p) - Math.sin(p), h[2] - 0.5 * L * Math.sin(p) + Math.cos(p)]); };
const P = build(DUR, { feet: {
  right: { mode: 'free', frame: 'world', ankle: ank(-1), rot: [[[1, 0, 0], t => 90 + R0 + (R1 - R0) * prof(t)]], pole: pole(-1) },
  left: { mode: 'free', frame: 'world', ankle: ank(1), rot: [[[1, 0, 0], t => 90 + R0 + (R1 - R0) * prof(t)]], pole: pole(1) } } });
s.pose.base.feet = P.base.feet;
s.timeline = { duration: DUR, tracks: { f: base.timeline.tracks.f, ...P.tracks } };
s.pose.deltas = P.deltas;
// handles 25 mm closer (wrist target moves with HZ; prop handle bar span follows)
const DZ = -0.025;
for (const h of ['left', 'right']) { const w = s.pose.base.hands[h].wrist; s.pose.base.hands[h].wrist = [w[0], w[1], +(w[2] + DZ).toFixed(4)]; }
s.props = s.props.map(p => p.type === 'reverseHyper' ? { ...p, plateX: 0.21, hornHalf: 0.23, handles: { ...p.handles, z0: +(p.handles.z0 + DZ).toFixed(4), z1: +(p.handles.z1 + DZ).toFixed(4) } } : p);
export default s;
