// h-squat-r2: h-squat on the native hand r3 model via native-open-r1 (free hands, no contact).
// Motion, hand targets, feet, timing, highlight and camera are unchanged; only the explicit hand model changes.
// Free hands keep finger = arm direction (straight wrist), so no finger re-aim is needed. Candidate: not reviewed / not release-eligible.
import previous from './h-squat.js';
const s = structuredClone(previous);
s.id = 'h-squat-r2';
s.modelProfile = 'training-human-v2plus-hands-native';
s.nativeHands = { version: '1.0.0-r3' };
export default s;
