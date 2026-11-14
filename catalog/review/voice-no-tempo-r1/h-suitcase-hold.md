# h-suitcase-hold 单手提哑铃站立（voice-no-tempo-r1）

- 剂量：3 组 × 30 秒；voiceGuide.mode = `hold`
- 依据：开哥 2026-11-14 23:45/23:47（SF 测试）——计数之间不念「蹲过去、踩住」这类按节拍的动作口令，不干扰用户自己的速度和节奏；只留报数 + 「怎么做对」的要领讲解。
- 结论：引导句 3 → 3 句：去掉节拍/速度指令和短口令，只留怎么做对的要领

## 引导句

改前（orig 原文）：

- `@4` 身子别往哑铃那边歪 / Don't lean toward the weight
- `@12` 两边肩膀一样高 / Shoulders level ——太短，像口令（中文 <5 字或英文 <3 词）
- `@20` 肩膀别耸 / No shrugging ——太短，像口令（中文 <5 字或英文 <3 词）

改后：

- `@4` 身子别往哑铃那边歪 / Don't lean toward the weight（保留）
- `@12` 两边肩膀一样高，别往哑铃那边沉 / Shoulders level, no dipping toward the weight（新写）
- `@20` 拿哑铃那边肩膀不耸，喘气照常 / Weight-side shoulder stays low, breathe normally（新写）

## 发布时要重合成的语音

- `g.set.2` zh：两边肩膀一样高，别往哑铃那边沉
- `g.set.2` en：Shoulders level, no dipping toward the weight
- `g.set.3` zh：拿哑铃那边肩膀不耸，喘气照常
- `g.set.3` en：Weight-side shoulder stays low, breathe normally
