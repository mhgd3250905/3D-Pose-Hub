#!/usr/bin/env python3
"""r2-v16 → r2-v18：V5 日漫画面换片（开哥 2026-11-18 10:59 同意：上传 V5 成片、发布新 pack、切 dev 和 beta；stable 不动）。

只换媒体。249 个训练动作的 files.video / files.cover / files.thumbnail 换成 V5 全量渲染
（codex/v5-toon-render，渲染内容 = main e4c3c78 + tools/v5，皮肤 v5-toon）导出的成片，新对象键
media/<id>/r2-v18/<id>.{rgb-alpha.mp4,cover.alpha.webp,thumbnail.alpha.webp}（只追加，不覆盖 r2-v14 旧片）。
同一动作随之更新的只有媒体出处字段：source（渲染分支/批次/模型）、mediaRevision、revision、repairReason。
文字、语音、voiceGuide、voiceCommon、定义字段、节奏、状态标志全部逐字沿用 r2-v16（脚本逐字段核对，任何其他改动都算问题）。
r2-v17 是已撤回的主题皮肤包（保留不删），不作基线；目录版本号取下一个空号 r2-v18。托马斯不进 Hub pack。

导出成片的规格与 r2-v14 相同（x264 crf27 slow，720×1440 yuv420p，rgb 在上 alpha 在下；cover 640 / thumbnail 192 webp q80），
脚本按 r2-v16 同类文件核对尺寸/编码。

  # 草稿（沙箱，没有成片）：
  python3 tools/v5/publish/build_r2_v18.py --out <dir> --source-commit <40 位> --draft
  # 定稿（渲染机）：
  python tools/v5/publish/build_r2_v18.py --out F:/PoseHub-v3/app-pack/r2-v18 --source-commit <40 位> \
      --v5-root F:/PoseHub-v3/runs/2026-11-17_v5r2_40105eb --media-root F:/PoseHub-v3/app-pack/r2-v18
定稿写 catalog.json、catalog/catalog.json、report.json、media-receipts.json、plan.json（上传清单：747 个成片 + 最后 4 个目录文件）、
channels/dev.json、channels/beta.json（不生成 stable）。有问题列出并拒绝写目录（退出码 1）。
"""
import argparse, copy, hashlib, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "app-pack"))
from catalog_pointer import default_published_at, published_at, validate_catalog_pointer  # noqa: E402

PACK, PREV = "r2-v18", "r2-v16"
CAT_BASE = f"https://media.uuugk.win/pack/{PACK}/"
SRC = os.path.join(ROOT, "release", f"app-pack-{PREV}")
SRC_CATALOG_SHA = "c8536ffcf13e677449c251720183bcf099ae5ca166182026be411544d9bfa562"
SRC_SEMANTIC_SHA = "03d61ba5baa08b22026240f7dc645dd62d041664e5d17c2d0ad68e2d9ec17820"
RENDER_BRANCH = "codex/v5-toon-render"
RENDER_BASE = "e4c3c780d6a5506fbedfc5904429ae9be709a78b"   # produce-v5.mjs BASE：渲染内容 = main e4c3c78 + tools/v5
MEDIA_SET = "2026-11-17_v5r2_40105eb"
SKIN = "v5-toon"
MIN_SDK = "0.8.0"   # 与 r2-v16 线上指针相同
KINDS = {"video": "rgb-alpha.mp4", "cover": "cover.alpha.webp", "thumbnail": "thumbnail.alpha.webp"}
CTYPE = {"video": "video/mp4", "cover": "image/webp", "thumbnail": "image/webp"}
# 允许随换片改动的动作字段；其余字段必须与 r2-v16 逐字一致
MEDIA_FIELDS = ("files", "source", "mediaRevision", "revision", "repairReason")
# 与 SDK lib/src/catalog/pose_hub_app_test_pack.dart _definitionFields 相同（同 build_r2_v14.py）
DEFINITION_FIELDS = ["purpose", "category", "muscles", "muscleGroups", "equipment", "position", "unilateral", "level", "scenes",
                     "defaultDose", "doseRange", "cues", "primaryCue", "cautions", "contraindications", "alternative"]
TOP_CHANGED = ("pack", "id", "sourceCommit", "previousPack", "mediaDistribution", "sourceRuns", "semanticCatalog", "actions")
MD_CHANGED = ("version", "note", "mediaFiles", "mediaBytes")


def sha(b): return hashlib.sha256(b).hexdigest()
def rd(p):
    with open(p, "rb") as f: return f.read()
def dump(o): return (json.dumps(o, ensure_ascii=False, indent=1) + "\n").encode()


def sha_file(p):
    h = hashlib.sha256(); n = 0
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b); n += len(b)
    return h.hexdigest(), n


def probe(p):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height,codec_name,pix_fmt", "-of", "json", p], capture_output=True, text=True)
    s = (json.loads(o.stdout or "{}").get("streams") or [{}])[0]
    return s


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", required=True); ap.add_argument("--source-commit", required=True)
    ap.add_argument("--v5-root"); ap.add_argument("--media-root")
    ap.add_argument("--published-at", type=published_at, default=default_published_at())
    ap.add_argument("--draft", action="store_true")
    a = ap.parse_args()
    if not a.draft and not (a.v5_root and a.media_root): raise SystemExit("定稿需要 --v5-root 和 --media-root")
    if len(a.source_commit) != 40: raise SystemExit("--source-commit 要 40 位完整提交号")
    raw, sraw = rd(os.path.join(SRC, "catalog.json")), rd(os.path.join(SRC, "catalog", "catalog.json"))
    if sha(raw) != SRC_CATALOG_SHA: raise SystemExit("r2-v16 catalog.json SHA 不符")
    if sha(sraw) != SRC_SEMANTIC_SHA: raise SystemExit("r2-v16 catalog/catalog.json SHA 不符")
    cat, sem = json.loads(raw), json.loads(sraw)
    before, sem_before = copy.deepcopy(cat), copy.deepcopy(sem)
    md = cat["mediaDistribution"]; base, prefix = md["baseUrl"], md["objectKeyPrefix"]
    plan_v5 = json.load(open(os.path.join(ROOT, "tools", "v5", "v5-actions.json"), encoding="utf-8"))["actions"]
    v5 = {x["id"]: x for x in plan_v5}
    problems, notes, receipts, plan = [], [], [], []
    ids = [x["id"] for x in cat["actions"]]
    if len(ids) != 249 or len(set(ids)) != 249: problems.append(f"r2-v16 动作数 {len(ids)}（去重 {len(set(ids))}）≠ 249")
    if set(v5) != set(ids): problems.append(f"V5 名单与 r2-v16 不同：多 {sorted(set(v5) - set(ids))} 少 {sorted(set(ids) - set(v5))}")
    stat = {"actions": 0, "mediaFiles": 0, "mediaBytes": 0, "pendingExport": 0}

    for act in cat["actions"]:
        i = act["id"]; old = before["actions"][ids.index(i)]
        rp = v5.get(i, {}).get("recipe")
        if act["recipe"]["path"] != rp: problems.append(f"{i}: 配方路径 {act['recipe']['path']} ≠ V5 名单 {rp}")
        model = None
        if a.v5_root:
            mp = os.path.join(a.v5_root, "masters", i, "layer-manifest.json")
            pp = os.path.join(a.v5_root, "packages", i, "package.json")
            if not os.path.isfile(mp): problems.append(f"{i}: 缺 V5 母帧清单 masters/{i}/layer-manifest.json"); continue
            if not os.path.isfile(pp): problems.append(f"{i}: 缺 V5 成片包 packages/{i}/package.json"); continue
            m = json.loads(rd(mp))
            model = m.get("productionModel")
            if [s.get("id") for s in m.get("skins", [])] != [SKIN]: problems.append(f"{i}: 母帧皮肤 {[s.get('id') for s in m.get('skins', [])]} ≠ [{SKIN}]")
            if (m.get("profile") or {}).get("id") != "v5": problems.append(f"{i}: 母帧 profile {(m.get('profile') or {}).get('id')} ≠ v5")
            if (m.get("recipe") or {}).get("sha256") != act["recipe"]["sha256"]: problems.append(f"{i}: 母帧配方 SHA 与 r2-v16 不同（动作变了？）")
            rh = act["rhythm"]
            if m.get("fps") != rh.get("fps"): problems.append(f"{i}: 母帧 fps {m.get('fps')} ≠ 目录 {rh.get('fps')}")
            if abs(float(m.get("durationSeconds") or 0) - float(rh.get("durationSeconds") or 0)) > 1e-6:
                problems.append(f"{i}: 母帧时长 {m.get('durationSeconds')} ≠ 目录 {rh.get('durationSeconds')}")
            if m.get("complete") is not True: problems.append(f"{i}: 母帧不完整（complete={m.get('complete')}）")
        # ---- 媒体
        for kind, suffix in KINDS.items():
            o = old["files"][kind]
            rel = f"media/{i}/{PACK}/{i}.{suffix}"
            f = dict(o); f.update({"path": rel, "assetName": f"{i}.{suffix}", "downloadUrl": base + rel})
            if not a.media_root:
                f.update({"bytes": None, "sha256": None, "status": "pending-export"}); act["files"][kind] = f; stat["pendingExport"] += 1; continue
            fp = os.path.join(a.media_root, rel)
            if not os.path.isfile(fp) or os.path.getsize(fp) == 0: problems.append(f"缺文件或空文件 {rel}"); continue
            h, n = sha_file(fp)
            pr = probe(fp); w, hh = int(pr.get("width") or 0), int(pr.get("height") or 0)
            f.update({"bytes": n, "sha256": h, "width": w, "height": hh, "status": "ready"})
            if (w, hh) != (o["width"], o["height"]): problems.append(f"{rel}: 尺寸 {w}x{hh} ≠ r2-v16 {o['width']}x{o['height']}")
            if kind == "video":
                f.update({"codec": pr.get("codec_name"), "pixelFormat": pr.get("pix_fmt")})
                if (f["codec"], f["pixelFormat"]) != (o["codec"], o["pixelFormat"]): problems.append(f"{rel}: 编码 {f['codec']}/{f['pixelFormat']} ≠ r2-v16")
            if h == o.get("sha256"): problems.append(f"{rel}: 与 r2-v16 旧片字节完全相同（没换成 V5？）")
            if set(f) != set(o): problems.append(f"{i}.{kind}: 字段集合与 r2-v16 不同 {sorted(set(f) ^ set(o))}")
            act["files"][kind] = f
            ent = {"id": i, "kind": kind, "path": rel, "objectKey": prefix + rel, "source": fp, "contentType": CTYPE[kind],
                   "bytes": n, "sha256": h, "inCatalog": True}
            plan.append(ent); receipts.append({k: ent[k] for k in ent if k != "source"})
            stat["mediaFiles"] += 1; stat["mediaBytes"] += n
        if set(act["files"]) != set(old["files"]): problems.append(f"{i}: files 键 {sorted(act['files'])} ≠ r2-v16 {sorted(old['files'])}")
        # ---- 媒体出处
        act["source"] = {"branch": RENDER_BRANCH, "commit": a.source_commit, "renderCommit": RENDER_BASE,
                         "spec": old["source"]["spec"], "mediaSet": MEDIA_SET, "model": model or old["source"].get("model")}
        if model is None: act["source"]["model"] = "coach-v3r3-wristfix@v5-toon"
        act["mediaRevision"] = PACK; act["revision"] = f"{i}-{PACK}"
        act["repairReason"] = "V5 日漫三渲二全量换片（v3r7 toon + v3r8b 腕部修复，光头无特效硬边投影；开哥 2026-11-18 同意发布）"
        stat["actions"] += 1

    # ---- 一致性：除媒体字段外与 r2-v16 逐字段一致
    for x, y in zip(cat["actions"], before["actions"]):
        if x["id"] != y["id"]: problems.append(f"动作顺序变了 {x['id']} ≠ {y['id']}"); continue
        if set(x) != set(y): problems.append(f"{x['id']}: 字段集合变了 {sorted(set(x) ^ set(y))}")
        for k in y:
            if k in MEDIA_FIELDS: continue
            if x.get(k) != y[k]: problems.append(f"{x['id']}: 非媒体字段 {k} 被改动")
        for k in KINDS:
            if set(x["files"][k]) != set(y["files"][k]): problems.append(f"{x['id']}: files.{k} 字段集合变了 {sorted(set(x['files'][k]) ^ set(y['files'][k]))}")
            for fk, fv in y["files"][k].items():
                if fk in ("path", "assetName", "downloadUrl", "bytes", "sha256", "width", "height", "codec", "pixelFormat", "status"): continue
                if x["files"][k].get(fk) != fv: problems.append(f"{x['id']}: files.{k}.{fk} 被改动")
    # 定义字段与 semantic catalog 逐字一致（SDK _validateSemanticCatalog 同一张字段表）
    drills = {d.get("id"): d for d in sem.get("drills", [])}
    for act in cat["actions"]:
        d = drills.get(act["id"])
        if d is None: continue
        if act.get("nameZh") != (d.get("name") or {}).get("zh"): problems.append(f"{act['id']}: nameZh 与 semantic catalog 不一致")
        for f in DEFINITION_FIELDS:
            if f in act and act[f] != d.get(f): problems.append(f"{act['id']}: {f} 与 semantic catalog 不一致")
    # 路径：唯一、在前缀内、成片全部是新的 r2-v18 路径
    seen = set()
    for act in cat["actions"]:
        for f in list(act["files"].values()) + (act.get("voice") or {}).get("files", []):
            if f["path"] in seen: problems.append(f"重复路径 {f['path']}")
            seen.add(f["path"])
            if f["downloadUrl"] != base + f["path"]: problems.append(f"downloadUrl 不符 {f['path']}")
        for k in KINDS:
            if not act["files"][k]["path"].startswith(f"media/{act['id']}/{PACK}/"): problems.append(f"{act['id']}.{k} 不是 {PACK} 新路径")
    if a.media_root and stat["mediaFiles"] != 747: problems.append(f"成片 {stat['mediaFiles']} ≠ 747")

    # ---- 顶层
    n_media = sum(1 for x in cat["actions"] for _ in x["files"].values())
    md.update({"mediaFiles": n_media, "mediaBytes": sum(f["bytes"] or 0 for x in cat["actions"] for f in x["files"].values()),
               "version": f"posehub-app-pack-{PACK}",
               "note": f"{PACK}：V5 日漫画面换片——249 个动作成片换成 V5（皮肤 {SKIN}，渲染批次 {MEDIA_SET}）media/<id>/{PACK}/；"
                       f"文字、语音、voiceGuide、共用词、定义字段全部沿用 {PREV}（r2-v17 主题包已撤回，不作基线）"})
    cat["sourceRuns"] = cat["sourceRuns"] + [{"batch": MEDIA_SET, "commit": RENDER_BASE, "selectedActions": stat["actions"],
                                              "replaces": f"{PREV} media (V5 toon)"}]
    cat["pack"], cat["id"], cat["sourceCommit"], cat["previousPack"] = PACK, f"app-pack-{PACK}", a.source_commit, PREV
    sem["source"].update({"pack": PACK, "previousPack": PREV, "commit": a.source_commit})
    sem["generatedAt"] = a.published_at
    sem_bytes = dump(sem); cat["semanticCatalog"].update({"bytes": len(sem_bytes), "sha256": sha(sem_bytes)})
    for k in set(cat) | set(before):
        if k in TOP_CHANGED: continue
        if cat.get(k) != before.get(k): problems.append(f"顶层字段 {k} 被改动")
    for k in set(md) | set(before["mediaDistribution"]):
        if k not in MD_CHANGED and md.get(k) != before["mediaDistribution"].get(k): problems.append(f"mediaDistribution.{k} 被改动")
    if {k: v for k, v in cat["semanticCatalog"].items() if k not in ("bytes", "sha256")} != \
       {k: v for k, v in before["semanticCatalog"].items() if k not in ("bytes", "sha256")}: problems.append("semanticCatalog 除 bytes/sha256 外被改动")
    for k in set(sem) | set(sem_before):
        if k in ("source", "generatedAt"): continue
        if sem.get(k) != sem_before.get(k): problems.append(f"semantic catalog {k} 被改动")
    if cat["voiceCommon"] != before["voiceCommon"]: problems.append("voiceCommon 被改动")

    report = {"pack": PACK, "from": PREV, "fromCatalogSha256": SRC_CATALOG_SHA, "mediaSet": MEDIA_SET, "skin": SKIN,
              "renderBranch": RENDER_BRANCH, "renderBase": RENDER_BASE, "mediaPrefix": prefix, "catalogPrefix": f"pack/{PACK}/",
              "sourceCommit": a.source_commit, "actions": len(cat["actions"]), "stats": stat, "mediaFieldsChanged": list(MEDIA_FIELDS),
              "minSdk": MIN_SDK, "notes": notes, "problems": problems,
              "channelsGenerated": ["channels/dev.json", "channels/beta.json"], "stableUntouched": True}
    os.makedirs(os.path.join(a.out, "catalog"), exist_ok=True)
    if a.draft:
        cb = dump(cat); open(os.path.join(a.out, "catalog.draft.json"), "wb").write(cb)
        open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
        report.update({"draft": True, "problemCount": len(problems), "catalogDraft": {"bytes": len(cb), "sha256": sha(cb)}})
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print(json.dumps({"draft": True, "actions": len(cat["actions"]), "stats": stat, "problems": problems[:30], "problemCount": len(problems)}, ensure_ascii=False))
        sys.exit(1 if problems else 0)
    report["problemCount"] = len(problems)
    if problems:
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print("\n".join(problems[:100])); print(json.dumps({"error": f"{len(problems)} 个问题，未写目录", "problemCount": len(problems)}, ensure_ascii=False)); sys.exit(1)
    cb = dump(cat)
    ptr = {"schema": 1, "pack": PACK, "catalog": CAT_BASE + "catalog.json", "catalog_sha256": sha(cb), "catalog_bytes": len(cb),
           "min_sdk": MIN_SDK, "published_at": a.published_at}
    validate_catalog_pointer(ptr)
    open(os.path.join(a.out, "catalog.json"), "wb").write(cb); open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
    os.makedirs(os.path.join(a.out, "channels"), exist_ok=True)
    for ch in ("dev", "beta"): open(os.path.join(a.out, "channels", f"{ch}.json"), "wb").write(dump(ptr))
    open(os.path.join(a.out, "media-receipts.json"), "wb").write(dump(receipts))
    report.update({"catalog": {"bytes": len(cb), "sha256": sha(cb)}, "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)},
                   "receipts": {"files": len(receipts), "totalBytes": sum(r["bytes"] for r in receipts)}, "pointer": ptr})
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    for nme in ("catalog.json", "catalog/catalog.json", "report.json", "media-receipts.json"):
        b = rd(os.path.join(a.out, nme))
        plan.append({"id": None, "kind": "catalog", "path": nme, "objectKey": f"pack/{PACK}/{nme}", "source": os.path.join(a.out, nme),
                     "contentType": "application/json", "bytes": len(b), "sha256": sha(b)})
    open(os.path.join(a.out, "plan.json"), "wb").write(dump(plan))
    print(json.dumps({"problemCount": 0, "catalog": report["catalog"], "semantic": report["semantic"], "uploadFiles": len(plan),
                      "mediaFiles": stat["mediaFiles"], "mediaBytes": stat["mediaBytes"], "pointer": ptr}, ensure_ascii=False))


if __name__ == "__main__": main()
