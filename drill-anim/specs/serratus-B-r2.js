// serratus-B r2 (2026-10-30, review #8): the roller is the same dark tone as the wall and the forearms, so it vanished in
// the side view; it now uses a lighter blue-grey foam colour (geometry, contact depth and motion unchanged). Review frames are
// taken at the bottom (0.1 s), top (1.5 s), top + protraction (2.6 s) and back at the bottom (4.1 s): the old samples at
// 1/3/5/7 s all fell near the top of the slide, which made the 15 cm slide look like 4 cm.
import prior from './serratus-B.js';
const spec = structuredClone(prior);
spec.id = 'serratus-B-r2';
spec.props = spec.props.map(p => p.type === 'foamRoller' ? {...p, colour: '#8fa3bd'} : p);
spec.keyFrames = [0.1, 1.5, 2.6, 4.1];
export default spec;
