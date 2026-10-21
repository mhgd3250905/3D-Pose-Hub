# Pose-Hub 高清制作线

迁自 [3D-Body #120](https://github.com/mhgd3250905/3D-Body/pull/120)，固定来源提交 `f8b5138fb377ec8cda464cfb08186fd696ca7921`。文件来源与原始 SHA 见 [upstream.json](upstream.json)，三项动作修订的逐项对照见 [来源核对报告](../../../docs/hd-production-source-audit.md)。没有重复迁入修订规格。

本目录直接消费 Pose-Hub 的 `drill-anim/specs/`，不要求安装 HipLab、不固定动作数量。后续 v0.3.0（包括 PR #5 合入后的实际动作 ID）使用同一入口。旧普通渲染命令仍可使用。本工具输出的是新的本地制作批次；App 继续通过已发布清单和 `media/tools/sync.py` 获取素材。

## 环境

在仓库根运行命令。依赖：根目录 `npm ci`、已有 Playwright/Chromium、ffmpeg/ffprobe，以及 Python 的 numpy、scipy、Pillow。机器路径沿用被忽略的 `drill-anim/config.json`；配置方法见 [START-HERE](../../../docs/START-HERE.md)。本工具不写机器配置。Windows 上启动的辅助进程隐藏窗口。

新建批次的人体默认读取 [current-production.json](../../models/current-production.json)：`training-human-v2plus` / `1.0.0-rc2`、`alignClavicles:false`，`outfit:'compression'`、`torso/limbs/hands:'base'`、`skin:'realistic'`，head 不启用，保留原 v2 头与原配色。白金/蓝/绿/全息只供显式选择；制作标准见 [v2plus](../../../docs/training-human-v2plus.md)。主题仍沿用批次配方（默认 `themes/glow-soft.json`），不能用主题或 skin 名替代人物配置。真实时间轴采样 **30fps**；PR2 原始 RGBA 为 **2160×2160**，恒定二维取景后为 **1080×1080 straight alpha**。覆盖包装显式保留槽位原 ID，即 `{...source,id:'<原 id>',fps:30,...}`，不会把 `-r2` 文件名误作发布 ID。

当前新版工作仅在隔离分支本地整合，待用户最后同意合入 main；不能写成 PR 已在 GitHub 合并、检查已全部通过或全部动作已验收。普通旧 spec 的 profile 不变，HD 包装不回写原约 200 份规格、v2 的 13 个冻结源或旧媒体。

## 单动作冒烟

先准备新目录，再验证硬件 GPU、预览、实际看图，最后才出全片：

```powershell
py drill-anim/tools/hd/render_batch.py prepare --output output/hd-banana-v1 --ids h-banana
py drill-anim/tools/hd/render_batch.py gpu --output output/hd-banana-v1
py drill-anim/tools/hd/render_batch.py preview --output output/hd-banana-v1 --ids h-banana --frames 0,60,120,239
# 实际查看 preview-evidence/h-banana-samples.png 与预览 QA 后，再执行：
py drill-anim/tools/hd/render_batch.py render --output output/hd-banana-v1 --ids h-banana --reviewed
```

`gpu` 必须确认 NVIDIA 硬件和 2160² drawing buffer。`preview` 省略 `--frames` 时会按每项规格的时长、关键时刻和封面时刻取样，并限制在合法帧号内；显式帧号使用制作采样的 30fps。稀疏预览不代替完整循环 QA。

`render --reviewed` 表示操作者已经实际查看该批次的预览。驱动检查预览图、规格、主题和 QA 的 SHA，再记录批准快照。缺预览、预览被改、PR 不是 2 都会拒绝全片。每路固定 `jobs=1`；所有本目录 GPU 命令跨批次共享两个操作系统锁槽。其他旧命令的渲染仍须由操作者计入整机最多两路。

## 多动作与修订映射

用 `prepare --ids <完整选集>` 固定批次；之后 `preview` / `render --ids <子集>` 只执行子集，来源清单仍绑定完整选集。主题可用 `--theme themes/glow-b.json` 等显式指定，每次必须保持同一配方。

修订映射示例（另存本地 JSON，路径相对仓库根）：

```json
{
  "h-knee-hug": "drill-anim/specs/h-knee-hug-r2.js",
  "h-supine-twist": "drill-anim/specs/h-supine-twist-r2.js",
  "s-seated-fold": "drill-anim/specs/s-seated-fold-r3.js"
}
```

所有阶段重复传入相同的 `--spec-overrides <文件>`。基础规格和修订规格均绑定哈希，不覆盖原规格。可选 `--app <HipLab checkout>` 兼容旧内容选集；不向 App 资产目录写入。

## Windows 两路队列

先对完整选集执行上面的 `prepare` 和 `gpu`，再使用队列：

```powershell
py drill-anim/tools/hd/run_queue.py --output output/hd-batch-v1 --ids h-banana h-band-pull-apart --dry-run
py drill-anim/tools/hd/run_queue.py --output output/hd-batch-v1 --ids h-banana h-band-pull-apart
# 实际看过两项预览后：
py drill-anim/tools/hd/run_queue.py --output output/hd-batch-v1 --reviewed-ids h-banana h-band-pull-apart
```

未批准的动作停在预览检查与 `review_awaiting_approval`。队列保留 Windows PID 创建时间身份核对、批次操作系统锁、已保存槽位恢复和低于 15GiB 停新派发；不会终止已有 worker。原仓库针对固定四动作的 `INITIAL` / `--wait-pids` 引导已去掉，恢复只认有完整 PID 身份的已保存槽位。

任一 worker 非零退出或启动失败会停止新派发，让另一槽位结束，并报告需要诊断。浏览器失败或缺帧时禁用原渲染器的自动重试；保留 scratch、日志、结果。不能直接循环重跑，先检查内存、磁盘、驱动和错误原因。同一问题两次没有进展时停止报告。

## 绿幕与透明母帧

全片默认 `--format green`：保留原动作求解与 QA；串行/并行合成器逐像素保持原计算，使用无 mask 粘贴避免 alpha 被乘两次。并行合成是每路最多四个 CPU 帧任务，不会增加 3D 渲染路数。经 SHA 证书验证的 alpha 缓存可原字节复用；缺证书或不匹配时回退原计算并记录原因。

```powershell
py drill-anim/tools/hd/export_greenscreen_fast.py --output output/hd-banana-v1 --ids h-banana --once --keep-alpha
```

输出位于批次的 `greenscreen/`：

- `media/master/<id>-greenscreen.mp4`：1080² / 30fps，H.264 yuv444p CRF12 编辑母版。
- `alpha/<id>/m-####.png`：完整真实 straight RGBA 透明帧。
- `media/posters/`、`verification/`：绿幕封面与白/深底对照。
- `jobs/<id>/result.json`：最后提交的完成标记，含全部输入输出 SHA、帧数、逐像素抽样、完整 CPU 解码和继承的原动作 QA。

绿幕编辑母版不适合直接给手机播放；使用下一节的兼容派生。精确 alpha 比从绿幕重新抠像更可靠。源动作 QA 为 review 时会原样保留，合成成功不会自动升级动作验收。静态、超出可达范围等告警必须按具体消息审核。

`export_greenscreen.py`、`export_greenscreen_hq.py`、`export_greenscreen_fast.py`、两个 `composite_alpha*.py` 保持来源提交原字节，保留 frozen SHA 委托链；其 docstring 中的旧仓库命令属于来源记录，当前路径以上述命令为准。三种 exporter 分别保留独立汇总文件。不要让 watcher 与全片 worker 同时导出同一动作，独占锁会拒绝并发覆盖。

## App 兼容派生

```powershell
py drill-anim/tools/hd/export_app_delivery.py --primary output/hd-banana-v1 --selection output/hd-banana-delivery-selection.json --output output/hd-banana-delivery
```

默认选择 `primary/source-manifest.json` 的整个批次；`--ids` 可选子集，`--override` 可指定额外已验收批次。可选 `--app` 兼容旧 App 选集，数量按实际选集检查，不再强制 46。只接受原动作 QA 与合成、解码均通过且 alpha 完整的来源；逐帧复核 PNG SHA 后另出 `#101013`、1080² / 30fps、H.264 yuv420p CRF18 无音频素材。包含首/中/末像素检查与完整解码，不会直接替换 App 文件。

## 不可变批次与检查

`source-manifest.json` 固定规格、原 ID、主题、渲染输入、人物源、工具和配方 SHA。`profile`、`profile_options`、`model_version`、`production_config` 记录新批次实际选择的模型、选项及生产配置 SHA，`render_inputs` 继续固定 v2 基础源并纳入新版清单的所有运行源与数据；已有批次 resume 沿用原清单和原人物配方，不读取新默认覆盖旧配方。若当前工具与旧清单不兼容，保留旧目录，使用其冻结工具/环境续作或另建新版本批次。相同语义的旧清单保持原字节；来源/主题/工具/配方变更必须使用新目录。恢复完成项时重新核对当前输入输出及视频解码；部分产物不覆盖、不删除。版本发布仍走仓库既有清单和 ZIP 流程，本目录不上传、不改已发布版本。

```powershell
node drill-anim/verify.mjs
py drill-anim/test_portability.py
py -m unittest discover -s drill-anim/tools/hd -p 'test_*.py' -v
```

测试含原导出器的真实两帧编码、alpha 缓存命中/回退和冻结配方校验，以及 Hub 任意选集、来源保护、预览绑定、队列审批/恢复/失败停派发。模型、动作、历史冻结记录和 `media/manifest.json` 均不属于本次迁移改动。
