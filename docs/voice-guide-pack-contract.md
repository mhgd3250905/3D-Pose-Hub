# 语音引导进 App 包的约定（pose-hub-voice-guide@1，首发 r2-v14）

2026-11-14 开哥同意：V4 画面 + 动作包 r3 新文字 + 全部重新合成的语音打成同一个包（r2-v14），SDK 播放器接入 voiceGuide 后在 SF 上验收。

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
  - 超长单次 `steps[i]` → `g.step.<i>`
- 带 `key` 的条目（以及 `before`、`afterSet.*` 里的字符串）是共用词，到 `voiceCommon` 找。
- `training`（以及 `rhythm.execution`）可能带 `sideSwitchSeconds`（5–20）：一侧做完到另一侧开始前的准备时间（总时长，含换边语音）。
- 全库 249 个动作都有 voiceGuide：hold 62 个，reps 187 个（`first-2-reps` 186、`steps` 1）；`sides.perSide = each-side-separately` 107 个。

## 3. 播放规则（SDK 照这个实现，详细见 `catalog/production/v3-text/STYLE.md` §8）
**hold（计时）**：每组一条时间轴，`at` = 从「开始」算的组内秒数，到点念；最后 3 秒念 `n.3/n.2/n.1`。组后：还有组 → `afterSet.moreSets`（单侧未换边时是 `moreSetsSameSide`）；一侧做完 → `sideDone`；全部完成 → `allDone`。

**reps（次数）**：一下的时长 = `repSeconds`（已按 `repUnit` 折算）。
- `phaseCues: first-2-reps`：第 1、2 下按 `training.phases` 念 phase 口令（`phase.start/peak/end`），之后不念；
- 每一下结束念 `count.key`（`n.{rep}` → `n.1`、`n.2`…）；
- `reminders[i].afterRep = k`：第 k 下报数后接着念；`key: p.last_rep` 就是「最后一次」；
- `phaseCues: steps`：每一下在 `steps[i].at`（一下之内的秒数）念步骤句，下末照常报数；
- `before`：第一组开始前念（如「先做右边」）；`afterSet` 同 hold。

**单侧 each-side-separately**：一侧所有组做完再换边，每侧同一份脚本；换边时立刻念 `sideDone`，从上一侧结束起算满 `sideSwitchSeconds`（含这段语音，没有就用现有默认）再开始另一侧；语音比它长时等语音念完立即开始。例：s-pigeon 10 秒 = 换边语音约 2 秒 + 静候约 8 秒。

**兜底**：动作没有 `voiceGuide` 或 `status != "ready"` 时完全走现有逻辑。句子不叠、不掐：新句到点时上一句还没念完就排队（共用报数优先）。剂量被用户改过（组数/秒数/次数）时，hold 的 `at` 超出新时长的句子跳过，倒数仍放在最后 3 秒；reps 的 `p.last_rep` 改在新的倒数第 2 下后念。
