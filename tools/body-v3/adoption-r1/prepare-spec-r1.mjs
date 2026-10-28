// #18: limit the legacy solver workaround to the reviewed side-leg-raise family.
// Preserve the caller's spec (including QA, foot rotations and animation tracks).
const SIDE_LEG_RAISE = /^h-side-leg-raise(?:-r[1-9]\d*)?$/;

export function prepareReviewedSpec(spec) {
  if (!spec || typeof spec.id !== 'string' || !SIDE_LEG_RAISE.test(spec.id)) return spec;
  const base = spec.pose?.base;
  if (!base || !Array.isArray(base.solve?.vars) || !base.hands?.left || !base.hands?.right) {
    throw new Error(`Unexpected ${spec.id} descriptor; reviewed solver preparation cannot be applied`);
  }
  const prepared = structuredClone(spec);
  const reviewed = prepared.pose.base;
  reviewed.solve.vars = reviewed.solve.vars.filter(name => name !== 'pz');
  if (reviewed.solve.reg) delete reviewed.solve.reg.pz;
  delete reviewed.hands.left.touch;
  delete reviewed.hands.right.touch;
  return prepared;
}
