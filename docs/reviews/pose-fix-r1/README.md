# Pose-Hub 小臂拧转 + 身体自穿模修复 r1（分支 fix/limb-twist-collision-r1）

基于线上 r2-v1 + audit/self-collision-r1 + audit/elbow-twist-r1。**未合并、未上传、未改线上指针、未打 tag。**
只给有问题的动作新建 spec 版本（`-et*` 小臂拧转、`-sc1` 自穿模、`-mv1` 幅度），共用安装链只加了一个按配方开启的 r6 腕扭转运行时（`wristTwistRuntime {version:'r6',capDeg:40}`）。

验收口径：全链（recipe-scene 生产安装链）`tools/self-collision-r1/self-collision-audit.mjs`，d10 ≤ 10 mm 才算过；
「上臂↔躯干（腋下）」按审核报告判为低可信，单列不计；小臂用 `tools/elbow-audit-r1/scan-fast.mjs` + `analyze.py`（±180 折返次数、单步跳变）
和 `tools/pose-fix-r1/hand-fixed-twist.py`（手相对前臂绕前臂长轴的拧转）。

## 用户真机标记的 4 个必修

| 动作 | 用户标记 | 改动 | 修前 | 修后 | 结论 |
|---|---|---|---|---|---|
| h-knee-hug 仰卧抱膝 | 穿模 | `h-knee-hug-r3-sc1`：掌心按**解算后的真实膝/小腿**放到小腿前外侧表面（place 模式），再按实测穿透往外推（push 模式，t=0 冷启动帧额外推开） | 手→小腿 48.8 mm、手→大腿 45.5、前臂→大腿 34.6（全程每帧） | 手→小腿 7.5 mm（只 rest 帧，<30 顶点超 10 mm），其余手/前臂对 0 | **过**。手放在膝下小腿上、俯视/侧视都看得见（图 1、2）。地面：躯干最低点 15.9→16.4 mm，没回退 |
| h-bilateral-upper-back-hug 双臂环抱上背 | 小臂扭曲（5.7 s） | `rr3-et3-sc1`：et2 左小臂按新模型实测 elbowTwist 补偿（去掉 ±180 折返）；et3 新加右小臂实测补偿；sc1 右手从左上臂里推出 31 mm | 左手相对前臂 135→300°，折返 2 次，severe；右手→左上臂 25.4 mm | 左 -67…-70° 恒定、右 -75° 恒定，折返 0，单步跳变 ≤1°；右手→左上臂 0 | **过**（图 3、4 右半）。腋下（上臂↔躯干）31–50 mm 和修前同级，低可信未改 |
| h-overhead-triceps-stretch 过头三头拉伸 | 左小臂扭曲 | `rr1-et1`：常量前臂分摊 | 手相对前臂 左 134° / 右 167° | 左 74° / 右 59°，折返 0，单步跳变 0.2° | **过**（图 4 左半）。自穿模只有腋下 8.4 mm |
| h-crossbody 交叉臂肩后侧拉伸 | 像静止 | `r9-mv1`：右臂水平内收 25→38°（13°）改为 5→38°（33°），左手接触跟着转 | 幅度 13° | 幅度 33° | **幅度过；自穿模没过，需要用户看图定**（见下） |

### h-crossbody 自穿模（未解决，需定夺）
- 保持/峰值帧和 r9 完全一样（左手→胸 16 mm、左前臂↔右前臂 13 mm、左前臂↔右上臂 13 mm）——这是 r9 本来就有的握持接触（spec 的 qa.allowContact 把这些列为允许接触）。
- **rest 帧变差**：r9 左手→胸 34 mm → mv1 73 mm、左前臂→右上臂 22→42 mm。原因：右臂几乎正前方时，左手要从胸前绕到右臂外侧下方才够得到。
- 试过两种修法都不行，已撤：①按实测穿透推左手（4 轮不收敛，推出胸就进右臂）；②左手只跟到差 6° 就停（手进右上臂 41 mm）。
- 可选：A 保留 mv1（会动，但开头 1 s 左前臂压胸更深）；B 起点改 15–20°（幅度 18–23°，rest 穿模接近 r9）；C 重做这个动作的左手（rest 时左手放下、拉臂时再抓）。我倾向 C，需用户点头再做。
- 小臂：左手相对前臂固定拧转 132°（r9 同样 132°），折返 2 次（r9 同样 2 次），没开 r6，留下一轮。

## 时间有余做的：n-thomas-test 仰卧单膝抱胸（候选，请看图）
- `n-thomas-test-r3-sc1`：同抱膝的做法（真实膝/小腿贴放 + 按实测往外推）。
- 修前：右手→左大腿 50.9 mm、左手→左小腿 45.9、右手→左小腿 44.1、左手→左大腿 38.0；修后：手/前臂对全部 0（≤10 mm）。
- 剩下：大腿↔躯干 13.7 mm 但只有 19 个顶点（<30，按审核规则不计）；腋下 77→36 mm（低可信）。地面：躯干最低 13.3→13.7 mm，没回退。
- 看图（`img/cmp-n-thomas-test.jpg`，第 1/3 行修前、第 2/4 行修后）：双手从陷在大腿/小腿里变成搭在膝盖上方、看得见；但手更像「扶在膝盖顶上」，不是「抱在膝下」，手指张开。请用户定：接受，或改成抱膝下（要再调贴放位置）。

## 249 小臂清单
- `elbow-249.md` / `elbow-249.csv`：249 个动作修前完整清单（循环内转动、单步跳变、±180 折返、肘角跳变）+ 本轮开 r6 的 12 个修后数。
- `../../pose-fix-r1/hand-fixed-twist-before.csv`：手相对前臂固定拧转，修前 >120° 37 个、>90° 65 个。
- 本轮 r6 开启后变 ok 的：h-band-leg-out、h-tabletop、w-prone-swimmer；仍 severe 的（r6 只解决折返，不解决固定大拧转）：h-db-zottman-curl、h-kneeling-thread-needle、h-db-overhead-triceps-extension、t-seated-straddle-lift-1leg 等，见 elbow-249.md「修后级别」列。

## 已改 / 未改
- 已改配方：h-knee-hug、h-bilateral-upper-back-hug、h-overhead-triceps-stretch、h-crossbody；r6 腕扭转运行时开启的 12 个：forearms-A、h-band-leg-out、h-bilateral-upper-back-hug、h-db-curl、h-db-overhead-triceps-extension、h-db-zottman-curl、h-kneeling-thread-needle、h-quadruped-open、h-tabletop、o-seated-twist、t-seated-straddle-lift-1leg、w-prone-swimmer。
- 未改：自穿模清单其余约 60 个；h-goblet-squat 全链复核；两个 -native 悬挂/提握动作补测；「手相对前臂最大固定拧转」全量指标（修前清单已有，修后未全量重扫）；方案 C 余下动作。

## 和 fix/ground-contact-r1 会冲突的配方文件
两边都改了（合并时按 ground-contact 的 gc spec 为底，再叠本分支的 `wristTwistRuntime` / spec 版本）：
- catalog/production/remaining219-r1/recipes/forearms-A.json
- catalog/production/remaining219-r1/recipes/h-kneeling-thread-needle.json
- catalog/production/remaining219-r1/recipes/h-quadruped-open.json
- catalog/production/remaining219-r1/recipes/t-seated-straddle-lift-1leg.json
4 个必修动作的配方不和地面分支冲突。

## 图（左/上 = 修前，右/下 = 修后）
1. `img/cmp-h-knee-hug-t0.jpg`：抱膝 rest 帧，成片视角 / 俯视 / 侧视
2. `img/cmp-h-knee-hug-t2.05.jpg`：抱膝峰值帧
3. `img/cmp-ubh-t2.35.jpg`：上背环抱峰值，成片视角 / 正面特写 / 侧面特写（右手不再陷进左上臂）
4. `img/cmp-forearms.jpg`：左半 过头三头拉伸 左/右小臂特写；右半 上背环抱 5.7 s 左/右小臂特写
5. `img/cmp-cb.jpg`：交叉臂 t=0/1.4/4.2，上两行成片视角（r9 / mv1），下两行俯视（r9 / mv1）
