# h-chair-progressive-front-split-native 扶椅渐进前后劈叉（Chair-Supported Progressive Front Split）· 动作包核对 r3

- 类型：`hold`，单侧 each-side-separately，先做 right；V4 预览：`/workspace/work/v4run/b6.jpg 第 7 行`（本机，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 剂量
- 改前：2 组×每侧45 秒，休息 15 秒
- 改后：2 组×每侧30 秒，休息 15 秒；换边准备 10 秒（App 未接入）

## 2. 真实节奏（与演示动画时长无关）
- 一下：计时 → 计时
- 相位：计时

## 3. 难度
- 改前 v3 2 / ai-tags 4 → 统一 3（前后劈叉对入门者柔韧要求高；ai-tags 原 4（1–5 制）。）

## 4. 指导文字（教练口吻）
- purpose：一点点拉开大腿后侧和髋前侧 → 一点点拉开大腿后面和大腿根前面
- 要点 改前：一手轻扶椅子，前后腿慢慢滑开；只滑到能控制的地方，髋部朝前。；停住不动，慢慢呼吸。；每次呼气再放松一点，别来回颠。
- 要点 改后：一手轻扶椅子，前后腿慢慢滑开；只滑到自己撑得住的地方，两边胯朝前。；就停在这儿，慢慢喘气。；每次呼气再松一点，别一下一下往下压。
- 常见错误 改前：一下子滑得太远；憋气；来回颠着往下压
- 常见错误 改后：一下子滑太远；憋气；一下一下往下压
- 注意事项 改前：只拉到舒服的程度，疼就放松；用结实、不带轮子的椅子
- 注意事项 改后：拉到舒服就行，疼就松一点；用结实、不带轮子的椅子
- 相位口令：慢慢滑开 / 保持，慢慢呼气 / 呼气再放松 → 慢慢滑开 / 停住，呼气 / 呼气再松

## 5. voiceGuide（脚本，未合成音频）
| 秒 | 中文 | English | 出处 |
|---|---|---|---|
| 0 | 开始 | Go | p.go |
| 4 | 胯朝前，别歪 | Hips face forward | cue2 |
| 12 | 撑得住就停，别硬滑 | Only as far as you can hold | cue2, commonErrors[0] |
| 20 | 呼气，再松一点 | Breathe out, let go | cue4 |
| 27 | 三 | three | n.3 |
| 28 | 二 | two | n.2 |
| 29 | 一 | one | n.1 |
- 组后：moreSetsSameSide → 休息 + 15 秒；sideDone → 慢慢还原 + 换左边；allDone → 慢慢还原 + 很好

## 6. 画面对照
- 一致：扶椅前后劈叉、大腿后侧/髋前高亮（b6 第 7 行）
- 极端错误：无

## 7. 改了什么、为什么
- 剂量 每侧 2 组×45 秒 → 30 秒（静态拉伸统一 30 秒，开哥 11-14 同意）
- 新增 sideSwitchSeconds 10（地上换前后腿）
- 难度 v3 2 / ai-tags 4 → 统一 3
- 「能控制的地方」→「自己撑得住的地方」，「髋部朝前」→「两边胯朝前」

## 8. 待开哥定
- 无

## r3 第二遍（去套话，2026-11-14）

跨动作重复的句子按这个动作真实怎么做、最容易错在哪重写（改前 → 改后）：

- 要点3：就停在这儿，慢慢喘气。 → 滑到大腿后面和胯前面有拉的感觉就停。（Stay right there and breathe slowly. → Stop when you feel it in the back of the front leg and the front of the hip.）
- 要点4：每次呼气再松一点，别一下一下往下压。 → 呼气时前脚再往前滑一点点，手撑住椅子分担重量。（Each breath out, let go a little more. Don't bounce. → Each breath out, slide your front foot a touch further and let the chair take weight.）
- 常见错误3：一下一下往下压 → 一下滑太开，手上撑不住（Bouncing to go deeper. → Sliding too far at once so your hands can't hold you.）
- 注意事项1：拉到舒服就行，疼就松一点 → 大腿后面或腹股沟刺疼就滑回来一点（Stretch only to a comfortable point. Ease off if anything hurts. → If the back of your thigh or groin gets a sharp pain, slide back in.）
- 注意事项2：用结实、不带轮子的椅子 → 两边椅子都要稳，地面别太滑（Use a sturdy chair without wheels. → Both chairs need to be steady, and the floor not too slippery.）
- 语音 set[3]：呼气，再松一点 → 呼气，前脚再滑一点（Breathe out, let go → Breathe out, slide a bit more）
