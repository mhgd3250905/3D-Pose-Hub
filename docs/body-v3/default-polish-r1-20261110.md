# 默认人体外观候选 0.1.0-r1

2026-11-10。独立分支 `codex/human-polish-v3-20261110`，基于 `36550dd755056e3769552bd24a3ffb5c3f20a668`。状态为 **preview-candidate / 尚未用户看样确认**，没有替换生产配方或发布素材。

## 版本身份

人体沿用动作 recipe 固定的 `training-human-v3-armfix / 0.1.0-r2`；外观另记为 `default-body-polish / 0.1.0-r1`，清单见 `tools/human-polish-v3/manifest.json`。保留已确认的 realistic/look-approved-r2 配色、pump-r1 肌群高亮与 body rim 0.5。人体、骨架、手型、动作和外观各自记录，不能把外观修订误记为重新制作人体。

当前候选将人体材质的硬分段明暗改为连续过渡，覆盖头颈、躯干、四肢、原生手、服装鞋，以及固定 WebXR 手与腕部过渡件。只修改底色明暗混合，不改变几何、骨架、手型选择、动作、肌群覆盖判定或道具材质。模型轮廓自身的棱角不属于本次着色修订已解决的范围。

## 复现与防误用

在本分支工作树执行：

```powershell
node tools/model-version.mjs --recipe catalog/production/remaining219-r1/recipes/h-squat.json
$env:APP_URL='http://127.0.0.1:8849'
node tools/human-polish-v3/preview.mjs --recipe catalog/production/remaining219-r1/recipes/h-squat.json --out F:/PoseHub-v3/appearance/new-review/h-squat --frames 0,36
```

APP_URL 必须指向本工作树的 Vite 服务。预览器复用生产 `loadRecipe/openScene/stageAt`，不从裸 spec 或旧全局默认启动。进入场景后核对 armfix-r2、实际左右手、手部源资产与可见网格。源文件、皮肤指纹变化会阻断；输出目录必须是新目录。

每个输出目录保存 `verification.json`、`source-manifest.json`、`recipe.snapshot.json`、`effective-spec.json` 和前后对比 PNG。验证报告包括基线 Git 提交、工作区改动标志、recipe/spec/模型/手型指纹和外观源码哈希。预览时尚未提交的代码由这些哈希固定，后续本地 Git 提交保存对应代码。

旧根目录 `36e1bb6` 上的 v2plus 美化试验已撤回候选身份；旧预览器已添加阻断。主目录 README、AGENTS 和版本入口文档指向正确工作树，防止下一次沿用错误默认。历史文件保留，不覆盖冻结清单。

## 本轮验证

帧目录：`F:/PoseHub-v3/appearance/default-polish-r1/`。机器验收回执另见同目录本文对应的 `.json`，包含报告与图像哈希。

| 配方 | 抽查帧 | 手型 |
| --- | --- | --- |
| h-squat | 0、36 | symmetric-native，双手 relaxed |
| h-db-curl | 0、60 | webxr-dumbbell-wrist-r1，固定哑铃握持和腕桥 |
| h-catcow-quad | 0、60 | symmetric-native，双手 palm-floor |

每帧比较原配色与肌群高亮图；检查高亮 mask 字节一致、实际渲染网格采样顶点一致、预期手网格存在、shader 钩子无报错及浏览器无异常。另比较 PNG alpha 通道确认这些帧的透明轮廓一致。采样不是全顶点或完整动作循环验收。

版本门禁回归和 portability 7 项检查通过。`drill-anim/verify.mjs` 在未改动的来源工作树和本工作树均被既有 `Unreviewed action spec: abs-A-r3.js` 阻断；本次没有修改该 spec 或伪造其审核登记。

当前限于三种场景、六个关键帧和默认 realistic 皮肤；未声称全动作全皮肤、完整循环或 App 端已验收。需要看样后再确定是否推广为生产外观版本。
