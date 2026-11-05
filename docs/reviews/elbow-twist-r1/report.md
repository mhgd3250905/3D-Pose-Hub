# Pose-Hub r2-v1 前臂轴向扭转（肘部被拧）审核 r1 — 未完成版（186/249）

只审核，不改动作、不重传、不合并。分支 audit/elbow-twist-r1（只加诊断工具和本报告）。

## 状态
- 数值扫描完成 186/249（abs-A … o-wall-hip-hinge-stretch，按字母序）；剩 63 个（quadriceps-* … t-vsit）未跑：沙箱 08:35 重启杀掉了后台扫描，之后 heavy 锁一直被另一个自碰撞审核任务占用。
- 特写图、修前/修后对比图：未出（同一原因，排在 heavy 队列里没轮到）。脚本和镜头清单已备好：job2.sh / shots-top.json(由 mkshots.py 生成) / shots-ab-*.json。

## 指标（只看绕小臂自身长轴的转动，排除摆动）
- 小臂长轴 = 前臂骨→手骨方向（在前臂骨局部坐标里）。注意：这套骨骼的长轴不是局部 +Y（实测偏 93°），所以旧的 remote-rotation-r1 扭转筛查测的其实是摆动，抓不到这个问题。
- rollRange：渲染时小臂相对上臂的实际 roll（解算 + wrist-twist 运行时 twistShare 转移），逐帧增量绕长轴累加 → 一个循环内的转动幅度；纯摆动贡献 0。
- rollStep：相邻采样之间 roll 跳变（5Hz 采样 = 每 0.2 s）。
- 其他：手相对前臂 roll（handRollMax）、±180° 折返次数（wrapFlips）、只看解算的 roll（share0Range）、肘角单帧跳变（elbowPop）。
- 阈值：severe = 循环内 ≥120° 或 单步 ≥50°；suspect = ≥75° 或 ≥30°。生理参考：旋前约 80°、旋后约 90°，手腕本身几乎不能绕长轴转。
- 方法校验：快速单页扫描与完整生产安装链（scan.mjs）在 serratus-B 上逐帧一致。皮肤网格指标（elbowSkin 等）受分解奇异影响，只作参考，不参与排序。

## 结果（186 个里 13 个有问题：11 severe + 2 suspect；其中 h-standing-forearm-rotation 是动作本身旋前旋后，正常）
| # | 动作 | 级别 | 侧/问题时刻 | 循环内转动/单步跳变 | 手部 | 原因 | 原型修复后 |
|---|---|---|---|---|---|---|---|
| 1 | h-band-leg-out | severe | right 2.8s | 178° / 178° | fixed-grasp · 冻结拳 | 手腕扭转跨±180°被折返，前臂一帧内甩半圈；手相对前臂扭到179°（超生理） | ok |
| 2 | h-tabletop | severe | left 1s | 175° / 175° | support · 原生手 | 手腕扭转跨±180°被折返，前臂一帧内甩半圈；手相对前臂扭到177°（超生理） | ok |
| 3 | h-db-curl | severe | left 5.4s | 174° / 168° | dumbbell-grasp · 冻结拳 | 手腕扭转跨±180°被折返，前臂一帧内甩半圈；姿态解算本身让前臂转了126°；手相对前臂扭到179°（超生理） | suspect |
| 4 | h-db-overhead-triceps-extension | severe | right 1.4s | 161° / 161° | dumbbell-grasp · 冻结拳 | 手腕扭转跨±180°被折返，前臂一帧内甩半圈；姿态解算本身让前臂转了198°；手相对前臂扭到174°（超生理） | severe |
| 5 | h-kneeling-thread-needle | severe | right 6.2s | 164° / 155° | native · 原生手 | 姿态解算本身让前臂转了136°；肘角单帧跳45°（IK 抖动）；手相对前臂扭到141°（超生理） | severe |
| 6 | h-bilateral-upper-back-hug | severe | left 2s | 143° / 143° | native · 原生手 | 手腕扭转跨±180°被折返，前臂一帧内甩半圈；姿态解算本身让前臂转了162°；手相对前臂扭到179°（超生理） | severe |
| 7 | o-seated-twist | severe | right 7s | 124° / 95° | native · 原生手 | 手相对前臂扭到134°（超生理） | severe |
| 8 | h-quadruped-open | severe | right 6s | 116° / 79° | native · 原生手 | 手相对前臂扭到146°（超生理） | severe |
| 9 | forearms-A | severe | right 5.2s | 112° / 78° | support · 原生手 | 肘角单帧跳72°（IK 抖动）；手相对前臂扭到154°（超生理） | suspect |
| 10 | obliques-C | severe | left 1.7s | 118° / 59° | fixed-grasp · 冻结拳 | 姿态解算本身让前臂转了168°；手相对前臂扭到126°（超生理） | severe |
| 11 | h-standing-forearm-rotation | severe | right 2s | 120° / 18° | native · 原生手 | 动作本身就是前臂旋前旋后，属正常（转120°） | severe |
| 12 | chest-A | suspect | left 6.4s | 77° / 30° | support · 原生手 |  | suspect |
| 13 | obliques-A | suspect | right 2.7s | 53° / 30° | support · 原生手 |  | suspect |
## 共同特征 / 根因
1. **主因：wrist-twist 运行时（hands-native r5）在 ±180° 处折返。** 它每帧把“手相对前臂的 roll θ”包回 [-180°,180°]，再把 twistShare×θ（默认 0.5）整段加到前臂骨上。θ 一越过 180°，前臂就在一帧里反向甩 180°（0.5×360°），整个小臂像被拧过去。5 个动作有这种折返（h-band-leg-out、h-tabletop、h-db-curl、h-db-overhead-triceps-extension、h-bilateral-upper-back-hug）。原生手、冻结拳都有：运行时对所有配方都装。
2. **前臂骨是整段刚性转。** 运行时把那份扭转加到整根前臂骨上，肘部皮肤和腕部一起转，所以出现“肘部扭曲”，而真实的旋前旋后是从肘到腕逐渐增大。twistShare 改 1.0 只是把更多扭转推到肘部：数值上 share=1.0 时问题动作数和现在差不多（7 severe + 5 suspect vs 11+2），不是解法。
3. **一部分动作是 spec 的手部朝向目标本身超生理**：45/186 个动作的手相对前臂 roll 超过 120°，其中 h-db-overhead-triceps-extension、h-bilateral-upper-back-hug、h-kneeling-thread-needle、obliques-C、h-db-curl 的解算本身就让前臂转了 126–198°。要逐个改 spec。
4. 次要：少数动作有肘角单帧跳变（IK 抖动），看着像扭：forearms-A 72°、h-kneeling-thread-needle 45°（另有 obliques-B、deltoids-C、h-band-pallof 超过 40°，但没进扭转名单）。

## 最小修复方案（建议，均未实施）
- A（运行时，全量、零 spec 改动）：wrist-twist r6 = θ 与上一帧保持连续（不再 ±180° 折返）+ 转到前臂骨的部分限幅 |share·θ| ≤ 40°。原型文件 tools/elbow-audit-r1/wrist-twist-r6-proto.js（没接到任何配方）。数值模拟：186 个里 severe 从 11 降到 7、suspect 从 2 变成 7；折返类全部消失（h-band-leg-out、h-tabletop 降到 ok）。注意：渲染需要按帧顺序跑（生产本来就是按帧顺序）。
- B（模型，下一步）：前臂扭转改成按肘→腕渐变分配（加前臂 twist 骨或按顶点权重分配），肘部不再整段刚性转。B 做好后可以去掉 A 里的限幅。
- C（spec，逐个动作）：对 roll 本身超生理的 6 个（h-db-overhead-triceps-extension、h-bilateral-upper-back-hug、h-kneeling-thread-needle、obliques-C、o-seated-twist、h-quadruped-open）改手部朝向目标，让手的转动在约 ±90° 内；forearms-A、h-kneeling-thread-needle 另修 IK 跳变。
- 不建议：全量改 twistShare=1.0（会把扭转推到肘部）。

## SF「动作异常汇报」标记存在哪
- 在 SmartFit App 里（mhgd3250905/Sport-Helper，lib/diagnostics/action_issue*.dart），不在 SDK。
- 存在本机 LocalStateStorage，键 `smartfit.action-issues.v1`（录制开关 `smartfit.action-issues.recording.v1`），跟诊断/运行日志是分开存的，所以诊断导出 JSON 里不会有。
- 导出方法：设置 → 「内测工具 · 正式版不显示」→「动作问题标记」→ 点「保存动作标记到下载」，文件存到 下载/SmartFit/SmartFit-action-issues-<时间>.json（需要 Android 10 及以上）。
- 只有 internal flavor 并且构建时带 `--dart-define=SMARTFIT_ACTION_ISSUES=true` 才有这个功能。每条记录有 actionId、revision、videoSeconds（视频时间点）、tags、note。tags 只有 穿模/姿势不对/高亮不对/镜头裁切/名称说明不对，没有“扭转”，现在只能选「姿势不对」再写备注。

## 文件
- suspects-partial.csv（186 个全部指标，按严重度排序）、analyze-partial.txt、scan-all.json（原始逐帧数据，不进 Git）
- 工具：tools/elbow-audit-r1/{scan-fast.mjs, scan.mjs, analyze.py, closeup.mjs, wrist-twist-r6-proto.js}
