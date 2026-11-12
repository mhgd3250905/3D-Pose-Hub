// hip-abductors-B-r5 (integration r1, 2026-11-12): combines two independent fixes that were made on separate branches from the
// same base hip-abductors-B-r3-et1:
//   - elbow-twist r1 (hip-abductors-B-r4, codex/elbow-twist-r1, 2026-11-08): shoulder/elbow roll only (arms).
//   - band-fix r1 (hip-abductors-B-r3-et1-bf1, codex/band-fix-r1, 2026-11-07): band end offsets on the feet only.
// The two touch disjoint fields (pose.base/deltas hands vs props[band].from/to.offset), so r5 = r4 + the bf1 band offsets.
import base from './hip-abductors-B-r4.js';
const s = structuredClone(base);
s.id = 'hip-abductors-B-r5';
const bands = s.props.filter(p => p.type === 'band');
for (const [i, w, offset] of [[0,"from",[0.0446,0.0419,0.0298]],[0,"to",[-0.0447,0.0418,0.0298]]]) bands[i][w].offset = offset;
export default s;
