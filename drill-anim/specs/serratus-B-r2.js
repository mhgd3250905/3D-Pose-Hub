// serratus-B r2 (2026-10-30, review #8): the roller is the same dark tone as the wall and the forearms, so it vanished in
// the side view; it now uses a lighter blue-grey foam colour (geometry, contact depth and motion unchanged). Review frames are
// taken at the bottom (0.1 s), top (1.5 s), top + protraction (2.6 s) and back at the bottom (4.1 s): the old samples at
// 1/3/5/7 s all fell near the top of the slide, which made the 15 cm slide look like 4 cm.
import prior from './serratus-B.js';
const spec = structuredClone(prior);
spec.id = 'serratus-B-r2';
spec.props = spec.props.map(p => p.type === 'foamRoller' ? {...p, colour: '#8fa3bd'} : p);
spec.keyFrames = [0.1, 1.5, 2.6, 4.1];
// r2c (user review 2026-10-30): with the default native twistShare 0.5 the forearm skin pinched just above the wrist in the
// bottom position (palms facing, forearm rotated ~80 deg vs the upper arm). twistShare 1.0 spreads the hand roll over the
// whole forearm and the wrist stays continuous (A/B 0 / 0.5 / 1.0 checked at 0.1 s).
spec.nativeHands = { twistShare: 1 };
// r2d (user accepted 2026-10-30 16:53): a small dent remained on the ulnar wrist edge in the bottom frame (forearm ~80 deg
// rotated vs the upper arm). Turning both palms ~25 deg forward ([-sg,0,0] -> [-sg,0,0.45]) lowers that rotation and the
// wrist line is flat; wrist targets, roller contact and timing unchanged (A/B -25 / 0 / +25 deg checked).
for (const sd of ['left', 'right']) { const sg = sd === 'left' ? 1 : -1; spec.pose.base.hands[sd].normal = [-sg, 0, 0.45]; }
export default spec;
