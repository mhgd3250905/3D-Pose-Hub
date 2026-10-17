# App 接入 Pose-Hub 成片

适用于 FlareLab（3D-Body 仓库 `app/`，Flutter）和 HipLab（独立仓库，Flutter）。原则：**App 只取已发布（published）的固定版本，只取自己列出的动作 id，每个文件都校验 sha256。** App 仓库里不再渲染、不再改动作规格。

## 1. 放进 App 仓库的两样东西

1. `tools/pose_hub_sync.py`：直接复制 Pose-Hub 的 [`media/tools/sync.py`](../media/tools/sync.py)（单文件、只用 Python 标准库）。复制时在文件头注明来源提交，例如 `# copied from 3D-Pose-Hub media/tools/sync.py @ <commit>`。
2. `pose-hub.lock.json`：锁定版本 + 要用的 id。提交进 Git，改版本号就是"升级动作素材"。

```json
{
  "poseHub": {"repo": "mhgd3250905/3D-Pose-Hub", "version": "0.1.0"},
  "baseUrl": "https://<R2 公开域名，桶建好后填>",
  "targets": [
    {"variant": "dark", "role": "video",  "width": 1080, "dest": "assets/drill_media", "name": "hip-{id_lower}.mp4",
     "ids": ["glute-max-A", "h-9090-liftoff"]},
    {"variant": "dark", "role": "poster", "dest": "assets/drill_media", "name": "hip-{id_lower}{ext}",
     "ids": ["glute-max-A", "h-9090-liftoff"]}
  ]
}
```

- `variant`：`dark`（深色底，现在 App 用的）、`light`（浅色主题）。`greenscreen` / `alpha` 是本地母版，不发布，App 取不到。
- `role`：`video`、`poster`（封面）、`still`（静图，如自测三档对比图，一个 id 下按 `tag` 区分 a/b/c/front/back）。
- `width`：同一 id 有多个分辨率时必须写。
- `name` 可用字段：`{id}` `{id_lower}` `{tag}` `{variant}` `{role}` `{width}` `{ext}` `{file}`；有 tag 的条目 `name` 里必须带 `{tag}`。
- `dest` 相对锁定文件所在目录。
- `baseUrl` 也可以不写，改用环境变量 `POSE_HUB_MEDIA_BASE_URL`。

## 2. 命令

```bash
python tools/pose_hub_sync.py --lock pose-hub.lock.json --dry-run   # 看会下载什么
python tools/pose_hub_sync.py --lock pose-hub.lock.json             # 下载缺的 / 不一致的，已一致的不动
python tools/pose_hub_sync.py --lock pose-hub.lock.json --check     # 只校验，有缺失或不一致时退出码 1
python tools/pose_hub_sync.py --lock pose-hub.lock.json --receipt tools/pose-hub-receipt.json   # 可选回执
```

- 下载先写临时文件，大小和 sha256 都对上才替换目标文件；对不上就报错、什么都不写。
- 脚本从不删除文件。从锁定文件里去掉的 id，对应旧文件要在 App 的 PR 里手动删。
- 离线 / CI 可用 `--source-dir <本地镜像>`（目录里是 `v0.1.0/...`，与 R2 结构相同）。
- 清单默认取 `<baseUrl>/v<版本>/manifest.json`（发布时冻结上传的那份），也可 `--manifest` 指定 Pose-Hub 仓库里某个 tag 的 `media/manifest.json`。

## 3. 动作 id 从哪来

- id 就是 Pose-Hub `drill-anim/specs/<id>.js` 的文件名（不含 `.js`），也是清单里每条的 `id`。
- 修订稿（例如 `h-9090-liftoff-r2.js`）发布时仍用 App 认识的 id（`h-9090-liftoff`），清单条目里的 `spec.path` 指向实际渲染的修订稿。
- 查某个版本有哪些 id：

```bash
python -c "import json,urllib.request;r=json.load(urllib.request.urlopen('<baseUrl>/v0.1.0/manifest.json'))['release'];print(sorted({i['id'] for i in r['items'] if i['variant']=='dark' and i['role']=='video'}))"
```

## 4. FlareLab（3D-Body `app/`）

- 现状：51 个训练视频在 `app/assets/drill_media/<id>.mp4`（720×720）和 `<id>.jpg`（540×540 封面），来源记录在 `app/assets/data/drill-media-manifest.json`，由 `app/tools/import-drill-media.py` 从 3D-Pose v1.0.0 导入。51 个 id 与 Pose-Hub `drill-anim/data/drills.json` 一致。
- 接入后：`app/pose-hub.lock.json` 的 targets 用 `"dest": "assets/drill_media", "name": "{id}.mp4"`（视频）和 `"{id}.jpg"`（封面），ids 取 `drills.json` 里的 51 个：

```bash
python -c "import json;d=json.load(open('drill-anim/data/drills.json'));print(json.dumps([t['id'] for g in d['drills'].values() for t in g.values()]))"
```

- 注意：现有 51 个文件是 720² 版本。Pose-Hub 第一版素材发布前，FlareLab 保持现有文件不动；发布时如果分辨率或文件名变化，要在同一个 FlareLab PR 里改 `drill-media-manifest.json` 和用到它的 Dart 代码。

## 5. HipLab

- 现状：视频 `assets/drill_media/hip-<id 小写>.mp4`、封面 `hip-<id 小写>.jpg`，元数据 `tools/hip_content/source/hip-media.json`（key 是动作 id），自测对比图 `assets/hip/assessment/<项目>-<a|b|c|front|back>.webp`；`tools/hip_content/build_hip_content.py` 据此生成 `assets/hip/hip-content.json`。旧的 `tools/sync_drill_media.py` 直接从 3D-Body 的输出目录拷贝。
- 接入后：锁定文件 targets 用 `"name": "hip-{id_lower}.mp4"` / `"hip-{id_lower}{ext}"`，自测静图用 `"role": "still"`、`"name": "{tag}..."` 这一类模板（以 Pose-Hub 发布时清单里的 tag 为准）；`build_hip_content.py` 不变，只是媒体来自 sync 后的目录。ids 取 `hip-media.json` 的 key。

## 6. 要新动作 / 改动作

1. 在 Pose-Hub 提 issue（写清楚 App、动作、问题、期望），或直接按 [AGENTS.md](../AGENTS.md) 开 `drill/<id>` / `fix/<id>-…` 分支和 PR。
2. Pose-Hub 合并后渲染、ingest、发布新版本（例如 0.1.1）。
3. App 侧开 PR：改 `pose-hub.lock.json` 的版本号 / ids，运行 sync，提交新媒体文件。
