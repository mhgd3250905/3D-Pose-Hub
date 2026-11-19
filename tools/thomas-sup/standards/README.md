# 托马斯补充 r2 动作标准（精度试点：加推 / 蛙立 / 俄挺前倾；第二批铺开见文末）

每个动作两份：`<id>.md` 给人看（阶段、数值范围、常见错误、来源、r1→r2 对比），`<id>.json` 给机器量（`tools/thomas-sup/precision.py`）。

## 自检流程（沙箱，低清，不进 Git）
```
node tools/thomas-sup/check.mjs --recipe catalog/production/thomas-supplement-r1/recipes/<id>.json --stride 4 --out <tmp>/<id>.json
python3 tools/thomas-sup/precision.py <tmp>/<id>.json --table          # 退出码 1 = 有不达标
# 多视角审图（≤480 px）：actions.json 的 reviewViews / reviewFrames
node tools/thomas-sup/check.mjs --recipe ... --frames 9,48,135 --render 9,48,135 --views "<reviewViews>" --size 320 --png-dir <tmp>/views --out <tmp>/views.json
python3 tools/thomas-sup/review-sheet.py <id> <tmp>/views <tmp>/views.json <tmp>/<id>.png
# 网格级自碰撞（蒙皮顶点在另一部位表面内的深度，mm，>0 = 穿入）
node tools/thomas-sup/check.mjs --recipe ... --frames ... --mesh-clip forearmR:thighR,forearmR:shinR,...
```
蛙立的腿表由 `tools/thomas-sup/frog-legs.py` 生成（参数写在 spec 注释里）。

## V5 肩胛平移（v5.scapulaShift）
- `tools/v5/runtime/v5-hub.js` 按动作开启：只有 spec 写了 `v5: { scapulaShift: true }` 的动作（试点 t-pushup-plus、t-planche-lean、t-frog-stand；第二批 t-kneeling-scap-pushup、t-seated-shoulder-ext-slide、t-hanging-leg-raise、t-straddle-planche、t-pbar-support-swing）把 hub 的 `shoulders.shift` 画到 V5 身上；`tools/v5/render-masters-v5.mjs` 读这个开关。默认关。
- 老动作不受影响的证据（2026-11-19 沙箱，240 px 母帧）：serratus-A（帧 0/39/69）、h-open-book（帧 0/90）分别用 main 94ff057 的
  v5-hub.js（sha256 fdda01f1…）/ render-masters-v5.mjs（cb284075…）与本分支的 v5-hub.js（8c3ea760…）/ render-masters-v5.mjs（745f2611…）各渲一遍：
  全部母帧 PNG、v5-pose.json、recipe.snapshot.json、source-manifest.json 逐字节相同；layer-manifest.json 只差源文件哈希一行。
- 因此 `tools/thomas-sup/produce.mjs` 的预检把这两个文件加入 EXCLUDE（其余渲染内容仍须等于 main 94ff057）。改全库默认仍需开哥拍板。

## 第二批（2026-11-19，同一流程逐个铺开）
- t-kneeling-scap-pushup 跪姿肩胛俯卧撑：标准 + r1→r2 对比见 `t-kneeling-scap-pushup.md`（v5.scapulaShift 开；体线用 胸廓–膝 连线 `hipOffsetKneeMm`；膝接触用 pins `which: knees`）。
- t-seated-shoulder-ext-slide 后撑肩伸展滑行：`t-seated-shoulder-ext-slide.md`（v5.scapulaShift 开；新增 V5 按动作开启的 `v5.headFlexDeg` 修头后仰，老动作验证见该文档）。
- t-hanging-leg-raise 悬垂举腿：`t-hanging-leg-raise.md`（v5.scapulaShift 开，主动悬垂；重心在杠下；机位往背侧偏 17° 避开立柱）。
- t-straddle-planche 分腿俄挺：`t-straddle-planche.md`（v5.scapulaShift 开；重心落在手掌上，分腿 100°）。
- t-pbar-support-swing 双杠支撑摆动：`t-pbar-support-swing.md`（v5.scapulaShift 开；r1 脚踝被截警告已消除）。

## V5 头前屈（v5.headFlexDeg）
- `tools/v5/runtime/v5-hub.js` 按动作开启：spec 写了 `v5: { headFlexDeg: <deg> }`（|deg| ≤ 30）的动作，V5 头骨在复制 hub 姿态后再绕自身枢轴前屈该角度；hub 骨架头颈与胸廓刚性相连，躯干后仰的动作脸会朝天。默认 0，不进入代码路径；`render-masters-v5.mjs` 与 `check.mjs` 读这个字段。
- 老动作不受影响的证据（2026-11-19 沙箱）：h-seated-reachback 帧 0/60/120，main 94ff057 的 v5-hub.js 与本分支的 v5-hub.js 量出的 V5 关节位置、世界四元数、部位最低点、关节角逐项相同。改全库默认仍需开哥拍板。

## 第三批（2026-11-19，腕部 + 分腿主动抬腿）
- t-self-resisted-wrist-flexion 自阻力手腕上卷：`t-self-resisted-wrist-flexion.md`（新共用构建器 `drill-anim/specs/_thomas-sup-wrist-r2.mjs`：骨盆前倾＋腰前屈代替 r1 的整体上身转，V5 偏差 96 mm → 0；特写机位，v5.groundShadow 关）。
- t-self-resisted-wrist-extension 自阻力手腕上抬：`t-self-resisted-wrist-extension.md`（同一构建器与特写机位，掌心朝下、左手压手背）。
- t-seated-forearm-rotation 坐姿翻手腕：`t-seated-forearm-rotation.md`（同一构建器，正前方特写，翻转主要在前臂下段；r2 追加：右手握住单头小哑铃一端（`v5.grip`，见下）；r1 构建器 `_thomas-sup-wrist-r1.mjs` 已删）。
- t-straddle-active-lift 主动分腿压抬腿：`t-straddle-active-lift.md`（v5.scapulaShift 开；第二版按 PDF 起始姿势改为直立坐（骨盆 5°、背直）、手掌平放臀部两侧手指朝后、肩胛下沉 30 mm；`thighTwist/kneeTwist` ∓45° 修 hub 摆腿自带的髌骨内旋（第一版前倾 30° 时为 ∓65°，53°→3.7°，现 1.8°）；骨盆高度直接脚本给定）。新增度量：抬起脚跟 `legLiftMm`、贴垫脚跟 `footDownMm`、髌骨朝上 `kneeUpDegMax`（大腿+小腿骨）、脚尖朝上 `toeUpDegMax`、掌心朝下 `palmDownDegMax`；check.mjs 记录大腿/小腿骨世界旋转。
- 新增度量（precision.py）：右手腕屈角 `wristFlexR`、腕侧偏 `wristDevR`、前臂旋转角 `supR`（0 = 拇指朝上，+90 = 掌心朝上）、前臂俯仰 `forearmPitchDeg`、大腿后侧最低点 `thighLowMm`；check.mjs 新增 `--gap A:B[:up]`（A 区下表面对 B 区上表面的间距，前臂贴大腿、手压手），actions.json 的 `gap` 为默认值。

## V5 关地面投影（v5.groundShadow，特写机位）
- `tools/v5/runtime/v5-hub.js` 按动作开启：spec 写了 `v5: { groundShadow: false }` 的动作，V5 太阳不投影、投影平面隐藏，`extent()` 不计投影点（渲染护栏因此不再因投影出边失败；身体框与光照范围照旧记录）；`render-masters-v5.mjs` 与 `check.mjs` 读这个字段。默认 true，不进入代码路径。用于腕部特写（前臂＋手），身体本身被画面边缘切开，投影必然出边。layer-manifest 里这些动作的 shadowBox 记为空框 [1e9, 1e9, -1e9, -1e9]。
- 老动作不受影响的证据（2026-11-19 沙箱，240 px 母帧）：serratus-A（帧 0/39/69）、h-open-book（帧 0/90，带 view window）分别用 main 94ff057 的 v5-hub.js（fdda01f1…）/ render-masters-v5.mjs（cb284075…）与本分支的 v5-hub.js（32c80b0f…）/ render-masters-v5.mjs（a2da7950…）各渲一遍：全部母帧 PNG、v5-pose.json、recipe.snapshot.json、source-manifest.json 逐字节相同；layer-manifest.json 只差源文件哈希、时间戳与耗时。
- 特写动作的渲染护栏实测（沙箱 240 px，t-self-resisted-wrist-flexion 帧 15/108/165）：render-masters-v5.mjs 全部通过，V5 关节偏差 0。

## V5 握持（v5.grip，r2 追加 2026-11-19，第 7 项坐姿翻手腕）
- `tools/v5/runtime/v5-hub.js` 按动作开启：spec 写了 `v5: { grip: { side: 'right', dumbbell: true } }` 的动作，安装 V5 时在该手骨的绑定坐标里把四指、拇指绕一根握柄（手的 +Z 方向、横过掌心，半径 14.5 mm）弯起来（只改一次该手刚性顶点的位置与法线，在日漫描边之前；描边共享几何），并把单头哑铃（握柄 + 拇指一侧一个六角头，两阶平涂 + 墨线外壳）挂在 V5 手骨上随手转动。不加骨骼、不改蒙皮权重；`render-masters-v5.mjs` 与 `check.mjs` 读这个字段。null/缺省 = 代码路径不进入。check.mjs 每帧量哑铃到身体（握持手除外）的最近距离，precision.py 给出 `gripPenMm` / `gripContactMin` / `gripClearMm`。
- 老动作不受影响的证据（2026-11-19 沙箱，240 px 母帧）：serratus-A（帧 0/39/69）、h-open-book（帧 0/90，带 view window）分别用 main 94ff057 的 v5-hub.js（fdda01f1…）/ render-masters-v5.mjs（cb284075…）与本分支的 v5-hub.js（de8e6869…）/ render-masters-v5.mjs（4d4f9caf…）各渲一遍：全部母帧 PNG、v5-pose.json、recipe.snapshot.json、source-manifest.json 逐字节相同；layer-manifest.json 只差源文件哈希、时间戳与耗时。
- 第 7 项渲染护栏实测（沙箱 240 px，帧 0/15/60/114/165/210）：render-masters-v5.mjs 全部通过，V5 关节偏差 0。

## V5 保留 hub 抓握手模（v5.hubGraspHands，r3 2026-11-19，开哥「抓握的都可以用专门的抓握手模」）
- `tools/v5/runtime/v5-hub.js` 按动作、按侧开启：spec 写了 `v5: { hubGraspHands: ['left','right'] }` 的动作，该侧不画 V5 开手，改为显示 hub 已验收的固定抓握手模（fixed-hand-presets-r1 grasp 组），用 V5 皮肤材质与日漫描边；V5 手在握手模开口内 10 mm 处切开，手腕末 12 mm 贴合到握手模截面（表面下 0.6 mm）并刚性绑到手骨；hub 自带 wrist bridge 仍隐藏。缺省 = 代码路径不进入。`render-masters-v5.mjs` 与 `check.mjs` 读这个字段；check.mjs 新增逐帧手-杠/手-柄距离、绕握角、腕部接缝度量与特写视角。
- 使用动作：t-pbar-support-swing、t-hanging-leg-raise（双手 bar-grasp，actions.json 显式 `fixedBarGrip.bars` 修正 hub 杠适配器的偏移：双杠原 52 mm 高/20 mm 内/19°，单杠原 14 mm/24°）；t-seated-forearm-rotation（dumbbell-grasp 双手 + `fixedDumbbellsHidden: ['left']`，V5 只右手显示握手模；v5.grip 不再被任何动作使用，代码保留）。
- 实测（全周期每 4 帧）：双杠/单杠手-杠最近 -0.18 mm、绕杠 320°；哑铃柄-手 -0.82 mm、绕柄 ≥300°、哑铃离身体 ≥10 mm；腕部接缝 V5 腕在握手模内 0.48–1.07 mm，无外凸台阶。render-masters-v5.mjs 240 px 帧 0/60/120/180 四个动作全部通过。
- 老动作不受影响的证据（沙箱 240 px 母帧，本分支 v5-hub.js f6e35937… / render-masters-v5.mjs 10e6f8ee…）：serratus-A（帧 0/39/69）、h-open-book（帧 0/90）对 main 94ff057，t-pushup-plus、t-self-resisted-wrist-flexion（帧 0/60）对 4c2515f：全部母帧 PNG、v5-pose.json、recipe.snapshot.json、source-manifest.json 逐字节相同；layer-manifest.json 只差源文件哈希、时间戳与耗时。gen-recipes --check 干净，其余配方未变。

## 分腿抬腿裆部处理（r3 2026-11-19）
- t-straddle-active-lift 机位由正前方 [0, 0.28, 1] 转向身体左侧 40°（dir [0.643, 0.28, 0.766]），近侧大腿挡住裆部；双脚与抬腿全程入框。未加短裤压平开关（机位已足够）。偏离 PDF 正前方机位，待开哥确认。

## 肘铰链度量（r4 2026-11-19，第 7 项坐姿翻手腕「拧着」）
- check.mjs 每帧记录 `arm.{left,right}`：前臂骨相对上臂绕前臂轴的扭转 `elbowTwistDeg`（铰链 = 0）、肘窝（上臂静止前侧 +Z）与前臂弯向夹角 `elbowPitDeg`、手对前臂扭转 `handTwistDeg`、上臂在胸廓系的旋转、扭转辅助骨各段转角、以及沿手臂各段蒙皮顶点相对纯铰链系的平均偏转与半径比（`mesh`）。precision.py 给出 `elbowTwistR` / `elbowPitR` / `upperArmRotR` / `forearmTwistR` / `handTwistR` / `elbowSkinTwistAbsR` / `proxForearmSkinTwistAbsR` / `elbowPinchR`（右臂）。只加度量，不影响渲染。
- t-seated-forearm-rotation r4 只改 spec 参数（upperArmTwistR、elbowTwistR、rollShare 0、手腕/肘目标），共用构建器、v5-hub.js、render-masters-v5.mjs 未动，其余 11 个托马斯动作配方 gen-recipes --check 不变。数字见 `t-seated-forearm-rotation.md` r4 节。
