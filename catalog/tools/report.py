#!/usr/bin/env python3
"""从 catalog.json 生成审阅表与缺素材清单（不要手改输出）：
  catalog/review/catalog-review.md   逐条审阅表（按 App 分组 + 疑点）
  catalog/review/catalog-review.csv  同内容 CSV（Excel 可直接打开，UTF-8 BOM）
  catalog/MISSING.md                 缺素材清单
用法：python3 catalog/tools/report.py
"""
import csv
import json
import os
import subprocess
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = os.path.dirname(HERE)

if '--v2' in sys.argv:
    args = [x for x in sys.argv[1:] if x != '--v2']
    sys.exit(subprocess.call([sys.executable, os.path.join(HERE, 'action_package_v2.py'), 'report', *args]))
print('Historical v1 report only. Use --v2 for six-layer production completeness.', file=sys.stderr)

c = json.load(open(os.path.join(CAT, "catalog.json"), encoding="utf-8"))
tax = c["taxonomy"]
D = c["drills"]


def dose_text(x):
    d = x["defaultDose"]
    per = "每侧" if x["unilateral"] else ""
    amt = f"{per}{d['reps']} 次" if d["mode"] == "reps" else f"{per}{d['seconds']} 秒"
    if d.get("holdSeconds"):
        amt += f"（每次停 {d['holdSeconds']} 秒）"
    return f"{d['sets']}×{amt} 休{d['restSeconds']}"


def range_text(x):
    r = x["doseRange"]
    k = "reps" if "reps" in r else "seconds"
    u = "次" if k == "reps" else "秒"
    return f"组{r['sets'][0]}–{r['sets'][1]} {u}{r[k][0]}–{r[k][1]}"


cols = ["id", "中文名", "用途", "类型", "肌群", "器械", "体位", "单侧", "难度", "场所", "默认剂量", "可调范围", "注意部位", "替代", "App", "缺素材", "审阅"]


def row(x):
    return [
        x["id"], x["name"]["zh"], x["purpose"], tax["categories"][x["category"]]["zh"],
        "、".join(tax["muscleGroups"][g]["zh"] for g in x["muscleGroups"]),
        "、".join(tax["equipment"][q]["zh"] for q in x["equipment"]) or "徒手",
        tax["positions"][x["position"]]["zh"], "是" if x["unilateral"] else "", str(x["level"]),
        "、".join(tax["scenes"][s]["zh"] for s in x["scenes"]), dose_text(x), range_text(x),
        "、".join(x["cautions"]), x["alternative"] or "", "/".join(x["apps"]),
        "、".join(x["completeness"]["missing"]), {"auto": "", "reviewed": "已审", "doubt": "疑点"}[x["review"]["status"]],
    ]


with open(os.path.join(CAT, "review", "catalog-review.csv"), "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(cols)
    for x in D:
        w.writerow(row(x))

apps = Counter(a for x in D for a in x["apps"])
L = [f"# 动作目录审阅表（catalog v{c['version']}，生成于 {c['generatedAt']}）", "",
     "> 由 `python3 catalog/tools/report.py` 从 `catalog/catalog.json` 生成，不要手改。改数据请改 `catalog/review/overrides.json` 后重跑 build → validate → report。", "",
     f"共 **{len(D)}** 个动作：FlareLab {apps['flarelab']}、HipLab {apps['hiplab']}、SmartFit {apps['smartfit']}（一个动作可在多个 App）。素材全齐 {sum(x['completeness']['complete'] for x in D)} 个。", "",
     "## 疑点与人工更正", ""]
for x in D:
    if x["review"]["notes"] and x["review"]["status"] in ("doubt",) or any(n.startswith("人工更正") for n in x["review"]["notes"]):
        L.append(f"- `{x['id']}` {x['name']['zh']}：" + "；".join(n for n in x["review"]["notes"] if not n.startswith("FlareLab 动作：")))
L += ["", "FlareLab 独有的 49 个动作在 drills.json 里只有文字处方，类型/器械/体位/单侧/难度/场所/剂量/注意部位/替代均为人工逐条标注（`overrides.json` 的 `flarelab` 段）。", ""]
groups = [("托马斯 FlareLab", lambda x: "flarelab" in x["apps"]),
          ("开胯 HipLab（且不在 FlareLab）", lambda x: "hiplab" in x["apps"] and "flarelab" not in x["apps"]),
          ("仅 SmartFit", lambda x: x["apps"] == ["smartfit"])]
for title, fn in groups:
    rows = [x for x in D if fn(x)]
    L += [f"## {title}（{len(rows)}）", "", "| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    for x in rows:
        L.append("| " + " | ".join(v.replace("|", "/") for v in row(x)) + " |")
    L.append("")
open(os.path.join(CAT, "review", "catalog-review.md"), "w", encoding="utf-8").write("\n".join(L))

# ---------- 缺素材 ----------
M = Counter(m for x in D for m in x["completeness"]["missing"])
names = {"cover": "封面", "video": "视频", "spec": "Pose-Hub spec", "voice.zh": "中文语音", "voice.en": "英文语音", "release": "Pose-Hub 发布版本"}
L = [f"# 缺素材清单（catalog v{c['version']}）", "",
     "> 由 `catalog/tools/report.py` 生成。“一个动作”的整套素材 = 定义 + 封面 + 视频 + spec + 语音 + 进入 Pose-Hub 已发布素材版本。`complete` 不要求英文语音。", "",
     f"- 动作总数 {len(D)}，素材全齐 {sum(x['completeness']['complete'] for x in D)}",
     *[f"- 缺{names[k]}：{v}" for k, v in M.most_common()], ""]
for k in ("release", "voice.zh", "voice.en", "cover", "video", "spec"):
    ids = [x for x in D if k in x["completeness"]["missing"]]
    if not ids:
        continue
    L += [f"## 缺{names[k]}（{len(ids)}）", ""]
    by = {}
    for x in ids:
        by.setdefault("/".join(x["apps"]), []).append(f"`{x['id']}`")
    for a, v in sorted(by.items()):
        L.append(f"- **{a}**（{len(v)}）：{' '.join(v)}")
    L.append("")
L += ["## 说明", "",
      "- 缺 Pose-Hub 发布版本：FlareLab 51 个动作的成片是 2026-10-13 footfix 库导入 3D-Body 的旧 App 媒体（720²），未进 Pose-Hub 的 ZIP 发布；SmartFit 独有的动作视频来自 SmartFit 包（源自 Pose-Hub 成片，未单独发布）。要让 SDK 只靠 id 从 Pose-Hub 拉齐素材，需要后续素材版本把这些动作补进发布 ZIP。",
      "- 缺中文语音：FlareLab 独有的 49 个动作 App 内没有语音包；可用 SmartFit `tools/voice/build_voice.py` 按 drill-pack 台词句式生成。",
      "- 缺英文语音：SmartFit 包只有 zh；HipLab 46 个有 zh+en。", ""]
open(os.path.join(CAT, "MISSING.md"), "w", encoding="utf-8").write("\n".join(L))
print("写入 catalog/review/catalog-review.md、catalog-review.csv、catalog/MISSING.md")
