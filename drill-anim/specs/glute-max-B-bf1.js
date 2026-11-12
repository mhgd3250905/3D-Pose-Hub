// glute-max-B-bf1 (band-fix r1, 2026-11-07): the band ends sat inside the limb they hook on (bone-centre anchor), so the tube ran
// through the ankle/shin/foot skin (max 21.7 mm, tools/band-fix-r1/scan-band.mjs). Each bone-attached band end is moved back
// along its own strand to where the strand leaves the skin (clear >= tube radius on every sampled frame; after: 0 mm).
// Only band end offsets change; body pose, timing, other props, camera unchanged.
import base from './glute-max-B.js';
const s = structuredClone(base);
s.id = 'glute-max-B-bf1';
const bands = s.props.filter(p => p.type === 'band');
for (const [i, w, offset] of [[0,"from",[0.0109,0.0598,0.0456]],[0,"to",[-0.052,-0.0713,-0.0212]],[1,"from",[0.026,0.0899,0.0072]]]) bands[i][w].offset = offset;
export default s;
