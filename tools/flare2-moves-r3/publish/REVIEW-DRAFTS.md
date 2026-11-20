# Flare 2.0 r3 新动作 10 个（第 2a 批 6 + 第 2b 批 4）：进 r2-v22 的文字/目录草稿，待开哥 / mhgd 看

全部是 AI 草稿（`reviewStatus: draft-ai-needs-user-review`），build 原样写进目录（目录里标未审）。依据：开哥 2026-11-21 02:02 定今晚由 mhgd 统筹热身 + 练后新动作
（编动作 → 渲染 → 上传新 pack，不切指针）。做法与 r2-v21（`tools/flare2-moves-r2/publish/REVIEW-DRAFTS.md`）相同。渠道指针不切，App 看不到。
改哪条，改对应文件后从任务卡 E（语音）起重跑即可（画面不用重渲）；只改 `pack-fields.json` 从 F 起重跑。

- 文字（名称、用途、要领、常见错误、注意、相位口令、剂量、节奏）与讲解稿 voiceGuide：`catalog/production/flare2-moves-r3/text/<id>.json`（编动作时已写，10 个都过 `tools/action-package-v3/text.py` 规则，0 错）
- **新写**的目录字段：`tools/flare2-moves-r3/publish/pack-fields.json`
- 不进包：婴儿式侧伸 v2 `t-child-pose-side-reach-v2`（actions.json `deferred`，r3 两次自检仍未过，没渲染）。build 只读 `actions`，并核对名单 = 下表 10 个、pack-fields 里不能有 deferred 的 id。

| 动作 | 肌群（目录） | 器械 | 体位 | 类别 | 剂量（草稿） | 禁忌 | 场景（推导） | 替代 | 讲解句（voiceGuide 自写句） |
|---|---|---|---|---|---|---|---|---|---|
| 跪姿拳面支撑 `t-kneeling-fist-plank` | 前臂 · 腕屈伸肌 | 瑜伽垫 | 跪姿 | 核心 | 1 组 × 20 秒，休 30 秒 | 手腕 | 居家、健身房 | — | 3 句：拳头在肩膀正下方，前臂竖直 / Fists under the shoulders, forearms vertical<br>手腕绝对直，别往里或往外折 / Wrists dead straight, no bending in or out<br>重心压在食指和中指的指根上 / Weight over the index and middle knuckles |
| 跪姿手腕俯卧撑 `t-kneeling-wrist-pushup` | 前臂 · 腕屈伸肌 | 瑜伽垫 | 跪姿 | 力量 | 1 组 × 10 次，休 30 秒 | 手腕 | 居家、健身房 | — | 2 句：手臂一直伸直，手指根部贴住垫子 / Arms stay straight, finger roots on the mat<br>掌根一点点贴回垫子，别砸下来 / Palms settle down gently, never drop |
| 前倾支撑 `t-planche-lean-hold` | 三角肌、前锯肌 | 瑜伽垫 | 俯卧/俯撑 | 力量 | 3 组 × 15 秒，休 30 秒 | 手腕 | 居家、健身房 | — | 2 句：手指朝外，手肘锁直 / Fingers turned out, elbows locked<br>肩膀在手腕前面，身体一条线 / Shoulders past the wrists, body in one line |
| 前臂侧桥（直腿） `t-forearm-side-plank` | 腹斜肌 | 瑜伽垫 | 侧卧/侧撑 | 核心 | 1 组 × 20 秒（每侧，一侧做完再换边；先左，换边准备 10 秒），休 15 秒 | 肩 | 居家、健身房 | — | 3 句：手肘在肩膀正下方，前臂朝前 / Elbow right under the shoulder, forearm forward<br>髋往上顶，头到脚一条直线 / Hips up, one straight line from head to feet<br>胸口朝正前方，肩膀离耳朵远一点 / Chest facing forward, shoulder away from your ear |
| 直臂侧桥转换 `t-straight-arm-side-plank-switch` | 腹斜肌、三角肌 | 瑜伽垫 | 俯卧/俯撑 | 核心 | 1 组 × 6 次（左右交替，左右各转一次算 1 次；先左），休 45 秒 | 手腕、肩 | 居家、健身房 | `t-forearm-side-plank` | 2 句：撑地的手肘锁直，身体整个一起转 / Support elbow locked, the whole body turns together<br>侧桥时肩膀在手正上方，髋别掉 / Shoulder stacked over the hand, hips stay high |
| 俯卧 T-W `t-prone-t-w` | 斜方肌中下部 · 菱形肌、三角肌 | 瑜伽垫 | 俯卧/俯撑 | 力量 | 1 组 × 10 次，休 30 秒 | 肩 | 居家、健身房 | — | 2 句：肩胛往中间夹，肩膀离耳朵远一点 / Shoulder blades together, shoulders away from your ears<br>W 的手肘贴着身体，手比手肘高 / In the W, elbows by your sides, hands above the elbows |
| 伪俄挺俯卧撑（指尖朝外） `t-pseudo-planche-pushup-v2` | 三角肌、前锯肌、肱三头肌、胸大肌 | 瑜伽垫 | 俯卧/俯撑 | 力量 | 3 组 × 6 次，休 90 秒 | 手腕 | 居家、健身房 | — | 2 句：指尖朝外，肩在手前面 / Fingers out, shoulders ahead<br>手肘贴身体，身体一条线 / Elbows in, body in one line |
| 地面团身支撑 `t-floor-tuck-hold` | 腹直肌（含深层腹横肌）、髋屈肌、肱三头肌 | 瑜伽垫 | 坐姿 | 力量 | 3 组 × 10 秒，休 60 秒 | 手腕 | 居家、健身房 | `t-tuck-lsit-hold` | 1 句：手臂锁直，肩往下压，臀和脚离地 / Arms locked, shoulders down, hips and feet up |
| 仰卧直腿大分腿慢开合 `t-supine-straddle-open-close` | 内收肌群 | 瑜伽垫 | 仰卧 | 灵活/活动度 | 2 组 × 8 次，休 30 秒 | — | 居家、健身房 | — | 2 句：膝盖伸直，两条腿一起打开 / Knees straight, both legs open together<br>下背贴住垫子，骨盆不晃 / Lower back on the mat, pelvis still |
| 背后十指交扣扩胸 `t-standing-clasp-chest-opener` | 胸大肌 | 徒手 | 站姿 | 拉伸 | 2 组 × 20 秒，休 10 秒 | 肩 | 居家、办公室、健身房 | — | 2 句：手臂伸直往后拉，肩胛夹紧 / Arms straight and back, squeeze your shoulder blades<br>肩膀往下沉，上身不往前弯 / Shoulders down, keep your chest tall |

共 21 句自写讲解（中英各一份 → 42 段语音），加 10 × 5 句基础语音（名称、开组要领、三句相位，中英）= 100 段，合计 142 段。
r2-v22 讲解句总数 = r2-v21 的 556 + 21 = 577。沙箱已用真实 Edge TTS 合成这 142 段，审核 0 失败（渲染机 E 步会按正式母帧时间点重新合成）。

## 本分支改动（只改文字稿，不影响画面；渲染内容仍必须等于 `a7a1fb7`）
- **第 2b 批 4 个补写 `defaultDose`**（编动作时剂量只写在 `flare2.doseBrief`，没有 `defaultDose`，`text.py` 与 build 都要它）：
  照 r2-v21 的做法，目录 `defaultDose` = 文字稿里的草稿剂量，`doseRange` = 同值单点；数字逐字取自各自的 `flare2.doseBrief`（`flare2.doseStatus` 仍是 draft）：
  伪俄挺俯卧撑 v2 3 组 × 6 次休 90 秒（同 r1 `t-pseudo-planche-pushup`）、地面团身支撑 3 组 × 10 秒休 60 秒（同 r1 `t-tuck-lsit-hold`）、
  仰卧大分腿开合 2 组 × 8 次休 30 秒、背后十指交扣扩胸 2 组 × 20 秒休 10 秒。voiceGuide 本来就是按这些剂量写的（休息 N 秒口令一致），没改。
- 俯卧 T-W 文字稿 `tags`：`traps` → `scapular`、`erectors` → `lower-back`（r2-v21 全部 275 个动作里没人用过 `traps` / `erectors`，换成目录里已有的写法；T-W 练的是中下斜方肌，对应 `scapular`）。
- `tools/flare2-moves-r3/produce.mjs`：渲染内容核对的排除列表加了 `tools/flare2-moves-r3/publish`（发布工具不被渲染读取；不加的话 `--final` 预检会因本分支新文件拒绝）。

## 需要开哥 / mhgd 拍板的点
1. **剂量**：10 个全部是草稿（表里多数只写了「静态 / 慢速 / 每侧 N 秒」，组数、次数、休息多为 AI 填的），doseRange 一律单点，App 里可能调不了；
   Flare 练后三档自己按计划表覆盖秒数，不受影响。
2. **单侧/镜像**：前臂侧桥只做左侧着地（视频单侧，App 镜像出右侧，目录「每侧、先左」）；直臂侧桥转换视频里左右都有（左右交替，1 次 = 左右各一次，App 不需要镜像）。
   其余 8 个双侧对称。
3. **前臂侧桥画面**：2a 样片总览看上去像手掌撑地（实为前臂平放），需开哥看片确认。
4. **目录字段**：拳面支撑、前臂侧桥、直臂侧桥转换的文字稿类别是 stability，按目录已有映射记「核心」；体位 plank → 俯卧/俯撑、side-lying → 侧卧/侧撑（同目录已有做法）；
   地面团身支撑记坐姿（同 `t-tuck-lsit-hold`）。禁忌只取文字注意事项里写到、且目录词表有的部位（仰卧大分腿只提到腿后侧紧，词表没有，记空）。
   替代只填文字稿明说的退阶：直臂侧桥转换 → 前臂侧桥、地面团身支撑 → 团身 L 撑（瑜伽砖版 `t-tuck-lsit-hold`）。
5. **apps / tags**：`apps` 留空（不标 flarelab），`tags` = thomas、flare2:moves-r3。Flare 不读目录 apps/tags，接入方式同 r2-v21：
   把 id 加进 `app/lib/data/flare_action_scope.dart` 白名单 + `flare-plans.json` 替换占位（见 r2-v21 的 REVIEW-DRAFTS「Flare 要怎样才能用上」）。
   伪俄挺俯卧撑 v2 是新 id，不覆盖 r1 `t-pseudo-planche-pushup`；Flare 要用新版需把计划里的 id 换成 `-v2`。
