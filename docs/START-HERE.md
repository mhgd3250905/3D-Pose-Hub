# START HERE：新接手的人 / agent 先读这一份

目标：半小时内搞清楚这个仓库是干什么的、能动哪里、怎么在**没有 GPU 的低配机**上验证一个动作，以及怎么把需要全量渲染的活交给主线本机。读完再按需查后面列的文档。实测记录见 [onboarding-audit-2026-10-18.md](onboarding-audit-2026-10-18.md)。

## 1. 一分钟版

- **Pose-Hub = 训练动作库。** 每个动作是一份 JS 规格（`drill-anim/specs/<id>.js`），由 `drill-anim/drill.py` 在无头 Chromium 里驱动一个固定的 3D 训练人物（`training-human-v2`）渲成无缝循环视频。Git 里只放规格、渲染工具、人物模型和成片的 SHA-256 清单；成片本体按版本打成 ZIP 放谷歌云盘。
- **谁在用：**
  - **HipLab（开胯训练助手）**：取已发布素材 **v0.2.0（published 2026-10-18，46 个动作，主题 soft-v1 `themes/glow-soft.json`，main `59fb7b9`）**；v0.1.0（glow-b）保留原样。另有 6 份 `a-*` 自测对比静图（App 里是 webp，不在 ZIP）。
  - **FlareLab（托马斯训练助手）**：App 里是 51 个肌群动作（`data/drills.json`，17 肌群 × A 徒手 / B 家用 / C 健身房）的旧媒体，**还没有通过 Pose-Hub 发布**，目前不接入。
  - 逐个动作谁在用、用的哪个修订、有哪些已知问题：看 [drill-catalog.md](drill-catalog.md)（脚本生成）。
- **你的角色是贡献方。** 主线（main、审核、合并、tag、渲染全片、打包发布）在开哥 Windows 本机 `E:\AII-3D\3D-Pose-Hub`（RTX 4080）。你：从 `origin/main` 拉分支 → 改 → 低配验证 → 提 PR，PR 里写清楚要主线渲什么。**不要合并、打 tag、改 `media/manifest.json` 的已发布版本、上传云盘。** 推送分支和开 PR 本身也要用户同意（[AGENTS.md](../AGENTS.md) 第 5 条）：派你任务时说了可以推就推，没说就先问。

## 2. 目录：哪些是现役，哪些别碰

| 路径 | 状态 | 说明 |
|---|---|---|
| `drill-anim/specs/<id>.js` | **现役**，但已登记的文件**不能改** | 一份 = 一个动作。改动作 = 新建 `<id>-r2.js`（见 §6）。`specs/_*.mjs` 是共用模块，哈希登记在 `verify.mjs` |
| `drill-anim/data/home-pr-candidates.json` | 现役 | 新 spec 的 LF 规范化 SHA-256 登记处 |
| `drill-anim/data/drills.json` | 现役（FlareLab 51 的名称、器械、处方、安全提示） | 改它会让 verify 的 51 数量断言失败，别动 |
| `drill-anim/drill.py`、`lib/`、`page/`、`themes/` | 现役，**共享核心** | 能不改就不改；必须改就单独开 `engine/<简述>` 分支，并证明旧渲染像素不变 |
| `drill-anim/theme.json`、`page/toon.js`、`page/engine.js`、`page/head.js`、`page/posedlib.js`、`page/training-collar.js`、`lib/boot.mjs`、`assets/srchead.json`、`assets/handdef.json`、`runtime/public/coach/*`、`runtime/src/spine-helpers.js`、`runtime/src/coach-motion.js` | **冻结**（人物模型固定源，`models/training-human-v2.json` 记了 13 个 sha256） | 改任何一个 = 新人物版本（training-human-v3），需要用户批准 |
| `page/soft-highlight.js`、`lib/soft-highlight.mjs`、`themes/glow-soft.json` | **冻结**（soft-v1） | 想调外观就另起 soft-v2 新文件/新主题 |
| `drill-anim/batches/`、`revisions/`、`qa-reports/`、`docs/drill-anim/` | **冻结历史记录** | 里面的 `E:/AII-3D/3D-Body/...`、`tools/drill-anim/...`、旧提交号都是当时的事实，保留原样 |
| `docs/*-2026-10-*.md` | 历史记录（dated） | 当时的决定和数字；可以引用，不改写。新结论写新文件 |
| `drill-anim/HANDOFF.md`、`HANDOFF-C.md`、`COLLAB.md` | **过时** | 2026-10-09 在 3D-Body 三人分工时的规则（`feature/drill-anim` 分支、Drive 档位目录），全部作废，只当背景读 |
| `media/manifest.json`、`media/releases/` | 主线专用 | 已 `published` 的版本只增不改 |
| `runtime/` | 渲染时 Vite 启动的 3D 场景 | 一般不动 |
| `tools/`（blender、mannequin、cloth、face） | 人物模型制作工具 | 与动作审核无关 |

**旧路径对照**（dated 文档里常见）：`tools/drill-anim/` → `drill-anim/`；3D-Body 根的 `src/`、`public/coach`、`public/anatomy` → `runtime/src/`、`runtime/public/coach`、`runtime/public/anatomy`；旧文档里的提交号是 3D-Body 的号，对照表在 [migration/commit-map.txt](migration/commit-map.txt)。

## 3. 半小时上手（Linux / 低配机）

```bash
# 1) 必须完整 clone：verify.mjs 要用 git 读基线提交 1adcab8 的 59 个原 spec。--depth 1 会报 "Original spec inventory unavailable"
git clone https://github.com/mhgd3250905/3D-Pose-Hub.git && cd 3D-Pose-Hub    # 已是浅克隆就 git fetch --unshallow
npm ci                                                       # three / lucide / vite，8 s

# 2) 不需要浏览器的三项检查（任何机器都该先过）
node drill-anim/verify.mjs                                   # 规格/模型源哈希契约，期望 "ok": true、specs 169（随新增增加）
cp drill-anim/config.example.json drill-anim/config.json     # 先复制，否则下一条报 FileNotFoundError
python3 drill-anim/test_portability.py                       # 7 项
python3 -m unittest discover -s media/tests                  # 28 项，只用标准库

# 3) 渲染依赖（只有出预览帧才需要）
npm i --no-save playwright@1.48.2                            # 不写进 package.json；1.48.x = chromium-1140，与历史渲染一致
npx playwright install chromium                              # 可用 PLAYWRIGHT_BROWSERS_PATH=<目录> 指定缓存位置
npx playwright install-deps chromium                         # 需要 root；非 root 见下面“坑”
pip install --user numpy scipy pillow                        # ffmpeg 只在全片编码时需要

# 4) 编辑 drill-anim/config.json（相对路径以 drill-anim/ 为基准）
#    playwright_module: "../node_modules/playwright/index.mjs"   ← 依赖装在仓库根
#    playwright_browsers_path: 上一步的缓存目录（默认缓存就留空）
#    out_dir / work_dir: 放仓库外或已忽略的目录，例如 "../output/drill-anim/out"、"../output/drill-anim/work"
#    font: 任意 CJK 字体（只有全片拼图/masks/swatch 用到，预览不需要）
#    chromium_args: 无 GPU 保持 ["--use-gl=swiftshader","--enable-unsafe-swiftshader"]

# 5) 出第一帧（低分辨率预览）
python3 drill-anim/drill.py render h-quad-cars --frames 66 --pr 0.5 --jobs 1 --theme themes/glow-soft.json
#    -> <work_dir>/h-quad-cars/c/0066.png（1080² 合成图）和 c/still.png；日志里应有 highlight {"version":"soft-v1",...}
python3 drill-anim/drill.py qa h-quad-cars                   # 用刚渲的帧算 QA -> <out_dir>/metrics/h-quad-cars.json

# 6) 动作总表
node drill-anim/tools/catalog.mjs                            # 重新生成 docs/drill-catalog.md（只读汇总，不渲染）
node drill-anim/tools/catalog.mjs --check                    # 只检查是否过期，过期退出码 1
```

实测（2 vCPU、无 GPU、SwiftShader）：一帧预览 `--pr 0.5` 墙钟约 30 s，其中 Vite 启动约 4 s、浏览器 boot 约 10.6 s、**每帧约 3.5 s**、合成 2 s；两帧约 24–30 s。drill-anim/README 记录的同级机器全片数据是 240 帧渲染约 11 分钟 + 合成编码约 1.5 分钟（默认 `--pr 2`、两路），且没有绿幕/透明母帧和 flickscan，所以**低配机不出交付用全片**。

### 坑（新人最容易卡的地方）

| 现象 | 原因 / 办法 |
|---|---|
| verify：`Original spec inventory unavailable` | 浅克隆。`git fetch --unshallow` |
| test_portability：`FileNotFoundError ... config.json` | 先 `cp drill-anim/config.example.json drill-anim/config.json` |
| boot 时找不到 playwright 模块 | `playwright_module` 要指向实际安装位置；装在仓库根就是 `../node_modules/playwright/index.mjs`（相对 `drill-anim/`） |
| Chromium 起不来：`libatk-1.0.so.0: cannot open shared object file` | 缺系统库（libatk、libatk-bridge、libXcomposite、libXdamage、libatspi）。有 root 就 `npx playwright install-deps chromium`；没 root 就把这几个 .so 放一个目录，填进 config 的 `ld_library_path` |
| 找不到主题文件 | `--theme` 路径相对 `drill-anim/`，写 `themes/glow-soft.json`，不是 `drill-anim/themes/...` |
| 预览后 `qa` 显示 `pass: false` | 只渲了几帧，`frames_complete=false` 必然 false。看各单项的 `ok`，不要看总 `pass` |
| 对不上文档里的帧号 | 以实际选中的 spec 为准：原生帧号 = 秒 × 该 spec 的 `fps`（未写时为 30）。HipLab 发布统一包装成 30 fps（`media/releases/0.1.0.sources.json` 的 `renderProfile`），所以同一时刻的原生帧号 = 发布帧号 × spec fps / 30。仅当 spec 为 15 fps 时，发布帧号 = 原生帧号 × 2，例如发布第 120 帧对应原生第 60 帧；`h-knee-hug-r2`、`h-supine-twist-r2` 已是 30 fps，不换算，不按 id 前缀推断 |
| 预览卡住：boot 和 `highlight` 日志之后很久没有 `frame N` | 个别动作（实测 `n-seated-squeeze`，两个主题都 >75 s 不出第一帧）在 2 vCPU/SwiftShader 上极慢，`drill.py` 还会自动重跑缺帧任务。用 `timeout 180 python3 drill-anim/drill.py ...` 包一层；超时就在 PR 里写明，交给主线本机预览。日志在 `<work_dir>/<id>/fr-log-*.txt` |
| 渲染拒绝覆盖 | 已有同名成片默认不覆盖；预览帧按 id 放在 `work_dir/<id>/`，重渲会清理这个目录 |
| `node drill-anim/tools/probe.mjs` 连不上 | probe 不会自己启动 Vite；先在仓库根另开一个终端 `npx vite --host 127.0.0.1 --port <config 的 app_port>` |
| 文档里的 `flickscan` / `propscan` / `render_batch.py` 找不到 | 它们在 3D-Body PR #120 的 `tools/hiplab-render/`，没迁进 Pose-Hub；只有主线本机有，低配机做不了 |
| Windows 下命令 | 用 `py` 代替 `python3`，config 从 `config.windows.example.json` 复制（`--use-angle=d3d11`） |

## 4. 怎么读一份 spec

先读文件头注释：每份都写了动作是什么、节奏、**头朝哪（+Y）、正面朝哪、身体左侧是 +X 还是 −X**、哪只脚/手固定。坐标单位是米和度，地面 y = 0，上为 +Y。完整字段表见 [drill-anim/README.md](../drill-anim/README.md#spec-format-specsidjs)，审核时最常看的是：

| 字段 | 看什么 |
|---|---|
| `id` / `name` / `nameEn` | `id` 必须等于文件名（除非候选表登记了 `renderId`，见 §6） |
| `timeline.duration`、`tracks` | 循环秒数；每条轨 `[t, value, ease]`，最后一个键会绕回 t=0，所以首尾值要接得上；每次重复的上/停/下/歇时长要一致 |
| `fps` | 不写 = 30。新 `h-*`/`n-*`/`a-*` 多为 15 |
| `pose.base` / `pose.deltas` | 基础姿态 + 各参数=1 时的绝对姿态；手脚 `mode: 'floor'` 是固定在地上，`'free'` 是悬空/贴身体 |
| `highlight` | `groups` 选目标肌群（17 个：deltoids、rotator-cuff、triceps、forearms、serratus、scapular、chest、lats、abs、obliques、erectors、hip-flexors、glute-max、hip-abductors、adductors、quadriceps、hamstrings，另有 biceps、calves、tibialis），`side` 单侧/双侧，`pulseAt`/`pulseTrack` 让发力时变亮。`panels` 是更细的肌肉面板（如 `gluteMed`、`oblique`），只在 groups 不够用时拼 |
| `modelProfile: 'training-human-v2'` + `alignClavicles: false` | **新做/重做必须写**。不写 = 旧人物（81 份老 spec 是这样，作为历史保留） |
| `props` | 道具；`mat` 最常见，其余在 `page/props.js`、`page/props-*.js`。可用类型见 catalog 的“场景/道具”列 |
| `camera` / `frame` / `stillAt` | 机位方向、取景关节、留边；`stillAt` 是拟合构图用的那一刻 |
| `qa` | 这份动作自己的 QA 规则：`pins`（哪个接触点必须不动）、`straight`（哪个肘/膝必须直）、`allowContact`（允许贴住的部位对）、`touch`、`hipFlexMax`（放宽髋屈上限必须在注释里写理由） |
| `keyFrames` | 拼图上展示的关键时刻（秒），也是审核时首先该看的时刻 |

新 spec 多用 `lib/home-anim.mjs` 的 `build()` / `keys()` 帮助函数生成姿态，`lib/ss-geo.mjs` 给出休息姿态下的骨点。照着同类动作（同场景、同支撑方式）抄一份最快。

**主题：** `theme.json` = 默认 v7（固定源，不改）；`themes/glow-b.json` = v0.1.0 发布用的方案 B；`themes/glow-soft.json` = soft-v1 柔和高亮，**v0.2.0 已用它发布，新成片一律用这个**。预览审核时用你打算交付的那个主题。

## 5. 在低配机上验证到什么程度

| 层级 | 命令 | 能证明什么 |
|---|---|---|
| 源契约 | `node drill-anim/verify.mjs` | 原 59 份 spec 和所有已登记 spec 没被改；新 spec 已登记且能 import、时间轴合法；13 个人物源和 soft-v1 源没变；所有 js 语法、json 格式正确 |
| 工具 | `python3 drill-anim/test_portability.py`、`python3 -m unittest discover -s media/tests` | 路径解析、删除保护、素材脚本 |
| 预览帧 | `drill.py render <id> --frames a,b,c --pr 0.5 --jobs 1 --theme ...` | 看图：姿态、朝向、接触、高亮落点、构图。帧选 `keyFrames` 对应帧 + 每次重复的起/顶/回 + 循环首尾（0 和最后一帧） |
| 稀疏 QA | 多渲一些均匀分布的帧（如每 0.5 s 一帧，8 s 动作约 16 帧 ≈ 1 分钟）再 `drill.py qa <id>` | 在这些帧上的数值检查；漂移以第一帧为参照，帧越密越可信 |
| 全片 QA | 只能主线本机 | `frames_complete`、整圈求解告警、触边、编码、flickscan、propscan |

**metrics 字段与阈值**（`<out_dir>/metrics/<id>.json`）：

| 字段 | 通过条件 | 含义 / 不过时怎么查 |
|---|---|---|
| `below_floor`（`min_vertex_y_m`） | 最低蒙皮顶点 ≥ −2 mm | 穿地；看 `min_vertex_mesh` 是鞋、手还是身体 |
| `pins.<c>.drift_mm_max` | < 5 mm | 声明固定的手/脚接触点漂移（脚锁定、手撑地） |
| `jointPins` | 同上 | 跪地的膝、撑地的肘不能滑 |
| `straight.<关节>.min_deg` | ≥ spec 写的 `min` | 该直的肘/膝没直 |
| `limits` | 膝只向后屈、肘只向前屈；髋屈 < 135°（除非 `qa.hipFlexMax` 有理由）；髋外展看 `hip_abd_true_deg_range`；腰弯在限内 | 关节反折、超出生理范围 |
| `self_clip.worst_gap_mm` | 胶囊体重叠 < 8 mm（`allowContact` 的对跳过） | 自穿模；`worst_pair` 指出哪两段 |
| `hand_clip.<side>.min_signed_mm` | ≥ −0.5 mm | 手陷进身体/衣服 |
| `touch` | 贴身的手间隙 ≤ 4 mm（默认） | 该贴住的手悬空 |
| `solver_warning_frames` | 越少越好（不进 pass） | 求解告警帧（含未收敛及肢体目标超出可达范围）；该计数本身不区分类别，必须看对应帧的具体告警消息，按类别判断，不能统一当作未收敛 |
| `frame_edge_touch_frames` | 0 | 身体碰画面边缘（手机裁切会切掉） |
| `frames_complete` | 全片才可能 true | 预览时忽略 |

数值 QA 不看手形、高亮读不读得出来、遮挡和教学清晰度——这些只能看图。审核标准见 [review-rubric.md](review-rubric.md)。

## 6. 新增动作 / 出修订版

1. **分支**：`git fetch origin && git checkout -b <分支> origin/main`。命名：`drill/<id>`（新动作或重做）、`fix/<id>-<要点>`（修复）、`engine/<简述>`（共享核心）、`docs/<简述>`（文档）。一批相关动作可以一个 PR，PR 里逐个列 id。
2. **修订不覆盖原文件**：已有 `<id>.js` 不改，新建 `<id>-r2.js`；已有 r2 就 `-r3`。修订版的 `spec.id` 二选一，PR 里写明：
   - **A（推荐）** `id: '<id>-r2'`，verify 直接通过；主线发布时在渲染端包装 `{...source, id: '<原 id>', fps: 30, modelProfile: 'training-human-v2', alignClavicles: false}` 绑定回原 App 槽位（v0.1.0 的 `s-frog-r2` 等就是这样）。
   - **B** `id: '<原 id>'`，候选表条目加 `"renderId": "<原 id>"`（`h-knee-hug-r2`、`s-seated-fold-r3` 是这样）。
3. **新动作 id 前缀**按类别：`h-` 居家、`n-` HipLab 开胯新增、`a-` 自测静图、`o-` 办公室、`w-` 久坐、`s-` 拉伸、`t-` 托马斯专项、`<肌群>-A/B/C` FlareLab。必须写 `modelProfile: 'training-human-v2'`、`alignClavicles: false`。
4. **登记 SHA**：算 LF 规范化 sha256，写进 `drill-anim/data/home-pr-candidates.json` 的 `specs`：
   ```bash
   node -e "const fs=require('fs'),c=require('crypto');for(const f of process.argv.slice(1))console.log(c.createHash('sha256').update(fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n')).digest('hex'),f)" drill-anim/specs/<id>-r2.js
   ```
   ```json
   "<id>-r2.js": {"pr": <PR 号，开 PR 后补上>, "sourceCommit": "<含该文件的提交>", "sha256": "<上面算出的值>"}
   ```
   新增共用模块（`specs/_*.mjs`、`lib/*.mjs`）的哈希登记进 `verify.mjs` 对应的表。普通工具脚本（如 `tools/catalog.mjs`）不用登记，verify 只做语法检查。**spec 每改一次都要重算并更新登记**，否则 verify 报 `Reviewed PR #… spec changed`。
5. **验证**：verify、test_portability、media tests 全过；预览帧看过；`node drill-anim/tools/catalog.mjs` 重新生成目录（新增“计划中”的候选也补进脚本的 `PLANNED` 表）。
6. **PR**（中文正文）附：为什么改、改了什么（逐个 id，原版 → 修订版）、预览帧图片（PR 评论里贴或说明位置）和**实际看过哪几帧**、QA 单项数值、已知遗留、以及下面的渲染请求块。

### 交给主线本机渲染的接口（PR 正文里照抄这一段）

```text
## 渲染请求（给主线本机 4080）
- 动作：<App id> ← 规格 drill-anim/specs/<file>.js（spec.id = <...>；若 id 带 -r2，请按 0.1.0 renderProfile 包装回 <App id>）
- 主题：themes/glow-soft.json（或说明为什么用别的）
- 帧数：<duration> s × 30 fps = <N> 帧（spec 原生 fps=<15/30>）
- 建议参数：python drill-anim/drill.py render <id> --theme themes/glow-soft.json --jobs 1 --pr 2 --keep
- 先抽查的帧（发布片 30 fps 帧号）：<...>，重点看：<脚锁定 / 手接触 / 高亮 / 循环接缝 …>
- 目标发布：HipLab v0.x.y 的哪个槽位；替换还是新增
- 低配机已做：verify ✓ portability ✓ media tests ✓；预览帧 <列表>（--pr 0.5）；稀疏 QA <单项结果>
- 低配机没做：全片 QA、flickscan、propscan、绿幕/透明母帧、编码
```

## 7. 低配机能做 / 不能做

| 能做 | 不能做（交给主线） |
|---|---|
| 读 spec、设计/修订动作参数、写新 spec | 全片渲染（240+ 帧）、`--pr 2` 高清帧批量 |
| verify、portability、media tests、catalog | 绿幕母版、透明 PNG 母帧、深色导出与 H.264 编码 |
| `--frames` 低分辨率预览（`--pr 0.5`，每帧约 3.5 s） | flickscan、propscan（工具不在本仓库） |
| 少量帧的 `drill.py qa` 稀疏 QA | ingest、pack、上传云盘、改 manifest 发布状态 |
| 共享核心的小改动 + 同帧像素对比（单路 `--jobs 1`） | 合并 PR、打 tag、改冻结人物源 |

整机最多两路渲染、每路 `--jobs 1`；预览帧和输出放 `out_dir`/`work_dir`，不进 Git（mp4/gif/帧 png 已被 `.gitignore` 排除）。

## 8. 文档地图

| 想知道 | 读 |
|---|---|
| 协作规则、谁能做什么 | [AGENTS.md](../AGENTS.md) |
| 渲染工具全部参数、spec 字段、QA、主题格式 | [drill-anim/README.md](../drill-anim/README.md) |
| 每个动作的状态、使用方、已知问题、待补全候选 | [drill-catalog.md](drill-catalog.md)（`node drill-anim/tools/catalog.mjs` 生成） |
| 动作设计审核标准 | [review-rubric.md](review-rubric.md) |
| 人物模型标准 | [training-human-v2.md](training-human-v2.md)、`drill-anim/models/training-human-v2.json` |
| 柔和高亮 soft-v1、v0.2.0 重渲步骤 | [soft-highlight-2026-10-18.md](soft-highlight-2026-10-18.md) |
| HipLab 第 1 阶段动作、替换与待办 | [hiplab-phase1-drills-2026-10-16.md](hiplab-phase1-drills-2026-10-16.md)、`drill-anim/revisions/hiplab-media-fix-20261017/README.md` |
| 已发布版本、规格绑定 | [media/releases/0.2.0.md](../media/releases/0.2.0.md)、`0.2.0.sources.json`（旧版 [0.1.0](../media/releases/0.1.0.md)）、[media/README.md](../media/README.md) |
| App 怎么取素材 | [consumers.md](consumers.md) |
| 从 3D-Body 迁来的路径/提交号对照 | [MIGRATION.md](../MIGRATION.md) |
