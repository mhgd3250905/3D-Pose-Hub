# Flare 计划口播 flare-plan-voice-r1：151 条 Pose-Hub 标准语音 → R2 + handoff（不切指针）

清单：`E:\AII-3D\handoff\flare-plan-voice-r1\manifest.json`（Codex-3D-Flare 导出，151 条 file + text）。
合成/处理/审核与 r2-v22 动作语音相同（Edge TTS zh-CN-XiaoxiaoNeural +6%，AAC 44.1 kHz 单声道 64 kbps，-16 LUFS）。
R2 只追加：`pack/r2-v1/plan-voice/flare-plan-voice-r1/<file>` + `…/manifest.json`。不写 `pack/channels/`，不改任何 catalog / pack 目录。

## 红线
- 不写、不改、不删 dev/beta/stable 指针；不覆盖 R2 已有对象；不改仓库代码，不推送，不合并，不 tag。
- 不改 `E:\AII-3D\handoff\flare-plan-voice-r1\manifest.json` 和 README.txt；只往 `out\` 写。
- 整机只跑这一个任务；有人派别的渲染/上传，回复「plan-voice-r1 占用中」。

## A. 准备
```powershell
cd E:\AII-3D\3D-Pose-Hub-worktrees\human-polish-v3-20261110
git status --porcelain --untracked-files=no      # 必须没有输出，否则停下回报
git fetch origin
git checkout --detach origin/codex/flare-plan-voice-r1
git log --oneline -1
$M = "E:\AII-3D\handoff\flare-plan-voice-r1\manifest.json"
$O = "E:\AII-3D\handoff\flare-plan-voice-r1\out"
$W = "F:\PoseHub-v3\runs\2026-11-21_flare-plan-voice-r1"
New-Item -ItemType Directory -Force $W | Out-Null
```
python / ffmpeg / edge_tts 用与 r2-v22 语音（E 步）相同的环境。

## B. 回读指针（只读）
读 https://media.uuugk.win/pack/channels/dev.json、beta.json、stable.json，原文存 `$W\channels-before.json`。

## C. 清单检查 + 合成
```powershell
python tools/flare-plan-voice-r1/voice_plan.py build --manifest $M --check-only
python tools/flare-plan-voice-r1/voice_plan.py build --manifest $M --work $W --out $O
```
- check-only 必须退出码 0 且 `items` = 151；不是：停下回报最后一行 JSON 原文。
- build 可续跑（中断后同命令重跑）。退出码 0 且 `done` = 151、`failedCount` = 0、`auditFailedCount` = 0、`uploadFiles` = 152。
  退出码 3：原样回报最后一行 JSON（含 failed / auditFailed），**不上传**。

## D. 上传前确认
```powershell
python tools/flare-plan-voice-r1/voice_plan.py verify absent --work $W
```
退出码 0（checked 152、ok 152）。不是：停下回报，不上传。

## E. 上传
与 r2-v22 H 步完全相同的上传方式与规则，按 `$W\plan.json` 顺序逐条（152 个：151 段语音 + 最后 manifest.json）：
404 → 上传（用条目 `contentType`，文件取条目 `source`）→ 回读核验字节数与 SHA-256；已存在且一致 → 跳过；已存在不一致 → 停下回报，不覆盖；
`pack/channels/` 开头 → 停下回报；429/5xx/网络读错误按 2/4/8/16/32/60 秒退避；每个对象间隔 0.2 秒；日志 `$W\upload.log`。
```powershell
python tools/flare-plan-voice-r1/voice_plan.py verify online --work $W
```
退出码 0（checked 152、ok 152）。

## F. 收尾
再读三个指针，与 `$W\channels-before.json` 逐字比较，必须相同（不同：停下回报，不改）。

最终回报（在本话题 @hark-sk）：
「plan-voice-r1 已上传，指针未动」+ C 步 build 最后一行 JSON 原文 + 上传数/跳过数/总数 + online verify 最后一行 JSON
+ `$W\plan-voice-manifest.json` 的 SHA-256 与字节数 + `$O` 下文件个数。
