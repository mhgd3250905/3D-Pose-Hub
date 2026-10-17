# media/：成片素材清单与发布工具

Git 里**不放成片**。这里只有一份带 sha256 的素材清单 `manifest.json`，加上三个脚本（只用 Python 标准库，Windows 可直接跑）：

| 脚本 | 谁用 | 做什么 |
|---|---|---|
| `tools/ingest.py` | 渲染方（用户本地 4080 机器） | 扫描本地成片目录，把每个文件的 id、变体、分辨率、sha256、字节数，以及渲染所用 spec / theme 的 sha256 写进 `manifest.json` 的某个版本（草稿） |
| `tools/publish.py` | 渲染方，**需用户同意** | 把该版本里 `storage: "r2"` 的文件上传到 Cloudflare R2 的 `v<版本>/` 目录，再上传冻结的 `v<版本>/manifest.json`，并把版本标为 `published` |
| `tools/sync.py` | App 仓库（FlareLab、HipLab） | 读取**一个固定版本**的清单，只下载指定的动作 id 到目标目录，逐个校验 sha256 |

## 存储分工（已定）

| 内容 | 放哪里 |
|---|---|
| 代码、人物模型、动作规格、这份清单 | Git（本仓库） |
| App 用的压缩成片（深色 / 浅色 mp4、封面、静图） | Cloudflare R2，按版本分目录 `v0.1.0/…`，**只增不改** |
| 绿幕母版、透明 PNG 母帧（`greenscreen` / `alpha`） | **不进 Git、不上 R2**；用户本地 + 异地备份。清单里仍记录 sha256（`storage: "local"`），用来核对备份 |

R2 桶还没有建。建桶、开公开访问、拿 API Token 都由用户决定，见交接文档 `to-user-local.md`。脚本里没有任何密钥，全部从环境变量读。

## 清单格式（`manifest.json`，schema `pose-hub/media-manifest@1`）

```jsonc
{
  "schema": "pose-hub/media-manifest@1",
  "repository": "mhgd3250905/3D-Pose-Hub",
  "storageLayout": "v{version}/{file}",          // R2 对象路径
  "releases": {
    "0.1.0": {
      "status": "draft",                          // draft → published（发布后不可修改）
      "createdAt": "2026-10-18T02:00:00Z", "updatedAt": "…", "publishedAt": null,
      "model": "training-human-v2@2.0.1",          // drill-anim/models/training-human-v2.json 的 id@version
      "notes": "",
      "items": [
        {
          "id": "h-9090-liftoff",                  // 动作 id = drill-anim/specs/<id>.js
          "variant": "dark",                       // dark | light | greenscreen | alpha
          "role": "video",                         // video | poster | still | frames
          // "tag": "a",                           // 可选：同一 id 下多个文件时区分（自测静图 a/b/c/front/back），来自规则里的 {tag}
          "kind": "file",                          // file | frames（PNG 序列目录）
          "file": "h-9090-liftoff/h-9090-liftoff.dark.1080.mp4",   // 版本目录下的发布文件名
          "local": "dark/h-9090-liftoff.mp4",      // 相对 config.json 里 src 的本地路径（不记机器绝对路径）
          "storage": "r2",                         // r2 | local
          "bytes": 1234567,
          "sha256": "…",
          "width": 1080, "height": 1080, "durationSec": 4.0, "fps": 30.0, "frames": 120,
          "spec":  {"path": "drill-anim/specs/h-9090-liftoff.js", "sha256": "…"},   // CRLF→LF 后的 sha256，与 verify.mjs 同规则
          "theme": {"path": "drill-anim/themes/glow-b.json", "sha256": "…"}
        }
      ]
    }
  }
}
```

- 同一版本内，`(id, variant, role, tag, width)` 唯一。
- `kind: "frames"` 的 sha256 = 对目录内文件按相对路径排序后，逐行 `相对路径<TAB>sha256<LF>` 再整体求 sha256。
- 分辨率、时长、帧数直接从 mp4 / png / webp / jpg 文件头读，不依赖 ffprobe。
- `spec` 为 `null` 表示仓库里找不到对应 spec（例如 r2 修订稿），请在 `config.json` 的 `specOverrides` 里指明。

## 本地配置 `media/config.json`

从 `config.example.json` 复制（已被 .gitignore 排除）。`src` 是本地成片根目录，`rules` 把目录结构映射成清单条目：

```json
{"variant": "dark", "role": "video", "pattern": "dark/{id}.mp4", "storage": "r2", "theme": "drill-anim/themes/glow-b.json"}
```

`{id}` 匹配一个动作 id（不含 `/`），`{tag}` 匹配一段不含 `-` 和 `/` 的标签（如 `stills/{id}-{tag}.webp`），`*` 匹配不含 `/` 的任意字符，结尾带 `/` 表示匹配一个 PNG 帧目录。先用 `--dry-run` 看匹配结果。

## 命令

```powershell
# 1) 生成/更新草稿清单（只写 media/manifest.json）
py media/tools/ingest.py --version 0.1.0 --dry-run
py media/tools/ingest.py --version 0.1.0
# 2) 提交清单 PR（一个版本一个 PR）
# 3) 用户同意后发布到 R2（默认 dry run；加 --yes 才上传）
$env:POSE_HUB_R2_BUCKET="…"; $env:POSE_HUB_R2_ACCOUNT_ID="…"
$env:POSE_HUB_R2_ACCESS_KEY_ID="…"; $env:POSE_HUB_R2_SECRET_ACCESS_KEY="…"
py media/tools/publish.py --version 0.1.0
py media/tools/publish.py --version 0.1.0 --yes
# 也可以用 wrangler：--backend wrangler（需要 wrangler login 和 POSE_HUB_MEDIA_BASE_URL）
# 4) 把被改成 published 的 manifest.json 再提一个 PR
```

App 侧：

```bash
python tools/pose_hub_sync.py --lock pose-hub.lock.json          # 下载缺的、校验已有的
python tools/pose_hub_sync.py --lock pose-hub.lock.json --check  # 只校验（CI 或提交前）
```

锁定文件格式见 `tools/sync.py` 文件头和 [docs/consumers.md](../docs/consumers.md)。

## 不变的规则

1. **发布版本只增不改。** `publish.py` 遇到同名但内容不同的对象直接中止；`ingest.py` 拒绝修改已发布版本。要改成片就发新版本（例如 0.1.1）。
2. App 只用 `published` 的版本，并在自己的锁定文件里写死版本号。
3. 推送和发布都要用户同意（见根目录 `AGENTS.md`）。

## 测试

```bash
python -m unittest discover -s media/tests -v
```

测试用合成的 mp4/png 和本地假 R2 服务器，覆盖：清单生成与幂等、已发布版本拒改、dry run、上传与重跑跳过、拒绝覆盖、本地文件被改后拒绝上传、SigV4 与 AWS 文档示例签名一致、按 id 子集同步、篡改检测、损坏下载不落盘、缺 id / 本地母版 / 草稿版本报错、本地镜像同步。
