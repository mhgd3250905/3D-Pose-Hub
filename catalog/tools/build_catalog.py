#!/usr/bin/env python3
"""生成 Pose-Hub 统一动作目录 catalog/catalog.json。

只读三个 App 仓库 + 本仓库，合并为一个目录（只收 App 内有可播放视频的动作），
再按 catalog/review/overrides.json 套用人工审阅结果。只用 Python 标准库。

用法（在 Pose-Hub 仓库根目录）：
  python3 catalog/tools/build_catalog.py \
      --smartfit ../Sport-Helper --hiplab ../HipLab --flarelab ../3D-Body \
      --version 0.1.0 [--generated-at 2026-10-20T01:00:00+08:00]

各 App 读取的路径：
  SmartFit  assets/packs/<id>/pack.json（drill-pack@1）
  HipLab    assets/action_kits/*.json（action-kit@1）、assets/hip/hip-content.json、assets/voice/manifest.json
  FlareLab  app/assets/data/drills.json、app/assets/data/drill-media-manifest.json
  Pose-Hub  drill-anim/specs/*.js、media/manifest.json
"""
from __future__ import annotations

import argparse
import datetime as dt
import glob
import hashlib
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = os.path.dirname(HERE)
ROOT = os.path.dirname(CAT)

APP_REPOS = {
    "smartfit": ("智能健身助手 SmartFit", "mhgd3250905/Sport-Helper", "drill-pack@1"),
    "hiplab": ("开胯训练助手 HipLab", "mhgd3250905/HipLab", "action-kit@1"),
    "flarelab": ("托马斯训练助手 FlareLab", "mhgd3250905/3D-Body", "flarelab-drill-media@1"),
}


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def git_head(path):
    try:
        return subprocess.check_output(["git", "-C", path, "rev-parse", "--short=7", "HEAD"], text=True).strip()
    except Exception:
        return "unknown"


def lf_sha(path):
    with open(path, "rb") as f:
        b = f.read().replace(b"\r\n", b"\n")
    return hashlib.sha256(b).hexdigest()


def base_id(spec_id):
    return re.sub(r"-r\d+$", "", spec_id)


def auto_range(dose):
    """默认可调范围：组数 1..默认+1，次数 0.5x..1.5x，时长 0.5x..2x，休息 0..max(60, 2x)。都落在 TrainingPlan v1 硬限内。"""
    r = {"sets": [1, min(6, dose["sets"] + 1)]}
    if dose["mode"] == "reps":
        n = dose["reps"]
        r["reps"] = [max(1, round(n * 0.5)), min(30, max(n + 2, round(n * 1.5)))]
    else:
        s = dose["seconds"]
        r["seconds"] = [max(10, round(s * 0.5)), min(120, s * 2)]
    rest = dose["restSeconds"]
    r["restSeconds"] = [0, min(180, max(60, rest * 2))]
    return r


def clean_dose(d):
    out = {"mode": d["mode"], "sets": int(d["sets"])}
    if d["mode"] == "reps":
        out["reps"] = int(d["reps"])
        if d.get("holdSeconds"):
            out["holdSeconds"] = int(d["holdSeconds"])
    else:
        out["seconds"] = int(d.get("seconds") or d.get("workSeconds"))
    out["restSeconds"] = int(d.get("restSeconds", 20))
    return out


# HipLab 注意部位 → 目录词表（taxonomy.cautions）。只做词表归一，不增删含义。
HIPLAB_CAUTION_ALIAS = {"内收肌根": "大腿内侧", "髋前侧夹痛": "髋"}


def hiplab_dose(h):
    """HipLab action-kit training → 目录 defaultDose。unit=reps → mode=reps（rep_hold 带 holdSeconds）；unit=seconds → mode=time。"""
    t, df = h["training"], h["training"]["defaults"]
    d = {"mode": "reps" if t["unit"] == "reps" else "time", "sets": df["sets"], "restSeconds": df.get("restSeconds", 15)}
    if d["mode"] == "reps":
        d["reps"] = df["reps"]
        if t.get("kind") == "rep_hold" or df.get("holdSeconds"):
            d["holdSeconds"] = df["holdSeconds"]
    else:
        d["seconds"] = df["seconds"]
    return clean_dose(d)


def dose_semantics(d):
    """剂量语义：计次/计时 + 是否每次停留。只比较语义，不比较数值（各 App 默认量本来就不同）。"""
    return (d["mode"], bool(d.get("holdSeconds")))


def dose_text(d, sided):
    per = "每侧" if sided else ""
    if d["mode"] == "reps":
        amt = f"{per}{d['reps']}次" + (f"，每次停{d['holdSeconds']}秒" if d.get("holdSeconds") else "")
    else:
        amt = f"{per}{d['seconds']}秒"
    return f"{d['sets']}×{amt}"


def asset_path(app, path):
    """统一成「相对该 App 仓库根」的路径。FlareLab manifest 记的是 Flutter 工程（app/）内路径，补 app/ 前缀。"""
    if app == "flarelab" and not path.startswith("app/"):
        return "app/" + path
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--smartfit", required=True)
    ap.add_argument("--hiplab", required=True)
    ap.add_argument("--flarelab", required=True)
    ap.add_argument("--version", required=True)
    ap.add_argument("--generated-at")
    ap.add_argument("--out", default=os.path.join(CAT, "catalog.json"))
    a = ap.parse_args()

    tax = load(os.path.join(CAT, "taxonomy.json"))
    ov = load(os.path.join(CAT, "review", "overrides.json"))
    commits = {"smartfit": git_head(a.smartfit), "hiplab": git_head(a.hiplab), "flarelab": git_head(a.flarelab)}

    # ---------- Pose-Hub：发布版本 ----------
    manifest = load(os.path.join(ROOT, "media", "manifest.json"))
    released = {}  # base id -> {versions, spec, poster/video items}
    for ver, rel in manifest["releases"].items():
        if rel.get("status") != "published":
            continue
        for it in rel["items"]:
            e = released.setdefault(it["id"], {"versions": [], "items": []})
            if ver not in e["versions"]:
                e["versions"].append(ver)
            if it.get("storage") == "archive" and it["role"] in ("poster", "video"):
                e["items"].append((ver, it))

    # ---------- SmartFit packs ----------
    sf = {}
    for p in sorted(glob.glob(os.path.join(a.smartfit, "assets/packs/*/pack.json"))):
        d = load(p)
        if d.get("kind") == "exercise" and d.get("media", {}).get("video"):
            sf[d["id"]] = d

    # ---------- HipLab ----------
    hk = {}
    for p in sorted(glob.glob(os.path.join(a.hiplab, "assets/action_kits/*.json"))):
        d = load(p)
        if d.get("schema") == "action-kit@1":
            hk[d["id"]] = d
    hc = {d["id"]: d for d in load(os.path.join(a.hiplab, "assets/hip/hip-content.json"))["drills"]}
    hv = load(os.path.join(a.hiplab, "assets/voice/manifest.json"))
    hv_keys = {lang: set(c) for lang, c in hv.get("clips", {}).items()}

    # ---------- FlareLab ----------
    fd = load(os.path.join(a.flarelab, "app/assets/data/drills.json"))
    fm = load(os.path.join(a.flarelab, "app/assets/data/drill-media-manifest.json"))["actions"]
    groups = fd["groups"]
    fl = {}
    for g, tiers in fd["drills"].items():
        for t, x in tiers.items():
            if x["id"] in fm:
                fl[x["id"]] = x

    ids = sorted(set(sf) | set(hk) | set(fl))
    drills = []
    for i in ids:
        s, h, f = sf.get(i), hk.get(i), fl.get(i)
        apps = [k for k, v in (("flarelab", f), ("hiplab", h), ("smartfit", s)) if v]
        review, doubt_extra = [], []
        if s:
            e = {
                "id": i, "name": dict(s["name"]),
                "category": s["category"], "muscles": list(s["muscles"]), "muscleGroups": list(s["muscleGroups"]),
                "equipment": list(s["equipment"]), "position": s["position"], "unilateral": bool(s["unilateral"]),
                "level": int(s["level"]), "scenes": list(s["scenes"]), "defaultDose": clean_dose(s["defaultDose"]),
                "cues": s.get("cues", {}), "primaryCue": s.get("primaryCue", 0),
                "cautions": list(s.get("cautions", [])), "contraindications": list(s.get("contraindications", [])),
                "alternative": s.get("alternative"),
            }
            intro = next((l["text"]["zh"] for l in s["voice"]["lines"] if l["role"] == "intro"), "")
            purpose = intro.split("，", 1)[-1] if "，" in intro else intro
            e["purpose"] = purpose
        elif f:
            o = ov["flarelab"].get(i)
            if not o:
                print(f"缺 FlareLab 手标：{i}", file=sys.stderr)
                sys.exit(1)
            grp = [f["groupId"]] + [g for g in o["extraGroups"] if g != f["groupId"]]
            e = {
                "id": i, "name": {"zh": f["name"], "en": f.get("nameEn", "")},
                "category": o["category"], "muscles": [tax["muscleGroups"][g]["zh"] for g in grp], "muscleGroups": grp,
                "equipment": o["equipment"], "position": o["position"], "unilateral": o["unilateral"],
                "level": o["level"], "scenes": o["scenes"], "defaultDose": o["defaultDose"],
                "cues": {"zh": list(f.get("cues", []))[:3]}, "primaryCue": 0,
                "cautions": o["cautions"], "contraindications": [], "alternative": o["alternative"],
                "purpose": o["purpose"],
            }
            review.append("FlareLab 动作：标签由人工按 drills.json 文案与成片手标")
        else:
            print(f"HipLab 独有动作未处理：{i}", file=sys.stderr)
            sys.exit(1)

        # 范围：FlareLab 手标有明确范围时合并
        rng = auto_range(e["defaultDose"])
        if f and i in ov["flarelab"]:
            rng.update(ov["flarelab"][i]["doseRange"])
        e["doseRange"] = rng
        e["apps"] = apps

        # fixes
        fx = ov["fixes"].get(i, {})
        for k, v in fx.items():
            if not k.startswith("_"):
                e[k] = v
        if fx:
            review.append("人工更正：" + fx.get("_why", ""))

        # 交叉核对（更正之后仍不一致的才记）
        if h:
            # 注意部位：并入 HipLab 已有标注（词表归一后取并集，只增不减）
            hcaut = [HIPLAB_CAUTION_ALIAS.get(c, c) for c in h["display"].get("cautions", [])]
            unknown = [c for c in hcaut if c not in tax["cautions"]]
            add = [c for c in hcaut if c in tax["cautions"] and c not in e["cautions"]]
            if add:
                e["cautions"] = e["cautions"] + add
                review.append(f"cautions 并入 HipLab 动作包标注：{'、'.join(add)}（原文 {'、'.join(h['display'].get('cautions', []))}）")
            if unknown:
                review.append(f"HipLab 注意部位 {'、'.join(unknown)} 未登记到词表（待审）")
                doubt_extra.append(f"HipLab 注意部位 {'、'.join(unknown)} 未登记到词表，未并入")
            # 剂量语义：目录与 HipLab 可执行动作包必须一致；有裁定（overrides.doses）则按裁定，否则标待审
            hd = hiplab_dose(h)
            dv = ov.get("doses", {}).get(i)
            if dv:
                if dv["source"] != "hiplab":
                    raise SystemExit(f"{i}: doses.source 只支持 hiplab")
                before = dose_text(e["defaultDose"], e["unilateral"])
                e["defaultDose"] = hd
                e["doseRange"] = auto_range(hd)
                review.append(f"剂量按 HipLab 动作包裁定：{before} → {dose_text(hd, e['unilateral'])}。{dv.get('_why', '')}")
            if dose_semantics(e["defaultDose"]) != dose_semantics(hd):
                doubt_extra.append(
                    f"剂量单位与 HipLab 动作包冲突（待审）：目录 {dose_text(e['defaultDose'], e['unilateral'])}，"
                    f"HipLab {h['training']['kind']} {dose_text(hd, e['unilateral'])}")
        if h and bool(h["display"].get("sided")) != e["unilateral"]:
            review.append(f"unilateral={e['unilateral']} 与 HipLab sided={h['display'].get('sided')} 不一致")
        if f:
            pres = f.get("prescription", "")
            if ("每侧" in pres) != e["unilateral"]:
                review.append(f"unilateral={e['unilateral']} 与 FlareLab 处方不一致：{pres}")
        if not e["muscleGroups"]:
            review.append("muscleGroups 为空")
        if i in ov["purpose"]:
            e["purpose"] = ov["purpose"][i]

        tags = []
        if f:
            tags += ["thomas", f"flarelab:{f['groupId']}:{f['tier']}"]
            e["flarelab"] = {"group": f["groupId"], "tier": f["tier"], "prescription": f.get("prescription", "")}
        if i.startswith("t-"):
            tags.append("thomas")
        if h:
            tags.append("hip")
            hcd = hc.get(i, {})
            tags += [f"hip:{x}" for x in hcd.get("directions", [])]
        if i.startswith("o-") or "office" in e["scenes"]:
            tags.append("office")
        e["tags"] = sorted(set(tags))

        # ---------- assets ----------
        spec_path = None
        if h:
            spec_path = h["media"]["poseHub"]["spec"]
        elif s and s.get("credits", {}).get("spec"):
            spec_path = s["credits"]["spec"]
        else:
            spec_path = f"drill-anim/specs/{i}.js"
        full = os.path.join(ROOT, spec_path)
        spec = {"status": "ok" if os.path.exists(full) else "missing", "path": spec_path}
        if os.path.exists(full):
            spec["sha256"] = lf_sha(full)
            sid = os.path.basename(spec_path)[:-3]
            spec["revisionOf"] = base_id(sid) if sid != base_id(sid) else None
            src = open(full, encoding="utf-8").read()
            m = re.search(r"modelProfile\s*:\s*['\"]([\w.-]+)['\"]", src)
            spec["modelProfile"] = m.group(1) if m else None

        rel = released.get(i, {"versions": [], "items": []})
        covers, videos = [], []
        if s:
            md = s["media"]
            covers.append({"app": "smartfit", "path": f"assets/packs/{i}/{md['cover']}", "width": 540, "height": 540, "coverSeconds": md.get("coverSeconds", 0)})
            v = {"app": "smartfit", "path": f"assets/packs/{i}/{md['video']}", "width": md.get("width", 720), "height": md.get("height", 720), "loopSeconds": md.get("loopSeconds")}
            if md.get("repSeconds"):
                v["repSeconds"] = md["repSeconds"]
            if md.get("showsSide"):
                v["showsSide"] = md["showsSide"]
            videos.append(v)
        if h:
            disp, vid = h["display"], h["media"]["video"]
            for var in ("dark", "light"):
                if disp.get("poster", {}).get(var):
                    covers.append({"app": "hiplab", "variant": var, "path": disp["poster"][var]})
                if vid.get(var):
                    vv = {"app": "hiplab", "variant": var, "path": vid[var]["asset"], "loopSeconds": vid[var].get("loopSeconds"), "release": h["media"]["poseHub"].get("version")}
                    if disp.get("firstSide"):
                        vv["showsSide"] = disp["firstSide"]
                    videos.append(vv)
        if f:
            m = fm[i]
            covers.append({"app": "flarelab", "path": asset_path("flarelab", m["poster_asset"]), "width": m.get("poster_width"), "height": m.get("poster_height"), "sha256": m.get("poster_sha256")})
            videos.append({"app": "flarelab", "path": asset_path("flarelab", m["video_asset"]), "width": m.get("width"), "height": m.get("height"), "loopSeconds": m.get("duration_seconds"), "sha256": m.get("sha256"), "bytes": m.get("bytes")})
        for ver, it in rel["items"]:
            src = {"app": "pose-hub", "release": ver, "variant": it["variant"], "path": it["file"], "width": it.get("width"), "height": it.get("height"), "sha256": it["sha256"], "bytes": it["bytes"]}
            (covers if it["role"] == "poster" else videos).append(src)
        clean = lambda lst: [{k: v for k, v in x.items() if v is not None} for x in lst]

        langs, audio, lines = [], [], []
        if s:
            lines = s["voice"]["lines"]
            langs += s["voice"].get("languages", ["zh"])
            audio.append({"app": "smartfit", "pathPattern": f"assets/packs/{i}/voice/{{lang}}/{{line}}.m4a", "languages": s["voice"].get("languages", ["zh"])})
        if h:
            hl = [lang for lang, ks in hv_keys.items() if f"drill.{i}" in ks]
            langs += hl
            keys = [k for k in (f"drill.{i}", f"point.{i}") if any(k in ks for ks in hv_keys.values())]
            audio.append({"app": "hiplab", "pathPattern": "assets/voice/{lang}/{line}.m4a", "languages": hl, "keys": keys})
        langs = sorted(set(langs))
        voice = {"status": "ok" if "zh" in langs else "missing", "languages": langs}
        if lines:
            voice["lines"] = lines
        if audio:
            voice["audio"] = audio

        e["assets"] = {
            "spec": spec,
            "releases": sorted(rel["versions"]),
            "cover": {"status": "ok" if covers else "missing", "sources": clean(covers)},
            "video": {"status": "ok" if videos else "missing", "sources": clean(videos)},
            "voice": voice,
            "drillPack": {"app": "smartfit", "path": f"assets/packs/{i}/pack.json", "version": s["version"]} if s else None,
        }
        missing = []
        for k in ("cover", "video"):
            if not e["assets"][k]["sources"]:
                missing.append(k)
        if spec["status"] != "ok":
            missing.append("spec")
        if "zh" not in langs:
            missing.append("voice.zh")
        if "en" not in langs:
            missing.append("voice.en")
        if not rel["versions"]:
            missing.append("release")
        e["completeness"] = {"complete": not [m for m in missing if m != "voice.en"], "missing": missing}
        doubt = [d["note"] for d in ov["doubts"] if d["id"] == i] + doubt_extra
        e["review"] = {"status": "doubt" if doubt else ("reviewed" if review else "auto"), "notes": review + doubt}

        order = ["id", "name", "purpose", "category", "muscles", "muscleGroups", "equipment", "position", "unilateral", "level",
                 "scenes", "defaultDose", "doseRange", "cues", "primaryCue", "cautions", "contraindications", "alternative",
                 "apps", "tags", "flarelab", "assets", "completeness", "review"]
        drills.append({k: e[k] for k in order if k in e})

    # 替代动作必须在目录内
    known = {d["id"] for d in drills}
    for d in drills:
        if d["alternative"] and d["alternative"] not in known:
            d["review"]["notes"].append(f"替代动作 {d['alternative']} 不在目录，已清空")
            d["alternative"] = None

    now = a.generated_at or dt.datetime.now(dt.timezone(dt.timedelta(hours=8))).isoformat(timespec="seconds")
    out = {
        "format": "pose-hub-catalog", "formatVersion": 1, "version": a.version, "generatedAt": now,
        "source": {"repo": "mhgd3250905/3D-Pose-Hub", "commit": git_head(ROOT),
                   "inputs": [{"repo": APP_REPOS[k][1], "commit": commits[k]} for k in ("smartfit", "hiplab", "flarelab")]},
        "taxonomy": {k: v for k, v in tax.items()},
        "apps": {k: {"name": v[0], "repo": v[1], "commit": commits[k], "mediaFormat": v[2]} for k, v in APP_REPOS.items()},
        "drills": drills,
    }
    with open(a.out, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")
    print(f"写入 {a.out}：{len(drills)} 个动作")


if __name__ == "__main__":
    main()
