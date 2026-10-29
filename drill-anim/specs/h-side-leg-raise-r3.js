// b002 independent contact/seam repair; original r2 remains frozen.
// pz was an under-constrained LM variable (only leg reach and pelvis-X constraints)
// whose weak regularisation converged differently from cold and warm starts.
// Keep the authored sagittal pelvis plane fixed; px/py and both constraints remain.
// At rest the abducted free ankle is already above the floor, but the shoe's -3deg
// roll lowered its outside sole through it. Flatten only that resting shoe roll,
// blending back to the unchanged -32deg peak. Do not lift the ankle or bend the knee.
import base from './h-side-leg-raise-r2.js';

const spec = structuredClone(base);
const lift = spec.timeline.tracks.lift;
const roll = spec.timeline.tracks.k3;
if (spec.pose.deltas.k3?.feet?.right?.rot?.[0]?.[1] !== 1 || roll.length !== lift.length)
  throw new Error('Unexpected source layout: right free-foot roll must be k3.');
spec.timeline.tracks.k3 = roll.map(([t, angle, ease], i) => {
  if (lift[i][0] !== t) throw new Error('Foot-roll and lift samples must remain aligned.');
  return [t, angle + 3 * (1 - lift[i][1]), ease];
});
spec.pose.base.solve.vars = spec.pose.base.solve.vars.filter(name => name !== 'pz');
delete spec.pose.base.solve.reg.pz;

export default { ...spec, id: 'h-side-leg-raise-r3' };
