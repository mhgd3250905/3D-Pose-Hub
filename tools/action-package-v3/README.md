# action-package-v3 — 配方驱动的动作包生产模板

一条命令把 `pose-hub-action-recipe@1` 配方变成完整动作包。模型、皮肤、尺寸、派生规格都是数据文件，换皮肤/换兼容模型不用改代码。

## 流程

```
recipe.json ──render-masters.mjs──▶ masters/<id>/   透明母版层（逐帧 PNG + sha256）
                                     ├─ <skin>/body/            人物+道具，高亮关闭
                                     ├─ <skin>/body-highlight/  配方自带高亮外观（含 translucent-glow）
                                     └─ mask/                   高亮遮罩（灰度，与皮肤无关）
masters ──compose.py──▶ packages/<id>/  每个皮肤：深/浅背景 mp4、透明 VP9 webm、
                                     start/peak/end 关键帧、封面、缩略图、透明封面、透明首帧、package.json
produce.py = 批量串行执行上面两步 + index.json，可中断续跑
```

- 安装链与关键帧审查（`remote-keyframes-r1.mjs`）一致：armfix 模型、native/固定握持、r3/r5/DQS 修正、腕部修正、动作修正、道具、固定镜头。审查结果就是生产结果。
- 帧数 = 配方时长 × 30fps（不再强制 8 秒）；第 N 帧只作循环闭合 QA。
- 每帧只解一次姿态，所有皮肤共享（皮肤只换材质）。
- 构图：全部皮肤 × 全部循环帧的 alpha 并集，固定正方形，8% 边距，绝不逐帧裁切。
- peak 帧：默认取高亮脉冲最强平台的中点；`peaks.json` 可逐动作覆盖。
- 所有输出不可覆盖；状态标志保持 `fullCycleValidated/userAccepted/releaseEligible=false`，由人工验收后再改。

## 本机（RTX 4080）正式生产

```bash
npm run dev -- --host 127.0.0.1 --port 8830 --strictPort   # 另一个终端
# 先打通 2–3 个代表动作
python tools/action-package-v3/produce.py --root F:/PoseHub-v3 --ids h-squat,chest-C,h-kneeling-thread-needle
# 全部 249 个（中断后同一命令续跑）
python tools/action-package-v3/produce.py --root F:/PoseHub-v3
python tools/action-package-v3/produce.py --root F:/PoseHub-v3 --dry-run   # 只看进度
```

本机 GPU 请在 `drill-anim/config.json` 的 `chromium_args` 用硬件 GL（见该文件 `_gpu_doc`）。
小样验证（沙箱/快速）：`--verify-size 256 --verify-frames 0,60,120`，输出标记为 sampled。

## 换皮肤

在 `skins/` 加一个 JSON（`id` 与文件名一致）：

```json
{"format":"pose-hub-package-skin@1","id":"my-skin","label":"…","status":"draft",
 "look":{"mode":"luma-ramp","dark":"#101820","light":"#e0f0ff","ramp":[0,0.9],"gamma":1,
         "rim":{"color":"#66ccff","strength":0.8,"power":2.2},"mix":1},
 "highlightColor":"#F05A36"}
```

- `native` = 模型原生外观；`luma-ramp` = 按原生明暗映射到 dark→light，再加边缘光，只作用于人物，不改道具、几何、姿态、镜头。
- 在 profile 的 `skins` 里列出它，或运行时 `--skins realistic,my-skin`。
- 四个 V2 皮肤（tech-white / neon-night / neon-night-b / hologram）是 `v2-port`：原版 V2 着色器 + `v2-skins/port.mjs` 的断言补丁（PORT_VERSION v2skin-port-r2）。
  `look.v3Tune` 是 r2 外观微调（线宽/线透明度/线光晕倍率、高亮内收 1px 羽化、高亮处压掉线光晕；暗色皮肤暖色高亮 #f2906a + 自发光 #ff4a24×0.10；tech-white 线色 #5e4418），
  每次 setSkin 之后自动套用；`v2Params` 仍是原版 V2 参数快照（哈希/一致性检查不变）。
- realistic 用 `look.highlightStyle: "pump-r1"`（native-highlight.mjs：按 core 的体积渐变、半透明 0.55–0.82、随脉冲的内侧菲涅尔光、细深色轮廓），高亮色 `look.highlightColor`。
- `look.rim: {"strength":0.5,"colour":"body"}`：边缘光强度 0.5，颜色取人物自身底色（V2 皮肤 = 皮肤灰；原生 = 各衣物底色），不再是橙色。
- 5 个皮肤状态均为 `look-tuned-r2-needs-user-approval`，需要你看样确认。

## 换模型

在 `models.json` 加一条：

- `loader`：导出 `verify / checkSpec / boot / applyV3`，`applyV3` 返回 `{profile, version}`（参照 `training-human-v3-armfix-r2/loader.mjs`）。
- `compatibleWith`：能渲染哪个作者模型的配方（例如 `training-human-v3-armfix@0.1.0-r2`）。
- `components`：真正支持的配方组件（`correction:upper-arm-contour-r3`、`hand:fixed-grasp`、`fixed-stack:*` …）；配方需要而模型不支持会直接拒绝。
- `rigSignature`：用 `rig-signature.mjs --recipe <任一配方> --model <新模型> --write` 生成一次。

运行时自动比对作者模型的参考骨架签名（52 根骨骼名 + 静止骨长，容差 2mm/1%）。名字或骨长对不上就拒绝渲染——这就是"参数对得上才能直接换"。然后：`produce.py --model 新profile@版本 --root 新目录`。

## 文件

| 文件 | 作用 |
|---|---|
| `profiles/default.json` | 模型/皮肤/母版尺寸/派生规格 |
| `skins/*.json` | 皮肤预设 |
| `models.json`, `rig/*.json` | 模型注册与参考骨架签名 |
| `recipe-scene.mjs` | 配方 → 浏览器场景（安装链） |
| `browser-package-layers.js` | 分层 + 皮肤着色补丁 |
| `render-masters.mjs` | 母版渲染 CLI |
| `compose.py` | 派生包 CLI |
| `produce.py` | 批量驱动 |
| `peaks.json` | 可选 peak 时间覆盖 |

尚未包含：双语语音（需要 TTS 选型）、`catalog/v2/actions` 动作定义导出、六层完整度检查接入。
