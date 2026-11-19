# 托马斯补充 r2 动作标准（精度试点：加推 / 蛙立 / 俄挺前倾）

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
- `tools/v5/runtime/v5-hub.js` 按动作开启：只有 spec 写了 `v5: { scapulaShift: true }` 的动作（本批 t-pushup-plus、t-planche-lean、t-frog-stand）把 hub 的 `shoulders.shift` 画到 V5 身上；`tools/v5/render-masters-v5.mjs` 读这个开关。默认关。
- 老动作不受影响的证据（2026-11-19 沙箱，240 px 母帧）：serratus-A（帧 0/39/69）、h-open-book（帧 0/90）分别用 main 94ff057 的
  v5-hub.js（sha256 fdda01f1…）/ render-masters-v5.mjs（cb284075…）与本分支的 v5-hub.js（8c3ea760…）/ render-masters-v5.mjs（745f2611…）各渲一遍：
  全部母帧 PNG、v5-pose.json、recipe.snapshot.json、source-manifest.json 逐字节相同；layer-manifest.json 只差源文件哈希一行。
- 因此 `tools/thomas-sup/produce.mjs` 的预检把这两个文件加入 EXCLUDE（其余渲染内容仍须等于 main 94ff057）。改全库默认仍需开哥拍板。
