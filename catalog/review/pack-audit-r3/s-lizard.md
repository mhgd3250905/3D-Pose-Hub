# s-lizard 蜥蜴式低弓步（Lizard Lunge）· 动作包核对 r3

- 类型：`hold`，单侧 each-side-separately，先做 left；V4 预览：`/workspace/work/v4run/b22.jpg 第 10 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧45 秒，休息 15 秒
- 改后：2 组×每侧30 秒，休息 15 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：计时 → 计时
- 相位：计时

## 3. 难度
- 改前 v3 2 / ai-tags 2 → 统一 2

## 4. 指导文字（教练口吻）
- purpose：拉伸后腿髋前侧和前腿大腿内侧 → 拉开后腿胯前面和前腿大腿内侧
- 要点 改前：髋部慢慢往前往下沉；前脚远远踩在前面，后膝跪地，双手扶砖。；保持不动，慢慢呼吸，每次呼气再放松一点。；别来回颠，有拉伸感就够，别拉到疼。
- 要点 改后：胯慢慢往前往下沉；前脚远远踩在前面，后膝跪地，两手扶砖。；就停在这儿，慢慢喘气，每次呼气再松一点。；别一下一下往下压，有拉的感觉就够，别拉到疼。
- 常见错误 改前：前膝往里扣或远远超过脚尖；耸肩塌背；憋气或来回颠
- 常见错误 改后：前膝往里倒或远远超过脚尖；耸肩塌背；憋气或一下一下往下压
- 注意事项 改前：跪地的膝盖下面垫软垫；髋或大腿内侧疼时幅度小一点，还疼就停
- 注意事项 改后：跪着的膝盖下面垫软垫；胯或大腿内侧疼就沉少点，还疼就停
- 相位口令：髋部下沉 / 保持，慢慢呼气 / 呼气再沉点 → 胯往下沉 / 停住，呼气 / 呼气再沉点

## 5. voiceGuide（脚本，未合成音频）
| 秒 | 中文 | English | 出处 |
|---|---|---|---|
| 0 | 开始 | Go | p.go |
| 4 | 前膝别往里倒 | Front knee out | commonErrors[0] |
| 12 | 肩膀别耸 | Shoulders down | commonErrors[1] |
| 20 | 呼气，再松一点 | Breathe out, let go | cue3 |
| 27 | 三 | three | n.3 |
| 28 | 二 | two | n.2 |
| 29 | 一 | one | n.1 |
- 组后：moreSetsSameSide → 休息 + 15 秒；sideDone → 慢慢还原 + 换右边；allDone → 慢慢还原 + 很好

## 6. 画面对照
- 一致：蜥蜴式低弓步两手撑在前脚内侧、胯前/大腿内侧淡高亮（b22 第 10 行）
- 极端错误：无

## 7. 改了什么、为什么
- 剂量 每侧 2 组×45 秒 → 2 组×30 秒（静态拉伸统一 30 秒），休息 15 秒不变
- 新增 sideSwitchSeconds 10（低弓步换前后腿要重新摆）
- 「髋部」→「胯」；「幅度小一点」→「沉少点」
- 难度 2/2 不变
- 「别来回颠」→「别一下一下往下压」

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点3：就停在这儿，慢慢喘气，每次呼气再松一点。 → 两手撑在前脚里面，后膝着地，胯往下沉。（Stay right there, breathe slowly, let go a little more each breath out. → Hands inside your front foot, back knee down, hips sinking.）
- 要点4：别一下一下往下压，有拉的感觉就够，别拉到疼。 → 呼气时胯再往地上沉一点，够了就换小臂撑。（Don't bounce. A clear stretch is enough, never pain. → Each breath out, sink your hips lower. Drop to your forearms only if it feels easy.）
- 常见错误3：憋气或一下一下往下压 → 前脚往里收，前膝往里倒（Holding your breath or bouncing. → Front foot creeping in and the knee falling inward.）
- 相位口令 end：呼气再沉点 → 呼气胯下沉（Sink a bit more → Hips lower）
- 语音 set[3]：呼气，再松一点 → 胯往地上沉（Breathe out, let go → Let your hips sink）
- 相位口令 peak：停住，呼气 → 手撑在里面（Hold, breathe out → Hands inside）
