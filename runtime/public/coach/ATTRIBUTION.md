# Flare Friendly Coach

**Snow Rig © Blender Foundation | studio.blender.org**

Source: [Snow, Blender Studio](https://studio.blender.org/characters/snow/).
License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).

Modified for this project: matte skin and hazel eyes, light grey matte training tee with grey cuffs, plain black matte shorts made from the original trousers, white sneakers, a gentle facial expression, an ordinary dark brown short buzzcut, and a compact 20-bone deformation rig for Three.js. The buzzcut reuses the original continuous scalp surface, with the curls and bun removed and a small outward offset to cover the scalp. Original professional surfaces and body weights were reused. Source file and production rig are preserved in assets/blender-studio-source/snow-rig-v4/Snow/snow_v4.2.blend.

The original closed foot and ankle skin is fitted inside the sneakers, with locally smoothed Shin / Foot weights to keep the collar connected. The original shoe surfaces are retained. Fingers are gently opened using the original finger pivots and weights; the natural palm arch, pads and thickness are retained. A shared palm translation with a short wrist transition preserves the previous contact offset without projecting the skin onto a plane. Forearm / Hand weights blend locally around the wrist joint. Shorts are continuously widened across the midline, with a local pelvis-weight transition at the central gusset. Since v41 the skin under the tee collar and sleeves and the tee near its openings share one blended skin-weight field (tools/cloth/fit-cloth-weights.mjs, from flare-coach-before-v41.glb), so the collar no longer lifts off the neck in the flare; vertex positions are unchanged. All 20 joint names, order and rest pivots are retained, so saved poses remain editable. Hand and foot directions remain editable.

The current default uses the v41 motion revision derived from the user's 托马斯/16.json loop in the order 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 9. It includes the source's revised poses, periodic interpolation and soft foot orientation limits. The original exports and previous default remain separately preserved; saved personal edits are not silently replaced. The earlier five-pose export belongs to the previous demonstration.

A local revision upgrade independently backs up the previous formal demonstration without changing the personal pose library or draft. Personal poses are adopted explicitly through “Use for demonstration”: a library with at least 16 steps matches the formal source step IDs when available, otherwise selects entries 9–16 and repeats entry 9; a complete nine-step library can also be published in list order. A matching personal library is not automatically promoted over the current formal demonstration.

The Flare demonstration replays the user's authored key poses, with interpolated transitions rather than motion capture. BodyParts3D muscles are shown separately as an anatomical reference; they are not anatomically registered inside this cartoon character. See /anatomy/ATTRIBUTION.md for the independent anatomy license.

Made locally in Blender 4.5.3 LTS. No purchased assets, subscriptions, plugins, or paid generation services.

v41 also reuses the source's collar/sleeve skin-weight blending (vertex positions and materials are unchanged) and runtime lower/upper spine helpers. The original 20 editable joints and pose storage format remain intact. The replaced GLB and sequence are preserved as `flare-coach-before-web-v41.glb` and `flare-sequence-before-web-v41.json`; source hashes and the narrow runtime adaptation are recorded in `motion-v41-web-manifest.json`.
