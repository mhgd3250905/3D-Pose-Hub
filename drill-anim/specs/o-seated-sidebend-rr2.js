// rr2 (Hark review 2026-10-23): rr1 seat, feet, arms, rhythm and camera unchanged. The lateral bend was 0-16 deg,
// which barely reads as a side stretch on screen; rr2 scales the same baked k0 waist curve to 0-28 deg.
// Arms are chest-frame and follow the trunk. Sparse keyframe check only, full GPU pending.
import rr1 from './o-seated-sidebend-rr1.js';
const s=structuredClone(rr1);s.id='o-seated-sidebend-rr2';
const K=28/16;s.timeline.tracks.k0=s.timeline.tracks.k0.map(([t,v,e])=>[t,+(v*K).toFixed(6),e]);
export default s;
