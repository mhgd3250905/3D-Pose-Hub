# Anatomy data and static fitness reference attribution

## Default static fitness reference: Human Base Meshes

`fitness-reference.glb` and `fitness-reference.json` use the official **Human
Base Meshes v1.4.1** bundle by Blender Studio and community contributors.
The source body is `GEO-body_male_realistic`. The official bundle retains
its original paired eye objects, but this final derivative omits independent
eye meshes. The official source bundle is released under **CC0 1.0**.

- Official bundle and licence: https://www.blender.org/download/demo-files/
- Official archive: https://download.blender.org/demo/asset-bundles/human-base-meshes/human-base-meshes-bundle-v1.4.1.zip
- CC0 terms: https://creativecommons.org/publicdomain/zero/1.0/
- Original archive SHA-256: `811f43accbb31a88266d932f8f5563b2d13586fca0ba2693aad1f5fe582b3515`.
- Preserved local acquisition record: `assets/blender-studio-source/SOURCE.md`.
- Editable derivative: `assets/coach/fitness-reference.blend`.
- Reproduction script: `tools/blender/build_fitness_reference.py`.

The derivative retains the authored complete head, body, arms, hands and feet.
Original subdivision is evaluated only on the derivative; neutral low-gloss
skin, independent coordinates, localized under-clothing privacy treatment
and matte navy shorts copied from the source pelvic/thigh surface are local
adaptations. The original archive and Blender source file remain preserved.
The source head, ears and neck retain their natural complete contour.
Local low-detail smoothing and caps made from original boundary vertices
close the deep anterior eye/mouth pockets on the derivative. No replacement
head is constructed. Detailed modifications, object roles, bounds and
output hashes are recorded in `fitness-reference.json`.

Final GLB: **2 meshes, 81,002 triangles, 2.52 MB (2,523,408 bytes)**:
74,274 body triangles and 6,728 clothing triangles; no independent eyes.
SHA-256: `47b9427d19d82cb4f573196028e1513c20b719c41a2a5fd961579360412f442d`.
The final 12 targeted checks passed. Original source assets remain unchanged;
27,754 unique below-neck body positions and all shorts attributes, indices,
materials and matrices match the preceding static derivative.

This is a static body-surface teaching reference. Functional colour regions
indicate related muscle locations, without adding internal muscle geometry
or claiming measured activation or strength. Body and clothing surfaces
may both indicate functional location, including broad shorts regions over
the covered hips and glutes. Deep muscles are located by body region;
these surface colours are never anatomical muscle boundaries. This static
reference clothing display is separate from the Snow motion actor, whose
matte black shorts remain uncoloured. The reference is not registered to
BodyParts3D or Snow, and contains no Flare motion rig or animations.

The default reference is loaded locally using bundled Three.js GLTFLoader.
A second camera and scissor viewport render the same complete model as a
3D whole-body locator. Surface teaching and the independent BodyParts3D
structure mode are separate: the existing muscle meshes are not embedded
into this different body. Existing training remains text-only.

Adam by rreallCakes has not been acquired or adopted. Its publicly visible
commercial licence and account-required acquisition barrier are recorded
in `assets/model-candidates/adam/SOURCE.md`.

## BodyParts3D source anatomy

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

- License: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html (updated 2025-02-27)
- Dataset: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- License terms: https://creativecommons.org/licenses/by/4.0/
- Source geometry: `isa_BP3D_4.0_obj_99.zip`, BodyParts3D 4.0.
- English names and relationships: IS-A and PART-OF concept, element, and inclusion tables from the same archive.
- Publication: Mitsuhashi et al. (2009), BodyParts3D: 3D structure database for anatomical concepts. https://doi.org/10.1093/nar/gkn613

Adaptations: axes and units converted from millimeters/Z-up to meters/Y-up; translated to rest at the stage; geometry simplified using meshoptimizer with 0.2% relative error limit per structure; normals quantized to signed 16-bit; packed into binary chunks; curated display system groupings and colors. The source contains 2,234 individual OBJ meshes; all remain represented. The combined hierarchy contains 3,432 named FMA concepts, which may reference multiple meshes. Original source identity is preserved in the manifest.

Source OBJ comments mention an older CC BY-SA 2.1 Japan license. The official current database license linked above supersedes that legacy text and explicitly permits redistribution and adaptation under CC BY 4.0.

BodyParts3D represents an adult male reference anatomy based on TARO MRI and anatomical illustration refinements. It is not a complete model of every possible human anatomical structure or variation. This interface is educational and is not a clinical tool.

## Historical assets (not included in the current release)

Earlier repository revisions included female reference anatomy: Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, *3D Reference Organ Set for Female v1.5* (2023). CC BY 4.0. Geometry adapted for this viewer.

- Source DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- Dataset: https://lod.humanatlas.io/ref-organ/united-female/v1.5
- Original GLB: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- License: https://creativecommons.org/licenses/by/4.0/

Adaptations: translated native meter/Y-up coordinates onto the stage, coincident vertices welded and source normals averaged, geometry simplified with a 0.2% per-structure relative error bound, and normals quantized. Colors and display systems are curated for this interface. All 888 source meshes are represented, with 1,073 source nodes available as selectable individual or compound concepts.

This is a reference assembly with whole-body surface and selected organs, including female reproductive anatomy. Its skeleton and muscle coverage is partial. It is not a complete model of every human structure or a single-person scan. Eight placenta/umbilical structures are classified under Pregnancy reference and hidden by default.


## Adaptations in this local fitness atlas

Source repository: https://github.com/ashemag/human-atlas
Source commit: 1c38bf35c254a891200d3cedecfd57abebe83d8d
Original application code: Copyright (c) 2026 ashemag, MIT. Full code license is
preserved in human-atlas-MIT.txt. The anatomy data remains CC BY 4.0.

The local atlas selects 238 skeleton structures and 399 skeletal-muscle meshes,
omitting organs, vessels, eye movement muscles and cardiac papillary muscles.
Existing optimized position, normal and index values are preserved exactly;
the buffers are repacked by layer into little-endian binary files with gzip.
Sixteen muscles originally mapped to skeletal/connective display layers are
reclassified as muscular. Original BodyParts3D/FMA identifiers, English names,
bounds and source-system mappings are preserved. Training-oriented anatomical
groups and Chinese display labels are added for selection. A separate optional
body-surface file is repacked from the original Skin structure.

## Retained BodyParts3D structure-mode reference (2026-10-07)

The earlier `muscle-reference.glb` body is retained for the independent
**anatomical structures** mode. It is no longer the default fitness body.

`muscle-reference.glb` is an independent derivative of the same BodyParts3D
Skin structure (FJ2810 / FMA7163), with provenance and adaptations recorded in
`muscle-reference.json`. It retains a complete head, torso, arms, hands and
feet in the original standing pose and metre/Y-up atlas coordinate system.
Opaque pale body materials, matte navy athletic shorts, a complete low-detail
head and cosmetic Skin-scalp-derived hair provide a readable fitness reference.
Facial openings are closed and nose/mouth detail softened only in the derived
Skin copy. The final reference displays no independent eye meshes. Clothing,
hair and the simplified head appearance are adaptations, not additional
anatomical structures. Limited privacy surface
adaptations apply only to this derivative; the original Skin, atlas indices
and muscle/skeleton binary assets remain unchanged.

The local application loads this GLB with its bundled Three.js GLTFLoader,
separately from the original anatomy binary layers. Local viewing changes
camera framing instead of cropping the body. A second camera and scissor
viewport show the same complete 3D reference as a full-body locator, with
the same selected anatomical muscle highlight. Front/back, independent
rotation and full-body/local-view controls affect only this reference window.

Muscle display copies borrow the existing source geometry and retain the
original BodyParts3D/FMA identifiers, names, anatomical sides and positions.
Functional colour overlays indicate the selected teaching structures, not
measured activation or strength. The window owns its display materials and
complete reference GLB; it neither edits nor disposes the borrowed source
muscle geometries. Related training is presented as text, without creating
additional training models.

This is a static structure reference, not a precise registration to Snow
or to the current Flare pose. Cosmetic/privacy adaptations are unsuitable
for precise body-surface measurements. Source coverage limitations listed
below continue to apply.

This reference does not include independent meshes for rectus abdominis,
internal oblique, transversus abdominis, latissimus dorsi or quadratus lumborum.
The data is a static adult male reference; it has no animation rig or joint
weights. Any separate action demonstration is an illustrative reconstruction.
