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

## h-goblet-squat 全链复核
- 审核报告里的「右前臂→躯干 86 mm」来自快速扫描（不装道具/固定手）。全链复测（壶铃、固定手都装上）：前臂→躯干 17 mm 但只有 26–27 个顶点（<30，按规则不计，属贴胸抱铃的轻接触）；腋下 62–80 mm（低可信）。结论：不需要修，未改。

## 249 小臂清单
- `elbow-249.md` / `elbow-249.csv`：249 个动作修前完整清单（循环内转动、单步跳变、±180 折返、肘角跳变）+ 本轮开 r6 的 12 个修后数。
- `../../pose-fix-r1/hand-fixed-twist-before.csv`：手相对前臂固定拧转，修前 >120° 37 个、>90° 65 个。
- 本轮 r6 开启后变 ok 的：h-band-leg-out、h-tabletop、w-prone-swimmer；仍 severe 的（r6 只解决折返，不解决固定大拧转）：h-db-zottman-curl、h-kneeling-thread-needle、h-db-overhead-triceps-extension、t-seated-straddle-lift-1leg 等，见 elbow-249.md「修后级别」列。

## 已改 / 未改
- 已改配方：h-knee-hug、h-bilateral-upper-back-hug、h-overhead-triceps-stretch、h-crossbody；r6 腕扭转运行时开启的 12 个：forearms-A、h-band-leg-out、h-bilateral-upper-back-hug、h-db-curl、h-db-overhead-triceps-extension、h-db-zottman-curl、h-kneeling-thread-needle、h-quadruped-open、h-tabletop、o-seated-twist、t-seated-straddle-lift-1leg、w-prone-swimmer。
- 未改：自穿模清单其余约 60 个；两个 -native 悬挂/提握动作补测；「手相对前臂最大固定拧转」全量指标（修前清单已有，修后未全量重扫）；方案 C 余下动作。

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

---
# r2（2026-11-05 12:00–13:15，用户批准「剩下有问题的动作依次修」；中途改为只修肉眼可见、省额度）

口径同上（全链 self-collision-audit d10，腋下低可信不计；小臂 scan-fast + hand-fixed-twist）。修前 = d36e619。

## 交叉臂 h-crossbody（方案 C）
- `h-crossbody-r9-mv2`：rest（7.4–8 s、0–0.6 s）左手自然下垂在体侧，0.6–1.6 s 右臂横过时左手上来接住，保持段与 mv1 完全相同，5.6–6.8 s 松开放下；路线在腹前外绕 10 cm。配方开 r6 腕扭转运行时（连续，不折返）。
- 幅度 33° 不变。rest 帧：左手→胸 73→**0 mm**、左前臂→右上臂 42→**0**。保持段：左手→胸 16→16、左右前臂 13→12、左前臂→右上臂 13→12（不劣于 mv1）。接手瞬间（1.4 s）左手→右上臂 18 mm。
- 未解决：左手相对前臂在下垂（32°）和握持（132°）之间过渡约 1 s 内转 ~100°；试过把下垂掌心改朝后（第 2 次尝试）反而更差，已撤。握持段固定 132° 与 r9 同。请看图定。
- 图：`img/r2/cmp-h-crossbody.jpg`（左 mv1 / 右 mv2，上 t=0、下 t=4.0）

## 手-前臂固定拧转 >120°：常量前臂分摊（`<spec>-et1`，只加 elbowTwist，手位置/朝向不变）
每行：修后手相对前臂最小固定拧转（修前→修后）、±180 折返次数（修后）。29 个动作改到的一侧全部 ≤90°，0 折返；另一侧若仍 >90°（h-bridge-march 右 166、h-tabletop 右 166、hamstrings-B 右 133、quadriceps-A 右 167、w-feet-on-chair-bridge 右 125）是因为前臂+手总拧转接近 180°，常量分摊做不到 ≤90，留下。扭转只绕前臂长轴，手的位置不变，不新增穿模（未逐个全链复测）。成片视角对比 `img/r2/cmp-et.jpg`（上 h-good-morning、下 o-supported-march）：全身视角下看不出差别，只是小臂特写才会显出拧绞。
| 动作 | 手相对前臂固定拧转 | 折返 |
|---|---|---|
| erectors-A | 左 166→0°（et -180）；右 166→88°（et +90） | 0 |
| erectors-C | 左 170→6°（et +170）；右 167→13°（et -160） | 0 |
| forearms-B | 右 150→12°（et -180） | 0 |
| forearms-C | 右 149→68°（et +80） | 0 |
| g-cable-hip-abduction | 左 132→59°（et +65） | 0 |
| g-cable-hip-extension | 左 132→59°（et +65） | 0 |
| h-9090-liftoff | 左 126→53°（et +65） | 0 |
| h-band-hip-extension | 左 132→59°（et +65） | 0 |
| h-band-standing-abduction | 左 132→59°（et +65） | 0 |
| h-band-standing-adduction | 左 132→59°（et +65） | 0 |
| h-band-straight-leg-raise | 左 132→59°（et +65） | 0 |
| h-bridge-march | 左 134→0°（et +135） | 0 |
| h-good-morning | 左 153→32°（et -180）；右 172→14°（et +180） | 0 |
| h-tabletop | 左 166→5°（et -180） | 0 |
| hamstrings-B | 左 133→7°（et +125） | 0 |
| hip-abductors-B | 左 122→4°（et +125）；右 122→82°（et -40） | 0 |
| n-seated-knee-lift | 左 120→64°（et +50）；右 120→64°（et -50） | 0 |
| o-seated-sidebend | 右 130→50°（et +180） | 0 |
| o-supported-ankle-eversion | 左 130→57°（et +65） | 0 |
| o-supported-ankle-inversion | 左 130→57°（et +65） | 0 |
| o-supported-ankle-pump | 左 130→57°（et +65） | 0 |
| o-supported-hip-ir | 左 130→57°（et +65） | 0 |
| o-supported-knee-curl | 左 130→57°（et +65） | 0 |
| o-supported-march | 左 130→57°（et +65） | 0 |
| o-supported-star-reach | 左 124→56°（et +60） | 0 |
| quadriceps-A | 左 170→39°（et +135） | 0 |
| s-figure4 | 左 150→52°（et +95）；右 150→52°（et -95） | 0 |
| w-feet-on-chair-bridge | 左 125→0°（et +125） | 0 |
| t-flare-side-hold | 右 139→28°（et -100） | 0 |

## 自穿模 >2 cm
| 动作 | 改动 | 修前→修后（d10 mm） | 结论 |
|---|---|---|---|
| o-seated-fig4 坐姿四字前压 | `o-seated-fig4-sc1`：右手按实测穿透往外推（hand-push，7 轮，最大位移 118 mm） | 右手→右小腿 48.6→≤10、右手→右大腿 29.5→≤10 | **过**（手从陷进小腿变成搭在小腿上，位移较大；图 `img/r2/cmp-o-seated-fig4.jpg`）；右脚→左大腿 44.9、右脚→左小腿 33.6 是脚搭腿的接触，未改 |
| h-cobra / n-prone-ir / n-prone-hip-ext | 试 3 种右臂（肘向镜像 / 肘外展 / 手外移 6 cm+肘外展） | 右前臂→躯干 101→9（但右上臂压进体侧 900 顶点）/ 82 / 112 | **撤回**，三个动作共用同一手臂写法，需重写俯卧撑手（见待定） |
| h-bilateral-farmer-hold-native、h-straight-arm-hang-native | 补测（审核工具补了无轨道静态动作支持） | 全链 0 / 0 | 不需修 |

## 未做 / 待用户定
- 俯卧三件套（h-cobra、n-prone-ir、n-prone-hip-ext）右前臂→躯干 ~10 cm（只在 rest/低位，左侧正常）：两三次参数尝试都是换一处穿模，需要重写右手撑地姿态。
- 腿部深穿模（生成式/接触型，未动）：t-vsit 大腿→躯干 79（rest）、t-lsit-tuck 61（rest，两个都是 Thomas 校准生成）、s-figure4 右脚→左大腿 69、adductors-A 两大腿互穿 56（深蹲侧）。
- 小臂严重项（动态拧转，常量分摊无效，需重做手朝向轨迹）：h-db-zottman-curl（本就旋前旋后）、h-db-overhead-triceps-extension 右、rotator-cuff-A、o-seated-twist 右、obliques-C 左、h-db-curl。与 ground-contact 重叠的 forearms-A、h-kneeling-thread-needle、h-quadruped-open、t-seated-straddle-lift-1leg 未动。
- 按用户要求跳过：固定拧转 90–120° 的 18 个；与 ground-contact 重叠的固定拧转动作（adductors-B、deltoids-B、glute-max-A、h-short-side-plank、h-supine-bilateral-leg-raise、h-supine-heel-slide、hip-abductors-A、o-supported-hip-hitch、s-pigeon、scapular-A）；h-biceps-self（扫描工具不支持其动作校正，无法复测，已撤）；1–2 cm 穿模。
