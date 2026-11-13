# obliques-C 绳索高位伐木（High-to-Low Cable Woodchop）· 动作包核对 r3

- 类型：`rep_updown`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b21.jpg 第 8 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：3 组×每侧8 次，休息 60 秒
- 改后：3 组×每侧8 次，休息 60 秒

## 2. 真实节奏（与演示动画时长无关）
- 一下：4.0 s → 3.5 s
- 相位：go 1.0s / hold 0.5s / back 2.0s

## 3. 难度
- 改前 v3 2 / ai-tags 2 → 统一 2

## 4. 指导文字（教练口吻）
- purpose：练肩膀和髋一起转的力量 → 练肩膀和胯一起转的劲
- 要点 改前：从高处斜着往下拉到另一边髋外侧；手臂基本伸直，肩和髋一起转。；后脚跟着转，再慢慢回到高处。
- 要点 改后：从高处斜着往下拉到另一边胯外面；手臂差不多伸直，肩膀和胯一起转。；后脚跟着转，再慢慢回到高处。
- 常见错误 改前：只用手臂拉；只扭腰，髋不动
- 常见错误 改后：只用手臂拉；只扭腰，胯不动
- 注意事项 改前：腰发紧或疼时转小一点
- 注意事项 改后：腰发紧或疼就转小点
- 相位口令：斜着往下拉 / 停住 / 慢慢回去 → 斜着往下拉 / 停住 / 慢慢回去

## 5. voiceGuide（脚本，未合成音频）
- 一下 3.5 s；前 2 下念相位口令，之后每下报数
| 第几下后 | 中文 | English | 出处 |
|---|---|---|---|
| 2 | 肩膀和胯一起转 | Shoulders and hips together | cue2, commonErrors[1] |
| 5 | 别只用手拉 | Not just your arms | commonErrors[0] |
| 7 | 最后一次 |  | p.last_rep |
- 组后：moreSets → 休息 + 1 分钟；allDone → 很好；sideDone → 换左边

## 6. 画面对照
- 一致：站姿绳索高位往下斜拉（伐木）、侧腰高亮（b21 第 8 行）
- 极端错误：无

## 7. 改了什么、为什么
- 节奏按真实带练：一下 4.0 s → 3.5 s（拉 1.0 / 停 0.5 / 慢回 2.0）；顶点 < 0.8 s，kind rep_hold → rep_updown，r2「恰在阈值」flag 结束
- 站着转身换边，不加换边准备
- 「髋」→「胯」
- 难度 2/2 不变

## 8. 待开哥定
- 无
