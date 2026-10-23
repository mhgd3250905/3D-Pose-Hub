# Independent complete barefoot profile, R4

Explicit profile `training-human-v2plus-barefoot` / `1.0.0-r4.1`; requires realistic skin, base torso/limbs/hands. This isolated opt-in directory does not modify or replace the original production model, source assets, engine, props, default renderer or accepted actions.

Call `applyHumanBarefoot(page, spec)` from loader.mjs after boot and before props/pose. Spec must set `modelProfile:'training-human-v2plus-barefoot'`, `barefoot:{version:'1.0.0-r4.1'}` and the unchanged full base realistic v2plus recipe. Original render.mjs does not know this opt-in loader: never silently render a barefoot spec through the old loader.

This is a complete natural foot/sole/dorsum asset from the same Blender Human Base Meshes v1.4.1 male realistic CC0 source, not merely hidden shoes, a flattened shoe, or invented toe bones. All toe geometry remains intact but no toe-specific teaching or articulation is introduced. Source archive SHA256 811f43accbb31a88266d932f8f5563b2d13586fca0ba2693aad1f5fe582b3515, official source and license recorded in SOURCE.json. build_feet.py uses the existing authorized extraction/subdivision/mesh operations and does not execute embedded .blend code. Generated JSON is self-contained for offline loading; source regeneration uses official archive and existing base extraction scripts.

77,350 triangles / 38,705 vertices. The original 6,640 active old-foot faces are identified by exact vertex triples and replaced with two complete feet. The other active old-body surfaces remain. Each 28-vertex ankle boundary uses the exact live original owner position and skin influences. Shared ankle normals are reversibly overridden. Foot and Shin are the existing real bones, not fabricated toe joints.

Filtering requires a full current index draw range and rejects partial ranges; it never hides the entire Coach_Body. Shoes hide only when the new complete feet are enabled. Before selecting any other profile, restore original index object, drawRange, shoe visibility, foot cloud and limb normals exactly. Original model source files and current-production.json remain byte-identical. Unit evidence is supplied with the batch.

Point-cloud convention deliberately matches engine.js: actual loaded reset world points minus reset ankle, subsequently rotated by the engine's world-rest delta quaternion. Do not apply the authored Foot quaternion inverse a second time. Full posed mixed-weight ankles and lower legs still require action QA; rigid cloud alone is not an acceptance proof.

Build checks establish finite nondegenerate manifold local geometry with 28-vertex ankle boundaries, no quantization flips, protected foot unchanged and positive orientation. They do not certify no self-intersection in arbitrary poses, support pressure, anatomical safety or complete GPU acceptance. Each action's captured geometry and teaching objective must be checked separately.

## Experimental status: FAILED kneeling dynamic validation
Static construction, exact seam and original-profile rollback checks passed. R4 kneeling capture exposes distant non-adjacent ankle-bridge self intersections. This asset/profile is diagnostic only, NOT production-ready or action accepted. Both actual attempts are retained; no third attempt.
