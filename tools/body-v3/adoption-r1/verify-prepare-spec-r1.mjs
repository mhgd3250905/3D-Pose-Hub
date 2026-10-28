import assert from 'node:assert/strict';
import source from '../../../drill-anim/specs/h-side-leg-raise.js';
import { prepareReviewedSpec } from './prepare-spec-r1.mjs';

const original = structuredClone(source);
const prepared = prepareReviewedSpec(source);
const expected = structuredClone(source);
expected.pose.base.solve.vars = ['px', 'py'];
delete expected.pose.base.solve.reg.pz;
delete expected.pose.base.hands.left.touch;
delete expected.pose.base.hands.right.touch;
assert.notStrictEqual(prepared, source);
assert.deepStrictEqual(prepared, expected, 'only the reviewed three fields may change');
assert.deepStrictEqual(source, original, 'source must remain unchanged');
assert.deepStrictEqual(prepareReviewedSpec(prepared), prepared, 'preparation is idempotent');
assert.deepStrictEqual(prepared.timeline, original.timeline, 'all timing and shoe-angle tracks remain');
assert.deepStrictEqual(prepared.qa, original.qa, 'the hand-contact QA remains');
for (const id of ['h-side-leg-raise-r2', 'h-side-leg-raise-r6']) {
  const revised = { ...source, id };
  assert.deepStrictEqual(prepareReviewedSpec(revised), { ...expected, id });
}
for (const id of ['h-side-leg-raise-other', 'h-side-leg-raise-r0', 'another-action']) {
  const unrelated = { ...source, id };
  assert.strictEqual(prepareReviewedSpec(unrelated), unrelated, 'unreviewed actions retain identity');
}
assert.strictEqual(prepareReviewedSpec(null), null);
assert.throws(() => prepareReviewedSpec({ id: 'h-side-leg-raise', pose: { base: {} } }), /Unexpected/);
console.log('PASS: scoped preparation, source isolation, idempotence, preserved tracks and QA, invalid layout');
