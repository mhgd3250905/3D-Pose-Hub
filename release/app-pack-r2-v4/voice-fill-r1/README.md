# voice fill r1（2026-11-06）

r2-v3 里 27 个动作没有语音（26 个地面修复批次没出 voice-manifest，h-supine-cactus-chest 英文「Breathe」检查失败），这里补齐。

- 生成：`python3 tools/app-pack/voice_fill_r1.py --root <dir> --catalog release/app-pack-r2-v3/catalog.json --ids <27 个>`
  （edge-tts 前先 `unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY ALL_PROXY`）
- 标准与正式生产相同（tools/action-package-v3/voice.py）：zh-CN-XiaoxiaoNeural +6% / en-US-JennyNeural +4%，-16 LUFS，
  限幅，单声道 AAC 64k 44.1 kHz，HipLab 逐句检查。文案取 catalog/production/v3-text/<id>.json，未改。
- cue points：本机没有 masters，用 tools/app-pack/spec_pulse.mjs 按 engine.js 的 pulseAt 逐帧算脉冲
  （与 12 个样例 masters 记录的 pulse 逐帧一致），再走 definition.cue_points 同一算法。
- h-supine-cactus-chest en phase.peak「Breathe」：单词句合成尾部静音只有 31 ms（标准 ≥40 ms），
  合成输入改为「Breathe…」（读音、时长不变，尾部 71 ms），manifest 的 text 仍是原文，provenance.ttsInput 有记录。
- 结果：27 个全部 technical-passed，270 句；manualListening 仍为 pending。
- 目录：packages/<id>/{definition.json, voice-manifest.json, voice/{zh,en}/{name,primaryCue,phase.start,phase.peak,phase.end}.m4a}
