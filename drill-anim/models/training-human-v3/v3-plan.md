# training-human-v3 proportion plan + build status — 2026-10-27 (UTC+8)

## Plan (segments off by more than ~4%)

| Segment | Current | v3 | Factor |
|---|---|---|---|
| Upper arm | 0.256 | 0.322 | ×1.257 |
| Forearm | 0.228 | 0.253 | ×1.108 |
| Thigh | 0.353 | 0.424 | ×1.20; **deferred to v3b**, see below |
| Shank | 0.409 | (0.425) | ×1.04; deferred together with the thigh |
| Shoulder width | 0.376 | keep | +4% is at the threshold; keep |
| Hand | r8 (0.158) | r8 as chosen | an r8 scaled ×1.18 (0.187 m) would match the norm once the arms are fixed; 开 to decide |

- Stature is kept at 1.729 m.
- Fixing the thigh without changing stature means lowering the pelvis-to-shoulder length by about 7 cm (torso −14%) or raising the hip. That changes every floor and leg contact, so it is proposed as a separate step (v3b) after arm migration.
- Standing fingertip target with v3 arms and r8: about 0.644 m (norm 0.65 m).

## Phase-1 status
- **Done:** `drill-anim/models/training-human-v3/coach-rig-v3.json`. Landmarks and bone pivots are moved for the new upper arm and forearm, and the hand chain is translated. This is a new file; the frozen rig is untouched.
- **Not done:**
  - Blender rebuild of glb bones and skin.
  - Limb mesh re-skin.
  - Sleeve/cuff refit.
  - r8 attach.
  - Colour gradient material.
  - Viewer loader.
  - Review renders.
- **Why:**
  - Blender is not installed on the box. The available memory is about 3 GB of 15 GB.
  - A clean rebuild is a multi-day job. It covers glb bone rests, re-weighting the elbow, shoulder and wrist zones, remapping the v2plus limbs/outfit bind meshes and cuff planes, and moving the r8 seam ring.
  - The viewer builds the motion from `/coach/flare-coach.glb` and the rig at boot (`runtime/src/viewer.js:111`). Re-creating it at runtime breaks ground placement: `footBounds` comes from the already-skinned state (verified in the arm experiment). Loading v3 therefore needs either a new-version copy of `viewer.js` with a selectable glb/rig URL, or a rig-only path in a v3 copy of `coach-motion.js`. Both are new files and need sign-off on the approach.

## Next steps (estimate)
1. Install Blender 4.x on the box (about 0.5 h). Script `tools/body-v3/build_v3.py`:
   - load `flare-coach.glb`;
   - move the elbow/wrist/hand bone heads to the v3 rig;
   - remap arm vertices with a smooth piecewise mapping along the bone (blend zones of about 6 cm at the shoulder, elbow and wrist, so nothing stretches);
   - keep the weights;
   - export `runtime/public/coach-v3/flare-coach-v3.glb`.
   
   About 1 day.
2. Remap the v2plus limbs, outfit and cuff planes with the same mapping in Python. Re-anchor the r8 seam ring with the 28 mm blend. About 0.5 day.
3. v3 page/material: copy `human-v2plus.js` to `human-v3.js` and add the wrist sleeve-to-skin gradient. Write a v3 loader and viewer copy with a version switch. About 1 day.
4. Review renders as specified; manifest SHA list; checks. About 0.5 day.
