# Body v3 头颈缝合候选 r2

该独立 v3 加载入口使用 `head-neck-fragment-r3` 头颈片段。GLB 的两个材质 primitive 会在磁盘上拆分接缝；加载后按用户确认的方案用原顶点 ID 恢复 162 条共享边，保留两套材质，并绑定现有 52 根 v3 骨对象。原模型与冻结文件不覆盖。下颌原轮廓及其自然阴影保留。

调用本目录 `loader.mjs` 的 `boot`、`applyV3`；后者需 v3 运行时及 toon、muscle、v2plus 动态 uniform，暂不支持替代头部配置。候选尚未经用户内容审核，不能用于发布。整身 GLB 烘焙和其他关节修复未包含在此版本中。

原头部开口在低头 40°、仰头 35°、转头 65° 下的最大间隙分别为 31.12、25.11、12.11 mm；片段替换后，旧的 230 点开口已闭合，新接口的 162 条共享边在三姿态下间隙为 0 mm，共享顶点法线角为 0°。两组是不同拓扑口径。已查看三姿态侧视和后视，原裂口与耳后碎片消失；颈根和领口属于待处理的 P3。图见 [三姿态对照](../../../docs/body-v3/img/head-neck-r2-comparison.jpg)。

另对深蹲、熊爬采样检查：绑定前后骨架状态不变、片段复用现有骨对象；与参考头颈最大位置差约 0.000268 mm。独立材质随主题和颈部高亮产生可见变化。五次配置切换、重置及卸载检查通过。

校验版本及依赖：`node drill-anim/models/training-human-v3-head-neck-r2/verify.mjs`。配置 Vite 和本机 `drill-anim/config.json` 后，`node tools/body-v3/head-neck-topological-r1/verify-v3-wrapper-r2.mjs <新输出目录>` 测试配置切换；`node tools/body-v3/head-neck-topological-r1/verify-fragment-extremes-r2.mjs <新输出目录>` 测试极限姿态。两者均需新目录。

manifest 保留生成时的“待验证”状态；上述独立复测在其生成后完成。采样验证不能替代完整动作、设备或发布验收。
