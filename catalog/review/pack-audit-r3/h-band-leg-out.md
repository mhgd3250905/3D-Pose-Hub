# h-band-leg-out 仰卧弹力带单腿向外落（Lying Band Leg Drop-Out）· 动作包核对 r3

- 类型：`hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b4.jpg 第 2 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧30 秒，休息 15 秒
- 改后：2 组×每侧30 秒，休息 15 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：计时 → 计时
- 相位：计时

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：拉伸大腿内侧和大腿后侧 → 拉开大腿内侧和大腿后面
- 要点 改前：膝盖伸直，腿慢慢往外侧落；用手拉住弹力带，让带子托住腿的重量。；停住不动，慢慢呼吸。；每次呼气再放松一点，别来回颠。
- 要点 改后：膝盖伸直，腿慢慢往外边落；手拉住带子，让带子托着腿的重量。；就停在这儿，慢慢喘气。；每次呼气再松一点，别一下一下往下压。
- 常见错误 改前：骨盆跟着翻向一侧；憋气；来回颠着往下压
- 常见错误 改后：胯跟着翻向一边；憋气；一下一下往下压
- 注意事项 改前：大腿根刺痛时就停
- 注意事项 改后：大腿根刺痛就停
- 相位口令：慢慢往外落 / 保持，慢慢呼气 / 呼气再放松 → 慢慢往外落 / 停住，呼气 / 呼气再松

## 5. voiceGuide（脚本，未合成音频）
| 秒 | 中文 | English | 出处 |
|---|---|---|---|
| 0 | 开始 | Go | p.go |
| 4 | 两边胯贴住垫子，别翻 | Keep both hips down | commonErrors[0] |
| 12 | 让带子托着腿 | Let the band hold the leg | cue2 |
| 20 | 呼气，再松一点 | Breathe out, let go | cue4 |
| 27 | 三 | three | n.3 |
| 28 | 二 | two | n.2 |
| 29 | 一 | one | n.1 |
- 组后：moreSetsSameSide → 休息 + 15 秒；sideDone → 慢慢还原 + 换左边；allDone → 慢慢还原 + 很好

## 6. 画面对照
- 一致：仰卧手拉弹力带套脚、腿抬起往外落、大腿内侧高亮（b4 第 2 行）
- 极端错误：无

## 7. 改了什么、为什么
- 剂量 2 组×每侧 30 秒、休息 15 秒不变
- 新增 sideSwitchSeconds 10（带子换脚）
- 「骨盆跟着翻」→「胯跟着翻」，「别来回颠」→「别一下一下往下压」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点3：就停在这儿，慢慢喘气。 → 腿落到有拉的感觉就停，用带子托住它。（Stay right there and breathe slowly. → Let your leg drop until you feel the stretch, and let the band hold it.）
- 要点4：每次呼气再松一点，别一下一下往下压。 → 呼气时手上的带子松一点，让腿再往外落一点。（Each breath out, let go a little more. Don't bounce. → On each breath out, give the band a little slack so your leg drops further.）
- 常见错误1：胯跟着翻向一边 → 另一边屁股跟着离地翻过来（Hips rolling to one side. → The other side of your butt lifting off the floor.）
- 常见错误3：一下一下往下压 → 不用带子托着，靠腿硬撑（Bouncing to go deeper. → Holding the leg up yourself instead of letting the band take it.）
- 语音 set[3]：呼气，再松一点 → 呼气，带子松一点（Breathe out, let go → Breathe out, give some slack）
- 相位口令 peak：停住，呼气 → 带子托住（Hold, breathe out → Band holds it）
- 相位口令 end：呼气再松 → 再落一点（Let go more → Drop a bit more）
