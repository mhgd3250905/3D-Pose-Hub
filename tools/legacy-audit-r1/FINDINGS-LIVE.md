# 旧动作审计 r1 实时问题清单（未经独立评审，2026-11-21 14:30 导出，已分析 103 个动作）

分级：P0 反人类/文不对题（先修）→ P1 严重错位 → M 模型级裆部鼓包（V5 皮肤层一次修）→ P2 明显不准。同级按幅度从大到小。

## P0 反人类 / 文不对题（6 条）

| 动作 id | 名称 | 级别 | 规则 | 问题 | 帧 |
|---|---|---|---|---|---|
| h-short-side-plank | 屈膝短杠杆侧平板 | S1 | rom-footVsKnee | 左脚朝向反了：脚尖指向小腿后侧（与膝盖朝向差 -180°，解剖上不可能） | 0,10,20,30 |
| h-floor-nordic-hand-reset | 地面北欧离心及手撑复位 | S1 | knee-valgus | 负重屈膝腿膝盖比脚尖方向往内偏 180°（右腿，屈膝 90°） | 0,10,20,30 |
| h-short-side-plank | 屈膝短杠杆侧平板 | S1 | sideplank-feet-off-floor | 屈膝侧撑：双脚应叠放贴地，实际有一只脚离地 175 mm | 0,10,20,30 |
| h-short-side-plank | 屈膝短杠杆侧平板 | S1 | rom-footVsKnee | 右脚朝向反了：脚尖指向小腿后侧（与膝盖朝向差 -173°，解剖上不可能） | 0,10,20,30 |
| s-9090 | 90/90 坐姿换髋 | S1 | text-no-switch | 文字/名称要求左右换边（动作名「90/90 坐姿换髋」+ Flare 热身文案「脚跟压稳，双膝翻到另一侧，上身尽量坐直」（左右换髋）；Hub r3 文字已改成单侧前倾，名称仍是换髋），视频里没有左右切换（最接近镜像姿态仍差 76 cm） | 110,110 |
| h-short-side-plank | 屈膝短杠杆侧平板 | S1 | sideplank-foot-above-knee | 屈膝侧撑：小腿/脚翻向上方（脚比膝高 0.08 m） | 0,10,20,30 |

## P1 严重错位（膝脚朝向、膝内扣外翻、重心）（19 条）

| 动作 id | 名称 | 级别 | 规则 | 问题 | 帧 |
|---|---|---|---|---|---|
| h-squat | 徒手深蹲 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -70°（阈值 45°） | 50,60,70,170 |
| h-squat | 徒手深蹲 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -70°（阈值 45°） | 50,60,70,170 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S1 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 68°（阈值 42°） | 40,50,60,70 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S1 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 68°（阈值 42°） | 40,50,60,70 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -67°（阈值 45°） | 40,50,60,70 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -67°（阈值 45°） | 40,50,60,70 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S1 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -67°（阈值 45°） | 40,50,60,70 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S1 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -67°（阈值 45°） | 40,50,60,70 |
| s-9090 | 90/90 坐姿换髋 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -66°（阈值 45°） | 0,10,20,30 |
| h-9090-liftoff | 90/90 后腿主动抬起 | S1 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -65°（阈值 45°） | 0,10,20,30 |
| h-9090-liftoff | 90/90 后腿主动抬起 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -65°（阈值 45°） | 0,10,20,30 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | S1 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 64°（阈值 42°） | 50,60,70,80 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | S1 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -60°（阈值 45°） | 60,70,80,90 |
| h-squat | 徒手深蹲 | S1 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 52°（阈值 42°） | 50,60,70,170 |
| h-squat | 徒手深蹲 | S1 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 52°（阈值 42°） | 50,60,70,170 |
| h-db-calf-raise | 双哑铃站姿提踵 | S1 | com-outside-support | 重心投影落在支撑面外 15 cm（静力上站不住） | 30,40,50,60 |
| adductors-A | 哥萨克蹲 | S1 | sidesquat-com-off-foot | 侧蹲到底时重心没落在下蹲那只脚上（重心投影偏出该脚掌 0.17 m） | 30,40,80,90 |
| h-squat | 徒手深蹲 | S1 | knee-outside-foot | 负重屈膝时膝盖远在脚的外侧 15 cm（膝过度外翻，小腿斜向内，右腿） | 50,50,60,60 |
| deltoids-B | 哑铃半程土耳其起立（至高桥） | S1 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 12 cm（膝内扣，右腿） | 110,120,130 |

## M 模型级：裆部鼓包（不逐动作改姿势）（15 条）

| 动作 id | 名称 | 级别 | 规则 | 问题 | 帧 |
|---|---|---|---|---|---|
| h-chair-dip | 椅子臂屈伸 | S1 | crotch-bulge | 裆部网格局部鼓包 50 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| h-bulgarian | 椅子保加利亚分腿蹲 | S1 | crotch-bulge | 裆部网格局部鼓包 50 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 30,40,50,60 |
| h-chair-progressive-front-split-native | 扶椅前后劈叉渐进 | S1 | crotch-bulge | 裆部网格局部鼓包 47 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| deltoids-C | 地雷杆半跪单臂推举 | S1 | crotch-bulge | 裆部网格局部鼓包 45 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| h-couch-stretch | 沙发拉伸（后脚搭矮凳） | S1 | crotch-bulge | 裆部网格局部鼓包 44 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| t-supine-straddle-open-close | t-supine-straddle-open-close | S1 | crotch-bulge | 裆部网格局部鼓包 42 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| t-wide-side-squat-shift | t-wide-side-squat-shift | S1 | crotch-bulge | 裆部网格局部鼓包 42 mm（相对周围 4 cm 区域沿法线外凸；会阴/后裆） | 160,170,180,190 |
| h-chair-step-up | 椅子上步 | S1 | crotch-bulge | 裆部网格局部鼓包 40 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 20,30,40,90 |
| h-adductor-rock | 四足单腿侧伸后摇 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| h-9090-liftoff | 90/90 后腿主动抬起 | S1 | crotch-bulge | 裆部网格局部鼓包 37 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| h-goblet-squat | 壶铃高脚杯深蹲 | S1 | crotch-bulge | 裆部网格局部鼓包 37 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 50,60,70,80 |
| h-donkey-kick | 四足屈膝后踢 | S1 | crotch-bulge | 裆部网格局部鼓包 37 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,40 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | S1 | crotch-bulge | 裆部网格局部鼓包 36 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| h-db-row | 扶椅单臂哑铃划船 | S1 | crotch-bulge | 裆部网格局部鼓包 36 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| glute-max-B | 弹力带四足直腿后踢 | S1 | crotch-bulge | 裆部网格局部鼓包 33 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 30,40,50,60 |

## P2 明显不准（30 条）

| 动作 id | 名称 | 级别 | 规则 | 问题 | 帧 |
|---|---|---|---|---|---|
| h-floor-nordic-hand-reset | 地面北欧离心及手撑复位 | S2 | knee-out-of-toe | 负重屈膝腿膝盖比脚尖方向往外偏 180°（左腿） | 0,10,20,30 |
| h-chair-progressive-front-split-native | 扶椅前后劈叉渐进 | S2 | knee-out-of-toe | 负重屈膝腿膝盖比脚尖方向往外偏 179°（左腿） | 0,10,90,100 |
| h-db-split-squat | 双哑铃原地分腿蹲 | S2 | squat-heel-up | 下蹲时屈膝负重腿脚后跟离地 111 mm | 0,10,20,30 |
| h-forward-lunge | 前跨步弓步蹲 | S2 | squat-heel-up | 下蹲时屈膝负重腿脚后跟离地 67 mm | 60,70,76,80 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | S2 | rom-footVsKnee | 脚尖与膝盖朝向不一致右侧 -60°（阈值 60°） | 90,100,110,120 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -59°（阈值 45°） | 60,70,80,90 |
| abs-B | 平行杆团身 L 撑 | S2 | asymmetry | 双侧对称动作左右不对称 57 cm | 120,130,140,150 |
| h-db-supported-calf-raise | 单手哑铃扶墙双脚提踵 | S2 | asymmetry | 双侧对称动作左右不对称 55 cm | 0,10,20,30 |
| s-9090 | 90/90 坐姿换髋 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -54°（阈值 45°） | 0,10,20,30 |
| s-9090 | 90/90 坐姿换髋 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 46°（阈值 42°） | 0,10,20,30 |
| h-9090-liftoff | 90/90 后腿主动抬起 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 46°（阈值 42°） | 0,10,20,30 |
| deltoids-B | 哑铃半程土耳其起立（至高桥） | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 46°（阈值 45°） | 80,160 |
| h-chair-dip | 椅子臂屈伸 | S2 | knee-out-of-toe | 负重屈膝腿膝盖比脚尖方向往外偏 37°（左腿） | 80,200 |
| forearms-C | 壶铃倒握行走 | S2 | text-hold-moving | 文字是静态保持（hold），视频里找不到静止段（最稳的 30% 时长内仍变化 33 cm） |  |
| adductors-C | 绳索站姿髋内收 | S2 | foot-hover | 站定的脚悬空 24 mm（左脚） | 60,180 |
| h-doorframe-forearms-pec-native-r3 | 门框双前臂胸肌拉伸 | S2 | asymmetry | 双侧对称动作左右不对称 24 cm | 0,10,20,30 |
| h-bilateral-upper-back-hug | 双臂前抱上背拉伸 | S2 | asymmetry | 双侧对称动作左右不对称 21 cm | 0,10,20,30 |
| h-couch-stretch | 沙发拉伸（后脚搭矮凳） | S2 | knee-valgus | 负重屈膝腿膝盖比脚尖方向往内偏 17°（右腿，屈膝 84°） | 0,10,20,30 |
| h-floor-nordic-hand-reset | 地面北欧离心及手撑复位 | S2 | foot-hover | 站定的脚悬空 16 mm（右脚） | 0,10,20,30 |
| deltoids-A | 直臂侧平板支撑 | S2 | com-outside-support | 重心投影落在支撑面外 12 cm（静力上站不住） | 40,50,60,70 |
| h-db-calf-raise | 双哑铃站姿提踵 | S2 | text-reps-static | 文字是做次数（rep_updown），视频几乎不动（最大位移 1.9 cm） |  |
| h-bent-knee-calf-raise | 屈膝承重提踵 | S2 | text-reps-static | 文字是做次数（rep_updown），视频几乎不动（最大位移 0.5 cm） |  |
| adductors-A | 哥萨克蹲 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 7 cm（膝内扣，左腿） | 20,100,140,220 |
| h-lateral-step-lunge | 侧跨步弓步蹲 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 7 cm（膝内扣，左腿） | 70,80,90,220 |
| forearms-B | 哑铃腕屈 + 腕伸 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 6 cm（膝内扣，左腿） | 0,0,10,10 |
| h-couch-stretch | 沙发拉伸（后脚搭矮凳） | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 6 cm（膝内扣，右腿） | 0,10,20,30 |
| deltoids-C | 地雷杆半跪单臂推举 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 4 cm（膝内扣，左腿） | 0,10,20,30 |
| forearms-B | 哑铃腕屈 + 腕伸 | S2 | text-reps-static | 文字是做次数（rep_updown），视频几乎不动（最大位移 0.0 cm） |  |
| h-db-overhead-shrug | 双哑铃过头耸肩 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 0.0 cm） |  |
| h-db-shrug | 双哑铃站姿耸肩 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 0.0 cm） |  |

## 已判误报

- abs-A：躺姿四肢悬空 2–3 cm 触发重心规则，已判误报（重心规则已改为只判站/跪姿）
