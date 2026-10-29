# Remaining 32 action templates — review stage

The user confirmed on 2026-10-28 that these 32 actions come before revisiting the historical 219-action pack. The current deliverable is reusable action and camera templates, reviewed in small groups. Low-resolution complete-loop previews support that review. Final high-resolution rendering, download optimization and whole-pack production are deferred until template review is complete.

## Fixed requirements

- Use the selected short-arm body `training-human-v3-armfix/0.1.0-r2`. The accepted fixed dumbbell grip and wrist r4 are selected explicitly only for compatible dumbbell actions.
- Preserve action meaning, clear support relationships, correct wrist and ankle directions, and a continuous rotation path. An identical start/end orientation does not prove that no extra 180/360-degree turn occurred.
- Keep the camera fixed within the action. Frame the full body and necessary props throughout the loop, choose an angle that teaches the movement, and remove ground shadows while retaining body shading.
- Target-muscle highlights use the user's requested orange-red direction (`#F05A36` preview candidate), retaining shading and a restrained effort pulse. Exact appearance awaits preview review; this is a teaching cue, not measured blood flow.
- Store one content rectangle for the whole loop rather than moving/recentering it every frame.
- Save source/model/camera/hand identities and individual review records. User acceptance remains separate from automated checks and agent image inspection.
- Preserve old sources and media. New model compatibility is checked with new previews; old user approval does not automatically transfer to a different body/hand adapter.

## Scope and progress

On 2026-10-29 the user authorized preparing one complete low-resolution review
candidate for all remaining 30 actions overnight, resolving routine problems with
recommended choices. This supersedes the earlier small-batch waiting boundary for
preparation only; user acceptance and final production remain separate. The user's
updated quota stop is weekly remaining capacity **at or below 10%**. See
`overnight-plan-20261029.json`; no high-resolution production, push or release is
part of that authorization. The local gallery and per-attempt evidence are under
`F:/PoseHub-v2-production/remaining32-template-r2-20261029/overnight/`.

On 2026-10-29 the user accepted the first two templates' motion, hand setup and
camera/framing, while explicitly deferring highlight color/material selection.
See `approvals/batch01-motion-camera-20261029.json`: 2 templates accepted, 30 remain.
The historical capture/batch reports retain their original pending-review state;
the new scoped approval is the current review authority. Overall `reviewed:false`
and `releaseEligible:false` remain because appearance and final production are pending.

`highlight-presets.json` preserves both solid orange-red and translucent-glow
variants. `selectedPreset:null` means no final appearance choice. The existing
`recipe.appearance.highlight` parameters control color, shade, intensity and optional
material opacity/emission/Fresnel; selecting a material does not change action or
camera data. Current solid preview values are a temporary fallback only.

There are 8 gap actions, 14 legacy home actions and 10 legacy specialist actions. `groups/` contains recipe candidates; the presence of a recipe is not a completed action or approval. The stopped `t-half-straddle` remains excluded.

The first review group focuses on `h-db-reverse-curl` and `h-db-zottman-curl`, especially the fixed-grip wrist origin, mirrored palm orientation, forearm rotation, neutral standing and loop seam. Their r5 source candidates retain the old r2 and diagnostic r3/r4 files. The r4 elbow pole follows the intended elbow plane; Zottman uses one slower eight-second repetition for clear forearm turns. The r5 sources add explicit effort tracks; Zottman also uses full forearm axial sharing to avoid the half-share discontinuity at the +/-pi branch. Actual render-time rotation evidence is required, because pre-render targets missed that defect. All other recipes now have low-resolution candidates; user review remains pending per action.

Use `tools/action-completion-v3-r2/render.mjs --recipe <recipe> --runtime <runtime-pin> --out <new-output> --phase preview --size 480 --preview-fps 12`. The solver still evaluates every frame at 30 Hz; the review clip is a low-resolution preview. Each attempt has its own directory and original evidence is retained.

The first accepted pair remains under `F:/PoseHub-v2-production/remaining32-template-r2-20261028/review-batch01/`; the current remaining 30 previews are under `F:/PoseHub-v2-production/remaining32-template-r2-20261029/overnight/`. Do not use this candidate folder as an automatic production whitelist. No user action approval or media release is implied by this preparation.

## Overnight candidate closeout

All 30 remaining templates now have current low-resolution candidate previews and
agent visual review records. See `overnight-candidates-20261029.json` and
`docs/remaining32-template-review-20261029.md`. This is a user-review handoff,
not user acceptance or final production. The weekly stop floor remains 10 percent.

## Current version checkpoint

`remaining32-template-optimizations-20261029-r1` is the current source/recipe/review checkpoint. See [snapshot](../../../docs/production-snapshots/remaining32-template-optimizations-20261029-r1.md) and [machine index](../versions/remaining32-template-optimizations-20261029-r1.json). The original overnight-candidates JSON is a historical first-pass snapshot; use this version index for latest attempts. Two full motion/camera templates are accepted; bear upper-arm r3 has additional scoped appearance acceptance. No third full-template acceptance or release is implied.
