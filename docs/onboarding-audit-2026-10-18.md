# 新人上手审计（2026-10-18）

以“全新 clone、第一次来”的视角，只按顶层文档（README → AGENTS → drill-anim/README → media/README）实际走一遍。结论和修法已经写进 [START-HERE.md](START-HERE.md)，这里只记录实测和发现。

## 环境与做法

- 机器：Hark 沙盒，Debian 13 arm64、2 vCPU、7 GB 内存、无 GPU、非 root（与远程审核服务器同级）；Node 22.23、Python 3.12、ffmpeg 7.1。
- 新目录 `git clone https://github.com/mhgd3250905/3D-Pose-Hub.git`（main = `cf2c6bd`），不复用任何已有 checkout 的 `node_modules`、config 或 Playwright。

## 实测结果

| 步骤 | 结果 | 耗时 |
|---|---|---|
| 完整 clone | 通过（.git 48 MB，工作树 85 MB） | 4 s |
| `npm ci` | 通过，16 个包 | 8 s |
| `node drill-anim/verify.mjs` | 通过：169 spec、51 App、13 模型源 | 8 s |
| `python drill-anim/test_portability.py` | **先跑会报 FileNotFoundError**（缺 `config.json`）；复制 config 后 7 项通过 | <1 s |
| `python -m unittest discover -s media/tests` | 28 项通过（标准库即可） | 5 s |
| 安装渲染依赖 | `npm i --no-save playwright@1.48.2` 2 s；`npx playwright install chromium` 7 s；`pip install --user numpy scipy pillow` 6 s | — |
| Chromium 启动 | **非 root 机器缺 libatk / libatk-bridge / libXcomposite / libXdamage / libatspi**，需 root 跑 `npx playwright install-deps chromium`，或把这 5 个 .so 放一个目录填进 `ld_library_path` | — |
| 预览 `h-quad-cars --frames 66 --pr 0.5 --jobs 1 --theme themes/glow-soft.json` | 通过，日志有 `highlight {"version":"soft-v1"…}`，画面正常 | 墙钟 30 s（Vite 启动约 4 s + 浏览器 boot 10.6 s + 每帧约 3.5 s + 合成 2 s） |
| 预览 `s-frog-r2 --frames 0,60 --pr 0.5` | 通过 | 墙钟 24 s |
| `drill.py qa h-quad-cars`（预览后） | 各单项 ok，但 `pass=false`，因为 `frames_complete=false`（只渲了 1 帧） | 2 s |

## 卡住 / 含糊 / 要猜的点

1. **浅克隆会让 verify 失败。** `git clone --depth 1` 后 verify 报 `Original spec inventory unavailable`：它要用 git 读基线提交 `1adcab8` 的 59 个原 spec。文档没写。→ 必须完整 clone，或 `git fetch --unshallow`。
2. **Playwright 不在 package.json，文档没给安装命令和版本。** README 只写“Playwright + Chromium”。历史渲染一律是 chromium-1140 = playwright 1.48.x。
3. **`config.example.json` 的 `playwright_module` 指向 `drill-anim/node_modules/…`，但按 README 在根目录装依赖后实际在 `../node_modules/…`**，照抄会在 boot 时报模块找不到。（已改示例为 `../node_modules/playwright/index.mjs`。）
4. **Chromium 系统库**：非 root 机器上缺 5 个 .so，报错只在启动浏览器时出现，文档没提。
5. **CJK 字体路径**：示例里的 `/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc` 在新机器上通常不存在。`--frames` 预览不用字体；全片的拼图、`masks`、`swatch` 才需要。
6. **test_portability 依赖 config.json**，报错是 Python 栈，不直说“先复制 config”。
7. **`--theme` 路径相对 `drill-anim/`**（`themes/glow-soft.json`），即使在仓库根运行也是这样；README 示例是对的，但没说明。HipLab 新成片该用哪个主题（glow-soft），只在 soft-highlight 记录里写了，README 还写“默认 v7、方案 B glow-b”。
8. **预览 QA 的 `pass` 永远是 false**（`frames_complete`），需要看各单项；文档没说。
9. **帧号依赖 spec 的 fps**：76 份 spec 写了 `fps: 15`，其余默认 30；发布时 HipLab 统一包装成 30 fps。文档里的“第 120 帧”有时指发布片、有时指 spec 原生帧，容易对错帧。
10. **修订版 id 有两套约定**：`h-knee-hug-r2`、`h-supine-twist-r2`、`s-seated-fold-r3` 的 `spec.id` 仍是原 id（候选表登记 `renderId`）；其余 r2 的 `spec.id` 是 `<id>-r2`，发布时在渲染端包装回原 id。AGENTS 只说“另存 `<id>-r2.js`”。
11. **过时说法（现役文档）**：`drill-anim/README.md` 的道具一节说引体杆、泡沫轴、瑞士球、地雷杆、绳索、双杠、罗马椅/GHD、反向背伸、髋外展机/腿屈伸机“还没写”，实际都已在 `page/props*.js` 实现且被 spec 使用；布局一节没列 `page/props-*.js`、`soft-highlight.js`；README 主题一行没提 glow-soft。（已修。）
12. **过时说法（历史文档，没改正文）**：`drill-anim/HANDOFF.md`、`HANDOFF-C.md`、`COLLAB.md` 仍让人 clone 3D-Body、base 选 `feature/drill-anim`、按 Drive 档位目录交付；`docs/hiplab-phase1-drills-2026-10-16.md` 写 `cd tools/drill-anim`。照做会走错仓库/分支。（三份交接文档顶部加了一行“历史文档”提示，正文未动；dated 记录未改，路径对照写进 START-HERE。）
13. **文档提到但本仓库没有的工具**：`flickscan`、`propscan`、`render_batch.py`（绿幕/透明母帧链）在 3D-Body PR #120 的 `tools/hiplab-render/`，未迁入 Pose-Hub。低配机做不了这些检查，只能交给主线本机。
14. **verify 输出的分类计数**不含 `n-*`、`a-*`，`defaultSpecs` 等字段名不直观；想知道“有哪些动作、谁在用”没有入口。（新增 `drill-anim/tools/catalog.mjs` → `docs/drill-catalog.md`。）
15. **推送需要用户同意**（AGENTS 第 5 条），远程 agent 要知道这条在派任务时是否已授权。
16. `drill-anim/tools/probe.mjs` 不会自己启动 Vite（`drill.py` 会），直接用会连不上。

## 结论

新人**能**跑通，但要猜 4 处才能出第一帧：Playwright 怎么装、`playwright_module` 路径、Chromium 系统库、浅克隆。按顶层文档写的命令本身都对。动作层面的信息（哪些 spec 在用、谁替代谁、已知问题、该用哪个主题）散在十几份 dated 记录里，没有总入口——这是接手“审核优化 + 补全动作”最大的障碍，现由 START-HERE、drill-catalog、review-rubric 补上。
