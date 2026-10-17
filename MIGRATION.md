# 从 3D-Body 迁移到 Pose-Hub（2026-10-17）

## 来源

| 项 | 值 |
|---|---|
| 来源仓库 | https://github.com/mhgd3250905/3D-Body |
| 来源提交 | `master` = `66067a6475e6be85bf0daa6f167da1c124e4f1eb`（Merge remote-tracking branch 'origin/master'，2026-10-17） |
| 同时搬入的未合并 PR | 3D-Body #121 `fix/hip-pose-feet-highlight` = `501f68b585ff1d7dd0ed30e1e73f4862f90f82d6` → Pose-Hub 分支 `fix/hip-pose-feet-highlight`（单独 PR，不在 main） |
| 方法 | `git filter-repo`：第一遍 `--paths-from-file` 只保留下表路径，第二遍 `--path-rename` 改目录；然后在 main 上加迁移提交修路径、加 media/ 和文档 |
| 保留的历史 | 3D-Body master 597 个提交中，触及这些路径的 440 个（最早 `ef9cd05` 2026-10-05）。其余提交只改了没搬的文件，被 filter-repo 去掉 |
| 导入提交 | Pose-Hub `9d1c607` = 3D-Body `ae81d96`（Merge PR #119，最后一个改动这些路径的提交）。它的文件树与 `66067a6` 中对应文件逐个相同（458/458 个 blob 一致） |
| 提交号对照 | filter-repo 重写了全部提交号。完整对照见 [docs/migration/commit-map.txt](docs/migration/commit-map.txt)（3D-Body 旧号 → Pose-Hub 新号，全 0 表示该提交没碰迁移路径、被去掉） |

| 3D-Body | Pose-Hub | 用途 |
|---|---|---|
| `68043f71651056c57c72a3b8813cbb354979346f` | `1adcab8343186c29a36483339ddee6e2725f8ca1` | `drill-anim/verify.mjs` 的"原 59 个 spec"基准（Merge PR #89） |
| `ae81d96f271a18129abbf6afc7064cfd9dd1d8c3` | `9d1c6072ae47bf6d92adc6871bb2fb48e4d19e89` | 导入时的 master 末端 |
| `4ef555624b95e1b39d6221efefa7d6bd7f692ba3` | `d385e4ad6a82fb1bbdfbcff27008ba0a851c4165` | 模型清单 `acceptance.implementationCommit`（清单里保留旧号，是历史记录） |
| `501f68b585ff1d7dd0ed30e1e73f4862f90f82d6` | `00b6f32c47a62b2562d4cd1cbd626873e068e7ea`（导入的原始提交，随后在新 main 上重新 cherry-pick） | PR #121 |

> 注：所有历史文档、批次清单里写的提交号都是 3D-Body 的旧号，保留原样；要在 3D-Body 仓库里查。

## 搬了什么（路径映射）

| 3D-Body | Pose-Hub | 说明 |
|---|---|---|
| `tools/drill-anim/**` | `drill-anim/**` | 渲染工具全部：162 个 spec 文件、page、lib、assets、models、themes、batches、revisions、qa-reports、data、tools |
| `index.html` | `runtime/index.html` | 渲染时 Playwright 打开的 3D Coach 页面（`/?inspect`） |
| `src/*.js`、`src/*.css`（64 个） | `runtime/src/` | `src/main.js` 的完整静态 import 闭包 63 个（与渲染时浏览器实际请求的 `/src/*` 完全一致，已用请求日志核对）＋ `flare-rig.js`（`tools/cloth` 要用） |
| `public/coach/` 14 个文件 | `runtime/public/coach/` | 渲染启动时实际加载的：`flare-coach.glb`、`coach-rig.json`、`flare-coach-v42-r12/r15/r16/r17-animated.glb`、4 个 `flare-v42*-clock.json`、`flare-sequence.json`、`flare-sequence-before-web-v41.json`、`saved-right-mirrors-2026-10-05.json`（后三个被 `src` 以 JSON import）、`ATTRIBUTION.md` |
| `public/anatomy/` 9 个文件 | `runtime/public/anatomy/` | 渲染加载的 `manifest.json`、`bones.bin.gz`、`muscles.bin.gz`、`mannequin-reference.glb`；模型工具需要的 `fitness-reference.glb/.json`、`mannequin-reference.json`；`ATTRIBUTION.md`、`human-atlas-MIT.txt` |
| `public/favicon.svg` | `runtime/public/favicon.svg` | |
| `vite.config.js`、`package.json`、`package-lock.json` | 同名（仓库根） | 依赖不变（three 0.170.0、lucide 0.468.0、vite 7.3.6）；包名改为 `pose-hub`；vite root 指向 `runtime/` |
| `licenses/three-MIT.txt`、`licenses/lucide-ISC.txt` | 同名 | `package-library.mjs` 打包时引用 |
| `app/assets/licenses/Drill-media-ATTRIBUTION.md` | `licenses/Drill-media-ATTRIBUTION.md` | `package-library.mjs` 引用 |
| `tools/blender/`、`tools/mannequin/`、`tools/cloth/`、`tools/face/` | 同名 | 人物模型制作工具（Snow 派生教练、健身/肌肉参考体、灰色人台、衣服蒙皮、脸部候选） |
| `assets/blender-studio-source/SOURCE.md` | 同名 | Blender 源文件获取说明（.blend 本体从未进 Git） |
| `docs/drill-anim/**`、`docs/training-human-v2.md` 及 14 份动作/人物文档 | `docs/` 同名 | `training-media-library`、`thomas-*`（4 份）、`integration-pr-audit`、`drill-anim-integration`、`home-drill-integration`、`home-drills-51-plan`、`office-drill-pr-audit`、`erectors-B-footfix`、`hiplab-phase1-drills`、`friendly-coach`、`anatomy-assets` |

逐文件对照（旧路径、新路径、git blob、sha256、字节数）：[docs/migration/path-map.tsv](docs/migration/path-map.tsv)，458 行，对应导入提交 `9d1c607`。

## 没搬什么（留在 3D-Body）

| 内容 | 原因 |
|---|---|
| `app/`（FlareLab Flutter App、`app/scene` 3D 场景、`app/assets` 媒体） | App 本身。媒体以后从 Pose-Hub 同步 |
| 根目录 `src/` 中没被 `main.js` 引用的 4 个文件（`atlas-motion.js`、`mirror-transition-continuation.js`、`muscle-viewer-page.js`、`surface.js`）、`muscle-viewer.html` | 渲染不需要；属于 3D-Body 网页版 |
| `public/coach` 其余 14 个文件（`flare-coach-before-*.glb`、各历史 `flare-sequence-before-*.json`、`motion-v41-web-manifest.json`、`user-saved-16-steps.json`）、`public/anatomy` 其余（`skin*`、`bones.bin`/`muscles.bin` 未压缩版、`muscle-reference.*`、`skin-manifest.json`） | 渲染不加载 |
| `tools/motion-v42*`、`tools/bake`、`tools/rekey`、`tools/verify-*.mjs`、`tools/server.mjs` 等 | 托马斯（Flare）主动画的制作与 FlareLab 网页/App 的验证，属于 FlareLab |
| `tools/flare-body-swap/` | 给 FlareLab `?body=training` 生成托马斯换人体 GLB 的实验，输出写到 `app/scene`；它依赖 `tools/drill-anim`，**3D-Body 删 drill-anim 前要处理**（见交接说明） |
| 根目录 `reframe-library.mjs`、`reframe-cycle.py` | 对 3D-Body 本机 `output/` 历史素材库做恒定构图派生，依赖 `tools/drill-anim`，同上 |
| 3D-Body PR #120 `codex/hiplab-hd-20261017`（`tools/hiplab-render/`：本地 4080 高清/绿幕/透明母帧生产线） | 不在 master，本次不搬。建议用户决定后另开 PR 迁到 Pose-Hub `tools/hiplab-render/` |
| 其余模型选型调研文档（`rigged-model-options`、`ready-made-models`、`skin-first-anatomy-options`、`muscle-display-model-candidates`、`anatomy-landmarks`）和 Flare 动作文档 | 历史调研 / FlareLab 范围；迁入文档里指向它们的链接已改成 3D-Body@66067a6 的 GitHub 链接 |
| 成片（mp4/gif/png 帧）、`output/`、`.blend` 源文件、参考视频 | 本来就不在 Git；成片改用 `media/` 清单 + R2 |

## 迁移提交改了哪些文件

只改路径，不改任何动作、模型或渲染逻辑：

- `drill-anim/verify.mjs`：仓库根 `../..` → `..`；基准提交 `68043f71…` → `1adcab83…`，`git ls-tree/show` 路径 `tools/drill-anim/specs/` → `drill-anim/specs/`；输出里加 `legacySource`。
- `drill-anim/models/training-human-v2.json`：`sourceSha256` 的 13 个键、`runtime`、`licenses` 改成新路径；**13 个 sha256 值一个没变**（见下表）。
- `drill-anim/lib/legacy-paths.mjs`（新增）：新旧路径互转。`package-library.mjs` 用它解析历史 `source-sha256.json` 的 `repositoryRelativePath`、比较冻结批次的 `plan.model`；`batch-rerender.mjs` 用它比较已有批次的模型。
- `drill-anim/batch-rerender.mjs`、`package-library.mjs`、`package-footfix.mjs`、`render-footfix.mjs`、`batch-library-audit.mjs`：`../..` → `..`，`tools/drill-anim/…` → `drill-anim/…`，`public/…` → `runtime/public/…`，`src/` → `runtime/src/`。
- `drill-anim/drill.py`：清理临时帧的保护目录加上 `runtime`、`drill-anim`、`media`、`tools`、`licenses`。
- `drill-anim/test_portability.py`、`config.example.json`、`config.windows.example.json`：`app_dir` `../..` → `..`，输出目录 `../../output` → `../output`。
- `vite.config.js`：`root: runtime/`，`cacheDir: runtime/node_modules/.vite`（必须在 root 内，`page/toon.js`、`posedlib.js` 按 `/node_modules/.vite/deps/three.js` 这个 URL 加载 three），去掉 `muscle-viewer.html` 入口。
- `tools/blender/*.py`（7 个）、`tools/mannequin/build_mannequin.py`、`tools/cloth/*.mjs`：`public/…` → `runtime/public/…`，`src/` → `runtime/src/`；`refine_coach_ankles.py` 原来写死 `E:/AII-3D/3D-Body`，改为按文件位置推算。`build_coach_study.py` 的输出仍写 `app/scene/source/coach/…`（FlareLab 路径，Pose-Hub 里不存在），用时需改输出位置。
- 文档里断掉的相对链接：能在 Pose-Hub 找到的改成新相对路径，只在 3D-Body 里有的改成 `https://github.com/mhgd3250905/3D-Body/blob/66067a6/...`。例外：`drill-anim/revisions/hark-4080-v1/README.md` 的 sha256 被 `docs/drill-anim/hark-4080-v1-verification.json` 记录，没改，里面一个 `../../../../docs/drill-anim/hark-4080-v1.md` 链接失效（正确位置是 `../../../docs/drill-anim/hark-4080-v1.md`）。指向用户本机 `output/…`、`../../3D-Pose/…` 的链接原本就不在 Git 里，保持原样。
- `drill-anim/README.md` 顶部加迁移说明，命令示例改成新路径。

**不改的历史记录：** `drill-anim/batches/training-human-v2-20261013/*.json`、`revisions/**`、`qa-reports/**`、`docs/drill-anim/**` 里的 `E:/AII-3D/3D-Body/...` 绝对路径、旧 `repositoryRelativePath`（`tools/drill-anim/…`、`src/…`、`public/…`、`app/scene/…`）和旧提交号都按原样保留，它们记录的是当时的机器和仓库布局。读取时由 `legacy-paths.mjs` 映射；`app/scene/…`、`website/…` 的条目在 Pose-Hub 里没有对应文件（它们属于 FlareLab）。

**已知限制：** 冻结批次 `training-human-v2-20261013` 的 `recipe` 里含 `batch-rerender.mjs` 自身和 `../../src/*.js` 的哈希。迁移后 `batch-rerender.mjs` 内容和标签变了，所以**不能在 Pose-Hub 里续跑这个历史批次**（会提示 "Frozen production code changed; use a new batch directory"）；新批次请用新目录。`package-library.mjs` 打包历史批次时仍可用（模型比较已做路径归一）。

## 模型固定源哈希对照（training-human-v2 2.0.1）

| Pose-Hub 路径（原 3D-Body 路径去掉 `runtime/`，`drill-anim/` 原为 `tools/drill-anim/`） | sha256（迁移前后相同） |
|---|---|
| `runtime/public/coach/flare-coach.glb`（原字节） | `c14683e4ffa8ebbb3e6712af8e04ee3276059398cec03b1192d5b67c179b858f` |
| `runtime/public/coach/coach-rig.json` | `e8b2a422a307f62a408ecf4a9a1168f6ca3a6ce6453cd73a665716ce32cf5dc7` |
| `drill-anim/page/training-collar.js` | `3cc2971f81a7ae86fb7c86ab18bb1926db7656e8db6caf4ac782e475532fabd5` |
| `drill-anim/page/head.js` | `eee745f1ad26453f1d5d212006853b2223a153719221b4c1db14246306cb6e9a` |
| `drill-anim/assets/srchead.json` | `859706381d1f0d1db549f34452a9b5fec5f6d1bd37488ce7809423ef504bc6ee` |
| `drill-anim/assets/handdef.json` | `22ea085b2a3fd1d6d207043def815c34f364b993b245da9fcedd6f581f3b9337` |
| `drill-anim/page/toon.js` | `8a6537f11be68285f3840b9083b976f5b76f2fc3e41c603cabe655340d52d958` |
| `drill-anim/page/posedlib.js` | `e5695c3db473b39fb84851f6689f747dbaa9c15d8312ea8a562cca7ca9cdd05e` |
| `drill-anim/theme.json` | `9880592142016b460c364a68df29d0f61ee802b49427aa13c4146db03bd69074` |
| `runtime/src/spine-helpers.js` | `8bc2190f7253f33ad0479c0f89bbdd6be897ba1e894cc670baa4796628cb8aba` |
| `runtime/src/coach-motion.js` | `18e9c1da25a55fbde60b64ed07bd829b2974bf7d4fd5e928fcdb8259909d6301` |
| `drill-anim/page/engine.js` | `6492c88f4d3fce2526fedac9a09507dddd769dcaa4e0987e612dfef10c7e72ee` |
| `drill-anim/lib/boot.mjs` | `02de778a84181af1b6323263c0ff68e6b9a1b7ce5fcd6edeb6989f75b7440881` |

（文本按 CRLF→LF 规范化后计算，GLB 用原字节，与 `verify.mjs` 相同规则。）`verify.mjs` 在 Pose-Hub 里逐个重算并通过。

## 验证结果（2026-10-17，Linux arm64 沙箱，SwiftShader，单路 `--jobs 1`）

| 检查 | 3D-Body（66067a6） | Pose-Hub main |
|---|---|---|
| `npm ci` | 16 个包 | 16 个包（同一 lock 依赖） |
| `node drill-anim/verify.mjs` | ok：159 个动作 spec（51 App、147 默认、12 托马斯预览、51 h-*、8 o-*、8 w-*、8 s-*），模型源 13，原 spec 哈希保持 | ok：数字完全相同 |
| `node drill-anim/verify.mjs`（`fix/hip-pose-feet-highlight` 分支） | 166 个 spec（#121 加 7 个 r2） | 166 个 spec，ok |
| `python drill-anim/test_portability.py` | 7 项 OK | 7 项 OK |
| `python -m unittest discover -s media/tests` | — | 11 项 OK |
| 像素比较 `deltoids-A` 帧 0/63/120 + still | — | 合成图 4 张 + 原始主/辉光通道 8 张（2160²），**逐像素完全相同**（差异像素 0，SSIM 1.000000） |
| 像素比较 `h-9090-liftoff` 帧 0/40/80 + still | — | 合成图 4 张 + 原始通道 8 张，**逐像素完全相同** |

两边各自用 `drill.py render <id> --frames … --jobs 1` 渲染，3D-Body 用原 checkout 和端口 8881，Pose-Hub 用新布局和端口 8882；同一台机器、同一 Chromium（Playwright chromium-1140）。3D-Body 一侧 deltoids-A 渲染了两次（一次带只读请求日志，一次完全未改动），两次都与 Pose-Hub 一致。渲染时请求的文件清单用于确定 `runtime/` 需要搬哪些文件。

迁移过程中沙箱虚拟机重启过一次（13:33 UTC，渲染已结束、内存余量约 6 GB、无 OOM 记录，判断为沙箱回收而非渲染负载）；之后所有步骤在持久盘上重做并复验。
