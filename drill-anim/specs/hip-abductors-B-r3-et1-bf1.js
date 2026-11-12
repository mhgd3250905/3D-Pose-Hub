// hip-abductors-B-r3-et1-bf1 (band-fix r1, 2026-11-07): the band ends sat inside the limb they hook on (bone-centre anchor), so the tube ran
// through the ankle/shin/foot skin (max 8.3 mm, tools/band-fix-r1/scan-band.mjs). Each bone-attached band end is moved back
// along its own strand to where the strand leaves the skin (clear >= tube radius on every sampled frame; after: 0 mm).
// Only band end offsets change; body pose, timing, other props, camera unchanged.
import base from './hip-abductors-B-r3-et1.js';
const s = structuredClone(base);
s.id = 'hip-abductors-B-r3-et1-bf1';
const bands = s.props.filter(p => p.type === 'band');
for (const [i, w, offset] of [[0,"from",[0.0446,0.0419,0.0298]],[0,"to",[-0.0447,0.0418,0.0298]]]) bands[i][w].offset = offset;
export default s;
