# 动作目录 CHANGELOG

## 0.3.0 — 2026-10-20

- 新增可选字段 `rhythm`（formatVersion 仍为 1）：全部 App 动作节奏的唯一来源（决定 C），格式与 ugk_trainer `Rhythm.fromJson` 一致。
  - HipLab 46 个：取 action-kit `training`（kind、leadSeconds、相位、holdSeconds、reps），`source: hiplab`。
  - SmartFit 独有且有 `repSeconds` 的 32 个：rep_updown 单相 go，`source: repSeconds`。
  - 其余 64 个（FlareLab 49、SmartFit 计时 15）不写，SDK 按剂量缺省。
- `catalog.schema.json` 增加 `$defs/rhythm`；`validate_catalog.py` 校验节奏结构，并在 `--app-root hiplab=` 时与动作包逐项比对。
- 输入提交不变（SmartFit `6d4eb30`、HipLab `cdbb14c`、3D-Body `2be8cca`），其余字段与 0.2.0 相同。

## 0.2.0 — 2026-10-20

- 修复剂量、注意部位、素材路径、器械四类问题（PR #11 合入 main）。

## 0.1.0

- PR #11 初稿，142 个动作 id。
