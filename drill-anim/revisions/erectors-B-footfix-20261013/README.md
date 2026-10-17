# 瑞士球背伸当前鞋向修订

用户2026-10-13指出鞋方向反了，另存双脚heading90、pitch58、墙面X−0.545584；脚踝、身体、球与时序保持。原specs/erectors-B.js与94项冻结批次不覆盖。

重渲使用`node tools/drill-anim/render-footfix.mjs`，复用原94生产目录的met-cycle求解值和实际腕部目标；仅spec.json不等于完整重放配方。原资料必须保留，输出目录存在则拒绝覆盖。模型与来源哈希、每帧非脚骨架/关节保持、鞋底落地/鞋跟墙面间距均实际核对。

完整视频与选版见[修正记录](../../../docs/erectors-B-footfix-2026-10-13.md)。新素材仅另存，App选版保持。
