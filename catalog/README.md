# 统一动作目录（catalog）

三个 App（托马斯 FlareLab、开胯 HipLab、智能健身 SmartFit）和共用 SDK `ugk_coach` 的动作数据源。Pose-Hub 只放数据；SDK、AI 提示词、App profile 在 SDK 仓库（mhgd3250905/ugk-3d-pose-sdk）。

当前目录版本与合入记录见 [版本对齐台账](../docs/version-ledger.md)，版本号、固定提交和消费端接入规则见 [版本管理](../docs/version-management.md)。目录版本独立于 `media/` 的成片 ZIP 版本；`docs/drill-catalog.md` 是包含历史修订的 spec 开发总表。

“一个动作”是最小单位：**动作定义 + 封面静帧 + 示范视频 + 建模源（spec）+ 语音**。目录里每条 drill 给一个 Pose-Hub id，带齐定义字段，`assets` 段列出这个 id 的各类素材在哪、齐不齐。

## 文件

| 文件 | 内容 |
|---|---|
| `catalog.json` | 目录本体（`format: pose-hub-catalog`，`formatVersion: 1`，带 `version` 与 `generatedAt`）。生成物，不要手改 |
| `catalog.schema.json` | JSON Schema（draft 2020-12），SDK 按它解析 |
| `taxonomy.json` | 枚举与中文名：类型、肌群、器械（及各场所默认具备）、体位（是否地面）、场所、注意部位 |
| `review/overrides.json` | 人工审阅数据：FlareLab 独有动作的手标标签、对已有数据的更正（附原因）、手写用途、疑点 |
| `review/catalog-review.md` / `.csv` | 逐条审阅表（生成物） |
| `MISSING.md` | 缺素材清单（生成物） |
| `tools/build_catalog.py` | 生成：读三个 App 仓库 + 本仓库 → `catalog.json` |
| `tools/validate_catalog.py` | 校验：Schema（装了 jsonschema 时）+ 语义规则 + `--check-files` 核对 spec 哈希与 spec 道具↔`equipment` + `--app-root <app>=<仓库>` 核对外部素材路径/哈希及 HipLab 跨来源剂量、注意部位 |
| `tools/report.py` | 生成审阅表和缺素材清单 |

工具只用 Python 标准库（Schema 校验可选 `pip install jsonschema`）。

## 收录规则

- 只收**至少一个 App 里有可播放视频**的动作：SmartFit `assets/packs/*`（93）、HipLab `assets/action_kits/*`（46）、FlareLab `app/assets/drill_media/*`（51）。合并后 142 个。
- id 用 Pose-Hub 基础 id（不带 `-r2/-r3`）；实际渲染用的修订写在 `assets.spec.path`（如 `s-frog` → `drill-anim/specs/s-frog-r2.js`）。
- 定义字段与 SmartFit drill-pack format 1 同名同义：`category`（即训练类型 type：strength/core/cardio/mobility/stretch）、`muscles`、`muscleGroups`、`equipment`（`[]` 徒手）、`position`、`unilateral`、`level`、`scenes`、`defaultDose`、`cues`、`primaryCue`、`cautions`、`contraindications`、`alternative`。新增：`purpose`（一句话用途）、`doseRange`（可调范围）、`apps`（哪些 App 内可直接用）、`tags`（`thomas`、`hip`、`office`、`flarelab:<肌群>:<档>` 等）、`assets`、`completeness`、`review`。
- 数据优先级：SmartFit pack（已人工整理）→ FlareLab 手标（`overrides.json` 的 `flarelab` 段）→ `fixes` 更正。HipLab 的 `sided` 和 FlareLab 处方用于交叉核对，不一致会写进 `review.notes`。
- 剂量语义以可执行动作包为准：HipLab 动作的 `defaultDose.mode`（计次/计时）及 rep_hold 停留必须与 HipLab action-kit `training` 一致。冲突由 `overrides.json` 的 `doses` 段裁定（`source: hiplab` = 整组采用动作包 defaults）；未裁定的冲突自动标 `review.status=doubt`。只比语义不比数值（各 App 默认量本来不同）。
- `defaultDose.holdSeconds`（仅 `mode=reps`）：每次到位后停留秒数，如 `{mode: reps, reps: 3, holdSeconds: 10}` = 3 次、每次停 10 秒；单侧动作每侧都如此。消费端执行时每次多停 `holdSeconds`，时长估算同样计入；不支持的消费端至少把「每次停 N 秒」显示出来，不得丢弃。
- 注意部位：SmartFit `cautions` 与 HipLab `display.cautions`（词表归一：内收肌根→大腿内侧、髋前侧夹痛→髋）取并集，只增不减。
- 场所：`home` / `office` / `gym`。健身房请求同时接受 `scenes` 含 `home` 的动作；办公室请求不接受地面体位（`taxonomy.positions.*.floor`）。

## 素材解析（id → 整套素材）

`assets` 每类给 `status` 与 `sources`。每个 source 标 `app`（`smartfit` / `hiplab` / `flarelab` / `pose-hub`）和**相对该仓库根**的路径（FlareLab 素材在 Flutter 工程下，故为 `app/assets/drill_media/...`）；`pose-hub` 源的路径是发布 ZIP 内路径，`release` 是素材版本号（见 `media/manifest.json`）。建议 SDK 解析顺序：本 App 自带 → Pose-Hub 已发布版本 → 其他 App。

- `spec`：Pose-Hub 里的 spec 路径、LF 规范化 sha256、修订来源、人物 profile
- `releases`：包含该动作成片的 Pose-Hub 已发布版本（目前 0.1.0、0.2.0，各 46 个 HipLab 动作）
- `cover` / `video`：各来源的封面与视频（含宽高、循环秒数、单侧演示哪一侧）
- `voice`：drill-pack 台词（name/intro/cue/side_switch/rest/finish，含实测时长 ms）与音频路径模板（SmartFit `assets/packs/<id>/voice/{lang}/{line}.m4a`；HipLab `assets/voice/{lang}/{line}.m4a` + 键 `drill.<id>`、`point.<id>`）
- `drillPack`：现成的 drill-pack@1 落地包（SmartFit）。drill-pack 是“一个动作”的落地格式，缺包的动作（FlareLab 独有 49 个）后续按同格式补包

`completeness.complete` = 定义 + 封面 + 视频 + spec + 中文语音 + 进入 Pose-Hub 发布版本全齐（不要求英文语音）。当前 46 个全齐，缺项见 `MISSING.md`。

## 更新流程

```bash
# 在 Pose-Hub 根目录；三个 App 仓库路径按本机调整
python3 catalog/tools/build_catalog.py --smartfit ../Sport-Helper --hiplab ../HipLab --flarelab ../3D-Body --version 0.2.0
python3 catalog/tools/validate_catalog.py --check-files \
    --app-root smartfit=../Sport-Helper --app-root hiplab=../HipLab --app-root flarelab=../3D-Body
python3 catalog/tools/report.py
```

- 改标签/剂量/用途：改 `review/overrides.json`，不要改 `catalog.json`。
- 版本：PATCH 修文字/标签；MINOR 增删动作、改剂量或范围、素材变化；MAJOR 改字段含义（同时升 `formatVersion`）。同一 `formatVersion` 只加可选字段，读取方忽略不认识的字段。
- SDK 拉取：按 tag 固定版本读 `https://raw.githubusercontent.com/mhgd3250905/3D-Pose-Hub/<tag>/catalog/catalog.json`，用 `version` 判断是否更新；离线时用 App 内置的一份。

## 已知限制（v0.2.0）

- FlareLab 49 个动作的标签是人工按处方文案与成片判断的，未经专业审核；`contraindications` 全部为空（不编造医学禁忌）。
- 7 个动作 `unilateral` 改成了 `true`（与 HipLab/FlareLab 处方一致），SmartFit 包仍是 `false`，需同步（见审阅表“疑点与人工更正”）。
- 8 个动作剂量按 HipLab 动作包统一（v0.2.0），SmartFit 包 `defaultDose` 仍是旧值、ugk_coach SDK 尚未读取 `holdSeconds`，需同步。
- 输入：SmartFit `6d4eb30`、HipLab `cdbb14c`（main）、3D-Body `2be8cca`（master）。
