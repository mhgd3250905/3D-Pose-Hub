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
