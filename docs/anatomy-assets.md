# 解剖资产说明

动画内肌群浮窗默认使用 Blender Studio 官方 Human Base Meshes v1.4.1 的 Realistic 男性底模，以完整自然人体和表面功能色区讲解相关肌群位置。它是独立静态参考，与 Snow 动作人物和 BodyParts3D 解剖模型分别管理。

**解剖结构**模式使用真实 BodyParts3D 4.0 几何，由 [ashemag/human-atlas](https://github.com/ashemag/human-atlas) 中已优化的模型整理而来。固定来源提交为 `1c38bf35c254a891200d3cedecfd57abebe83d8d`。它保持原成人男性站姿，肌肉与骨骼均可按结构选中。

## 当前网页人台与保留资产

2026-10-09 PR3整合后，网页同步面板 `src/muscle-sync.js` 与全屏查看器 `src/muscle-viewer.js` 加载 `public/anatomy/mannequin-reference.glb`。它派生自CC0 Human Base Meshes的既有 `fitness-reference.glb`，去掉短裤、局部平顺裆部，保持静态自然人体；1网格、74,274三角形、1,338,688字节，元数据记录SHA-256 `ac4c0dd92d42504a949fd0aff0063aaff0886a68278f95878bc3da9df177e056`。来源、坐标、修改和限制见同名JSON。它的shader色区是肌群位置示意，不是独立真实解剖网格或与Snow精确配准。

以下有短裤 `fitness-reference.glb` / BodyParts3D说明保留原资产与独立结构入口，不能作为当前首页加载人台的文件身份；App采用其打包参考副本，以 [v41合约](../app/docs/motion-v41.md) 为准。本次未重做资产或复跑历史几何检查。

## 文件与范围

| 文件 | 用途 |
| --- | --- |
| `public/anatomy/mannequin-reference.glb` / `.json` | 当前网页同步面板/全屏人台，CC0完整体表派生及元数据 |
| `public/anatomy/fitness-reference.glb` | 保留的完整静态健身人物及当前人台派生源：官方 Realistic male、浅色皮肤与深蓝运动短裤 |
| `public/anatomy/fitness-reference.json` | 保留的有短裤人物来源、独立坐标、外观改动、体积与校验记录 |
| `assets/coach/fitness-reference.blend` | 保留的有短裤静态人物可编辑本地 Blender 场景 |
| `public/anatomy/manifest.json` | 主索引、结构名称、BodyParts3D/FMA ID、肌群映射、偏移与范围 |
| `public/anatomy/bones.bin` / `.bin.gz` | 238 个骨骼系统结构，含椎间盘与肋软骨 |
| `public/anatomy/muscles.bin` / `.bin.gz` | 399 个肌肉结构，含深层结构 |
| `public/anatomy/skin-manifest.json` | 原始 Skin 体表的独立索引，保留作派生来源 |
| `public/anatomy/skin.bin` / `.bin.gz` | 原始 Skin 二进制，源位置、法线和索引保留 |
| `public/anatomy/muscle-reference.glb` | 解剖结构模式保留的同源完整体表：Skin 派生模型，已退出默认人物展示 |
| `public/anatomy/muscle-reference.json` | 保留的 BodyParts3D 体表来源、原坐标、外观适配和校验记录 |
| `public/anatomy/ATTRIBUTION.md` | 数据署名、许可、适配说明 |
| `public/anatomy/human-atlas-MIT.txt` | 上游应用代码许可全文 |

骨骼/肌肉二进制主模型共有 637 个结构、932,140 个三角形，解压后几何为 26,911,792 字节，gzip 共 14,720,676 字节。原始独立体表文件为 587,571 字节 gzip。这些源结构的位置与法线保持上游优化后的值，未再次简化；完整参考 GLB 的派生外观适配另在下文说明。

省略了眼球运动肌、心室乳头肌、内脏与血管。骨骼导出保留了上游 FJ3152–FJ3395 范围内的骨架、椎间盘和肋软骨，省略牙龈、牙齿、喉部与鼻部软骨。主索引保留 1,239 个有对应几何的 FMA 概念；复合概念的元素列表只包含本次保留的结构。

上游系统映射中，有 16 个实际肌肉结构被归到了骨骼或结缔组织。导出时将 fibularis、tibialis、tensor fasciae latae、subscapularis 和 levator scapulae 更正为 `muscular`；原系统仍保存在 `sourceSystem`，所有更正记录在 `classificationCorrections`。

## 可供 Flare 视图使用的肌群

`manifest.groups` 以 `id`、中文 `label`、英文 `name` 和 BodyParts3D mesh ID 数组 `elements` 表示肌群。每个结构还带有 `groups` 与首个 `muscleGroup`。这些是几何检索分组，不表示活动强度或肌电测量结果。

| ID | 中文名称 |
| --- | --- |
| `deltoids` | 三角肌 |
| `triceps` | 肱三头肌 |
| `serratus` | 前锯肌 |
| `pectorals` | 胸肌 |
| `rotator-cuff` | 肩袖 |
| `scapular` | 肩胛稳定肌 |
| `obliques` | 腹外斜肌 |
| `erectors` | 竖脊肌群 |
| `hip-flexors` | 髂腰肌 |
| `glutes` | 臀肌群 |
| `adductors` | 髋内收肌群 |
| `quadriceps` | 股四头肌 |
| `hamstrings` | 腘绳肌群 |
| `forearms` | 腕与前臂肌群 |
| `biceps` | 肱二头肌与肱肌 |
| `calves` | 下腿肌群 |
| `hip-rotators` | 髋旋转与外展肌 |
| `hands` | 手内在肌 |

这份数据未包含腹直肌、腹内斜肌、腹横肌、背阔肌和腰方肌的独立几何。它们记录在 `missingStructures` 中。界面介绍核心肌群时，应呈现覆盖限制，不能把腹外斜肌显示成全部腹肌，也不能把其他结构改名充当缺失的肌肉。参考模型没有骨骼绑定或关节权重，不能直接视为可播放 Flare 的动作模型；动作教学应使用另行制作并标识为示意的 rig。

## 坐标

本节坐标只描述 BodyParts3D 源解剖及其同源体表。单位是米，`+Y` 向上，人体正面朝 `+Z`，解剖学左侧为 `+X`、右侧为 `-X`。左右指人体自身，不是屏幕左右。地面约为 `Y=0`，人体身高约 1.72 米，原模型双臂自然下垂。每个结构的顶点已经位于整体空间，不能逐个 `geometry.center()`，否则会破坏结构间位置。

来源转换公式为 `x = sourceX * 0.001`、`y = sourceZ * 0.001 + 0.0781112`、`z = -sourceY * 0.001 - 0.1`。本项目不再应用该变换。

## Three.js 加载：源二进制

骨骼与肌肉二进制不使用 Draco、GLTFLoader 或运行时 meshoptimizer。上游使用 Three.js 0.159，当前标准 Three.js `BufferGeometry` 和 `BufferAttribute` 能直接读取这些数组。

二进制采用 little-endian、4 字节对齐。`positions`、`normals`、`indices` 是相对于解压后对应块开头的字节偏移。顶点类型为 Float32，法线为归一化 Int16，索引为 Uint32。

```js
import * as THREE from 'three';

const atlas = await fetch('/anatomy/manifest.json').then(r => r.json());
const buffers = await Promise.all(atlas.chunks.map(async chunk => {
  const compressed = typeof DecompressionStream !== 'undefined';
  const response = await fetch(compressed ? chunk.gzip : chunk.url);
  if (!response.ok) throw new Error('Anatomy download failed');
  const payload = await response.arrayBuffer();
  const signature = new Uint8Array(payload, 0, Math.min(2, payload.byteLength));
  // Fetch may already decode a Content-Encoding: gzip response.
  const isGzip = signature[0] === 0x1f && signature[1] === 0x8b;
  const buffer = isGzip
    ? await new Response(new Blob([payload]).stream()
        .pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
    : payload;
  if (buffer.byteLength !== chunk.bytes) throw new Error('Incomplete anatomy file');
  return buffer;
}));

function geometryFor(part) {
  const buffer = buffers[part.chunk];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(
    new Float32Array(buffer, part.positions, part.vertexCount * 3), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(
    new Int16Array(buffer, part.normals, part.vertexCount * 3), 3, true));
  geometry.setIndex(new THREE.BufferAttribute(
    new Uint32Array(buffer, part.indices, part.indexCount), 1));
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3().fromArray(part.bounds[0]),
    new THREE.Vector3().fromArray(part.bounds[1]));
  geometry.computeBoundingSphere();
  return geometry;
}
```

可以先加载骨骼块并显示，肌肉块完成后再补充；也可以并发加载两块。肌群高亮按 `elements` 与 mesh 的源结构 ID 对应。为了减少 draw call，可把其他肌肉合并为背景，选中的肌群单独绘制；点击拾取仍需原始独立结构几何。原始 Skin 二进制继续保留作来源与轮廓研究；同源 `muscle-reference.glb` 用于解剖结构模式。默认表面位置讲解使用独立的 `fitness-reference.glb`。

## 完整参考 GLB 与动画浮窗

### 默认人物：官方 Realistic male

默认 `fitness-reference.glb` 来自 Blender Studio 与社区贡献者发布的 **Human Base Meshes v1.4.1**，具体源对象为 `GEO-body_male_realistic`。官方 [Demo Files](https://www.blender.org/download/demo-files/) 将该包标为 CC0，要求 Blender 4.2 LTS 或更新版本；[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)允许修改、转换和商业使用。本地保留原 ZIP、完整解包文件以及 `assets/blender-studio-source/SOURCE.md`，原包 SHA-256 为 `811f43accbb31a88266d932f8f5563b2d13586fca0ba2693aad1f5fe582b3515`。

静态参考保留源作者制作的完整头部、耳、颈、躯干、双臂与手足，采用浅色低反光皮肤与源骨盆／大腿体表派生的哑光深蓝运动短裤。派生面部作局部低细节平滑，并用原边界闭合眼口深凹；最终只保留身体和服装，不显示独立眼睛，官方源库中的配套眼结构仍保留。本机制作的材质、原模型细分、统一坐标、面部与服装适配只处理派生副本；源 ZIP 与源 Blender 文件保留。详细改动及对象角色以 `fitness-reference.json` 为准。

Three.js 用本地 `GLTFLoader` 独立加载 GLB；运行时在体表与覆盖相关部位的服饰表面显示功能定位色区。静态短裤可用宽色区提示其覆盖的臀部与髋前位置，不增添肌肉形状；深层肌群是所在部位示意，不代表肌肉边界。色区表示教学位置与功能关联，没有新增内部肌肉网格，也不表示力值或肌电测量。具体结构关系在文字与独立解剖模式中查看。主动作 Snow 的哑光黑短裤仍不着色。

局部查看仅改变浮窗相机，完整人物保留在同一参考场景中。第二相机与 scissor 绘制实时 3D 全身定位图，并显示同一组功能色区；支持查看全身、返回局部、正面、背面、独立旋转、缩放与复位。底部固定训练入口，仅提供已有练法文字。

人物使用独立米制坐标，`+Y` 向上、`+Z` 朝前；完整范围见 `fitness-reference.json`。相同单位和朝向不构成解剖配准：默认模式不把 BodyParts3D 内部结构嵌入这个不同拓扑和比例的人物。模型只用于静态浮窗，不新增 Flare 骨架或动画，Snow 的姿态、时间、K、路线和主镜头继续保留。

制作脚本为 `tools/blender/build_fitness_reference.py`，可编辑场景为 `assets/coach/fitness-reference.blend`。原文件、输出体积、哈希、对象计数和实际 Blender 渲染的交付记录见下文。

### 保留的 BodyParts3D 解剖结构参照

`muscle-reference.glb` 是此前完整体表方案，现保留在 **解剖结构**模式，不再作为默认健身人物。它仍是 BodyParts3D Skin（FJ2810 / FMA7163）的独立派生副本，保留原站姿、完整头部、躯干、双臂、手足和原米制坐标；服装、低细节整头与 Skin 衍生头发属于外观适配，脸部闭孔与鼻嘴弱化只发生在派生 Skin 中，该模型没有独立眼结构。具体来源和改动保存在 `muscle-reference.json`。

解剖结构模式的目标肌肉来自原二进制网格，只借用几何并创建独立显示材质，保留源名称、本人左右、结构 ID 与原坐标。切换和释放浮窗不会修改或释放借用的源肌肉几何；源 Skin、骨骼／肌肉块及主索引保留。缺少独立结构的肌肉继续按 `missingStructures` 说明。

旧体表与原肌肉同源，但仍是独立静态结构参考，未与 Snow 当前动作精确配准。其制作脚本为 `tools/blender/build_muscle_reference.py`，可编辑文件为 `assets/coach/muscle-reference.blend`。已有源校验和外观适配记录保留，隐私、服装与简化面孔使派生体表不适合精确体表测量。

### 选型记录

Adam（rreallCakes FREE Human Basemesh Pack）只完成公开造型和免费商业许可核对。官方 `Add to Library` 需要账号，未找到作者授权的匿名原文件入口；本项目尚未取得或采用该模型。来源及阻碍保存在 `assets/model-candidates/adam/SOURCE.md`。

### 本轮静态资产交付记录

2026-10-07 最终 `fitness-reference.glb` 实际大小为 **2,523,408 字节，约 2.52 MB**，共 **2 个网格、81,002 个三角形**：身体 74,274、短裤 6,728，无独立眼睛。SHA-256 为 `47b9427d19d82cb4f573196028e1513c20b719c41a2a5fd961579360412f442d`，已与来源 JSON 及实际文件核对；完整高度约 1.690 米，双脚落在 `Y=0`。

实际 Blender 渲染保存在 `output/fitness-reference-20261007/front.png`、`back.png`、`portrait.png`，可编辑场景已保存。最终制作检查覆盖完整身体、闭合体表、独立眼睛省略、独立服装、有限范围、落地和中心，以及源文件与源原始几何保持；面部处理前后，颈以下 27,754 个唯一顶点位置不变，短裤的属性、索引、材质和矩阵逐字节一致。记录保存在同目录 `checks.json` 与公开来源 JSON，其中 `closedBodySurface:true`、`independentEyesIncluded:false`。最终 12 项定向检查已通过，12 份原资产保持。本记录仅说明静态资产交付和文件核对，浏览器功能色区、交互与手机布局由主流程另外验证。

## 重建与检查

### 默认静态健身人物

先保留或解包官方 `human-base-meshes-bundle-v1.4.1.zip`，目录和哈希以 `assets/blender-studio-source/SOURCE.md` 为准。脚本读取下列现成场景，不重新生成程序化人体：

`assets/blender-studio-source/human-base-meshes-v1.4.1/human-base-meshes-bundle-v1.4.1/human_base_meshes_bundle.blend`

```powershell
& 'E:\AII\toolchains\blender\4.5.3\blender-4.5.3-windows-x64\blender.exe' --background --factory-startup --python 'E:\AII-3D\3D-Body\tools\blender\build_fitness_reference.py'
```

脚本输出派生 `.blend`、GLB、来源 JSON 与三张实际渲染，核对源资产文件的前后哈希和原几何数组。更改生成脚本后，应再次按真实输出核对文件体积、哈希、完整人体、闭合面部、独立眼睛省略与体表／服饰的功能位置范围；静态产物不包含动作、路线或训练绑定。

### BodyParts3D 源二进制


```sh
git clone --depth 1 https://github.com/ashemag/human-atlas.git .reference/human-atlas
git -C .reference/human-atlas fetch --depth 1 origin 1c38bf35c254a891200d3cedecfd57abebe83d8d
git -C .reference/human-atlas checkout 1c38bf35c254a891200d3cedecfd57abebe83d8d
node scripts/prepare-anatomy.mjs
```

重建脚本只重新打包上游已有的优化几何，并校验每个顶点的有限性、所有索引的范围、偏移对齐、保留概念引用与 gzip 往返一致性。每个块的原始与 gzip SHA-256 存在主 manifest 中。浏览器展示还应检查正面、背面、左右旋转和肌群选中是否符合结构位置。

## 授权来源

BodyParts3D 数据为 CC BY 4.0，官方说明允许按许可署名后再分发和制作衍生数据；许可页最后更新于 2025-02-27。必须保留署名 **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.**

- [官方许可说明](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html)
- [官方下载页](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- [上游署名与适配说明](https://github.com/ashemag/human-atlas/blob/1c38bf35c254a891200d3cedecfd57abebe83d8d/public/ATTRIBUTION.md)
- [原始研究论文](https://doi.org/10.1093/nar/gkn613)

上游应用代码为 Copyright (c) 2026 ashemag，MIT；数据许可独立于代码许可。本项目保留了上游署名全文，并额外说明筛选、重新打包和系统归类更正。
