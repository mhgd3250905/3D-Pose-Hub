# 旧动作修复 r1 · 第 5 批分诊（FINDINGS-LIVE「P2 明显不准」全部条目）

2026-11-21，Hark-QUA，分支 `codex/legacy-fix-r1`（基于 42132faf）。只分诊，不改姿势。

## 方法
- 范围：`tools/legacy-audit-r1/FINDINGS-LIVE.md` P2 段 137 条 = 68 个动作（REPORT 写「64 个」是旧计数；其中 15 个 needs-check）。
- 重新实测：每个动作用 `tools/legacy-fix-r1/audit-cf2.mjs --crotchfix r2`（stride 10，现行 recipe = 各自 standards 里的 recipe）+ `analyze.py`，
  问题帧出正/侧/顶/裆部特写/成片机位 300 px 图逐个看（沙箱 `/workspace/work/legacy-fix/b5/sheets/<id>.jpg`，原始 dump `/workspace/work/legacy-fix/b5/audit/<id>/`）。
  开 r2 后 P2 动作的裆部鼓包已全部 < 阈值，本表不再列。
- 数值辅助（沙箱脚本，未进分支）：`heel.py`（逐帧左右脚跟 + 前后脚）、`fm.py`（逐帧 frame_metrics）、`motion.py`（各骨骼相对骨盆位移 + 自身转角）、`wrist.py`（腕背伸/尺桡偏，见文末）。
- 已在前几批修好（P2 条目来自修前 recipe，lfx1 修后数值已在 CHANGES.md）：s-9090、n-squat-shift、deltoids-B、adductors-A —— 本表标「已修」，不再计入。

## 分诊表（id｜条目｜真/误报｜理由｜严重度）

严重度：高 = 文不对题/一眼看出；中 = 负重/接触明显不对；低 = 幅度小或仅专业用户能看出。误报严重度记「—」。

| id | 条目 | 判定 | 一句理由 | 严重度 |
|---|---|---|---|---|
| h-db-overhead-shrug | text-reps-static 0.0 cm | **真** | V5 全身所有骨骼 8 s 内位移 0 mm、转角 0°：过头耸肩在 V5 上完全不动（hub 的肩带上提没传到 V5） | 高 |
| h-db-shrug | text-reps-static 0.0 cm | **真** | 同上：V5 双肩/肩胛/手位移 0 mm（只有前臂/上臂原地转 13–19°），耸肩看不出来 | 高 |
| obliques-A | rom-footVsKnee -89°（左右） | **真** | 熊爬穿腿时撑地腿屈膝 60°、膝随髋转了约 90°，撑地脚不跟着转，脚尖与膝朝向差 89°（踝被拧） | 中 |
| h-sumo-pry | knee-valgus 20° / knee-inside-foot 21 cm（起始 0–30 帧）/ shinFace -48° / kneeAxisDev 47° | **真** | 站姿负重相扑蹲：下蹲段（f40–60/160–180）膝比脚尖内偏 20°，起蹲帧膝落在外八脚的内侧；到底膝基本在脚上方 | 中 |
| h-lateral-step-lunge | knee-inside-foot 7 cm | **真** | 侧弓步负重屈膝腿膝在脚内侧 7 cm（f70–90、f220–240），正面看小腿内斜 | 中 |
| serratus-A | floor-penetration 手 28 mm | **真** | 俯撑肩胛前伸时双手不固定：f30–50 手掌压进垫子 22–28 mm，f60–80 又抬离 18–31 mm（手随肩胛上下漂） | 中 |
| h-side-leg-raise | com-outside-support 6 cm | **真** | 抬腿段（f30–90）单脚支撑，骨盆没移到支撑脚上方，重心在支撑脚外 4.5–5.6 cm，静力站不住 | 低 |
| hamstrings-A | com-outside-support 5 cm | **真** | 单腿罗马尼亚硬拉全程单脚（后脚离地 44–424 mm），重心在支撑脚外 3.3–4.5 cm | 低 |
| h-kneeling-instep-stretch | knee-out-of-toe 180° | 误报 | 跪姿小腿贴地、脚尖朝后，膝屈曲方向与脚尖天然差 180°（同 h-floor-nordic） | — |
| n-half-split | knee-out-of-toe 180° | 误报 | 同上，后腿跪地 | — |
| s-kneel-hipflex | knee-out-of-toe 180° / knee-inside-foot 4 cm | 误报 | 后腿跪地同上；前腿 4 cm 恰在阈值，正面看膝在脚正上方，半跪前腿负重很小 | — |
| h-chair-progressive-front-split-native | knee-out-of-toe 179° | 误报 | 后腿跪地，同上 | — |
| s-lizard | knee-out-of-toe 175° / rom-thighFace -69° / kneeAxisDev 58°（NC） | 误报 | 后腿跪地同上；前腿蜥蜴式髋外旋膝外倒，图上膝、小腿外形自然 | — |
| h-reverse-lunge | squat-heel-up 157 mm | 误报 | 逐帧：前脚脚跟始终 0 mm，离地的是后脚（弓步后脚本应前脚掌着地）；规则把两条屈膝腿都算了 | — |
| h-db-split-squat | squat-heel-up 111 mm | 误报 | 同上，前脚 0 mm，后脚前脚掌着地 | — |
| h-forward-lunge | squat-heel-up 67 mm | 误报 | 同上，前脚 0 mm | — |
| h-inner-thigh | rom-thighFace -97° / kneeAxisDev 68°（NC） | 误报 | 侧卧上侧腿屈膝跨到前面脚踩地，膝朝上，外形自然 | — |
| h-russian-twist | rom-thighFace -81° / kneeAxisDev 61°（NC） | 误报 | 坐姿双膝外展，正/顶视膝小腿自然 | — |
| n-seated-ir-drop | rom-thighFace 75° / kneeAxisDev 51°（NC） | 误报 | 单膝内倒就是动作内容，膝小腿外形自然 | — |
| s-butterfly | rom-thighFace -70°（NC） | 误报（膝） | 蝴蝶坐大腿外展外旋，膝小腿自然；**手腕另立 b5a 修**（见下） | — |
| h-butterfly-active | thighFace/shinFace -67° / kneeAxisDev 68°（NC） | 误报 | 仰卧蝴蝶开合，膝小腿外形自然 | — |
| h-9090-liftoff | thighFace -65° / shinFace -65° / kneeAxisDev 46°（NC） | 误报 | 90/90 坐姿，膝小腿外形自然 | — |
| h-band-leg-out | thighFace/shinFace/footVsKnee -60° / kneeAxisDev 64°（NC） | 误报 | 腿近伸直（屈膝角小）时屈膝平面不稳，图上腿直、脚尖朝上 | — |
| n-windshield | thighFace -54° / shinFace -63° / kneeAxisDev 60°（NC） | 误报 | 仰卧双膝倒向一侧，外形自然 | — |
| h-hip-gate | thighFace/shinFace -61° / kneeAxisDev 63°（NC）/ footVsKnee -61° | 误报 | 抬起的那条腿（不负重）髋外展外旋开门，三项角度相同 = 整条小腿与髌骨一致、只是髋转动记到膝上；图上小腿竖直、外形自然 | — |
| n-straddle-fold | thighFace/shinFace -57° / kneeAxisDev 61°（NC） | 误报 | 两腿伸直分开，屈膝角小规则不稳；脚尖朝上 | — |
| h-quad-cars | thighFace -52° / shinFace -59° / kneeAxisDev 56°（NC） | 误报 | 四足画圈，抬起腿外形自然 | — |
| h-wall-straddle | thighFace -55° / shinFace -53° / kneeAxisDev 58°（NC） | 误报 | 靠墙腿近伸直，同 n-straddle-fold | — |
| s-pigeon | thighFace -50° / shinFace -57° / kneeAxisDev 58°（NC） | 误报 | 鸽子式前腿外旋，外形自然 | — |
| h-seated-reachback | thighFace -50° | 误报 | 坐姿后撑屈膝，外形自然（同 NC 型） | — |
| s-figure4 | thighFace -48° / shinFace 45° | 误报 | 仰卧 4 字，压线 3°，外形自然 | — |
| s-frog | shinFace -48° / kneeAxisDev 43° | 误报 | 青蛙式大外展，压线，外形自然 | — |
| w-fire-hydrant | shinFace -46° / kneeAxisDev 43° | 误报 | 四足侧抬腿，压线，外形自然 | — |
| h-chair-dip | knee-out-of-toe 37° | 误报 | 小腿近竖直时屈膝方向的水平投影不稳（f60–70 骨盆 <0.35 本已排除）；正/顶视膝对脚尖 | — |
| abs-B | asymmetry 57 cm | 误报 | 文案 cue3「一条腿往前伸直，两条腿轮流」，单腿伸出本就不对称 | — |
| h-db-supported-calf-raise | asymmetry 55 cm | 误报 | 文案「一手扶墙一手拿哑铃」，上身天然不对称（同 o-supported-march 型） | — |
| h-doorframe-forearms-pec-native-r3 | asymmetry 24 cm | 误报 | 文案「前后脚站稳」分腿站，下肢天然不对称 | — |
| h-bilateral-upper-back-hug | asymmetry 21 cm | 误报 | 双臂交叉环抱，一臂在上一臂在下，天然不对称 | — |
| forearms-C | text-hold-moving 33 cm | 误报 | 倒握壶铃行走，文案「慢慢走」，走动就是动作内容（hold 指握持） | — |
| h-supine-cactus-chest | floor-penetration ×8（16–19 mm）/ text-reps-static 0.0 cm | 误报 | 除头外全身一致低 16–19 mm = 地面取了头下垫块顶面；动作其实在动（双手相对骨盆移动 248 mm，仰卧时规则取骨盆朝向退化成 0） | — |
| o-seated-ham | knee-valgus 26° | 误报 | 坐椅、腿不负重（同已判 knee-inside-foot） | — |
| o-seated-catcow | knee-valgus 15° / knee-inside-foot 6 cm | 误报 | 坐椅、腿不负重 | — |
| o-seated-calf-raise | knee-inside-foot 6 cm | 误报 | 坐椅，膝的负重来自自身腿重，非站姿负重 | — |
| o-seated-fig4 | knee-inside-foot 5 cm | 误报 | 坐椅、腿不负重 | — |
| forearms-B | knee-inside-foot 6 cm / text-reps-static 0.0 cm | 误报 | 坐姿；腕屈伸手转 100°（规则只看关节位置，不看转动） | — |
| h-couch-stretch | knee-valgus 17° / knee-inside-foot 6 cm | 误报 | 半跪前腿负重小，正面膝在脚正上方，压线 | — |
| h-half-kneeling-quad-stretch | knee-inside-foot 5 cm | 误报 | 同上 | — |
| deltoids-C | knee-inside-foot 4 cm | 误报 | 半跪前腿，恰在阈值，膝在脚上方 | — |
| o-stand-crossreach | knee-inside-foot 4 cm | 误报 | 扶椅交叉腿站（两腿交叉是动作内容），恰在阈值 | — |
| adductors-C | foot-hover 24 mm | 误报 | 悬空的是做内收的工作腿（左脚 21–103 mm 摆动），支撑右脚 0 mm | — |
| h-wall-palm-lift | text-reps-static 3.3 cm | 误报 | 掌根抬起本身幅度小（手 33 mm、腕 20°） | — |
| h-pike-scapular-elevation | text-reps-static 3.0 cm | 误报 | 派克位肩带提压，头 30 mm、骨盆 16 mm，幅度本就小 | — |
| h-db-calf-raise | text-reps-static 1.9 cm | 误报 | 提踵整个人抬高 86 mm（规则只看相对骨盆位移） | — |
| scapular-B | text-reps-static 1.5 cm | 误报 | 肩胛引体整个人上升 66 mm，同上 | — |
| lats-C | text-reps-static 0.3 cm | 误报 | 双杠肩下压整个人上升 75 mm，同上 | — |
| n-seated-squeeze | text-reps-static 1.2 cm | 误报 | 等长夹砖，膝内夹 12 mm 是正常幅度 | — |
| h-bent-knee-calf-raise | text-reps-static 0.5 cm | 误报 | 整个人升 30 mm、脚转 8°（脚跟离地 24 mm，偏浅，可选加大） | — |
| h-tib-raise | text-reps-static 0.3 cm | 误报 | 勾脚尖：脚转 28°，规则不看转动 | — |
| h-standing-forearm-rotation | text-reps-static 0.0 cm | 误报 | 前臂旋前旋后 120°，规则不看转动 | — |
| h-standing-wrist-deviation | text-reps-static 0.0 cm | 误报 | 腕尺桡偏 ±12°，规则不看转动 | — |
| h-standing-wrist-extensor-stretch | text-reps-static 0.0 cm | 误报 | 手转 40°，同上 | — |
| o-supported-ankle-eversion | text-reps-static 0.0 cm | 误报 | 脚转 20°，同上 | — |
| o-supported-ankle-inversion | text-reps-static 0.0 cm | 误报 | 脚转 12°（幅度偏小，可选加大），同上 | — |
| o-supported-ankle-pump | text-reps-static 0.0 cm | 误报 | 踝屈伸 30°，同上 | — |
| s-9090 / n-squat-shift / deltoids-B / adductors-A | 各 P2 条 | 已修 | 第 1/3 批 lfx1 已修，修后数值见 CHANGES.md | — |

合计 68 个动作：**真 8**（高 2、中 4、低 2）、**误报 56**、已修 4。

## 真问题分批建议（每批同型放一起）

| 批 | 动作 | 同型 | 修法思路 |
|---|---|---|---|
| b5-1（高，文不对题） | h-db-shrug、h-db-overhead-shrug | 耸肩在 V5 上不动 | 先查 hub 的肩带上提（shrug/solveShoulders）为何没进 V5：V5 有现成的 `v5.scapulaShift` 开关（肩胛随 hub 刚性平移，Thomas r2 用过），新 spec 打开它或把上提量映射到 V5 肩胛；验收 = 双肩/手上移 ≥3–4 cm、头颈不动 |
| b5-2（中，站姿负重膝对脚） | h-sumo-pry、h-lateral-step-lunge | 同 h-squat lfx1 | 负重腿膝 pole 改成沿脚尖方向的世界远点（h-squat/n-squat-shift 已验证），必要时脚尖外八跟膝同向；验收 knee-valgus ≤15°、膝在脚内侧 ≤4 cm |
| b5-3（中，接触锚定） | serratus-A、obliques-A | 撑地点不固定 / 不随转 | serratus-A：双手改成固定在垫面（palmAt 世界固定 + 贴地 touch），肩胛前伸后缩只由躯干/肩带做，手高度变化 ≤8 mm；obliques-A：穿腿时撑地脚以前脚掌为轴随膝转 60–80°（脚跟抬起），footVsKnee ≤60° |
| b5-4（低，单腿重心） | h-side-leg-raise、hamstrings-A | 单脚支撑重心偏出 | 单腿段骨盆向支撑脚横移 4–6 cm（或躯干微侧倾），支撑脚不动；验收重心在支撑脚接触面内 |

规则改进（建议 hark-sk 改 analyze.py，不在本批）：squat-heel-up 只判前脚/重心侧那只脚；text-reps-static 改用世界坐标并计入骨骼转角（腕/踝/前臂类）；
仰卧/俯卧时 mirror_pose 的骨盆朝向退化（cactus 0.0 cm）；asymmetry 跳过文案写明单侧支撑/分腿/交替的动作；ROM 三项在屈膝 <30° 或「thighFace≈shinFace≈footVsKnee」时降级。
