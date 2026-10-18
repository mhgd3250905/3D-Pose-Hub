# HD 制作线迁移：4080 冒烟记录

本机实际跑通一个完整动作：`h-banana`，8 秒、240 帧。工具来源为 [3D-Body #120](https://github.com/mhgd3250905/3D-Body/pull/120) 的 `f8b5138fb377ec8cda464cfb08186fd696ca7921`；本次执行代码为 Pose-Hub `71acd02b95228a71486e2b219a4a5f3546dc64ac`。后续提交只补本文档，不改变本批次代码或配方。

## 实际执行

工作目录为 Pose-Hub 根目录；本地证据根目录是 `E:/AII-3D/3D-Pose-Hub/output/hd-migration-20261018/`，不进 Git。完整命令如下，已有不可变结果目录不要重复用来新渲染：

```powershell
py drill-anim/tools/hd/render_batch.py prepare --output output/hd-migration-20261018/smoke-h-banana-v1 --ids h-banana
py drill-anim/tools/hd/render_batch.py gpu --output output/hd-migration-20261018/smoke-h-banana-v1 --port 8950
py drill-anim/tools/hd/render_batch.py preview --output output/hd-migration-20261018/smoke-h-banana-v1 --ids h-banana --frames 0,60,120,239 --port 8950
# 实际查看上述四帧与 QA 后：
py drill-anim/tools/hd/render_batch.py render --output output/hd-migration-20261018/smoke-h-banana-v1 --ids h-banana --reviewed --port 8950
py drill-anim/tools/hd/export_app_delivery.py --primary output/hd-migration-20261018/smoke-h-banana-v1 --selection output/hd-migration-20261018/app-selection.json --output output/hd-migration-20261018/app-delivery --workers 1
```

默认主题为 `themes/glow-soft.json`，原动作规格不变，通过槽位包装固定 30fps、`training-human-v2`、`alignClavicles:false`。一次只运行一路、`jobs=1`。没有浏览器失败或重试。

## 结果

| 项目 | 实测结果 |
| --- | --- |
| 硬件 | NVIDIA GeForce RTX 4080 Laptop GPU；ANGLE D3D11，drawing buffer 2160×2160 |
| 原始帧 | RGBA、2160×2160；240 张循环帧，另有封面帧 |
| 透明母帧 | 240 张，逐张检查为 RGBA、1080×1080；straight alpha |
| 绿幕母版 | H.264、yuv444p、CRF12，1080×1080、30/1 fps、240 帧、8.000 秒 |
| 原动作 QA | `pass:true`，`frames_complete:true`，求解告警 0 帧，裁边 0 帧 |
| 绿幕合成验证 | 通过；首帧、封面帧、中帧、末帧像素检查；视频完整 CPU 解码通过 |
| alpha 缓存 | 240 帧全部通过当前输入 SHA 与证书校验，原字节复用，无重复缩放 |
| App 派生 | 单动作选集成功；精确 alpha 合成 `#101013`，1080×1080、30fps、yuv420p、CRF18，无音频；完整解码通过 |
| 完成结果恢复核验 | `verify_completed` 重新核对当前输入输出 SHA、配方和完整 CPU 解码；核验前后批次文件列表、大小及修改时间未变 |

实际查看预览帧 **0、60、120、239**，主体完整、无裁边。全片完成后查看绿幕 / 精确 alpha / 普通抠像白底和深底对照帧 **0、72、120、239**，以及 App 派生的 **0、120、239** 帧。普通绿幕抠像仅作为对照，App 派生使用精确透明帧。上述动作的垫子是原规格道具，透明导出保留。

全片驱动记录 `status:pass`，耗时 66.9 秒。绿幕结果沿用原 exporter 的组合字段：`inherited_source_qa_status:pass`、`composition_qa_pass:true`；其固定范围字段 `all_posture_qa_passed:false` 不表示本次原动作 QA 失败，实际姿态结论保存在 `master/metrics/h-banana.json`，未改写导出器的冻结字节。

## 可核对指纹

| 产物 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `smoke-h-banana-v1/greenscreen/media/master/h-banana-greenscreen.mp4` | 1,382,354 | `5e1d76df0fb3aaac449ad18d7f4afd7517d15484be4149a11336b19f74dbff20` |
| `app-delivery/h-banana.mp4` | 629,783 | `bbb3aa448f0320540595373889854afdecca66cb7b01cfa53619bcc5063d860d` |
| `smoke-evidence.json` | — | `d9b13a5d160d2fcf4a7ef19ec1962b805c95b71687099d7d2f0a8d83c11cee7f` |

本批次 `source-manifest.json` SHA-256：`6b3ecff44b810bffdf24057f3bea802b8023880ca5aaf5b83be9435e0ebd5828`。

240 张 alpha 的聚合 SHA-256：`5196094209c50f048548607c39ade7046f1e13698dc9b8d8b19f54ffae5c3217`。计算方式为按文件名排序，对每项拼接 UTF-8 `文件名:文件SHA256\n` 后计算 SHA-256；结果 JSON 同时逐个记录图片字节数和 SHA。

## 自动验证与边界

- `node drill-anim/verify.mjs`：通过；13 个冻结模型源与原规格哈希保持。
- `py drill-anim/test_portability.py`：7/7 通过。
- `py -m unittest discover -s drill-anim/tools/hd -p 'test_*.py' -v`：83/83 通过，含原 exporter 真实编码测试。日志在证据根目录 `hd-tests.log`。
- Windows Git 检出验证：使用 `core.autocrlf=true` 检出五个冻结 producer，逐个 SHA 与来源提交相同；本目录 `.gitattributes` 固定 LF，防止检出时破坏 SHA 委托链。
- 三项已有 r2/r3 核对见 [来源报告](hd-production-source-audit.md)，没有覆盖规格。

这次验收的是迁入工具链和一个完整动作。未渲染 PR #5 的十个动作，未发布 v0.3.0，未改模型、已发布媒体清单或历史冻结记录。后续制作按 [HD README](../drill-anim/tools/hd/README.md) 建新批次。
