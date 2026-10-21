# 动作包 v2 语音

`script.json` 是本轮 6 动作的双语播报脚本，`manifest.json` 是逐条导入、合成和检测结果。语音与皮肤无关，每个动作共用一份双语声音；原文案、英文翻译及人工听感均仍需开哥审阅。音频不入 Git。

声线沿用 HipLab 当前制作标准：中文 `zh-CN-XiaoxiaoNeural`、语速 `+6%`；英文 `en-US-JennyNeural`、语速 `+4%`。来源为 HipLab `tools/voice/build_voice.py`、`tools/voice/audit_voice.py` 和 `docs/voice-audit-2026-10-18.md`。快照文件 SHA 见 `provenance.json`。使用的是既有制作配置，不代表本轮新增了最终声线批准。

格式为单声道 AAC、44.1 kHz、64 kbit/s 的 `.m4a`。只裁首尾静音，保留约 40 ms 头、80 ms 尾，从不裁句中；每句固定增益，以重复到至少 3 秒的 EBU R128 积分响度校准 -16 LUFS，低通、前瞻限幅后重新检测。生产争取 ±0.3 LU、真峰值 ≤-1.2 dBTP，实际审核门槛沿用 HipLab **-16±1 LUFS、真峰值 ≤-1.0 dBTP**。不能把生产目标当作全部素材的审核实测值。

每条实际解码并检测容器/流/解码时长差（≤50 ms）、AAC/声道/采样率、突断、尾静音 40–200 ms、头静音 ≤120 ms、积分响度、真峰值和后半段响度骤降。新合成句还与本次保留的原始 TTS 比较语音跨度（短于源 >90 ms 失败）、新增停顿及响度曲线。复用句没有本机原始 TTS 时，`audit.rawComparison=false`，不得宣称已复测源对照或人耳听感。简短六动作子集不运行基于全词库中位数的语速异常筛查；不能把这个子集检查说成 HipLab 完整 488 条审计重跑。

`name`、`primaryCue` 在动作开始前播报。`phase.start/peak/end` 是起始、顶峰、结束阶段引导的候选句，绑定动作关键时刻；猫牛式依次对应拱背、抬胸和中立位。短相位可能小于完整句时长，消费者必须按实测语音时长提前排程或省略该句，不能在相位结束时掐断音频，也不能硬叠两句。它们不代表试渲视频含配音音轨。训练数字及倒数共用 `n.0…n.10`，换边、休息及秒数保存在 `sharedVocabulary`，不复制到每套皮肤。

存储布局为 `F:/PoseHub-v2-pilot/voice/<lang>/<actionId>/*.m4a`、`voice/common/<lang>/*.m4a`；原始 TTS、临时 PCM、依赖放 `work/voice` 和 `work/python-deps`。manifest 中统一以 `{root:"media",path:"voice/...",sha256,bytes,durationSeconds,...}` 引用；不写机器绝对路径。`contentReview`、`manualListening` 与技术审核分开，缺音频为 `pending`、不合格为 `failed`，不伪造通过。

离线导入和复测：

```powershell
python -B -X utf8 tools/voice-v2/build.py --root F:/PoseHub-v2-pilot --hiplab E:/AII-3D/3D-Hip
```

缺句生成需显式加 `--synthesize`，使用免费的在线 Edge TTS，联网请求失败即停止新请求并留下真实 pending，不消耗付费 TTS 或访问凭据。依赖应先用 `pip --target <media-root>/work/python-deps` 安装，`TEMP/TMP` 同样指向 F 盘；不会修改 HipLab checkout。相同文本和声线才复用 HipLab 音频；已存在且不同的导入文件拒绝覆盖，后续改变文本或重新制作需使用新的生产目录，保留既有结果。

本轮原文案沿用：单腿臀桥与青蛙式名称、主要点、臀部抬起/放下等相位词，以及共用词表。其余动作名称和中文主点来自现有 catalog；英文主点及新增相位词为本轮编辑。猫牛式把旧“塌腰抬头”改为“收腹拱背，缓慢抬胸，手脚保持稳定”，属待用户审阅的文案修订，不默认为已验收。
