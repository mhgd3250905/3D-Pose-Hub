# 动作库视觉审核（2026-10-19）

范围：云盘「当前登记版」166 个动作的绿幕成片（`media/drive-sync.json` 中 `kind=registered` 的 greens，逐个 SHA-256 核对）。
方法（低配机）：每片 8 帧等距拼图人工审看 + 自动指标（主体占画面比、触边、青色高亮像素面积/零帧比/碎块数/边缘粗糙度）；
可疑项用 `drill.py render --frames … --pr 0.5 --jobs 1` + `drill.py qa` 复核关节数值。未做任何全片渲染。
逐条原始审看记录见 [2026-10-19-visual-audit-raw.md](2026-10-19-visual-audit-raw.md)（拼图印象，未复核的不作结论）。

## 关键结论

1. **看起来像“关节错误”的，复核后几乎都是镜头透视造成的错觉。** 下列 8 项在拼图上被判为关节/接触错误，用 spec 关节坐标复核后均不成立：
   | 动作 | 拼图上的印象 | 数值复核 |
   |---|---|---|
   | h-incline-pushup | 双脚悬空 | 鞋底最低点 0 mm，贴地；凳子离镜头更近造成错觉 |
   | w-prone-swimmer | 俯卧时手臂竖直朝天 | 手腕只比肩高 2–15 cm，贴垫悬停；高位机位把远侧手臂投影成竖直 |
   | h-towel-pass | 棍子穿头、两臂不对称 | 双肘 179.9°；过头时棍距头顶约 10 cm |
   | h-band-pull-apart | 弹力带穿过胸口 | 终点手腕在胸前 28 cm，左右对称 |
   | h-chair-dip | 手悬空、耸肩 | 手锚点漂移 0.28 mm，最低点肩高于手 25 cm |
   | n-half-split | 前腿弯 | 前膝 149°→169° 逐步伸直（设计如此） |
   | lats-A | 臀没抬起 | 骨盆抬起 5 cm（幅度小，但有） |
   | rotator-cuff-C | 动作做错（直臂前伸） | spec 是正确的 90/90；右侧机位把前臂缩短成一个点 |
   → 所以本库最大的问题是 **镜头**：它让正确的动作看起来像错的，也让目标肌群背对镜头。

2. **高亮看不见**：rotator-cuff-B、hip-abductors-B、n-chair-wiper 全程 0 像素；hip-flexors-B 65% 帧为 0；o-stand-crossreach、adductors-B、s-9090、n-seated-ir-drop、s-figure4、n-slider-lateral、hip-abductors-C 几乎看不到。原因都是目标肌在身体背面/贴地面，而机位是正面或俯视。

3. **高亮观感**（下一轮，引擎/主题层面）：大腿高亮中间的暗色接缝（h-squat、h-bulgarian、w-wall-sit、quadriceps-A）、碎块与锯齿（n-straddle-fold、h-wall-straddle、h-sumo-pry、n-squat-shift 裆部连片）、方块贴片感（obliques-B、t-seated-straddle-ext、lats-C）、橙色描边/光斑（n-seated-ir-drop、s-figure4 最明显）。这些是 soft-v1 遮罩/主题的共性问题，不宜逐个改 spec。

## 优先级

- **P0 安全/动作错误**：复核后**无确认项**。待用数值复核的剩余候选：t-lsit-wide / t-lsit-tuck / t-lsit-vsit-circles / t-lsit-open-close（L 撑臀部离地仅约 2–3 cm，正面机位下看起来就是坐着）、hip-flexors-A（脚跟只抬 6 cm）、s-9090（名为换髋但不换边；换边版是 s-9090-switch）。
- **P1 镜头让动作或目标肌不可读**（本 PR 处理 10 项，见下）；剩余：hip-flexors-B（试过前右 3/4，抬膝顶点仍被大腿挡住，需改高亮而非镜头，未纳入）、adductors-B、n-seated-ir-drop、s-figure4、hip-abductors-C、n-slider-lateral、chest-A、scapular-A、t-vsit、t-lsit-*、w-wall-sit、h-pike-pushup、rotator-cuff-A、obliques-A/B、h-band-pallof。
- **P2 高亮美术/构图**：上面第 3 条的共性问题，以及人物偏小（s-frog、s-pigeon、hamstrings-B）、动作幅度偏小（h-9090-liftoff、n-seated-knee-lift、quadriceps-B、h-band-pull-apart 拉开约 55°）。

## 本 PR：只改镜头的修订版（不动姿态/时间轴/高亮/道具）

| 修订版 | 来源 | 改动理由 | 预览结论 |
|---|---|---|---|
| rotator-cuff-B-r2 | hark-4080-v1 v3-local（已发布） | 正面机位下肩袖高亮全程不可见 | 右后上方：前臂外旋弧线 + 肩后高亮都可见 |
| hip-abductors-B-r2 | hark-4080-v1 v3-local（已发布） | 头端俯视，腿朝镜头，高亮 0 | 脚端高位 3/4：V 字开腿与髋外侧高亮可见 |
| n-chair-wiper-r2 | n-chair-wiper | 高亮 0 | 前右 3/4：膝内倒与髋外侧高亮可见 |
| o-stand-crossreach-r2 | o-stand-crossreach | 臀中肌高亮几乎为 0 | 臀中肌高亮清楚 |
| rotator-cuff-C-r2 | rotator-cuff-C | 侧面看像直臂前伸 | 后方：90/90 与前臂上转、肩后高亮清楚 |
| h-band-pull-apart-r2 | h-band-pull-apart | 正面只见前束发亮，像练前肩 | 后上方：T 字与上背高亮清楚 |
| h-crossbody-r2 | h-crossbody | 目标在背面 | 右后 3/4：肩后高亮可见 |
| h-incline-pushup-r2 | h-incline-pushup | 看起来双脚悬空 | 纯侧面：脚贴地、身体一条线 |
| w-prone-swimmer-r2 | w-prone-swimmer | 手臂看起来竖直朝天 | 低侧面：手臂贴垫画弧 |
| s-9090-r3 | s-9090-r2（已发布） | 正俯视读不出 90/90 | 前左高位 3/4：两膝 90° 与前屈可读 |

预览帧（`--pr 0.5`，glow-soft）：rotator-cuff-B-r2 f5/27、hip-abductors-B-r2 f2/33、n-chair-wiper-r2 f5/30/90、o-stand-crossreach-r2 f5/30/57、rotator-cuff-C-r2 f6/24、h-band-pull-apart-r2 f3/30、h-crossbody-r2 f3/57、w-prone-swimmer-r2 f0/26、h-incline-pushup-r2 f3/20、s-9090-r3 f5/57（spec 原生 15 fps 帧号）。
稀疏 QA：姿态与来源逐字相同，关节/接触数值与来源一致；镜头改动后需主线全片确认 `frame_edge_touch_frames`。
