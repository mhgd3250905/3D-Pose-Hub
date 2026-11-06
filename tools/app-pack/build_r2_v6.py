#!/usr/bin/env python3
"""r2-v5 → r2-v6：脚角度修复 r1–r3（codex/foot-angle-r1）的 6 个动作换新媒体，其余（含文案、语音）全部沿用 r2-v5。

只读输入：release/app-pack-r2-v5/catalog.json（r2-v5 定稿，SHA 固定，见 SRC_CATALOG_SHA；与线上 pack/r2-v5/ 一致）、
release/app-pack-r2-v5/catalog/catalog.json（SHA 固定）、tools/app-pack/r2-v6-media-sources.tsv（换新媒体的动作 → 本机渲染批次）、
当前检出的生产配方（spec 路径与 specSha256Lf，spec 必须是 *-fa1.js）。

SDK 单前缀规则：媒体仍放 pack/r2-v1/ 前缀，新媒体用新的版本段 media/<id>/r2-v6/<id>.*；全部是新对象键，只追加。目录放 pack/r2-v6/。

  # 1) 草稿（沙箱，没有新媒体）：只写 catalog.draft.json + catalog/catalog.json + plan.json + report.json
  python3 tools/app-pack/build_r2_v6.py --out release/app-pack-r2-v6 --source-commit <40 位> --draft
  # 2) 定稿（本机导出完新媒体之后）：读 --media-root 下 media/<id>/r2-v6/ 的真实文件，算 bytes/SHA/宽高
  python3 tools/app-pack/build_r2_v6.py --out F:/PoseHub-v3/app-pack/r2-v6 --source-commit <40 位> \
      --media-root F:/PoseHub-v3/app-pack/r2-v6 --published-at "<时间>"
定稿写 catalog.json、catalog/catalog.json、report.json、media-receipts.json、plan.json、channels/{dev,beta}.json（指向 r2-v6；
不生成 stable；channels 不在 plan.json 里，切指针单独上传）。有问题列出并拒绝写目录。
"""
import argparse, hashlib, json, os, subprocess

PACK, PREV, MEDIA_PACK = "r2-v6", "r2-v5", "r2-v1"
CAT_BASE = f"https://media.uuugk.win/pack/{PACK}/"
MEDIA_BASE = f"https://media.uuugk.win/pack/{MEDIA_PACK}/"
SRC = f"release/app-pack-{PREV}"
SRC_CATALOG_SHA = "b529f4558101c9f397b9bfc81bd65af1e1c263c1bfa1fe321546a21d243c4778"
SRC_SEMANTIC_SHA = "bb30d4a74c0b9594837cf6491bafd1502f4437e1fa00dbab9bb078d586166d67"
SOURCES = "tools/app-pack/r2-v6-media-sources.tsv"
BRANCH = "codex/foot-angle-r1"
MIN_SDK = "0.8.0"   # 与线上 pack/channels/*.json 一致
KINDS = {"video": "rgb-alpha.mp4", "cover": "cover.alpha.webp", "thumbnail": "thumbnail.alpha.webp"}
EXTRA = {"poster": "poster.alpha.webp"}

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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True); ap.add_argument("--source-commit", required=True)
    ap.add_argument("--media-root"); ap.add_argument("--published-at"); ap.add_argument("--draft", action="store_true")
    a = ap.parse_args()
    if not a.draft and not (a.media_root and a.published_at): raise SystemExit("定稿需要 --media-root 和 --published-at")
    if len(a.source_commit) != 40: raise SystemExit("--source-commit 要 40 位完整提交号")
    raw = open(f"{SRC}/catalog.json", "rb").read()
    if sha(raw) != SRC_CATALOG_SHA: raise SystemExit("r2-v5 catalog.json SHA 不符")
    sraw = open(f"{SRC}/catalog/catalog.json", "rb").read()
    if sha(sraw) != SRC_SEMANTIC_SHA: raise SystemExit("r2-v5 catalog/catalog.json SHA 不符")
    cat = json.loads(raw); sem = json.loads(sraw)
    md = cat["mediaDistribution"]
    src = {}
    for line in open(SOURCES, encoding="utf-8"):
        line = line.rstrip("\r\n")
        if not line.strip() or line.startswith("#"): continue
        i, batch, commit, note = (line.split("\t") + [""])[:4]
        src[i] = {"batch": batch, "commit": commit, "note": note}
    acts = {x["id"]: x for x in cat["actions"]}
    problems, receipts, plan = [], [], []
    if len(src) != 6: problems.append(f"sources 应为 6 个动作，实际 {len(src)}")
    if sorted(set(src) - set(acts)): problems.append(f"不在 r2-v5 的动作: {sorted(set(src) - set(acts))}")
    if not a.draft:
        for i, s in src.items():
            if len(s["commit"]) != 40: problems.append(f"{i}: sources 第 3 列不是 40 位提交号（{s['commit']}）")
    for act in cat["actions"]: act["packRevision"] = PACK
    for i, s in sorted(src.items()):
        act = acts.get(i)
        if not act: continue
        rp = recipe_path(i); rec = json.load(open(rp, encoding="utf-8")); spec = rec["spec"]
        if not os.path.exists(spec): problems.append(f"{i}: spec 不存在 {spec}"); continue
        if sha_lf(spec) != rec["specSha256Lf"]: problems.append(f"{i}: specSha256Lf 与文件不符")
        if not spec.endswith("-fa1.js"): problems.append(f"{i}: 配方 spec 不是 -fa1（不是脚角度修复动作）")
        if act["source"].get("spec", {}).get("path") == spec: problems.append(f"{i}: spec 与 r2-v5 相同，没有变化")
        rsha = sha(open(rp, "rb").read())
        act["source"] = {"branch": BRANCH, "commit": a.source_commit, "renderCommit": s["commit"],
                         "spec": {"path": spec, "sha256": rec["specSha256Lf"]}, "mediaSet": s["batch"], "model": act["source"].get("model")}
        act["sourceRevision"] = os.path.basename(spec)[:-3]; act["mediaRevision"] = PACK; act["revision"] = f"{i}-{PACK}"
        act["repairReason"] = s["note"] or "foot angle r1–r3：脚随小腿，修正踝角"
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
                if not b: problems.append(f"{path}: 空文件")
            plan.append(ent)
            if kind not in KINDS:
                if fp and os.path.exists(fp): receipts.append({k: ent[k] for k in ("id", "kind", "path", "objectKey", "bytes", "sha256", "inCatalog")})
                elif a.media_root: problems.append(f"缺文件 {path}")
                continue
            old = act["files"][kind]
            f = dict(old); f.update({"path": path, "assetName": f"{i}.{suffix}", "downloadUrl": MEDIA_BASE + path})
            if a.media_root:
                if not os.path.exists(fp): problems.append(f"缺文件 {path}"); continue
                pr = probe(fp); f.update({"bytes": ent["bytes"], "sha256": ent["sha256"], "width": int(pr["width"]), "height": int(pr["height"]), "status": "ready"})
                if kind == "video": f.update({"codec": pr["codec_name"], "pixelFormat": pr["pix_fmt"]})
                if (f["width"], f["height"]) != (old["width"], old["height"]): problems.append(f"{path}: 尺寸 {f['width']}x{f['height']} ≠ 旧 {old['width']}x{old['height']}")
                if kind == "video" and (f["codec"], f["pixelFormat"]) != (old["codec"], old["pixelFormat"]):
                    problems.append(f"{path}: 编码 {f['codec']}/{f['pixelFormat']} ≠ 旧 {old['codec']}/{old['pixelFormat']}")
                if ent["sha256"] == old.get("sha256"): problems.append(f"{path}: 与 r2-v5 旧文件完全相同（没换新渲染？）")
                receipts.append({k: ent[k] for k in ("id", "kind", "path", "objectKey", "bytes", "sha256", "inCatalog")})
            else:
                f.update({"bytes": None, "sha256": None, "status": "pending-export"})
            act["files"][kind] = f
    seen, n, tot = set(), 0, 0
    for act in cat["actions"]:
        for f in list(act["files"].values()) + (act.get("voice") or {}).get("files", []):
            if f["path"] in seen: problems.append(f"重复路径 {f['path']}")
            seen.add(f["path"])
            if f["downloadUrl"] != md["baseUrl"] + f["path"]: problems.append(f"downloadUrl 不符 {f['path']}")
        for f in act["files"].values(): n += 1; tot += f["bytes"] or 0
    md.update({"mediaFiles": n, "mediaBytes": tot, "version": f"posehub-app-pack-{PACK}",
               "note": f"{PACK}：媒体仍在 pack/{MEDIA_PACK}/ 前缀；{len(src)} 个脚角度修复动作用 media/<id>/{PACK}/，"
                       f"其余（含文案、语音）沿用 {PREV} 引用；只追加"})
    batches = {}
    for i, s in src.items(): batches.setdefault((s["batch"], s["commit"]), []).append(i)
    cat["sourceRuns"] = cat["sourceRuns"] + [{"batch": b, "commit": c, "selectedActions": len(v), "replaces": f"{PREV} media (foot angle r1-r3)"} for (b, c), v in sorted(batches.items())]
    cat["pack"], cat["id"], cat["sourceCommit"], cat["previousPack"] = PACK, f"app-pack-{PACK}", a.source_commit, PREV
    sem["source"]["pack"], sem["source"]["previousPack"] = PACK, PREV
    if a.published_at: sem["generatedAt"] = a.published_at
    sem_bytes = dump(sem); cat["semanticCatalog"].update({"bytes": len(sem_bytes), "sha256": sha(sem_bytes)})
    os.makedirs(os.path.join(a.out, "catalog"), exist_ok=True)
    report = {"pack": PACK, "from": PREV, "fromCatalogSha256": SRC_CATALOG_SHA, "mediaPrefix": f"pack/{MEDIA_PACK}/", "catalogPrefix": f"pack/{PACK}/",
              "sourceCommit": a.source_commit, "newMediaActions": len(src), "newMediaActionIds": sorted(src),
              "reusedMediaActions": len(acts) - len(src), "textEditedActionIds": [], "voiceRegeneratedActionIds": [], "problems": problems,
              "channelsGenerated": ["channels/dev.json", "channels/beta.json"], "stableUntouched": True}
    if a.draft:
        cb = dump(cat); open(os.path.join(a.out, "catalog.draft.json"), "wb").write(cb)
        open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
        open(os.path.join(a.out, "plan.json"), "wb").write(dump(plan))
        report.update({"draft": True, "catalogDraft": {"bytes": len(cb), "sha256": sha(cb)}})
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print(json.dumps({k: report[k] for k in ("newMediaActions", "reusedMediaActions", "problems")}, ensure_ascii=False)); return
    if problems: print("\n".join(problems)); raise SystemExit("有问题，未写目录")
    cb = dump(cat)
    open(os.path.join(a.out, "catalog.json"), "wb").write(cb); open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
    os.makedirs(os.path.join(a.out, "channels"), exist_ok=True)
    ptr = {"schema": 1, "pack": PACK, "catalog": CAT_BASE + "catalog.json", "catalog_sha256": sha(cb), "catalog_bytes": len(cb),
           "min_sdk": MIN_SDK, "published_at": a.published_at}
    for ch in ("dev", "beta"): open(os.path.join(a.out, "channels", f"{ch}.json"), "wb").write(dump(ptr))
    rb = dump(receipts); open(os.path.join(a.out, "media-receipts.json"), "wb").write(rb)
    report.update({"catalog": {"bytes": len(cb), "sha256": sha(cb)}, "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)},
                   "mediaReceipts": {"bytes": len(rb), "sha256": sha(rb), "files": len(receipts), "totalBytes": sum(r["bytes"] for r in receipts)},
                   "mediaFiles": n, "mediaBytes": tot})
    pb = dump(ptr); report["channels"] = {"bytes": len(pb), "sha256": sha(pb), "pointer": ptr}
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    for nme in ("catalog.json", "catalog/catalog.json", "report.json", "media-receipts.json"):
        b = open(os.path.join(a.out, nme), "rb").read()
        plan.append({"id": None, "kind": "catalog", "path": nme, "objectKey": f"pack/{PACK}/{nme}", "source": os.path.join(a.out, nme),
                     "contentType": "application/json", "bytes": len(b), "sha256": sha(b)})
    open(os.path.join(a.out, "plan.json"), "wb").write(dump(plan))
    print(json.dumps({k: report[k] for k in ("catalog", "semantic", "mediaReceipts", "mediaFiles", "mediaBytes", "newMediaActions", "reusedMediaActions", "channels")}, ensure_ascii=False))

if __name__ == "__main__": main()
