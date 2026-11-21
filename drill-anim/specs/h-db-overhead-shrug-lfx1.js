// h-db-overhead-shrug-lfx1 (legacy-fix r1 batch 5 / b5-1, 2026-11-21, codex/legacy-fix-r1): built on h-db-overhead-shrug-r4
// (unchanged file).
// Triage b5 (TRIAGE-b5.md): text-reps-static 0.0 cm -- on V5 the overhead shrug did not move (shoulders, scapulae, hands 0 mm).
// Cause: the hub raises the shoulder blades by translating the scapula bones (shoulders.shift, chest-frame +Y up to 40 mm, track k1),
// and plain V5 copies bone rotations only, so the elevation and the dumbbells' rise were dropped.
// Change: opt in to v5.scapulaShift for this action only (tools/v5/runtime/v5-hub.js; V5 scapula pivots follow the hub's every frame,
// the arms follow by FK). The library default stays off. Motion, timing, hands, dumbbells and camera are r4's.
import base from './h-db-overhead-shrug-r4.js';
export default { ...base, id: 'h-db-overhead-shrug-lfx1', revisionOf: 'h-db-overhead-shrug-r4', v5: { ...(base.v5 || {}), scapulaShift: true } };
