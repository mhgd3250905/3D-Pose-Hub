# Experimental v3 head, neck and collar entry

`loader.mjs` composes the existing v3 head/neck entry with a shared-index
neck-to-torso bridge and an internal garment refinement. It retains the v3
runtime skeleton, head and neck toon materials, and the original garment
boundary. The initial profile must select `v2plus.torso: "base"`; later profile
switches restore the original garment geometry whenever the base torso is off.
Call `detach(page)` to remove the three layers in reverse order.

The bridge has 200 neck and 96 torso shared edges. The garment refinement
subdivides six triangles and offsets seven new internal vertices by 0.2 mm;
original garment vertices and outer boundary remain unchanged. Skin weights and
the per-vertex toon textures are interpolated. The model remains an experimental
candidate: it is not a baked complete GLB and it has not passed broad device or
all-motion validation.

Verify portable hashes, then run the integration probe with a running v3 Vite
server and a new output directory outside the repository:

```sh
node drill-anim/models/training-human-v3-collar-r1/verify.mjs
node tools/body-v3/collar-weld-r1/verify-v3-collar-integration-r1.mjs <new-output-directory>
node tools/body-v3/collar-v3-r1/build.mjs <new-overlay-directory>
```

The probe selects collar vertices once in the rest pose, compares every torso
vertex and bone inverse against the original at two deep-squat frames and a
bear-crawl hold, records same-camera images, and checks profile switches and
detach. Image review and other poses remain separate checks. Text SHA-256 uses
UTF-8 with CRLF normalized to LF; GLB hashes use the original bytes.

The build command deterministically assembles the verified, frozen model assets
and recursive manifest dependencies into a new overlay directory. It does not
reconstruct the edits from the original unmodified geometry, and the overlay
requires the rest of this repository, its installed dependencies, and the v3
server. It refuses an existing output directory.
