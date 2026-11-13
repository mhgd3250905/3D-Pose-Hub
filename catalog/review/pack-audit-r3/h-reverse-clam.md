# h-reverse-clam 侧卧反向蚌式（Side-Lying Reverse Clamshell）· 动作包核对 r3

- 类型：`rep_hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b12.jpg 第 5 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧12 次，休息 20 秒
- 改后：2 组×每侧12 次，休息 20 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.5 s
- 相位：go 1.0s / hold 1.0s / back 1.5s

## 3. 难度
- 改前 v3 1 / ai-tags 1 → 统一 1

## 4. 指导文字（教练口吻）
- purpose：练臀部，让大腿向内转更有控制 → 练屁股侧面，让大腿往里转也有劲
- 要点 改前：双膝并拢，上面的脚往上抬离下面的脚；屁股别往后翻。；顶上停一下，再慢慢放下。
- 要点 改后：两膝并拢，上面那只脚往上抬；侧躺撑着手肘，胯和膝盖都弯着，屁股别往后翻。；顶上停一下，再慢慢放下。
- 常见错误 改前：膝盖分开；屁股前后翻
- 常见错误 改后：膝盖分开；屁股往后翻
- 注意事项 改前：髋部不舒服时幅度小一点，还疼就停
- 注意事项 改后：胯不舒服就抬低点，还疼就停
- 相位口令：抬脚 / 停一下 / 慢放下 → 抬脚 / 停住 / 慢慢放

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 两膝并拢 | Knees together | cue1, commonErrors[0] |
| 5 | 屁股别往后翻 | Hips stay stacked | cue2, commonErrors[1] |
| 8 | 顶上停一下 | Pause at the top | cue3 |
| 11 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 20 秒；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：侧卧撑肘、上面的脚往上抬（反蚌式）、屁股侧面高亮（b12 第 5 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s（抬 1.0 / 停 1.0 / 放 1.5），顶上停 1 秒维持 rep_hold
- 新增 sideSwitchSeconds 10（翻身换边侧躺）
- purpose「练臀部…更有控制」→「练屁股侧面，让大腿往里转也有劲」；「髋部…幅度小一点」→「胯不舒服就抬低点」；cue2 补「撑着手肘」（画面）
- 难度 1/1 不变

## 8. 待开哥定
- 无
