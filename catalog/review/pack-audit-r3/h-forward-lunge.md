# h-forward-lunge 前跨步弓步蹲（Forward Lunge）· 动作包核对 r3

- 类型：`rep_alternate`，单侧 alternate；动画源 `drill-anim/specs/h-forward-lunge-et1-kn1.js`；V4 预览 `/workspace/work/v4run/b10.jpg 第 2 行`（本机路径，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 训练参数
- 改前：3 组×每侧8 次，休息 45 秒
- 改后：3 组×每侧8 次，休息 60 秒
- 单侧算法：左右轮流，一左一右算 1 次，次数=每侧次数

## 2. 计数节奏
- training.phases（动画一下）：go 1.5s / hold 0.7s / back 1.3s / rest 1.5s；一下 5.0 s
- 结论：未调整（见下方理由）

## 3. 指导文字
- 常见错误 改前：前膝往里扣；上身前倾太多
- 常见错误 改后：前膝往里扣；上身前倾太多；后膝砸到地上
- 注意事项 改前：膝盖不舒服时蹲浅一点，仍痛就停止
- 注意事项 改后：膝盖不舒服时蹲浅一点，仍痛就停止
- 名称、purpose、要点、相位口令：已逐条核对，符合 STYLE.md，未改

## 4. voiceGuide（脚本，未合成音频）
- 一下 10.0 s，相位口令：`first-2-reps`，每下结束报数

| 第几下后 | 中文 | English | 约时长 | 出处 |
|---|---|---|---|---|
| 2 | 前膝对着脚尖 | Front knee over your toes | 2.0s | cue2 |
| 4 | 过半了，上身别前倾 | Halfway. Don't lean forward | 2.0s | commonErrors[1] |
| 6 | 后膝轻轻落，别砸地 | Lower the back knee gently | 2.0s | commonErrors[2] |
| 7 | 最后一次 | Last one |  | 共用词 p.last_rep |

组开始前：先做右边；组结束：moreSets → 休息 + 1 分钟；allDone → 很好

## 5. 画面对照
- 画面对照（V4 b10）：站姿弓步、无器械、大腿前侧+臀部高亮，一致
- 极端错误（另一个动作 / 器械不对 / 高亮完全不对）：**无**

## 6. 改了什么、为什么
- 组间休息 45 → 60 秒：一组左右各 8 次共 16 步、约 80 秒，入门下肢大动作取 STYLE 力量范围上限
- 剂量其余不变：3 组×每侧 8 次（左右轮流，一左一右算 1 次）
- 节奏核对：动画每侧 5 秒（跨步下蹲约 1.5 s、底部约 0.5 s、推回 1.3 s、站立 1.5 s），1 次（左+右）10 秒，大幅度动作 4–6 秒/侧，跟得上，未调整
- commonErrors 补「后膝砸到地上」：入门弓步最常见的错误之一
- 新增 voiceGuide（前 2 次念相位口令，之后每次报数；第 2/4/6 次后各一句要点，第 7 次后「最后一次」）

## 7. 待开哥定
- phaseCues 方案：前 2 次念「跨步下蹲/稳住/推地退回」，之后只报数+隔几次提醒；也可以每次都念相位，请开哥定（5 个样例统一）
