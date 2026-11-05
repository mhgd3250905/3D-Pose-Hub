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

## r3 补：o-seated-fig4 翘腿脚方向（2026-11-05 13:20，用户：「翘二郎腿那只脚的脚方向不对」）
- `o-seated-fig4-sc1-ft1`：原 `feet.right.rot [[Y,80],[Z,-10]]` 让鞋底朝下、脚尖顺着小腿指向身体左侧（相对小腿 ≈ 跖屈 90° + 内翻 90°）。改为按解算后的真实小腿（膝→踝）定踝近中立：脚尖朝前、略上翘略朝外，脚底朝外侧（+X），外踝搭在左大腿上（小腿轴转 15°、放松跖屈 20°、外翻 8°；外翻 20° 时脚跟顶进左手 19 mm，撤）。只改右脚旋转，踝位置/手臂/躯干/左腿不变。全链 d10：右脚→左大腿 44→**≤9.8 mm**、右脚→左小腿 34→**0**、右手→腿 ≤2.6（保持）、左手→右脚 12.6→10.5（n21<30）。图 `img/r2/cmp-o-seated-fig4-foot.jpg`（上修前/下修后，正面+左侧）。

---
# r4（2026-11-05 15:05–16:35，用户授权自行决定修法；省额度、只做高价值）

口径同上：全链 `self-collision-audit.mjs` d10 ≤ 10 mm 才算过；<30 个顶点超 10 mm 不计；腋下（上臂↔躯干）低可信不计。
修前数字来自 `docs/reviews/self-collision-r1/self-collision-list.csv`（快扫）或本轮全链复测，修后全是全链。修前 = 0bce78a。
第 1 批已交渲染的 36 个没动。

## 修好（全链 d10 ≤ 10 mm，不新增穿地）
| 动作 | 改动 | 修前→修后（d10 mm） |
|---|---|---|
| s-figure4 仰卧4字 | `s-figure4-r2-et1-sc1`：右踝目标按解算后的真实左大腿（髋→膝）沿大腿前表面法向抬离 ~8 cm（两次实测），脚朝向/手臂(et1)/左腿不变 | 右脚→左大腿 69→0、左大腿→右脚 16→0、右小腿→左大腿 14→0；地面：左脚踩地 0（同前）、躯干 3.2 |
| t-vsit V撑 | `t-vsit-r7-sc1`（新 `drill-anim/lib/leg-swing-sc1.mjs`）：双腿（踝、膝极点、脚朝向一起）绕实际髋关节在髋坐标系下摆 32°；原标定姿势髋角只有 ~40°（大腿离竖直 24°、躯干后仰 15°） | 双大腿→腹 79/79→0、腹→大腿 71/70→2.4（0 顶点超 10 mm）；地面：脚在空中、手撑 0（同前）。第 1 次 25° 剩 19 mm |
| s-kneel-hipflex 跪姿屈髋 | `-sc1`：叉腰手 touch 间隙 +41/+39 mm（拇指/四指包进腰胯） | 左手→躯干 36→≤8、右手→躯干 34→0、右手→右大腿 16→0 |
| h-couch-stretch 沙发拉伸 | `-sc1`：同上，+41/+36 mm | 左手→躯干 36→0、右手→躯干 31→≤9、右手→右大腿 27→0 |
| h-hip-gate 髋关节开门 | `h-hip-gate-r2-sc1`：右手 touch 间隙 +37 mm | 右手→右大腿 32→0、右手→躯干 22→0 |
| s-9090 90/90 坐姿 | `s-9090-r4-sc1`：左手（搭前腿大腿）touch 间隙 +37 mm | 左拇指→左大腿 32→0（右手→右大腿 9，0 顶点超 10 mm） |
| deltoids-C | `deltoids-C-sc1`：左手（搭大腿）touch 间隙 +36 mm | 左手→左大腿 31→≤3 |
| h-side-er 侧卧外旋 | `h-side-er-sc1`：右手目标按实测穿透往外推（hand-push push 模式，3 轮，最大位移 83 mm，只在 rest 附近） | 右前臂→躯干 35→≤6.1；两只鞋叠放 12.3 mm（60 顶点）是修前就有的侧卧叠脚接触，未变 |

**请用户看图**：t-vsit 腿放低后从「腿几乎竖直」变成「腿约 35° 的浅 V」（`img/r4/cmp-t-vsit.jpg`），穿模没了但造型变化较大；要更陡的 V 需要同时让躯干后仰、重标手撑点，这轮没做。s-figure4 鞋从陷进大腿变成搭在大腿上（`img/r4/cmp-s-figure4.jpg`）。叉腰类（s-kneel-hipflex 等）手整体往外 3.6–4.1 cm，拇指不再包进腰里（`img/r4/cmp-s-kneel-hipflex.jpg`）。

## 撤回 / 需用户看图定
- t-lsit-tuck 团身 L 撑（两次都撤）：①双腿下摆 20°：大腿→腹 61→0，但伸腿段脚进地 16 cm、团身段 5.6 cm；②只在团身帧下摆 8°+分腿 12°：地面没问题（脚最低 8 mm），大腿→腹 61→35（63 顶点）。要过需要团身时躯干后仰（重标手撑），留待定。
- h-bulgarian 保加利亚分腿蹲（撤）：叉腰手 touch 间隙 +43/+46 mm 后右手→躯干 41→27（拇指在峰值帧包进腰侧）；再加间隙手会明显悬空，需要改叉腰手型（拇指朝后），未做。
- w-chair-hip-thrust 椅上臀推（撤）：+35/+39 mm → 右手→躯干 34→13（58 顶点）；第 2 次右手再 +18 mm 数字不变（touch 已到上限），未解决。

## 判为量测假象，不改
- **h-cobra / n-prone-ir / n-prone-hip-ext「右前臂→躯干 ~10 cm」**：全链加调试复测，三个动作每一帧的前 10 个最深点都只对应同一个躯干顶点（`V3_Head_Neck_Torso_Shared_R26` 上一个 `rightScapula` 权重顶点，约 (-0.09, 0.12, 0.178)），它的重建法线朝内（-Z），离前臂 8–12 cm 却把前臂判成「在躯干里」。关节左右完全镜像（肘 ±0.296、腕 ±0.25），特写图左右臂一致、前臂下面没有躯干（`img/r4/cobra-LR.jpg`）。结论：不是姿势问题，手撑地写法不用重写；建议审核工具加一条「前 10 点至少对应 3 个不同容器顶点」再算深度（本轮未改工具，以免全表数字变化）。

## 判为躯干网格自身折叠（蒙皮，不是姿势），不改
- triceps-B「大腿↔躯干 46 mm」：两侧都是同一个躯干网格上 thigh 权重顶点和 spineLower 权重顶点互判（腹股沟褶皱，116–135 顶点），改姿势只能改变动作本意。s-seated-fold（40）、n-half-split（33）、h-chair-lat（27）同类（大腿↔躯干、<140 顶点），未单独复测。

## 未做（时间到 / 价值低）
- adductors-A 哥萨克蹲 两大腿互穿 56（深蹲侧，最深点在躯干网格的两侧 thigh 权重顶点之间，疑似裆部蒙皮折叠，需看图再定）。
- t-seated-straddle-lifts 前臂→大腿 51 / →躯干 41（标定手撑点在两腿之间，改手位会破坏标定支撑高度）、h-kb-swing 前臂→大腿 39（摆铃最低点两臂夹在两腿间）、deltoids-A 两大腿 43 + 手→大腿 27。
- 列表其余 20–30 mm：o-seated-twist（已开 r6，左手→左大腿 33）、h-half-kneeling-quad-stretch 28、n-pelvis-circle 28、n-seated-squeeze 27、t-straddle-hold 27、n-chair-wiper 26、h-lateral-step-lunge 26、hip-abductors-A 25（与 ground-contact 重叠，跳过）、s-butterfly 23、h-chair-step-up 23、h-squat 23、o-stand-crossreach 23、n-straddle-fold 20、o-seated-ham 20、h-band-hip-ir 20。多数是「手搭腿/叉腰」，可用本轮 touch 间隙或 hand-push 做法。
- 按要求跳过：h-goblet-squat（快扫假象）、h-biceps-self（扫描不支持）、与 fix/ground-contact-r1 重叠的 4 个。

## 图（上 = 修前，下 = 修后）
1. `img/r4/cmp-s-figure4.jpg`：t=2 s 成片视角 / 右脚特写
2. `img/r4/cmp-t-vsit.jpg`：t=0 成片视角 / 侧面特写
3. `img/r4/cmp-s-kneel-hipflex.jpg`：t=2 s 成片视角 / 左髋特写
4. `img/r4/cobra-LR.jpg`：h-cobra t=0 修前右臂（左，红圈 = 审核报的最深点）/ 左臂（右）特写，左右一致

---
# r5（2026-11-05 16:20–17:35，用户授权自行决定修法；省额度、只做把握大的，做不动的记一行跳过）

口径同 r4：d10 ≤ 10 mm 才算过；<30 个顶点超 10 mm 不计；腋下不计。修前 = ad39711（快扫 csv / hand-push 第 1 轮实测）。
touch 类修后 = 全链 `self-collision-audit`（dbg 版）；hand-push 类修后 = hand-push final pass（同一测量、生产场景、每 0.5 s 一帧）。第 1、2 批已交渲染的 44 个没动。

## 修好（10 个）
| 动作 | 改动 | 修前→修后（d10 mm） |
|---|---|---|
| h-band-hip-ir 坐姿弹力带脚向外摆 | `-sc1` 手搭大腿 touch 间隙 +25/+21 mm | 左手→左大腿 20.2→0、右手→右大腿 16.2→0 |
| n-chair-wiper 坐椅雨刷 | `-sc1` touch +18/+31 mm | 右手→右大腿 25.7→0、左 13.1→0 |
| n-pelvis-circle 站姿骨盆画圈 | `-r2-sc1` 叉腰 touch +33/+31 mm | 左手→大腿 28.1→0、右 26.3→0、左手→躯干 24.6→0 |
| n-seated-squeeze 坐姿夹砖 | `-r2-sc1` touch +32/+32 mm | 双手→大腿 27.0/27.2→0 |
| w-chair-hip-thrust 椅子臀推 | `-sc1` 叉腰手型改：四指更朝下（finger y −0.35→−0.6）、掌心外移 15 mm、touch +35 mm | 右手→躯干 34.3→5.1、右手→右大腿 31→0、左手→躯干 30.2→4.6（**手型变了，请看图**）。另一候选（四指 −0.8、+30 mm）10.4 未用 |
| h-lateral-step-lunge 侧跨步弓步蹲 | hand-push 手搭大腿，最大位移 31/31 mm | 左/右手→大腿 25.3/25.5→0（**特写里手离大腿外侧约 2–3 cm，像悬空，请看图**） |
| h-squat 徒手深蹲 | hand-push，29/28 mm | 左/右手→大腿 22.9/22.5→0 |
| h-chair-step-up 椅子上步 | hand-push 扶腰，28/29 mm | 左/右手→躯干 22.3/23.0→0；剩大腿↔躯干 19.4（35 顶点，抬腿帧腹股沟，修前就有，同 triceps-B 类蒙皮折叠） |
| o-seated-ham 坐姿大腿后侧拉伸 | hand-push，左 26 mm | 左手→左大腿 20.3→0 |
| o-seated-twist 坐姿扶椅扭转 | hand-push，39/39 mm（保留 r6） | 双手→大腿 33.3/33.3→0 |
地面：hand-push final 全身最低点 ≥0（脚 0，同修前）；touch 类只动手离大腿/腰的距离，不涉及地面。

## 撤回 / 跳过（各一行）
- h-bulgarian（撤，2 次）：手型 A（四指 −0.8、+30 mm）右手→躯干 41→17.4、左手→大腿 21.9；手型 B（−0.6、外移 15 mm、+35 mm）右手→躯干 21。都没到 10，留待定。
- h-half-kneeling-quad-stretch（跳过）：新 spec 过不了 `remote-keyframes-r1` 的 required action corrective 校验（corrective 绑定原 spec），要改 corrective 表，本轮不做。
- adductors-A（跳过，蒙皮折叠）：全链复测 56.1 mm，两侧最深点都在 `V3_Head_Neck_Torso_Shared_R26` 同一网格的 left/rightThigh 权重顶点互判（深蹲侧裆部），同 triceps-B 类。
- deltoids-A / h-kb-swing / n-straddle-fold（跳过）：主问题是两腿互穿或摆铃最低点前臂夹在两腿间，只推手解决不了，把握小。
- t-seated-straddle-lifts / t-straddle-hold（跳过）：floor 支撑手标定点在两腿之间，挪手会破坏支撑高度。
- s-butterfly 脚底互压（23）是动作本意；o-stand-crossreach 两大腿 22.8（97 顶点）为交叉腿，未做。
- 手朝向 6 个：按用户要求本轮不做。

## 图（上 = 修前，下 = 修后）
1. `img/r5/cmp-w-chair-hip-thrust.jpg`：成片视角 / 右手特写（手型变化）
2. `img/r5/cmp-h-lateral-step-lunge.jpg`：成片视角 / 左手特写
（n-seated-squeeze 对比图渲染超时未出，只有上面 2 张。）

---
# r6（2026-11-05 17:25–18:25，最后一轮：手朝向轨迹；省额度、只做把握大的）

问题：这几个动作的前臂在解算里会绕自身长轴自转（屈肘/过头时 -100…+350°），手按胸坐标给的朝向不变，于是手相对前臂反向拧 180–250°；固定前臂转角（et1）抵消不了随时间变化的自转。
做法：新 spec `<spec>-ht1` 只加一条**随时间变化的前臂转角**（`elbowTwist` 轨道，度；按 armfix-r2 实测逐帧表，15 Hz 线性插值，生成脚本 `tools/pose-fix-r1/hand-twist-table.py`；h-db-curl 按各臂弯举相位 q 手写表）。手位置/朝向、握法、哑铃、肘极点、节奏、镜头都不变，r6 腕扭转运行时照旧。
分配：curl / triceps / obliques 为「前臂自转 ≈ 手相对前臂 ≈ 总转动的一半」；zottman 按真实尺桡：旋前/旋后全部放到前臂，手相对前臂恒定 -11°（左右镜像，= 中立握持时的值）。
数字：scan-fast（15 Hz，h-db-curl 6 Hz），θ = 手相对前臂拧转最大值（展开后），eff = 前臂（含 r6）相对绑定姿势最大自转，step = θ 单帧最大跳变。修前 = 21bf0e1。
只改前臂绕自身长轴的转角，手和道具的位置不变；未全链复测穿模/穿地（同 r2 et1 口径）。

## 修好（4 个）
| 动作 | spec | θ 修前→修后 | eff 修前→修后 | step |
|---|---|---|---|---|
| h-db-curl 哑铃交替弯举 | `h-db-curl-r2-ht1` | 左/右 197→**38** | 105→57 | 93→22 |
| h-db-zottman-curl 佐特曼弯举 | `h-db-zottman-curl-r5-ht1` | 左/右 181→**12** | 108→113（旋前/旋后由前臂承担，本意保留） | 16→0 |
| h-db-overhead-triceps-extension 右 | `-r5-ht1` | 右 249→**79**（左 17 不变） | 177→119 | 16→11 |
| obliques-C | `obliques-C-r2-ht1` | 左 126→**70**、右 115→**37** | 175→107 / 105→55 | 11→6 |
图：`img/r6/cmp-h-db-curl.jpg`（t=2 s 右小臂特写，左修前 / 右修后）。

## 撤回（试 1 次）
- rotator-cuff-A：左 256→14 过，右 255→**104** 没到 90（右侧解算在 0.2 s 内翻转约 200°，15 Hz 表跟不住），整动作撤回，配方不变。
- o-seated-twist 已在第 3 批，按要求未动。

---
# 全轮总表（r1–r6，分支 fix/limb-twist-collision-r1）

## 已修（58 个：第 1–3 批已交渲染 54 个 + r6 第 4 批 4 个）
- 第 1 批（36）：erectors-A erectors-C forearms-B forearms-C g-cable-hip-abduction g-cable-hip-extension h-9090-liftoff h-band-hip-extension h-band-leg-out h-band-standing-abduction h-band-standing-adduction h-band-straight-leg-raise h-bilateral-upper-back-hug h-bridge-march h-crossbody h-good-morning h-knee-hug h-overhead-triceps-stretch h-tabletop hamstrings-B hip-abductors-B n-seated-knee-lift n-thomas-test o-seated-fig4 o-seated-sidebend o-supported-ankle-eversion o-supported-ankle-inversion o-supported-ankle-pump o-supported-hip-ir o-supported-knee-curl o-supported-march o-supported-star-reach quadriceps-A t-flare-side-hold w-feet-on-chair-bridge w-prone-swimmer
- 第 2 批（8）：deltoids-C h-couch-stretch h-hip-gate h-side-er s-9090 s-figure4 s-kneel-hipflex t-vsit
- 第 3 批（10）：h-band-hip-ir h-chair-step-up h-lateral-step-lunge h-squat n-chair-wiper n-pelvis-circle n-seated-squeeze o-seated-ham o-seated-twist w-chair-hip-thrust
- 第 4 批（4）：h-db-curl h-db-zottman-curl h-db-overhead-triceps-extension obliques-C
- 备注：h-crossbody 握持过渡约 1 s 内仍转 ~100°（r2）；h-bridge-march / h-tabletop / hamstrings-B / quadriceps-A / w-feet-on-chair-bridge 另一侧固定拧转仍 >90°（常量分摊上限）；t-vsit、w-chair-hip-thrust、h-lateral-step-lunge 造型/手型有变化，待用户看图。

## 判为量测假象 / 蒙皮折叠 / 动作本意，不修（13 个）
- 量测假象：h-cobra n-prone-ir n-prone-hip-ext h-goblet-squat
- 复测本就无问题：h-bilateral-farmer-hold-native h-straight-arm-hang-native
- 躯干网格蒙皮折叠：triceps-B s-seated-fold n-half-split h-chair-lat adductors-A
- 动作本意（接触）：s-butterfly（脚底互压）、o-stand-crossreach（交叉腿）

## 撤回 / 跳过，仍有问题（24 个）
- 试过撤回：t-lsit-tuck h-bulgarian rotator-cuff-A
- 跳过（工具/校验限制）：h-half-kneeling-quad-stretch（corrective 校验）h-biceps-self（扫描不支持）
- 跳过（把握小/会破坏标定）：deltoids-A h-kb-swing n-straddle-fold t-seated-straddle-lifts t-straddle-hold
- 与 fix/ground-contact-r1 重叠未动：forearms-A h-kneeling-thread-needle h-quadruped-open t-seated-straddle-lift-1leg hip-abductors-A adductors-B deltoids-B glute-max-A h-short-side-plank h-supine-bilateral-leg-raise h-supine-heel-slide o-supported-hip-hitch s-pigeon scapular-A
- 另：固定拧转 90–120° 的 18 个和 1–2 cm 穿模按用户要求未做（未逐个列 id）。
