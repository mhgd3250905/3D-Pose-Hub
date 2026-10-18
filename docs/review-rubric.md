# 动作设计审核标准

给审核和优化 `drill-anim/specs/*.js` 的人/agent 用。每一项都写了**低配机上怎么查**：看 spec 哪个字段、metrics 哪个值（[START-HERE §5](START-HERE.md#5-在低配机上验证到什么程度) 有字段说明）、渲哪几帧。数值 QA 全过 ≠ 动作合格；反过来，数值不过的项必须解释或修好。

**每个动作的最低预览帧集**（`--pr 0.5 --jobs 1`，用交付主题）：`keyFrames` 对应的帧；每次重复的起点、发力顶点、回程中点；循环首帧 0 和最后一帧（`round(duration×fps)−1`）；`stillAt` 的 `still.png`。单侧动作再加一帧另一侧机位或镜像核对。帧号 = 秒 × spec 的 `fps`。

结论分三档写进 PR：**通过** / **小改（列具体参数）** / **重做（说清楚原因和替代方案）**。

## 1. 安全与剂量（一票否决）

| 要求 | 怎么查 |
|---|---|
| 面向普通用户/初中级，**保守幅度**：末端停在“有拉伸感”的位置，不演示极限柔韧或炫技 | 看顶点帧的关节角：`limits.hip_flex_deg_range`、`hip_abd_true_deg_range`、`waist_bend_deg_max`；拉伸类髋屈接近 135° 上限、或 `qa.hipFlexMax` 被放宽的，要在 spec 注释里有理由 |
| 节奏慢、可控：拉伸停留、力量动作匀速，无弹振 | 读 `timeline.tracks`：上/停/下/歇时长；拉伸停留 ≥ 2 s，发力段不短于约 1 s；不要出现 0.2 s 内大幅度往返 |
| 不演示已知高风险姿势：膝内扣负重、腰椎在负重下大幅屈曲、颈部受压、膝超伸锁死负重 | 看起/顶帧；膝的朝向看 `limits.knee_flex_backward`，膝内扣看正面帧膝与脚尖的方向 |
| 重复次数/循环与 App 处方相符（如 FlareLab 的 `data/drills.json` 的 `prescription`、`safety`） | 读 `timeline.duration` 和重复次数；循环里“每侧”动作要么两侧都有，要么单侧并在 PR 说明 App 如何处理另一侧（HipLab 播放端镜像） |
| 道具承重可信：椅子不滑、球不滚、手撑在稳定面上 | 道具 `props` 的位置与接触帧；`pins` 对撑在道具上的手同样适用 |

## 2. 目标肌群与高亮（解剖正确）

| 要求 | 怎么查 |
|---|---|
| `highlight.groups` 是这个动作**主要被拉伸或主动发力**的肌群，与动作名、App 文案一致（例：蝴蝶式 = 内收肌群；90/90 后腿抬起 = 臀中肌/髋外展；四足画圈 = 臀大肌 + 臀中肌） | 对照 spec 头注释和 `data/drills.json` 的 `groupId`/`why`；深层肌（髋屈肌、深层外旋肌）只能显示体表投影，文档里注明 |
| 单侧动作 `side` 选对工作侧；拉伸侧和发力侧不要混 | 读 `side`；看顶点帧光晕在哪条腿/哪侧躯干 |
| 光晕读得出来：正对或侧对镜头，不被肢体完全挡住；soft-v1 下是一整块柔和光晕，没有碎块/锯齿/台阶 | 用 `--theme themes/glow-soft.json` 看顶点帧和一帧过渡帧；如果目标肌群背对镜头（如深蹲臀肌在正面机位）要改机位或接受并注明 |
| `pulseAt` / `pulseTrack` 与发力时刻对齐：发力/停留时亮，放松时暗 | 读 `pulseTrack` 指向的轨道或 `pulseAt` 时刻，和 `timeline` 对照；看发力帧和放松帧亮度对比 |
| 能用 `groups` 就不用 `panels` 拼；拼面板要说明原因（soft-v1 下 `h-quad-cars-r2` 的拼法反而多出一团，见 drill-catalog） | 读 `highlight.panels`、`inset` |

## 3. 姿势可信度（物理）

| 要求 | 怎么查 |
|---|---|
| **脚/手锁定**：撑地的手、着地的脚整圈不滑 | `pins.*.drift_mm_max < 5`、`jointPins`；稀疏 QA 至少覆盖每次重复的起/顶/回；滑动是设计的一部分（滑垫、腿弯举）要在 spec 注释和 qa 里排除 |
| **不穿地**：鞋底、手、膝、臀贴地但不陷 | `below_floor=false`、`min_vertex_y_m ≥ −0.002`；看 `min_vertex_mesh`；侧面帧看鞋底与垫面 |
| **贴地的部位真的贴地**：坐姿/跪姿/卧姿时臀、膝、前臂、背部不悬空 | 侧面帧目测；跪地膝用 `jointPins` 的 `height_mm_range` |
| **关节限位**：膝不反折、肘不反折、髋/腰在生理范围 | `limits.knee_flex_backward`、`elbow_flex_forward`、`hip_ok`、`waist_ok` |
| **该直的直**：直腿、直臂支撑 | `straight.*.min_deg ≥ min`（常用 165–175°） |
| **不自穿模**：手不进大腿、前臂不进躯干、两腿不互穿 | `self_clip.worst_gap_mm`（重叠 < 8 mm）、`hand_clip.*.min_signed_mm ≥ −0.5`；`allowContact` 只放真正贴住的对 |
| **手接触**：抱膝、扶椅、手放大腿时，手贴在表面上（间隙 ≤ 4 mm）而不是悬空或陷入 | `qa.touch` 的 gap；放大看手指与接触面 |
| **道具不穿模**：手握把手、脚踩器械、身体靠椅背 | 看接触帧；有 QA 图元的道具在 `drill-anim/` 下运行 `node tools/probe.mjs specs/<id>.js tools/propclear.js`（需先手动起 Vite）报每只手/骨到道具的间隙 |
| **求解告警帧（含未收敛及肢体目标超出可达范围）** | `solver_warning_frames` 只计含告警的帧，不区分类别；须读取对应帧的具体告警消息，分别检查是否未收敛，或手腕/脚踝目标被截在可达范围内，不把全部告警统一解释为未收敛 |
| **左右/朝向一致**：spec 注释说的左侧（±X）与实际高亮侧、工作腿一致；动作名里的“左/右”与画面一致 | 读头注释；正面帧核对 |

## 4. 镜头、构图与循环

| 要求 | 怎么查 |
|---|---|
| 全身完整在画面里，手机竖屏/方形裁切也不切手脚 | `frame_edge_touch_frames = 0`；看幅度最大的那一帧 |
| 机位能看清要点：目标肌群、关键关节角（如 90/90 两腿角度用俯侧视） | 看顶点帧；`camera.dir`、`fit` 关节 |
| 镜头不晃人：`drift` 小，周期整除循环 | 读 `camera.drift`、`driftPeriod`（必须整除 `duration`） |
| **循环无跳**：最后一帧接回第 0 帧时姿态、相机、光晕连续 | 渲首帧和最后一帧并排看；轨道首尾值相同（verify 会拦非法键时间；`terminalTracks` 例外要登记） |
| 每次重复一样长、一样高 | 读 tracks；比较两次重复的顶点帧 |

## 5. 统一性

| 要求 | 怎么查 |
|---|---|
| 人体：`modelProfile: 'training-human-v2'`、`alignClavicles: false` | 读 spec；catalog 的 profile 列为“旧”的动作重做时必须补上 |
| 主题：HipLab 新成片用 `themes/glow-soft.json`；同一版本内所有动作同一主题 | PR 渲染请求块写明 |
| 帧率：交付统一 30 fps；spec 原生 15 fps 的由主线包装 | PR 写明 spec 原生 fps |
| 道具/场景与同类动作一致（同一把办公椅、同一张垫） | 对照同前缀动作的 `props` |

## 6. 教学清晰度

| 要求 | 怎么查 |
|---|---|
| **一个动作只教一件事**：一个主目标、一种动作模式；不要在一个循环里混两个练习（例：坐姿夹砖只做内收，外推另做） | 读头注释和 tracks 数量；多段不同动作的要拆 |
| 动作幅度足够看清，但不过度 | 顶点帧与起始帧的差别一眼可辨；自测对比图三档（松/一般/紧）彼此明显不同 |
| 起始姿势清楚、可模仿：第 0 帧就是用户该摆的起始位 | 看第 0 帧和 `still.png` |
| 名称、器械、场景与画面一致（中文名说“扶椅”，画面就要有椅子并真的扶着） | 对照 `name`、`props`、App 文案 |
| 不和已有动作重复：先查 [drill-catalog.md](drill-catalog.md) 有没有同名/同模式的 spec，能用修订就不新建 | catalog 按类别搜 |

## 审核记录模板（每个动作一段，贴进 PR）

```text
### <id>（<中文名>） — 通过 / 小改 / 重做
- 规格：drill-anim/specs/<file>.js，SHA <前 12 位>，主题 <…>，spec fps <…>
- 看过的帧：<帧号列表>（--pr 0.5），截图：<…>
- 稀疏 QA：below_floor <…>，pins max <…> mm，straight min <…>°，self_clip <…> mm，hand_clip min <…> mm，solver_warning <…>，edge <…>
- 1 安全：<…>  2 高亮：<…>  3 姿势：<…>  4 构图/循环：<…>  5 统一：<…>  6 教学：<…>
- 结论与改法：<具体参数 / 新 spec 名>
```
