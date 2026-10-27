// Reproduce the original r3 preview spec in memory from main's frozen r2.
// This is a preview fixture, not a new action specification or catalog entry.
import previous from '../../../drill-anim/specs/a-deep-squat-r2.js';

export function makeDeepSquatR3Fixture() {
  const spec = structuredClone(previous);
  spec.id = 'a-deep-squat-r3';
  spec.modelProfile = 'training-human-v2plus-hands-native';
  spec.nativeHands = {version: '1.0.0-r3'};
  return spec;
}
