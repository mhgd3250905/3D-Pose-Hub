# App 接入 Pose-Hub 成片

App 只取 `published` 的固定版本，按 lock 选动作，并逐文件核对大小与 SHA-256。当前分发方式是谷歌云盘公开 ZIP：一版一个包，开发机和 Mac 手动下载、解压后从本地同步。App 不修改动作规格或渲染素材。

## App 中保存的文件

将本仓库的 `media/tools/sync.py` 复制为 App 的 `tools/pose_hub_sync.py`，将同一发布提交的 `media/manifest.json` 复制为 `tools/pose-hub-manifest.json`。脚本只依赖 Python 3.9+ 标准库；这两份文件与 lock 一起提交，离线构建也能校验。

`pose-hub.lock.json` 示例：

```json
{
  "poseHub": {"repo": "mhgd3250905/3D-Pose-Hub", "version": "0.2.0"},
  "manifest": "tools/pose-hub-manifest.json",
  "targets": [
    {"variant": "dark", "role": "video", "width": 1080,
     "dest": "assets/drill_media", "name": "hip-{id_lower}.mp4",
     "ids": ["glute-max-A", "h-9090-liftoff"]},
    {"variant": "dark", "role": "poster", "width": 540,
     "dest": "assets/drill_media", "name": "hip-{id_lower}{ext}",
     "ids": ["glute-max-A", "h-9090-liftoff"]}
  ]
}
```

`manifest` 和 `dest` 的相对路径以 lock 所在目录为基准。清单也可通过 `--manifest` 指定本地路径或 URL；采用本地清单即可完成离线同步和检查。当前流程不需要 `baseUrl`。

v0.2.0 的视频仍是 1080²，封面改为 540²；从 v0.1.0 升级时，需要同时把 lock 的版本和 poster 的 `width` 改好。v0.1.0 的 1080² 封面保持原样，继续使用旧版的 App 不需修改。

## 下载、解压、同步

从对应的 [发布记录](../media/releases/0.2.0.md) 取得云盘链接和 ZIP SHA-256。先核对整个 ZIP，再解压到任意目录。ZIP 根目录直接是 `<id>/<发布文件名>`，不含 `v0.2.0/` 前缀，也不含清单、绿幕或透明母帧。

Windows PowerShell：

```powershell
Get-FileHash .\pose-hub-media-v0.2.0.zip -Algorithm SHA256
Expand-Archive -LiteralPath .\pose-hub-media-v0.2.0.zip -DestinationPath .\pose-hub-media-v0.2.0
py tools\pose_hub_sync.py --lock pose-hub.lock.json --from-dir .\pose-hub-media-v0.2.0
py tools\pose_hub_sync.py --lock pose-hub.lock.json --check
```

macOS：

```bash
shasum -a 256 pose-hub-media-v0.2.0.zip
unzip pose-hub-media-v0.2.0.zip -d pose-hub-media-v0.2.0
python3 tools/pose_hub_sync.py --lock pose-hub.lock.json --from-dir ./pose-hub-media-v0.2.0
python3 tools/pose_hub_sync.py --lock pose-hub.lock.json --check
```

`--from-dir` 参数必须指向解压后直接包含动作 id 目录的那一层。脚本不会解析云盘分享链接，也不会批量下载云盘文件。已匹配的目标文件不重写；复制先写临时文件，大小和 SHA-256 均通过才替换目标。源文件损坏会报错并保留原目标；`--check` 只检查 App 目标文件，漂移时返回 1。脚本不删除旧文件。

```bash
python3 tools/pose_hub_sync.py --lock pose-hub.lock.json --from-dir ./pose-hub-media-v0.2.0 --dry-run
python3 tools/pose_hub_sync.py --lock pose-hub.lock.json --from-dir ./pose-hub-media-v0.2.0 --receipt tools/pose-hub-receipt.json
```

旧的 HTTP 同步和 `--source-dir` 镜像模式仍兼容，镜像目录需要 `v<版本>/...`；它与新 ZIP 解压根目录的 `--from-dir` 模式不同，不能混用。

## 选取文件

`variant` 可选 `dark` / `light`，`role` 可选 `video` / `poster` / `still`。绿幕和透明帧标为 `storage: "local"`，不会进入 ZIP，也不能同步到 App。公开 ZIP 条目使用 `storage: "archive"`；脚本兼容旧清单的 `r2` 值。

同一 id 有多个分辨率时要写 `width`。`name` 支持 `{id}`、`{id_lower}`、`{tag}`、`{variant}`、`{role}`、`{width}`、`{ext}`、`{file}`；有 tag 的静图必须在目标文件名里保留 `{tag}`。修订规格仍发布成原动作 id，实际规格通过清单的 `spec.path` 记录。

## 当前 App 范围

v0.2.0 与 v0.1.0 均只含 HipLab 46 个动作的深色成片和封面；v0.2.0 使用 soft-v1 柔化高亮。自测静图、light 以及 FlareLab 的 51 个动作均不在本包。FlareLab 当前不接入，保留既有媒体。后续发布覆盖它的动作集后，可使用 `{id}.mp4` / `{id}.jpg` 的目标模板。

HipLab 采用 `hip-{id_lower}.mp4` / `hip-{id_lower}{ext}`；同步后仍由自己的内容生成器维护元数据。这里提供工具和接入约定，不自动改动 App 仓库。

## 后续升级

动作贡献继续从 main 拉分支并提 PR。主线维护方审核、渲染、ingest 后打出新版本 ZIP，经用户授权上传云盘并核验，登记链接和 ZIP SHA-256，将该版本标为 `published`，直接提交推送 main。已发布包不覆盖；App 升级时更新清单副本和 lock 的版本号，再下载、解压、同步及检查。

## AI 目录接入单独登记

本页的 lock 与 ZIP 流程针对 `media/manifest.json`。AI 选动作和剂量数据另取 [catalog/catalog.json](../catalog/catalog.json)，按固定提交或经过发布的独立目录 tag 锁定，不能把 `poseHub.version` 的媒体版本号当作目录版本号。

当前 catalog 0.2.0 已随 PR #11 合入，但没有独立目录发布 tag；可审计内容提交为 `884074701d8ec93e6d25d410786336532cc664de`，main 合入提交为 `4bb02f96768c5e704b2db65c806fbbaf6eda36fb`。接入前核对 `formatVersion`、单侧 `perSide`、剂量单位以及 `holdSeconds` 的停留执行、展示与时长计算。SmartFit 的 8 项剂量、7 项侧别同步及 SDK `holdSeconds` 支持仍待验收，目录合入不能替代 App / SDK 的执行验证。

具体字段见 [目录说明](../catalog/README.md)，各项接入状态见 [版本对齐台账](version-ledger.md)。
