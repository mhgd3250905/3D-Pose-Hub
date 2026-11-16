# tools/v5/runtime — 来源（逐字拷贝，不要就地改；要改另起 r 版本）

| 文件 | 来源 | md5 |
|---|---|---|
| toon-r6.js | /workspace/work/wrist-review-2026-11-16/v3r8b/site/toon-r6.js（Pose Studio v3r8b 候选 = v3r7 toon-r5 + 腕弯权重折算描边） | 7026362925e23dd7c7111676428abc94 |
| wristfix-r2.js | 同上 v3r8b/site/wristfix-r2.js | 70debbb0207bbd13ca346e8d957d3c0b |
| fx.js | Pose Studio v3r7 定版 site/fx.js（v3r8b 同文件；只用于托马斯） | d0ccc9f1a4aef9b60a87b83d233c5d36 |
| model/coach-v3r3-wristfix.glb | v3r8b 候选模型（/workspace/work/wrist-fix-2026-11-16/model/） | 68dcdd9847ab6ea2d6fdce14c2ad4480 |
| model/hair-v3r5.glb | Pose Studio v3r7 定版 site/model/hair-v3r5.glb（只用于托马斯 spiky） | 15132e8ade684d98c263bf12e6f1d21d |
| anim/flare-arm8legs-v3r3.json | Pose Studio v3r7 定版 site/anim/（默认托马斯动画） | 974ce261610408f8594ab73d6cafc8aa |
| vendor/meshopt_decoder.module.js | 仓库 node_modules/three 0.170.0 examples/jsm/libs | cd7a7b72371f13b93fa92a8d3176762f |

新写：v5-hub.js（注入 hub 配方场景的 V5 换装/姿势转换/投影）、thomas.html + thomas.js（托马斯渲染页，按 Pose Studio app.js 的加载顺序）。
