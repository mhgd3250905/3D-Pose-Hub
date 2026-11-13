# o-seated-twist 坐姿扶椅扭转（Seated Chair Twist）· 动作包核对 r3

- 类型：`hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b19.jpg 第 8 行`（本机，不入库）
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
- purpose：转动上背和腰，缓解久坐僵硬 → 转转上背和腰，久坐僵了松一松
- 要点 改前：坐直，身体转向一侧，手扶椅背；另一只手扶在转向那侧的膝盖外面。；保持不动，慢慢呼吸，每次呼气再放松一点。；别来回颠，有拉伸感就够，别拉到疼。
- 要点 改后：坐直，身子转向一边，手扶椅背；另一只手扶在转过去那边的膝盖外面。；就停在这儿，慢慢喘气，每次呼气再松一点。；别一下一下往下压，有拉的感觉就够，别拉到疼。
- 常见错误 改前：弓着背扭；用手猛拉加深；憋气或来回颠
- 常见错误 改后：弓着背扭；用手猛拉往深转；憋气或一下一下往下压
- 注意事项 改前：腰背疼时转得少一点，还疼就停
- 注意事项 改后：腰背疼就转少点，还疼就停
- 相位口令：慢慢转身 / 保持，慢慢呼气 / 呼气再转点 → 慢慢转身 / 停住，呼气 / 呼气再转点

## 5. voiceGuide（脚本，未合成音频）
| 秒 | 中文 | English | 出处 |
|---|---|---|---|
| 0 | 开始 | Go | p.go |
| 4 | 坐直，别弓 | Sit tall | cue1, commonErrors[0] |
| 12 | 别用手猛拉 | Don't yank | commonErrors[1] |
| 20 | 呼气，再松一点 | Breathe out, let go | cue3 |
| 27 | 三 | three | n.3 |
| 28 | 二 | two | n.2 |
| 29 | 一 | one | n.1 |
- 组后：moreSetsSameSide → 休息 + 15 秒；sideDone → 慢慢还原 + 换左边；allDone → 慢慢还原 + 很好

## 6. 画面对照
- 一致：坐椅转身扶椅背、侧腰高亮（b19 第 8 行）
- 极端错误：无

## 7. 改了什么、为什么
- 剂量 每侧 2 组×30 秒、休息 15 秒不变；原地换边，不加换边准备
- 「转动上背和腰」→「转转上背和腰」
- 「别来回颠」→「别一下一下往下压」
- 难度 1/1 不变

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点3：就停在这儿，慢慢喘气，每次呼气再松一点。 → 转到胸口对着椅背就停，脑袋跟着慢慢转过去。（Stay right there, breathe slowly, let go a little more each breath out. → Turn until your chest faces the backrest, head following slowly.）
- 要点4：别一下一下往下压，有拉的感觉就够，别拉到疼。 → 转到有感觉就停，别用手硬掰椅背。（Don't bounce. A clear stretch is enough, never pain. → Stop when you feel it. Don't crank yourself around with your hands.）
- 常见错误3：憋气或一下一下往下压 → 屁股跟着在椅子上挪（Holding your breath or bouncing. → Shifting your butt on the seat as you turn.）
- 注意事项1：腰背疼就转少点，还疼就停 → 腰扭着疼就转一半，坐直了再转（If your back hurts, don't turn as far. Stop if it still hurts. → If your back hurts in the twist, only turn halfway and sit taller.）
- 相位口令 end：呼气再转点 → 呼气坐高点（Turn a bit more → Sit taller）
- 语音 set[3]：呼气，再松一点 → 呼气，坐高一点再转（Breathe out, let go → Breathe out, sit tall, turn）
