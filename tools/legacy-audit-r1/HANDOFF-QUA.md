# 旧动作修复 r1 交接说明（给 Hark-QUA，2026-11-21，统筹：hark-sk）

开哥 2026-11-21 14:29 安排：hark-sk 继续跑全库审计并统筹；Hark-QUA 接手修复，按严重程度从高到低推进。
本文件 + `FINDINGS-LIVE.md` 是你的任务说明。清单会随审计进度更新（hark-sk 推到 `codex/legacy-audit-r1`，并在话题里通知新增批次）。

## 1. 背景（为什么要修）

开哥看片发现 Hub 旧动作有肉眼可见的错误，点名 4 个（只是示例）：
1. 哥萨克蹲 adductors-A：下蹲脚受力/重心不对，膝与脚方向不一致（膝内扣）。
2. 90/90 坐姿换髋 s-9090：名字和 Flare 文案说「双膝翻到另一侧，左右换髋，上身坐直」，视频却是单侧前后压上身。
3. 裆部网格凸起：坐姿/分腿类裤裆鼓包，**全库必须避免**。
4. 屈膝侧平板 h-short-side-plank：小腿和脚翻向上方、脚尖朝向反人类。正确：前臂 + 下侧膝/小腿外侧撑地，屈膝约 90°，小腿在身后，双脚叠放贴地。

审计方法（见 `CALIBRATION.md`）：逐动作标准（`standards/<id>.json`，写了「正确长什么样」和依据）+ V5 实测世界空间几何（`audit.mjs`）+ 判定（`analyze.py`）+ 多视角出图。已校准：上面 4 个全部抓到且原因对；Flare 新动作做阴性对照，动作级检查全过。

## 2. 环境与代码

- 仓库 `mhgd3250905/3D-Pose-Hub`，审计分支 `codex/legacy-audit-r1`（基于 `codex/flare2-moves-r3 @ a0017fb`，含 main 与 Flare r1–r3 动作，旧动作配方与 V5 一致）。
- **你的修复分支**：从 `origin/codex/legacy-audit-r1` 开 `codex/legacy-fix-r1`。只推这个分支，不 force、不改历史。
- 跑实测（单个动作约 1.5 分钟，串行，别并行开多个 Chrome）：
  ```
  node tools/legacy-audit-r1/audit.mjs --recipe <recipe.json> --out /tmp/<id>.json --stride 10 \
    --render-frac 0.25,0.5,0.75 --png-dir /tmp/png/<id> --size 300 \
    --views "pfront:0,0.25,1;pside:1,0.2,0;ptop:0,1,0.001:0,0,-1;pback:0,0.25,-1;camcr:0,0,0:0,1,0:pelvis,0.3,-0.05"
  python3 tools/legacy-audit-r1/analyze.py /tmp/<id>.json > /tmp/<id>.an.json
  ```
  指定帧出图：`--frames 40,80 --render 40,80`。`analyze.py` 自动按 `standards/<id>.json` 判。
  沙箱里 headless Chrome 缺系统库时，下载对应 deb 解包到本地目录并设 `LD_LIBRARY_PATH`（hark-sk 这边是 `/workspace/work/chromelibs/usr/lib/aarch64-linux-gnu`）；Python 依赖只有 numpy/PIL。
- 动作来源：`tools/v5/v5-actions.json` → 每个动作的 recipe（`catalog/production/*/recipes/<id>.json`）→ recipe 指向的 spec（`drill-anim/specs/*.js`）。文字在 `catalog/production/v3-text/<id>.json`。参考已做好的 Flare 新动作写法：`tools/flare2-moves-r3/`（含 `check.mjs`、`precision.py`）。

## 3. 修复顺序（从高到低）

`FINDINGS-LIVE.md` 已按级排好，同级按幅度从大到小：

- **P0 反人类 / 文不对题**：脚装反、膝朝向反 180°、侧撑小腿翻上、文案与视频不符。先修。
- **P1 严重错位**：膝/髌骨朝向与屈膝方向偏差 >60°、膝内扣（膝在脚长轴内侧 >4 cm）、过度外翻（外侧 >10 cm）、侧蹲重心不在下蹲脚（>8 cm）、站/跪姿重心出支撑面。
- **M 模型级裆部鼓包**：Flare 新动作也有（42 mm），是 V5 裆部蒙皮的共性问题。**不要逐动作改姿势**，在 V5 皮肤层一次修（见 §5）。
- **P2 明显不准**：上面都做完再说，先等 hark-sk 评审后的终版清单。

**第 1 批（现在开始）**，共 6 个动作：
| 顺序 | id | 名称 | 问题 | 修法 |
|---|---|---|---|---|
| 1 | h-short-side-plank | 屈膝短杠杆侧平板 | 双脚装反（差 173–180°）、一脚离地 175 mm、脚比膝高 8 cm | 屈膝约 90°，小腿放到身后，双脚叠放、下侧脚外侧贴地，脚尖回到髌骨一侧 |
| 2 | h-floor-nordic-hand-reset | 地面北欧离心及手撑复位 | 右腿负重屈膝时膝朝向比脚尖偏 180° | 先看图确认；跪姿时膝、小腿、脚背贴地且脚尖朝后，膝铰链方向修正 |
| 3 | s-9090 | 90/90 坐姿换髋 | 名字/Flare 文案是左右换髋，视频无换边；右膝朝向差 66°；前裆鼓包 43 mm | 按文案重做：90/90 起始→脚跟压稳，双膝同时翻到另一侧成镜像 90/90，上身坐直，往返；膝朝向随髋旋转、膝只做铰链。另一种（改文案成单侧前倾）需开哥选，先做重做版 |
| 4 | adductors-A | 哥萨克蹲 | 到底时重心偏出下蹲脚 17 cm；膝在脚内侧 7 cm 且脚尖外转约 20° | 骨盆横移到下蹲脚上方、臀往后坐；下蹲脚全脚掌踩实，膝对准第 2–3 脚趾；伸直腿膝伸直、脚跟着地脚尖朝上 |
| 5 | h-squat | 徒手深蹲 | 到底两膝在脚外侧 15 cm，髌骨朝向与屈膝方向差 70° | 膝对准脚尖正上方（双脚略外八 15–30°，膝同向），小腿接近竖直，全脚掌着地 |
| 6 | deltoids-B | （见 recipe nameZh） | 负重屈膝时右膝在脚内侧 12 cm | 先看图确认下肢姿态是否本就该站稳；膝对准脚尖 |

**第 2 批**：M 裆部模型级修复（§5）。**第 3 批起**：P1 其余（h-butterfly-active、h-9090-liftoff、h-band-leg-out、h-db-calf-raise 等）及全库新增，按 hark-sk 推送的清单顺序。

## 4. 修复规则

- **只增不删、不覆盖旧对象**：不改原 spec / recipe 文件。新建版本文件（spec 加后缀如 `-lfx1.js`，recipe 放 `catalog/production/legacy-fix-r1/recipes/<id>.json`，指向新 spec），并在 `tools/legacy-fix-r1/CHANGES.md` 记录每个动作改了什么、为什么。动作 id 不变。
- 每个动作先**看图确认问题属实**（清单未经独立评审，你看图就是第一道评审）。不属实的写进 `tools/legacy-fix-r1/false-positive.md`，说明理由，不修。
- 照 `standards/<id>.json` 的「正确长什么样」修；标准本身不对就改标准并写依据（教科书/认证机构描述），不能为了过检查放宽阈值。
- 只改出问题的部位和阶段，节奏、时长、换边方式、镜头不动；文字只有 P0「文不对题」才改，改成草稿并标未审。
- 一次只开一个 Chrome/渲染进程。

## 5. 裆部模型级修复（第 2 批）

- 目标：V5 身体在髋深屈/大外展时裆部（会阴、前裆）4 cm 邻域鼓包从 33–70 mm 降到 <28 mm，站立基线（3–4 mm）不变，其他部位不变形。
- 做法：在 V5 皮肤层做（裆部顶点权重平滑 / 修正形状键 / 运行时修正，挑最稳的），以新版本文件加入（如 `tools/v5/runtime/` 下新模块或新 glb，原文件不覆盖），渲染侧用开关启用。
- 验收集：校准 10 个 + 清单里所有 M 级动作 + 5 个站姿动作；每个都要裆部 <28 mm，`analyze.py` 其他检查不新增问题；看裆部特写（camcr 视角）和正面图确认无凹陷、穿模、锯齿。
- 这一步会影响全库成片，所以做完只出样片，不讨论全库重渲。

## 6. 每个动作的验收（全部满足才算修好）

1. `audit.mjs` + `analyze.py` 跑修复后 recipe：该动作**无 S1**，S2 不比修复前多；原问题给出修复前后数值。
2. 多视角图（正/侧/顶/背 + 裆部特写）在 25/50/75% 和问题帧上逐张看，对照标准写一句「现在长什么样」。
3. 动作与文字一致（名称、Hub 文字、Flare 文案）。
4. 若有 Flare 风格自检（`tools/flare2-moves-r3/check.mjs`）能跑，也跑一遍：无抖动、无穿地、接触正确。
5. 未修改的动作不受影响（`git diff` 只含新文件和 CHANGES.md）。

## 7. 每批交付与回报

- 推 `codex/legacy-fix-r1`，在交接话题里 @hark-sk 回报：commit SHA、每个动作修复前后数值表、属实/误报判断、每个动作 1 张关键对比图（发图）、样片任务卡草稿（命令、recipe 路径、输出目录）。
- hark-sk 用审计工具独立复核，过了再派渲染机出样片、给开哥审。**你不直接派渲染机**（整机同时只跑一个渲染任务，由 hark-sk 排队）。
- 卡住（同一问题循环两次以上）就停下，把已有结果和卡点报给 hark-sk。

## 8. 禁止（只认开哥本人）

不上传 R2/服务器，不切任何 Pose-Hub 指针（dev/beta/stable，含回滚），不合并、不 tag、不 Release、不改 main/master，不改 reviewed/userAccepted/releaseEligible，不碰其他仓库，不对外发布。群规：话题内只 @ 派任务方（hark-sk）；纯确认不回；bot 之间最多 3 轮，超出就等开哥。
