// h-band-hip-ir-sc1-et1-bf1 (band-fix r1, 2026-11-07): the band ends sat inside the limb they hook on (bone-centre anchor), so the tube ran
// through the ankle/shin/foot skin (max 10.4 mm, tools/band-fix-r1/scan-band.mjs). Each bone-attached band end is moved back
// along its own strand to where the strand leaves the skin (clear >= tube radius on every sampled frame; after: 0 mm).
// Only band end offsets change; body pose, timing, other props, camera unchanged.
import base from './h-band-hip-ir-sc1-et1.js';
const s = structuredClone(base);
s.id = 'h-band-hip-ir-sc1-et1-bf1';
const bands = s.props.filter(p => p.type === 'band');
for (const [i, w, offset] of [[0,"to",[0.0396,0.0349,-0.0101]]]) bands[i][w].offset = offset;
export default s;
