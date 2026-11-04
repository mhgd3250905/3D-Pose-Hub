#!/usr/bin/env python3
"""把线上 r2-v1 素材包目录整理成 ugk-3d-pose-sdk 能直接解析的格式。

可重复运行；只改目录（JSON），不碰任何媒体文件。

输入：
  --catalog   线上 https://media.uuugk.win/pack/r2-v1/catalog.json 的本地副本
  --verify    逐个下载线上媒体后算出的 bytes/SHA 结果（verify_media.py 产出）
  --taxonomy  catalog/taxonomy.json（旧词表，作为基础，新增词条在本脚本补齐）
  --legacy-semantic  catalog/catalog.json（0.3.0，只借同 ID 的 apps/tags 做 App 范围）
  --published-at  渠道指针 published_at（ISO 8601，带时区）
输出（--out 目录）：
  catalog.json              SDK 格式目录（pack/schema/status/就绪标记）
  catalog/catalog.json      单文件语义目录（pose-hub-catalog，带 bytes/SHA 引用）
  channels/{dev,beta,stable}.json   渠道指针
  report.json               转换报告（缺语义、映射、数字）

规则（用户 2026-11-04 定）：
- r2-v1（249 动作）是动作库第一版基线；所有动作 status: active。
- poster 不在 SDK 认的媒体类型内（video/cover/thumbnail），从 files 去掉；线上文件不动。
- defaultDose.mode=hold 映射为 time，秒数保留。
- 媒体逐个核对 bytes/SHA 一致才标就绪。
- 缺场景（scenes 为空）的动作不能当作完整训练定义：标 partial，不进语义目录，列清单。
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import sys

PACK = "r2-v1"
SCHEMA = 1
MIN_SDK = "0.8.0"
BASE = f"https://media.uuugk.win/pack/{PACK}/"
SEMANTIC_PATH = "catalog/catalog.json"
SEMANTIC_VERSION = "2.1.0"  # r2-v1 语义目录内容版本（MAJOR.MINOR.PATCH）
SDK_KINDS = ("video", "cover", "thumbnail")
DEFINITION_FIELDS = [
    "purpose", "category", "muscles", "muscleGroups", "equipment", "position",
    "unilateral", "level", "scenes", "defaultDose", "doseRange", "cues",
    "primaryCue", "cautions", "contraindications", "alternative",
]

# r2-v1 新词表在旧 taxonomy 里没有的词条：中文名取自目录里同动作的中文字段，
# 器械场所按旧词表里最接近的器械（band→gym、chair→三处、block→home/gym）。
NEW_CATEGORIES = {
    "stability": {"zh": "稳定", "en": "Stability"},
    "balance": {"zh": "平衡", "en": "Balance"},
    "assessment": {"zh": "评估", "en": "Assessment"},
}
NEW_MUSCLES = {
    "core": {"zh": "腹直肌（含深层腹横肌）"},
    "glutes": {"zh": "臀大肌"},
    "abductors": {"zh": "臀中肌 · 髋外展"},
    "upper-back": {"zh": "斜方肌中下部 · 菱形肌"},
    "lower-back": {"zh": "竖脊肌"},
    "neck": {"zh": "颈部"},
}
NEW_EQUIPMENT = {
    "resistance-band": {"zh": "弹力带", "scenes": ["gym"]},
    "mini-band": {"zh": "迷你弹力圈", "scenes": ["gym"]},
    "ankle-strap": {"zh": "脚踝绑带", "scenes": ["gym"]},
    "cable-machine": {"zh": "绳索器械", "scenes": ["gym"]},
    "d-handle": {"zh": "D 形把手", "scenes": ["gym"]},
    "pull-up-bar": {"zh": "单杠", "scenes": ["gym"]},
    "gymnastic-rings": {"zh": "吊环", "scenes": ["gym"]},
    "hip-abduction-machine": {"zh": "髋外展机", "scenes": ["gym"]},
    "stability-ball": {"zh": "瑞士球", "scenes": ["gym"]},
    "sliders": {"zh": "滑垫（可用毛巾代替）", "scenes": ["gym"]},
    "barbell": {"zh": "杠铃", "scenes": ["gym"]},
    "bench": {"zh": "训练凳", "scenes": ["gym"]},
    "yoga-block": {"zh": "瑜伽砖（可用厚书代替）", "scenes": ["home", "gym"]},
    "yoga-blocks": {"zh": "瑜伽砖（可用厚书代替）", "scenes": ["home", "gym"]},
    "foam-block": {"zh": "泡沫砖", "scenes": ["home", "gym"]},
    "stool": {"zh": "椅子/凳子", "scenes": ["home", "office", "gym"]},
    "towel": {"zh": "毛巾", "scenes": ["home", "office", "gym"]},
    "doorframe": {"zh": "门框", "scenes": ["home", "office", "gym"]},
}
NEW_POSITIONS = {
    "plank": {"zh": "平板支撑", "floor": True},
    "side-lying": {"zh": "侧卧/侧撑", "floor": True},
    "half-kneeling": {"zh": "单膝跪", "floor": True},
    "other": {"zh": "其他（器械/支撑）", "floor": False},
}


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def dump(obj) -> bytes:
    return (json.dumps(obj, ensure_ascii=False, indent=1) + "\n").encode("utf-8")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", required=True)
    ap.add_argument("--verify", required=True)
    ap.add_argument("--taxonomy", required=True)
    ap.add_argument("--legacy-semantic", required=True)
    ap.add_argument("--published-at", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    src_bytes = open(a.catalog, "rb").read()
    src = json.loads(src_bytes)
    verify = {(r["id"], r["kind"]): r for r in json.load(open(a.verify))}
    taxonomy = json.load(open(a.taxonomy))
    legacy = {d["id"]: d for d in json.load(open(a.legacy_semantic))["drills"]}

    cat = copy.deepcopy(src)
    report = {
        "source": {"bytes": len(src_bytes), "sha256": sha(src_bytes)},
        "holdToTime": [], "posterDropped": 0, "mediaMismatch": [],
        "missingScenes": [], "appsTagsFromLegacy": [], "noAppsTags": [],
    }

    ready, pending, complete, incomplete = [], [], [], []
    media_files = media_bytes = 0
    drills = []
    for act in cat["actions"]:
        aid = act["id"]
        # 1) poster 去掉（SDK 只认 video/cover/thumbnail）
        if act["files"].pop("poster", None) is not None:
            report["posterDropped"] += 1
        # 2) 逐个核对线上实际文件
        ok = True
        for kind in SDK_KINDS:
            f = act["files"][kind]
            r = verify.get((aid, kind))
            if not r or not r.get("ok") or r["bytes"] != f["bytes"] or r["sha256"] != f["sha256"]:
                ok = False
                report["mediaMismatch"].append(f"{aid}.{kind}")
            if f.get("downloadUrl") != BASE + f["path"]:
                raise SystemExit(f"{aid}.{kind} downloadUrl 与 baseUrl+path 不符")
            f["status"] = "ready" if ok else "pending"
            media_files += 1
            media_bytes += f["bytes"]
        # 3) hold → time，秒数保留
        dose = act["defaultDose"]
        if dose.get("mode") == "hold":
            dose["mode"] = "time"
            report["holdToTime"].append({"id": aid, "seconds": dose.get("seconds")})
        # 4) 生命周期：基线全部 active
        act["status"] = "active"
        # 5) 训练定义完整性：缺场景的标 partial（SDK 要求完整定义必须有 scenes）
        ts = act["trainingSemantics"]
        if not act.get("scenes"):
            act["trainingDefinitionComplete"] = False
            ts["definitionComplete"] = False
            ts["missingRequiredFields"] = ["scenes"]
            ts["status"] = "partial-unreviewed"
            report["missingScenes"].append(aid)
        definition_ok = act["trainingDefinitionComplete"]
        # 6) 就绪标记
        act["state"] = "ready-test-unreviewed" if ok else "pending-media"
        act["availableForApp"] = ok
        act["availableForTraining"] = ok and definition_ok
        (ready if ok else pending).append(aid)
        (complete if definition_ok else incomplete).append(aid)
        # 7) 语义目录：完整定义的动作全部收录，字段与目录逐字一致
        if definition_ok:
            d = {"id": aid, "name": {"zh": act["nameZh"], "en": act.get("nameEn") or act["nameZh"]}}
            for k in DEFINITION_FIELDS:
                if k in act:
                    d[k] = copy.deepcopy(act[k])
            old = legacy.get(aid)
            if old and (old.get("apps") or old.get("tags")):
                d["apps"] = old.get("apps", [])
                d["tags"] = old.get("tags", [])
                for k in ("flarelab",):
                    if k in old:
                        d[k] = old[k]
                report["appsTagsFromLegacy"].append(aid)
            else:
                d["apps"], d["tags"] = [], []
                report["noAppsTags"].append(aid)
            d["review"] = {"status": act.get("reviewStatus") or "unreviewed"}
            drills.append(d)
            ts["evidence"] = [e for e in ts.get("evidence", []) if e.get("path") != SEMANTIC_PATH] + [
                {"path": SEMANTIC_PATH, "actionId": aid}
            ]

    tax = copy.deepcopy(taxonomy)
    tax["categories"].update(NEW_CATEGORIES)
    tax["muscleGroups"].update(NEW_MUSCLES)
    tax["equipment"].update(NEW_EQUIPMENT)
    tax["positions"].update(NEW_POSITIONS)
    used = {
        "categories": {x["category"] for x in cat["actions"]},
        "muscleGroups": {m for x in cat["actions"] for m in x["muscleGroups"]},
        "equipment": {e for x in cat["actions"] for e in x["equipment"]},
        "positions": {x["position"] for x in cat["actions"]},
        "scenes": {s for x in cat["actions"] for s in x["scenes"]},
    }
    for dim, values in used.items():
        missing = values - set(tax[dim])
        if missing:
            raise SystemExit(f"taxonomy.{dim} 缺词条：{sorted(missing)}")

    semantic = {
        "format": "pose-hub-catalog",
        "formatVersion": 1,
        "version": SEMANTIC_VERSION,
        "generatedAt": a.published_at,
        "source": {"pack": PACK, "catalogSha256": report["source"]["sha256"],
                   "text": "catalog/production/v3-text", "commit": src.get("sourceCommit")},
        "taxonomy": tax,
        "drills": drills,
    }
    sem_bytes = dump(semantic)

    cat["pack"] = PACK
    cat["schema"] = SCHEMA
    cat["id"] = "app-pack-r2-v1"
    cat["semanticCatalog"] = {"path": SEMANTIC_PATH, "version": SEMANTIC_VERSION,
                              "bytes": len(sem_bytes), "sha256": sha(sem_bytes)}
    cat["readyCount"], cat["pendingCount"], cat["totalCount"] = len(ready), len(pending), len(cat["actions"])
    cat["pendingIds"] = pending
    cat["buildStatus"] = "media-verified" if not pending else "pending-media-export"
    s = cat["trainingSemantics"]
    s["definitionCompleteIds"] = complete
    s["definitionCompleteCount"] = len(complete)
    s["incompleteActionIds"] = incomplete
    s["pendingAuthoringIds"] = incomplete
    md = cat["mediaDistribution"]
    md["mediaFiles"], md["mediaBytes"] = media_files, media_bytes
    md["sourceCatalogSha256"] = report["source"]["sha256"]
    cat_bytes = dump(cat)

    os.makedirs(os.path.join(a.out, "catalog"), exist_ok=True)
    os.makedirs(os.path.join(a.out, "channels"), exist_ok=True)
    open(os.path.join(a.out, "catalog.json"), "wb").write(cat_bytes)
    open(os.path.join(a.out, SEMANTIC_PATH), "wb").write(sem_bytes)
    pointer = {
        "schema": 1, "pack": PACK, "catalog": BASE + "catalog.json",
        "catalog_sha256": sha(cat_bytes), "catalog_bytes": len(cat_bytes),
        "min_sdk": MIN_SDK, "published_at": a.published_at,
    }
    for ch in ("dev", "beta", "stable"):
        open(os.path.join(a.out, "channels", f"{ch}.json"), "wb").write(dump(pointer))
    report.update({
        "catalog": {"bytes": len(cat_bytes), "sha256": sha(cat_bytes)},
        "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes), "drills": len(drills)},
        "ready": len(ready), "pending": len(pending), "mediaFiles": media_files, "mediaBytes": media_bytes,
    })
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    print(json.dumps({k: report[k] for k in ("catalog", "semantic", "ready", "pending", "mediaFiles", "mediaBytes")}, ensure_ascii=False))
    print("missingScenes", len(report["missingScenes"]), "holdToTime", report["holdToTime"], "mismatch", len(report["mediaMismatch"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
