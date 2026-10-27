# Ankle r17 — experimental candidate

r17 extends the isolated r16 candidate. It clones the existing materials for
`Coach_Sneakers` and `Coach_Shoe_Details` and enables double-sided drawing on
those clones. Their original toon compile hooks and theme uniforms remain in
use; each clone gets a distinct program cache key. Skin, other meshes, vertex
positions, skin weights, skeleton and actions are not changed by this step.
The renderer can therefore draw the existing shoe inner-facing surfaces without
turning the skin double-sided. r16's local rim and front-face shading changes
remain in effect.

Run `node drill-anim/models/body-v3-ankle-r17/verify.mjs` before use. The
manifest fixes hashes for this loader and its listed runtime/model inputs;
the base hands/v2plus verifiers also run through the base loader. The root
Vite server and the repository's configured Playwright/Three.js runtime are
required for browser rendering. The manifest does not claim that every
transitive runtime dependency is frozen.

This candidate is not approved or release-eligible. A same-scene r16 probe
showed that temporarily drawing these shoe surfaces double-sided covered the
two sampled fold background gaps, while changing some interior pixels in
squat and plank. Its cropped open-surface FCL and winding evidence do not prove
global absence of skin/shoe penetration; the original nearest-vertex proxy
still flags plank.

The r17 implementation was subsequently previewed in rest, squat, plank and
fold at the fixed comparison cameras. Its ten images were pixel-identical to
the earlier same-scene double-sided shoe experiment. Both shoe shaders
compiled with `uShoe=1` and the existing theme uniforms, and no other mesh
shared the two candidate materials. A positive-control comparison of the
quadriceps and calves highlight masks at rest produced 12,875 and 8,867
nonzero pixels respectively and no pixel differences against r16. This is
limited to the sampled poses, cameras, theme and static highlight groups; it
does not establish other actions or skins, or replace user visual review.
