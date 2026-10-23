# 086 脚背拉伸：独立组合原生手与 R5 脚桥

新增 `h-kneeling-instep-stretch-rr6` 和独立 `training-human-v2plus-instep-native / 1.0.0-r1`。复用已接受的 native-r3 手网格及骨架，并保持 barefoot-r5.2 脚趾、踝桥源和算法原样。组合入口验证两个冻结来源链，先建立一次原生手骨架，再载入原始 R4/R5 足部模块；同时映射模型选择与逐帧 pose，确保动态脚桥继续执行。所有冻结文件、默认生产入口和旧规格不改。

本次无需改变任何动作或手姿轨迹：rr6 与 rr5 的 pose、timeline、props、camera、v2plus、barefoot、qa 逐字段完全相同。唯一变化是规格身份、组合 profile 和显式版本字段。旧手近景中的指根折线及掌背鼓包在更换网格后消除，当前自由手保留原 relaxed 设置。

本机旧/新各渲染 0/30/60/120/150/180/239/240 共 8 帧。每帧完整脚部 33,734 顶点的 CPU 世界坐标差为 0，绑定法线差为 0，索引逐项相同，全部实际关节差为 0；踝桥最大焊缝误差约 0.000060 mm，zeroNormal 为 0。原脚部几何和运动保持不变。

另导出 0/30/60/150 四姿态真实 CPU 蒙皮手与前臂网格，按源顶点身份焊接接缝后检查：左右手自交、手对前臂严格内部非共面三角交叉均为 0，所有姿态焊缝误差小于 0.001 mm。检查并不覆盖共面重叠或连续时间所有三角形，不代替人工审核。

已查看旧左手 0、新左手 0、新右手 60 的近景与新 60 全身，确认指根折叠改善、腕部连接顺滑及脚背支撑。其他帧保存供复审。本候选仍为 `reviewed:false / releaseEligible:false`；并未由先前两个动作的手部接受记录推断本动作已获用户审核。

证据：`F:/PoseHub-v2-pilot/pr15-actions-20261023/instep-native/attempt1/`，包含旧新 PNG、`review.json`、四个 `geometry-*.json` / `collision-*.json` 和 `summary.json`。复现入口：

```powershell
node drill-anim/models/instep-native-r1/preview.mjs <fresh-output-directory>
python tools/human-v2plus/hands-native/check_wrist.py --geometry <output>/geometry-0.json --hands drill-anim/models/hands-native-r3/hands-base.json --limbs drill-anim/models/training-human-v2plus-limbs-base.json --out <fresh-collision-report> --require-zero
node --test drill-anim/tests/instep-native.test.mjs
```

三项组合测试通过：原轨迹保护、冻结源及 scope、非法版本拒绝。全片和统一登记由主任务整合。
