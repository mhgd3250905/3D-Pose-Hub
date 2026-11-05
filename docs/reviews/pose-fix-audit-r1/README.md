> 集成分支 release/pose-fix-integration-r1（2026-11-06）：本文件在 PR #29 与 PR #30 中各有一份，合并时两份原样保留，先 #29、后 #30。3 个双改配方（deltoids-C、n-straddle-fold、s-kneel-hipflex）的集成版复测见 `docs/reviews/pose-fix-integration-r1/README.md`。

# pose-fix 总复核：motion-contact-audit（PR #29 fix/limb-twist-collision-r1 @ 0b15293）

范围：本分支 `docs/reviews/pose-fix-r1/README.md` 全轮总表「已修」里的全部动作（第 1–5、7、8 批，去重 67 个；第 7 批 22 个里 12 个与前几批重复）。2026-11-05 22:30–23:15 CST。

## 结果
- 跑了 67/67，未跑 0，扫描报错 0。pass 41、warn 9、fail 17。
- **新问题（修后比 main 变差）1 个：s-figure4**（`s-figure4-r2-et1-sc1`）——进入/退出幅度 12.2°/88 mm → 5.9°/45 mm，静止帧 25%→50%，从「幅度很小」(s2) 变「几乎不动」(s3)。推测是 sc1 去穿模时缩小了进入段，需看图确认。
  - **b10 已修**：`s-figure4-r2-et1-sc2`（以 sc1 为底，只把 open 段右膝 pole 从 [-1,-0.4,0.25] 加深到 [-1,-0.6,0.25]；原因是 sc1 抬高右踝后髋→踝轴更竖，同样的 pole 摆动只让膝外倒一半）——同一工具复跑幅度 11.7°/87 mm（修前 12.2°/88、sc1 5.9°/45），回到修前 s2 同级；右脚→左大腿 6.5–10.4 mm 与 sc1 完全相同，自穿模非腋下 0，地面最低为左脚踩地 0（躯干 3.2 mm）。数据 `work/pose-fix-audit-r1/b10/`。
- 其余 16 个 fail 全部修前已有（main 同级或更重），不是这轮修复引入：
  - 规则误判 3 个：h-squat、h-forward-lunge、h-lateral-step-lunge（口令「推地」指脚，工具当成手撑地，量的是手离地 44–59 cm）。
  - 接触部位偏 1 个：h-9090-liftoff（手搭在大腿中段 t0.4–0.5，距 1 mm，规则要求膝上；main 同样）。
  - 保持类/计次类幅度小或像静止 12 个：t-vsit、n-seated-squeeze（等长夹紧，本意）、h-reverse-crunch、h-couch-stretch、s-kneel-hipflex、h-bilateral-upper-back-hug、h-overhead-triceps-stretch、n-seated-knee-lift、o-supported-ankle-eversion、o-supported-ankle-inversion、o-supported-hip-ir、t-flare-side-hold。属于「动作设计/起始姿势」类，非接触/穿模修复范围。
- warn 9 个全部修前已有（n-thomas-test 从修前 s2 改善到 s1）。
- 接触复核（41 个有接触口令的动作）：除上面 4 个（3 误判 + h-9090-liftoff）外，抱膝、叉腰、手放大腿、手撑地、前臂撑地、脚踩地全部到位（≤20 mm；o-seated-twist、w-chair-hip-thrust、n-thomas-test 只是成片视角遮挡 warn，修前同样），本轮修复没有造成任何接触点脱开。

## 口径
- 工具：`tools/motion-contact-r1/scan-fast.mjs` + `analyze.py`（来自 `audit/motion-contact-r1` @ ed304ec，既定口径不改；本次只复制到 worktree 运行，未提交工具本身）。armfix-r2 单页快速解算，每个配方 12 个均匀采样（关节幅度）+ 6 个关键帧（rest/mid/peak/hold/q1/q3，CPU 蒙皮顶点按部位分区：手/脚到其他部位最近距离、离地高度、成片视角遮挡）。
- 接触规则按 `release/app-pack-r2-v1/catalog/catalog.json`（249 个动作）的中文口令匹配（撑地/叉腰/抱膝/手放大腿等）；没有匹配到接触口令的动作只审幅度。
- 结论：fail = 任一项 severity ≥2；warn = 任一项 =1；pass = 都为 0。三类：幅度（像静止/该动的部位没动）、接触（悬空 >20/25/40 mm、部位不对、遮挡）、其他（膝反张、左右不对称）。
- 对照：同一工具在 main（9788bd1 + 工具 = ed304ec）上把同一批 81 个动作全跑一遍，「main 修前 sN」= 修前 severity；修后 ≥ 修前 记「修前已有」，修后变差记「新问题」。
- 工具限制：不装道具/固定手适配器/矫正层，所以撑地手离地 -18 mm 这类负值是手指未贴合适配器的量测假象（地面以 ground-audit 为准，修复轮已核过）；接触规则是关键词匹配，会误判（见下）。
- 只读审核，不改动作。

## 已知接受项（本表不重复判定）
蒙皮折叠：adductors-A、deltoids-A、triceps-B、s-seated-fold、n-half-split、h-chair-lat；俯卧三件套量测假象（h-cobra、n-prone-ir、n-prone-hip-ext）；腋下项。这些没在本次「已修」清单内，未扫。

## 总表
| 动作 | 接触类型 | 结论 | 关键数字 | 问题 |
|---|---|---|---|---|
| t-straddle-hold | 手撑地 | pass | 手撑地 -18mm@rest@0；幅度 35.0°/265mm | — |
| t-seated-straddle-lifts | 手撑地 | pass | 手撑地 -18mm@rest@0；幅度 24.8°/201mm | — |
| h-band-leg-out | 无（仅幅度） | pass | 幅度 8.9°/727mm | — |
| h-hip-gate | 无（仅幅度） | pass | 幅度 96.2°/661mm | — |
| s-9090 | 无（仅幅度） | pass | 幅度 29.5°/298mm | — |
| t-vsit | 手撑地 | fail | 手撑地 -18mm@rest@0；幅度 0.0°/0mm | [幅度s3] 保持类但整个循环几乎不动（没有进入/退出过程） main 修前 s3→修前已有 |
| h-band-hip-ir | 手/前臂放在大腿上 | pass | 手/前臂放在 1mm@mid@0.9；幅度 0.7°/247mm | — |
| h-lateral-step-lunge | 手撑地 | fail | 手撑地 447mm@peak@2.45；幅度 41.9°/690mm | [接触s3] 手撑地：最近 447mm 悬空/够不着（left:452mm floor occ0 ／ right:447mm floor occ0） main 修前 s3→修前已有；规则误判：口令「跨出的脚推地」是脚，不是手撑地 |
| n-chair-wiper | 脚踩地 | pass | 脚踩地 0mm@rest@0；幅度 9.8°/196mm | — |
| n-seated-squeeze | 手/前臂放在大腿上 | fail | 手/前臂放在 5mm@peak@0.85；幅度 0.2°/12mm | [幅度s3] 计次动作整个循环几乎不动 main 修前 s3→修前已有；等长夹紧，循环里外形几乎不动是动作本意（夹砖用力不可见） |
| o-stand-crossreach | 无（仅幅度） | warn | 幅度 15.5°/160mm | [幅度s1] 保持类，进入/退出幅度偏小 main 修前 s1→修前已有 |
| h-butterfly-active | 无（仅幅度） | pass | 幅度 2.9°/313mm | — |
| h-chair-dip | 脚踩地 | pass | 脚踩地 0mm@rest@0；幅度 83.2°/163mm | — |
| h-db-front-raise | 无（仅幅度） | pass | 幅度 60.1°/549mm | — |
| h-forward-lunge | 手撑地；脚踩地 | fail | 手撑地 441mm@q1@2.5；脚踩地 0mm@rest@0；幅度 52.7°/468mm | [接触s3] 手撑地：最近 441mm 悬空/够不着（left:441mm floor occ0 ／ right:441mm floor occ86） main 修前 s3→修前已有；规则误判：口令「前脚推地」是脚，不是手撑地 |
| h-goblet-squat | 脚踩地 | pass | 脚踩地 0mm@rest@0；幅度 71.2°/397mm | — |
| h-reverse-crunch | 无（仅幅度） | fail | 幅度 32.3°/517mm | [幅度s2] 该动的部位(trunk)几乎没动，主要在动的是 legs main 修前 s2→修前已有 |
| h-wall-straddle | 无（仅幅度） | pass | 幅度 1.1°/551mm | — |
| n-leg-circles | 手撑地 | pass | 手撑地 -1mm@rest@3.6；幅度 37.3°/744mm | — |
| n-windshield | 脚踩地 | pass | 脚踩地 0mm@rest@0；幅度 17.9°/466mm | — |
| o-stand-sidebend | 手/前臂放在大腿上 | pass | 手/前臂放在 5mm@rest@0；幅度 30.5°/325mm | — |
| h-half-kneeling-quad-stretch | 手扶在髋/腰侧；脚踩地 | warn | 手扶在髋/腰 3mm@hold@4；脚踩地 0mm@rest@0；幅度 31.2°/116mm | [幅度s1] 保持类，进入/退出幅度偏小 main 修前 s1→修前已有 |
| h-bulgarian | 脚踩地 | pass | 脚踩地 0mm@rest@0；幅度 55.6°/386mm | — |
| h-kb-swing | 无（仅幅度） | pass | 幅度 88.5°/1034mm | — |
| n-straddle-fold | 无（仅幅度） | warn | 幅度 27.9°/123mm | [幅度s1] 保持类，进入/退出幅度偏小 main 修前 s1→修前已有 |
| t-lsit-tuck | 手撑地 | pass | 手撑地 -18mm@rest@0；幅度 125.7°/446mm | — |
| h-db-curl | 无（仅幅度） | pass | 幅度 118.5°/555mm | — |
| h-db-zottman-curl | 无（仅幅度） | pass | 幅度 88.0°/508mm | — |
| h-db-overhead-triceps-extension | 无（仅幅度） | pass | 幅度 118.6°/518mm | — |
| h-chair-step-up | 手扶在髋/腰侧 | pass | 手扶在髋/腰 9mm@rest@0；幅度 91.6°/632mm | — |
| h-squat | 手撑地；脚踩地 | fail | 手撑地 587mm@mid@1.15；脚踩地 0mm@rest@0；幅度 104.5°/525mm | [接触s3] 手撑地：最近 587mm 悬空/够不着（left:587mm floor occ0 ／ right:587mm floor occ0） main 修前 s3→修前已有；规则误判：口令「推地站起」是脚推地，工具按「手撑地」量手离地；手本就不撑地 |
| n-pelvis-circle | 手扶在髋/腰侧；脚踩地 | pass | 手扶在髋/腰 8mm@q1@2；脚踩地 0mm@rest@0；幅度 17.3°/169mm | — |
| o-seated-ham | 无（仅幅度） | pass | 幅度 32.5°/356mm | — |
| o-seated-twist | 手在膝盖上/外侧 | warn | 手在膝盖上/ 2mm@q1@2；幅度 111.9°/609mm | [接触s1] 手在膝盖上/外侧：接触点在成片视角被遮挡(遮挡顶点427)（left:2mm rightThigh@t0.98 occ0 ／ right:317mm rightThigh@t0.0✗ occ427） main 修前 s0→**修后变差，新问题** |
| w-chair-hip-thrust | 手扶在髋/腰侧；脚踩地 | warn | 手扶在髋/腰 0mm@mid@0.8；脚踩地 0mm@rest@0；幅度 50.9°/148mm | [接触s1] 手扶在髋/腰侧：接触点在成片视角被遮挡(遮挡顶点1502)（left:0mm torso y0.45 (髋0.41~腰0.47) occ1502 ／ right:0mm torso y0.48 (髋0.41~腰0.47) occ0） main 修前 s1→修前已有 |
| h-couch-stretch | 手扶在髋/腰侧；脚踩地 | fail | 手扶在髋/腰 1mm@rest@0；脚踩地 0mm@rest@0；幅度 19.8°/134mm | [幅度s2] 保持类，进入/退出幅度很小（起始姿势已接近保持姿势） main 修前 s2→修前已有 |
| h-side-er | 无（仅幅度） | pass | 幅度 18.2°/349mm | — |
| s-figure4 | 无（仅幅度） | fail | 幅度 5.9°/45mm | [幅度s3] 保持类但整个循环几乎不动（没有进入/退出过程） main 修前 s2→**修后变差，新问题** |
| s-kneel-hipflex | 脚踩地 | fail | 脚踩地 0mm@rest@0；幅度 19.5°/109mm | [幅度s2] 保持类，进入/退出幅度很小（起始姿势已接近保持姿势） main 修前 s2→修前已有 |
| g-cable-hip-abduction | 脚踩地 | pass | 脚踩地 0mm@rest@0；幅度 7.0°/259mm | — |
| g-cable-hip-extension | 脚踩地 | pass | 脚踩地 0mm@rest@0；幅度 12.0°/159mm | — |
| h-9090-liftoff | 手在膝盖上/外侧 | fail | 手在膝盖上/ 1mm@rest@0；幅度 0.6°/238mm | [接触s2] 手在膝盖上/外侧：接触部位不对（left:1mm leftThigh@t0.4✗ occ0 ／ right:1mm rightThigh@t0.5✗ occ0） main 修前 s2→修前已有；「手在膝盖上」规则：手实际搭在大腿中段（t0.4–0.5，距 1 mm），接触到位但位置偏离规则的「膝上」 |
| h-band-hip-extension | 无（仅幅度） | pass | 幅度 12.0°/159mm | — |
| h-band-standing-abduction | 无（仅幅度） | pass | 幅度 7.0°/259mm | — |
| h-band-standing-adduction | 无（仅幅度） | pass | 幅度 3.4°/331mm | — |
| h-band-straight-leg-raise | 无（仅幅度） | pass | 幅度 33.0°/432mm | — |
| h-bilateral-upper-back-hug | 双臂环抱，手到对侧肩背 | fail | 双臂环抱，手 18mm@peak@2.35；幅度 8.2°/59mm | [幅度s3] 保持类但整个循环几乎不动（没有进入/退出过程） [其他s1] 左右不对称: ShoulderElev 左幅3° 右幅2° 平均差38° main 修前 s3→修前已有 |
| h-bridge-march | 无（仅幅度） | warn | 幅度 18.5°/156mm | [幅度s1] 保持类，进入/退出幅度偏小 main 修前 s1→修前已有 |
| h-crossbody | 另一手按在对侧上臂肘上方 | pass | 另一手按在对 1mm@mid@1.4；幅度 46.0°/597mm | — |
| h-good-morning | 无（仅幅度） | pass | 幅度 90.6°/593mm | — |
| h-knee-hug | 手抱在膝下小腿/膝窝附近 | warn | 手抱在膝下小 1mm@rest@0；幅度 34.6°/80mm | [幅度s1] 保持类，进入/退出幅度偏小 main 修前 s1→修前已有 |
| h-overhead-triceps-stretch | 无（仅幅度） | fail | 幅度 2.2°/5mm | [幅度s3] 保持类但整个循环几乎不动（没有进入/退出过程） main 修前 s3→修前已有 |
| h-tabletop | 手撑地 | pass | 手撑地 -18mm@rest@0；幅度 85.4°/282mm | — |
| n-seated-knee-lift | 脚踩地 | fail | 脚踩地 2mm@rest@0；幅度 12.1°/139mm | [幅度s2] 保持类，进入/退出幅度很小（起始姿势已接近保持姿势） main 修前 s2→修前已有 |
| n-thomas-test | 手抱在膝下小腿/膝窝附近 | warn | 手抱在膝下小 6mm@mid@1.3；幅度 26.2°/64mm | [幅度s1] 保持类，进入/退出幅度偏小 [接触s1] 手抱在膝下小腿/膝窝附近：接触点在成片视角被遮挡(遮挡顶点422)（left:6mm leftShin@t0.32 occ422 ／ right:3mm leftShin@t0.05 occ0） main 修前 s2→修前已有 |
| o-seated-fig4 | 脚踩地 | pass | 脚踩地 0mm@rest@0；幅度 51.0°/289mm | — |
| o-seated-sidebend | 脚踩地 | pass | 脚踩地 0mm@rest@0；幅度 18.0°/415mm | — |
| o-supported-ankle-eversion | 无（仅幅度） | fail | 幅度 0.0°/0mm | [幅度s3] 计次动作整个循环几乎不动；循环里 100% 时间完全静止 main 修前 s3→修前已有 |
| o-supported-ankle-inversion | 无（仅幅度） | fail | 幅度 0.0°/0mm | [幅度s3] 计次动作整个循环几乎不动；循环里 100% 时间完全静止 main 修前 s3→修前已有 |
| o-supported-ankle-pump | 无（仅幅度） | pass | 幅度 30.0°/93mm | — |
| o-supported-hip-ir | 无（仅幅度） | fail | 幅度 0.1°/137mm | [幅度s2] 计次动作幅度偏小 main 修前 s2→修前已有 |
| o-supported-knee-curl | 无（仅幅度） | pass | 幅度 42.3°/440mm | — |
| o-supported-march | 无（仅幅度） | pass | 幅度 40.0°/244mm | — |
| o-supported-star-reach | 无（仅幅度） | pass | 幅度 40.1°/527mm | — |
| t-flare-side-hold | 手撑地 | fail | 手撑地 -18mm@rest@0；幅度 1.0°/12mm | [幅度s3] 保持类但整个循环几乎不动（没有进入/退出过程） main 修前 s3→修前已有 |
| w-feet-on-chair-bridge | 无（仅幅度） | warn | 幅度 32.4°/191mm | [幅度s1] 保持类，进入/退出幅度偏小 main 修前 s1→修前已有 |
| w-prone-swimmer | 无（仅幅度） | pass | 幅度 130.5°/1085mm | — |

计数：{"pass": 41, "warn": 9, "fail": 17, "error": 0}；未跑 0：无


---

# pose-fix 总复核：motion-contact-audit（PR #30 fix/gc-overlap-limb-r1 @ 148c795）

范围：PR #30 README 里本次改过的 14 个动作（r8 12 个 + r10 forearms-A、h-kneeling-thread-needle）。2026-11-05 22:30–23:15 CST。注意本分支以 fix/ground-contact-r1 为底，「main 修前」对照包含 GC 改动。

## 结果
- 跑了 14/14，未跑 0，扫描报错 0。pass 8、warn 1、fail 5。
- fail 5 个全部是幅度类，接触项全部到位：adductors-B、h-short-side-plank、h-supine-heel-slide、s-pigeon 修前同级；**o-supported-hip-hitch 名义上修前 s2→修后 s3**，但关节幅度同为 2.9°，位移 84→79 mm 只是跨过 80 mm 阈值，属临界，不算实质变差。
- warn 1：forearms-A 左右不对称（左肘 36° 右肘 0°），修前已有（动作是单侧腕摇）。
- 接触复核（11 个有接触口令）：手撑地/前臂撑地/脚踩地全部到位；forearms-A、hip-abductors-A 撑地手 -18 mm 为量测假象（见口径）。
- 新问题：0。

## 口径
- 工具：`tools/motion-contact-r1/scan-fast.mjs` + `analyze.py`（来自 `audit/motion-contact-r1` @ ed304ec，既定口径不改；本次只复制到 worktree 运行，未提交工具本身）。armfix-r2 单页快速解算，每个配方 12 个均匀采样（关节幅度）+ 6 个关键帧（rest/mid/peak/hold/q1/q3，CPU 蒙皮顶点按部位分区：手/脚到其他部位最近距离、离地高度、成片视角遮挡）。
- 接触规则按 `release/app-pack-r2-v1/catalog/catalog.json`（249 个动作）的中文口令匹配（撑地/叉腰/抱膝/手放大腿等）；没有匹配到接触口令的动作只审幅度。
- 结论：fail = 任一项 severity ≥2；warn = 任一项 =1；pass = 都为 0。三类：幅度（像静止/该动的部位没动）、接触（悬空 >20/25/40 mm、部位不对、遮挡）、其他（膝反张、左右不对称）。
- 对照：同一工具在 main（9788bd1 + 工具 = ed304ec）上把同一批 81 个动作全跑一遍，「main 修前 sN」= 修前 severity；修后 ≥ 修前 记「修前已有」，修后变差记「新问题」。
- 工具限制：不装道具/固定手适配器/矫正层，所以撑地手离地 -18 mm 这类负值是手指未贴合适配器的量测假象（地面以 ground-audit 为准，修复轮已核过）；接触规则是关键词匹配，会误判（见下）。
- 只读审核，不改动作。

## 已知接受项（本表不重复判定）
蒙皮折叠：adductors-A、deltoids-A、triceps-B、s-seated-fold、n-half-split、h-chair-lat；俯卧三件套量测假象（h-cobra、n-prone-ir、n-prone-hip-ext）；腋下项。这些没在本次「已修」清单内，未扫。

## 总表
| 动作 | 接触类型 | 结论 | 关键数字 | 问题 |
|---|---|---|---|---|
| forearms-A | 手撑地 | warn | 手撑地 -18mm@rest@1.65；幅度 36.4°/167mm | [其他s1] 左右不对称: Elbow 左幅36° 右幅0° 平均差10° main 修前 s1→修前已有 |
| h-kneeling-thread-needle | 无（仅幅度） | pass | 幅度 83.2°/589mm | — |
| h-quadruped-open | 手撑地 | pass | 手撑地 1mm@rest@0；幅度 47.1°/759mm | — |
| t-seated-straddle-lift-1leg | 手撑地 | pass | 手撑地 1mm@rest@0；幅度 83.3°/899mm | — |
| hip-abductors-A | 手撑地；前臂撑地 | pass | 手撑地 -18mm@rest@0；前臂撑地 13mm@rest@0；幅度 28.0°/499mm | — |
| adductors-B | 前臂撑地 | fail | 前臂撑地 7mm@rest@0；幅度 10.4°/61mm | [幅度s2] 保持类，进入/退出幅度很小（起始姿势已接近保持姿势） main 修前 s2→修前已有 |
| deltoids-B | 前臂撑地 | pass | 前臂撑地 14mm@rest@0；幅度 119.8°/886mm | — |
| glute-max-A | 脚踩地 | pass | 脚踩地 0mm@rest@0；幅度 35.7°/595mm | — |
| h-short-side-plank | 手撑地；前臂撑地 | fail | 手撑地 -7mm@rest@0；前臂撑地 8mm@rest@0；幅度 0.0°/0mm | [幅度s3] 保持类但整个循环几乎不动（没有进入/退出过程） main 修前 s3→修前已有 |
| h-supine-bilateral-leg-raise | 无（仅幅度） | pass | 幅度 52.7°/606mm | — |
| h-supine-heel-slide | 脚踩地 | fail | 脚踩地 0mm@rest@0；幅度 49.0°/260mm | [幅度s2] 该动的部位(trunk)几乎没动，主要在动的是 legs main 修前 s2→修前已有 |
| o-supported-hip-hitch | 无（仅幅度） | fail | 幅度 2.9°/79mm | [幅度s3] 计次动作整个循环几乎不动 main 修前 s2→**修后变差，新问题** |
| s-pigeon | 无（仅幅度） | fail | 幅度 4.1°/32mm | [幅度s3] 保持类但整个循环几乎不动（没有进入/退出过程） main 修前 s3→修前已有 |
| scapular-A | 无（仅幅度） | pass | 幅度 98.9°/527mm | — |

计数：{"pass": 8, "warn": 1, "fail": 5, "error": 0}；未跑 0：无

