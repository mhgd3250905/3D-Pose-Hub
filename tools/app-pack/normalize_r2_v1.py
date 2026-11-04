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
- 词表：r2-v1 新词按下方显式表映射回 SDK 旧词（SDK 不改词表）；注意事项整句保留，
  抽旧禁忌部位词进 contraindications。
- 原 scenes 为空的 32 个动作按器械推场所（SCENES_INFERRED 显式表），补完进语义目录。
- 语义目录 apps/tags 只沿用旧语义目录同 ID 的数据；其余不标，由 App profile 规则筛。
- 若仍有缺场景的动作：标 partial，不进语义目录，列清单。
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

# ---------------------------------------------------------------------------
# 词表对齐（用户 2026-11-04 定）：r2-v1 新词映射回 SDK 现有旧词，SDK 不改词表。
# 旧词表 = catalog/taxonomy.json + SDK 问答/提示词里写死的 id
#   （coach_qa_agent._muscleIds / _homeEquipment，prompt_builder._catShort/_posShort，
#    qa_finder.ambientEquipment）。值为 None 表示该词是配件，并入同动作里的主器械后去掉。
MUSCLE_MAP = {
    "core": "abs",              # 腹直肌（含深层腹横肌）
    "glutes": "glute-max",
    "abductors": "hip-abductors",
    "upper-back": "scapular",   # 斜方肌中下部 · 菱形肌 = SDK 中下斜方
    "lower-back": "erectors",
    "neck": "neck",             # SDK _muscleIds 已有；旧 taxonomy 无，补词条
}
CATEGORY_MAP = {
    "stability": "core",        # SDK core → strength + stability-control
    "balance": "core",
    "assessment": "mobility",   # 两个评估动作（指尖贴墙抬掌根、托马斯测试）按活动度
}
EQUIPMENT_MAP = {
    "resistance-band": "band",
    "mini-band": "band",
    "cable-machine": "cable",
    "ankle-strap": None,        # 绳索/弹力带配件
    "d-handle": None,           # 绳索/弹力带配件
    "pull-up-bar": "pullup-bar",
    "gymnastic-rings": "rings",
    "hip-abduction-machine": "hip-abductor-machine",
    "stability-ball": "swiss-ball",
    "sliders": "slider",
    "yoga-block": "block",
    "yoga-blocks": "block",
    "foam-block": "block",
    "stool": "chair",
    "towel": "towel",           # SDK 环境物（qa_finder），旧 taxonomy 无，补词条
    "doorframe": "doorframe",   # 同上
    "bench": "bench",           # 同上（qa_finder 户外/软器械）
    "barbell": "barbell",       # 无法映射：SDK 无对应旧词，保留原词并补 taxonomy 词条（gym）
}
ACCESSORY_HOSTS = {"cable", "band"}
POSITION_MAP = {
    "plank": "prone",           # 俯撑，着地
    "side-lying": "side_lying",
    "half-kneeling": "kneeling",
}
# position=other 无统一对应，逐个指定
POSITION_OTHER = {
    "abs-B": "support", "abs-C": "support", "lats-C": "support", "triceps-B": "support",
    "triceps-C": "support", "erectors-C": "support", "h-chair-dip": "support",
    "h-dd-shoulder": "prone", "h-pike-pushup": "prone", "h-pike-scapular-elevation": "prone",
    "t-tuck-planche": "prone", "s-pigeon": "prone",
    "t-flare-side-hold": "side_lying",
    "w-wall-sit": "standing",
}
# 旧 taxonomy 没有、但 SDK 认识的词：补词条（不是新词）
TAXONOMY_EXTRA = {
    "muscleGroups": {"neck": {"zh": "颈部"}},
    "equipment": {
        "towel": {"zh": "毛巾", "scenes": ["home", "office", "gym"]},
        "doorframe": {"zh": "门框", "scenes": ["home", "office", "gym"]},
        "bench": {"zh": "训练凳", "scenes": ["gym"]},
        "barbell": {"zh": "杠铃", "scenes": ["gym"]},
    },
}
# 注意事项整句保留；从句子里抽旧禁忌部位词（taxonomy.cautions）填 contraindications。
CAUTION_WORDS = [
    ("膝", ("膝",)),
    ("腰", ("腰",)),
    ("肩", ("肩",)),
    ("手腕", ("腕",)),
    ("颈", ("颈", "脖子")),
    ("髋", ("髋",)),
    ("大腿内侧", ("大腿内侧", "大腿根")),
]
# 句子里提到、但旧词表没有对应部位的词（只记清单，不填）
UNMAPPED_PARTS = ("手肘", "脚踝", "跟腱", "脚后跟", "小腿", "大腿后侧", "大腿前", "手指", "脚背", "头")
# 32 个原 scenes 为空的动作：按器械推场所（SDK 规则：office 只到椅子/墙 + 徒手且不躺地；
# 哑铃/壶铃/弹力带/垫子类 → home、gym；单杠/吊环/双杠/绳索/机器 → gym）
SCENES_ALL = ["home", "office", "gym"]
EQUIPMENT_SCENES = {
    **{e: ["home", "office", "gym"] for e in ("chair", "wall", "towel", "doorframe")},
    **{e: ["home", "gym"] for e in ("mat", "block", "dumbbell", "kettlebell", "band", "slider",
                                     "parallettes", "foam-roller")},
}

SCENES_INFERRED = {
    "h-band-biceps-curl": ["home", "gym"],  # 站姿踩带弹力带弯举；band；standing
    "h-bear-plank": ["home", "gym"],  # 熊式支撑；mat；quadruped
    "h-biceps-self": ["home", "office", "gym"],  # 双手对抗弯举；徒手；standing
    "h-bridge-overhead": ["home", "gym"],  # 臀桥过头伸臂；mat；supine
    "h-chair-elbow-triceps-stretch": ["home", "office", "gym"],  # 扶椅屈肘手臂后侧拉伸；chair；standing
    "h-crossbody": ["home", "office", "gym"],  # 交叉臂肩后侧拉伸；徒手；standing
    "h-db-overhead-shrug": ["home", "gym"],  # 双哑铃过头耸肩；dumbbell；standing
    "h-db-reverse-curl": ["home", "gym"],  # 站姿哑铃反握弯举；dumbbell；standing
    "h-db-zottman-curl": ["home", "gym"],  # 站姿哑铃翻掌弯举；dumbbell；standing
    "h-half-kneeling-quad-stretch": ["home", "gym"],  # 半跪手拉脚大腿前侧拉伸；mat；kneeling
    "h-inner-thigh": ["home", "gym"],  # 侧卧大腿内侧抬腿；mat；side_lying
    "h-kb-swing": ["home", "gym"],  # 单臂壶铃摆荡；kettlebell；standing
    "h-mountain-climber": ["home", "gym"],  # 慢速登山跑；mat；prone
    "h-open-book": ["home", "gym"],  # 侧卧开书式；mat；side_lying
    "h-pike-pushup": ["home", "gym"],  # 派克俯卧撑；mat；prone
    "h-reverse-lunge": ["home", "office", "gym"],  # 后撤步弓步蹲；徒手；standing
    "h-standing-arm-extension-stretch": ["home", "office", "gym"],  # 站姿双臂后抬开肩；徒手；standing
    "h-supine-cactus-chest": ["home", "gym"],  # 仰卧仙人掌开胸；mat；supine
    "h-towel-behind": ["home", "office", "gym"],  # 背后握毛巾抬臂；towel；standing
    "h-towel-pass": ["home", "office", "gym"],  # 毛巾过头转肩；towel；standing
    "h-towel-pulldown": ["home", "office", "gym"],  # 站姿毛巾下拉；towel；standing
    "h-wall-pec": ["home", "office", "gym"],  # 靠墙单臂胸肌拉伸；wall；standing
    "t-flare-side-hold": ["home", "gym"],  # 托马斯侧撑定格；mat；side_lying
    "t-lsit-open-close": ["home", "gym"],  # L撑开合；mat；seated
    "t-lsit-tuck": ["home", "gym"],  # L撑收腿伸腿；mat；seated
    "t-lsit-vsit-circles": ["home", "gym"],  # L 撑到 V 撑画圈；mat；seated
    "t-lsit-wide": ["home", "gym"],  # 宽腿L撑；mat；seated
    "t-seated-straddle-ext": ["home", "gym"],  # 分腿坐收腿伸腿；mat；seated
    "t-seated-straddle-lifts": ["home", "gym"],  # 坐姿分腿双腿抬起；mat；seated
    "t-straddle-hold": ["home", "gym"],  # 分腿支撑；mat；seated
    "t-tuck-planche": ["home", "gym"],  # 团身俄挺；mat；prone
    "t-vsit": ["home", "gym"],  # V撑；mat；seated
}


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def dump(obj) -> bytes:
    return (json.dumps(obj, ensure_ascii=False, indent=1) + "\n").encode("utf-8")


def _mapped(values, table, report_key, report, aid):
    out = []
    for v in values:
        m = table.get(v, v)
        if v in table:
            report["vocabMapped"].setdefault(report_key, {}).setdefault(f"{v}->{m}", []).append(aid)
        if m is not None and m not in out:
            out.append(m)
    return out


def normalize_vocab(act, tax, report):
    """把一个动作的 r2-v1 新词改成 SDK 旧词；注意事项整句保留，抽部位词进 contraindications。"""
    aid = act["id"]
    act["muscleGroups"] = _mapped(act["muscleGroups"], MUSCLE_MAP, "muscleGroups", report, aid)
    # muscles 旧格式是中文肌群名；新格式是 id，映射后用 taxonomy 中文名
    ids = _mapped(act.get("muscles", []), MUSCLE_MAP, "muscles", report, aid)
    act["muscles"] = [tax["muscleGroups"][m]["zh"] if m in tax["muscleGroups"] else m for m in ids]
    if act["category"] in CATEGORY_MAP:
        report["vocabMapped"].setdefault("category", {}).setdefault(
            f"{act['category']}->{CATEGORY_MAP[act['category']]}", []).append(aid)
        act["category"] = CATEGORY_MAP[act["category"]]
    raw_eq = list(act["equipment"])
    act["equipment"] = _mapped(raw_eq, EQUIPMENT_MAP, "equipment", report, aid)
    if any(EQUIPMENT_MAP.get(e, e) is None for e in raw_eq) and not ACCESSORY_HOSTS & set(act["equipment"]):
        raise SystemExit(f"{aid}: 配件 {raw_eq} 没有可并入的主器械")
    if "barbell" in act["equipment"]:
        report["unmapped"].setdefault("equipment:barbell", []).append(aid)
    pos = act["position"]
    if pos == "other":
        if aid not in POSITION_OTHER:
            raise SystemExit(f"{aid}: position=other 没有显式对应")
        new = POSITION_OTHER[aid]
    else:
        new = POSITION_MAP.get(pos, pos)
    if new != pos:
        report["vocabMapped"].setdefault("position", {}).setdefault(f"{pos}->{new}", []).append(aid)
        act["position"] = new
    # 旧格式：中文名用「、」连成一个字符串（SDK 按 String 读）
    act["muscleGroupsZh"] = "、".join(tax["muscleGroups"][m]["zh"] for m in act["muscleGroups"])
    act["equipmentZh"] = "、".join(tax["equipment"][e]["zh"] for e in act["equipment"])
    # 禁忌部位词
    found, unmapped = [], []
    for sentence in act.get("cautions", []):
        for word, keys in CAUTION_WORDS:
            if any(k in sentence for k in keys) and word not in found:
                found.append(word)
        for part in UNMAPPED_PARTS:
            if part in sentence and part not in unmapped:
                unmapped.append(part)
    old = [c for c in act.get("contraindications", []) if c]
    act["contraindications"] = old + [w for w in found if w not in old]
    if not act["contraindications"]:
        report["noContraindication"].append({"id": aid, "cautions": act.get("cautions", []),
                                             "unmappedParts": unmapped})
    elif unmapped:
        report["partialContraindication"].append({"id": aid, "filled": act["contraindications"],
                                                  "unmappedParts": unmapped})


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", required=True)
    ap.add_argument("--verify", required=True)
    ap.add_argument("--taxonomy", required=True)
    ap.add_argument("--legacy-semantic", required=True)
    ap.add_argument("--published-at", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    import datetime
    try:  # SDK 用 DateTime.tryParse 解析，必须是 ISO 8601
        datetime.datetime.fromisoformat(a.published_at)
    except ValueError:
        raise SystemExit(f"--published-at 不是 ISO 8601：{a.published_at}")

    src_bytes = open(a.catalog, "rb").read()
    src = json.loads(src_bytes)
    verify = {(r["id"], r["kind"]): r for r in json.load(open(a.verify))}
    taxonomy = json.load(open(a.taxonomy))
    legacy = {d["id"]: d for d in json.load(open(a.legacy_semantic))["drills"]}

    cat = copy.deepcopy(src)
    report = {
        "source": {"bytes": len(src_bytes), "sha256": sha(src_bytes)},
        "holdToTime": [], "posterDropped": 0, "mediaMismatch": [],
        "missingScenes": [], "scenesInferred": {}, "appsTagsFromLegacy": [], "noAppsTags": [],
        "vocabMapped": {}, "unmapped": {}, "noContraindication": [], "partialContraindication": [],
    }
    tax = copy.deepcopy(taxonomy)
    for dim, extra in TAXONOMY_EXTRA.items():
        tax[dim].update(extra)

    ready, pending, complete, incomplete = [], [], [], []
    media_files = media_bytes = 0
    drills = []
    for act in cat["actions"]:
        aid = act["id"]
        # 1) poster 去掉（SDK 只认 video/cover/thumbnail）
        if act["files"].pop("poster", None) is not None:
            report["posterDropped"] += 1
        # 1b) 词表对齐 + 场所补齐
        normalize_vocab(act, tax, report)
        if not act.get("scenes"):
            if aid not in SCENES_INFERRED:
                raise SystemExit(f"{aid}: scenes 为空且没有推断表条目")
            act["scenes"] = list(SCENES_INFERRED[aid])
            act["scenesSource"] = "inferred-from-equipment-r2-v1-normalize"
            report["scenesInferred"][aid] = {"equipment": act["equipment"], "position": act["position"],
                                              "scenes": act["scenes"]}
        elif aid in SCENES_INFERRED:
            raise SystemExit(f"{aid}: 已有 scenes，不应在推断表里")
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

    used_cautions = {c for x in cat["actions"] for c in x["contraindications"]}
    if used_cautions - set(tax["cautions"]):
        raise SystemExit(f"contraindications 有旧词表外的词：{sorted(used_cautions - set(tax['cautions']))}")
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
