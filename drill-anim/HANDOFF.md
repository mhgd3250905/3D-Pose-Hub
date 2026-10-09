# 训练动作 3D 动画 · 并行交接文档

更新：2026-10-09 22:30（北京时间）· 负责人：盛开 · 已有执行方：Hark

## 1. 一句话目标
为 App 动作库里的 51 个训练动作（17 个肌群 × A 徒手 / B 家用器械 / C 健身房）各做一段**无缝循环的 3D 卡通动画**，统一使用已获批准的 v7 风格。

## 2. 分工（并行，互不阻塞）
| 谁 | 负责 | 数量 |
|---|---|---|
| **同事 1** | **B 档：家用器械，全部 17 个**；外加 B 档要用的道具 | 17 |
| **同事 2** | **C 档 9 个**：绳索器械、地雷杆、固定器械和壶铃行走，详见 `HANDOFF-C.md` | 9 |
| Hark | A 档剩余部分（进行中）；C 档 8 个：双杠、吊环、罗马椅/GHD、反向背伸 | 12 + 8 |

### 你的 17 个动作（id · 名称 · 器械）
| id | 名称 | 器械 | 难度提示 |
|---|---|---|---|
| deltoids-B | 哑铃土耳其起立 | 轻哑铃/壶铃 · 垫 | ★★★ 多阶段，最难，建议最后做 |
| rotator-cuff-B | 弹力带肘贴体侧外旋 | 弹力带，毛巾夹腋下 | ★★ 弹力带、毛巾 |
| triceps-B | 平行杆直臂支撑 | 平行杆一对 | ★ 建议第一个做 |
| forearms-B | 哑铃腕屈 + 腕伸 | 轻哑铃 · 凳或膝 | ★★ 手腕活动幅度 |
| serratus-B | 泡沫轴墙面上滑 | 泡沫轴 · 墙 | ★★ 需要墙和泡沫轴 |
| scapular-B | 单杠肩胛引体 | 门框单杠 | ★★ 悬垂握杆 |
| chest-B | 平行杆深幅俯卧撑 | 平行杆 | ★ |
| lats-B | 弹力带直臂下拉 | 弹力带（高处固定） | ★★ |
| abs-B | 平行杆团身 L 撑 | 平行杆 | ★★ |
| obliques-B | 弹力带抗旋转推 | 弹力带（侧向） | ★★ |
| erectors-B | 瑞士球背伸 | 瑞士球 · 墙边抵脚 | ★★ |
| hip-flexors-B | 弹力带站姿高抬膝 | 弹力带套脚 | ★★ 单腿站立平衡 |
| glute-max-B | 弹力带四足直腿后踢 | 弹力带 · 垫 | ★ |
| hip-abductors-B | 仰卧弹力带 V 字开腿 | 小弹力圈 · 垫 | ★ |
| adductors-B | 屈膝哥本哈根侧撑 | 长凳/沙发边 | ★★ 凳子 |
| quadriceps-B | 弹力带终末伸膝 | 弹力带（低处） | ★ |
| hamstrings-B | 滑盘腿弯举 | 滑盘/毛巾 | ★★ 脚在地面滑动（例外：这里脚允许按设计滑动） |

建议顺序：先做 triceps-B、chest-B、abs-B，这三个共用平行杆，能把手握道具的流程跑通；再做弹力带类，然后是泡沫轴、瑞士球、单杠，最后做 deltoids-B。

### 文件归属（避免冲突）
- `specs/*-B.js`：**你独占**。
- `page/props.js` 里的道具：
  - **你负责**：哑铃、壶铃、弹力带/弹力圈、平行杆、单杠、泡沫轴、瑞士球、滑盘、长凳、墙。
  - **同事 2 负责**：地雷杆、绳索器械（龙门架/单柄/绳/脚踝扣）、髋外展机、腿屈伸机。**Hark 负责**：双杠、吊环、罗马椅/GHD、反向背伸机。
  - 每个道具写成独立函数，各加各的，不改对方的函数。
- **共享核心**（`page/engine.js`、`page/toon.js`、`lib/*`、`drill.py`、`theme.json`）：
  - 能不改就不改。
  - 必须改时，单独开一个小 PR 到 `feature/drill-anim`，PR 描述写清改动，并确认 `deltoids-A` 渲染结果不变。
  - 拉取对方改动用 `git pull --rebase`。

## 3. 代码与分支
- 仓库：https://github.com/mhgd3250905/3D-Body
- 共享分支：`feature/drill-anim`（基于 `design/muscle-sync`）。引擎在 `tools/drill-anim/`。
- 工作分支：同事 1 用 `feature/drill-anim-B`，同事 2 用 `feature/drill-anim-C2`，都从 `feature/drill-anim` 拉出，阶段性 PR 回 `feature/drill-anim`。
- **永远不要合并进 master**（master 是线上 Flutter App）。

## 4. 环境搭建（约 30 分钟）
```bash
git clone https://github.com/mhgd3250905/3D-Body && cd 3D-Body
git checkout feature/drill-anim && git checkout -b feature/drill-anim-B
npm ci                                  # App 本体依赖（Vite 用它提供模型）
cd tools/drill-anim
npm init -y >/dev/null && npm i playwright && npx playwright install chromium
pip install numpy scipy pillow          # Python 3.10+
# 系统依赖：ffmpeg（含 libx264）、中文字体（如 Noto Sans CJK）
cp config.example.json config.json      # 按本机修改 font 等路径
# 下载 Drive「交接包」里的 refs.zip，解压到 tools/drill-anim/refs/（51 张参考图 <id>.png）
python3 drill.py render deltoids-A --frames 0,63   # 冒烟测试
```
冒烟测试通过的标准：出来的静帧和 Drive 上的 `deltoids-A-sheet.png` 一致。

## 5. 必读
1. `README.md`：CLI、spec 格式、主题格式、QA 指标。
2. 参考实现：
   - `specs/triceps-A.js`：地面支撑加屈伸。
   - `specs/glute-max-A.js`：仰卧，双手压地。
   - `specs/rotator-cuff-A.js`：手触身体，加摆镜。
   - `specs/serratus-A.js`：肩胛前伸。
3. 质量标杆：Drive 上已完成的 A 档 mp4 和 sheet。

## 6. 每个动作的流程
1. 看 `refs/<id>.png` 和 `data/drills.json` 里该动作的要点，确定动作意图、循环时长（6–8 秒）和高亮肌群。
2. 写 `specs/<id>.js`，在文件头注释里写明头朝向、身体左侧在哪边。
3. 预览：`python3 drill.py render <id> --frames 0,40,80,120`。**每张都要亲眼看**，有问题就修，再预览。
4. 完整渲染：`python3 drill.py render <id>`，产出 mp4、gif、sheet 和 metrics。
5. QA：`metrics/<id>.json` 里 `pass: true`，并且人眼检查 sheet 和中间帧。
6. 归档：把 mp4、sheet 和 metrics 上传到 Drive 的 `B-tier` 文件夹，同名重传时把旧版挪进 `_old-versions`。然后 commit spec 加道具，push。
7. 在 Drive 的 `B-tier/进度.md`（或 PR 描述）里记一行：id、时长、关键指标、遗留问题。

## 7. 硬规则（用户明确要求，不达标不算完成）
- **手碰到身体绝不允许穿模**：`hand_clip` 必须通过，贴着身体的手与表面间隙 ≤ 4 mm。手握道具时，道具和手、身体之间也不许互相穿插。
- **地面接触点固定不滑**：手掌、脚、肘、膝的漂移 < 0.1 mm。例外：hamstrings-B 的滑盘按设计滑动。
- 该直的肢体要真直：肘、膝 ≥ 176°。
- 不撑地、不握东西的手要放松，四指并拢。
- 任何地方都不能穿模，包括四肢互相、肢体与道具、道具与地面。
- 节奏均匀，循环无缝，第一帧和最后一帧接得上。
- 解剖上要合理，高亮的目标肌群要看得清。
- 镜头：如果摆镜或运镜能把动作展示得更清楚，**可以用**（用户已批准）。
- 不要改默认主题外观。服装、肤色都放在 `theme.json` / `themes/` 里配置。
- 质量优先，时间不是问题。

## 8. 输出规格（不要改）
- 1080×1080，30 fps，H.264（CRF 18，yuv420p）。
- 另出 540 px GIF。
- 深色背景，橙色 rim glow，灰色无脸人台，青色目标肌肉高亮。
- 2× 超采样后降采样。

## 9. 交付与验收
- B 档全部完成后：
  - 生成 `B-tier-sheet.png`（17 行，每行一张参考图加一张关键帧），放进 Drive。
  - 发 PR：`feature/drill-anim-B` → `feature/drill-anim`。
- 用户看总览和视频验收。打回的动作修好后再提交。
- 最终由 Hark 把 A、B、C 三档汇总成一个 PR（`feature/drill-anim` → `design/muscle-sync`），**不合并 master**。

## 10. 已知坑
- 渲染慢：2 核 CPU 下，一个 8 秒循环约 11 分钟。一定先用 `--frames` 预览，同一时间只渲一个动作。
- 用 `pkill -f "vite ...8830"` 停 Vite 时，别和其他命令串在一条 shell 里，否则可能把自己的 shell 一起杀掉。`drill.py` 退出时会自己停 Vite。
- 头部无法前后点头，头和躯干是锁定的。
- 自定义顶点属性传不进 shader，肌群数据要走纹理（见 `toon.js`）。
- 短裤约一半法线朝内，碰撞检测别用法线判断（`hand_clip` 用的是骨骼核心线距离）。
- 道具只出现在主渲染通道里，没有描边，这是有意为之。

## 10b. 渲染后端 / GPU（ARM 机器必读）
- Hark 的环境：Linux **aarch64**，没有 GPU；Playwright 1.48.2 自带 Chromium（chromium-1140），无头模式；参数 `--use-gl=swiftshader --enable-unsafe-swiftshader`，即 CPU 软件渲染。
- 启动参数可以在 `config.json` 的 `chromium_args` 里配置，也可以用环境变量 `CHROMIUM_ARGS` 覆盖：
  - macOS Apple Silicon：用硬件 GPU，`"chromium_args": ["--use-angle=metal"]` 或 `[]`。
  - Linux ARM，SwiftShader 起不来时：`["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"]`；也可以改用系统 Chrome，设 `"chromium_channel": "chrome"`。
  - Windows 或有独显的 Linux：`[]`。
- 换后端后，先跑 `deltoids-A --frames 0,63`，和 `4_质量标杆/deltoids-A-sheet.png` 对比，确认画面一致。
- Playwright 版本建议固定为 `npm i playwright@1.48.2`。

## 11. 联系
有问题先找盛开。共享核心的改动在 PR 里 @ 对方。
