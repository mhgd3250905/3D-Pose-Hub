# Flare 2.0 r2 第 1 批新动作 6 个：进 r2-v21 的文字/目录草稿，待开哥 / mhgd 看

全部是 AI 草稿（`reviewStatus: draft-ai-needs-user-review`），build 原样写进目录（目录里标未审）。依据：开哥 2026-11-21 02:02 定今晚由 mhgd 统筹热身 + 练后新动作
（编动作 → 渲染 → 上传新 pack，不切指针）。渠道指针不切，App 看不到。改哪条，改对应文件后从任务卡 E（语音）起重跑即可（画面不用重渲）；
只改 `pack-fields.json` 从 F 起重跑。

- 文字（名称、用途、要领、常见错误、注意、相位口令、剂量、节奏）与讲解稿 voiceGuide：`catalog/production/flare2-moves-r2/text/<id>.json`（编动作时已写，6 个都过 `tools/action-package-v3/text.py` 规则，0 错）
- **新写**的目录字段：`tools/flare2-moves-r2/publish/pack-fields.json`
- 不进包：婴儿式侧伸 `t-child-pose-side-reach`（actions.json `deferred`，两次自检未过，没渲染）。build 只读 `actions`，并核对名单 = 下表 6 个、pack-fields 里不能有 deferred 的 id。

| 动作 | 肌群（目录） | 器械 | 体位 | 类别 | 剂量（草稿） | 禁忌 | 场景（推导） | 讲解句（voiceGuide 自写句） |
|---|---|---|---|---|---|---|---|---|
| 低冲击开合踏步+大绕环 `t-step-jack-arm-circles` | 三角肌、臀中肌 · 髋外展 | 徒手 | 站姿 | 有氧 | 1 组 × 60 秒，休 15 秒 | 肩 | 居家、办公室、健身房 | 6 句：一只脚始终踩在地上，不用跳 / One foot always on the floor, no jumping<br>手臂伸直，往头顶上方够 / Arms straight, reaching up overhead<br>支撑腿膝盖微弯，身体站高 / Soft standing knee, stand tall<br>后半段手臂改成大绕环，掌心朝外 / Second half: big arm circles, palms facing out<br>绕环画大一点，手肘别弯 / Make the circles big, elbows straight<br>肩膀放松往下，别耸到耳朵 / Shoulders down, away from your ears |
| 站姿颈腕指唤醒 `t-neck-wrist-finger-wakeup` | 颈部、前臂 · 腕屈伸肌 | 徒手 | 站姿 | 灵活性 | 1 组 × 45 秒，休 15 秒 | 颈 | 居家、办公室、健身房 | 5 句：脖子只在前面半圈绕，不往后仰 / Half circles in front only, never tip back<br>耳朵找肩膀，下巴经过胸口 / Ear to shoulder, chin past the chest<br>双手合掌，手腕画横着的 8 字 / Palms together, wrists draw a sideways eight<br>握拳握紧，张开时手指撑到最大 / Tight fist, fingers spread wide after<br>肩膀放松往下，别耸起来 / Shoulders relaxed and down |
| 宽距侧蹲左右移重心 `t-wide-side-squat-shift` | 内收肌群、股四头肌、臀大肌 | 徒手 | 站姿 | 灵活性 | 1 组 × 5 次（每侧，左右交替，左右各一次算 1 次；先右），休 30 秒 | 膝、大腿内侧 | 居家、办公室、健身房 | 2 句：蹲那侧脚跟踩实，伸直腿脚尖朝上 / Bending heel flat, straight leg toes up<br>胸口抬起，膝盖跟脚尖同一个方向 / Chest up, knee in line with the toes |
| 站姿颈侧拉伸 `t-standing-neck-side-stretch` | 颈部 | 徒手 | 站姿 | 拉伸 | 1 组 × 30 秒（每侧，一侧做完再换边；先右，换边准备 10 秒），休 10 秒 | 颈 | 居家、办公室、健身房 | 3 句：耳朵朝肩膀，脸朝正前方 / Ear toward shoulder, face forward<br>手只是搭在头上，不用拉 / The hand just rests, no pulling<br>另一边肩膀往下沉，手往地面伸 / Other shoulder down, hand reaching to the floor |
| 站姿屈腕拉伸 `t-standing-wrist-flexor-stretch` | 前臂 · 腕屈伸肌 | 徒手 | 站姿 | 拉伸 | 1 组 × 30 秒（每侧，一侧做完再换边；先右，换边准备 10 秒），休 10 秒 | 手腕 | 居家、办公室、健身房 | 3 句：手臂伸直到肩高，掌心朝前 / Arm straight at shoulder height, palm forward<br>前臂里面有拉的感觉就够了，别使劲拽 / A gentle pull inside the forearm is enough<br>手肘一直伸直，肩膀放松 / Elbow stays straight, shoulder relaxed |
| 侧卧直腿外展 `t-side-lying-straight-leg-abduction` | 臀中肌 · 髋外展、臀大肌 | 瑜伽垫 | 侧卧/侧撑 | 力量 | 1 组 × 10 次（每侧，一侧做完再换边；先右），休 15 秒 | 髋 | 居家、健身房 | 2 句：脚尖朝前，脚跟带着腿走 / Toes forward, the heel leads the leg<br>胯别往后翻，腿不靠下面 / Hips stacked, top leg stays off |

共 21 句自写讲解（中英各一份 → 42 段语音），加 6 × 5 句基础语音（名称、开组要领、三句相位，中英）= 60 段，合计 102 段。
r2-v21 讲解句总数 = r2-v20 的 535 + 21 = 556。沙箱已用真实 Edge TTS 合成这 102 段，审核 0 失败（渲染机 E 步会按正式母帧时间点重新合成）。

## 本分支改动（只改文字稿的标签词，不影响画面和语音）
- 文字稿 `tags.activeMuscles / synergistMuscles` 里的 `traps`、`quads` 在 r2-v20 全部 269 个动作里没人用过，换成目录里已有的写法：
  `traps` → `upper-back`（开合踏步、颈腕指唤醒、颈侧拉伸），`quads` → `quadriceps`（宽距侧蹲）。`glutes`、`hip-abductors` 原来就有，没动。
- `tools/flare2-moves-r2/produce.mjs`：渲染内容核对的排除列表加了 `tools/flare2-moves-r2/publish`（发布工具不被渲染读取；不加的话 `--final` 预检会因本分支新文件拒绝）。渲染内容仍必须等于 `138e3e9`。

## 需要开哥 / mhgd 拍板的点
1. **剂量**：Flare 热身 v2 表给了热身 3 个的秒数/次数（60 秒、45 秒、每侧 5 次），照用；练后 3 个表里没写，草稿是每侧 30 秒 / 每侧 30 秒 / 每侧 10 次。
   doseRange 一律按草稿单点记（如 1 组 × 30 秒就是 1–1 组、30–30 秒），App 里可能调不了；Flare 的练后三档自己按 30/45/60 秒覆盖秒数，不受影响。
2. **单侧/镜像**：屈腕拉伸只做右手、侧卧外展只做左侧卧抬右腿，视频单侧、App 镜像出另一侧；宽距侧蹲是左右交替（视频里左右都有）。
   **颈侧拉伸的 16 秒视频里左右两边都做了**，但目录按单侧「每侧、先右」记（同文字稿）；若 App 对左侧做镜像，会出现镜像后的左右都做——
   要么 App 对它不镜像、整段循环播放，要么改成双侧动作（unilateral false、剂量写总时长）。请 mhgd 按 Flare 的播放方式定。
3. **颈腕指唤醒用合掌绕 8 字代替十指交扣**（交扣近景读不清，编动作时改的，文字稿同步）——待开哥 / mhgd 认可。
4. **目录字段**：颈侧拉伸的上斜方肌目录肌群词表没有，只记「颈部」；开合踏步记「有氧」、颈腕指唤醒与宽距侧蹲记「灵活性」；禁忌只取文字注意事项里写到的部位；
   替代动作文字稿都没明说，一律空（宽距侧蹲与已有 `n-squat-shift`、开合踏步与已有 `h-step-jack` 是近亲，但不是同一动作，没填）。
5. **apps / tags**：`apps` 留空（不标 flarelab），`tags` = thomas、flare2:moves-r2。

## Flare（mhgd3250905/3D-Body）要怎样才能用上（只读查看 `codex/flare-warmup-cooldown` @ bb2ce0f 得到，未改 Flare 仓库）
Flare **不读**目录里的 `apps` / `tags`，也没有 warm-up / cool-down 标签机制，所以 r2-v21 目录不需要为 Flare 额外加标签。它取动作靠三处：
1. `app/lib/data/flare_action_scope.dart` 的 `flareAuthorizedActionIds` 白名单（写死 id，防热更新扩大范围）——6 个新 id 要加进去（或照下条单独放行）。
2. 当前渠道指针仍是 r2-v18，Flare 的做法是把单个动作从 pack 里原样投影进内置目录（`app/assets/public_media/flare-warmup-action.json` + `flare_public_catalog.dart`，
   现在投影的是 r2-v19 的 `t-kneeling-scap-pushup`，记 sourcePack / sourceCatalogSha256）。新动作可同法从 r2-v21 取 `actions[]` 条目 + semantic `drills[]` 定义
   （r2-v21 catalog sha 在 H 步后定），成片/语音走条目里的 `downloadUrl`（H 步上传后才可下载）。
3. `app/assets/data/flare-plans.json` 里现在用占位动作 + `demoPending: true` + `displayName`，替换关系（建议，mhgd 定）：
   - general-warmup 第 1 项 `h-step-jack`（60 秒）→ `t-step-jack-arm-circles`
   - general-warmup 第 2 项 `forearms-A`（45 秒，「站姿颈-腕-指唤醒」）→ `t-neck-wrist-finger-wakeup`
   - general-warmup 第 3 项 `n-squat-shift`（每侧 5 次）→ `t-wide-side-squat-shift`
   - general-cooldown t1/t2/t3 第 1 项 `o-stand-sidebend`（「颈侧拉伸」）→ `t-standing-neck-side-stretch`
   - 三档的「站姿无负重屈腕 / 伸腕拉伸」`h-standing-wrist-extensor-stretch` + `secondaryStretchDrill: h-wall-wrist-flexor-stretch` → 屈腕那一半可换 `t-standing-wrist-flexor-stretch`（无墙版）
   - general-cooldown（t1）加强项「侧卧上腿外展」`w-clamshell`（每侧 10 次）→ `t-side-lying-straight-leg-abduction`
   - 「婴儿式侧伸」`h-dd-shoulder` 占位：本批没有（`t-child-pose-side-reach` 暂缓）
   另外 Flare 自带的 `app/assets/ai_tags/actions.json` 用 `sessionRole: ["warmup"|"cooldown"|"main"]` 标角色，新 id 若要给 AI 教练用，需要在那里补条目
   （热身 3 个 warmup；颈侧拉伸、屈腕拉伸 cooldown；侧卧外展按加强项记 main/cooldown，mhgd 定）。
