# 五皮肤覆盖修复 r1

本次沿用 `original-head-eye-soften-20261110-r1` 已确认底座，新增 `skin-coverage / 0.1.0-r1` 材质适配。保留原头型、眼窝柔化、身体几何及动作配方中的左右手选择；五套皮肤沿用原配色、肌群线和高亮参数。

## 审核范围与修复

实际解析 `remaining219-r1/recipes` 的 217 个有效配方：165 个使用 symmetric-native，52 个使用 webxr-dumbbell-wrist-r1（哑铃 17、固定握持 25、横杆 10）。另两个动作已在 dropped 记录删除。原生的放松、辅助、撑地、握持姿态共用原生材质；固定握持各道具共用 WebXR 手/腕材质，道具不应跟随人体皮肤。

固定手/腕桥的原材质仅同步底色、阴影和边缘光，漏掉 hologram 的透明与扫描效果。新适配只针对双手和双腕桥：实时读取当前皮肤参数，使用配方中人体静止坐标计算扫描，延续原全息皮肤的 alpha 约定。未修改道具材质、顶点位置、法线或索引。

当前颈、头、躯干已经有三个材质槽的皮肤适配，不能将旧截图直接当作最新版漏色证据。但眼窝柔化会克隆头材质，旧 port 缓存仍可能指向旧对象。新版 port 每次读取当前槽，核验 holder，并防止外层包装导致 shader 重复注入。头颈底色和全息效果跟随皮肤；肌群线仍由原肌群定义决定。

## 后续入口

在正确源码工作树 `E:/AII-3D/3D-Pose-Hub-worktrees/human-polish-v3-20261110` 使用以下入口。旧已确认外观指针保留原身份；本修复另有固定 manifest，不把尚未看样的皮肤修复冒记为用户视觉确认。

```powershell
$env:APP_URL='http://127.0.0.1:8849'
# 五皮肤、同姿态、头颈/手腕/全身对照与切换回归
node tools/preview-current-skins.mjs --recipe catalog/production/remaining219-r1/recipes/h-db-curl.json --out F:/PoseHub-v3/skin-coverage-r1/new-review

# 后续新母帧使用本入口，参数与旧包渲染器一致；先抽帧
node tools/skin-coverage-r1/render-masters.mjs --recipe catalog/production/remaining219-r1/recipes/h-db-curl.json --root F:/PoseHub-v3/skin-coverage-r1/new-masters --frames 0,36
```

每次启动核验已批准底座和本修复源码哈希；缺源、版本错误或漂移直接失败，不回退旧模型。输出新目录不可覆盖，并附实际手型、源清单和材质证据。历史已发布成片不受影响，本次不触发全库重渲或素材发布。

## 验证记录

材质生命周期测试 4 项通过：实际三槽绑定、晚安装克隆、外层 shader 包装、往返切换及 holder 更新。既有已批准外观门禁、模型/手部路由测试及 portability 7 项通过。实际渲染结果以同名 JSON 回执为准；抽帧检查不等于全部动作完整循环验收。

当前修复指针为 `drill-anim/models/current-skin-coverage.json`，与用户已批准的 `current-approved-look.json` 分开记录。

用户追加要求：四套非默认皮肤关闭边缘光，包括全息皮肤的 Fresnel 边缘透明度增强；保留肌群分区线及扫描。默认 realistic 的边缘光参数不变。该覆盖策略归本次新版本，原五皮肤定义不改写。
