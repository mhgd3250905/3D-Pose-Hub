// Run: node --test drill-anim/tools/tests/hand-touch-revisions.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';

const revisions = [
  ['h-bent-knee-calf-raise-rr2', 'h-bent-knee-calf-raise-rr3'],
  ['h-chair-single-leg-hip-thrust-rr3', 'h-chair-single-leg-hip-thrust-rr4'],
];

for (const [previousId, revisionId] of revisions) {
  test(`${revisionId} removes only the unsupported hand touch configuration`, async () => {
    const {default: previous} = await import(`../../specs/${previousId}.js`);
    const snapshot = structuredClone(previous);
    const {default: revision} = await import(`../../specs/${revisionId}.js`);
    assert.deepEqual(previous, snapshot, 'Importing the revision must not mutate its frozen predecessor');
    const expected = structuredClone(snapshot);
    expected.id = revisionId;
    for (const side of ['left', 'right']) {
      assert.ok(Object.hasOwn(expected.pose.base.hands[side], 'touch'), `${previousId}: missing regression trigger`);
      delete expected.pose.base.hands[side].touch;
      assert.equal(Object.hasOwn(revision.pose.base.hands[side], 'touch'), false);
    }
    assert.deepEqual(revision, expected, 'Motion, support, camera, timing and all other parameters must stay identical');
  });
}

for (const [previousId, revisionId, fov] of [
  ['h-bent-knee-calf-raise-rr3', 'h-bent-knee-calf-raise-rr4', null],
  ['h-chair-single-leg-hip-thrust-rr4', 'h-chair-single-leg-hip-thrust-rr5', 14],
]) {
  test(`${revisionId} preserves motion and support while refining hands`, async () => {
    const {default: previous} = await import(`../../specs/${previousId}.js`);
    const snapshot = structuredClone(previous);
    const {default: revision} = await import(`../../specs/${revisionId}.js`);
    assert.deepEqual(previous, snapshot, 'The predecessor must remain immutable');
    assert.equal(revision.id, revisionId);
    assert.equal(Object.hasOwn(revision.v2plus, 'handPose'), false, 'Explicit handPose overrides per-hand relax');
    for (const side of ['left', 'right']) {
      const hand = revision.pose.base.hands[side];
      assert.equal(Object.hasOwn(hand, 'touch'), false);
      assert.equal(Object.hasOwn(hand, 'handPose'), false);
      assert.equal(hand.relax, .2);
      assert.ok(hand.finger[1] < 0, 'Fingers must point down alongside the thigh');
      assert.ok(Math.abs(hand.palmAt[0]) > Math.abs(previous.pose.base.hands[side].palmAt[0]), 'Palms must move outward');
    }
    const actual = structuredClone(revision);
    const expected = structuredClone(snapshot);
    for (const value of [actual, expected]) {
      delete value.id;
      delete value.pose.base.hands;
      delete value.v2plus.handPose;
    }
    if (fov !== null) {
      assert.equal(revision.camera.fov, fov);
      delete actual.camera.fov;
      delete expected.camera.fov;
    }
    assert.deepEqual(actual, expected, 'All motion, support, timing and other camera settings must remain identical');
  });
}
