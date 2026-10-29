# Fixed wrist + body correction composition r1

Candidate integration only; no change to accepted wrist geometry or deformation
math, frozen contour r3, ankle r5, or elbow DQS r1 sources. This module owns the
entire fixed-grasp installation and must replace the normal wrist/corrections
installation for those seven action paths; do not install either twice.

```js
// After model.applyV3(page, source), before action capture:
const fixed = await import('./fixed-wrist-corrections-r1.mjs');
const setup = await fixed.install(page, {
  upperArm: true, ankle: true, elbow: false,
  showDumbbells: prepared.handSetup.showDumbbells,
});
```

The component applies r3 to the original torso/limbs first. It verifies exact
position/normal preservation at all source vertices contributing to the accepted
wrist cut boundary. The unchanged wrist loader then interpolates its new topology
from that corrected source. Required cuff/ankle source IDs must each have exactly
one retained vertex of weight 1; missing, interpolated or ambiguous IDs are errors.
The cuff measurement is rebound to 56 mapped world-space pairs, while ankle r5
receives its 56 explicit seam pairs remapped to the new limb topology. Original
body indices are retained. No spatial nearest-neighbor fallback is used.

The renderer nesting is **wrist → dynamics → frozen original renderer**. Scene
hooks remain **existing hooks → wrist update → ankle → optional elbow**. A forward
gate allows this nesting without modifying any frozen wrapper. Dynamic `finally`
restoration therefore completes before wrist `finally` restores and hashes its
full buffers/bones/caches. Errors from update, draw and sample callbacks propagate.
No restore/hash checks are disabled. `__fixedWristCorrectionsR1.measure()` also
throws if any available frozen wrist restore check is false. Existing APIs remain
available for capture: `__upperArmContourR3.measure`, `__ankleJoinR5.last`, and
`__webxrWristJoin.sample`/`lastRestoreCheck`.

Call `__fixedWristCorrectionsR1.detach()` only when no later renderer hooks are
installed. It detaches dynamics, then wrist (restoring original geometry), then
contour. Installation failure marks the page `failed-discard-page`: discard it,
because a failed frozen installer may not yet have exposed its cleanup closure.
This differs from render/callback exceptions after a successful installation,
whose finally restoration remains active and is tested.

Nine Node tests cover real accepted wrist ankle-source mapping, invalid/ambiguous
mapping rejection, exact protected boundary guard, render receiver/arguments,
normal restoration and exceptions in wrist update, dynamic update, draw and sample.
These tests validate the composition contract, not GPU geometry. Actual fixed-grasp
GPU checks are still required: cuff and ankle seams, preserved wrist boundary,
all three wrist restore booleans, raw/actual pose invariance and visible shape.
Optional DQS is wired but should remain off until action-specific actual blend
determinants and combined geometry are verified. No blanket singularity guarantee.
