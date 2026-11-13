# s-pigeon 鸽子式（Pigeon Stretch）· 动作包核对 r3

- 类型：`hold`，单侧 each-side-separately；动画源 `drill-anim/specs/s-pigeon-r1.js`；V4 预览 `/workspace/work/v4run/batch-23.jpg 第 1 行`（本机路径，不入库）
- reviewStatus：`ai-reviewed-r2-needs-user-review` → `ai-reviewed-r3-needs-user-review`

## 1. 训练参数
- 改前：2 组×每侧45 秒，休息 15 秒
- 改后：2 组×每侧30 秒，休息 15 秒
- 单侧算法：一侧做完全部组/次数再换另一侧

## 2. 计数节奏
- training.phases（动画一下）：计时（无 phases）
- 结论：计时类，不涉及每下节奏

## 3. 指导文字
- 常见错误 改前：骨盆歪向一边；硬压前腿膝盖；憋气或来回颠
- 常见错误 改后：骨盆歪向一边；硬压前腿膝盖；憋气或来回颠
- 注意事项 改前：膝盖疼时垫高臀部，或换成仰卧4字拉伸
- 注意事项 改后：膝盖疼时垫高臀部，或换成仰卧4字拉伸
- 名称、purpose、要点、相位口令：已逐条核对，符合 STYLE.md，未改

## 4. voiceGuide（脚本，未合成音频）
| 秒 | 中文 | English | 约时长 | 出处 |
|---|---|---|---|---|
| 0 | 开始 | Go |  | 共用词 p.go |
| 5 | 骨盆摆正，别歪向一边 | Square your hips, don't tilt | 2.2s | commonErrors[0], cue2 |
| 14 | 过半了，呼气再放松一点 | Halfway. Breathe out and relax deeper | 2.5s | cue3 |
| 22 | 别硬压膝盖，有拉伸感就够 | Don't force the knee. A stretch is enough | 3.2s | commonErrors[1], cue4 |
| 27 | 三 | three |  | 共用词 n.3 |
| 28 | 二 | two |  | 共用词 n.2 |
| 29 | 一 | one |  | 共用词 n.1 |

组结束：moreSetsSameSide → 休息 + 15 秒；sideDone → 慢慢还原 + 换左边；allDone → 慢慢还原 + 很好

## 5. 画面对照
- 画面对照（V4 batch-23）：鸽子式、双手扶两块瑜伽砖、前侧髋下有垫，与名称/要点/器械一致；高亮只在前腿臀部（purpose 还写了后腿髋前侧，未高亮），非极端错误
- 极端错误（另一个动作 / 器械不对 / 高亮完全不对）：**无**

## 6. 改了什么、为什么
- 剂量 每侧 2 组×45 秒 → 每侧 2 组×30 秒，组间休息 15 秒不变：入门静态拉伸常规每次 20–30 秒（STYLE §5），每侧累计 60 秒已够；45 秒×2 对入门偏长，前膝和髋在末端受力时间过久
- 单侧算法明确：一侧 2 组做完再换边（少进出一次鸽子式），秒数指每侧每组；组间 15 秒留在原位抬起上身放松
- 新增 voiceGuide（30 秒时间轴：5 秒姿势自查、14 秒过半+呼气、22 秒别压膝、27–29 秒倒数），句子取自 commonErrors[0]/[1]、cue2/3/4
- 文字核对：要点、常见错误、注意事项准确口语，未改

## 7. 待开哥定
- 换边准备时间 App 未定义：从右侧鸽子式换到左侧要 5–10 秒，建议换边时给 10 秒准备（或用 restSeconds）
- 30 秒还是保留 45 秒请开哥定；若保留 45 秒，voiceGuide 需在 32 秒处再加一句
- purpose 写了「后腿髋前侧」但高亮只有前腿臀部，是否补后腿髋前侧高亮（只报告，未改模型）
- ai-tags 难度 3，本文件 tags.difficulty 2，两处不一致
