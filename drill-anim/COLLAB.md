# 三人协作规范（必读，优先级高于 HANDOFF.md 中的旧说法）

更新：2026-10-09 23:00 · 适用于：Hark、同事 1（GitHub `UUU GK`）、同事 2（GitHub `uuugk2`）

## 1. 谁做什么
| 人 | 动作 | 分支前缀 | Drive 文件夹 |
|---|---|---|---|
| Hark | A 档 17 个；C 档 8 个：triceps-C、lats-C、abs-C、serratus-C、scapular-C、erectors-C、glute-max-C、hamstrings-C | `drill/` | `A-tier/`、`C-tier/` |
| 同事 1 · UUU GK | B 档全部 17 个 | `drill/` | `B-tier/` |
| 同事 2 · uuugk2 | C 档 9 个：chest-C、rotator-cuff-C、obliques-C、hip-flexors-C、adductors-C、deltoids-C、hip-abductors-C、quadriceps-C、forearms-C | `drill/` | `C-tier/` |

只做分给自己的动作 id。别人的 spec、道具函数都不要碰。

## 2. GitHub：一个动作一个分支、一个 PR
1. 每个动作开工前，先同步主线，再开分支：
   ```bash
   git fetch origin
   git checkout -b drill/<id> origin/feature/drill-anim   # 例：drill/triceps-B
   ```
2. 这个分支里只放这一个动作：`specs/<id>.js`，加上它新增或改动的道具函数。**不要提交** `out/`、`refs/`、`config.json`（已在 .gitignore 里）。
3. 动作完成、QA 通过、成品已传 Drive 之后，push 并提 PR：
   - **base 选 `feature/drill-anim`**，不是 master，也不是 design/muscle-sync。
   - 标题：`[B] triceps-B 平行杆直臂支撑 v1`（档位 + id + 中文名 + 版本）
   - 描述按下面的模板写。
4. 每个人只提自己的 PR，一个 PR 只包含一个动作，三个人的工作不要混进同一个 PR。
5. **共享引擎**（`page/engine.js`、`page/toon.js`、`lib/*`、`drill.py`、`theme.json`）的改动单独开分支和 PR：
   - 分支名：`engine/<简述>`，例如 `engine/band-render`。
   - 标题以 `[engine]` 开头。
   - 描述里写明 deltoids-A 重渲后画面没变。
   - 动作 PR 如果依赖它，在描述里写上“依赖 #PR号”。
6. 合并：PR 由盛开验收后合入 `feature/drill-anim`，作者不要自己合并。合入后，其他人开下一个分支前先 `git fetch`。
7. 打回修改：继续在原分支上改，push 后 PR 自动更新，标题里的版本号 +1（v2、v3…）。

### PR 描述模板
```
动作：triceps-B 平行杆直臂支撑（B 档 · 负责人：UUU GK）
版本：v1
循环：6 s / 180 帧
QA：pass=true；接触点漂移 0.0 mm；肘 ≥179°、膝 ≥177°；hand_clip ≥ +1.0 mm；求解器警告 0 帧
Drive：<该动作文件夹链接>
新增/改动道具：parallettes()
已知问题：无 / ……
依赖：无 / #12
预览：（把 GIF 拖进来）
```

## 3. Google Drive：按档位 → 动作 → 版本存放
```
Flare drill-anim/
  Flare drill-anim 进度总表      ← Google 表格，每个人都要实时更新
  00_总览与引擎/                 ← 总览图、换装对比、肌群高亮图、引擎快照
  交接包 Handoff/                ← 交接文档、参考图、压缩包
  A-tier/<id>/                   ← Hark
  B-tier/<id>/                   ← 同事 1
  C-tier/<id>/                   ← 同事 2 和 Hark（id 不重复，不会冲突）
  _old-versions/                 ← 早期试点留下的旧文件，不再使用
```
- 每个动作单独一个文件夹，文件夹名就是动作 id，例如 `B-tier/triceps-B/`。
- 文件名带版本号，旧版本**不删除**，留在同一个文件夹里：
  - `triceps-B_v1.mp4`
  - `triceps-B_v1.gif`（可选）
  - `triceps-B_v1-sheet.png`
  - `triceps-B_v1-metrics.json`
- 修改后传 `_v2`，以此类推。
- 每一档全部做完后，在 `00_总览与引擎/` 放该档的总览图：`B-tier-sheet_v1.png`、`C2-sheet_v1.png`、`C-hark-sheet_v1.png`。

## 4. 进度总表（Drive 根目录的 Google 表格）
- 每完成一步就更新自己那一行：状态、版本、PR 链接、Drive 文件夹链接、最后更新日期、备注。
- 状态只用这 6 个：未开始 → 制作中 → 自检通过 → PR已提交 → 已验收；被要求修改时填“打回”。
- 只有盛开可以把状态改成“已验收”或“打回”。

## 5. 开发进度备份
- 代码：每天收工前把当天的分支 push 一次，哪怕还没做完，PR 可以先开成 Draft。
- 成品：每个动作自检通过后，**当天**传 Drive。
- 引擎工作日志：在自己的 PR 描述或进度总表备注里写清楚做到哪一步、卡在哪里，换人或隔天也能接着做。

## 6. 每个动作的完成标准（全部满足才能算“自检通过”）
1. `metrics/<id>.json` 中 `pass: true`。
2. 手碰身体或道具时不穿模：`hand_clip ≥ -0.5 mm`，贴着身体的手间隙 ≤ 4 mm。
3. 支撑点不滑动（漂移 < 0.1 mm）。该直的肢体要真直（≥176°）。空闲的手放松，四指并拢。
4. 自己看过 sheet 和中间帧：任何地方都没有穿模，节奏均匀，循环无缝，目标肌群看得清。
5. 镜头允许摆动或运镜，前提是能把动作展示得更清楚。
6. 输出规格：1080×1080、30 fps、H.264 CRF 18 + 540 px GIF，默认主题。

## 7. 共享资料怎么流动（谁做的东西别人怎么用上）
- 主线是 `feature/drill-anim`。PR 合进主线后，所有人执行 `git fetch && git rebase origin/feature/drill-anim` 就能拿到。
- **引擎和道具 PR 优先验收、优先合并**，动作 PR 后合。这样别人的新道具或引擎修复，当天就能进主线。
- 还没合并、但急着要用别人的改动时，可以先 `git fetch && git merge origin/engine/<名字>` 临时拉进自己的分支。在 PR 描述里写“依赖 #号”，合并时就不会乱。
- 自己写的道具函数如果别人也可能用到（比如 B 档的壶铃要给 C 档用），放进 `page/props.js` 这类公共文件，走 engine/ 分支和 PR。
- Drive 根目录三个人都能看、都能编辑。参考成品去 `A-tier/`、`B-tier/`、`C-tier/` 里找，但**只往自己的文件夹里传文件**。

## 8. 经验清单（Hark 做 A 档时总结，照做能省很多时间）
1. 分三步做：先看关键帧静帧（几秒），再渲低清预览（约 1 分钟），最后全量渲染（8–10 分钟）。
2. 同一类动作复用 spec：平板类、臀桥类、坐姿支撑类、侧卧类，各先做一个模板，后面的只改关键帧。
3. 写完 spec 先量一下手脚够不够得着支撑点。直臂撑地，手臂长度经常差几厘米，导致身体穿进地面。
4. 状态文件放在 work/，不要放 /tmp。机器重启会清空 /tmp。
5. 测间隙要算到表面，不要算到最近的顶点。贴身的手用 `touch.solve: 'bisect'` 定位。
6. 衣服也算身体，手不能穿进裤子里。
7. 镜头要避开遮挡：手或大腿挡住高亮肌群时，挪手或者换角度。
8. 直肢不要在两个姿势之间直接线性插值，那样中途会弯（实测膝盖一度弯到 141°）。用弧线轨道让脚踝或手腕沿圆弧走。
9. 写 spec 时就把节奏对齐：每次重复的上、停、下时长要一致。
10. QA 必须查 `frames_complete`。浏览器启动失败时会悄悄丢掉半段帧，QA 却照样 pass。
11. 自动 QA 通过不代表没问题，必须自己看中间帧（比如轮廓光条纹，QA 就查不出来）。
12. 收工前关掉 Vite 和渲染进程，否则下一次会占着端口启动失败。
