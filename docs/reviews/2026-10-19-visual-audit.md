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
- **P1 镜头让动作看不懂（其次：目标肌不可见）**（本 PR 处理 8 项，见下）；剩余：hip-flexors-B（试过前右 3/4，抬膝顶点仍被大腿挡住，需改高亮而非镜头，未纳入）、adductors-B、n-seated-ir-drop、s-figure4、hip-abductors-C、n-slider-lateral、chest-A、scapular-A、t-vsit、t-lsit-*、w-wall-sit、h-pike-pushup、rotator-cuff-A、obliques-A/B、h-band-pallof。
- **P2 高亮美术/构图**：上面第 3 条的共性问题，以及人物偏小（s-frog、s-pigeon、hamstrings-B）、动作幅度偏小（h-9090-liftoff、n-seated-knee-lift、quadriceps-B、h-band-pull-apart 拉开约 55°）。

## 镜头原则（2026-10-19 用户确认）

**第一位：让用户看懂这个动作怎么做；第二位：在不牺牲第一位的前提下，让目标肌群可见。**
具体做法：
1. 用关节轨迹算出动作的主运动平面，镜头尽量正对它（运动轨迹不被透视压缩）。
2. 关键关节角（肘/膝/髋）、支撑接触点（手、脚、坐骨与地面/器械）、道具和锚点都要在画面里读得出。
3. 略带俯角（约 10–35°）表达深度；水平面内的动作（如贴地画弧、肘贴体侧外旋）用更高的俯角。
4. 避免肢体正对镜头、被躯干挡住、俯视压扁站姿。
5. 只有在几个机位同样清楚时，才挑能露出目标肌群的那个；为了露高亮而转到背面、让动作变难读的不采用。

评分工具：对候选机位（方位每 10°、俯角 0–60°）计算「肢体投影长度 + 关节运动投影比例」，取前几名后人工看三帧（起点/中间/终点）定稿。

## 本 PR：只改镜头的修订版（不动姿态/时间轴/高亮/道具）

按上面的原则复审后，原先 10 个里有 2 个（n-chair-wiper-r2、h-crossbody-r2）是为露高亮而换到侧后方、反而让动作更难读，已撤回，保留来源机位；另有 4 个改了方向。最终 8 个：

| 修订版 | 来源 | 来源机位的问题 | 新机位让用户看到什么 |
|---|---|---|---|
| rotator-cuff-B-r2 | hark-4080-v1 v3-local（已发布） | 几乎平视，水平面内的前臂弧线被压成一条线 | 略高的前右方：肘贴体侧不动、前臂向外打开到弹力带立柱方向 |
| rotator-cuff-C-r2 | rotator-cuff-C | 侧面看上臂缩短，90/90 像直臂前伸 | 高位前左方：上臂平举到肩高、屈肘 90°、前臂由向前转到竖直，绳索连到立柱 |
| h-band-pull-apart-r2 | h-band-pull-apart | 前上方但偏向一侧，T 字左右不对称 | 居中的前上方：双臂对称拉开成 T，弹力带到胸前 |
| w-prone-swimmer-r2 | w-prone-swimmer | 约 30° 俯角，经过头顶的手臂看起来竖直离地 | 约 58° 侧上方：双臂贴垫从头顶（Y）→ T → 手到髋侧画弧 |
| h-incline-pushup-r2 | h-incline-pushup | 3/4 视角下看似双脚悬空 | 纯侧面：脚贴地、身体一条直线、胸到凳沿的距离 |
| hip-abductors-B-r2 | hark-4080-v1 v3-local（已发布） | 头端俯视，双腿竖直时正对镜头被压缩 | 脚端高位 3/4：仰卧、双腿竖起、V 字打开 |
| o-stand-crossreach-r2 | o-stand-crossreach | 正面看两腿重叠，读不出后交叉步 | 后侧方：腿向后交叉、髋外推、手扶椅背、手臂过头侧伸 |
| s-9090-r3 | s-9090-r2（已发布） | 正俯视，读不出坐姿和两膝角度 | 前左高位 3/4：坐姿直立、前后两膝各 90°、前屈方向 |

已撤回：n-chair-wiper-r2（正面更能看清双膝同时倒向一侧）、h-crossbody-r2（正面更能看清手臂横过胸前）。
未纳入：hip-flexors-B（抬膝顶点高亮被大腿挡住，需改高亮遮罩，不是镜头问题）。

预览：`--pr 0.5`、glow-soft，每个候选机位渲染起点/中间/终点三帧对比定稿。
稀疏 QA：姿态与来源逐字相同；镜头改动后需主线全片确认 `frame_edge_touch_frames`。

## Round 3 — movement-first cameras for the remaining list (2026-10-19 10:00 CST)

Scored 20 actions with `bestview.py`, rendered 3-frame candidates for 14, kept a new camera only when the move itself reads better.

Accepted (camera-only; `rotator-cuff-A-r2` and `chest-A-r2` also shrink the fit box so the moving body stays off the edge):
- `abs-C-r2` `[0.9,0.3,0.3]` side 3/4: hanging on the bars, knees rising to hip height (front view pointed the knees at the lens).
- `chest-A-r2` `[0.5,0.35,0.8]`: straight plank and the rotation into side plank, arm up.
- `rotator-cuff-A-r2` `[-0.69,0.42,0.58]`: plank line and the hand lifting.
- `obliques-A-r2` `[-0.75,0.17,0.63]`: crawl, reach under, open to the side.
- `t-lsit-wide-r2` `[0.97,0.17,0.17]`: hands pressing beside the hips, legs wide (pose height issue still P0).
- `t-lsit-open-close-r2` `[0,0.42,0.91]`: centred high front, symmetric open/close.
- `w-clamshell-r2` `[0.16,0.42,0.89]`: side-lying stack, feet together, top knee opening.
- `h-supine-twist-r3` (on published r2) `[0,0.6,0.8]`: 90° knees, arms out, knees dropping each side.
- `hip-abductors-C-r2` `[0,0.5,0.87]` centred front: both knees pressing out. Outer-hip highlight is not visible from the front; accepted on movement-first rule.

Kept original (no clear gain): `s-figure4` (only the source view shows the ankle-over-knee cross), `obliques-B`, `h-band-pallof` (side view hides the band's pull direction), `scapular-A`, `t-vsit`, `t-lsit-vsit-circles`, `w-wall-sit`, `h-pike-pushup`, `n-wide-fold`, `w-fire-hydrant` (current view already within ~5% of best score).

Not a camera-dir fix: `t-tuck-planche` uses an orbit camera and its framing is too tight; changing dir has no effect. Needs orbit/framing change.

Sampled 8-frame edge check for all 9 new revisions: 0 edge touches.
