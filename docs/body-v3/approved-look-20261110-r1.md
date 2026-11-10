# 当前已确认外观：20261110-r1

用户于 2026-11-10 对眼窝柔化样片回复“可以”，并明确要求保存此版，后续推进采用已更新、已确认的版本，避免再误用旧版。

已确认代码为 `eb00e820790b9ac118fe008c76a927f89c3b6a11`。保留原头型、五官和眼窝深度，柔化全身/头部明暗及眼窝内部锐利交界。人体为 `training-human-v3-armfix / 0.1.0-r2`，皮肤为 realistic，叠加 `default-body-polish / 0.1.0-r1`、`head-surface-smooth / 0.1.0-r1`、`eye-socket-soften / 0.1.0-r1`。每个动作仍使用自己 recipe 中的 native/固定握持等手型，不能统一替换成同一种手。

唯一选择入口是 `drill-anim/models/current-approved-look.json`，指向不可静默改写的 `drill-anim/models/approved-looks/20261110-r1.json`。后者固定已确认代码、模型身份、各外观源码哈希、渲染入口及样片回执。未来新试验另建版本，看样确认后才能更新该指针；“最新文件”或“最新分支”不等于已确认版本。

## 后续工作的默认入口

```powershell
# 只核验版本和场景手型，不启动渲染
node tools/preview-current-model.mjs --recipe catalog/production/remaining219-r1/recipes/h-squat.json

# 在同一工作树启动 Vite 后，用已确认外观出新预览
$env:APP_URL='http://127.0.0.1:8849'
node tools/preview-current-model.mjs --recipe catalog/production/remaining219-r1/recipes/h-squat.json --out F:/PoseHub-v3/review/new-preview
```

入口缺配方、工作区缺源文件、来源哈希漂移或人体不兼容都会直接失败，禁止回退旧默认。出图保存实际配方、模型/左右手状态及已确认外观记录。主目录若仍是历史快照，其同名入口会明确拒绝出图；正确文件在本地工作树 `E:/AII-3D/3D-Pose-Hub-worktrees/human-polish-v3-20261110`。

确认依据为 `F:/PoseHub-v3/eye-socket-soften-r1/preview-a` 的样片及 `docs/body-v3/eye-socket-soften-r1-20261110.json` 回执。确认发生在检查报告生成之后，因此旧报告中的 `userAccepted:false` 保留当时事实，本记录追加当前确认状态。

此次保存确立后续工作的已确认外观基线；不改写历史成片、已发布素材或冻结模型。用户看样确认不等于所有动作完整循环验收。原来的圆头和五官重做试验仍保持停止状态。
