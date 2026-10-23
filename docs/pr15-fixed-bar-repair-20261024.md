# 073 固定杆垂直拉力：原生手握持修复

新增 `h-fixed-bar-vertical-pull-rr7`，使用独立 `training-human-v2plus-native-grip / 1.0.0-r1`。旧 R5/R6 和失败记录保留。原 32 mm、16 侧面固定杆、支架、185 mm 骨盆竖直行程、腿轨迹、节奏和镜头不变；只重新拟合手与杆之间的刚性局部关系，并更换握姿。

修复复用已接受 native-r3 完整手网格、原生指骨和腕部过渡，未重新缩放网格或改变权重/拓扑。原通用握姿的食指和中指弯曲轴会使两指交叠；改为平行弯曲轴和较浅掌指关节屈曲，再拟合其余两节角度。拇指根旋转有界，避免通过折叠掌根取得杆面接触。拟合同时检查全部手表面的圆柱排除，以及五指末节远端和手掌近面；不删除面、不缩杆、不放宽人体自交标准。

CPU 静态拟合保留了多次不合格诊断：旧通用握姿、新杆框架和拇指大旋转方案均另存 F 盘。最终手自身严格非邻接内部交叉为 0，五指远端离圆柱表面约 0.292–0.299 mm，掌部约 0.479 mm；拟合是离散几何目标，仍需真实运动检查。

最终实际运行 0–240 共 241 帧，完整关节循环误差为 0、求解警告为 0。每 30 帧及 239/240 共 10 姿态导出真实 CPU 蒙皮表面、实际索引和原生杆三角面。双手完整自交、手/前臂非拓扑邻接交叉、手/杆严格三角交叉均为 0；所有手顶点均在杆外，五指末节每项均有 2 mm 内近面点。腕缝按源 owner 焊接后最大误差小于 0.001 mm。检查不涵盖共面重叠、连续时间全部三角形或负荷安全。

已实际查看低位和顶位整身及正面手部近景。侧向诊断镜头最初被支架遮挡，因此不把该视图当有效近景证据；后续审阅片与补充视图另存。`reviewed:false / releaseEligible:false` 保留，等待用户最终动作审核。

本机证据：`F:/PoseHub-v2-pilot/pr15-actions-20261023/grip/`。`final-runtime/` 为 241 帧关节及 10 表面姿态、PNG；`final-geometry-qa.json` 为逐帧几何结果。复现：

```powershell
node tools/human-v2plus/grip-native/review.mjs <fresh-output-directory>
python tools/human-v2plus/grip-native/check.py <capture-directory> <new-report.json>
python tools/human-v2plus/grip-native/fit.py --rest <original-model-rest.json> --out <fresh-fit-directory>
node --test drill-anim/tests/native-grip.test.mjs
```
