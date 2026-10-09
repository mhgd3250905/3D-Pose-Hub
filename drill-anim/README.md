# drill-anim: looping 3D toon animations for the training drills

This renders each drill (one per muscle group and tier, `<group>-<A|B|C>`) as a seamless loop: a 1080² 30 fps H.264 MP4, a 540 px GIF, a contact sheet and a QA metrics file. It uses the approved "v7" look: dark background, ember rim and outline, grey faceless mannequin head, and a cyan highlight on the target muscle.

The renderer boots the 3D Coach app (Vite dev server) in headless Chromium through Playwright. It injects the page libraries from `page/`, poses the rig with a small data-driven IK and LM solver, renders a main pass and a glow pass per frame, and composites them in Python (`lib/comp.py`).

## Layout

```
drill.py            CLI: render / qa / masks / swatch
config.json         every environment-specific path (the ONLY file with machine paths)
theme.json          default look; themes/*.json are partial overrides
specs/<id>.js       one drill = one plain-data ES module (export default {...})
page/               browser-side: toon.js (shader/theme), engine.js (pose/solver/camera/metrics), props.js,
                    anim-sideplank.js (frozen v7 solver used by deltoids-A), head.js, posedlib.js
lib/                boot.mjs (launch + install), render.mjs (frame loop), comp.py (compositing), qa.py,
                    masks.mjs + masksheet.py (17-group highlight sheet), swatch.py (theme comparison), config.mjs
assets/             handdef.json (relaxed-hand deltas), srchead.json (mannequin head), sideplank-cfg.json (v7 base pose)
tools/probe.mjs     ad-hoc pose probe
```

## Requirements and config

- Node ≥ 18, Python 3 with numpy, scipy and Pillow, ffmpeg with libx264.
- Playwright and a Chromium build. Software GL is fine (`--use-gl=swiftshader`).
- A checkout of the 3D Coach app with `node_modules` installed. `drill.py` starts `vite` on `app_port` if nothing is listening there, and stops it again on exit.

`config.json` keys: `app_url`, `app_dir`, `app_port`, `playwright_module`, `playwright_browsers_path`, `ld_library_path`, `font` (CJK-capable TTF/TTC for sheet labels), `ref_dir` (reference images `<id>.png`), `drills_json`, `out_dir`, `work_dir` (scratch frames), and `python_path` (optional, prepended to PYTHONPATH).
- Every key can be overridden by an upper-case environment variable of the same name, e.g. `OUT_DIR=./out python3 drill.py render triceps-A`.
- Relative paths are resolved against this folder.

When copying into a repo, edit `config.json` or set the environment variables. Nothing else holds a machine path.

## Rendering

```
python3 drill.py render triceps-A                     # full loop -> <out_dir>/triceps-A.mp4 .gif -sheet.png metrics/triceps-A.json
python3 drill.py render a b c                         # several drills, one after another
python3 drill.py render triceps-A --frames 0,40,62    # preview stills only (composited into <work_dir>/<id>/c/NNNN.png)
python3 drill.py render triceps-A --theme themes/outfit-sand.json
python3 drill.py render triceps-A --jobs 1            # default 2 parallel browser jobs (each ~1 CPU)
python3 drill.py qa triceps-A                         # recompute metrics from the last render's frame data
python3 drill.py masks --out mask-sheet.png           # 17-group highlight check sheet (neutral standing pose)
python3 drill.py swatch deltoids-A --frames 63 --themes themes/outfit-teal.json,themes/outfit-sand.json --out swatch-sheet.png
```

Speed on 2 vCPU with SwiftShader is about 0.4 frames/s per job pair: a 240-frame loop takes about 11 min to render, plus about 1.5 min to composite and encode. A preview of 3 frames takes about 40 s, mostly boot time. Always preview with `--frames` before a full render.

## Spec format (`specs/<id>.js`)

Coordinates are in metres and degrees. The floor is y = 0 and up is +Y. Each spec states, in its header comment, which way the head points and which side is the body's left. Units in `frame` and `shadow` are pixels on a 1024 reference canvas, scaled to the output size.

```js
export default {
  id, name, nameEn,
  timeline: { duration: 8, tracks: { down: [[t, value, ease?], ...] } },   // ease: cos (default) | smooth | linear | hold
                                            // the track wraps from `duration` back to its first value -> seamless loop
  pose: {
    base: {                                 // descriptor at all params = 0
      pelvis: [x, y, z],                    // pelvis position (solver vars px/py/pz are added)
      hips: { up, front, rot: [[axis, deg], ...] },   // pelvis orientation; solver vars h0, h1... add to rot[i]
      chest: { waist: [[axis, deg]], body: [[axis, deg]] },  // optional waist bend (vars c0..), whole-upper rot (b0..)
      hands: { left|right:
        { mode: 'floor', at: [x, z], finger: [dx, dz], poleUp: [..] }           // flat palm on the floor, pinned
        | { mode: 'free', frame: 'chest'|'hips'|'world', wrist, finger, normal, poleUp }   // rest-frame wrist and palm axes
        | { plant: <floor>, free: <free>, w: 0..1, arc: m, arcDir? }            // lift and blend between the two
      },
      feet: { left|right:
        { mode: 'floor', at: [x, z], heading: deg (0 = toes +Z), pitch: deg (+ = toes down), roll, lift }
        | { mode: 'free', frame: 'hips'|'world', ankle: [..], rot: [[axis, deg]], poleLow: [..] }
      },
      constraints: [                        // residuals the solver minimises
        { type: 'reach', limb: 'rightArm'|'leftLeg'..., angle: deg },  // shoulder-wrist / hip-ankle distance = that elbow/knee angle
        { type: 'joint', joint: 'pelvis'|'head'|..., axis: [..], value: m, weight },   // a joint's coordinate along an axis
        { type: 'legAlign', limb, flex: deg, weight },                 // rigid-body plank: leg stays in line with the hips
        { type: 'point', frame: 'chest'|'hips', at: [..], axis, value, weight },
      ],
      solve: { vars: ['px', 'py', 'h0', ...], reg: { px: 1, ... }, iters: 40 },
    },
    deltas: { down: { ...partial descriptor, ABSOLUTE values at param = 1... } },  // arrays index-match base (use {} to skip)
  },
  solver: 'sideplank-v7',                   // optional: use the frozen v7 solver instead (deltoids-A only)
  highlight: { groups: ['triceps'], side: 'both'|'left'|'right', lobes?, panels?, inset?,
               pulseAt: [t...], pulseWidth: s, pulseBase: 0.25 } | { ..., pulseTrack: 'down' },
  camera: { dir: [x, y, z], fit: [joint names], pad: m, k: 1.0, at: t (pose used for fitting), fov?,
            drift: deg (yaw sway), driftPeriod: s (default = loop; must divide the loop), driftPhase: rad },
  frame: { mode: 'fit', width, height?, cx, cy } | { mode: 'v7', width, left, top },  // placement of the body on the canvas
  stillAt: t,                               // the pose the frame placement is fitted to (default 0)
  shadow: { joints: [...], blobs: [{ j, dx, dy, rx, ry, a }], bands: [{ from, to, mid, rx, ry, a, dy, sag }] },
  props: [{ type: 'mat', at: [x, y, z], size: [L, W, H], yaw }],          // see page/props.js
  keyFrames: [t, t, t],                     // shown on the contact sheet
  qa: {
    pins: [{ c: 'handR'|'handL'|'footR'|'footL', when: 'always'|'locked.right'|'params.down<0.001' }],
    straight: [{ j: 'elbow.right'|'knee.left'..., min: 172, when? }],
    allowContact: ['handR|thighR', ...],    // capsule pairs that may touch (skipped by the self-clip check)
  },
};
```

Joint names come from the rig metrics: `head`, `pelvis`, `waist`, `shoulderCenter`, `left/rightShoulder|Elbow|Wrist|Palm|Hip|Knee|Ankle|Toe`.

### Props

`page/props.js` contains:
- `mat`: finished and validated.
- `dumbbell`, `kettlebell`, `band`, `parallettes`, `rings`, `sliders`, `machine`: geometry stubs, not yet validated against a drill. `machine` is a placeholder API.
- Not written yet: pull-up bar, foam roller, Swiss ball, landmine, cable stack, dip bars, Roman chair/GHD, reverse hyper, abductor and leg-extension machines.

Props are drawn in the main pass only. The glow pass, whose alpha is the body silhouette, drives the ember outline, so props get no outline. The body outline is drawn over the props.

## Theme format (`theme.json`, `themes/*.json`)

A theme file needs only the keys it changes; everything else is inherited from `theme.json`.

| key | meaning |
|---|---|
| `skin`, `top`, `bottom`, `shoes` | `{ base, shadeK or shade, finish, pattern, texture, rim? }` |
| `base` | `"#rrggbb"` (sRGB) or `[r, g, b]` (linear) |
| `shadeK` | shadow tone = base × shadeK |
| `finish` | `matte` \| `satin` \| `sheen` \| `{ sheen: 0..1, gloss }` |
| `pattern` | `{ type: stripes\|check\|dots, colour, scale (m per repeat), strength }` |
| `texture` | `{ image: path relative to the theme file, scale }` |
| `rim` | `{ body: [linear rgb], outline: [0-255 rgb], halo }` |
| `highlight` | `{ colour, shade: [base, light, core] }` |
| `background` | `{ centre, edge, warm, floorBand }` (0–255 rgb) |
| `props` | `{ base, edge, shadeK, rim }` |

Garment colour and material (`top` / `bottom` / `shoes`), skin tone (`skin.base`) and the highlight colour are switched with a theme file alone: `--theme themes/outfit-sand.json`.

## QA (`metrics/<id>.json`)

QA runs automatically after every full render. Each check and its pass condition:

| check | what it measures | passes when |
|---|---|---|
| `below_floor` | lowest skinned vertex | ≥ −2 mm |
| `pins` | drift of each pinned contact centroid while its `when` holds | < 5 mm |
| `straight` | minimum elbow or knee angle while `when` holds | ≥ `min` |
| `limits` | knee and elbow bend direction, hip flexion and abduction ranges, waist bend | within joint limits |
| `self_clip` | capsule-hull overlap between non-adjacent segments (spec-allowed pairs skipped) | < 8 mm |

Also reported: `solver_warning_frames` (LM did not reach tolerance; check visually) and `frame_edge_touch_frames` (body touches the canvas edge). `pass` is the AND of the checks.

QA is numeric only. Always look at the contact sheet and a few in-between frames as well: hand shape, mask readability and occlusion are not measured.

## Known residuals

- Relaxed hand: deltoids-A bakes the v7 relaxed hand permanently (`bakeHands`). The other drills blend it per frame with a CPU morph (`__setRelax`, weight `relax`, default 1 on lifted or free hands, 0 on pinned floor hands). The shader path (`aHandD`) is unused.
- The head and neck are rigid with the upper torso, so there is no neck flexion.
