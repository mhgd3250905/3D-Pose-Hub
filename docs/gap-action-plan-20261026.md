# 缺口动作规划与第一批（任务 5，2026-10-26）

> 新动作规格（spec）+ 训练语义提议，**不改 219 目录、不改 taxonomy、不动素材包/Release**。第一批只做了低配机关键帧预览，精细渲染与全片 QA 留给主线本机。

## 1. 依据

- **219 目录**：SDK 素材包 `posehub-app-test-pack-r1-v2` 的 `catalog.json`（219 动作，211 条 `trainingDefinitionComplete=true`）。统计用 `actions[].muscleGroups / category`。
- **旧库核对**：`docs/old-library-audit-20261026.md`（PR #20，分支 `docs/old-library-audit`）。“建议补收 / 待确认”的老动作不重复规划成新动作。
- **已在审**：PR #17（8 个待补语义，含 `upper-traps` 词表提议）、PR #18（35 份 v2 修订）、PR #19（12 份 native8 修订）。这三个 PR 都只改**已有 id**，与本批新 id 无重叠（已在各分支 `drill-anim/specs` 里逐一查过）。
- **之前的盘点**：`/workspace/work/pose-hub-coverage-2026-10-23.md`、`pose-hub-gap-batch-plan-2026-10-23.txt`（仅作参考，结论以本文件为准）。
- **范围**：只做无氧肌肉训练和相关拉伸；徒手 + 居家器材（哑铃、弹力带、壶铃、椅子、垫、墙）优先；不做有氧、手指/脚趾、毛巾/橡皮筋等小道具。
- **引擎限制**（PR 分支 `engine/palm-floor-and-neck` 未合入）：手掌撑地悬空约 27 mm、颈部固定不能动。第一批不选依赖颈部主动转动/侧屈或手掌平撑地面的动作；这两类放第二批。

## 2. 219 现状统计

### 2.1 按类别

| category | 数量 |
|---|---:|
| strength | 115 |
| stretch | 45 |
| mobility | 33 |
| core | 25 |
| cardio | 1（`h-step-jack`，范围外，见 PR #20 遗留 2） |
| **合计** | **219** |

### 2.2 按肌群 × 类别（一个动作可计入多个肌群；按合计升序）

| muscleGroup | 中文 | strength | stretch | mobility | core | cardio | 合计 |
|---|---|---:|---:|---:|---:|---:|---:|
| (无 ID) | taxonomy 无对应 ID | 2 | 0 | 1 | 0 | 0 | 3 |
| biceps | 肱二头肌 | 4 | 0 | 0 | 0 | 0 | 4 |
| tibialis | 胫骨前肌 | 1 | 1 | 2 | 0 | 0 | 4 |
| serratus | 前锯肌 | 4 | 0 | 1 | 0 | 0 | 5 |
| rotator-cuff | 肩袖肌群 | 7 | 1 | 0 | 0 | 0 | 8 |
| forearms | 前臂 · 腕屈伸肌 | 4 | 2 | 4 | 0 | 0 | 10 |
| calves | 小腿三头肌 | 6 | 2 | 2 | 0 | 0 | 10 |
| scapular | 斜方肌中下部 · 菱形肌 | 8 | 1 | 2 | 1 | 0 | 12 |
| abs | 腹直肌 | 2 | 1 | 1 | 10 | 0 | 14 |
| erectors | 竖脊肌 | 4 | 4 | 3 | 3 | 0 | 14 |
| lats | 背阔肌 | 8 | 5 | 2 | 0 | 0 | 15 |
| triceps | 肱三头肌 | 14 | 1 | 0 | 1 | 0 | 16 |
| deltoids | 三角肌 | 13 | 2 | 1 | 0 | 1 | 17 |
| chest | 胸大肌 | 13 | 3 | 1 | 0 | 0 | 17 |
| adductors | 内收肌群 | 6 | 8 | 3 | 0 | 0 | 17 |
| hip-flexors | 髋屈肌 | 3 | 6 | 4 | 6 | 0 | 19 |
| quadriceps | 股四头肌 | 17 | 2 | 2 | 0 | 0 | 21 |
| obliques | 腹斜肌 | 5 | 5 | 2 | 11 | 0 | 23 |
| hamstrings | 腘绳肌 | 12 | 10 | 1 | 0 | 0 | 23 |
| hip-abductors | 臀中肌 · 髋外展 | 12 | 1 | 12 | 2 | 1 | 28 |
| glute-max | 臀大肌 | 32 | 5 | 13 | 1 | 0 | 51 |

“无 ID”的 3 个：`h-db-shrug`、`h-pike-scapular-elevation`（上斜方，taxonomy 没有上斜方 ID）、`o-supported-ankle-eversion`。

### 2.3 指定缺口的现状

| 缺口 | 219 现有 | 说明 |
|---|---|---|
| 二头 | 4（全是力量）：`h-db-curl`、`h-db-hammer-curl`、`h-fixed-bar-vertical-pull`、`h-towel-isometric-curl` | 毛巾等长那条还是“待补”；没有弹力带、反握、二头拉伸 |
| 颈 / 上斜方 | 颈 0；上斜方 2（`h-db-shrug`、`h-pike-scapular-elevation`，都没有肌群 ID） | taxonomy 没有颈部/上斜方 ID；颈部动作要等引擎 |
| 肩拉伸（三角肌） | 2：`h-seated-reachback`、`h-sleeper-stretch` | 肩后侧水平内收 `h-crossbody` 已在 PR #20 列为**建议补收**，走补收 |
| 三头拉伸 | 1：`h-overhead-triceps-stretch` | — |
| 股四拉伸 | 2：`o-stand-quad`、`h-couch-stretch` | — |
| 胸拉伸 | 3：`h-doorframe-forearms-pec-native-r3`、`h-dd-shoulder`、`h-seated-reachback` | `h-wall-pec` 在 PR #20 判为与门框重复 |

## 3. 查重结论

- 第一批 8 个新 id 在 main（301 份 spec）、`codex/action-library-v2-production`、`codex/app-test-pack-r1`、PR #17/#18/#19 分支里都不存在；按中文名/英文名关键词（反握、佐特曼、仙人掌、过头耸肩、后伸开肩、踩带、半跪手拉脚、屈肘三头）搜 spec 头注释，也没有同模式动作。
- 不规划成新动作、改走旧库**补收**（PR #20）：`h-crossbody`（肩后侧拉伸）、`h-pike-pushup`、`h-reverse-lunge`、`h-kb-swing`、`h-inner-thigh`、`h-bear-plank`、`h-towel-pass`、`t-lsit-wide`。
- 不规划、等开哥对 PR #20 的“待确认”拍板：`h-biceps-self`（徒手对抗弯举，二头）、`h-towel-behind`（背后握毛巾肩伸；另外本次范围不用毛巾）。
- 上斜方：本批的 `h-db-overhead-shrug` 是**过头位**耸肩（肩带上提 + 上回旋），和手臂下垂的 `h-db-shrug`、倒 V 自重的 `h-pike-scapular-elevation` 不是同一动作模式；没有做“弹力带耸肩”这种只换器材的版本。
- 三头拉伸：`h-chair-elbow-triceps-stretch` 是双肘搭椅背的髋铰链姿势，和站姿单臂辅助的 `h-overhead-triceps-stretch-rr1` 不同；“面墙肘抵墙”版本试过设计，因颈部固定、肘点到不了头顶以上，脸会比肘先碰墙，放弃（没有渲染入库）。

## 4. 第一批（已出 spec，8 个）

所有 spec：`modelProfile:'training-human-v2plus'`、`alignClavicles:false`、`v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'}`、`fps:30`、`size:1080`、8 s 循环；文件头注释写了设计处方（节奏）、朝向和与已有动作的区别。语义见 `catalog/test/gap-batch1-semantics.json`。

| # | id | 中文名 | 类别 | 目标肌群（muscleGroups） | 器材 | 支撑/接触 | 节奏（spec timeline） |
|---|---|---|---|---|---|---|---|
| 1 | `h-band-biceps-curl` | 站姿踩带弹力带弯举 | strength | biceps | band | 双脚踩带，手握带端 | 2 次/8 s：上 1.3、顶停 0.4、下 1.6 |
| 2 | `h-db-reverse-curl` | 站姿双哑铃反握弯举 | strength | biceps, forearms | dumbbell | 无 | 2 次/8 s：上 1.3、停 0.4、下 1.6；底部保留微屈避开大腿 |
| 3 | `h-db-zottman-curl` | 站姿双哑铃佐特曼弯举 | strength | biceps, forearms | dumbbell | 无 | 2 次/8 s：正握上 1.3、顶端翻腕 0.5、反握下 1.5、底端翻回 0.4 |
| 4 | `h-db-overhead-shrug` | 双哑铃过头耸肩 | strength | （空，见 §6） | dumbbell | 无；头颈不动 | 2 次/8 s：上提 1.6、顶停 0.3、回落 1.4（同 `h-db-shrug`） |
| 5 | `h-supine-cactus-chest` | 仰卧仙人掌开胸 | stretch | chest, deltoids | mat | 仰卧屈膝；手背朝下贴垫，手掌不撑地 | 1 次/8 s：上滑 1.5、保持 4.0、下滑 1.5 |
| 6 | `h-standing-arm-extension-stretch` | 站姿双臂后伸开肩 | stretch | deltoids, chest | 无 | 双手不接触 | 1 次/8 s：后抬 1.5、保持 3.5、放下 1.5 |
| 7 | `h-half-kneeling-quad-stretch` | 半跪姿手拉脚股四头肌拉伸 | stretch | quadriceps, hip-flexors | mat | 左膝跪垫（膝点由求解固定），左手抓左脚 | 1 次/8 s：同 `h-couch-stretch`（末端约 3.4 s） |
| 8 | `h-chair-elbow-triceps-stretch` | 扶椅背屈肘肱三头肌拉伸 | stretch | triceps, lats | chair（椅背顶 0.78 m） | 双肘搭椅背（肘点逐帧固定） | 1 次/8 s：下沉 2.2、保持 2.4、回升 2.0 |

原定约 10 个，交付 8 个。没做的 `h-db-concentration-curl`（坐椅单臂集中弯举）移到第二批：肘抵大腿内侧的接触几何需要再设计一轮，本次时间内没有做到能验证的程度，不硬塞。

## 5. 第二批（列名称与依赖，未出 spec）

| # | 拟定 id | 中文名 | 目标 | 依赖 / 为什么放第二批 |
|---|---|---|---|---|
| 1 | `h-seated-chin-tuck` | 坐姿收下巴 | 颈深屈肌 | **等引擎 PR `engine/palm-floor-and-neck` 合入**（颈部主动运动）；taxonomy 需新增颈部 ID |
| 2 | `h-seated-upper-trap-stretch` | 坐姿侧颈拉伸（上斜方） | 上斜方 | **等引擎颈部**（侧屈约 35°）；taxonomy 需上斜方 ID（PR #17 提议 `upper-traps`） |
| 3 | `h-seated-levator-stretch` | 坐姿肩胛提肌拉伸 | 肩胛提肌 | **等引擎颈部**（转头 + 低头）；需新 ID |
| 4 | `h-prone-neck-extension` | 俯卧颈部后伸 | 颈伸肌 | **等引擎颈部**；俯卧前臂/手垫额头也涉及手掌贴地 |
| 5 | `h-seated-neck-isometric` | 坐姿手掌抗阻颈部等长 | 颈前/侧 | 手掌贴头的接触；颈部静止但最好等引擎颈部版本一起验 |
| 6 | `h-prone-pec-stretch` | 俯卧单臂外展胸肌拉伸 | 胸大肌 | **等引擎手掌撑地**（对侧手推地翻身） |
| 7 | `h-side-lying-quad-stretch` | 侧卧股四头肌拉伸 | 股四头肌 | **等引擎手掌撑地**（下侧前臂/手撑地或枕头） |
| 8 | `h-prone-quad-stretch` | 俯卧单侧股四头肌拉伸 | 股四头肌 | **等引擎手掌撑地**（额头垫在手背上，脸部需离地） |
| 9 | `h-wall-biceps-stretch` | 扶墙肱二头肌拉伸 | 肱二头肌、三角肌前束 | 手掌平贴墙面，同属手掌接触面问题，**等引擎手掌修复** |
| 10 | `h-db-concentration-curl` | 坐椅单臂集中弯举 | 肱二头肌 | 不依赖引擎；需要肘抵大腿内侧的接触设计（从第一批移来） |

另：肩后侧拉伸走补收 `h-crossbody`（PR #20），不新做。

## 6. 语义与词表

- `catalog/test/gap-batch1-semantics.json`：8 条，字段对齐 219 complete 条目。节奏/计次写进 `countingSemantics`，秒数直接取 spec timeline 的关键点。
- 剂量只从 219 里 `trainingDefinitionComplete=true` 的同类动作借，每条写明借了谁：`h-db-curl`（踩带弯举）、`h-db-hammer-curl`（反握、佐特曼）、`h-doorframe-forearms-pec-native-r3`（仙人掌）、`h-seated-reachback`（双臂后伸）、`h-couch-stretch`（半跪股四）、`h-overhead-triceps-stretch`（屈肘三头）。
- 待补：
  - `h-db-overhead-shrug`：`muscleGroups` 空（taxonomy 没有上斜方 ID；`scapular` 是中下斜方，不能代替）；`level` 和剂量待补，因为最近的同类 `h-db-shrug` 在 219 里 `trainingDefinitionComplete=false`，按规则不借。开哥确认后可以沿用它的 1×6–8、休 30 s。
  - `h-half-kneeling-quad-stretch`：`level` 待补（最接近的 `h-couch-stretch`=3、`o-stand-quad`=1，推不出）。
- 只用 taxonomy 现有 ID，没有新增。

## 7. 引擎/模型相关发现

- **v2plus 人体不能用 `themes/glow-soft.json`**：soft-v1 把材质缓存键改成 `toon-drill1-soft-*`，`page/human-v2plus.js` 只打 `toon-drill1` 补丁，渲染直接报 `human-v2plus: no toon material patched`。本批预览全部用默认主题（不传 `--theme`），渲染请求块也照此写。
- **v2plus 高亮不认 `trapUpper`**：`V2P.GROUPS` 没有这个键，只有 `traps`（上斜方 + 中下斜方）。`h-db-shrug` 用的 `trapUpper` 在 v2plus 下可能不亮（本次没有渲染 `h-db-shrug` 核实）。本批过头耸肩用 `traps`。
