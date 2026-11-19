# 托马斯补充 12 个动作：进 r2-v19 前待开哥确认的草稿

全部是 AI 草稿（`reviewStatus: draft-ai-needs-user-review`），build 原样写进目录。渠道指针不切，App 看不到；开哥改哪条，改对应文件后重跑任务卡 E（语音）起即可。

- 文字（名称、用途、要领、常见错误、注意、相位口令、剂量、节奏）：`catalog/production/thomas-supplement-r1/text/<id>.json`（样片阶段已写，本分支未改）
- **新写**的讲解语音稿 voiceGuide：同一文件的 `voiceGuide`（本分支新增，按 STYLE §8「讲解不是指挥」，text.py 校验 0 错、节拍词 0）
- **新写**的目录字段：`tools/thomas-sup/publish/pack-fields.json`

| 动作 | 肌群（目录） | 器械 | 体位 | 类别 | 剂量范围 | 禁忌 | 替代 | 讲解句（voiceGuide 自写句） |
|---|---|---|---|---|---|---|---|---|
| 俯卧撑加推 `t-pushup-plus` | 前锯肌、斜方肌中下部 · 菱形肌 | 徒手 | 俯卧/俯撑 | 力量 | sets 3–3；reps 10–12；restSeconds 60–60 | 肩 | t-kneeling-scap-pushup | 手肘锁直，只动肩胛骨 / Elbows locked, only shoulder blades move<br>肩离耳朵远，头别往前探 / Shoulders away from ears, head in line |
| 跪姿肩胛俯卧撑 `t-kneeling-scap-pushup` | 前锯肌、斜方肌中下部 · 菱形肌 | 瑜伽垫 | 跪姿 | 力量 | sets 3–3；reps 10–12；restSeconds 60–60 | 膝 | — | 手肘锁直，靠肩胛骨推地 / Elbows locked, shoulder blades push the floor<br>屁股别往后坐，腰也别塌 / Hips stay forward, no sagging back |
| 蛙立 `t-frog-stand` | 前臂 · 腕屈伸肌、三角肌 | 瑜伽垫 | 俯卧/俯撑 | 力量 | sets 3–5；seconds 10–20；restSeconds 60–90 | 手腕 | — | 肩膀往前往下沉，手指抓地 / Shoulders forward and down, fingers grip |
| 俄挺前倾 `t-planche-lean` | 三角肌、前锯肌、前臂 · 腕屈伸肌 | 瑜伽垫 | 俯卧/俯撑 | 力量 | sets 3–4；seconds 10–15；restSeconds 60–120 | 手腕 | — | 手臂锁直，把地推开，肩往下压 / Arms locked, push the floor, shoulders down |
| 分腿俄挺 `t-straddle-planche` | 三角肌、前锯肌、腹直肌（含深层腹横肌） | 瑜伽垫 | 俯卧/俯撑 | 力量 | sets 3–5；seconds 3–8；restSeconds 90–120 | 手腕、肩 | t-tuck-planche | （5 秒定住，只报 3-2-1） |
| 双杠支撑摆动 `t-pbar-support-swing` | 肱三头肌、三角肌 | 双杠 | 器械支撑（平行杆/双杠/吊环） | 力量 | sets 3–3；reps 10–20；restSeconds 60–60 | 肩 | — | 手臂锁直，肩在手正上方 / Arms locked, shoulders right over hands<br>肩到脚一根棍，别折腰 / One stiff line, no bending at hips |
| 悬垂举腿 `t-hanging-leg-raise` | 髋屈肌、腹直肌（含深层腹横肌） | 单杠 | 悬垂 | 力量 | sets 3–3；reps 8–12；restSeconds 60–90 | — | — | 肩往下压，别整个人挂着 / Shoulders pulled down, no dead hang<br>腿并拢伸直，身体别晃 / Legs straight together, body stays still |
| 分腿坐姿抬腿 `t-straddle-active-lift` | 内收肌群、臀中肌 · 髋外展、髋屈肌 | 瑜伽垫 | 坐姿 | 灵活/活动度 | sets 3–3；reps 6–10；restSeconds 45–45 | — | — | 膝盖脚尖朝天，腿别往里转 / Knees and toes up, no rolling in<br>背挺直，手只是搭在地上 / Back tall, hands just resting on the floor |
| 后撑肩部滑行 `t-seated-shoulder-ext-slide` | 三角肌、胸大肌、肱二头肌 | 瑜伽垫 | 坐姿 | 灵活/活动度 | sets 3–3；reps 6–8；restSeconds 60–90 | 肩 | — | 手掌贴死地面，肩膀往下沉 / Palms flat, shoulders pressed down<br>下巴微收，眼睛看前面 / Chin tucked a little, eyes forward |
| 自阻力手腕上卷 `t-self-resisted-wrist-flexion` | 前臂 · 腕屈伸肌 | 椅子/凳子 | 坐姿 | 力量 | sets 2–3；reps 8–12；restSeconds 45–45 | 手腕 | — | 前臂贴着大腿，只有手腕在动 / Forearm on your thigh, only the wrist moves<br>上面那只手一直给阻力 / The top hand keeps pushing against it |
| 自阻力手腕上抬 `t-self-resisted-wrist-extension` | 前臂 · 腕屈伸肌 | 椅子/凳子 | 坐姿 | 力量 | sets 2–3；reps 8–12；restSeconds 45–45 | 手腕 | — | 手肘和肩不动，只抬手背 / Elbow and shoulder still, only the hand lifts<br>压手背的手别松劲 / The pressing hand never lets up |
| 坐姿哑铃翻手腕 `t-seated-forearm-rotation` | 前臂 · 腕屈伸肌 | 哑铃、椅子/凳子 | 坐姿 | 力量 | sets 2–3；reps 10–12；restSeconds 45–45 | — | — | 前臂贴住大腿，只翻手掌 / Forearm stays down, only the palm turns<br>手腕伸平，整条前臂在转 / Wrist stays flat, the whole forearm turns |

需要开哥拍板的点：
1. 文字整体（含新写的 20 句讲解）是否可用；不审直接用草稿也行，但目录会标成未审。
2. 目录里这 12 个动作 `apps` 先留空（不标 flarelab），`tags` = thomas、thomas:supplement-r1；托马斯 App 决定接入时再标、再加进 Flare 白名单。
3. 腕屈/腕伸/前臂旋转的器械按「椅子/凳子」记（文字稿 tags 写的是训练凳 bench）；前臂旋转加哑铃 → 场景只算健身房（说明里写可用锤子/水瓶代替）。
4. 蛙立、俄挺前倾、分腿俄挺的体位按目录现有「俯卧/俯撑」（同团身俄挺）；类别都按「力量」（文字稿 tags 写蛙立是 balance，目录词表没有平衡）。
5. 替代动作只填了文字稿里明说的退阶：俯卧撑加推 → 跪姿肩胛俯卧撑，分腿俄挺 → 团身俄挺（库里已有）；其余为空。
6. 说明里没写休息时间的（腕部三项、双杠摆动）剂量范围的休息按默认值单点记。
