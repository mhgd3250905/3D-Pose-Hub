// h-db-shrug-lfx2 (legacy-fix r1 batch 5 rework R2, 2026-11-21, codex/legacy-fix-r1): built on h-db-shrug-lfx1 (unchanged file).
// 开哥 (b5 sample review): V5 drew the plain open hand, so the dumbbell looked like it hung beside the hand. Grasp actions must use the
// dedicated grasp hand. The recipe hand mode is already dumbbell-grasp (the hub's accepted fixed fist + dumbbell attached to the hand
// bone), but V5 only shows that fist when the action opts in to v5.hubGraspHands (tools/v5/runtime/v5-hub.js, Thomas supplement r3;
// both sides supported, used together with scapulaShift by t-hanging-leg-raise / t-pbar-support-swing). lfx1 set v5 = { scapulaShift }
// only, so the fist was never drawn (scapulaShift itself does not disable it: the fist is rigid with the V5 hand bone, which follows
// the shifted scapula by FK). Change: v5.hubGraspHands ['left', 'right'] added; scapulaShift kept. Motion, dumbbells, camera unchanged.
import base from './h-db-shrug-lfx1.js';
export default { ...base, id: 'h-db-shrug-lfx2', revisionOf: 'h-db-shrug-lfx1', v5: { ...(base.v5 || {}), hubGraspHands: ['left', 'right'] } };
