#!/usr/bin/env python3
"""r2-v4 → r2-v5：膝角修复 r1（codex/knee-fix-r1）的动作换新媒体 + 3 个动作文案对齐动画 + 1 个动作语音重产，其余不变。

只读输入：release/app-pack-r2-v4/catalog.json（SHA 固定，见 SRC_CATALOG_SHA）、tools/app-pack/r2-v5-media-sources.tsv
（换新媒体的动作 → 本机渲染批次）、当前检出的生产配方（spec 路径与 specSha256Lf）、catalog/production/v3-text/<id>.json
（改过的文案）、release/app-pack-r2-v5/voice-knee-r1/packages/<id>/（tools/app-pack/voice_fill_r1.py 产物，technical-passed）。

SDK 单前缀规则：媒体仍放 pack/r2-v1/ 前缀，新媒体用新的版本段 media/<id>/r2-v5/<id>.*；改过的语音用
voice/<id>/r2-v5/<lang>/<clip>.m4a（线上 voice/<id>/<lang>/ 已有旧文件，换路径避免覆盖）；全部是新对象键，只追加。
目录放 pack/r2-v5/。

  # 1) 草稿（沙箱，没有新媒体）：只写 catalog.draft.json + plan.json + report.json
  python3 tools/app-pack/build_r2_v5.py --out release/app-pack-r2-v5 --source-commit <40 位> --draft
  # 2) 定稿（本机导出完新媒体之后）：读 --media-root 下 media/<id>/r2-v5/ 的真实文件，算 bytes/SHA/宽高
  python3 tools/app-pack/build_r2_v5.py --out F:/PoseHub-v3/app-pack/r2-v5 --source-commit <40 位> \
      --media-root F:/PoseHub-v3/app-pack/r2-v5 --published-at "<ISO 8601>"
定稿写 catalog.json、catalog/catalog.json、channels/{dev,beta,stable}.json（不上传）、report.json、media-receipts.json、plan.json。
"""
import argparse, hashlib, json, os, shutil, subprocess

PACK, PREV, MEDIA_PACK = "r2-v5", "r2-v4", "r2-v1"
CAT_BASE = f"https://media.uuugk.win/pack/{PACK}/"
MEDIA_BASE = f"https://media.uuugk.win/pack/{MEDIA_PACK}/"
SRC = f"release/app-pack-{PREV}"
SRC_CATALOG_SHA = "d669191373383ed9e7568e89dd169db85337b8f5385f0bcc30b478ebc9775690"
SOURCES = "tools/app-pack/r2-v5-media-sources.tsv"
VOICE_ROOT = f"release/app-pack-{PACK}/voice-knee-r1"
BRANCH = "codex/knee-fix-r1"
KINDS = {"video": "rgb-alpha.mp4", "cover": "cover.alpha.webp", "thumbnail": "thumbnail.alpha.webp"}
EXTRA = {"poster": "poster.alpha.webp"}
CLIPS = ("name", "primaryCue", "phase.start", "phase.peak", "phase.end"); LANGS = ("zh", "en")
# 文案对齐动画（只改 v3-text 的这几句中英；目录里的 cues / cuesEn / poseHubText / drills 同句一起换）
TEXT_EDITS = {
    "h-band-pallof": [("侧对固定点站直，膝盖微弯。", "侧对固定点站直，膝盖放松别锁死。"),
                      ("Stand tall side-on to the anchor with soft knees.", "Stand tall side-on to the anchor, knees relaxed, not locked.")],
    "h-band-shoulder-ir": [("侧对固定点站直，膝盖微弯。", "侧对固定点站直，膝盖放松别锁死。"),
                           ("Stand tall side-on to the anchor with soft knees.", "Stand tall side-on to the anchor, knees relaxed, not locked.")],
    "h-band-straight-leg-raise": [("膝盖微弯不动，腿往前抬", "膝盖伸直不动，腿往前抬"),
                                  ("Keep your knee slightly bent and lift the leg forward", "Keep your knee straight and lift the leg forward")],
}

def sha(b): return hashlib.sha256(b).hexdigest()
def sha_lf(p): return sha(open(p, "rb").read().replace(b"\r\n", b"\n"))
def dump(o): return (json.dumps(o, ensure_ascii=False, indent=1) + "\n").encode()

def recipe_path(i):
    a = f"catalog/production/remaining219-r1/recipes/{i}.json"
    if os.path.exists(a): return a
    g = "catalog/production/remaining32-r4/groups"
    for d in sorted(os.listdir(g)):
        p = f"{g}/{d}/{i}.json"
        if os.path.exists(p): return p
    raise SystemExit(f"{i}: recipe not found")

def probe(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height,codec_name,pix_fmt", "-of", "json", path])
    return json.loads(out)["streams"][0]

def replace_strings(o, old, new, hits):
    if isinstance(o, dict): return {k: replace_strings(v, old, new, hits) for k, v in o.items()}
    if isinstance(o, list): return [replace_strings(v, old, new, hits) for v in o]
    if isinstance(o, str) and old in o: hits[0] += 1; return o.replace(old, new)
    return o

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True); ap.add_argument("--source-commit", required=True)
    ap.add_argument("--media-root"); ap.add_argument("--published-at"); ap.add_argument("--draft", action="store_true")
    a = ap.parse_args()
    if not a.draft and not (a.media_root and a.published_at): raise SystemExit("定稿需要 --media-root 和 --published-at")
    if len(a.source_commit) != 40: raise SystemExit("--source-commit 要 40 位完整提交号")
    raw = open(f"{SRC}/catalog.json", "rb").read()
    if sha(raw) != SRC_CATALOG_SHA: raise SystemExit("r2-v4 catalog.json SHA 不符")
    cat = json.loads(raw); sem = json.load(open(f"{SRC}/catalog/catalog.json", encoding="utf-8"))
    md = cat["mediaDistribution"]
    src = {}
    for line in open(SOURCES, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"): continue
        i, batch, commit, note = (line.split("\t") + [""])[:4]
        src[i] = {"batch": batch, "commit": commit, "note": note}
    acts = {x["id"]: x for x in cat["actions"]}
    problems, receipts, plan = [], [], []
    if sorted(set(src) - set(acts)): problems.append(f"不在 r2-v4 的动作: {sorted(set(src) - set(acts))}")
    for act in cat["actions"]: act["packRevision"] = PACK
    # 1) 新媒体
    for i, s in sorted(src.items()):
        act = acts.get(i)
        if not act: continue
        rp = recipe_path(i); rec = json.load(open(rp, encoding="utf-8")); spec = rec["spec"]
        if sha_lf(spec) != rec["specSha256Lf"]: problems.append(f"{i}: specSha256Lf 与文件不符")
        if not rec.get("kneeFix"): problems.append(f"{i}: 配方没有 kneeFix（不是膝角修复动作）")
        rsha = sha(open(rp, "rb").read())
        act["source"] = {"branch": BRANCH, "commit": a.source_commit, "renderCommit": s["commit"],
                         "spec": {"path": spec, "sha256": rec["specSha256Lf"]}, "mediaSet": s["batch"], "model": act["source"]["model"]}
        act["sourceRevision"] = os.path.basename(spec)[:-3]; act["mediaRevision"] = PACK; act["revision"] = f"{i}-{PACK}"
        act["repairReason"] = s["note"] or "knee fix r1：站立髋高按 v3 腿长重算，站直/微屈膝角对齐标准"
        act["recipe"] = {"path": rp, "sha256": rsha, "fingerprint": "sha256:" + rsha}
        if isinstance(act.get("qa"), dict) and isinstance(act["qa"].get("report"), dict):
            act["qa"]["report"]["path"] = f"qa/{i}/{PACK}/export-check.json"
        for ev in act.get("trainingSemantics", {}).get("evidence", []):
            if ev.get("path") == rp: ev["sha256"] = rsha
        cat["latestOverrides"][i] = act["sourceRevision"]
        for kind, suffix in {**KINDS, **EXTRA}.items():
            path = f"media/{i}/{PACK}/{i}.{suffix}"; key = f"pack/{MEDIA_PACK}/{path}"
            ent = {"id": i, "kind": kind, "path": path, "objectKey": key, "inCatalog": kind in KINDS, "batch": s["batch"]}
            fp = os.path.join(a.media_root, path) if a.media_root else None
            if fp and os.path.exists(fp):
                b = open(fp, "rb").read(); ent.update({"source": fp, "bytes": len(b), "sha256": sha(b),
                                                       "contentType": "video/mp4" if suffix.endswith("mp4") else "image/webp"})
            plan.append(ent)
            if kind not in KINDS:
                if fp and os.path.exists(fp): receipts.append({k: ent[k] for k in ("id", "kind", "path", "objectKey", "bytes", "sha256", "inCatalog")})
                elif a.media_root: problems.append(f"缺文件 {path}")
                continue
            f = dict(act["files"][kind]); f.update({"path": path, "assetName": f"{i}.{suffix}", "downloadUrl": MEDIA_BASE + path})
            if a.media_root:
                if not os.path.exists(fp): problems.append(f"缺文件 {path}"); continue
                pr = probe(fp); f.update({"bytes": ent["bytes"], "sha256": ent["sha256"], "width": int(pr["width"]), "height": int(pr["height"]), "status": "ready"})
                if kind == "video": f.update({"codec": pr["codec_name"], "pixelFormat": pr["pix_fmt"]})
                old = act["files"][kind]
                if (f["width"], f["height"]) != (old["width"], old["height"]): problems.append(f"{path}: 尺寸 {f['width']}x{f['height']} ≠ 旧 {old['width']}x{old['height']}")
                if kind == "video" and (f["codec"], f["pixelFormat"]) != (old["codec"], old["pixelFormat"]): problems.append(f"{path}: 编码 ≠ 旧版")
                receipts.append({k: ent[k] for k in ("id", "kind", "path", "objectKey", "bytes", "sha256", "inCatalog")})
            else:
                f.update({"bytes": None, "sha256": None, "status": "pending-export"})
            act["files"][kind] = f
    # 2) 文案
    drills = {d.get("id"): d for d in sem.get("drills", [])}
    for i, edits in TEXT_EDITS.items():
        for old, new in edits:
            h = [0]; acts[i].update(replace_strings({k: v for k, v in acts[i].items() if k not in ("files", "voice")}, old, new, h))
            if not h[0]: problems.append(f"{i}: 目录里找不到原句「{old}」")
            if i in drills: drills[i].update(replace_strings(dict(drills[i]), old, new, [0]))
        t = json.load(open(f"catalog/production/v3-text/{i}.json", encoding="utf-8"))
        js = json.dumps(t, ensure_ascii=False)
        for old, new in edits:
            if new not in js or old in js: problems.append(f"{i}: v3-text 与 TEXT_EDITS 不一致")
    # 3) 语音（改过 primaryCue 的动作）
    vdirs = sorted(os.listdir(f"{VOICE_ROOT}/packages")) if os.path.isdir(f"{VOICE_ROOT}/packages") else []
    for i in vdirs:
        pdir = f"{VOICE_ROOT}/packages/{i}"; mb = open(f"{pdir}/voice-manifest.json", "rb").read(); m = json.loads(mb)
        if m.get("status") != "technical-passed" or m["summary"]["auditFailed"]: problems.append(f"{i}: 语音 {m.get('status')}"); continue
        files = []
        for lang in LANGS:
            for clip in CLIPS:
                line = m["lines"][lang][clip]; fp = f"{pdir}/voice/{lang}/{clip}.m4a"; b = open(fp, "rb").read()
                if sha(b) != line["ref"]["sha256"]: problems.append(f"{fp}: 与 manifest 不符")
                rel = f"voice/{i}/{PACK}/{lang}/{clip}.m4a"
                files.append({"language": lang, "clipId": clip, "role": line["role"], "path": rel, "sourcePath": fp, "bytes": len(b),
                              "sha256": sha(b), "durationSeconds": line["ref"]["durationSeconds"], "assetName": f"{clip}.m4a",
                              "downloadUrl": md["baseUrl"] + rel, "contentType": "audio/mp4"})
                receipts.append({"id": i, "kind": "voice", "language": lang, "clipId": clip, "path": rel, "objectKey": md["objectKeyPrefix"] + rel,
                                 "bytes": len(b), "sha256": sha(b), "text": line["text"]})
                plan.append({"id": i, "kind": "voice", "path": rel, "objectKey": md["objectKeyPrefix"] + rel, "source": fp,
                             "contentType": "audio/mp4", "bytes": len(b), "sha256": sha(b), "inCatalog": True})
        acts[i]["voice"] = {"status": "ready", "sourceBatch": "2026-11-06_knee-fix-r1", "revision": PACK,
                            "sourceManifest": {"path": f"{pdir}/voice-manifest.json", "sha256": sha(mb), "status": m["status"]},
                            "manualListening": "pending", "files": files}
    # 4) 总数与 SDK 规则
    seen, n, tot = set(), 0, 0
    for act in cat["actions"]:
        for f in list(act["files"].values()) + (act.get("voice") or {}).get("files", []):
            if f["path"] in seen: problems.append(f"重复路径 {f['path']}")
            seen.add(f["path"])
            if f["downloadUrl"] != md["baseUrl"] + f["path"]: problems.append(f"downloadUrl 不符 {f['path']}")
        for f in act["files"].values(): n += 1; tot += f["bytes"] or 0
    vfiles = [f for x in cat["actions"] for f in (x.get("voice") or {}).get("files", [])]
    md.update({"mediaFiles": n, "mediaBytes": tot, "voiceFiles": len(vfiles), "voiceBytes": sum(f["bytes"] for f in vfiles),
               "pendingVoiceIds": sorted(x["id"] for x in cat["actions"] if (x.get("voice") or {}).get("status") != "ready"),
               "version": f"posehub-app-pack-{PACK}",
               "note": f"{PACK}：媒体仍在 pack/{MEDIA_PACK}/ 前缀；{len(src)} 个膝角修复动作用 media/<id>/{PACK}/，"
                       f"{len(vdirs)} 个动作语音用 voice/<id>/{PACK}/，其余沿用 {PREV} 引用；只追加"})
    batches = {}
    for i, s in src.items(): batches.setdefault((s["batch"], s["commit"]), []).append(i)
    cat["sourceRuns"] = cat["sourceRuns"] + [{"batch": b, "commit": c, "selectedActions": len(v), "replaces": f"{PREV} media (knee fix r1)"} for (b, c), v in sorted(batches.items())]
    cat["pack"], cat["id"], cat["sourceCommit"], cat["previousPack"] = PACK, f"app-pack-{PACK}", a.source_commit, PREV
    sem["source"]["pack"], sem["source"]["previousPack"] = PACK, PREV
    if a.published_at: sem["generatedAt"] = a.published_at
    sem_bytes = dump(sem); cat["semanticCatalog"].update({"bytes": len(sem_bytes), "sha256": sha(sem_bytes)})
    os.makedirs(os.path.join(a.out, "catalog"), exist_ok=True)
    report = {"pack": PACK, "from": PREV, "mediaPrefix": f"pack/{MEDIA_PACK}/", "catalogPrefix": f"pack/{PACK}/", "sourceCommit": a.source_commit,
              "newMediaActions": len(src), "newMediaActionIds": sorted(src), "reusedMediaActions": len(acts) - len(src),
              "textEditedActionIds": sorted(TEXT_EDITS), "voiceRegeneratedActionIds": vdirs, "problems": problems,
              "channelsNotUploaded": ["pack/channels/dev.json", "pack/channels/beta.json", "pack/channels/stable.json"]}
    if a.draft:
        cb = dump(cat); open(os.path.join(a.out, "catalog.draft.json"), "wb").write(cb)
        open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
        open(os.path.join(a.out, "plan.json"), "wb").write(dump(plan))
        report.update({"draft": True, "catalogDraft": {"bytes": len(cb), "sha256": sha(cb)}})
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print(json.dumps({k: report[k] for k in ("newMediaActions", "reusedMediaActions", "textEditedActionIds", "voiceRegeneratedActionIds", "problems")}, ensure_ascii=False)); return
    if problems: print("\n".join(problems)); raise SystemExit("有问题，未写目录")
    cb = dump(cat)
    open(os.path.join(a.out, "catalog.json"), "wb").write(cb); open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
    os.makedirs(os.path.join(a.out, "channels"), exist_ok=True)
    old_ptr = json.load(open(f"{SRC}/channels/dev.json"))
    ptr = {"schema": 1, "pack": PACK, "catalog": CAT_BASE + "catalog.json", "catalog_sha256": sha(cb), "catalog_bytes": len(cb),
           "min_sdk": old_ptr["min_sdk"], "published_at": a.published_at}
    for ch in ("dev", "beta", "stable"): open(os.path.join(a.out, "channels", f"{ch}.json"), "wb").write(dump(ptr))
    # 语音文件复制到 out 下（与对象键同相对路径），上传只看 out 目录
    for p in plan:
        if p["kind"] == "voice":
            dst = os.path.join(a.out, p["path"]); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(p["source"], dst); p["source"] = dst
    rb = dump(receipts); open(os.path.join(a.out, "media-receipts.json"), "wb").write(rb)
    report.update({"catalog": {"bytes": len(cb), "sha256": sha(cb)}, "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)},
                   "mediaReceipts": {"bytes": len(rb), "sha256": sha(rb), "files": len(receipts), "totalBytes": sum(r["bytes"] for r in receipts)},
                   "mediaFiles": n, "mediaBytes": tot})
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    for nme in ("catalog.json", "catalog/catalog.json", "report.json", "media-receipts.json"):
        b = open(os.path.join(a.out, nme), "rb").read()
        plan.append({"id": None, "kind": "catalog", "path": nme, "objectKey": f"pack/{PACK}/{nme}", "source": os.path.join(a.out, nme),
                     "contentType": "application/json", "bytes": len(b), "sha256": sha(b)})
    open(os.path.join(a.out, "plan.json"), "wb").write(dump(plan))
    print(json.dumps({k: report[k] for k in ("catalog", "semantic", "mediaReceipts", "mediaFiles", "mediaBytes")}, ensure_ascii=False))

if __name__ == "__main__": main()
