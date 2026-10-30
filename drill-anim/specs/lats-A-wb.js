// lats-A wb (user accepted 2026-10-30 23:25): native twistShare 1 + fingers turned ~25deg outward to remove the thin wrist neck under wrist extension.
import source from './lats-A.js';
const spec = structuredClone(source); spec.id = 'lats-A-wb'; spec.nativeHands = { twistShare: 1 };
const t = Math.tan(25 * Math.PI / 180);
for (const sd of ['left', 'right']) { const h = spec.pose.base.hands[sd]; h.finger = [1, Math.sign(h.at[1]) * t]; }
export default spec;
