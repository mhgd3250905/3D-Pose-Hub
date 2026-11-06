# 膝角修复 r1（2026-11-06，分支 codex/knee-fix-r1，基于 codex/voice-fill-r1 04ea7b7）

## 根因与修法
- 旧 home-anim spec 的站立骨盆高度（0.884–0.894 m）按旧腿长（0.353+0.410 m）写；v3 armfix-r2 腿长 0.410+0.417 m、脚钉地，站着也被解成 46–48° 半蹲。
- 共用修法 `tools/knee-fix-r1/kn-lib.mjs`：骨盆高度按腿长比例重算 y' = A + S·(y − A)（S = 0.827/0.763，A = 0.149 m），各深度的膝角形状保持（站直还是直，深蹲底部还是深）。
- `tools/knee-fix-r1/corr.py`：按实测膝角逐帧闭环修正骨盆高度（新轨道 kn1y），站立段目标 5°、铰链类 17°、各特殊动作见文件里的表。
- `tools/knee-fix-r1/plan.mjs`：少数动作的专门处理（直腿前抬两个、侧跨步弓步加宽、身体拿着的世界系手随骨盆上移 kn1h）。
- `tools/knee-fix-r1/fix.mjs <id>…`：从修前 spec 生成 `<spec>-kn1.js`（JSON 字面量，原 spec 不动），改配方 spec/specSha256Lf，并写 `kneeFix.r1`。共 69 个动作。
- 已通过的 40 个动作文件没动；全量重测读数与修前逐个相同（含 hamstrings-A、o-supported-single-leg-rdl、h-kb-swing）。

## 结果
- 前后角度全表：angles-before-after.md（112 个站姿动作）。
- 普通站立 / 单腿支撑 / 提踵：46–48° → 5°（≤10°）。深蹲/弓步/上步顶端 5°，底部深度基本保持（h-squat 114→109°，扶椅浅蹲加深到 63°）。
- 铰链类 12 个：48–66° → 15–20°，硬拉/早安式下放全程 17–18° 不变。
- 拿不准 4 个按建议：屈膝提踵 40°、分腿蹲顶部前膝 15°、扶椅弓步后腿 21–32°、骨盆画圈 12–18°。
- 未修好：o-stand-crossreach 支撑腿 59–60°（交叉脚位问题，2 次尝试失败，需重写脚位）；o-stand-ham 支撑腿 44–46°（被拉腿已直）。

## 检查
- 穿地（完整安装链 ground-penetration-audit，stride 30）抽 12 个代表/特殊动作：全部无 < −5 mm，脚底最低 0 mm（滑垫 4 mm、直腿前抬放下时 6 mm 离地）。结果 ground-subset-results.jsonl。
- 自穿模 scan-fast（69 个，修前/修后对比）：拿在身上的世界系手改为随骨盆上移后，回到修前读数；其余增加的是 upperArm>torso 腋下项（以前审核已接受的同类指标），o-supported-hip-airplane 目测正常。
- 配方核对 check-spec-sha.py：249 个、mismatch 0、missingImports 0。
- 前后对比小图（侧视诊断图，非正式渲染）：*-before-after.png。
