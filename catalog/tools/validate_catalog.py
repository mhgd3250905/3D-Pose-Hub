#!/usr/bin/env python3
"""校验 catalog/catalog.json。

1. JSON Schema（catalog/catalog.schema.json）：装了 jsonschema 就跑，没装就跳过并提示；
2. 语义规则（只用标准库，必跑）：
   - id 唯一；枚举值都在 taxonomy 里登记；alternative 在目录内且不指向自己；
   - defaultDose 满足 TrainingPlan v1 硬限（组 1–6、次 1–30、秒 10–120、休息 0–180），并落在 doseRange 内；
   - doseRange 与 mode 对应（reps ↔ reps 范围，time ↔ seconds 范围），下限 ≤ 上限；
   - 办公室场景的动作不能是地面体位；
   - completeness.missing 与 assets 实际情况一致；
   - holdSeconds 只能出现在 mode=reps；
   - --check-files：spec 路径在本仓库存在且 sha256（LF 规范化）一致；spec 场景里建了的器械道具（椅子、弹力带、哑铃等）
     必须出现在 equipment（防止按器械筛选误判可做）；
   - --app-root <app>=<仓库路径>（可多次）：该 App 的 assets 封面/视频路径必须按「相对仓库根」解析到真实文件，
     有 sha256 的逐个比对；给了 hiplab 根时再核对跨来源一致性：剂量语义（计次/计时、rep_hold 停留）与
     action-kit training 一致、注意部位（词表归一后）不少于动作包，未裁定的冲突必须在 review.status=doubt 里写明。
用法：python3 catalog/tools/validate_catalog.py [--catalog catalog/catalog.json] [--check-files]
      [--app-root smartfit=../Sport-Helper --app-root hiplab=../HipLab --app-root flarelab=../3D-Body]
退出码：0 通过，1 有错误。
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = os.path.dirname(HERE)
ROOT = os.path.dirname(CAT)

LIMITS = {"sets": (1, 6), "reps": (1, 30), "seconds": (10, 120), "restSeconds": (0, 180)}
# spec props 的 type → equipment 枚举（墙面多为背景/固定点，不强制）
PROP_EQUIP = {"chair": "chair", "bench": "chair", "band": "band", "dumbbell": "dumbbell", "block": "block",
              "sliders": "slider", "foamRoller": "foam-roller", "swissBall": "swiss-ball", "pullupBar": "pullup-bar",
              "kettlebell": "kettlebell"}
# 道具只是代用品、不算器械的个案（spec 注释为证）
PROP_EXEMPT = {("rotator-cuff-B", "foamRoller"): "foamRoller 模型代表夹在腋下的卷毛巾"}
HIPLAB_CAUTION_ALIAS = {"内收肌根": "大腿内侧", "髋前侧夹痛": "髋"}  # 与 build_catalog.py 一致


def spec_props(src):
    m = re.search(r"props\s*:\s*\[(.*?)\n\s*\]", src, re.S)
    return set(re.findall(r"type\s*:\s*'([\w-]+)'", m.group(1))) if m else set()


def lf_sha(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read().replace(b"\r\n", b"\n")).hexdigest()


def semantic(cat, check_files=False):
    errs = []
    tax = cat["taxonomy"]
    seen = set()
    ids = {d["id"] for d in cat["drills"]}
    for d in cat["drills"]:
        i = d["id"]
        E = lambda m: errs.append(f"{i}: {m}")
        if i in seen:
            E("id 重复")
        seen.add(i)
        if d["category"] not in tax["categories"]:
            E(f"category {d['category']} 未登记")
        for g in d["muscleGroups"]:
            if g not in tax["muscleGroups"]:
                E(f"muscleGroup {g} 未登记")
        if not d["muscleGroups"]:
            E("muscleGroups 为空")
        for q in d["equipment"]:
            if q not in tax["equipment"]:
                E(f"equipment {q} 未登记")
        if d["position"] not in tax["positions"]:
            E(f"position {d['position']} 未登记")
        for s in d["scenes"]:
            if s not in tax["scenes"]:
                E(f"scene {s} 未登记")
        for c in d["cautions"]:
            if c not in tax["cautions"]:
                E(f"caution {c} 未登记")
        if "office" in d["scenes"] and tax["positions"].get(d["position"], {}).get("floor"):
            E("办公室场景不能是地面体位")
        alt = d.get("alternative")
        if alt is not None and (alt not in ids or alt == i):
            E(f"alternative {alt} 无效")
        dose, rng = d["defaultDose"], d["doseRange"]
        amount = "reps" if dose["mode"] == "reps" else "seconds"
        if amount not in dose:
            E(f"defaultDose 缺 {amount}")
        if dose.get("holdSeconds") is not None and dose["mode"] != "reps":
            E("holdSeconds 只能用于 mode=reps")
        if amount not in rng:
            E(f"doseRange 缺 {amount}")
        for k in ("sets", amount, "restSeconds"):
            lo, hi = LIMITS[k]
            v = dose.get(k)
            if v is None or not (lo <= v <= hi):
                E(f"defaultDose.{k}={v} 超出 {lo}–{hi}")
            r = rng.get(k)
            if r:
                if r[0] > r[1] or r[0] < lo or r[1] > hi:
                    E(f"doseRange.{k}={r} 非法")
                elif v is not None and not (r[0] <= v <= r[1]):
                    E(f"defaultDose.{k}={v} 不在 doseRange {r} 内")
        if not d["apps"]:
            E("apps 为空")
        for a in d["apps"]:
            if a not in cat["apps"]:
                E(f"app {a} 未登记")
        A = d["assets"]
        missing = set(d["completeness"]["missing"])
        for k in ("cover", "video"):
            has = bool(A[k]["sources"])
            if has != (A[k]["status"] != "missing"):
                E(f"assets.{k}.status 与 sources 不符")
            if has == (k in missing):
                E(f"completeness 对 {k} 记录不符")
        if ("zh" in A["voice"]["languages"]) == ("voice.zh" in missing):
            E("completeness 对 voice.zh 记录不符")
        if bool(A.get("releases")) == ("release" in missing):
            E("completeness 对 release 记录不符")
        complete = not (missing - {"voice.en"})
        if complete != d["completeness"]["complete"]:
            E("completeness.complete 计算不符")
        if check_files and A["spec"].get("path"):
            p = os.path.join(ROOT, A["spec"]["path"])
            if not os.path.exists(p):
                E(f"spec 不存在：{A['spec']['path']}")
            else:
                if A["spec"].get("sha256") and lf_sha(p) != A["spec"]["sha256"]:
                    E(f"spec sha256 不符：{A['spec']['path']}")
                need = {PROP_EQUIP[t] for t in spec_props(open(p, encoding="utf-8").read())
                        if t in PROP_EQUIP and (i, t) not in PROP_EXEMPT}
                lack = sorted(need - set(d["equipment"]))
                if lack:
                    E(f"spec 场景用到 {lack}，equipment 缺")
    return errs


def external(cat, roots):
    """外部 App 仓库：素材路径可解析 + sha256；HipLab 跨来源剂量/注意部位一致性。"""
    errs = []
    sha_cache = {}
    n = 0
    for d in cat["drills"]:
        for k in ("cover", "video"):
            for src in d["assets"][k]["sources"]:
                root = roots.get(src["app"])
                if not root:
                    continue
                n += 1
                p = os.path.join(root, src["path"])
                if not os.path.isfile(p):
                    errs.append(f"{d['id']}: {src['app']} {k} 路径解析不到：{src['path']}")
                elif src.get("sha256"):
                    if p not in sha_cache:
                        sha_cache[p] = hashlib.sha256(open(p, "rb").read()).hexdigest()
                    if sha_cache[p] != src["sha256"]:
                        errs.append(f"{d['id']}: {src['app']} {k} sha256 不符：{src['path']}")
    print(f"外部素材路径：检查 {n} 个")
    if "hiplab" in roots:
        by = {d["id"]: d for d in cat["drills"]}
        for p in sorted(glob.glob(os.path.join(roots["hiplab"], "assets/action_kits/*.json"))):
            h = json.load(open(p, encoding="utf-8"))
            if h.get("schema") != "action-kit@1":
                continue
            d = by.get(h["id"])
            if not d:
                errs.append(f"{h['id']}: HipLab 动作不在目录")
                continue
            t, dose = h["training"], d["defaultDose"]
            hm = "reps" if t["unit"] == "reps" else "time"
            hold = bool(t["defaults"].get("holdSeconds")) or t.get("kind") == "rep_hold"
            notes = " ".join(d["review"]["notes"])
            if (dose["mode"], bool(dose.get("holdSeconds"))) != (hm, hold):
                if not (d["review"]["status"] == "doubt" and "剂量单位与 HipLab" in notes):
                    errs.append(f"{h['id']}: 剂量语义与 HipLab 动作包冲突且未标待审（目录 {dose['mode']}，HipLab {t['kind']}/{t['unit']}）")
            want = {HIPLAB_CAUTION_ALIAS.get(c, c) for c in h["display"].get("cautions", [])}
            lack = sorted(want - set(d["cautions"]))
            if lack and not (d["review"]["status"] == "doubt" and "注意部位" in notes):
                errs.append(f"{h['id']}: 遗漏 HipLab 注意部位 {lack} 且未标待审")
    return errs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default=os.path.join(CAT, "catalog.json"))
    ap.add_argument("--schema", default=os.path.join(CAT, "catalog.schema.json"))
    ap.add_argument("--check-files", action="store_true")
    ap.add_argument("--app-root", action="append", default=[], metavar="APP=PATH")
    a = ap.parse_args()
    cat = json.load(open(a.catalog, encoding="utf-8"))
    errs = []
    try:
        import jsonschema  # type: ignore
        schema = json.load(open(a.schema, encoding="utf-8"))
        v = jsonschema.Draft202012Validator(schema)
        for e in sorted(v.iter_errors(cat), key=lambda e: list(e.path)):
            errs.append("schema " + "/".join(map(str, e.path)) + ": " + e.message)
    except ImportError:
        print("（未安装 jsonschema，跳过 Schema 校验；pip install jsonschema 后可启用）")
    if cat.get("format") != "pose-hub-catalog" or cat.get("formatVersion") != 1:
        errs.append("format/formatVersion 不对")
    errs += semantic(cat, a.check_files)
    roots = dict(x.split("=", 1) for x in a.app_root)
    if roots:
        errs += external(cat, roots)
    for e in errs:
        print("✗", e)
    n = len(cat["drills"])
    print(f"{'通过' if not errs else '失败'}：{n} 个动作，{len(errs)} 处问题")
    sys.exit(1 if errs else 0)


if __name__ == "__main__":
    main()
