# 解剖资产说明

本地浏览器使用真实 BodyParts3D 4.0 几何，由 [ashemag/human-atlas](https://github.com/ashemag/human-atlas) 中已优化的模型整理而来。固定来源提交为 `1c38bf35c254a891200d3cedecfd57abebe83d8d`。模型是一份成人男性参考解剖，保持原模型站姿，肌肉与骨骼均可按结构选中。

## 文件与范围

| 文件 | 用途 |
| --- | --- |
| `public/anatomy/manifest.json` | 主索引、结构名称、BodyParts3D/FMA ID、肌群映射、偏移与范围 |
| `public/anatomy/bones.bin` / `.bin.gz` | 238 个骨骼系统结构，含椎间盘与肋软骨 |
| `public/anatomy/muscles.bin` / `.bin.gz` | 399 个肌肉结构，含深层结构 |
| `public/anatomy/skin-manifest.json` | 可选体表轮廓的独立索引 |
| `public/anatomy/skin.bin` / `.bin.gz` | 原始 Skin 结构，可用于透明轮廓 |
| `public/anatomy/ATTRIBUTION.md` | 数据署名、许可、适配说明 |
| `public/anatomy/human-atlas-MIT.txt` | 上游应用代码许可全文 |

主模型共有 637 个结构、932,140 个三角形，解压后几何为 26,911,792 字节，gzip 共 14,720,676 字节。独立体表文件为 587,571 字节 gzip。所有结构位置与法线保持上游优化后的值，未再次简化。

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

单位是米，`+Y` 向上，人体正面朝 `+Z`，解剖学左侧为 `+X`、右侧为 `-X`。左右指人体自身，不是屏幕左右。地面约为 `Y=0`，人体身高约 1.72 米，原模型双臂自然下垂。每个结构的顶点已经位于整体空间，不能逐个 `geometry.center()`，否则会破坏结构间位置。

来源转换公式为 `x = sourceX * 0.001`、`y = sourceZ * 0.001 + 0.0781112`、`z = -sourceY * 0.001 - 0.1`。本项目不再应用该变换。

## Three.js 加载

无需 Draco、GLTFLoader 或运行时 meshoptimizer。上游使用 Three.js 0.159，当前标准 Three.js `BufferGeometry` 和 `BufferAttribute` 能直接读取这些数组。

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

可以先加载骨骼块并显示，肌肉块完成后再补充；也可以并发加载两块。肌群高亮按 `elements` 与 mesh 的 `userData.id` 对应。为了减少 draw call，可把其他肌肉合并为背景，选中的肌群单独绘制；点击拾取仍需原始独立结构几何。体表透明轮廓来自独立 manifest，建议 `transparent: true`、较低 `opacity`、`depthWrite: false`，以便内部结构可见。

## 重建与检查

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
