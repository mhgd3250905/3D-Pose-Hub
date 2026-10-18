# HD 生产工具来源规格核对

三项修订均可追溯到 3D-Body PR #120；没有发现未解释的动作参数差异。PR 修订文件与当前 Hub 文件的 LF 文本 SHA **不相同**，差异为迁移注释、相对导入路径和显式生产参数。按 PR 原生产驱动包装后，三项导出对象与 Hub 当前规格逐项相同。

## 固定来源与范围

- 来源：[3D-Body PR #120](https://github.com/mhgd3250905/3D-Body/pull/120)，本机已获取的 `origin/pr-120-hd` 解析为 `f8b5138fb377ec8cda464cfb08186fd696ca7921`。本记录全部 `git show` 使用此完整提交 SHA，不依赖分支后续变化。
- 目标：Pose-Hub `tools/hd-production` 分支，审核基线 `1783dcc232876de88b0de09085027986a1c1d865` 的当前 `drill-anim/specs/` 文件。
- 读取来源 Git 对象，没有 checkout、修改或运行 3D-Body 工作区。核对包括文本、导入依赖及纯 Node 规格导出对象；未渲染或新增媒体验收结论。
- 下列源文件哈希均为 **UTF-8、仅 CRLF→LF 规范化后的 SHA-256**，保留注释、空白和末尾换行。导出对象哈希另行标明，不能替代源文件哈希。

## 三项逐一结论

| 原 PR 文件（前缀 `tools/hiplab-render/revisions/20261017/`） | Hub 当前规格 | 保留的导出 ID | 结论 |
| --- | --- | --- | --- |
| `h-knee-hug.js` | [h-knee-hug-r2.js](../drill-anim/specs/h-knee-hug-r2.js) | `h-knee-hug` | 抱膝修订相同：最大名义髋屈曲 132°、手指向内角 20°、原 8 秒双呼吸节奏及轨道保持。 |
| `h-supine-twist.js` | [h-supine-twist-r2.js](../drill-anim/specs/h-supine-twist-r2.js) | `h-supine-twist` | 仰卧扭转修订相同：`ROLL=38`、骨盆椭圆、胸部回落、脚方向及 8 秒时序保持。 |
| `s-seated-fold-r3.js` | [s-seated-fold-r3.js](../drill-anim/specs/s-seated-fold-r3.js) | `s-seated-fold` | r3 局部接触路径相同：左掌 `hem` 目标 `[0.098,0.198,0.29]`，`31/30`、`197/30` 峰值及全部返回时刻保持；身体、腿、右手与原轨道保持。 |

| 项目 | PR 文件 LF SHA-256 | Hub 文件 LF SHA-256 |
| --- | --- | --- |
| 抱膝 | `1212fb1156a7ef950964e16c42a31ab1eb4ccf9263677cb5eb42420226b9cd3c` | `73db57f4a968ef93b49cad8dfa07838791f5a2808ae6d1add6b36b3f12ae3e2a` |
| 仰卧扭转 | `52c219768e3c00e317888abe76a274c6a7f823088ad79d90e777b0a8d38ea8d1` | `14103d9993b464853abb2502345f60bb83c2a52ecfa7ee7456b81d14385a4299` |
| 坐姿体前屈 r3 | `34c01e4a9e4ea89508ff15936b13b322180f1dae174082490ab8d443ab0eacce` | `13e38b9e0fb74935868633656b8cc98040f93cf13565132aa95f32c87cd75cc8` |

### ID、导入路径与生产参数

Hub 文件名的 `-r2` / `-r3` 用于保留修订历史；三个导出对象均通过 `...source` 继承原 ID，没有改成修订文件名。`sources.json` 的键及生产槽位应继续使用上表原 ID。

三项均增加一行 `Portable migration...` 注释。基础规格导入由 `../../../drill-anim/specs/<原文件>.js` 改为 `./<原文件>.js`；前两项的数学模块导入由 `../../../drill-anim/lib/` 改为 `../lib/`。导入目标内容已独立核对。

Hub 均显式增加 `fps:30`、`modelProfile:'training-human-v2'`、`alignClavicles:false`。这不只是路径适配：抱膝与扭转的裸 PR 导出对象原本继承 15fps（人体配置已是 v2/false）；体前屈裸导出对象未写这三项。因此，**不能宣称裸 PR 导出与 Hub 完全相同**。

PR 同一提交的 [`render_batch.py`](https://github.com/mhgd3250905/3D-Body/blob/f8b5138fb377ec8cda464cfb08186fd696ca7921/tools/hiplab-render/render_batch.py#L79) 第 79–86 行恰使用：

```js
export default {...source, fps:30, modelProfile:'training-human-v2', alignClavicles:false};
```

将该包装应用于 PR 原修订后，Hub 三项包含姿态、轨道、相机、道具、QA 配置在内的完整导出对象均相同；三项时长均为 8 秒，生产采样均为 30fps。

## 导入依赖核对

从三项 PR 修订递归读取静态相对导入，共 8 个模块：三项修订与以下 5 个依赖。五个依赖在 PR Git 对象与 Hub 当前对应位置的 LF 文本均逐字相等；没有未核对的更深相对导入。

| 依赖（PR 为 `tools/drill-anim/`，Hub 为 `drill-anim/`） | 双方相同的 LF SHA-256 |
| --- | --- |
| `specs/h-knee-hug.js` | `18f0469f8776a6fcfe0056385f988836f78fd4ece72684facbeb7d6b3614973b` |
| `specs/h-supine-twist.js` | `53f0ab3d0799252e76aa280780772e166908b23957d5a00904d8af2e74e61ad7` |
| `specs/s-seated-fold.js` | `034ec878a0d9498356c48f218bd0ef4754fa5837bff4e5d4e2ae9f87c3b35766` |
| `lib/home-anim.mjs` | `1798c9e55c28b32391b7ef32aa358427b4743ee1959f86ec488a95fe88a05557` |
| `lib/ss-geo.mjs` | `45ca774079e3a85ecc4f924a3220d4baa721f0435e16f6e6e21ffa19e17e8603` |

同时进行两项独立核对：撤回上述已列适配后，Hub 修订文本与 PR 原文逐字相等；将 PR 模块图只读载入内存并应用原生产包装，递归按键排序后序列化，与 Hub 导出对象比较。序列化拒绝函数、`undefined` 和非有限数值。

| 生产导出对象 | 双方相同的规范 JSON SHA-256 |
| --- | --- |
| `h-knee-hug` | `54f96dbcb1ec6e3d04302387535ad8507d1b55b3bc3dec32d7aa7980bd0618f7` |
| `h-supine-twist` | `e3eb726bd1932d51965819f51c4b0ef5bc105653a86c4a92bb1b6b60f58d17fe` |
| `s-seated-fold` | `d269af4eec1751a88c19a0c0799aed8c709d70e491720509296209bf2e335e94` |

## `.sources.json` 来源映射

下列三个来源文件也从同一不可变提交读取。它们是原 ID→原仓库修订路径的单项映射，本身没有记录文件 SHA 或 QA 结果；可追溯身份由 **原仓库、PR、完整提交、路径与本记录哈希**共同确定。

| 原来源文件（同上修订目录） | 实际键 → 原值 |
| --- | --- |
| [`h-knee-hug.sources.json`](https://github.com/mhgd3250905/3D-Body/blob/f8b5138fb377ec8cda464cfb08186fd696ca7921/tools/hiplab-render/revisions/20261017/h-knee-hug.sources.json) | `h-knee-hug` → `tools/hiplab-render/revisions/20261017/h-knee-hug.js` |
| [`h-supine-twist.sources.json`](https://github.com/mhgd3250905/3D-Body/blob/f8b5138fb377ec8cda464cfb08186fd696ca7921/tools/hiplab-render/revisions/20261017/h-supine-twist.sources.json) | `h-supine-twist` → `tools/hiplab-render/revisions/20261017/h-supine-twist.js` |
| [`s-seated-fold-r3.sources.json`](https://github.com/mhgd3250905/3D-Body/blob/f8b5138fb377ec8cda464cfb08186fd696ca7921/tools/hiplab-render/revisions/20261017/s-seated-fold-r3.sources.json) | `s-seated-fold` → `tools/hiplab-render/revisions/20261017/s-seated-fold-r3.js` |

其 LF SHA-256 依次为：

```text
h-knee-hug.sources.json       e77b27e19c34c4965eb7d40a95ee2132026825852dcefd83fda88f1c354854d1
h-supine-twist.sources.json   f2849a17aa803795c24fa595a909b314eea1da74591deafa71813d7e7260e774
s-seated-fold-r3.sources.json 12905ad385f10ce14eefa80ee0b48e80fbcfaa9baf7d12e714206cc7b79671f3
```

在 Hub 使用这些修订时，对应路径为：

```json
{
  "h-knee-hug": "drill-anim/specs/h-knee-hug-r2.js",
  "h-supine-twist": "drill-anim/specs/h-supine-twist-r2.js",
  "s-seated-fold": "drill-anim/specs/s-seated-fold-r3.js"
}
```

该表是新位置与历史来源的对照，不改写历史 `.sources.json`。未覆盖或迁移任何规格、历史文件、清单或机器配置。
