// o-stand-quad-lfx1 (legacy-fix r1 batch 5 / b5 wrist, 2026-11-21, codex/legacy-fix-r1): built on o-stand-quad-r1 (unchanged file).
// Wrist screen b5 (TRIAGE-b5.md): the right hand that holds the lifted foot was bent back toward the back of the hand by 139-150 deg
// with 54-84 deg deviation (palm against the side of the shoe, fingers pointing backward along it): the wrist is forced past its range.
// Text (v3-text cue0): 「手抓脚踝，把脚后跟往屁股拉」.
// Change: only the right hand. The wrist target moves 6-9 cm up / 8 cm back / 5 cm in (to the outside of the ankle, which sits at hip
// height behind the body) and the hand continues the forearm line (wrist extension ~8 deg, no deviation): the open palm lies on the
// outside of the ankle (palm toward the body midline), fingers down over the ankle/heel. (The V5 hand is one rigid open mesh, so a
// closed grip is not possible; this is the doable 'holding the ankle'.) Elbow pole, foot, legs, left hand on the chair, timing and
// camera unchanged. Values: base = measured forearm at t 0, 'open' delta = measured forearm at t 4 (open = 1).
// Round 1 (wrist target unchanged, fingers down along the forearm): wrist 7-10 deg but the hand hung on the thigh below the foot.
import base from './o-stand-quad-r1.js';
const s = structuredClone(base);
s.id = 'o-stand-quad-lfx1'; s.revisionOf = 'o-stand-quad-r1';
Object.assign(s.pose.base.hands.right, { wrist: [-0.158, 0.975, -0.20], finger: [0.181, -0.963, -0.2], normal: [0.984, 0.177, 0.037] });
const R = s.pose.deltas.open.hands.right;
Object.assign(R, { wrist: [-0.158, 1.0, -0.17], finger: [0.31, -0.907, 0.286], normal: [0.951, 0.295, -0.093] });
export default s;
