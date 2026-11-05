#!/usr/bin/env python3
"""r2-v2 → r2-v3：94 个修过的动作换新媒体（地面/拧转/自穿模修复集成），其余 155 个沿用 r2-v1 媒体。

只读输入：release/app-pack-r2-v2（目录底）、tools/app-pack/r2-v3-media-sources.tsv（94 个动作 → 渲染批次）、
当前检出里的生产配方（spec 路径与 specSha256Lf）。文本、语音、节奏不变；r2-v1、r2-v2 文件不改。

媒体位置（SDK 规则）：SDK 只认一个 mediaDistribution.objectKeyPrefix（pack/<pack>/），每个文件的
downloadUrl 必须等于 baseUrl + path（不能含 ..）。所以 r2-v3 的媒体继续放在 pack/r2-v1/ 前缀下：
旧 155 个原样引用 pack/r2-v1/media/...（不重传），新 94 个用新的版本段
pack/r2-v1/media/<id>/r2-v3/<id>.*（全新对象键，只追加，不覆盖任何已有对象）。
目录本身（catalog.json、catalog/catalog.json、report.json、media-receipts.json）放 pack/r2-v3/。

两种用法：
  # 1) 草稿（沙箱，没有新媒体）：新文件 bytes/sha 为 null，只写 catalog.draft.json + plan.json
  python3 tools/app-pack/build_r2_v3.py --out release/app-pack-r2-v3 --source-commit <sha> --draft
  # 2) 定稿（本机导出完 94 个新媒体之后）：读 --media-root 下 media/<id>/r2-v3/ 的真实文件，算 bytes/SHA/宽高
  python3 tools/app-pack/build_r2_v3.py --out F:/PoseHub-v3/app-pack/r2-v3 --source-commit <sha> \
      --media-root F:/PoseHub-v3/app-pack/r2-v3 --published-at "<ISO 8601>"
定稿写 catalog.json、catalog/catalog.json、channels/{dev,beta,stable}.json（不上传）、report.json、media-receipts.json。
"""
import argparse, hashlib, json, os, shutil, subprocess, sys

PACK, PREV, MEDIA_PACK = "r2-v3", "r2-v2", "r2-v1"
CAT_BASE = f"https://media.uuugk.win/pack/{PACK}/"
MEDIA_BASE = f"https://media.uuugk.win/pack/{MEDIA_PACK}/"
SRC = "release/app-pack-r2-v2"
SOURCES = "tools/app-pack/r2-v3-media-sources.tsv"
BRANCH = "release/pose-fix-integration-r1"
KINDS = {"video": "rgb-alpha.mp4", "cover": "cover.alpha.webp", "thumbnail": "thumbnail.alpha.webp"}
# poster 不进目录（SDK 内置 standing 图来自 r2-v1），但导出工具会产出；一并上传供以后 SDK 换内置图用
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
    s = json.loads(out)["streams"][0]
    return s

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True); ap.add_argument("--source-commit", required=True)
    ap.add_argument("--media-root"); ap.add_argument("--published-at"); ap.add_argument("--draft", action="store_true")
    a = ap.parse_args()
    if not a.draft and not (a.media_root and a.published_at): raise SystemExit("定稿需要 --media-root 和 --published-at")
    if len(a.source_commit) != 40: raise SystemExit("--source-commit 要 40 位完整提交号")
    cat = json.load(open(f"{SRC}/catalog.json", encoding="utf-8"))
    sem = json.load(open(f"{SRC}/catalog/catalog.json", encoding="utf-8"))
    src = {}
    for line in open(SOURCES, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"): continue
        i, batch, commit, note = (line.split("\t") + [""])[:4]
        src[i] = {"batch": batch, "commit": commit, "note": note}
    acts = {x["id"]: x for x in cat["actions"]}
    missing = sorted(set(src) - set(acts))
    if missing: raise SystemExit(f"不在 r2-v2 目录里的动作: {missing}")
    receipts, plan, problems = [], [], []
    for act in cat["actions"]:
        act["packRevision"] = PACK
        i = act["id"]
        if i not in src: continue
        s = src[i]; rp = recipe_path(i); rec = json.load(open(rp, encoding="utf-8"))
        spec = rec["spec"]
        if sha_lf(spec) != rec["specSha256Lf"]: problems.append(f"{i}: specSha256Lf 与文件不符")
        rsha = sha(open(rp, "rb").read())
        act["source"] = {"branch": BRANCH, "commit": a.source_commit, "renderCommit": s["commit"],
                         "spec": {"path": spec, "sha256": rec["specSha256Lf"]}, "mediaSet": s["batch"],
                         "model": act["source"]["model"]}
        act["sourceRevision"] = os.path.basename(spec)[:-3]
        act["mediaRevision"] = PACK
        act["revision"] = f"{i}-{PACK}"
        act["repairReason"] = s["note"] or "pose-fix r1：地面/小臂拧转/自穿模修复"
        act["recipe"] = {"path": rp, "sha256": rsha, "fingerprint": "sha256:" + rsha}
        if isinstance(act.get("qa"), dict) and isinstance(act["qa"].get("report"), dict):
            act["qa"]["report"]["path"] = f"qa/{i}/{PACK}/export-check.json"
        for ev in act.get("trainingSemantics", {}).get("evidence", []):
            if ev.get("path") == rp: ev["sha256"] = rsha
        cat["latestOverrides"][i] = act["sourceRevision"]
        for kind, suffix in {**KINDS, **EXTRA}.items():
            path = f"media/{i}/{PACK}/{i}.{suffix}"
            plan.append({"id": i, "kind": kind, "path": path, "objectKey": f"pack/{MEDIA_PACK}/{path}",
                         "inCatalog": kind in KINDS, "batch": s["batch"]})
            if kind not in KINDS: 
                if a.media_root:
                    fp = os.path.join(a.media_root, path)
                    if os.path.exists(fp):
                        b = open(fp, "rb").read(); receipts.append({"id": i, "kind": kind, "path": path, "objectKey": f"pack/{MEDIA_PACK}/{path}", "bytes": len(b), "sha256": sha(b), "inCatalog": False})
                continue
            f = dict(act["files"][kind])
            f.update({"path": path, "assetName": f"{i}.{suffix}", "downloadUrl": MEDIA_BASE + path})
            if a.media_root:
                fp = os.path.join(a.media_root, path)
                if not os.path.exists(fp): problems.append(f"缺文件 {path}"); continue
                b = open(fp, "rb").read(); pr = probe(fp)
                f.update({"bytes": len(b), "sha256": sha(b), "width": int(pr["width"]), "height": int(pr["height"]), "status": "ready"})
                if kind == "video": f.update({"codec": pr["codec_name"], "pixelFormat": pr["pix_fmt"]})
                old = act["files"][kind]
                if (f["width"], f["height"]) != (old["width"], old["height"]): problems.append(f"{path}: 尺寸 {f['width']}x{f['height']} ≠ r2-v1 {old['width']}x{old['height']}")
                if kind == "video" and (f["codec"], f["pixelFormat"]) != (old["codec"], old["pixelFormat"]): problems.append(f"{path}: 编码 {f['codec']}/{f['pixelFormat']} ≠ r2-v1")
                receipts.append({"id": i, "kind": kind, "path": path, "objectKey": f"pack/{MEDIA_PACK}/{path}", "bytes": len(b), "sha256": f["sha256"], "inCatalog": True})
            else:
                f.update({"bytes": None, "sha256": None, "status": "pending-export"})
            act["files"][kind] = f
    # 总数与 SDK 规则（downloadUrl == baseUrl + path，路径唯一）
    md = cat["mediaDistribution"]
    md["version"] = f"posehub-app-pack-{PACK}"
    md["note"] = "r2-v3：媒体仍在 pack/r2-v1/ 前缀（SDK 只认一个前缀）；94 个修复动作用新版本段 media/<id>/r2-v3/，其余沿用 r2-v1 对象"
    seen, n, tot = set(), 0, 0
    for act in cat["actions"]:
        for kind, f in act["files"].items():
            if f["path"] in seen: problems.append(f"重复路径 {f['path']}")
            seen.add(f["path"])
            if f["downloadUrl"] != md["baseUrl"] + f["path"]: problems.append(f"downloadUrl 不符 {f['path']}")
            n += 1; tot += f["bytes"] or 0
    md["mediaFiles"], md["mediaBytes"] = n, tot
    batches = {}
    for i, s in src.items(): batches.setdefault((s["batch"], s["commit"]), []).append(i)
    cat["sourceRuns"] = cat["sourceRuns"] + [{"batch": b, "commit": c, "selectedActions": len(v), "replaces": "r2-v1 media"} for (b, c), v in sorted(batches.items())]
    cat["scope"]["sourceCounts"] = {"r2-v1 media": len(acts) - len(src), "r2-v3 media": len(src)}
    cat["pack"], cat["id"], cat["sourceCommit"], cat["previousPack"] = PACK, f"app-pack-{PACK}", a.source_commit, PREV
    sem["source"]["pack"], sem["source"]["previousPack"] = PACK, PREV
    if a.published_at: sem["generatedAt"] = a.published_at
    sem_bytes = dump(sem)
    cat["semanticCatalog"].update({"bytes": len(sem_bytes), "sha256": sha(sem_bytes)})
    os.makedirs(os.path.join(a.out, "catalog"), exist_ok=True)
    report = {"pack": PACK, "from": PREV, "mediaPrefix": f"pack/{MEDIA_PACK}/", "catalogPrefix": f"pack/{PACK}/",
              "sourceCommit": a.source_commit, "newMediaActions": len(src), "reusedMediaActions": len(acts) - len(src),
              "newMediaActionIds": sorted(src), "problems": problems,
              "channelsNotUploaded": ["pack/channels/dev.json", "pack/channels/beta.json", "pack/channels/stable.json"]}
    open(os.path.join(a.out, "plan.json"), "wb").write(dump(plan))
    if a.draft:
        cb = dump(cat); open(os.path.join(a.out, "catalog.draft.json"), "wb").write(cb)
        open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
        report.update({"draft": True, "catalogDraft": {"bytes": len(cb), "sha256": sha(cb)}, "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)}})
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print(json.dumps({k: report[k] for k in ("newMediaActions", "reusedMediaActions", "catalogDraft", "semantic", "problems")}, ensure_ascii=False))
        return
    if problems:
        print("\n".join(problems)); raise SystemExit("有问题，未写目录")
    cb = dump(cat)
    open(os.path.join(a.out, "catalog.json"), "wb").write(cb)
    open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
    os.makedirs(os.path.join(a.out, "channels"), exist_ok=True)
    old_ptr = json.load(open(f"{SRC}/channels/dev.json"))
    ptr = {"schema": 1, "pack": PACK, "catalog": CAT_BASE + "catalog.json", "catalog_sha256": sha(cb),
           "catalog_bytes": len(cb), "min_sdk": old_ptr["min_sdk"], "published_at": a.published_at}
    for ch in ("dev", "beta", "stable"): open(os.path.join(a.out, "channels", f"{ch}.json"), "wb").write(dump(ptr))
    rb = dump(receipts); open(os.path.join(a.out, "media-receipts.json"), "wb").write(rb)
    report.update({"catalog": {"bytes": len(cb), "sha256": sha(cb)}, "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)},
                   "mediaReceipts": {"bytes": len(rb), "sha256": sha(rb), "files": len(receipts), "totalBytes": sum(r["bytes"] for r in receipts)},
                   "mediaFiles": n, "mediaBytes": tot})
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    print(json.dumps({k: report[k] for k in ("catalog", "semantic", "mediaReceipts", "mediaFiles", "mediaBytes")}, ensure_ascii=False))

if __name__ == "__main__": main()
