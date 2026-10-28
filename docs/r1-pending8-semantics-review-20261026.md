# R1 待补 8 个动作的训练语义补全——审核清单（2026-10-26）

- 基准：`posehub-app-test-pack-r1-v2` 的 catalog（SHA256 `a1655e5c…d25dc0`），`allActions` 219 个里 `trainingDefinitionComplete=false` 的 8 个。
- 本 PR **只出提议**，不替换已发布 catalog、不改 `catalog/taxonomy.json`、不动素材包。机器可读版：[`catalog/test/r1-pending8-semantics-proposal.json`](../catalog/test/r1-pending8-semantics-proposal.json)。
- 规则：只按 spec / 动画推导；推不出来的维持待补并写原因。借用别的动作剂量的地方单独标出，需开哥确认。

## 结论一览

| 动作 | r1 缺什么 | 档 | 提议 | 依据 |
|---|---|---|---|---|
| h-db-shrug 双哑铃站姿耸肩 | 肌群 ID | A | `muscleGroups: [upper-traps]` | spec 高亮 `trapUpper`，注释写明不是 scapular 中下部 |
| h-pike-scapular-elevation 派克位直臂肩带提压 | 肌群 ID | A | `muscleGroups: [upper-traps]` | spec 高亮 `trapUpper` |
| h-bilateral-farmer-hold-native 双哑铃农夫站立保持 | 肌群 ID | A | `muscleGroups: [forearms, upper-traps]` | spec 高亮 `forearms + trapUpper` |
| o-supported-ankle-eversion 扶椅悬空足外翻控制 | 肌群 ID | A | `muscleGroups: [peroneals]` | spec 注释：目标腓骨肌；人体无此高亮 |
| h-floor-nordic-hand-reset 地面北欧离心及手撑复位 | 器械 | A | `equipment: [mat, ankle-anchor]` | rr3 头注释：椅子只是家具边缘示意，不是器械认证 |
| h-kneeling-thread-needle 跪姿低位穿针 | 用途、难度、剂量 | B | 用途/难度/计次可从动画推出；数值借 h-quadruped-open：1×5，休 15 s，范围 1–2 组 / 2–8 次 | trajectory.json：1 s 下穿→2 s 停留→2 s 回位，一循环 1 次 |
| h-towel-isometric-curl 毛巾脚锚等长弯举 | 器械、难度、剂量 | C | 器械可补 `towel`；剂量、难度维持待补 | 静止母片、拉力不可量化，142 没有可借样本 |
| h-wall-palm-lift 墙面指端接触掌根抬起诊断 | 难度、剂量 | C | 维持待补，建议永久不进 AI 目录 | 本身是建模接触诊断，不是训练动作 |

**全部批准后：211 → 217 个完整（A 五个 + B 一个），C 两个仍待补。**

## 需要开哥拍板的 4 件事

1. **taxonomy 新增肌群 `upper-traps`（斜方肌上部）**——一次解决 3 个动作。引擎已有 `trapUpper` 高亮面板，只是目录词表没登记。
2. **taxonomy 新增肌群 `peroneals`（腓骨肌）**——解决足外翻。人体没有这块高亮，只影响画面。
3. **taxonomy 新增器械 `ankle-anchor`（足踝固定：同伴按住或稳固家具下沿）**——解决北欧离心。不开的话只能写 `[mat]`，AI 就没法按器械条件筛人，不推荐。
4. **穿针的借用剂量**（1 组 5 次、休 15 秒）是否接受；毛巾弯举是给一个起步处方还是继续待补/排除（开哥之前说过不要毛巾类小器材）。

## 逐项说明

### A 档：只差词表 ID（5 个）
其余字段 r1 已齐，且与 spec 头注释一致（耸肩 1 轻松组 6–8 次、派克 1 组 4–6 次、足外翻 1×10 每侧、北欧 3×4 休 90 s、农夫 3×30 s 休 45 s），本 PR 不改这些数值。

### B 档：h-kneeling-thread-needle（rr1）
- 动画：`drill-anim/models/threadneedle-native-r1/trajectory.json` 进度 q 曲线——0–1 s 静止，1–3 s 下穿，3–5 s 底部停留（q=1.0），5–7 s 回程，7–8 s 静止。→ 一循环 = 1 次“下穿-停留-回位”，**计次**；示范左侧，换侧同量另计。
- 难度 1：低位小幅度，双膝+右掌三点支撑，README 明说“幅度收窄的小范围修订”。
- 用途：四点跪姿下一侧手臂在舒适小范围内向对侧下穿并短暂停留，活动上背旋转、拉伸肩后侧。
- 数值推不出，借同体位同结构的 **h-quadruped-open（四足跪姿单臂开胸）**：1 组 5 次、休 15 秒，范围 1–2 组 / 2–8 次 / 0–60 秒。**借用，需确认。**

### C 档：维持待补（2 个）
- **h-towel-isometric-curl**：8 秒静止母片（`tracks.hold` 恒为 1），spec 头注释写明摩擦/防滚“not certified”。拉力全凭用户自己用力，无法定强度和时长；最近的 h-straight-arm-hang（3×15 s）是体重悬垂，机理不同，不借。器械可以补 `towel`。
- **h-wall-palm-lift**：spec 名就是 *Diagnostic*，是验证手指贴墙接触的建模诊断。动画只能推出“单侧右手、一次抬掌根-停留-回触约 7.3 s”。没有训练目的，不编剂量。建议永久排除；要做训练版应另出训练向 spec。

## 下游影响（只提示，不在本 PR 改）
- SDK 若对 `muscleGroups` / `equipment` 做枚举校验，需要同步新 ID（v3 patch 正在放开 catalog 校验，等它合入后再接）。
- 批准后由开哥本机按 `catalog/README.md` 流程生成新的语义修订（r1-semantics-r2），再出新的素材包版本；v2 Release 不改。
