# Completed v3 candidate: P2, P3, wrist and arm normals

This experimental entry composes the existing head/neck fragment and shared
collar with the wrist gradient and normal repairs. P1, P4 and P5 are not part
of this candidate. Call `boot` from this module and then `applyV3` exactly once
on that page, initially selecting `v2plus.torso`, `limbs` and `hands` as `base`
with c1r2 hands. Setup initializes the base v3 once, installs the wrist hook,
repairs piece normals at rest, then installs the collar and garment refinement.

The collar copies the repaired torso normals away from the 96-point collar ring
and retains the seam normals at that ring. This experimental version locally
adjusts the P3 neck ring and 105 internal garment vertices to address shoulder
camera fragments; the original clothing boundary is fixed. The garment clone
transports the affected normals with the changed surface, updates rest-position
textures, and refreshes copied textures after the source outfit changes. A
profile wrapper synchronizes original and refined garment normals when switching
torso profiles or changing hands/outfit without a geometry swap; seven new
garment-point normals are interpolated from their parent triangle.

`detachGeometryLayers(page)` removes the profile sync, garment refinement,
collar and head/neck fragment in reverse order. Base arm normals, piece normals
and their profile hooks, and the wrist material hook persist for the page's
lifetime; this is not a complete unload. A new page is required for another
fresh setup. On a setup error, attached geometry layers are removed where
possible; permanent normal or wrist changes may remain if their setup started.

```sh
node drill-anim/models/training-human-v3-completed-r4/verify.mjs
node tools/body-v3/completed-v3-r1/check-r4.mjs
node tools/body-v3/completed-v3-r1/test-profile-normal-sync-r4.mjs
node tools/body-v3/completed-v3-r1/verify-visual-r4.mjs <new-output-directory>
```

The visual probe needs the configured v3 Vite server. It compares normal
buffers before and after P3, tests profile changes, produces wrist, shoulder,
elbow, head/neck, theme, highlight and real-action frames, then checks partial
detach. Review images separately; numeric checks alone do not establish visual
or device acceptance. Text hashes normalize CRLF to LF; binary GLB hashes use
raw bytes. This is not a baked complete GLB.
