# n-thomas-test 仰卧单膝抱胸（托马斯测试）（Supine Single Knee-to-Chest (Thomas Test)）· 动作包核对 r3

- 类型：`hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b18.jpg 第 8 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧30 秒，休息 15 秒
- 改后：2 组×每侧30 秒，休息 15 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：计时 → 计时
- 相位：计时

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：看看髋前侧紧不紧，同时轻轻拉伸髋前侧 → 看看胯前面紧不紧，顺便轻轻拉开胯前面
- 要点 改前：双手抱住一侧膝盖，另一条腿放松贴地；看伸直那条腿的大腿会不会离开地面，离开说明髋前侧偏紧。；保持不动，慢慢呼吸，每次呼气再放松一点。；别来回颠，有拉伸感就够，别拉到疼。
- 要点 改后：两手抱住一边膝盖，另一条腿放松贴地；看伸直那条腿的大腿会不会离开地面，离开了就是胯前面偏紧。；就停在这儿，慢慢喘气，每次呼气再松一点。；别一下一下往下压，有拉的感觉就够，别拉到疼。
- 常见错误 改前：伸直的腿故意用力压地或抬起；抱得太用力，腰离开地面；憋气或来回颠
- 常见错误 改后：伸直的腿故意使劲压地或抬起；抱得太使劲，腰离开地；憋气或一下一下往下压
- 注意事项 改前：膝盖或髋部疼时抱得松一点，还疼就停
- 注意事项 改后：膝盖或胯疼就抱松点，还疼就停
- 相位口令：抱住膝盖 / 保持，慢慢呼气 / 呼气再放松 → 抱住膝盖 / 停住，呼气 / 呼气再松

## 5. voiceGuide（脚本，未合成音频）
| 秒 | 中文 | English | 出处 |
|---|---|---|---|
| 0 | 开始 | Go | p.go |
| 4 | 伸直的腿放松 | Straight leg relaxed | cue1, commonErrors[0] |
| 12 | 腰贴着地 | Back down | commonErrors[1] |
| 20 | 呼气，再松一点 | Breathe out, let go | cue3 |
| 27 | 三 | three | n.3 |
| 28 | 二 | two | n.2 |
| 29 | 一 | one | n.1 |
- 组后：moreSetsSameSide → 休息 + 15 秒；sideDone → 慢慢还原 + 换左边；allDone → 慢慢还原 + 很好

## 6. 画面对照
- 一致：仰卧抱一膝、另一腿平放、胯前高亮（b18 第 8 行）
- 极端错误：无

## 7. 改了什么、为什么
- 剂量 每侧 2 组×30 秒、休息 15 秒不变；仰卧原地换抱另一边膝盖，不加换边准备
- 「髋前侧」→「胯前面」，「髋部」→「胯」；「别来回颠」→「别一下一下往下压」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点3：就停在这儿，慢慢喘气，每次呼气再松一点。 → 抱住的膝盖贴胸口，另一条腿就让它自己往下放。（Stay right there, breathe slowly, let go a little more each breath out. → Hold one knee to your chest and let the other leg relax down.）
- 要点4：别一下一下往下压，有拉的感觉就够，别拉到疼。 → 放着的那条大腿抬起来了也别硬压，记住它在哪儿。（Don't bounce. A clear stretch is enough, never pain. → If the resting thigh lifts, don't force it down. Just notice where it sits.）
- 常见错误3：憋气或一下一下往下压 → 用手按另一条腿往下压（Holding your breath or bouncing. → Pushing the other leg down with your hand.）
- 注意事项1：膝盖或胯疼就抱松点，还疼就停 → 膝盖抱着疼就改成抱大腿后面（If your knee or hip hurts, don't hug as tight. Stop if it still hurts. → If hugging the knee hurts, hold behind your thigh instead.）
- 语音 set[3]：呼气，再松一点 → 另一条腿放松别压（Breathe out, let go → Other leg loose, no forcing）
