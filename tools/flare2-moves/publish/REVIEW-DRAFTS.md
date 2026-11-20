# Flare 2.0 新动作 8 个：进 r2-v20 的文字/目录草稿，待开哥看

全部是 AI 草稿（`reviewStatus: draft-ai-needs-user-review`），build 原样写进目录（目录里标未审）。开哥 2026-11-21 00:25 已同意按草稿推进出片、上传、生成 r2-v20 目录；
渠道指针不切，App 看不到。开哥改哪条，改对应文件后重跑任务卡 E（语音）起即可（画面不用重渲）。

- 文字（名称、用途、要领、常见错误、注意、相位口令、剂量、节奏）：`catalog/production/flare2-moves-r1/text/<id>.json`（样片阶段已写）
- 讲解语音稿 voiceGuide：同一文件的 `voiceGuide`。样片阶段的草稿过不了 `tools/action-package-v3/text.py` 规则，本分支改了 6 个（见下「本分支改动」），现在 8 个 0 错、节拍词 0
- **新写**的目录字段：`tools/flare2-moves/publish/pack-fields.json`
- 剂量单位：只有 `t-wall-handstand-shift` 是单侧（左右交替，`perSide: alternate`、`repUnit: left+right` = 左右各一次算 1 次，即「每侧」4 次），本分支补了 `startingSide: left`（动画先左）

| 动作 | 肌群（目录） | 器械 | 体位 | 类别 | 剂量（草稿） | 禁忌 | 替代 | 讲解句（voiceGuide 自写句） |
|---|---|---|---|---|---|---|---|---|
| 双椅直臂支撑 `t-chair-support-hold` | 肱三头肌、斜方肌中下部 · 菱形肌、背阔肌 | 椅子/凳子 | 器械支撑（平行杆/双杠/吊环） | 力量 | 3 组 × 15 秒，休 60 秒 | 手腕 | — | 手臂锁直，肩往下沉，别耸肩 / Arms locked, shoulders down, no shrugging |
| 伪俄挺俯卧撑 `t-pseudo-planche-pushup` | 三角肌、前锯肌、肱三头肌、胸大肌 | 瑜伽垫 | 俯卧/俯撑 | 力量 | 3 组 × 6 次，休 90 秒 | 手腕 | — | 肩一直在手前面 / Shoulders stay ahead of your hands<br>手肘贴身体，身体一条线 / Elbows in, body in one line |
| 团身 L 撑 `t-tuck-lsit-hold` | 腹直肌（含深层腹横肌）、髋屈肌、肱三头肌 | 瑜伽垫、瑜伽砖（可用厚书代替） | 坐姿 | 力量 | 3 组 × 10 秒，休 60 秒 | 手腕 | — | 手臂锁直，肩往下压，膝盖收到胸前 / Arms locked, shoulders down, knees to your chest |
| 面墙靠墙倒立 `t-wall-handstand-hold` | 三角肌、肱三头肌、斜方肌中下部 · 菱形肌 | 墙、瑜伽垫 | 俯卧/俯撑 | 力量 | 3 组 × 20 秒，休 60 秒 | 手腕、肩 | — | 手臂锁直，肩往上顶，身体一条线 / Arms locked, push tall, one straight line<br>收紧肚子和屁股，腰别塌 / Brace your belly and glutes, no arching |
| 靠墙倒立移重 `t-wall-handstand-shift` | 三角肌、肱三头肌、斜方肌中下部 · 菱形肌 | 墙、瑜伽垫 | 俯卧/俯撑 | 力量 | 3 组 × 4 次（每侧，左右各一次算 1 次），休 60 秒 | 手腕、肩 | t-wall-handstand-hold | 支撑手臂锁直，另一只手只留指尖点地 / Support arm locked, other hand on fingertips only |
| 脚垫高派克支撑 `t-elevated-pike-hold` | 三角肌、肱三头肌 | 椅子/凳子、瑜伽垫 | 俯卧/俯撑 | 力量 | 3 组 × 20 秒，休 60 秒 | 手腕、肩 | — | 手臂锁直往上顶肩，耳朵在两臂之间 / Arms locked, push tall, ears between your arms<br>腿伸直，屁股顶高，背别塌 / Legs straight, hips high, back flat |
| 地面派克支撑 `t-pike-hold` | 三角肌、肱三头肌 | 瑜伽垫 | 俯卧/俯撑 | 力量 | 3 组 × 20 秒，休 45 秒 | 手腕、肩 | — | 手臂锁直往上顶肩，屁股顶高 / Arms locked, push tall, hips high<br>耳朵在两臂之间，背别塌 / Ears between your arms, back flat |
| 跪姿前臂拉伸 `t-kneeling-wrist-flexor-stretch` | 前臂 · 腕屈伸肌 | 瑜伽垫 | 四足跪撑 | 拉伸 | 2 组 × 30 秒，休 15 秒 | 手腕 | — | 手指朝膝盖，掌根压住地 / Fingers to your knees, heels of the hands down<br>前臂里面有拉的感觉就够了，别弹 / A gentle pull inside the forearm is enough, no bouncing<br>手肘伸直，肘窝朝前 / Elbows straight, elbow creases facing forward |

共 14 句自写讲解（中英各一份 → 28 段语音），加 8 × 5 句基础语音（名称、开组要领、三句相位，中英）= 108 段。

## 本分支改动（让文字稿过 text.py 规则；只改文字，不影响画面）
- 面墙靠墙倒立、脚垫高派克、地面派克（20 秒）：原来 3 秒后到最后 3 秒倒数之间空 14 秒（规则上限 10 秒），各在第 10 秒补一句（腰别塌 / 屁股顶高 / 耳朵在两臂之间）。
- 跪姿前臂拉伸（30 秒）：空 24 秒 → 改成 3、11、19 秒三句（手指朝膝掌根压地 / 有拉的感觉就够了别弹 / 手肘伸直肘窝朝前）。
- 伪俄挺俯卧撑：第 1 句英文太长（一下 4 秒放不下），改短为 “Shoulders stay ahead of your hands”。
- 靠墙倒立移重：原来两句挨着（第 1、2 下后，规则要隔 2 下）且有节拍词「移过去」→ 合成一句放第 1 下后；补 `startingSide: left`。
- 双椅直臂支撑：文字稿 tags.position 改为 `other`（文字词表没有 support；目录体位仍是「器械支撑」）。

## 需要开哥拍板的点
1. **剂量范围**：Flare 2.0 新动作表没给范围，doseRange 一律按草稿剂量单点记（如 3 组 × 20 秒就是 3–3 组、20–20 秒），App 里可能调不了剂量；开哥给范围后改 `pack-fields.json` 重跑 F 起即可。
2. **跪姿前臂拉伸不是单侧**：动画和文字都是两只手同时撑地拉，所以没标「每侧」、没有换边准备。若开哥要单手轮流拉（每侧 30 秒、换边准备 10 秒），要改文字稿并重做动画。
3. **体位**：面墙倒立两个、派克两个、伪俄挺记「俯卧/俯撑」（目录词表没有倒立）；双椅支撑记「器械支撑」（同椅子反撑 h-chair-dip）。倒立的「高血压、青光眼不宜」目录禁忌词表没有，只在文字注意事项里。
4. **apps / tags**：`apps` 留空（不标 flarelab，不接入 Flare），`tags` = thomas、flare2:moves-r1；决定接入 Flare 时再标、再加进白名单。
5. **替代动作**：只填了文字稿明说的前置：靠墙倒立移重 → 面墙靠墙倒立（「先能稳定保持面墙倒立 30 秒」）；其余为空（如倒立 → 脚垫高派克的退阶关系文字里没写）。
6. 讲解文字整体（14 句）是否可用；脚垫高派克/地面派克都用椅子或垫子，场景只算居家和健身房（垫上动作不进办公室），双椅支撑三个场景都有。
