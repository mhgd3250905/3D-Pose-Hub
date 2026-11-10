# 本机 GPU 渲染交接：肘部扭转 r2 + ROM 修复（2026-11-10）

给本机（RTX 4080）渲染 Agent。先读完本文再动手。

## 0. 状态

- 仓库 `mhgd3250905/3D-Pose-Hub`，分支 `codex/elbow-twist-r1`（Draft PR #39，叠在 PR #38 上）。渲染基准提交以本文件所在提交为准（ROM 修复截至 `0889cc7`，边界三个决定 `d22205a`/`24a9bcf`/`09729d1`）。
- 用户于 2026-11-10 08:52 看过 CPU 小尺寸角度图（26 个动作的修前/修后对比），视觉验收通过，转本机 GPU 渲染。
- 所有修改目前只有 CPU 指标和小尺寸静态帧。**没经过 GPU 渲染和用户最终验收，不能说「已修好」。**
- 配方都是 `reviewed:false`、`userAccepted/releaseEligible=false`。渲染通过后是否采用、是否改状态，由用户决定，本机不要改。

## 1. 红线（除非用户另行同意）

不合并任何 PR；不推 main；不 force；不改历史。不上传媒体，不切 catalog 指针（dev/beta/stable），不打 tag，不发 Release。不改 spec、配方、`tools/` 代码、文案、皮肤。只跑一个渲染进程。

## 2. 渲染清单（26 个动作，按配方渲染，配方已指向下表 spec）

| # | 动作 id | 渲染 spec | 提交 | 修前 spec |
|---|---|---|---|---|
| 1 | h-chair-dip | h-chair-dip-r1 | 00bd81b | h-chair-dip-et1 |
| 2 | erectors-B | erectors-B-r3 | d61816d | erectors-B-r2 |
| 3 | h-tabletop | h-tabletop-r4 | d02030e | h-tabletop-r3 |
| 4 | s-pigeon | s-pigeon-r1 | 465f282 | s-pigeon-gc2-et1 |
| 5 | h-crossbody | h-crossbody-r10 | f94897a | h-crossbody-r9-mv2 |
| 6 | s-9090 | **s-9090-r6**（只渲 r6；r5 `98886d8` 是中间版） | 0889cc7 | s-9090-r4-sc1-et1 |
| 7 | deltoids-B | deltoids-B-r4 | c23ca81 | deltoids-B-r3 |
| 8 | deltoids-C | deltoids-C-r1 | 3458660 | deltoids-C-gc-int1 |
| 9 | h-9090-liftoff | h-9090-liftoff-r4 | ad00e97 | h-9090-liftoff-r3-et1 |
| 10 | forearms-B | forearms-B-r4 | 6e1da87 | forearms-B-r3 |
| 11 | h-chair-elbow-triceps-stretch | h-chair-elbow-triceps-stretch-r5 | e6d4f5f | h-chair-elbow-triceps-stretch-r4-kn1 |
| 12 | h-overhead-triceps-stretch | h-overhead-triceps-stretch-r4 | 19f12b5 | h-overhead-triceps-stretch-r3 |
| 13 | h-goblet-squat | h-goblet-squat-r4 | c7e3fed | h-goblet-squat-r3-et1-kn1 |
| 14 | hamstrings-C | hamstrings-C-r1 | c8c2e2a | hamstrings-C |
| 15 | o-seated-ham | o-seated-ham-r1 | 417f1e3 | o-seated-ham-sc1 |
| 16 | o-stand-quad | o-stand-quad-r1 | ed0e887 | o-stand-quad |
| 17 | o-supported-star-reach | o-supported-star-reach-r1 | b498c97 | o-supported-star-reach-et1 |
| 18 | w-bird-dog | w-bird-dog-r1 | 7819da6 | w-bird-dog-gc1 |
| 19 | quadriceps-A | quadriceps-A-r1 | 1222d3c | quadriceps-A-et1 |
| 20 | h-band-pull-apart | h-band-pull-apart-r3 | d82a07c | h-band-pull-apart-r2-kn1 |
| 21 | lats-B | lats-B-r5 | 13eb365 | lats-B-r4 |
| 22 | n-straddle-fold | n-straddle-fold-r4 | efcc77b | n-straddle-fold-r3 |
| 23 | h-db-front-raise | h-db-front-raise-r4 | 2ed11a5 | h-db-front-raise-r3 |
| 24 | glute-max-C | glute-max-C-r3（spec 2f2cb45，采用决定 d22205a） | d22205a | glute-max-C-r2 |
| 25 | w-dead-bug | w-dead-bug-r3（spec 6b287ea，采用决定 24a9bcf） | 24a9bcf | w-dead-bug-r2 |
| 26 | abs-A | abs-A-r3（spec f446555，采用决定 09729d1） | 09729d1 | abs-A-r2 |

`--ids` 一行：

```
h-chair-dip,erectors-B,h-tabletop,s-pigeon,h-crossbody,s-9090,deltoids-B,deltoids-C,h-9090-liftoff,forearms-B,h-chair-elbow-triceps-stretch,h-overhead-triceps-stretch,h-goblet-squat,hamstrings-C,o-seated-ham,o-stand-quad,o-supported-star-reach,w-bird-dog,quadriceps-A,h-band-pull-apart,lats-B,n-straddle-fold,h-db-front-raise,glute-max-C,w-dead-bug,abs-A
```

## 3. 渲染步骤

沿用本机之前各批验收渲染的方式。如果本机已经有 PR #38/#39 验收时用过的命令，就以那条命令为准。没有的话，按 `tools/action-package-v3/README.md` 和 `HANDOFF-LOCAL-AGENT.md` 的本机流程做：

1. `git fetch origin && git checkout codex/elbow-twist-r1 && git pull --ff-only`，确认 HEAD 是本文件所在的提交。只在仓库根目录跑 `npm ci`（如需要）。`drill-anim/config.json` 用本机 GPU 配置（`chromium_args` 用硬件 GL），不要提交它。
2. 另开一个终端：`npm run dev -- --host 127.0.0.1 --port 8830 --strictPort`。
3. 新建运行目录，不要覆盖旧 run：`F:\PoseHub-v3\runs\2026-11-10_elbow-rom_<HEAD7位>\`，并在里面建 `_run\`，记录 RUN-INFO（提交号、开始时间、命令）。
4. 先打通 2 个：`python tools/action-package-v3/produce.py --root <运行目录> --ids h-chair-dip,s-9090 --no-voice`，看成片肘部正常再继续。
5. 跑全部 26 个（同一条命令可以续跑）：`python tools/action-package-v3/produce.py --root <运行目录> --ids <上面一行> --no-voice`。
6. `python tools/action-package-v3/check_run.py --root <运行目录>` 生成检查报告。
7. 交给用户：每个动作的成片或关键帧，加修前对比（修前版本用本机已有的旧成片，没有就只交新片）。不改任何状态标志。

不要加 `--heavy`、`--verify-size`、`--verify-frames`。只跑一个 produce。

## 4. 渲染时重点看

- **近身计数增加**（手臂贴身是否穿模）：h-crossbody（+9%）、n-straddle-fold（+7%/+9%）、quadriceps-A（左 +1.5%，左侧未改，疑为波动）。
- **判据边界**：forearms-B 跨肩扭转 +15；s-9090-r6 左跨肩 +15、右 +14；w-bird-dog 左翻面 +10。重点看肩部有没有折痕。
- **foreTot 仍略超 140**：o-seated-ham 左 141；s-9090 右 147。看前臂和腕是否拧。
- **低肘截面（修前遗留）**：deltoids-B .51→.59、h-goblet-squat .65。看肘内侧有没有糖纸状收窄。
- **htw 仍超 75**（只能改手朝向，没改）：h-tabletop 138/162、h-crossbody 124、forearms-B 89。看手腕。
- **边界三个**（glute-max-C、w-dead-bug、abs-A，用户 08:53 同意采用 r3）：肘明显变好，但 R5 下降（glute-max-C .37/.35→.32/.30；w-dead-bug .36/.35→.34/.33；abs-A .40/.39→.34/.33），翻面增加（glute-max-C 341/320→365/288；w-dead-bug 370/368→417/388；abs-A 358/355→430/398）。重点看肩和腋下有没有塌陷或折叠。
- **外观瑕疵（样板，不改）**：forearms-A-r5 左肩腋下折痕；h-band-face-pull-r3 弹力带末端随手转动。如出现在成片中，记录即可。

## 5. 交付

交给用户：运行目录路径、`_run\check-report.md`、每个动作是否正常（肘、肩、腕、穿模），以及第 4 节各项的观察结论。有问题的动作只记录，不修。采用与否、改不改状态、要不要上传，都由用户决定。
