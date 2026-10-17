# HipLab 动作媒体修复 r2（2026-10-17）

用户自测 HipLab 时提出的问题 6/8/9/10 的媒体侧修复。只新增 `-r2` 修订 spec，原 spec、其 SHA 与已发布媒体不动；
新 spec 已登记在 `data/home-pr-candidates.json`，共用的 `specs/_9090-feet.mjs`、`lib/foot-orient.mjs` 在 `verify.mjs` 里校验哈希。
每条源文件、哈希、App 对应资源与 QA 结果见 `sources.json`。

| 问题 | 修订 spec | 改了什么 |
| --- | --- | --- |
| #9 青蛙式脚朝向 | `s-frog-r2` | 踝背屈，脚内侧贴地，脚尖朝外（与本地验收的 hark-4080-v1/s-frog 同向，用 `foot-orient` 重写） |
| #10 90/90 脚竖起 | `s-9090-r2`、`h-9090-liftoff-r2`、`a-9090-r2` | 前腿脚顺小腿朝侧面、外侧着地；后腿脚顺小腿向后、内侧贴地；抬腿时脚随小腿转动（`_9090-feet.mjs`） |
| #8 四足画圈高亮碎裂 | `h-quad-cars-r2` | 改为右臀覆盖面板 glutes + gluteMed + oblique、inset 0.08；**部分修复**，见下 |
| #6 深蹲三档几乎一样 | `a-deep-squat-r2` | 松=全蹲到底、一般=大腿平行、紧=半蹲；三档全脚掌着地 |
| #6 托马斯三档难分 | `a-thomas-r2` | 松=长腿贴垫，一般=大腿抬约 12°，紧=大腿抬约 30°、屈膝约 55°；机位降为近侧视 |

## 渲染

- 动作片：3D-Body `tools/hiplab-render/render_batch.py render --format green --pr 2`（PR #120 的工具链，checkout f8b5138），
  30 fps、1080、training-human-v2；绿幕 + 直通 alpha 母帧，再由 alpha 合成到 `#101013` 出 Android 片（H.264 yuv420p CRF18）。
- 批处理槽位按 App 的动作 id 绑定，r2 spec 自身 id 为 `<id>-r2`，所以渲染时用一层包装
  `export default {...source, id: '<id>'}`（不入库，只在渲染 checkout 里）；否则 greenscreen 导出会以
  “Source ID/fps does not match a true 30fps batch” 拒绝。
- 自测静图：`drill.py render a-*-r2 --theme themes/glow-b.json --pr 2 --keep`，帧 15/45/75(/105/135) = 松/一般/紧(/前腿/后腿)，
  输出 1080 webp 替换 App 同名对比图，另出 1080 透明 PNG（原始 RGBA 帧按 place.json 贴图）留给浅色主题。

## QA

四条动作片：源 QA pass（240 帧、无求解告警、不出框）、绿幕合成 QA pass、全片 CPU 解码通过、propscan 0 坏帧。
flickscan：s-frog / s-9090 / h-9090-liftoff 0 坏帧；h-quad-cars 163 坏帧，位于画圈那条腿的小腿/鞋底纹，
App 现版（原 spec）同位置 169 坏帧，属既有问题，非本修订引入。关键帧逐条目视核对过脚的朝向。
自测静图：无求解告警、无自穿/手穿模、鞋底贴地。

## 遗留

- #8 高亮只能部分修复：training-human-v2 的短裤顶点在肌肉图坐标（mmRest）里错位（绑到大腿骨的顶点约高 0.26 m、偏前），
  臀部选区只能拼面板，边缘仍有锯齿和一小块分离碎片。根治要改冻结的人体源（`page/posedlib.js` / toon 着色、
  `models/training-human-v2.json` 的源哈希），即出一版新人物（如 training-human-v3）：重新烘焙短裤顶点的 mmRest，
  然后所有用到臀/髋高亮的动作重渲。
- 同一原因：自测静图 r2 里深蹲（臀肌朝后，正面机位看不到）与托马斯（hip-flexors 在 v2 上只亮出一个小点）几乎没有青色高亮，
  只剩轮廓光；App 自测页的部位提示是文字，不依赖高亮。
- App 左/右两侧播放同一条未镜像视频；如需真正的左侧版本，建议播放端水平镜像，而不是再渲一套。
