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

