# media/：清单、版本 ZIP 与本地同步

代码、规格、模型和媒体清单进 Git；成片通过用户谷歌云盘公开链接分发。**一版一个 `pose-hub-media-v<版本>.zip`，不建 R2。** 主线维护方按用户授权直接在 main 完成清单、打包与发布记录，无需清单 PR。

| 工具 | 用途 |
| --- | --- |
| `tools/ingest.py` | 扫描本地成片，生成带大小、SHA-256、规格和主题来源的 draft 清单 |
| `tools/pack.py` | 核验公开媒体并按 `item.file` 打成确定性 ZIP，输出 ZIP 的 SHA-256 |
| `tools/sync.py` | App 按 lock 从解压目录复制需要的文件，逐个核验大小与 SHA-256 |
| `tools/drive_sync_plan.py` | 汇总制作库存，按动作生成不可覆盖的制作归档包与增量上传计划 |

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
    v0.2.0/                         soft-v1，沿用同样四个文件
    v<下一版本>/                    发布时新建，沿用同样四个文件
  动作素材库/                       制作归档，知道链接的任何人可查看和下载
    <动作类别>/
      <动作ID>__<中文名>.mp4        可直接播放的绿幕
      <动作ID>__<中文名>--<指纹>.zip 配套归档包；同类内平铺，按索引查动作
    <总索引与校验清单>
```

每版使用独立目录；制作中准备的版本目录保持受限，核验通过后才开放该版本。App 发布权限开到经过核验的版本目录，`3D-Pose-Hub` 和 `releases` 管理父目录保持受限；绿幕、透明帧和制作备份不进入公开 `releases/`，统一同步到[动作素材库](https://drive.google.com/drive/folders/1SYZ1Ww3LRpMX4MZOSZeV6gpWl0Tc7fJe)。用户于 2026-10-19 授权该素材库及其内容设为“知道链接的任何人可查看和下载”，不启用公开搜索发现，替代此前私有归档限制。版本目录 URL 保存在对应清单的 `distribution.folderUrl`。素材库的分类、增量同步与校验规则见[云盘素材同步](../docs/material-cloud-sync.md)。

## 存储约定

公开成片、封面和静图使用 `storage: "archive"`，进入对应版本 ZIP。绿幕母版和透明帧使用 `storage: "local"`，不进 App 公开版本 ZIP、不进 Git；另按动作打包到云盘制作素材库。`local` 是 App 发布 ZIP 的分发边界，不禁止获授权的云端归档和链接共享。既有原件与本地备份保留在 E 盘；本轮 v2 新制作产物按用户授权放在 F 盘，位置见下方制作快照。

先检查已有素材的规格、模型、主题和 SHA，再补缺项。只换背景或缩小尺寸时，复用相同外观的 exact-alpha 母帧进行后期合成和编码；已有透明母帧时优先使用它，避免从绿幕 MP4 再次抠像。新高亮着色、人物材质或姿态变化需要新的主渲染母帧，同一份新母帧供不同背景和尺寸派生，不为每个变体重复跑 3D。旧 glow-B/v7 的主体颜色已经烘焙旧高亮，不能将换底或简单模糊称为 soft-v1。

`ingest` 只登记来源，不改变图片。规则中的 `theme` 必须是素材实际渲染时使用的主题；修改配置中的主题名称不能把旧素材转换成新高亮。

ZIP 根路径严格等于清单的 `file`，例如：

```text
h-9090-liftoff/h-9090-liftoff.dark.1080.mp4
h-9090-liftoff/h-9090-liftoff.dark.poster.540.jpg
```

以上是 v0.2.0 的 1080 视频与 540 封面命名；v0.1.0 的封面仍为 1080。没有额外版本目录前缀。ZIP 只含媒体，不含清单或 ZIP 校验文件，避免在清单记录 ZIP 哈希时形成循环依赖。清单由 Git 分发，App 保存同一发布版本的清单副本。

## 本地制作库存

新版制作当前保存为独立快照 [library-v2-20261022-r1](../docs/production-snapshots/library-v2-20261022-r1.md)，源码固定于 `960b486f2e2d64f431ab24299a94dfe925e0562b`，[机器快照](../catalog/v2/production-snapshots/library-v2-20261022-r1.json)记录制作范围。原正式目录 142 动作及 PR #14 新增 47 动作共 189 动作、1890 个视频已完成，采用五皮肤 × 深浅背景，产物位于 `F:/PoseHub-v2-pilot/neck-fix-r2/` 与 `F:/PoseHub-v2-production/`。当前为 `draft-unreviewed`，`reviewed:false`、`releaseEligible:false`；数量和文件核验不替代逐项人工审片。本次只保存制作快照，没有新 ZIP、tag、云端素材发布或 App 升级；公开媒体继续使用已 published 的 0.2.0（46 动作、92 个公开文件）。

已验收但尚未发布为 App 素材 ZIP 的制作母版，另存于本机 `E:/AII-3D/pose-hub-media/inventory/`。库存登记见 [PR #5 / #6 高清母版](inventory/pr5-pr6-hd-2026-10-18.json)，审核、实看帧号和备份说明见 [主线验收记录](../docs/pr5-pr6-main-review-2026-10-18.md)。本地 `index.html` 提供绿幕播放、透明帧和证据入口。

库存登记只保存来源、路径、QA 和 SHA；媒体原件与同盘备份不进 Git。库存完成与公开版本发布分别登记，后续从 exact alpha 派生背景或尺寸时复用这些母帧。

用户已授权云盘归档，后续由用户定期提出整理请求后再同步，不建立定时器，也不在制作完成或入库后自动触发。收到请求后，运行 `py media/tools/drive_sync_plan.py --help` 查看当前工具参数，按库存生成增量计划并上传到固定制作素材库，沿用知道链接的人可查看和下载的权限，完成下载回读 SHA-256 校验后记录云端回执。已有内容指纹包复用，变动生成新包；缺项与待复核状态照实保留，不以“已归档”替代制作验收。

配套 ZIP 回读校验成功即表示该包备份完成，包内绿幕也已归档。额外直传的绿幕播放文件单独登记播放同步状态；播放链接 pending 不会把已验证的配套包降为未备份。总索引按动作 ID、中文名、分类和 QA 状态检索，同一分类内无需为每个动作另建目录。

## 每版的发布步骤

1. 从 `config.example.json` 复制忽略的 `config.json`，设置本地 `src` 和规则；修订规格用 `specOverrides` 绑定。先 ingest 演练，再生成草稿。
2. pack 核验并打包，经用户授权上传到固定云盘路径的新版本目录，设为“知道链接的人可查看”。下载回读并比对 ZIP SHA-256。
3. 确认公开查看权限后，在版本发布记录登记链接、ZIP 字节数和 SHA-256；清单登记分发元数据并把版本设为 `published`、填写 `publishedAt`。链接到位前保持 draft；版本目录另存冻结的 `manifest.json` 和接入说明。
4. 在 main 提交并推送。已发布版本的 ZIP、媒体条目和哈希固定，变更内容要发布新版本。

下面以 v0.2.0 的制作过程为例。新发布时改为新的版本号和对应素材目录；已经 `published` 的版本禁止重新 ingest。

```powershell
py media/tools/ingest.py --version 0.2.0 --dry-run
py media/tools/ingest.py --version 0.2.0
py media/tools/pack.py --version 0.2.0 --output E:/AII-3D/pose-hub-media/releases/pose-hub-media-v0.2.0.zip
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
