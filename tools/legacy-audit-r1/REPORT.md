# 旧动作准确性审计 r1 终版报告（2026-11-21，hark-sk）

## 结论
- 全库 251 个旧动作全部实测（V5 世界空间几何 + 逐动作标准 + 多视角出图），再逐条独立看图评审，剔除误报。
- **严重级（动作本身）7 个**：h-short-side-plank、s-9090、h-squat、deltoids-B（第 1 批，已修、已复核、样片已出）；adductors-A（已修 @921c1b3，样片随第 2 批）；**新增 2 个**：o-supported-march（文不对题，交替抬膝只抬一侧）、n-squat-shift（宽站蹲膝朝向与屈膝方向差 74°，与 h-squat 同型）→ 第 3 批。
- **模型级裆部鼓包**：严重 52 个（≥32 mm），明显 59 个。V5 皮肤层一次修（第 2 批 crotchfix-v5-r1 @5ada6bc，QUA 验收集 32 个已 <28 mm）；需把验收扩到下列全部严重级。
- **明显级（动作）64 个**，其中 15 个是「待看图确认」（坐/躺姿髋大幅旋转时角度规则存疑，已从严重降为明显）。
- 误报 19 条已剔除（见下）。

## 为什么前几轮会漏、这轮怎么改的
1. 以前只看关节角/少量视角，这轮按每个动作写「正确长什么样」的标准（standards/），在世界空间量膝-脚朝向、膝在脚内/外侧、重心与支撑面、脚离地/穿地、文字与视频是否换边、裆部网格鼓包。
2. 用开哥点名的 4 个缺陷做阳性校准（全抓到且原因对），Flare 新动作做阴性对照（动作级全过），据此定阈值（CALIBRATION.md）。
3. 机器判完再人工看多视角关键帧（正/侧/俯/裆部特写）逐条评审，把规则的系统性误报（道具顶面当地面、坐姿腿不负重、跪姿支撑面漏膝）剔掉，避免让修复方白忙。
4. 已知规则局限（下一轮改）：地面高度要排除木块/椅面；跪姿/高跪支撑面要算膝和小腿；髋大幅旋转时膝朝向要先扣除髋旋转。

## 模型级裆部严重级动作（52 个）
deltoids-C, glute-max-B, h-9090-liftoff, h-adductor-rock, h-band-leg-out, h-bulgarian, h-chair-dip, h-chair-progressive-front-split-native, h-chair-step-up, h-couch-stretch, h-db-row, h-donkey-kick, h-goblet-squat, h-half-kneeling-quad-stretch, h-kb-swing, h-mountain-climber, h-quad-cars, h-reverse-lunge, h-russian-twist, h-seated-reachback, h-squat, h-sumo-pry, h-wall-straddle, hamstrings-A, hip-abductors-B, hip-abductors-C, hip-flexors-B, n-chair-wiper, n-half-split, n-leg-circles, n-seated-ir-drop, n-squat-shift, n-straddle-fold, n-thomas-test, n-wide-fold, o-seated-fig4, obliques-A, s-9090, s-butterfly, s-figure4, s-frog, s-kneel-hipflex, s-pigeon, t-lsit-tuck, t-lsit-vsit-circles, t-seated-straddle-ext, t-seated-straddle-lifts, t-straddle-hold, w-bird-dog, w-dead-bug, w-fire-hydrant, w-wall-sit

## 待看图确认（明显级，修前先看图）
- h-9090-liftoff：坐/躺姿或抬腿髋旋转类：多视角图膝、小腿外形自然，角度规则在髋大幅旋转/膝接近伸直时把髋旋转记到膝上，存疑；降为明显级，修前先看图确认
- h-band-leg-out：坐/躺姿或抬腿髋旋转类：多视角图膝、小腿外形自然，角度规则在髋大幅旋转/膝接近伸直时把髋旋转记到膝上，存疑；降为明显级，修前先看图确认
- h-butterfly-active：坐/躺姿或抬腿髋旋转类：多视角图膝、小腿外形自然，角度规则在髋大幅旋转/膝接近伸直时把髋旋转记到膝上，存疑；降为明显级，修前先看图确认
- h-hip-gate：坐/躺姿或抬腿髋旋转类：多视角图膝、小腿外形自然，角度规则在髋大幅旋转/膝接近伸直时把髋旋转记到膝上，存疑；降为明显级，修前先看图确认
- h-inner-thigh：多视角图膝、小腿外形自然；角度规则在髋大幅旋转时把髋旋转记到膝上，存疑；降为明显级，修前先看图确认
- h-quad-cars：多视角图膝、小腿外形自然；角度规则在髋大幅旋转时把髋旋转记到膝上，存疑；降为明显级，修前先看图确认
- h-russian-twist：多视角图膝、小腿外形自然；角度规则在髋大幅旋转时把髋旋转记到膝上，存疑；降为明显级，修前先看图确认
- h-sumo-pry：只在起始 0–30 帧过渡段出现，到底帧看图膝在脚上方；降为明显级
- h-wall-straddle：坐/躺姿髋旋转类：看多视角图膝、小腿外形自然，角度规则在髋大幅外/内旋时把髋旋转记到膝上，存疑；降为明显级，修前先看裆部特写/正面图确认
- n-seated-ir-drop：坐/躺姿髋旋转类：看多视角图膝、小腿外形自然，角度规则在髋大幅外/内旋时把髋旋转记到膝上，存疑；降为明显级，修前先看裆部特写/正面图确认
- n-straddle-fold：坐/躺姿髋旋转类：看多视角图膝、小腿外形自然，角度规则在髋大幅外/内旋时把髋旋转记到膝上，存疑；降为明显级，修前先看裆部特写/正面图确认
- n-windshield：坐/躺姿髋旋转类：看多视角图膝、小腿外形自然，角度规则在髋大幅外/内旋时把髋旋转记到膝上，存疑；降为明显级，修前先看裆部特写/正面图确认
- s-butterfly：坐/躺姿髋旋转类：看多视角图膝、小腿外形自然，角度规则在髋大幅外/内旋时把髋旋转记到膝上，存疑；降为明显级，修前先看裆部特写/正面图确认
- s-lizard：坐/躺姿髋旋转类：看多视角图膝、小腿外形自然，角度规则在髋大幅外/内旋时把髋旋转记到膝上，存疑；降为明显级，修前先看裆部特写/正面图确认
- s-pigeon：坐/躺姿髋旋转类：看多视角图膝、小腿外形自然，角度规则在髋大幅外/内旋时把髋旋转记到膝上，存疑；降为明显级，修前先看裆部特写/正面图确认

## 误报（不用修）
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

## 文件
- findings.json：全部问题（含证据数值、关键帧、修法、评审结论）；FINDINGS-LIVE.md/.json：按 P0/P1/M/P2 排好的修复清单。
- review.json：独立评审结论；拼图在 /workspace/work/legacy-audit-r1/out/（S1/S2 × 动作/模型）。
