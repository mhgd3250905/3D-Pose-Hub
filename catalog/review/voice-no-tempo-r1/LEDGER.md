# voice-no-tempo-r1 台账：voiceGuide 去掉节拍口令，只留报数 + 要领讲解

- 依据：开哥 2026-11-14 23:45/23:47 测 SF 反馈——比如哥萨克蹲，每次计数之间念「蹲过去、踩住」，没必要；用户会按语音节奏去做，他不希望干扰用户自己的动作速度和训练节奏。计数（1 2 3 4…）保留，先用正常动作的标准计数，哪些偏快他后面再调；只增加「这个动作怎么做」的引导性说明。复述「讲解不是指挥——只说怎么做对，不带『现在做什么』的动作指令，也不跟着每次计数踩点播」，开哥确认。
- 推翻 r3 的两条：「前 2 下念相位」（STYLE §8，开哥 2026-11-13）、「超长单次每步念口令」（开哥 2026-11-14）。
- 基线：main a6573f1（= 线上 r2-v15 的 voiceGuide 文字）。改前原文逐动作存 `orig.json`（voiceGuide、training.phases、review 三段原样），每动作核对记录 `<id>.md`，发布要重合成的条目 `resynth.json`。
- 规则写进 `catalog/production/v3-text/STYLE.md` §2/§6/§8（「讲解不是指挥」），校验在 `tools/action-package-v3/text.py`（`--tempo`），发包约定 `docs/voice-guide-pack-contract.md` §3/§4。

## 改了什么
1. **相位口令**：187 个次数类动作 `voiceGuide.phaseCues` → `none`，`training.phases` 去掉 `cue`（共 555 个 `phase.*` 绑定；原来每组前 2 下要念约 1104 句）。phases 文字（start/peak/end）留在 JSON，不再念。
2. **步骤口令**：deltoids-B（半程土耳其起立）去掉 `phaseCues: steps` 的 7 句每下步骤口令，改成第 1 下后 1 句讲顺序和要点。
3. **引导句**：改前 611 句自写句，其中 359 句命中节拍/速度词或是短口令。改后 501 句 = 原句保留 227 + 新写/改写 274；被删或被替换的原句 382。
   - 次数类：每组最多 2 句、两句至少隔 2 下，内容只讲姿势/发力点/范围/常见错；壶铃摆荡（一下 2 秒）放不下，只报数。
   - 计时类：位置不变（防冷场仍每 8–10 秒一句），把「呼气，再沉一点」「慢慢走」这类指令改成要领或条件句（「想拉得更开，胯往外推」）。
4. 报数、倒数、「最后一次」、换边、休息等共用词全部不动。
5. 改动动作 238/249（187 个次数类全改；计时类 51 个改了句子，11 个原句都是要领、不动）。每个改动动作在 JSON `review["voice-no-tempo-r1"]` 记一句。

## 校验
- `python3 tools/action-package-v3/text.py`：checked 249，failed 0，warnings 0，weakWords 0，**tempoHits 0**
- `python3 tools/action-package-v3/text.py --dupes`：**dupeSentences 0**（≥4 个动作重复的自写句子），dupeCommands 66（≤4 字口令单列，不算套话）
- `python3 tools/ai-tags/validate.py`：OK（249/249）
- `python3 -m unittest discover -s media/tests`：45 OK
- `node drill-anim/verify.mjs`：main 上本来就失败（Unreviewed action spec: abs-A-r3.js，与本改动无关）；`drill-anim/test_portability.py` 需要本机 `drill-anim/config.json`，沙箱没有，未跑。本改动不碰 drill-anim。

## 发布要做的（本 PR 不做）
- 重合成引导句语音：193 个动作、557 个片段（中文 280、英文 277；clipId 按数组下标，同一句挪了位置也要按新 clipId 出文件，TTS 可走缓存）；作废 240 个旧片段（含 deltoids-B `g.step.0–6`）。逐条见 `resynth.json`。
- name / primaryCue / phase.* / 共用词：都不用重合成。
- 发包脚本：`phaseCues: none` 在现有 SDK（036b5fcd）上会让整个 voiceGuide 回退旧逻辑，发包时先写成 `first-2-reps`（`rhythm.execution.phases` 已没有 `@phase.*`，效果相同），或等 SDK 接 `none`。见约定 §4。

## 每动作
| id | 名称 | 类型 | 删相位绑定 | 删步骤句 | 引导句 改前→改后 | 原句命中 | 新写/改写 | 删/替换 | 要重合成片段 |
|---|---|---|---|---|---|---|---|---|---|
| abs-A | 空心体支撑 | hold | 0 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| abs-B | 平行杆团身 L 撑 | hold | 0 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| abs-C | 双杠直臂支撑举腿 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| adductors-A | 哥萨克蹲 | reps | 3 | 0 | 1→2 | 1 | 2 | 1 | 4 |
| adductors-B | 屈膝哥本哈根侧撑 | hold | 0 | 0 | 2→2 | 0 | 0 | 0 | 0 |
| adductors-C | 绳索站姿髋内收 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| chest-A | 俯卧撑转侧撑 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| chest-B | 平行杆深幅俯卧撑 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| chest-C | 绳索单臂站姿推胸 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| deltoids-A | 直臂侧平板沉髋 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| deltoids-B | 哑铃半程土耳其起立 | reps | 3 | 7 | 0→1 | 0 | 1 | 0 | 2 |
| deltoids-C | 地雷杆半跪单臂推举 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| erectors-A | 反向平板抬髋 | reps | 3 | 0 | 3→2 | 0 | 0 | 1 | 0 |
| erectors-B | 瑞士球背伸 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| erectors-C | 45° 罗马椅背伸 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| forearms-A | 跪姿多方向腕部摇摆 | reps | 3 | 0 | 5→2 | 5 | 2 | 5 | 4 |
| forearms-B | 坐姿哑铃上下卷腕 | reps | 3 | 0 | 4→2 | 2 | 1 | 2 | 2 |
| forearms-C | 壶铃倒握行走 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| g-cable-hip-abduction | 低位绳索髋外展 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| g-cable-hip-extension | 低位绳索髋后伸 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| glute-max-A | 单腿臀桥 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| glute-max-B | 弹力带四足直腿后踢 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 4 |
| glute-max-C | 反向背伸机 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-9090-liftoff | 90/90 后腿主动抬起 | reps | 3 | 0 | 2→2 | 0 | 0 | 0 | 0 |
| h-adductor-rock | 四足单腿侧伸后摇 | reps | 3 | 0 | 2→2 | 0 | 0 | 0 | 0 |
| h-banana | 仰卧香蕉式侧弯 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-band-biceps-curl | 站姿踩带弹力带弯举 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-band-chest-fly | 站姿单臂弹力带夹胸 | reps | 3 | 0 | 2→2 | 0 | 0 | 0 | 0 |
| h-band-face-pull | 站姿弹力带面拉 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 2 |
| h-band-hip-extension | 扶椅弹力带后抬腿 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| h-band-hip-ir | 坐姿弹力带脚向外摆 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| h-band-leg-out | 仰卧弹力带单腿向外落 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-band-pallof | 弹力带抗旋转推 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| h-band-pull-apart | 弹力带水平拉开 | reps | 3 | 0 | 4→2 | 3 | 1 | 3 | 2 |
| h-band-row | 弹力带坐姿划船 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| h-band-shoulder-ir | 弹力带站姿手臂内转 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-band-standing-abduction | 扶椅弹力带侧抬腿 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| h-band-standing-adduction | 扶椅弹力带向里并腿 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| h-band-stepout | 弹力带抗旋转侧步 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| h-band-straight-leg-raise | 扶椅弹力带直腿前抬 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-band-triceps-pressdown | 站姿单臂弹力带下压 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-bear-plank | 熊式支撑 | hold | 0 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-bent-knee-calf-raise | 屈膝踮脚 | reps | 3 | 0 | 4→2 | 2 | 1 | 2 | 2 |
| h-biceps-self | 双手对抗弯举 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| h-bilateral-farmer-hold-native | 双哑铃农夫站姿保持 | hold | 0 | 0 | 3→3 | 3 | 3 | 3 | 6 |
| h-bilateral-upper-back-hug | 双臂环抱上背拉伸 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| h-bridge-march | 臀桥交替踏步 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-bridge-overhead | 臀桥过头伸臂 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-bulgarian | 椅子保加利亚分腿蹲 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-butterfly-active | 仰卧蝴蝶式开合腿 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-calf-raise | 扶墙提踵 | reps | 3 | 0 | 4→2 | 2 | 1 | 3 | 2 |
| h-catcow-quad | 跪撑猫牛式 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-chair-dip | 椅子反撑 | reps | 3 | 0 | 3→2 | 1 | 1 | 2 | 2 |
| h-chair-elbow-triceps-stretch | 扶椅屈肘手臂后侧拉伸 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| h-chair-kickback | 扶椅站姿后踢腿 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 1 |
| h-chair-lat | 扶椅侧背拉伸 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| h-chair-progressive-front-split-native | 扶椅渐进前后劈叉 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-chair-single-leg-hip-thrust | 肩靠椅单腿臀推 | reps | 3 | 0 | 3→2 | 0 | 0 | 1 | 0 |
| h-chair-sit-to-stand | 椅子坐下站起 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-chair-step-up | 椅子上步 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-chair-tspine | 跪姿扶椅开上背 | reps | 3 | 0 | 2→2 | 0 | 0 | 0 | 0 |
| h-close-stance-forward-fold-native | 并脚站立体前屈 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-cobra | 眼镜蛇式 | reps | 3 | 0 | 2→2 | 0 | 0 | 0 | 0 |
| h-couch-stretch | 后脚搭凳沙发拉伸 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| h-crossbody | 交叉臂肩后侧拉伸 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| h-crunch | 卷腹 | reps | 3 | 0 | 4→2 | 4 | 2 | 4 | 4 |
| h-db-calf-raise | 双哑铃站姿提踵 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| h-db-curl | 哑铃交替弯举 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-db-floor-fly | 哑铃地板飞鸟 | reps | 3 | 0 | 3→2 | 0 | 0 | 1 | 0 |
| h-db-floor-press | 哑铃地板卧推 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-db-front-raise | 站姿双哑铃前平举 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-db-hammer-curl | 站姿双哑铃锤式弯举 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-db-kickback | 俯身哑铃后伸臂 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-db-lateral | 哑铃侧平举 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 4 |
| h-db-overhead-shrug | 双哑铃过头耸肩 | reps | 3 | 0 | 3→2 | 1 | 1 | 2 | 2 |
| h-db-overhead-triceps-extension | 单臂哑铃过头臂屈伸 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| h-db-press | 站姿哑铃推举 | reps | 3 | 0 | 3→2 | 0 | 0 | 1 | 2 |
| h-db-rdl | 哑铃罗马尼亚硬拉 | reps | 3 | 0 | 3→2 | 0 | 0 | 1 | 0 |
| h-db-reverse-curl | 站姿哑铃反握弯举 | reps | 3 | 0 | 3→2 | 2 | 2 | 3 | 4 |
| h-db-reverse-fly | 哑铃俯身飞鸟 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| h-db-row | 扶椅单臂哑铃划船 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 4 |
| h-db-shrug | 双哑铃站姿耸肩 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-db-split-squat | 双哑铃原地分腿蹲 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-db-supported-calf-raise | 扶墙哑铃提踵 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-db-zottman-curl | 站姿哑铃翻掌弯举 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-dd-shoulder | 下犬式压肩 | hold | 0 | 0 | 3→3 | 0 | 0 | 0 | 0 |
| h-donkey-kick | 跪撑屈膝后踢腿 | reps | 3 | 0 | 3→2 | 1 | 1 | 2 | 2 |
| h-doorframe-forearms-pec-native-r3 | 门框双前臂胸部拉伸 | hold | 0 | 0 | 3→3 | 0 | 0 | 0 | 0 |
| h-fixed-bar-vertical-pull | 单杠半程引体向上 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| h-floor-nordic-hand-reset | 跪姿北欧挺（手撑推回） | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| h-forearm-plank | 前臂平板支撑 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| h-forward-lunge | 前跨步弓步蹲 | reps | 3 | 0 | 2→2 | 0 | 1 | 1 | 2 |
| h-goblet-squat | 壶铃高脚杯深蹲 | reps | 3 | 0 | 3→2 | 1 | 1 | 2 | 2 |
| h-good-morning | 徒手早安式 | reps | 3 | 0 | 3→2 | 0 | 0 | 1 | 0 |
| h-half-kneeling-quad-stretch | 半跪手拉脚大腿前侧拉伸 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-hip-gate | 扶椅站姿开髋门 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| h-incline-pushup | 扶凳上斜俯卧撑 | reps | 3 | 0 | 3→2 | 0 | 0 | 1 | 0 |
| h-inner-thigh | 侧卧大腿内侧抬腿 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-kb-swing | 单臂壶铃摆荡 | reps | 3 | 0 | 3→0 | 3 | 0 | 3 | 0 |
| h-knee-hug | 仰卧抱膝 | hold | 0 | 0 | 3→3 | 0 | 0 | 0 | 0 |
| h-knee-wall-dorsiflexion-native | 膝盖碰墙脚踝活动 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-kneeling-instep-stretch | 跪姿脚背拉伸 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-kneeling-pushup | 跪姿俯卧撑 | reps | 3 | 0 | 3→2 | 0 | 0 | 1 | 0 |
| h-kneeling-thread-needle | 跪姿穿针 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| h-lateral-step-lunge | 侧跨步弓步蹲 | reps | 3 | 0 | 2→2 | 0 | 0 | 0 | 0 |
| h-mountain-climber | 慢速登山跑 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| h-open-book | 侧卧开书式 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| h-overhead-triceps-stretch | 站姿过头手臂后侧拉伸 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-pike-pushup | 派克俯卧撑 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-pike-scapular-elevation | 派克位直臂耸肩 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| h-plank-side-step | 直臂俯撑交替侧点地 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| h-quad-cars | 跪撑抬膝画圈 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| h-quadruped-open | 跪撑单臂开胸 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| h-quadruped-rockback | 跪撑平背后坐 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-reverse-clam | 侧卧反向蚌式 | reps | 3 | 0 | 3→2 | 1 | 1 | 2 | 2 |
| h-reverse-crunch | 反向卷腹 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| h-reverse-lunge | 后撤步弓步蹲 | reps | 3 | 0 | 2→2 | 0 | 0 | 0 | 0 |
| h-russian-twist | 俄罗斯转体 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-seated-reachback | 坐姿后撑滑臀 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-short-side-plank | 屈膝侧平板 | hold | 0 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| h-side-er | 侧卧手臂向外转 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| h-side-leg-raise | 站姿侧抬腿 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| h-slider-body-saw | 直臂滑盘前后滑 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| h-squat | 徒手深蹲 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| h-standing-arm-extension-stretch | 站姿双臂后抬开肩 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| h-standing-forearm-rotation | 站姿屈肘前臂旋转 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 3 |
| h-standing-wrist-deviation | 站姿手腕侧摆 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| h-standing-wrist-extensor-stretch | 站姿前臂背侧拉伸 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| h-step-jack | 低冲击开合跳 | reps | 2 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| h-straight-arm-hang-native | 单杠直臂悬垂 | hold | 0 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-suitcase-hold | 单手提哑铃站立 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-suitcase-march | 单手提哑铃踏步 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-sumo-pry | 相扑深蹲肘推膝停留 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-superman | 俯卧超人式 | reps | 3 | 0 | 3→2 | 2 | 2 | 3 | 4 |
| h-supine-bilateral-leg-raise | 仰卧双直腿举腿 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-supine-cactus-chest | 仰卧仙人掌开胸 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| h-supine-heel-slide | 仰卧脚跟滑 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-supine-twist | 仰卧屈膝扭转 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| h-supported-single-leg-calf | 扶墙单腿提踵 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-tabletop | 桌面式后撑抬髋 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| h-tib-raise | 靠墙勾脚尖 | reps | 3 | 0 | 4→2 | 3 | 1 | 3 | 2 |
| h-towel-behind | 背后握毛巾抬臂 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| h-towel-isometric-curl | 脚踩毛巾静力弯举 | hold | 0 | 0 | 2→2 | 0 | 0 | 0 | 0 |
| h-towel-pass | 毛巾过头转肩 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-towel-pulldown | 站姿毛巾下拉 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| h-unsupported-star-reach-native | 单腿站三方向点地 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| h-wall-angel | 靠墙天使 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| h-wall-calf-bent-knee | 扶墙屈膝小腿拉伸 | hold | 0 | 0 | 3→3 | 0 | 0 | 0 | 0 |
| h-wall-calf | 靠墙小腿拉伸 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-wall-palm-lift | 指尖贴墙抬掌根 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| h-wall-pec | 靠墙单臂胸肌拉伸 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| h-wall-straddle | 靠墙仰卧V字分腿 | hold | 0 | 0 | 3→3 | 0 | 0 | 0 | 0 |
| h-wall-wrist-flexor-stretch | 站姿扶墙前臂拉伸 | hold | 0 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| hamstrings-A | 徒手单腿罗马尼亚硬拉 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| hamstrings-B | 滑盘腿弯举 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| hamstrings-C | GHD 北欧腿弯举 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| hip-abductors-A | 侧平板抬腿 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| hip-abductors-B | 仰卧弹力带V字开腿 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| hip-abductors-C | 坐姿器械开腿 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| hip-flexors-A | 坐姿直腿抬腿 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| hip-flexors-B | 弹力带站姿高抬膝 | reps | 3 | 0 | 3→2 | 1 | 0 | 1 | 0 |
| hip-flexors-C | 绳索站姿直腿前抬 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| lats-A | 坐姿撑地抬臀 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| lats-B | 弹力带直臂下拉 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| lats-C | 双杠直臂肩下压 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| n-chair-wiper | 坐椅雨刷（膝内倒） | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| n-half-split | 半跪半劈叉（扶砖） | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| n-leg-circles | 仰卧直腿画圈 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| n-pelvis-circle | 站姿转胯画圈 | reps | 1 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| n-prone-hip-ext | 俯卧屈膝抬腿 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| n-prone-ir | 俯卧小腿外摆 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| n-seated-ir-drop | 坐姿后撑单膝内倒 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| n-seated-knee-lift | 坐姿抬膝悬停 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| n-seated-squeeze | 坐姿夹砖（膝内夹） | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| n-slider-lateral | 滑垫侧向滑 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| n-squat-shift | 低位蹲姿左右移重心 | reps | 3 | 0 | 1→2 | 1 | 2 | 1 | 4 |
| n-straddle-fold | 坐姿分腿体前屈 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| n-thomas-test | 仰卧单膝抱胸（托马斯测试） | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| n-wide-fold | 站姿宽距体前屈（扶椅） | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| n-windshield | 仰卧雨刷式 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| o-chair-knee-extension | 坐椅徒手伸膝 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 4 |
| o-seated-calf-raise | 坐椅提踵 | reps | 3 | 0 | 4→2 | 4 | 2 | 4 | 4 |
| o-seated-catcow | 坐姿猫牛式 | reps | 2 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| o-seated-fig4 | 坐姿四字前压 | hold | 0 | 0 | 3→3 | 0 | 0 | 0 | 0 |
| o-seated-ham | 坐姿大腿后侧拉伸 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| o-seated-hip-er | 坐椅小腿向内摆 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| o-seated-sidebend | 坐椅单臂侧伸 | hold | 0 | 0 | 3→3 | 3 | 3 | 3 | 6 |
| o-seated-twist | 坐姿扶椅扭转 | hold | 0 | 0 | 3→3 | 3 | 3 | 3 | 6 |
| o-stand-crossreach | 扶椅站姿交叉侧伸 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| o-stand-ham | 扶椅站姿大腿后侧拉伸 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| o-stand-lunge | 扶椅弓步拉胯前 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| o-stand-quad | 扶椅站姿大腿前侧拉伸 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| o-stand-sidebend | 站姿举手侧屈 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| o-supported-ankle-eversion | 扶椅脚底向外翻 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| o-supported-ankle-inversion | 扶椅脚底向内翻 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| o-supported-ankle-pump | 扶椅悬空勾绷脚 | reps | 2 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| o-supported-hip-airplane | 扶椅单腿髋飞机 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| o-supported-hip-hitch | 扶椅单腿提胯 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| o-supported-hip-ir | 扶椅小腿向外摆 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| o-supported-knee-curl | 扶椅站姿徒手屈膝 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| o-supported-march | 扶椅站姿交替抬膝 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| o-supported-mini-squat | 扶椅浅蹲 | reps | 3 | 0 | 3→2 | 0 | 0 | 1 | 0 |
| o-supported-single-leg-rdl | 扶椅单腿前倾 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| o-supported-star-reach | 扶椅单腿三向点地 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| o-wall-hip-hinge-stretch | 扶墙俯身拉背 | hold | 0 | 0 | 3→3 | 1 | 2 | 2 | 4 |
| obliques-A | 熊爬穿腿 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| obliques-B | 弹力带抗旋转推 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| obliques-C | 绳索高位伐木 | reps | 3 | 0 | 2→2 | 0 | 0 | 0 | 0 |
| quadriceps-A | 跪姿身体后倾 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| quadriceps-B | 弹力带锁直膝盖 | reps | 3 | 0 | 4→2 | 3 | 2 | 4 | 4 |
| quadriceps-C | 器械坐姿伸腿（顶端停住） | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| rotator-cuff-A | 俯撑交替触肩 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| rotator-cuff-B | 弹力带夹肘向外转 | reps | 3 | 0 | 3→2 | 2 | 1 | 2 | 2 |
| rotator-cuff-C | 绳索90/90转肩 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| s-9090 | 90/90 坐姿拉胯 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| s-butterfly | 蝴蝶式 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| s-figure4 | 仰卧4字臀部拉伸 | hold | 0 | 0 | 3→3 | 0 | 1 | 1 | 2 |
| s-frog | 青蛙式 | hold | 0 | 0 | 3→3 | 3 | 3 | 3 | 6 |
| s-kneel-hipflex | 半跪髋前侧拉伸 | hold | 0 | 0 | 3→3 | 2 | 3 | 3 | 6 |
| s-lizard | 蜥蜴式低弓步 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| s-pigeon | 鸽子式 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
| s-seated-fold | 坐姿体前屈 | hold | 0 | 0 | 3→3 | 2 | 2 | 2 | 4 |
| scapular-A | 俯卧Y-T-W举 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| scapular-B | 单杠肩胛引体 | reps | 3 | 0 | 2→1 | 2 | 1 | 2 | 2 |
| serratus-A | 平板撑推地拱背 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| serratus-B | 泡沫轴墙面上滑 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| serratus-C | 吊环俯卧撑加推背 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| t-flare-side-hold | 托马斯侧撑定格 | hold | 0 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| t-lsit-open-close | L撑开合 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| t-lsit-tuck | L撑收腿伸腿 | reps | 3 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| t-lsit-vsit-circles | L 撑到 V 撑画圈 | reps | 2 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| t-lsit-wide | 宽腿L撑 | hold | 0 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| t-seated-straddle-ext | 分腿坐收腿伸腿 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| t-seated-straddle-lift-1leg | 分腿坐单腿抬起 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| t-seated-straddle-lifts | 坐姿分腿双腿抬起 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| t-straddle-hold | 分腿支撑 | hold | 0 | 0 | 1→1 | 0 | 0 | 0 | 0 |
| t-tuck-planche | 团身俄挺 | hold | 0 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| t-vsit | V撑 | hold | 0 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| triceps-A | 窄距俯卧撑（锁肘停顿） | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| triceps-B | 平行杆直臂支撑 | hold | 0 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| triceps-C | 双杠臂屈伸 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| w-bird-dog | 鸟狗式 | reps | 3 | 0 | 2→2 | 1 | 1 | 1 | 2 |
| w-chair-hip-thrust | 椅子臀推 | reps | 3 | 0 | 3→2 | 2 | 2 | 3 | 4 |
| w-clamshell | 侧卧蚌式开合 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| w-dead-bug | 死虫式 | reps | 3 | 0 | 1→1 | 1 | 1 | 1 | 2 |
| w-feet-on-chair-bridge | 脚踩椅面臀桥 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 3 |
| w-fire-hydrant | 四足消防栓 | reps | 3 | 0 | 3→2 | 3 | 2 | 3 | 4 |
| w-prone-swimmer | 俯卧游泳式 | reps | 3 | 0 | 2→2 | 2 | 2 | 2 | 4 |
| w-wall-sit | 靠墙静蹲 | hold | 0 | 0 | 3→3 | 1 | 1 | 1 | 2 |
