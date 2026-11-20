// t-pike-hold 地面派克支撑 (floor pike hold) · Flare 2.0 new moves r1 (2026-11-20), P2.
// Standard: tools/flare2-moves/standards/t-pike-hold.md. Imported from t-elevated-pike-hold (same frame, hands, solver, timing and
// camera, so the two are filmed from exactly the same side view for comparison); only the feet change: balls of the feet on the mat,
// walked in toward the hands, legs straight, hips the highest point. No chair.
// Hands/arms come from t-elevated-pike-hold (r1 arm fix 2026-11-20: whole-arm outward roll, elbow pits toward the fingers, elbow not
// twisted). This file is edited with every hand change there so its recipe hash changes too (produce.mjs re-renders by recipe hash).
import base, { foot } from './t-elevated-pike-hold.js';
const s = structuredClone(base);
s.id = 't-pike-hold'; s.name = '地面派克支撑'; s.nameEn = 'Pike Hold';
const FX = 0.95, SH_X = 0.21;   // ankles: feet walked in toward the hands; shoulders further toward the feet so the arms stay in line with the trunk
s.pose.base.feet = { right: foot(-1, FX, 0, 42), left: foot(1, FX, 0, 42) };
s.pose.base.pelvis = [0.42, 0.95, 0];
s.pose.base.constraints[4] = { ...s.pose.base.constraints[4], value: SH_X };
s.props = [{ type: 'mat', at: [0.45, 0, 0], size: [1.83, 0.61, 0.006] }];
s.flare2 = { version: 'r1', priority: 'P2', status: 'draft-awaiting-user-review', reviewed: false, releaseEligible: false };
export default s;
