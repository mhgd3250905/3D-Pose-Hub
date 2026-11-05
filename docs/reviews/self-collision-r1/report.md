# Pose-Hub 身体自穿模审核 r1（线上 r2-v1，249 个动作，只审核不修）

分支 `audit/self-collision-r1`（基于 r2-v1 `9788bd1`）。未改正式配方/spec、未重传、未合并。地面穿模不在本轮（见 fix/ground-contact-r1）。

## 结论
- **249/249 全部扫完**（2 个 `-native` 悬挂/提握动作脚本报错未测：h-bilateral-farmer-hold-native、h-straight-arm-hang-native）。
- **63 个动作有 >10 mm 身体自穿模**（至少 30 个顶点深于 10 mm），其中 **51 个 ≥20 mm**。另有 44 个只在「上臂↔躯干（腋下）」报数，判为低可信（腋窝皮肤折叠区，特写看是贴合），不计入。
- 最常见的部位对：手→大腿 24 个、手→躯干 17 个、前臂→躯干 11 个、大腿→躯干 8 个、脚↔脚 7 个、前臂→大腿 6 个、前臂↔前臂 5 个、手→小腿 4 个。
- **抱膝类**（名字/动作含抱膝/抱腿/抱胸）全部有穿模：
  - h-knee-hug 仰卧抱膝：双手整只陷进小腿 **49 mm**（每只手 ~4300 个顶点在小腿里，即整只手看不见），手/前臂还陷进大腿 45 / 35 mm，全程每一帧都有。
  - n-thomas-test 仰卧单膝抱胸：右手陷进左大腿 **51 mm**、左手陷进左小腿 46 mm，全程。
  - h-bilateral-upper-back-hug 双臂环抱上背：右手陷进左上臂 23 mm（peak）；腋下另报 35 mm（低可信）。
  - 同类「手抓/扶腿」的 o-seated-fig4 坐姿四字前压（手→小腿 49 mm）、s-figure4（脚→对侧大腿 69 mm）也很重。

## 方法（数值为主）
- 脚本 `tools/self-collision-r1/`：
  - `scan-fast.mjs`：一个页面 boot 一次 armfix-r2，逐个配方用 `__drill.applyAt` 解算，帧 = keytimes（rest / mid / peak / hold，同 work/r219/keytimes.mjs）+ 1/4、3/4 周期，共 ≤6 帧。不装每个配方的固定手/道具/动作修正（与 elbow-audit-r1/scan-fast 相同的局限）。
  - `self-collision-audit.mjs`：完整生产安装链（recipe-scene.mjs）逐个配方测，用于复核；h-knee-hug、n-thomas-test 两条完整链与快速扫描结果一致（49/51 mm）。
  - 测量：每个被绘制顶点 CPU 蒙皮，按主骨骼分到 14 个部位（左右手、前臂、上臂、大腿、小腿、脚、躯干、头颈）；用蒙皮后的三角形重算法线；顶点进入另一部位的深度 = 到该部位最近顶点沿其外法线的负距离（只在该部位包围盒内才算）。
  - 忽略的正常接触：同侧 手/前臂、前臂/上臂、大腿/小腿、小腿/脚 全部忽略；上臂/躯干在肩关节 14 cm 内、大腿/躯干在髋关节 18 cm 内、头/躯干在颈 12 cm 内、两大腿在骨盆 16 cm 内忽略。
  - 判定：第 10 深顶点深度 d10 > 10 mm 且 ≥30 个顶点深于 10 mm（去掉零星顶点）。
- 汇总 `summarize.py` → `self-collision-list.csv`（每个动作每个部位对一行）、`summary.json`。

## 清单（按最深排序，非腋下）
见 `self-collision-list.csv`；下表每个动作只列最深一对。
| # | 动作 | 中文名 | 最深部位对 | 深度 mm | 帧(t s) | 其他超阈值部位对 |
|---|---|---|---|---|---|---|
| 1 | n-prone-hip-ext | 俯卧屈膝抬腿 | rightForearm/torso | 102 | peak 1.05 |  |
| 2 | h-cobra | 眼镜蛇式 | rightForearm/torso | 101 | rest 0 |  |
| 3 | n-prone-ir | 俯卧小腿外摆 | rightForearm/torso | 101 | rest 0 |  |
| 4 | h-goblet-squat | 壶铃高脚杯深蹲 | rightForearm/torso | 86 | rest 0 | rightHand/torso 45; leftHand/torso 45; leftForearm/torso 26 |
| 5 | t-vsit | V撑 | rightThigh/torso | 79 | rest 0 | leftThigh/torso 79 |
| 6 | s-figure4 | 仰卧4字臀部拉伸 | leftThigh/rightFoot | 69 | q1 2 | leftThigh/rightShin 25 |
| 7 | t-lsit-tuck | L撑收腿伸腿 | leftThigh/torso | 61 | rest 0 | rightThigh/torso 61 |
| 8 | adductors-A | 哥萨克蹲 | leftThigh/rightThigh | 56 | q3 6 | rightThigh/torso 53 |
| 9 | n-thomas-test | 仰卧单膝抱胸（托马斯测试） | leftThigh/rightHand | 51 | q1 2 | leftHand/leftShin 46; leftShin/rightHand 44; leftHand/leftThigh 38 |
| 10 | t-seated-straddle-lifts | 坐姿分腿双腿抬起 | leftForearm/leftThigh | 51 | peak 0.65 | rightForearm/rightThigh 49; rightForearm/torso 42; leftForearm/torso 39 |
| 11 | h-knee-hug | 仰卧抱膝 | leftHand/leftShin | 49 | rest 0 | rightHand/rightShin 49; leftHand/leftThigh 46; rightHand/rightThigh 45; leftForearm/leftThigh 35 |
| 12 | o-seated-fig4 | 坐姿四字前压 | rightHand/rightShin | 49 | peak 3.6 | leftThigh/rightFoot 44; leftShin/rightFoot 34; rightHand/rightThigh 30 |
| 13 | triceps-B | 平行杆直臂支撑 | rightThigh/torso | 46 | hold 4 | leftThigh/torso 45 |
| 14 | deltoids-A | 直臂侧平板沉髋 | leftThigh/rightThigh | 44 | peak 2.1 | leftHand/leftThigh 27; leftHand/torso 25 |
| 15 | h-bulgarian | 椅子保加利亚分腿蹲 | rightHand/torso | 41 | mid 1.2 | leftHand/leftThigh 36; leftHand/torso 33 |
| 16 | s-seated-fold | 坐姿体前屈 | rightThigh/torso | 40 | peak 3.6 | leftThigh/torso 40 |
| 17 | h-kb-swing | 单臂壶铃摆荡 | rightForearm/rightThigh | 39 | rest 0 | rightHand/rightThigh 24; rightForearm/torso 16 |
| 18 | h-crossbody | 交叉臂肩后侧拉伸 | leftHand/torso | 38 | rest 0 | leftForearm/rightForearm 24; leftForearm/rightUpperArm 24 |
| 19 | forearms-B | 坐姿哑铃上下卷腕 | rightForearm/rightThigh | 37 | rest 0 | rightForearm/rightShin 25; rightThigh/rightUpperArm 16 |
| 20 | s-kneel-hipflex | 半跪髋前侧拉伸 | leftHand/torso | 36 | q1 2 | rightHand/torso 34; rightHand/rightThigh 16 |
| 21 | h-biceps-self | 双手对抗弯举 | leftForearm/torso | 36 | hold 3.9 | leftHand/rightForearm 18 |
| 22 | h-couch-stretch | 后脚搭凳沙发拉伸 | leftHand/torso | 36 | peak 3.6 | rightHand/torso 31; rightHand/rightThigh 27 |
| 23 | h-side-er | 侧卧手臂向外转 | rightForearm/torso | 36 | rest 0 | leftFoot/rightFoot 12 |
| 24 | w-chair-hip-thrust | 椅子臀推 | rightHand/torso | 34 | mid 0.8 | rightHand/rightThigh 31; leftHand/torso 30; leftHand/leftThigh 29 |
| 25 | o-seated-twist | 坐姿扶椅扭转 | leftHand/leftThigh | 33 | rest 0 | rightHand/rightThigh 33 |
| 26 | n-seated-knee-lift | 坐姿抬膝悬停 | rightHand/rightThigh | 33 | mid 0.6 | leftHand/leftThigh 32 |
| 27 | n-half-split | 半跪半劈叉（扶砖） | rightThigh/torso | 33 | peak 2.45 |  |
| 28 | h-9090-liftoff | 90/90 后腿主动抬起 | leftHand/leftThigh | 32 | rest 0 |  |
| 29 | s-9090 | 90/90坐姿髋部拉伸 | leftHand/leftThigh | 32 | rest 0 |  |
| 30 | h-hip-gate | 扶椅站姿开髋门 | rightHand/rightThigh | 32 | peak 0.95 | rightHand/torso 22 |
| 31 | deltoids-C | 地雷杆半跪单臂推举 | leftHand/leftThigh | 31 | mid 1 |  |
| 32 | h-good-morning | 徒手早安式 | leftForearm/rightForearm | 31 | rest 0 |  |
| 33 | quadriceps-A | 跪姿身体后倾 | leftForearm/rightForearm | 31 | rest 0 | rightHand/torso 19; leftHand/torso 16; leftUpperArm/rightHand 14; rightForearm/torso 13 |
| 34 | erectors-C | 45° 罗马椅背伸 | leftForearm/rightForearm | 30 | mid 1.7 | rightHand/torso 21; leftHand/torso 16; leftUpperArm/rightHand 16; rightForearm/torso 13 |
| 35 | h-half-kneeling-quad-stretch | 半跪手拉脚大腿前侧拉伸 | rightHand/rightThigh | 28 | mid 1.5 | leftFoot/leftHand 14; rightHand/torso 13 |
| 36 | n-pelvis-circle | 站姿骨盆画圈 | leftHand/leftThigh | 28 | q1 2 | rightHand/rightThigh 26; leftHand/torso 25; rightHand/torso 22 |
| 37 | n-seated-squeeze | 坐姿夹砖（膝内夹） | rightHand/rightThigh | 27 | peak 0.85 | leftHand/leftThigh 27 |
| 38 | h-chair-lat | 扶椅侧背拉伸 | rightThigh/torso | 27 | hold 4 | leftThigh/torso 27 |
| 39 | t-straddle-hold | 分腿支撑 | leftForearm/leftThigh | 27 | rest 0 | rightForearm/rightThigh 26 |
| 40 | n-chair-wiper | 坐椅雨刷（膝内倒） | rightHand/rightThigh | 26 | mid 1 | leftHand/leftThigh 13 |
| 41 | h-lateral-step-lunge | 侧跨步弓步蹲 | rightHand/rightThigh | 26 | q3 7.5 | leftHand/leftThigh 25 |
| 42 | hip-abductors-A | 侧平板抬腿 | rightHand/torso | 25 | rest 0 | leftFoot/rightFoot 24 |
| 43 | h-kneeling-thread-needle | 跪姿穿针 | leftForearm/rightForearm | 25 | peak 3 |  |
| 44 | h-bilateral-upper-back-hug | 双臂环抱上背拉伸 | leftUpperArm/rightHand | 23 | peak 2.35 |  |
| 45 | s-butterfly | 蝴蝶式 | leftFoot/rightFoot | 23 | rest 0 | rightHand/rightShin 18; leftHand/leftShin 16 |
| 46 | h-chair-step-up | 椅子上步 | rightHand/torso | 23 | rest 0 | leftHand/torso 22 |
| 47 | h-squat | 徒手深蹲 | leftHand/leftThigh | 23 | rest 0 | rightHand/rightThigh 22 |
| 48 | o-stand-crossreach | 扶椅站姿交叉侧伸 | leftThigh/rightThigh | 23 | rest 0 |  |
| 49 | n-straddle-fold | 坐姿分腿体前屈 | leftForearm/leftThigh | 20 | hold 4 | rightThigh/rightUpperArm 20; leftThigh/leftUpperArm 19; rightForearm/rightThigh 17 |
| 50 | o-seated-ham | 坐姿大腿后侧拉伸 | leftHand/leftThigh | 20 | rest 0 |  |
| 51 | h-band-hip-ir | 坐姿弹力带脚向外摆 | leftHand/leftThigh | 20 | rest 0 | rightHand/rightThigh 16 |
| 52 | h-db-overhead-triceps-extension | 单臂哑铃过头臂屈伸 | head/rightForearm | 20 | mid 1.25 |  |
| 53 | t-tuck-planche | 团身俄挺 | rightThigh/torso | 20 | rest 0 | leftThigh/torso 20 |
| 54 | h-butterfly-active | 仰卧蝴蝶式开合腿 | leftFoot/rightFoot | 19 | q1 2 |  |
| 55 | h-open-book | 侧卧开书式 | leftFoot/rightFoot | 19 | rest 0 |  |
| 56 | h-reverse-lunge | 后撤步弓步蹲 | rightHand/torso | 18 | rest 0 | leftHand/torso 17 |
| 57 | rotator-cuff-A | 俯撑交替触肩 | leftForearm/torso | 18 | hold 2.7 | rightForearm/torso 18 |
| 58 | o-seated-catcow | 坐姿猫牛式 | leftHand/leftThigh | 17 | peak 2 | rightHand/rightThigh 17 |
| 59 | o-stand-lunge | 扶椅弓步拉伸髋前侧 | leftHand/torso | 16 | peak 3.6 |  |
| 60 | h-side-leg-raise | 站姿侧抬腿 | rightHand/torso | 15 | rest 0 | leftHand/torso 14 |
| 61 | chest-A | 俯卧撑转侧撑 | leftThigh/rightThigh | 13 | hold 2.72 |  |
| 62 | h-reverse-clam | 侧卧反向蚌式 | leftFoot/rightFoot | 12 | rest 0 |  |
| 63 | w-clamshell | 侧卧蚌式开合 | leftFoot/rightFoot | 12 | rest 0 |  |

## 共同原因
1. **手/前臂的落点是按旧 v2 体型算的，没按新人体（armfix-r2 + base 四肢/躯干）改过。** 典型 h-knee-hug-r3：r3 只是继承 r2，文件里自己写着「New-human contact, geometry … remain pending」；掌心目标 = 膝 + 沿小腿 7 cm + 离小腿轴 **6.2 cm**（v2 细腿的数），而且膝的位置用的是 `ss-geo.mjs` 里 v2 的大腿/小腿长（TH 0.353 / SH 0.410），不是模型实际解出的膝。新人体小腿更粗，掌心目标点落在小腿里面，于是整只手陷进去。n-thomas-test 已经把离轴距离加到 7.8 cm 仍陷 46–51 mm，说明光靠拍脑袋加偏移不够，要按新模型的实测肢体半径算。
2. **「手扶腿/扶腰/抱臂」类同理**：手→大腿（坐姿/弓步/深蹲手放膝上 24 个）、手→躯干（叉腰、扶髋 17 个）、前臂↔前臂（抱臂交叉 5 个），落点都是贴 v2 身体表面写的，新身体更厚，落点跑到皮肤里面。
3. **整条肢体压进躯干**：前臂→躯干（俯卧/眼镜蛇类肘贴肋 11 个，最深 ~100 mm）、大腿→躯干（V 撑、L 撑收腿、坐姿体前屈 8 个），是关节角度按 v2 薄躯干写的，新躯干更厚时屈得太深。
4. 脚↔脚（蝴蝶式、蚌式 7 个，12–23 mm）：两脚掌相贴的目标距离按 v2 鞋写，新鞋更宽。

## 修复方案（最小改动）
- 和地面修复同一套路：**只给有问题的动作新建 `-sc1` spec，不动共用安装链和模型**。
- 抓握/贴合类（手→腿、手→躯干、前臂↔前臂、脚↔脚）：把接触目标从「关节 + 固定偏移」改成「新模型实测表面 + 手掌半厚（约 1.5 cm）」；具体做法是每个动作的离轴偏移按本工具测到的穿透深度 + 1 cm 余量往外推，并把 `leg()` 里的腿长换成 armfix-r2 实测腿长（或直接用解算后的膝/踝位置做参照）。
- 肢体压进躯干类（俯卧肘贴肋、V 撑、体前屈）：减小对应关节角（肩内收 / 屈髋）几度，或把肘/膝的目标外移，直到 d10 ≤ 10 mm。
- 验收：用 `tools/self-collision-r1/self-collision-audit.mjs --recipe <新配方>` 全链复测，d10 ≤ 10 mm 才算过；地面检查一起再跑一遍，防止推开手后又穿地。
- 腋下（上臂↔躯干）44 个低可信报数先不改，等用户看图再定。

## 修前/修后对比（h-knee-hug，临时配方，不进正式配方）
- 临时 spec `drill-anim/specs/h-knee-hug-sc1-tmp.js`（副本见 `docs/reviews/self-collision-r1/h-knee-hug-sc1-tmp.js.txt`）：掌心离小腿轴 6.2 → 10.5 cm、沿小腿 7 → 8 cm。全链复测（`fix-sc1-h-knee-hug.jsonl`）：
  - 手→大腿 45 → 27 mm，前臂→大腿 35 → 26 mm，rest 帧手→小腿 49 → 36 mm；**但 peak/hold 帧手→小腿仍 45 mm**。
  - 结论：只加偏移不够。原因是目标点是按 v2 腿长（ss-geo `leg()`）算出的「虚拟膝」，和新模型实际解出的膝/小腿位置不重合，手跟着虚拟膝走，仍落在真实小腿里。正确修法：掌心目标改为以**解算后的真实膝/踝**为参照（或把 `leg()` 换成 armfix-r2 实测腿长），再加「实测小腿半径 + 1.5 cm」的离面距离。时间到，未做第二轮。
- 图：`img/ab-h-knee-hug-prod-before.png`、`img/ab-h-knee-hug-top-before.png`（俯视：双手完全看不见，整只手在小腿里）、`img/closeup-h-knee-hug-before.png` / `img/closeup-h-knee-hug-after-sc1.png`（修后手指露出一部分，仍不够）、`img/closeup-n-thomas-test.png`（右手陷进左膝/大腿）、`img/check-n-thomas-test-armpit.png`（腋下报数核对：贴合，判低可信）。
- 未完成：前 10 名其余动作特写（沙箱中途重启，只排上了部分）；第二个代表动作的修复对比。
