// v2plus r3: preserve the native step-jack motion; calibrate the original shoe sole height.
// r2 measured visible Coach_Soles minY=-0.00202077778868m at all sampled planted phases.
// Shift only each ankle Y coordinate by +0.00227077778868m, targeting +0.25mm.
import base from './h-step-jack-r2.js';
const deltaY = 0.00227077778868;
const tracks = { ...base.timeline.tracks };
const corrected = [];
for (const side of ['left', 'right']) {
  const found = Object.entries(base.pose.deltas).filter(([, d]) => d.feet?.[side]?.ankle?.[1] === 1);
  if (found.length !== 1) throw new Error('Expected one ankle Y coordinate track for ' + side);
  const key = found[0][0];
  tracks[key] = base.timeline.tracks[key].map(([t, value, ...rest]) => [t, value + deltaY, ...rest]);
  corrected.push(key);
}
export default { ...base, id: 'h-step-jack-r3', timeline: { ...base.timeline, tracks },
  qaCalibration: { kind: 'ankle-y-offset', deltaMetres: deltaY, correctedTracks: corrected,
    measuredBeforeMinYMetres: -0.00202077778868, targetSoleMinYMetres: 0.00025,
    status: 'candidate-awaiting-actual-before-after-preview' } };
