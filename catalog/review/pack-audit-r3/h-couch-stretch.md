# h-couch-stretch 后脚搭凳沙发拉伸（Couch Stretch on a Stool）· 动作包核对 r3

- 类型：`hold`，单侧 each-side-separately，先做 left；V4 预览：`/workspace/work/v4run/b7.jpg 第 4 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧45 秒，休息 15 秒
- 改后：2 组×每侧30 秒，休息 15 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：计时 → 计时
- 相位：计时

## 3. 难度
- 改前 v3 2 / ai-tags 3 → 统一 2（大腿前面很紧的人拉起来吃力；ai-tags 原 3（1–5 制）。）

## 4. 指导文字（教练口吻）
- purpose：拉伸后腿的髋前侧和大腿前侧 → 拉开后腿大腿根前面和大腿前面，坐久了胯前面发紧最管用
- 要点 改前：上身挺直，收紧臀部把髋往前送；后脚脚背搭在矮凳上，前脚踩稳，双手叉腰。；停住不动，慢慢呼吸。；每次呼气再放松一点，别来回颠。
- 要点 改后：上身挺直，夹紧屁股把胯往前送；后脚脚背搭在矮凳上，前脚踩稳，两手叉腰。；就停在这儿，慢慢喘气。；每次呼气再松一点，别一下一下往下压。
- 常见错误 改前：腰往后仰，没收紧臀部；憋气；来回颠着往下压
- 常见错误 改后：腰往后仰，屁股没夹紧；憋气；一下一下往下压
- 注意事项 改前：只拉到舒服的程度，疼就放松；后膝下面垫软垫，膝盖不舒服就幅度小一点
- 注意事项 改后：拉到舒服的拉扯感就行，太紧就上身往前倾一点；后膝底下垫块软垫，膝盖不舒服就往前挪一点
- 相位口令：髋往前送 / 保持，慢慢呼气 / 呼气再放松 → 胯往前送 / 停住，呼气 / 呼气再松

## 5. voiceGuide（脚本，未合成音频）
| 秒 | 中文 | English | 出处 |
|---|---|---|---|
| 0 | 开始 | Go | p.go |
| 4 | 夹紧屁股，腰别往后仰 | Squeeze your butt, don't arch | cue1, commonErrors[0] |
| 12 | 上身挺直 | Stay tall | cue1 |
| 20 | 呼气，再松一点 | Breathe out, let go | cue4 |
| 27 | 三 | three | n.3 |
| 28 | 二 | two | n.2 |
| 29 | 一 | one | n.1 |
- 组后：moreSetsSameSide → 休息 + 15 秒；sideDone → 慢慢还原 + 换右边；allDone → 慢慢还原 + 很好

## 6. 画面对照
- 一致：后膝跪地、后脚搭凳（沙发拉伸）、大腿前面高亮（b7 第 4 行）
- 极端错误：无

## 7. 改了什么、为什么
- 剂量 每侧 2 组×45 秒 → 30 秒（静态拉伸统一 30 秒，开哥 11-14 同意）
- 新增 sideSwitchSeconds 10（后脚从凳子上拿下来换腿、重新跪好）
- 难度 v3 2 / ai-tags 3 → 统一 2；退阶「上身往前倾一点」写进注意事项
- 「收紧臀部把髋往前送」→「夹紧屁股把胯往前送」，「别来回颠」→「别一下一下往下压」，「幅度小一点」→「往前挪一点」

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点3：就停在这儿，慢慢喘气。 → 后膝贴地别动，屁股夹住，大腿前面一路被拉开。（Stay right there and breathe slowly. → Back knee stays put, butt squeezed, feel the front of that thigh open.）
- 要点4：每次呼气再松一点，别一下一下往下压。 → 呼气时屁股再夹紧一点，胯往前送一点点。（Each breath out, let go a little more. Don't bounce. → Each breath out, squeeze a little harder and nudge your hips forward.）
- 常见错误1：腰往后仰，屁股没夹紧 → 胸口往后仰，腰被折成拱（Arching your lower back instead of squeezing your butt. → Leaning your chest back and bending your lower back.）
- 常见错误3：一下一下往下压 → 上身往前趴，大腿前面没拉到（Bouncing to go deeper. → Leaning forward so the front of your thigh loses the stretch.）
- 语音 set[3]：呼气，再松一点 → 呼气，屁股再夹紧（Breathe out, let go → Breathe out, squeeze harder）
