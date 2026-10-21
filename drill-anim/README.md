> **Pose-Hub 迁移说明（2026-10-17）**：本工具已从 3D-Body 的 `tools/drill-anim/` 迁到 Pose-Hub 的 `drill-anim/`，渲染时启动的 3D 场景在仓库根的 `runtime/`（由根目录 `vite.config.js` 指定），`config.json` 的 `app_dir` 改为 `..`。下文中提到 `tools/drill-anim/`、项目根目录 `src/`、`public/coach` 的地方，对应 Pose-Hub 的 `drill-anim/`、`runtime/src/`、`runtime/public/coach`。历史批次 manifest 里的 `E:/AII-3D/3D-Body/...` 是当时的机器路径，按原样保留。见仓库根目录 [MIGRATION.md](../MIGRATION.md)。

# drill-anim: looping 3D toon animations for the training drills

2026-10-21 新制作入口：用户已采用 [training-human-v2plus 标准](../docs/training-human-v2plus.md)，完整默认配方见 [models/current-production.json](models/current-production.json)。默认是更新后的躯干、四肢、手和 compression 训练服，原 v2 头、原配色（`skin:'realistic'`）、动作肌群高亮，不显示肌群分区线；白金/蓝/绿/全息显式可选。`1.0.0-rc2` 已随 PR #12 和集成修复合入并推送 main，身份见[台账](../docs/version-ledger.md)；全量重渲与 App 接入仍待安排。下方 dated 段落保留其历史阶段身份。

高清母版制作入口见 [tools/hd](tools/hd/README.md)：2160² 原始帧 → 1080² / 30fps 绿幕与精确透明帧，支持 Pose-Hub 任意动作选集、绑定预览审核和两路队列。

2026-10-15新增居家/肌群补充/开胯/开肩51份`h-*`候选，制作规格共138份（原87份保持）。来源、合并审核补修和验证边界见[居家动作记录](../docs/home-drill-integration-2026-10-15.md)，精确规格哈希见[data/home-pr-candidates.json](data/home-pr-candidates.json)。B风格以`--theme themes/glow-b.json`显式选择；默认theme保留已验收人体固定源。下方75/87项为历史阶段数量；App仍选原51视频，不据新增规格或PR作者QA声明全片/设备验收完成。

2026-10-13当前选用素材库为`output/training-human-v2-library-footfix-20261013`，用户已认可瑞士球背伸鞋向修正版，其它93项沿用原媒体。该项使用[修订规格与原目标重放](revisions/erectors-B-footfix-20261013/README.md)及`render-footfix.mjs`，保留原met-cycle求解值/腕目标；单独spec不是完整复现配方。下述原94冻结批次与首次便携包保留历史身份，整体版本见[阶段台账](https://github.com/mhgd3250905/3D-Body/blob/66067a6/app/docs/version-ledger.md#2026-10-13-素材制作阶段收口)。

2026-10-13用户明确安排的94项演示已全部另存成片，共23,454帧/781.8秒，母版1080²、手机版720²、封面540²。冻结来源见[batches/training-human-v2-20261013](batches/training-human-v2-20261013/README.md)，制作流程83ready/11review，最终独立审计56ready/38review、failed/pending均0；所选188视频完整解码。原QA与警告保留，不替换旧成片或App51视频。执行用 `batch-rerender.mjs`，独立解码/关节审计用 `batch-library-audit.mjs`，便携目录用 `package-library.mjs`另建；生产 `audit-final/`、2项恒定构图派生、便携使用与边界见[统一素材库](../docs/training-media-library-2026-10-13.md)。入口补丁2.0.1不改变已验收2.0.0外观，既有普通CLI继续保留。

2026-10-13用户已验收肩颈优化；当时后续制作统一使用（今后新任务已由上方 2026-10-21 v2plus 决定取代） [training-human-v2 人体基准](../docs/training-human-v2.md)：在spec中设置 `modelProfile: 'training-human-v2'`、`alignClavicles: false`。当前肩颈修复保留App训练人物的成熟网格、头、服装与骨架；人体身份、配置与源码哈希固定在 [模型清单](models/training-human-v2.json)。已交付的旧视频保留，按用户后续安排才使用新人体另出重渲版本。

2026-10-12：本工具已按用户明确授权整合到 `master`，以 L43 为App底座。当前默认制作源共75项：原59项参数、办公室8项 `o-*`、久坐强化8项 `w-*`；原59项内容仍强制核对来源，16项新增源按审核后SHA-256固定。App仍选用51项正式视频，制作源增加不会自动替换App媒体。原始纳入与备份见 [早期工具整合记录](../docs/drill-anim-integration-2026-10-12.md)，后续PR和验证范围见 [主线整合审核](../docs/integration-pr-audit-2026-10-12.md)。历史 `HANDOFF.md` / `COLLAB.md` 描述原三人制作分工，不覆盖用户本次明确整合授权。

Windows 配置可从 `config.windows.example.json` 复制为 gitignored `config.json`，填已安装的 Playwright 模块、浏览器缓存、字体和参考图路径。使用带 numpy / scipy / Pillow 的 Python，ffmpeg 在 PATH 中；Pose-Hub 仓库根目录先 `npm ci`。相对路径统一以本工具目录为基准，新输出与临时帧留在项目盘。当前本机配置借用既有 E 盘 Python/Playwright 环境，不向 Git 提交机器配置。

`3D-Pose` 的五项最终修订现另在 [Hark-4080交付包](revisions/hark-4080-v1/README.md)，含最终spec/theme、MP4/GIF、封面及原始QA；[成果接手地图](../docs/drill-anim/hark-4080-v1.md) 给出完整60动作的索引与云盘入口。这是新增审阅目录，不替换原59项spec、App选版或正式视频。

PR #106来源的12份托马斯专项 `t-*` 已作为独立制作源保存，另计于上述75项原库之外，当前共87份spec；App51项选版不变，专项未注册App。用户反馈后的当前候选保留原编号2–12及左侧撑镜像；1半分腿停止制作，原规格与历史预览保留。本地优化保存点 `4ef5556` 已由隔离分支快进纳入主目录master；GitHub原PR仍为Draft，当前要求以Flare App其他训练的实际成片为人体外观基准，逐项认可范围、来源实证与当前进展见 [第三轮App人物修复](../docs/thomas-app-model-v3-2026-10-12.md)。此前 [第二轮反馈](../docs/thomas-feedback-v2-2026-10-12.md)、[反馈修复记录](../docs/thomas-feedback-repair-2026-10-12.md) 和 [托马斯素材优化历史](../docs/thomas-reference-optimization-2026-10-12.md) 保留；第二轮肩颈尝试被第三轮取代；第三轮预览及肩颈已于10-13获得用户验收，不能把验收回填到第二轮。后续明确授权的本批高清全片已完成，2/10另存不改动作/运镜的恒定构图版本；原身体QA和review保留，正式选版与App媒体替换另行安排。成片生成不等于新增办公室/久坐或全部动作获得全片视觉/设备验收。

```powershell
node drill-anim/verify.mjs
python drill-anim/test_portability.py
python drill-anim/drill.py render deltoids-A --frames 0,63,120 --jobs 1
```

先预览再决定全片；全机最多两路渲染，每路 `--jobs 1`。原有同名 MP4、GIF、对照图、QA 和总览图默认拒绝覆盖，只有主动加 `--overwrite` 才替换。临时帧仍按动作 ID 管理，重新渲染会清理该动作的工作帧；边界检查禁止删除源码或成品目录，历史工作帧需要保留时先换 `work_dir`。`--keep` 仅复用工作帧，不代表新版已通过 QA。

This renders each drill (one per muscle group and tier, `<group>-<A|B|C>`) as a seamless loop: a 1080² 30 fps H.264 MP4, a 540 px GIF, a contact sheet and a QA metrics file. It uses the approved "v7" look: dark background, ember rim and outline, grey faceless mannequin head, and a cyan highlight on the target muscle.

The renderer boots the 3D Coach app (Vite dev server) in headless Chromium through Playwright. It injects the page libraries from `page/`, poses the rig with a small data-driven IK and LM solver, renders a main pass and a glow pass per frame, and composites them in Python (`lib/comp.py`).

## Layout

```
drill.py            CLI: render / qa / masks / swatch
config.json         every environment-specific path (the ONLY file with machine paths)
theme.json          default look; themes/*.json are partial overrides
specs/<id>.js       one drill = one plain-data ES module (export default {...})
page/               browser-side: toon.js (shader/theme), engine.js (pose/solver/camera/metrics), props.js + props-*.js,
                    anim-sideplank.js (frozen v7 solver used by deltoids-A), head.js, posedlib.js,
                    soft-highlight.js (opt-in soft-v1 highlight, enabled by themes/glow-soft.json)
lib/                boot.mjs (launch + install), render.mjs (frame loop), comp.py (compositing), qa.py,
                    masks.mjs + masksheet.py (17-group highlight sheet), swatch.py (theme comparison), tiersheet.py (per-tier overview), config.mjs
assets/             handdef.json (relaxed-hand deltas), srchead.json (mannequin head), sideplank-cfg.json (v7 base pose)
tools/probe.mjs     ad-hoc pose probe (does not start Vite; start it first)
tools/catalog.mjs   read-only drill catalog -> ../docs/drill-catalog.md (see ../docs/START-HERE.md)
```

## Requirements and config

- Node `^20.19.0 || >=22.12.0`（当前根工程 Vite 的要求）, Python 3 with numpy, scipy and Pillow, ffmpeg with libx264.
- Playwright and a Chromium build. Software GL is fine (`--use-gl=swiftshader`).
- A checkout of the 3D Coach app with `node_modules` installed (in Pose-Hub: the repo root after `npm ci`; the scene itself is `runtime/`). `drill.py` starts `vite` on `app_port` if nothing is listening there, and stops it again on exit.

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
python3 lib/tiersheet.py A A-tier-sheet_v1.png        # one labelled tile per drill of a tier, from <out_dir>/<id>.mp4 (missing drills = placeholder)
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
  modelProfile: 'training-human-v2plus',     // new work: copy models/current-production.json completely
  alignClavicles: false,
  v2plus: { outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic' }, // head off = original v2 head
  camera: { dir: [x, y, z], fit: [joint names], pad: m, k: 1.0, at: t (pose used for fitting), fov?,
            drift: deg (yaw sway), driftPeriod: s (default = loop; must divide the loop), driftPhase: rad,
            frontSweepDegrees: 180, frontSweepPeriod: s }, // optional front-only side-to-side yaw, centred on dir +Z
  frame: { mode: 'fit', width, height?, cx, cy } | { mode: 'v7', width, left, top },  // placement of the body on the canvas
  stillAt: t,                               // the pose the frame placement is fitted to (default 0)
  shadow: { joints: [...], blobs: [{ j, dx, dy, rx, ry, a, fade?: [y0, y1] }], bands: [{ from, to, mid, rx, ry, a, dy, sag }] },
                                            // fade: the blob's alpha falls linearly to 0 as its joint rises from y0 to y1 m
                                            // (a lifted hand casts no floor blob; without it the blob stays put under the hand)
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

> 2026-10-18 更新：下面原来的“stub / 还没写”清单已过时。`page/props.js` 现有 `mat`、`dumbbell`、`kettlebell`、`band`、`bandPost`、`parallettes`、`sliders`、`bench`、`wall`、`officeChair`、`pullupBar`、`foamRoller`、`swissBall`、`cableStack`/`cable`/`dHandle`/`ankleStrap`、`landmine`、`legExtension`、`hipAbductor`、`kbBottomsUp` 等，`page/props-*.js` 另有 `chair`、`dipBars`、`rings`、`romanChair`、`ghd`、`reverseHyper`；它们都已被 spec 使用（各类型用量见 [drill-catalog](../docs/drill-catalog.md) 的“场景/道具”列）。“被某个 spec 用过”不等于“对任意新姿势都验证过”，新动作仍要查道具接触与穿模。

`page/props.js` originally (2026-10-09) contained:
- `mat`: finished and validated.
- `dumbbell`, `kettlebell`, `band`, `parallettes`, `rings`, `sliders`, `machine`: geometry stubs at the time.
- Not written at the time (all added since): pull-up bar, foam roller, Swiss ball, landmine, cable stack, dip bars, Roman chair/GHD, reverse hyper, abductor and leg-extension machines.

Extra prop files `page/props-<name>.js` are loaded after `props.js` (by `lib/boot.mjs`, sorted by name). Each registers its own types through `__props.add` without editing `props.js`, so prop branches merge without conflicts. Such props may declare QA primitives (capsules `{a,b,r}`, tori `{c,n,R,r}`, boxes `{c,ax,h}`); `__props.qaPrims()` returns them in world space and `node tools/probe.mjs specs/<id>.js tools/propclear.js` reports each hand's and bone's clearance to them in mm.

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
| `limits` | knee and elbow bend direction, hip flexion and abduction ranges, waist bend | within joint limits (hip flexion < 135° unless the spec sets `qa.hipFlexMax`, only with a justification in the spec; hip abduction judged by `hip_abd_true_deg_range`: thigh vs the pelvis's sagittal plane; the frontal projection `hip_abd_deg_range` exceeds 90° when the thigh is near horizontal, e.g. a Cossack squat) |
| `self_clip` | capsule-hull overlap between non-adjacent segments (spec-allowed pairs skipped) | < 8 mm |

Also reported: `solver_warning_frames` (frames with solver warnings, including non-convergence and limb targets outside the reachable range; inspect each warning message and the corresponding pose) and `frame_edge_touch_frames` (body touches the canvas edge). `pass` is the AND of the checks.

QA is numeric only. Always look at the contact sheet and a few in-between frames as well: hand shape, mask readability and occlusion are not measured.

## Engine features added in the A-tier run

### Hands touching the body
- `hands.<side>.mode: 'free'` with `palmAt: [x, y, z]` (in the hand's `frame`) places the PALM joint on a body-surface point instead of placing the wrist.
- `hands.<side>.touch = { clear, from, pull, iters, exclude, solve, toward }` makes a free hand rest on the body without clipping. After the pose, the wrist moves along the surface normal until the hand rests `clear` (default 2 mm) above the surface. `pull` (default 1, eased in from `w = from`) controls how far a hovering hand is pulled in. With `solve: 'bisect'` (recommended) the offset is found by bisection: it is robust where the gap is not smooth, always ends outside, and walks the wrist toward `toward` (default `waist`) in 15 mm steps first if the hand starts more than 45 mm away. The default iterative solve also has a push-only guard so it never ends inside. The iterative solve measures the legacy nearest-vertex (euclidean) gap unless `gap: 'radial'` is set, so deltoids-A and rotator-cuff-A render exactly as before; `bisect` always uses the radial gap. The v7 solver takes the same option as `solverArgs.touch`.
- QA `hand_clip` checks every hand skin vertex against the outer body layers (skin, tee, cuff, shorts, head). A vertex is inside when it is closer to the nearest bone's core line than the 6 nearest surface vertices; the gap outside is the radial gap, capped by the euclidean distance. It fails below −0.5 mm. `qa.touch: [{ side, when, max_gap }]` also checks a resting hand's gap (≤ 4 mm by default). `qa.handClipExclude` skips bones.

### Weight-bearing free hands
- A hand with `w > 0` (lifted or free) normally drops its arm's `reach` constraint. `hands.<side>.keepReach` (0..1, animatable through `deltas`) keeps it, scaled by the value: use it for a free-mode hand that still bears weight, e.g. forearms-A's back of the hand on the mat (a world-frame free pose, since `floor` mode is palm-down only).
- `qa.pins` may pin the same contact in several phases (`{ c: 'handR', when: 'params.qF>0.5' }`, `{ c: 'handR', when: 'params.qS>0.5' }`); a repeated contact is reported as `'<c> <when>'`, a single one keeps the plain key.

### Shoulders and mid-limb pins
- `shoulders.shift: [x, y, z]` (chest frame, metres) shifts the scapula for protraction/retraction/elevation/depression. The scapula bone moves against the chest and the arm is re-solved from the shifted shoulder to the same wrist. It can be animated through `deltas`.
- `{ type: 'mid', limb, at: [x, y, z], weight }` pins an elbow or knee at a world point, e.g. a forearm plank or kneeling. `qa.jointPins: [{ j: 'leftElbow' }]` checks its drift. Add `when` to limit it to a phase and `axes: 'xz'` to check only the horizontal slide (obliques-A: the support foot pivots on its ball, so the toe joint rolls up ~6 mm while its contact stays put).

### Timelines
- Descriptor blending is linear, so blending two points on an arc (such as an abducting ankle) cuts the chord and bends the limb. Add a second track that carries the arc's sagitta (hip-abductors-A: `bow = 4p(1 − p)`) and sample both tracks per frame as `linear` keys from one eased curve; a spec is a JS module, so it can compute its own keys.
- Keep reps even: each rep's up/hold/down/rest must have the same lengths, including the wrap from `duration` back to t = 0.

### Robustness
- `drill.py render` re-runs any parallel job whose frames are missing (a Chromium launch can fail transiently) and aborts if frames are still missing. QA reports `frames_complete`, which is part of `pass`.

## Known residuals

- Relaxed hand: deltoids-A bakes the v7 relaxed hand permanently (`bakeHands`). The other drills blend it per frame with a CPU morph (`__setRelax`, weight `relax`, default 1 on lifted or free hands, 0 on pinned floor hands). The shader path (`aHandD`) is unused.
- The head and neck are rigid with the upper torso, so there is no neck flexion.
