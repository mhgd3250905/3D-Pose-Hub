// h-db-front-raise-r3 (elbow-twist r2, 2026-11-09): orientation-first redo of the elbow pinch, replaces h-db-front-raise-r2.
// Dumbbell front raise: references (ACE exercise library, Verywell Fit) = pronated grip, palms facing the thighs at the start and
// palms DOWN at the top. The spec had the palms turned up (supinated past neutral), a roll the elbow could not carry; -r2 rolled the
// humerus 100 deg instead. Now: upper arms untouched (elbow pits facing in), both grips rolled 180 deg about the finger axis
// (palms down / toward the thighs). The dumbbell turns with the hand about the wrist (palm point moves up to 50 mm).
import base from './h-db-front-raise-et1-kn1.js';
import { rollHand } from '../lib/arm-orient-r2.mjs';
const s = structuredClone(base);
s.id = 'h-db-front-raise-r3';
rollHand(s, 'left', 180);
rollHand(s, 'right', -180);
export default s;
