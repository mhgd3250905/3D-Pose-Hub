# Instep native R1

Explicit composition for `h-kneeling-instep-stretch-rr6`: native hand R3 mesh
and finger rig, plus the unchanged barefoot R5.2 source-matched toes and dynamic
ankle bridge. No frozen hand, foot, base model or production entry is modified.

The loader checks both frozen source chains before loading. It builds the base
once with the native rig, then installs the original R4/R5 foot code and assets.
It maps both model selection and pose dispatch to the R5 foot profile so its
per-pose ankle bridge runs unchanged. Hand acceptance on two prior actions does
not automatically approve this combination. The candidate remains scoped,
non-default and awaiting visual review.

The initial specification preserves every body, hand-target and foot track from
R5. Preview and actual geometry verification are required before production.
