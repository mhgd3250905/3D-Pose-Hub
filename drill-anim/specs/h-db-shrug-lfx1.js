// h-db-shrug-lfx1 (legacy-fix r1 batch 5 / b5-1, 2026-11-21, codex/legacy-fix-r1): built on h-db-shrug-kn1 (unchanged file).
// Triage b5 (TRIAGE-b5.md): text-reps-static 0.0 cm -- on V5 the whole body moved 0 mm in 8 s (shoulders, scapulae, hands); only the
// upper arm / forearm turned 13-19 deg in place, so the shrug could not be seen. Cause: the hub draws the shrug as a scapula
// translation (shoulders.shift, chest-frame +Y up to 50 mm, tracks k0-k2; hands follow via k3-k5), and plain V5 copies bone
// rotations only, so that translation was dropped.
// Change: opt in to v5.scapulaShift for this action only (tools/v5/runtime/v5-hub.js; the V5 scapula pivots are placed at the hub's
// every frame and the arm follows by FK, as t-chair-support-hold / t-hanging-leg-raise). The library default stays off. Motion,
// timing, hands, dumbbells and camera are kn1's.
import base from './h-db-shrug-kn1.js';
export default { ...base, id: 'h-db-shrug-lfx1', revisionOf: 'h-db-shrug-kn1', v5: { ...(base.v5 || {}), scapulaShift: true } };
