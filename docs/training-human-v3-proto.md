# training-human-v3 原型（feat/human-v3-proto，2026-10-19）

> 状态：**原型 / 草稿**。只新增文件，不改 `training-human-v2`、任何原有 spec、冻结批次或现有渲染路径。
> 现有 `drill.py render` 完全不加载这里的任何文件；`node drill-anim/verify.mjs` 与 `python drill-anim/test_portability.py` 均通过。

## 做了什么

| 项 | 内容 |
|---|---|
| A 人体 | MakeHuman / MPFB2 base mesh（CC0），young male + 35% muscle，缩放 0.97（身高 1.685 m）。102 骨：手指 3 节 ×5、脊柱 5 节 + 颈 3 节、锁骨、脚趾、上臂/前臂/大腿/小腿各两段（自带扭转骨）。面部/眼/舌/颌/胸骨并入父骨。蛋形灰色人台头（独立壳，刚性挂 head 骨），脚部平滑成鞋形。T 恤 / 长训练裤 / 鞋为着色区（`_GARMENT` 有符号距离场，片元着色器抗锯齿切边），颜色取当前 theme。 |
| B 肌群 ID | 从 BodyParts3D（CC BY 4.0，仓库 `runtime/public/anatomy` 中已有的转换版）投影：v3 身体按骨性标志点摆到 BP3D 解剖姿势，每个顶点沿法线向内"粗射线"找第一层肌肉 → `_MUSCLE_ID`；再向深处找肩袖 / 髂腰肌 / 髋深层外旋肌 → `_MUSCLE_DEEP`。左侧计算、镜像到右侧，众数滤波去碎块。38 个 ID，按现有 spec 的 20 个 group 名映射（`specGroupIds`），表在 `drill-anim/models/training-human-v3.json`。 |
| C 弯折 | 扭转分配：上臂滚转 50%/100% 分到 upperarm01/02，前臂旋前旋后 25%/75%/100% 分到 lowerarm01/02/wrist，腿同理。蒙皮三种模式：LBS、**铰链关节 DQS（建议）**（`_DQS_WEIGHT` 只在肘/膝/腕/踝取 1）、全身 DQS。 |
| D 引擎映射 | `drill-anim/page/human-v3.js`：spec 与求解器完全不动，旧 20 关节姿势解完后 `__v3.follow(spec)` 重定向到 v3：骨盆/胸/头旋转（胸弯分摊 5 节脊柱 + 3 节颈），锁骨跟随肩胛位移，四肢按旧关节**方向**，有接触的肢体（撑地手、握杆手、踩地脚）先做根节点最小二乘 + 过伸修正，再两骨 IK 精确贴到旧接触点；手/脚用掌面/足面坐标系标定。手型库：`open`、`relaxed`、`palm-floor`、`grip-bar`、`band-grip`，按 `spec.v3.handPose[side]` 指定，未指定时按手的模式/道具推断。 |

## 对比图（同一 spec、同一求解、同一机位）

- `docs/reviews/human-v3-proto/compare-triceps-A.jpg` 撑地（窄距俯卧撑，t=0 / 2.1 s）
- `docs/reviews/human-v3-proto/compare-scapular-B.jpg` 握杆悬垂（单杠肩胛引体，t=0.4 / 1.9 s）
- `docs/reviews/human-v3-proto/compare-h-squat.jpg` 深屈髋（徒手深蹲，t=0.2 / 1.2 s）
- `docs/reviews/human-v3-proto/muscle-ids.jpg` 全部 ID 原始分区（flat 着色，看真实顶点边界）
- `docs/reviews/human-v3-proto/muscle-highlights.jpg` 12 个 group 单独高亮
- `docs/reviews/human-v3-proto/skinning-lbs-vs-dqs.jpg` 膝 / 肩 / 肘：LBS | 铰链 DQS | 全身 DQS

注意：对比图只用主通道（无 glow 合成），旧模型的高亮在这几帧脉冲较弱，不是 v3 新增问题。

## 接触精度（`tools/human-v3/compare.mjs` 输出的 metrics）

| 帧 | 根偏移 mm | 手接触误差 mm | 脚接触误差 mm |
|---|---|---|---|
| triceps-A t0 | (-54, 23, 0) | 5.5 / 1.0 | 13.8 / 13.3 |
| triceps-A t2.1 | (-54, 14, 0) | 7.7 / 5.6 | 13.9 / 13.3 |
| scapular-B t0.4 | (0, 72, -17) | 3.0 / 3.0（握杆） | 自由 |
| scapular-B t1.9 | (0, 63, -20) | 3.5 / 3.5 | 自由 |
| h-squat t0.2 | (0, 55, -5) | 自由 | 2.7 / 2.7 |
| h-squat t1.2 | (0, 32, -34) | 自由 | 3.4 / 3.4 |

根偏移来自比例差：Snow 卡通人躯干长（髋→肩 0.52 m）、腿短；MakeHuman 躯干 0.45 m、腿 0.82 m（缩放后）。

## 已知粗糙处 / 下一步

1. **肌群边界仍按顶点**：身体 13k 顶点，大腿/小腿三角较大，高亮边缘有锯齿感；下一步在 GLB 里细分（或做 ID 距离场纹理）。
2. **BodyParts3D 4.0 没有腹直肌和背阔肌**：`abs` 用仓库原有腹直肌轮廓公式几何补位，`lats` 用背外侧区域补位（偏窄）；均在 sidecar 中标注 `geometric fill`。腹外斜肌腱膜区偏大，股直肌上段被缝匠肌/内收肌分走一部分。
3. 深层组（肩袖、髂腰肌、髋外旋）只有 `_MUSCLE_DEEP`，渲染用 0.75 强度表示，没有做"斜线＝深层"样式。
4. 比例差导致俯卧撑脚尖约 13 mm 接触误差、深蹲根节点下移 3 cm；如要逐帧零误差需在 v3 上直接求解（把 engine 的 reach 约束换成 v3 骨长）。
5. 手型是固定库，接触时手指不与地面/杆做碰撞；`band-grip`/`open` 尚未在实际 drill 中验证；拇指只做屈曲，没有对掌。脚趾不随踮脚弯曲。
6. 衣服为着色区，不是独立网格：没有领口/袖口厚度和褶皱；鞋是平滑的脚，不是真鞋型。头是简化蛋形，没有耳朵。
7. DQS：铰链 DQS 在膝/肘体积更饱满，全身 DQS 在肩部过度鼓包（见对比图），建议只用铰链 DQS；尚未做纠正形变（corrective shape keys）。
8. 只验证了 3 个代表动作的 6 帧，没有出全片，未接入 `drill.py render`（需要一个 `modelProfile: 'training-human-v3'` 开关与 glow/mask 通道适配）。

## 复现

```bash
tools/human-v3/fetch_assets.sh                    # MPFB2 CC0 资产 → output/human-v3-work/src/mpfb
cd tools/human-v3/build && python3 rest.py && python3 muscles.py && python3 post.py \
  && python3 export.py ../../../runtime/public/coach/training-human-v3.glb ../../../drill-anim/models/training-human-v3.json 0.97
tools/human-v3/run-compare.sh output/human-v3      # 自启 Vite，一路 Chromium；需要 drill-anim/config.json
python3 tools/human-v3/sheet.py output/human-v3 docs/reviews/human-v3-proto
```

依赖：Python numpy / scipy / trimesh / pygltflib / Pillow（matplotlib 仅预览）。不需要 Blender。同一输入两次构建 GLB 哈希一致。

许可与署名：`licenses/training-human-v3-ATTRIBUTION.md`。
