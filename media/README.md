# media/：清单、版本 ZIP 与本地同步

代码、规格、模型和媒体清单进 Git；成片通过用户谷歌云盘公开链接分发。**一版一个 `pose-hub-media-v<版本>.zip`，不建 R2。** 主线维护方按用户授权直接在 main 完成清单、打包与发布记录，无需清单 PR。

| 工具 | 用途 |
| --- | --- |
| `tools/ingest.py` | 扫描本地成片，生成带大小、SHA-256、规格和主题来源的 draft 清单 |
| `tools/pack.py` | 核验公开媒体并按 `item.file` 打成确定性 ZIP，输出 ZIP 的 SHA-256 |
| `tools/sync.py` | App 按 lock 从解压目录复制需要的文件，逐个核验大小与 SHA-256 |

`tools/publish.py` 保留旧 R2 协议兼容和回归测试；当前发布流程不调用它，不需要桶、域名或凭据。

## 固定云盘目录

[3D-Pose-Hub](https://drive.google.com/drive/folders/1TU64lGHbNb-09pNy6nRBLnTxQ6NeHbRH) 下复用如下结构；目录 ID 已保存在 [drive-layout.json](drive-layout.json)，后续先按 ID 定位，避免重复创建同名根目录。

```text
3D-Pose-Hub/                         私有管理目录
  releases/                         私有管理目录
    v0.1.0/                         已批准发布的版本目录，知道链接的人可查看
      pose-hub-media-v0.1.0.zip
      pose-hub-media-v0.1.0.zip.sha256
      manifest.json                 冻结的单版本清单，单独下载
      README.txt                    校验与接入说明
    v0.1.1/                         下次发布时新建，沿用同样四个文件
```

`v0.1.1/` 是未来结构示例，不提前建空发布目录。公开权限只开到经过核验的版本目录，父目录保持受限；绿幕、透明帧和本机备份不进入这个云盘树。版本目录 URL 保存在对应清单的 `distribution.folderUrl`。

## 存储约定

公开成片、封面和静图使用 `storage: "archive"`，进入对应版本 ZIP。绿幕母版和透明帧使用 `storage: "local"`，只在清单记录哈希，不进 ZIP、不进 Git。用户当前要求原件与备份保留在 E 盘。

ZIP 根路径严格等于清单的 `file`，例如：

```text
h-9090-liftoff/h-9090-liftoff.dark.1080.mp4
h-9090-liftoff/h-9090-liftoff.dark.poster.1080.jpg
```

没有额外 `v0.1.0/` 前缀。ZIP 只含媒体，不含清单或 ZIP 校验文件，避免在清单记录 ZIP 哈希时形成循环依赖。清单由 Git 分发，App 保存同一发布版本的清单副本。

## 每版的发布步骤

1. 从 `config.example.json` 复制忽略的 `config.json`，设置本地 `src` 和规则；修订规格用 `specOverrides` 绑定。先 ingest 演练，再生成草稿。
2. pack 核验并打包，经用户授权上传到固定云盘路径的新版本目录，设为“知道链接的人可查看”。下载回读并比对 ZIP SHA-256。
3. 确认公开查看权限后，在版本发布记录登记链接、ZIP 字节数和 SHA-256；清单登记分发元数据并把版本设为 `published`、填写 `publishedAt`。链接到位前保持 draft；版本目录另存冻结的 `manifest.json` 和接入说明。
4. 在 main 提交并推送。已发布版本的 ZIP、媒体条目和哈希固定，变更内容要发布新版本。

```powershell
py media/tools/ingest.py --version 0.1.0 --dry-run
py media/tools/ingest.py --version 0.1.0
py media/tools/pack.py --version 0.1.0 --output E:/AII-3D/pose-hub-media/releases/pose-hub-media-v0.1.0.zip
```

`pack.py` 默认读取 `media/config.json` 的 `src`，也可以 `--src` 指定。默认输出为忽略目录 `media/dist/`；ZIP 旁有 `.sha256` 校验侧车。固定排序、时间戳及权限保证相同媒体集合重建相同 ZIP。不同内容拒绝覆盖已有同名包；坏源文件不会替换已有包。

## 清单字段

清单 schema 保持 `pose-hub/media-manifest@1`，`releases.<版本>` 包含 `status`、日期、模型、notes 和 items。每个 item 保存 id、variant、role、kind、file、local、storage、bytes、sha256、尺寸，以及规格和主题的 LF 规范化源码哈希。`local` 相对本机配置的 `src`，清单不保存机器绝对路径。

同一版本的 `(id, variant, role, tag, width)` 唯一。透明帧目录的哈希是按相对路径排序的 `相对路径<TAB>SHA256<LF>` 行整体求 SHA-256。发布分发元数据记录 ZIP 文件名、文件数、字节数、SHA-256 与核验过的公开链接；ZIP 本身不依赖这些元数据。

新配置使用 `archive`；旧 `r2` 值仍可被打包和同步工具读取，以兼容历史清单。旧 HTTP/mirror 路径沿用 `v<版本>/...`，新 `--from-dir` 直接使用 `item.file`。

## App 接入

下载 ZIP → 核对 ZIP SHA-256 → 解压 → `sync --from-dir` → `--check`。App 的 lock 指定固定版本、清单副本与 targets，无需 `baseUrl`。Windows、macOS、离线清单和文件命名示例见 [接入说明](../docs/consumers.md)。

## 验证

```bash
python -m unittest discover -s media/tests -v
```

测试覆盖 ingest、确定性打包、损坏源、原子复制、lock、按 id 选取、漂移检查、草稿和本地母版拒绝，以及旧 HTTP / mirror / R2 协议兼容。测试使用合成素材和本地假服务，不需要云账号。
