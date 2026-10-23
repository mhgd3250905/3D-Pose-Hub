# Independent contact profile, 1.0.0-r4.1

Explicit opt-in `training-human-v2plus-contact`, with `contact.version:'1.0.0-r4.1'`, realistic only. This is not a replacement production default. Original training-human-v2plus/1.0.0-rc2 sources, meshes, weights, engine and current-production remain byte-identical. User authorized this independent finger-contact interface on 2026-10-23.

Load with `applyHumanContact(page,spec)` from `loader.mjs`, after the existing boot. Do not send this profile through the legacy render resolver or silently remap its source to the old profile. The loader checks all base source and new module SHA values in manifest.json. Use the bundled dedicated preview entry for low-resolution previews:

`node drill-anim/models/contact-r4/preview.mjs drill-anim/specs/h-wall-palm-lift-rr4.js /absolute/output-directory`

Run the existing local Vite application first, using the repository's offline configuration. This entry does not start servers or parallel jobs. It generates ten 540px whole-body PNGs at real recorded times; no full-film high-resolution rendering.

Each working hand descriptor accepts fingerContact.family and index/middle/ring/pinky weights in [0,1], scalar or three joint weights. Four existing fingers, three existing local quaternion slots each; no new joints, weights, topology, positions, scales or wrist target overrides. The wall-distal-contact-mcp family changes only MCP joints. Thumb and non-working hand remain controlled by the base pose. The post-pose wrapper restores previous base quaternions before the next pose, so switching back to the original model restores original behavior even if the base pose cache sees the same name. Unknown version/family, missing joints and invalid weights fail explicitly.

067 checks distinguish sustained distal material-region contact from a fixed palm-center pin. The palm center must move to withdraw the heel. Generic standard QA false remains archived, not edited away. Four original 4mm contact bands are examined using full existing triangles and the same material patches throughout. Patch tangential slip up to7.43mm is disclosed; this is not a zero-slip, friction, pressure, load or safety certification. Sparse action QA is not complete GPU acceptance.
