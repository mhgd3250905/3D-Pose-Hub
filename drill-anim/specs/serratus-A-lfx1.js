// serratus-A-lfx1 (legacy-fix r1 batch 5 / b5-3, 2026-11-21, codex/legacy-fix-r1): built on serratus-A-r2 (unchanged file; motion
// from serratus-A.js, unchanged).
// Triage b5 (TRIAGE-b5.md): push-up plus, the hands were not fixed: in retraction (f30-50) both palms sank 22-28 mm into the mat, in
// protraction (f60-80) they lifted 18-31 mm (hands drifting up and down with the shoulder blades).
// Cause: the hub draws the movement as a scapula translation (shoulders.shift, chest-frame Z +-3 cm) with the hands planted; plain V5
// copies bone rotations only, so the translation was dropped and the V5 hands rode with the chest (same fault as h-db-shrug, b5-1).
// Change: opt in to v5.scapulaShift for this action only (tools/v5/runtime/v5-hub.js; the V5 scapula pivots are placed at the hub's
// every frame and the arm follows by FK). Motion, timing, hands, feet and camera are r2's.
import base from './serratus-A-r2.js';
export default { ...base, id: 'serratus-A-lfx1', revisionOf: 'serratus-A-r2', v5: { ...(base.v5 || {}), scapulaShift: true } };
