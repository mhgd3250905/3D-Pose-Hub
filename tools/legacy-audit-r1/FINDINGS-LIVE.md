# 旧动作审计 r1 终版问题清单（已独立评审，误报已剔除，2026-11-21 18:37 导出，已分析 254 个动作）

分级：P0 反人类/文不对题（先修）→ P1 严重错位 → M 模型级裆部鼓包（V5 皮肤层一次修）→ P2 明显不准。同级按幅度从大到小。

## P0 反人类 / 文不对题（6 条）

| 动作 id | 名称 | 级别 | 规则 | 问题 | 帧 |
|---|---|---|---|---|---|
| h-short-side-plank | 屈膝短杠杆侧平板 | S1 | rom-footVsKnee | 左脚朝向反了：脚尖指向小腿后侧（与膝盖朝向差 -180°，解剖上不可能） | 0,10,20,30 |
| h-short-side-plank | 屈膝短杠杆侧平板 | S1 | sideplank-feet-off-floor | 屈膝侧撑：双脚应叠放贴地，实际有一只脚离地 175 mm | 0,10,20,30 |
| h-short-side-plank | 屈膝短杠杆侧平板 | S1 | rom-footVsKnee | 右脚朝向反了：脚尖指向小腿后侧（与膝盖朝向差 -173°，解剖上不可能） | 0,10,20,30 |
| s-9090 | 90/90 坐姿换髋 | S1 | text-no-switch | 文字/名称要求左右换边（动作名「90/90 坐姿换髋」+ Flare 热身文案「脚跟压稳，双膝翻到另一侧，上身尽量坐直」（左右换髋）；Hub r3 文字已改成单侧前倾，名称仍是换髋），视频里没有左右切换（最接近镜像姿态仍差 76 cm） | 110,110 |
| o-supported-march | 扶椅站姿交替抬膝 | S1 | text-no-switch | 文字/名称要求左右换边（训练参数 perSide=alternate repUnit=left+right（每下左右各一次）），视频里没有左右切换（最接近镜像姿态仍差 15 cm） | 0,0 |
| h-short-side-plank | 屈膝短杠杆侧平板 | S1 | sideplank-foot-above-knee | 屈膝侧撑：小腿/脚翻向上方（脚比膝高 0.08 m） | 0,10,20,30 |

## P1 严重错位（膝脚朝向、膝内扣外翻、重心）（12 条）

| 动作 id | 名称 | 级别 | 规则 | 问题 | 帧 |
|---|---|---|---|---|---|
| n-squat-shift | 低位蹲姿左右移重心 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -74°（阈值 45°） | 30,40,50,60 |
| n-squat-shift | 低位蹲姿左右移重心 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -74°（阈值 45°） | 150,160,170,180 |
| h-squat | 徒手深蹲 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -70°（阈值 45°） | 50,60,70,170 |
| h-squat | 徒手深蹲 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -70°（阈值 45°） | 50,60,70,170 |
| s-9090 | 90/90 坐姿换髋 | S1 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -66°（阈值 45°） | 0,10,20,30 |
| n-squat-shift | 低位蹲姿左右移重心 | S1 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 64°（阈值 42°） | 30,40,50,60 |
| n-squat-shift | 低位蹲姿左右移重心 | S1 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 64°（阈值 42°） | 150,160,170,180 |
| h-squat | 徒手深蹲 | S1 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 52°（阈值 42°） | 50,60,70,170 |
| h-squat | 徒手深蹲 | S1 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 52°（阈值 42°） | 50,60,70,170 |
| adductors-A | 哥萨克蹲 | S1 | sidesquat-com-off-foot | 侧蹲到底时重心没落在下蹲那只脚上（重心投影偏出该脚掌 0.17 m） | 30,40,80,90 |
| h-squat | 徒手深蹲 | S1 | knee-outside-foot | 负重屈膝时膝盖远在脚的外侧 15 cm（膝过度外翻，小腿斜向内，右腿） | 50,50,60,60 |
| deltoids-B | 哑铃半程土耳其起立（至高桥） | S1 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 12 cm（膝内扣，右腿） | 110,120,130 |

## M 模型级：裆部鼓包（不逐动作改姿势）（54 条）

| 动作 id | 名称 | 级别 | 规则 | 问题 | 帧 |
|---|---|---|---|---|---|
| t-lsit-vsit-circles | L 撑到 V 撑画圈 | S1 | crotch-bulge | 裆部网格局部鼓包 73 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| s-butterfly | 蝴蝶式 | S1 | crotch-bulge | 裆部网格局部鼓包 70 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| t-seated-straddle-ext | 坐姿分腿屈伸 | S1 | crotch-bulge | 裆部网格局部鼓包 70 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| o-seated-fig4 | 坐姿四字前压 | S1 | crotch-bulge | 裆部网格局部鼓包 68 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| s-figure4 | 仰卧 4 字拉伸 | S1 | crotch-bulge | 裆部网格局部鼓包 67 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| n-seated-ir-drop | 坐姿后撑单膝内倒 | S1 | crotch-bulge | 裆部网格局部鼓包 59 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| t-lsit-tuck | L 撑↔团身 | S1 | crotch-bulge | 裆部网格局部鼓包 57 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| n-thomas-test | 仰卧单膝抱胸 | S1 | crotch-bulge | 裆部网格局部鼓包 51 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| h-chair-dip | 椅子臂屈伸 | S1 | crotch-bulge | 裆部网格局部鼓包 50 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| h-bulgarian | 椅子保加利亚分腿蹲 | S1 | crotch-bulge | 裆部网格局部鼓包 50 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 30,40,50,60 |
| h-seated-reachback | 坐姿后撑滑臀 | S1 | crotch-bulge | 裆部网格局部鼓包 49 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| h-chair-progressive-front-split-native | 扶椅前后劈叉渐进 | S1 | crotch-bulge | 裆部网格局部鼓包 47 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| obliques-A | 熊爬穿腿 | S1 | crotch-bulge | 裆部网格局部鼓包 47 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| hip-abductors-B | 仰卧弹力带 V 字开腿 | S1 | crotch-bulge | 裆部网格局部鼓包 46 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| s-pigeon | 鸽子式（直立扶砖版） | S1 | crotch-bulge | 裆部网格局部鼓包 45 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| deltoids-C | 地雷杆半跪单臂推举 | S1 | crotch-bulge | 裆部网格局部鼓包 45 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| h-couch-stretch | 沙发拉伸（后脚搭矮凳） | S1 | crotch-bulge | 裆部网格局部鼓包 44 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| h-half-kneeling-quad-stretch | 半跪姿手拉脚股四头肌拉伸 | S1 | crotch-bulge | 裆部网格局部鼓包 44 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| h-kb-swing | 单臂壶铃摆荡 | S1 | crotch-bulge | 裆部网格局部鼓包 43 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,70,80 |
| h-wall-straddle | 靠墙仰卧 V 字分腿 | S1 | crotch-bulge | 裆部网格局部鼓包 43 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| s-9090 | 90/90 坐姿换髋 | S1 | crotch-bulge | 裆部网格局部鼓包 43 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| h-quad-cars | 四足髋关节画圈 | S1 | crotch-bulge | 裆部网格局部鼓包 43 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| s-kneel-hipflex | 半跪髋屈肌拉伸 | S1 | crotch-bulge | 裆部网格局部鼓包 43 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| t-supine-straddle-open-close | t-supine-straddle-open-close | S1 | crotch-bulge | 裆部网格局部鼓包 42 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| t-wide-side-squat-shift | t-wide-side-squat-shift | S1 | crotch-bulge | 裆部网格局部鼓包 42 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 50,60,70,160 |
| hamstrings-A | 徒手单腿罗马尼亚硬拉 | S1 | crotch-bulge | 裆部网格局部鼓包 42 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 30,40,50,60 |
| w-bird-dog | 鸟狗式 | S1 | crotch-bulge | 裆部网格局部鼓包 41 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| w-fire-hydrant | 四足消防栓 | S1 | crotch-bulge | 裆部网格局部鼓包 41 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| n-half-split | 半跪半劈叉 | S1 | crotch-bulge | 裆部网格局部鼓包 40 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| w-wall-sit | 靠墙静蹲 | S1 | crotch-bulge | 裆部网格局部鼓包 40 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| h-chair-step-up | 椅子上步 | S1 | crotch-bulge | 裆部网格局部鼓包 40 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 20,30,40,90 |
| h-mountain-climber | 慢速登山跑 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 40,50,60,70 |
| s-frog | 青蛙式 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| w-dead-bug | 死虫式 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,50 |
| h-russian-twist | 俄罗斯转体 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| t-seated-straddle-lifts | 坐姿分腿双腿抬起 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| h-sumo-pry | 相扑深蹲肘推膝停留 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 30,40,50,60 |
| n-straddle-fold | 坐姿分腿体前屈 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| h-squat | 徒手深蹲 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 40,50,60,70 |
| h-reverse-lunge | 后撤步弓步蹲 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 20,30,40,50 |
| h-adductor-rock | 四足单腿侧伸后摇 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| hip-flexors-B | 弹力带站姿高抬膝 | S1 | crotch-bulge | 裆部网格局部鼓包 38 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 30,40,50,60 |
| h-9090-liftoff | 90/90 后腿主动抬起 | S1 | crotch-bulge | 裆部网格局部鼓包 37 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| t-straddle-hold | 分腿支撑 | S1 | crotch-bulge | 裆部网格局部鼓包 37 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| h-goblet-squat | 壶铃高脚杯深蹲 | S1 | crotch-bulge | 裆部网格局部鼓包 37 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 50,60,70,80 |
| h-donkey-kick | 四足屈膝后踢 | S1 | crotch-bulge | 裆部网格局部鼓包 37 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,40 |
| n-chair-wiper | 坐椅雨刷（膝内倒） | S1 | crotch-bulge | 裆部网格局部鼓包 37 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | S1 | crotch-bulge | 裆部网格局部鼓包 36 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| hip-abductors-C | 器械髋外展 | S1 | crotch-bulge | 裆部网格局部鼓包 36 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| h-db-row | 扶椅单臂哑铃划船 | S1 | crotch-bulge | 裆部网格局部鼓包 36 mm（相对周围 4 cm 区域沿法线外凸；前裆；两腿分开时可见，敏感） | 0,10,20,30 |
| n-wide-fold | 站姿宽距体前屈（扶椅） | S1 | crotch-bulge | 裆部网格局部鼓包 34 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| n-squat-shift | 低位蹲姿左右移重心 | S1 | crotch-bulge | 裆部网格局部鼓包 34 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,20,30 |
| glute-max-B | 弹力带四足直腿后踢 | S1 | crotch-bulge | 裆部网格局部鼓包 33 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 30,40,50,60 |
| n-leg-circles | 仰卧直腿画圈 | S1 | crotch-bulge | 裆部网格局部鼓包 32 mm（相对周围 4 cm 区域沿法线外凸；会阴；两腿分开时可见，敏感） | 0,10,70,80 |

## P2 明显不准（137 条）

| 动作 id | 名称 | 级别 | 规则 | 问题 | 帧 |
|---|---|---|---|---|---|
| h-kneeling-instep-stretch | 跪姿脚背支撑拉伸 | S2 | knee-out-of-toe | 负重屈膝腿膝盖比脚尖方向往外偏 180°（左腿） | 0,10,20,30 |
| n-half-split | 半跪半劈叉 | S2 | knee-out-of-toe | 负重屈膝腿膝盖比脚尖方向往外偏 180°（左腿） | 0,10,20,30 |
| s-kneel-hipflex | 半跪髋屈肌拉伸 | S2 | knee-out-of-toe | 负重屈膝腿膝盖比脚尖方向往外偏 180°（左腿） | 0,10,20,30 |
| h-chair-progressive-front-split-native | 扶椅前后劈叉渐进 | S2 | knee-out-of-toe | 负重屈膝腿膝盖比脚尖方向往外偏 179°（左腿） | 0,10,90,100 |
| s-lizard | 蜥蜴式低弓步 | S2 | knee-out-of-toe | 负重屈膝腿膝盖比脚尖方向往外偏 175°（左腿） | 0,10,20,30 |
| h-reverse-lunge | 后撤步弓步蹲 | S2 | squat-heel-up | 下蹲时屈膝负重腿脚后跟离地 157 mm | 30,40,50,60 |
| h-db-split-squat | 双哑铃原地分腿蹲 | S2 | squat-heel-up | 下蹲时屈膝负重腿脚后跟离地 111 mm | 0,10,20,30 |
| h-inner-thigh | 侧卧内收抬腿 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -97°（阈值 45°） | 0,10,20,30 |
| obliques-A | 熊爬穿腿 | S2 | rom-footVsKnee | 脚尖与膝盖朝向不一致左侧 -89°（阈值 60°） | 160,170,180,190 |
| obliques-A | 熊爬穿腿 | S2 | rom-footVsKnee | 脚尖与膝盖朝向不一致右侧 -89°（阈值 60°） | 40,50,60,70 |
| h-russian-twist | 俄罗斯转体 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -81°（阈值 45°） | 0,10,20,30 |
| h-russian-twist | 俄罗斯转体 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -81°（阈值 45°） | 0,10,20,30 |
| n-seated-ir-drop | 坐姿后撑单膝内倒 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 75°（阈值 45°） | 160,170,180,190 |
| n-seated-ir-drop | 坐姿后撑单膝内倒 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 75°（阈值 45°） | 40,50,60,70 |
| s-butterfly | 蝴蝶式 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -70°（阈值 45°） | 0,10,20,30 |
| s-lizard | 蜥蜴式低弓步 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -69°（阈值 45°） | 0,10,20,30 |
| s-butterfly | 蝴蝶式 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -69°（阈值 45°） | 0,10,20,30 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 68°（阈值 42°） | 40,50,60,70 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 68°（阈值 42°） | 40,50,60,70 |
| h-inner-thigh | 侧卧内收抬腿 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 68°（阈值 42°） | 0,10,20,30 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -67°（阈值 45°） | 40,50,60,70 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -67°（阈值 45°） | 40,50,60,70 |
| h-forward-lunge | 前跨步弓步蹲 | S2 | squat-heel-up | 下蹲时屈膝负重腿脚后跟离地 67 mm | 60,70,76,80 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -67°（阈值 45°） | 40,50,60,70 |
| h-butterfly-active | 仰卧蝴蝶主动开合 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -67°（阈值 45°） | 40,50,60,70 |
| h-9090-liftoff | 90/90 后腿主动抬起 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -65°（阈值 45°） | 0,10,20,30 |
| h-9090-liftoff | 90/90 后腿主动抬起 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -65°（阈值 45°） | 0,10,20,30 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 64°（阈值 42°） | 50,60,70,80 |
| n-windshield | 仰卧雨刷式 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -63°（阈值 45°） | 40,50,60,70 |
| n-windshield | 仰卧雨刷式 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -63°（阈值 45°） | 160,170,180,190 |
| h-hip-gate | 扶椅站姿开髋门 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 63°（阈值 42°） | 60,70,80,90 |
| h-hip-gate | 扶椅站姿开髋门 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -61°（阈值 45°） | 60,70,80,90 |
| h-russian-twist | 俄罗斯转体 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 61°（阈值 42°） | 0,10,20,30 |
| h-russian-twist | 俄罗斯转体 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 61°（阈值 42°） | 0,10,20,30 |
| h-hip-gate | 扶椅站姿开髋门 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -61°（阈值 45°） | 60,70,80,90 |
| h-hip-gate | 扶椅站姿开髋门 | S2 | rom-footVsKnee | 脚尖与膝盖朝向不一致右侧 -61°（阈值 60°） | 60,70,170,180 |
| n-straddle-fold | 坐姿分腿体前屈 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 61°（阈值 42°） | 0,10,20,30 |
| n-straddle-fold | 坐姿分腿体前屈 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 61°（阈值 42°） | 0,10,20,30 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -60°（阈值 45°） | 60,70,80,90 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | S2 | rom-footVsKnee | 脚尖与膝盖朝向不一致右侧 -60°（阈值 60°） | 90,100,110,120 |
| n-windshield | 仰卧雨刷式 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 60°（阈值 42°） | 40,50,60,70 |
| n-windshield | 仰卧雨刷式 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 60°（阈值 42°） | 160,170,180,190 |
| h-band-leg-out | 仰卧弹力带单腿侧落 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -59°（阈值 45°） | 60,70,80,90 |
| h-quad-cars | 四足髋关节画圈 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -59°（阈值 45°） | 60,70,170,180 |
| h-wall-straddle | 靠墙仰卧 V 字分腿 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 58°（阈值 42°） | 60,70,80,90 |
| h-wall-straddle | 靠墙仰卧 V 字分腿 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 58°（阈值 42°） | 60,70,80,90 |
| s-lizard | 蜥蜴式低弓步 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 58°（阈值 42°） | 0,10,20,30 |
| s-pigeon | 鸽子式（直立扶砖版） | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 58°（阈值 42°） | 0,10,20,30 |
| s-pigeon | 鸽子式（直立扶砖版） | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -57°（阈值 45°） | 0,10,20,30 |
| abs-B | 平行杆团身 L 撑 | S2 | asymmetry | 双侧对称动作左右不对称 57 cm | 120,130,140,150 |
| n-straddle-fold | 坐姿分腿体前屈 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -57°（阈值 45°） | 0,10,20,30 |
| n-straddle-fold | 坐姿分腿体前屈 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -57°（阈值 45°） | 0,10,20,30 |
| n-straddle-fold | 坐姿分腿体前屈 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -57°（阈值 45°） | 0,10,20,30 |
| n-straddle-fold | 坐姿分腿体前屈 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -57°（阈值 45°） | 0,10,20,30 |
| h-quad-cars | 四足髋关节画圈 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 56°（阈值 42°） | 60,70,170,180 |
| h-db-supported-calf-raise | 单手哑铃扶墙双脚提踵 | S2 | asymmetry | 双侧对称动作左右不对称 55 cm | 0,10,20,30 |
| h-wall-straddle | 靠墙仰卧 V 字分腿 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -55°（阈值 45°） | 70,80,90,100 |
| h-wall-straddle | 靠墙仰卧 V 字分腿 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -55°（阈值 45°） | 70,80,90,100 |
| s-9090 | 90/90 坐姿换髋 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -54°（阈值 45°） | 0,10,20,30 |
| n-windshield | 仰卧雨刷式 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -54°（阈值 45°） | 40,50,60,70 |
| n-windshield | 仰卧雨刷式 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -54°（阈值 45°） | 50,60,70,80 |
| h-wall-straddle | 靠墙仰卧 V 字分腿 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -53°（阈值 45°） | 80,90,100,110 |
| h-wall-straddle | 靠墙仰卧 V 字分腿 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -53°（阈值 45°） | 80,90,100,110 |
| n-squat-shift | 低位蹲姿左右移重心 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -52°（阈值 45°） | 30,40,50,60 |
| n-squat-shift | 低位蹲姿左右移重心 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -52°（阈值 45°） | 150,160,170,180 |
| h-quad-cars | 四足髋关节画圈 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -52°（阈值 45°） | 60,70,180 |
| n-seated-ir-drop | 坐姿后撑单膝内倒 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 51°（阈值 42°） | 170,180,190,200 |
| n-seated-ir-drop | 坐姿后撑单膝内倒 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 51°（阈值 42°） | 50,60,70,80 |
| s-pigeon | 鸽子式（直立扶砖版） | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -50°（阈值 45°） | 0,10,20,30 |
| h-seated-reachback | 坐姿后撑滑臀 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致左侧 -50°（阈值 45°） | 0,10,20,30 |
| h-seated-reachback | 坐姿后撑滑臀 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -50°（阈值 45°） | 0,10,20,30 |
| h-sumo-pry | 相扑深蹲肘推膝停留 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -48°（阈值 45°） | 70,80,90,100 |
| h-sumo-pry | 相扑深蹲肘推膝停留 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -48°（阈值 45°） | 70,80,90,100 |
| s-figure4 | 仰卧 4 字拉伸 | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 -48°（阈值 45°） | 90,100,110,120 |
| s-frog | 青蛙式 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）左侧 -48°（阈值 45°） | 50,60,70,80 |
| s-frog | 青蛙式 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -48°（阈值 45°） | 50,60,70,80 |
| h-sumo-pry | 相扑深蹲肘推膝停留 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 47°（阈值 42°） | 70,80,90,190 |
| h-sumo-pry | 相扑深蹲肘推膝停留 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 47°（阈值 42°） | 70,80,90,190 |
| s-9090 | 90/90 坐姿换髋 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 46°（阈值 42°） | 0,10,20,30 |
| h-9090-liftoff | 90/90 后腿主动抬起 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 46°（阈值 42°） | 0,10,20,30 |
| deltoids-B | 哑铃半程土耳其起立（至高桥） | S2 | rom-thighFace | 膝盖（髌骨）朝向与屈膝方向不一致右侧 46°（阈值 45°） | 80,160 |
| w-fire-hydrant | 四足消防栓 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 -46°（阈值 45°） | 40,50,60,70 |
| s-figure4 | 仰卧 4 字拉伸 | S2 | rom-shinFace | 小腿拧转（胫骨前侧偏离屈膝平面）右侧 45°（阈值 45°） | 110,120,130,140 |
| w-fire-hydrant | 四足消防栓 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 43°（阈值 42°） | 40,50,60,70 |
| s-frog | 青蛙式 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）左侧 43°（阈值 42°） | 80,90,100,110 |
| s-frog | 青蛙式 | S2 | rom-kneeAxisDev | 膝关节非铰链运动（屈膝轴偏离）右侧 43°（阈值 42°） | 80,90,100,110 |
| h-chair-dip | 椅子臂屈伸 | S2 | knee-out-of-toe | 负重屈膝腿膝盖比脚尖方向往外偏 37°（左腿） | 80,200 |
| forearms-C | 壶铃倒握行走 | S2 | text-hold-moving | 文字是静态保持（hold），视频里找不到静止段（最稳的 30% 时长内仍变化 33 cm） |  |
| serratus-A | 俯撑肩胛前伸 | S2 | floor-penetration | handL 穿入地面/垫子 28 mm | 40 |
| serratus-A | 俯撑肩胛前伸 | S2 | floor-penetration | handR 穿入地面/垫子 27 mm | 40 |
| o-seated-ham | 坐姿腘绳肌前伸 | S2 | knee-valgus | 负重屈膝腿膝盖比脚尖方向往内偏 26°（左腿，屈膝 87°） | 30,40,50,60 |
| adductors-C | 绳索站姿髋内收 | S2 | foot-hover | 站定的脚悬空 24 mm（左脚） | 60,180 |
| h-doorframe-forearms-pec-native-r3 | 门框双前臂胸肌拉伸 | S2 | asymmetry | 双侧对称动作左右不对称 24 cm | 0,10,20,30 |
| h-bilateral-upper-back-hug | 双臂前抱上背拉伸 | S2 | asymmetry | 双侧对称动作左右不对称 21 cm | 0,10,20,30 |
| h-sumo-pry | 相扑深蹲肘推膝停留 | S2 | knee-valgus | 负重屈膝腿膝盖比脚尖方向往内偏 20°（左腿，屈膝 114°） | 40,50,60,160 |
| h-supine-cactus-chest | 仰卧仙人掌开胸 | S2 | floor-penetration | footR 穿入地面/垫子 19 mm | 0 |
| h-supine-cactus-chest | 仰卧仙人掌开胸 | S2 | floor-penetration | footL 穿入地面/垫子 19 mm | 0 |
| h-supine-cactus-chest | 仰卧仙人掌开胸 | S2 | floor-penetration | forearmL 穿入地面/垫子 19 mm | 0 |
| h-supine-cactus-chest | 仰卧仙人掌开胸 | S2 | floor-penetration | forearmR 穿入地面/垫子 18 mm | 0 |
| h-supine-cactus-chest | 仰卧仙人掌开胸 | S2 | floor-penetration | torso 穿入地面/垫子 18 mm | 60 |
| h-couch-stretch | 沙发拉伸（后脚搭矮凳） | S2 | knee-valgus | 负重屈膝腿膝盖比脚尖方向往内偏 17°（右腿，屈膝 84°） | 0,10,20,30 |
| h-supine-cactus-chest | 仰卧仙人掌开胸 | S2 | floor-penetration | upperArmR 穿入地面/垫子 17 mm | 30 |
| h-supine-cactus-chest | 仰卧仙人掌开胸 | S2 | floor-penetration | upperArmL 穿入地面/垫子 16 mm | 0 |
| h-supine-cactus-chest | 仰卧仙人掌开胸 | S2 | floor-penetration | pelvis 穿入地面/垫子 16 mm | 0 |
| o-seated-catcow | 坐姿猫牛式 | S2 | knee-valgus | 负重屈膝腿膝盖比脚尖方向往内偏 15°（左腿，屈膝 88°） | 180,190,200 |
| h-side-leg-raise | 站姿侧抬腿 | S2 | com-outside-support | 重心投影落在支撑面外 6 cm（静力上站不住） | 30,40,50,60 |
| hamstrings-A | 徒手单腿罗马尼亚硬拉 | S2 | com-outside-support | 重心投影落在支撑面外 5 cm（静力上站不住） | 0,10,20,100 |
| h-wall-palm-lift | 墙面指端接触掌根抬起诊断 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 3.3 cm） |  |
| h-pike-scapular-elevation | 派克位直臂肩带提压 | S2 | text-reps-static | 文字是做次数（rep_updown），视频几乎不动（最大位移 3.0 cm） |  |
| h-db-calf-raise | 双哑铃站姿提踵 | S2 | text-reps-static | 文字是做次数（rep_updown），视频几乎不动（最大位移 1.9 cm） |  |
| scapular-B | 单杠肩胛引体 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 1.5 cm） |  |
| n-seated-squeeze | 坐姿夹砖（膝内夹） | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 1.2 cm） |  |
| h-bent-knee-calf-raise | 屈膝承重提踵 | S2 | text-reps-static | 文字是做次数（rep_updown），视频几乎不动（最大位移 0.5 cm） |  |
| h-tib-raise | 靠墙勾脚尖 | S2 | text-reps-static | 文字是做次数（rep_updown），视频几乎不动（最大位移 0.3 cm） |  |
| lats-C | 双杠支撑耸肩下压 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 0.3 cm） |  |
| h-sumo-pry | 相扑深蹲肘推膝停留 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 21 cm（膝内扣，左腿） | 0,0,10,10 |
| adductors-A | 哥萨克蹲 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 7 cm（膝内扣，左腿） | 20,100,140,220 |
| h-lateral-step-lunge | 侧跨步弓步蹲 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 7 cm（膝内扣，左腿） | 70,76,80,90 |
| o-seated-catcow | 坐姿猫牛式 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 6 cm（膝内扣，左腿） | 0,0,10,10 |
| forearms-B | 哑铃腕屈 + 腕伸 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 6 cm（膝内扣，左腿） | 0,0,10,10 |
| h-couch-stretch | 沙发拉伸（后脚搭矮凳） | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 6 cm（膝内扣，右腿） | 0,10,20,30 |
| o-seated-calf-raise | 坐椅提踵 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 6 cm（膝内扣，左腿） | 0,0,10,10 |
| h-half-kneeling-quad-stretch | 半跪姿手拉脚股四头肌拉伸 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 5 cm（膝内扣，右腿） | 0,10,20,30 |
| o-seated-fig4 | 坐姿四字前压 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 5 cm（膝内扣，左腿） | 40,50,60,70 |
| deltoids-C | 地雷杆半跪单臂推举 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 4 cm（膝内扣，左腿） | 0,10,20,30 |
| o-stand-crossreach | 扶椅站姿交叉侧伸 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 4 cm（膝内扣，左腿） | 60,70,80,90 |
| s-kneel-hipflex | 半跪髋屈肌拉伸 | S2 | knee-inside-foot | 负重屈膝时膝盖落在脚的内侧 4 cm（膝内扣，右腿） | 0,10,20,30 |
| forearms-B | 哑铃腕屈 + 腕伸 | S2 | text-reps-static | 文字是做次数（rep_updown），视频几乎不动（最大位移 0.0 cm） |  |
| h-db-overhead-shrug | 双哑铃过头耸肩 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 0.0 cm） |  |
| h-db-shrug | 双哑铃站姿耸肩 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 0.0 cm） |  |
| h-standing-forearm-rotation | 站姿屈肘前臂旋转 | S2 | text-reps-static | 文字是做次数（rep_updown），视频几乎不动（最大位移 0.0 cm） |  |
| h-standing-wrist-deviation | 站姿屈肘腕侧偏控制 | S2 | text-reps-static | 文字是做次数（rep_updown），视频几乎不动（最大位移 0.0 cm） |  |
| h-standing-wrist-extensor-stretch | 站姿主动腕伸肌拉伸 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 0.0 cm） |  |
| h-supine-cactus-chest | 仰卧仙人掌开胸 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 0.0 cm） |  |
| o-supported-ankle-eversion | 扶椅悬空足外翻控制 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 0.0 cm） |  |
| o-supported-ankle-inversion | 扶椅悬空足内翻控制 | S2 | text-reps-static | 文字是做次数（rep_hold），视频几乎不动（最大位移 0.0 cm） |  |
| o-supported-ankle-pump | 扶椅悬空踝屈伸 | S2 | text-reps-static | 文字是做次数（rep_cycle），视频几乎不动（最大位移 0.0 cm） |  |

## 已判误报

- abs-A：躺姿四肢悬空 2–3 cm 触发重心规则，已判误报（重心规则已改为只判站/跪姿）
- h-open-book|floor-penetration：地面高度误取了道具顶面（木块/椅面/靠垫，floorY>0.05），看图人在垫上/椅上，无穿地
- n-half-split|floor-penetration：地面高度误取了道具顶面（木块/椅面/靠垫，floorY>0.05），看图人在垫上/椅上，无穿地
- n-straddle-fold|floor-penetration：地面高度误取了道具顶面（木块/椅面/靠垫，floorY>0.05），看图人在垫上/椅上，无穿地
- n-seated-squeeze|floor-penetration：地面高度误取了道具顶面（木块/椅面/靠垫，floorY>0.05），看图人在垫上/椅上，无穿地
- h-supine-bilateral-leg-raise|floor-penetration：地面高度误取了道具顶面（木块/椅面/靠垫，floorY>0.05），看图人在垫上/椅上，无穿地
- o-seated-ham|knee-inside-foot：坐在椅上，腿不负重；伸腿/内旋是动作本身，不算膝内扣
- o-chair-knee-extension|knee-inside-foot：坐在椅上，腿不负重；伸腿/内旋是动作本身，不算膝内扣
- o-seated-hip-er|knee-inside-foot：坐在椅上，腿不负重；伸腿/内旋是动作本身，不算膝内扣
- n-chair-wiper|knee-inside-foot：坐在椅上，腿不负重；伸腿/内旋是动作本身，不算膝内扣
- n-chair-wiper|knee-valgus：坐姿雨刷：膝内倒就是动作内容，腿不负重
- h-floor-nordic-hand-reset|*：已判误报：跪姿膝铰链测量方向错误，看图膝/小腿/脚背贴地正常
- abs-A|*：躺姿四肢悬空 2–3 cm 触发重心规则，已判误报
- s-lizard|floor-penetration：地面高度误取了瑜伽砖顶面（floorY>0.05），看图人在垫上，无穿地
- s-pigeon|floor-penetration：地面高度误取了瑜伽砖顶面（floorY>0.05），看图人在垫上，无穿地
- quadriceps-A|com-outside-support：高跪姿：膝、小腿、脚背都贴地，支撑面应含小腿，看图站得住；规则只按脚/手算支撑面
- n-squat-shift|knee-inside-foot：侧移深蹲伸直侧腿外展，膝在脚内侧是动作本身，不负重
- n-squat-shift|knee-valgus：同上，伸直侧腿
- h-db-calf-raise|com-outside-support：看图直立站稳；踮脚时支撑面只取了前脚掌少数点，重心规则误判
- h-kneeling-pushup|com-outside-support：跪姿俯卧撑：膝着地也是支撑点，看图稳定；规则只按手脚算支撑面
