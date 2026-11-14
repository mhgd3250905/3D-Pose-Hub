# 语音引导进 App 包的约定（pose-hub-voice-guide@1，首发 r2-v14；voice-no-tempo-r1 修订）

2026-11-14 开哥同意：V4 画面 + 动作包 r3 新文字 + 全部重新合成的语音打成同一个包（r2-v14），SDK 播放器接入 voiceGuide 后在 SF 上验收。

> **voice-no-tempo-r1（开哥 2026-11-14 23:45/23:47，SF 测试反馈）**：计数之间不再念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「这个动作怎么做对」的要领讲解。对本约定的改动：次数类 `phaseCues` 新增取值 `"none"`（全库 187 个次数类都改成它）、`steps` 停用、`rhythm.execution.phases` 不再带 `@phase.*` 标记、每组自写讲解 ≤ 2 句。SDK 兼容见 §4。文案规则见 `catalog/production/v3-text/STYLE.md` §8「讲解不是指挥」。
>
> 本文件原在 `codex/v4-publish`（35ea5e78）；本分支带上它并修订，合并时同名文件以本版为准。

## 1. catalog 顶层新增 `voiceCommon`（共用词，原来打在 App 里）
```json
"voiceCommon": {
  "format": "pose-hub-voice-common@1",
  "files": [
    {"key": "n.1", "language": "zh", "path": "voice/_common/r2-v14/zh/n.1.m4a",
     "downloadUrl": "https://media.uuugk.win/pack/r2-v1/voice/_common/r2-v14/zh/n.1.m4a",
     "bytes": 5123, "sha256": "…", "durationSeconds": 0.41, "contentType": "audio/mp4"}
  ]
}
```
键集合 = `catalog/voice-v2/script.json` 的 `common`：`n.0`–`n.20`、`p.ready p.go p.last_rep p.release p.again p.right_first p.switch_left p.switch_right p.rest p.nice`、`sec.5 sec.10 sec.15 sec.20 sec.30 sec.45 sec.60 sec.90`，中英各一份。App 里打包的旧共用词仍可做兜底，**包里有就用包里的**。

## 2. 每个动作
- `voice.files` 照旧有 `name`、`primaryCue`、`phase.start/peak/end`（按新文字重合成，路径改为 `voice/<id>/r2-v14/<lang>/<clipId>.m4a`），另加引导句，`role: "guide"`，`clipId` 见下。
- `voiceGuide` = `catalog/production/v3-text/<id>.json` 的 `voiceGuide` 原样，`status` 改为 `"ready"`；**自写的句子**（带 `zh`/`en` 的条目）多一个 `clipId`，在 `voice.files` 里按 `clipId + language` 找文件：
  - 计时类 `set[i]` → `g.set.<i>`
  - 次数类 `reminders[i]` → `g.rem.<i>`
  - 超长单次 `steps[i]` → `g.step.<i>`（voice-no-tempo-r1 起不再出现；旧包里 deltoids-B 的 7 条作废）
- 带 `key` 的条目（以及 `before`、`afterSet.*` 里的字符串）是共用词，到 `voiceCommon` 找。
- `training`（以及 `rhythm.execution`）可能带 `sideSwitchSeconds`（5–20）：一侧做完到另一侧开始前的准备时间（总时长，含换边语音）。
- 全库 249 个动作都有 voiceGuide：hold 62 个，reps 187 个（voice-no-tempo-r1 起全部 `phaseCues: none`；r2-v14/r2-v15 包里是 `first-2-reps` 186、`steps` 1）；`sides.perSide = each-side-separately` 107 个。
- `voice.files` 里的 `phase.start/peak/end` 仍可随包下发（旧流程兼容），但 voiceGuide 不再引用，不必为本次改动重合成。

## 3. 播放规则（SDK 照这个实现，详细见 `catalog/production/v3-text/STYLE.md` §8）
**hold（计时）**：每组一条时间轴，`at` = 从「开始」算的组内秒数，到点念；最后 3 秒念 `n.3/n.2/n.1`。组后：还有组 → `afterSet.moreSets`（单侧未换边时是 `moreSetsSameSide`）；一侧做完 → `sideDone`；全部完成 → `allDone`。

**reps（次数）**：一下的时长 = `repSeconds`（已按 `repUnit` 折算）。
- `phaseCues: none`（voice-no-tempo-r1 起全部用这个）：任何一下都不念 phase 口令，只报数 + `reminders` 里的讲解；
- ~~`phaseCues: first-2-reps`：第 1、2 下按 `training.phases` 念 phase 口令（`phase.start/peak/end`），之后不念~~（停用，SDK 仍可识别旧包）；
- 每一下结束念 `count.key`（`n.{rep}` → `n.1`、`n.2`…）；
- `reminders[i].afterRep = k`：第 k 下报数后接着念（自写讲解每组最多 2 句，k 可以从 1 起）；`key: p.last_rep` 就是「最后一次」；
- ~~`phaseCues: steps`：每一下在 `steps[i].at`（一下之内的秒数）念步骤句，下末照常报数~~（停用）；
- `before`：第一组开始前念（如「先做右边」）；`afterSet` 同 hold。

**单侧 each-side-separately**：一侧所有组做完再换边，每侧同一份脚本；换边时立刻念 `sideDone`，从上一侧结束起算满 `sideSwitchSeconds`（含这段语音，没有就用现有默认）再开始另一侧；语音比它长时等语音念完立即开始。例：s-pigeon 10 秒 = 换边语音约 2 秒 + 静候约 8 秒。

**兜底**：动作没有 `voiceGuide` 或 `status != "ready"` 时完全走现有逻辑。句子不叠、不掐：新句到点时上一句还没念完就排队（共用报数优先）。剂量被用户改过（组数/秒数/次数）时，hold 的 `at` 超出新时长的句子跳过，倒数仍放在最后 3 秒；reps 的 `p.last_rep` 改在新的倒数第 2 下后念。

## 4. voice-no-tempo-r1 的发包与 SDK 兼容
- **源文件**（`catalog/production/v3-text/<id>.json`）：次数类 `voiceGuide.phaseCues = "none"`，`training.phases` 不带 `cue`，所以发包脚本生成的 `rhythm.execution.phases` 也不会有 `@phase.*` 标记（如 `go=1.5s; hold=0.8s; back=1.5s; rest=0.2s`）。
- **现有 SDK（main 036b5fcd，SmartFit 0.1.0+33 锁的 7b2c9933）不认识 `"none"`**：`PoseHubVoiceGuide.tryParse` 遇到未知 `phaseCues` 会抛 FormatException → 整个 voiceGuide 当成没有，回退旧逻辑（只报数，讲解句全丢）。所以：
  1. **发包时（不等 SDK）**：发包脚本把 `"none"` 写成 `"first-2-reps"` 再下发。效果完全一样——SDK 在前 2 下只念 `rhythm.execution.phases` 里的 `@phase.*` 标记，没有标记就什么都不念。已装的 SF 不用更新就能用新包。
  2. **SDK 跟进（建议，小改动）**：`PoseHubVoiceGuidePhaseCues` 加 `none`，解析 `'none'`，`_guidedWork` 里 `rep <= 2` 那段对 `none` 跳过。SDK 发版后，发包脚本可以直接下发 `"none"`。
- 讲解句的 `clipId` 规则不变（`g.set.<i>` / `g.rem.<i>`，`i` 是在 `set` / `reminders` 数组里的下标）。本次改动后要重合成的条目、作废的条目逐条列在 `catalog/review/voice-no-tempo-r1/resynth.json`。

