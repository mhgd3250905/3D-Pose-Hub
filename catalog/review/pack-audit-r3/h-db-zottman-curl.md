# h-db-zottman-curl 站姿哑铃翻掌弯举（Standing Dumbbell Zottman Curl）· 动作包核对 r3

- 类型：`rep_hold`；V4 预览：`/workspace/work/v4run/b9.jpg 第 5 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×8 次，休息 60 秒
- 改后：3 组×8 次，休息 60 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：8.0 s → 4.5 s
- 相位：go 1.0s / hold 1.0s / back 2.0s / rest 0.5s

## 3. 难度
- 改前 v3 2 / ai-tags 2 → 统一 2（顶上翻掌、手背朝上慢放，小臂要有点力气。）

## 4. 指导文字（教练口吻）
- purpose：同时练上臂前侧和前臂 → 一个动作同时练大臂前面和小臂
- 要点 改前：掌心朝上举起，顶端翻成掌心朝下再放；手肘贴住身体，手腕平直。；放到底再把掌心翻回朝上。
- 要点 改后：手心朝上弯起来，顶上翻成手心朝下再放；手肘贴住身体，手腕立直。；放到底再把手心翻回朝上。
- 常见错误 改前：放得太快；身体前后晃借力
- 常见错误 改后：放得太快；身子前后晃借劲
- 注意事项 改前：手腕或手肘疼时停止，先用轻哑铃
- 注意事项 改后：先用轻哑铃，手腕或手肘疼就停
- 相位口令：举起 / 翻掌朝下 / 慢慢放下 → 弯起来 / 翻掌 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 4.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 手肘贴住身体 | Elbows at your sides | cue2 |
| 5 | 手背朝上，慢慢放 | Palms down, lower slowly | cue1, commonErrors[0] |
| 7 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 1 分钟；allDone → 很好

## 6. 画面对照
- 一致：站姿哑铃弯举到肩前、小臂高亮（b9 第 5 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 8.0 s → 4.5 s（弯 1.0 / 顶上翻掌 1.0 / 慢放 2.0 / 底下翻回 0.5）；r2「动画 8 秒只做 1 次」flag 与节奏脱钩，不改动画
- 文字改教练口吻
- 难度 2/2 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 常见错误2：身子前后晃借劲 → 翻手腕时身子跟着晃（Rocking your body. → Rocking your body as you turn your wrists.）
- 语音 reminders[0]：手肘贴住身体 → 大臂贴身，只翻手腕（Elbows at your sides → Arms still, only wrists turn）
