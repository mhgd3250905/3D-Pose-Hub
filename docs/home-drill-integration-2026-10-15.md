# 居家动作 PR #111 / #112 / #113 / #115 审核补修

本轮按用户授权汇总51份独立 `h-*` 制作规格：#111居家20项、#112肌群补充10项、#113开胯11项、#115开肩10项。原87份规格、94冻结成片、App51项视频与23ready/28待核对保持。新增制作规格不等于App已展示这些动作，也不代表本轮已逐帧验收新成片。

## 固定审核身份

| PR | 原来源 SHA | 原目标分支 / 当时目标 SHA |
| --- | --- | --- |
| #111 | `576fb8b8b3893cb944cfad7c33eb8cc4eee55d20` | master / `da353b109dced5d5b7cb944b0d925aa994afb1db`；PR报告base为`15cb4598e7d19a70c7c58d527728897861bf3f83` |
| #112 | `e32dc51d1605714f4b39578e3d644dc36d0cfbc1` | drill/home-core-legs-20 / `576fb8b8b3893cb944cfad7c33eb8cc4eee55d20` |
| #113 | `52a2b3c9c83124e0368a17abacd595ab2939358e` | drill/home-muscle-gaps / `e32dc51d1605714f4b39578e3d644dc36d0cfbc1` |
| #115 | `ccc9c2bd71bf61df8daa726c17fd991197bc542f` | drill/home-hip-opening / `52a2b3c9c83124e0368a17abacd595ab2939358e` |

原51项新增规格的规范化SHA及PR归属固定在[data/home-pr-candidates.json](../drill-anim/data/home-pr-candidates.json)，合并补修不改动作参数。实际远端合并SHA与时间另见版本台账。

## 查实问题与处理

原链条不能通过 `node tools/drill-anim/verify.mjs`：#113直接替换默认theme.json，违反training-human-v2清单的主题哈希；随后51项新规格也未加入已审核规格清单。恢复默认主题到原固定SHA `9880592142016b460c364a68df29d0f61ee802b49427aa13c4146db03bd69074`，保留完整B风格为独立[glow-b.json](../drill-anim/themes/glow-b.json)，并明确注册51份候选哈希。没有修改冻结人体版本或伪写新验收。

重建#113/#115所述B风格时显式使用：

```powershell
python tools/drill-anim/drill.py render h-couch-stretch --theme themes/glow-b.json --jobs 1
```

这只是制作命令示例，本轮没有执行全片重渲。为保留旧输出，重建前将config中的out_dir/work_dir指向新的E盘目录，不覆盖已有批次。普通不传theme继续使用原默认外观；原PR描述的“旧shade覆盖即可恢复旧版”因递归继承bloom而不足，此处以固定默认与独立预设分开复现。

保留可选bloom合成接口、无背椅z-fighting修复及CLI的 `--pr` 渲染像素比参数。旧主题下合成输出与旧版CPU样例逐字节一致；有背椅默认/边界参数几何保持，无背凳不再创建共面零高靠背和突出的后腿顶面。

## 验证范围

补修后的纯源校验通过：138份规格可导入，51份新增哈希正确，原59基线规格及托马斯辅助/13项固定人体来源保持，App动作目录仍51项。111/112的30项有7230个30Hz纯描述符采样、实际engine采样/混合路径与时间/循环检查；113/115的21项有247条轨道的序列化、有限数值、时间顺序、引用与人体配置检查。另有CPU合成新旧对照及椅子几何stub核对。完整命令/输出保留本机 `output/pr-batch-20261015/`；本记录不承诺该ignored目录在新clone存在。

GitHub原审核结论均为空且未报告CI；以上为本次AI源代码与限定验证结论，没有向GitHub提交review。原PR中的渲染/逐帧QA是制作者报告，本轮未回读其完整外部视频和逐帧数据，不能合并成“51项新动作全部通过QA”。新动作App接入、媒体选版与设备观感另行安排。
