#!/usr/bin/env python3
"""r2-v3 → r2-v4：给 r2-v3 里语音缺失 / 检查失败的动作补上语音（voice fill r1），其余不变。

只读输入：release/app-pack-r2-v3/catalog.json（线上 r2-v3 定稿，SHA 与 pack/channels 指针一致）、
release/app-pack-r2-v4/voice-fill-r1/packages/<id>/（tools/app-pack/voice_fill_r1.py 的产物：
definition.json、voice-manifest.json、voice/{zh,en}/*.m4a，状态必须 technical-passed）。
媒体全部沿用 r2-v3 的引用；新语音按 SDK 单前缀规则放 pack/r2-v1/voice/<id>/<lang>/<clip>.m4a
（--alt-path-ids 里的动作改用 voice/<id>/r2-v4/<lang>/<clip>.m4a，用于线上已有旧文件时避免覆盖）。

修正：mediaDistribution.pendingVoiceIds / voiceFiles / voiceBytes 以前直接沿用上一版（只列了检查失败的
1 个，漏了缺 manifest 的 26 个；文件数和字节也不准），现在一律按 actions[].voice 重新统计。

    python3 tools/app-pack/build_r2_v4.py --source-commit <40 位> --published-at "<ISO 8601>"
产物写 release/app-pack-r2-v4/：catalog.json、catalog/catalog.json、report.json、media-receipts.json、plan.json、
channels/{dev,beta,stable}.json（不上传），upload/（上传 zip + SHA256SUMS）。
"""
import argparse, hashlib, json, os, zipfile

PACK, PREV, MEDIA_PACK = "r2-v4", "r2-v3", "r2-v1"
CAT_BASE = f"https://media.uuugk.win/pack/{PACK}/"
SRC = f"release/app-pack-{PREV}"
SRC_CATALOG_SHA = "d4d0e2155740493e7a141ee1b4ffd2975eec71fa44c5dd9d1614fabd8c6557af"
OUT = f"release/app-pack-{PACK}"
VOICE_ROOT = f"{OUT}/voice-fill-r1"
SOURCE_BATCH = "2026-11-06_voice-fill-r1"
CLIPS = ("name", "primaryCue", "phase.start", "phase.peak", "phase.end")
LANGS = ("zh", "en")
CATALOG_FILES = ("catalog.json", "catalog/catalog.json", "report.json", "media-receipts.json")


def sha(b): return hashlib.sha256(b).hexdigest()
def dump(o): return (json.dumps(o, ensure_ascii=False, indent=1) + "\n").encode()


def voice_summary(cat):
    """按 actions[].voice 重新统计（修 pendingVoiceIds 只列 1 个的问题）。"""
    pending = sorted(a["id"] for a in cat["actions"] if (a.get("voice") or {}).get("status") != "ready")
    files = [f for a in cat["actions"] for f in (a.get("voice") or {}).get("files", [])]
    return {"pendingVoiceIds": pending, "voiceFiles": len(files), "voiceBytes": sum(f["bytes"] for f in files)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source-commit", required=True); ap.add_argument("--published-at", required=True)
    ap.add_argument("--alt-path-ids", default="")
    a = ap.parse_args()
    if len(a.source_commit) != 40: raise SystemExit("--source-commit 要 40 位完整提交号")
    alt = set(filter(None, a.alt_path_ids.split(",")))
    raw = open(f"{SRC}/catalog.json", "rb").read()
    if sha(raw) != SRC_CATALOG_SHA: raise SystemExit("r2-v3 catalog.json SHA 与线上不符")
    cat = json.loads(raw)
    sem = json.load(open(f"{SRC}/catalog/catalog.json", encoding="utf-8"))
    md = cat["mediaDistribution"]
    fill = sorted(os.listdir(f"{VOICE_ROOT}/packages"))
    acts = {x["id"]: x for x in cat["actions"]}
    problems, receipts, plan = [], [], []
    if sorted(set(fill) - set(acts)): problems.append(f"不在 r2-v3 的动作: {sorted(set(fill) - set(acts))}")
    for act in cat["actions"]:
        act["packRevision"] = PACK
    for i in fill:
        act = acts.get(i)
        if not act: continue
        if (act.get("voice") or {}).get("status") == "ready": problems.append(f"{i}: r2-v3 已有语音，不应补"); continue
        pdir = f"{VOICE_ROOT}/packages/{i}"
        mb = open(f"{pdir}/voice-manifest.json", "rb").read(); m = json.loads(mb)
        if m.get("status") != "technical-passed" or m["summary"]["auditFailed"]:
            problems.append(f"{i}: voice-manifest 状态 {m.get('status')} {m['summary']['auditFailed']}"); continue
        files = []
        for lang in LANGS:
            for clip in CLIPS:
                line = m["lines"][lang][clip]
                fp = f"{pdir}/voice/{lang}/{clip}.m4a"
                b = open(fp, "rb").read()
                if sha(b) != line["ref"]["sha256"] or len(b) != line["ref"]["bytes"]: problems.append(f"{fp}: 与 manifest 不符")
                rel = f"voice/{i}/{PACK}/{lang}/{clip}.m4a" if i in alt else f"voice/{i}/{lang}/{clip}.m4a"
                files.append({"language": lang, "clipId": clip, "role": line["role"], "path": rel, "sourcePath": fp,
                              "bytes": len(b), "sha256": sha(b), "durationSeconds": line["ref"]["durationSeconds"],
                              "assetName": f"{clip}.m4a", "downloadUrl": md["baseUrl"] + rel, "contentType": "audio/mp4"})
                receipts.append({"id": i, "language": lang, "clipId": clip, "path": rel, "objectKey": md["objectKeyPrefix"] + rel,
                                 "bytes": len(b), "sha256": sha(b), "text": line["text"]})
                plan.append({"id": i, "kind": "voice", "path": rel, "objectKey": md["objectKeyPrefix"] + rel,
                             "source": fp, "contentType": "audio/mp4", "bytes": len(b), "sha256": sha(b)})
        act["voice"] = {"status": "ready", "sourceBatch": SOURCE_BATCH, "revision": PACK,
                        "sourceManifest": {"path": f"{pdir}/voice-manifest.json", "sha256": sha(mb), "status": m["status"]},
                        "manualListening": "pending", "files": files}
    # SDK 规则：downloadUrl == baseUrl + path，路径唯一（媒体 + 语音）
    seen = set()
    for act in cat["actions"]:
        for f in list(act["files"].values()) + (act.get("voice") or {}).get("files", []):
            if f["path"] in seen: problems.append(f"重复路径 {f['path']}")
            seen.add(f["path"])
            if f["downloadUrl"] != md["baseUrl"] + f["path"]: problems.append(f"downloadUrl 不符 {f['path']}")
    vs = voice_summary(cat)
    if vs["pendingVoiceIds"]: problems.append(f"仍有语音 pending: {vs['pendingVoiceIds']}")
    if problems:
        print("\n".join(problems)); raise SystemExit("有问题，未写目录")
    md.update(vs)
    md["version"] = f"posehub-app-pack-{PACK}"
    md["note"] = (f"{PACK}：媒体全部沿用 {PREV} 引用（pack/{MEDIA_PACK}/ 前缀）；{len(fill)} 个动作补语音 "
                  f"voice/<id>/<lang>/<clip>.m4a（只追加）；pendingVoiceIds/voiceFiles/voiceBytes 按动作重新统计")
    cat["pack"], cat["id"], cat["sourceCommit"], cat["previousPack"] = PACK, f"app-pack-{PACK}", a.source_commit, PREV
    cat["sourceRuns"] = cat["sourceRuns"] + [{"batch": SOURCE_BATCH, "commit": a.source_commit, "selectedActions": len(fill), "replaces": "voice (pending in r2-v3)"}]
    sem["source"]["pack"], sem["source"]["previousPack"] = PACK, PREV
    sem["generatedAt"] = a.published_at
    sem_bytes = dump(sem)
    cat["semanticCatalog"].update({"bytes": len(sem_bytes), "sha256": sha(sem_bytes)})
    cb = dump(cat)
    os.makedirs(f"{OUT}/catalog", exist_ok=True); os.makedirs(f"{OUT}/channels", exist_ok=True); os.makedirs(f"{OUT}/upload", exist_ok=True)
    open(f"{OUT}/catalog.json", "wb").write(cb)
    open(f"{OUT}/catalog/catalog.json", "wb").write(sem_bytes)
    old_ptr = json.load(open(f"release/app-pack-r2-v2/channels/dev.json"))
    ptr = {"schema": 1, "pack": PACK, "catalog": CAT_BASE + "catalog.json", "catalog_sha256": sha(cb),
           "catalog_bytes": len(cb), "min_sdk": old_ptr["min_sdk"], "published_at": a.published_at}
    for ch in ("dev", "beta", "stable"): open(f"{OUT}/channels/{ch}.json", "wb").write(dump(ptr))
    rb = dump(receipts); open(f"{OUT}/media-receipts.json", "wb").write(rb)
    report = {"pack": PACK, "from": PREV, "mediaPrefix": md["objectKeyPrefix"], "catalogPrefix": f"pack/{PACK}/",
              "sourceCommit": a.source_commit, "voiceFilledActions": len(fill), "voiceFilledActionIds": fill,
              "altPathIds": sorted(alt), "mediaFilesUnchanged": md["mediaFiles"],
              "catalog": {"bytes": len(cb), "sha256": sha(cb)}, "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)},
              "mediaReceipts": {"bytes": len(rb), "sha256": sha(rb), "files": len(receipts), "totalBytes": sum(r["bytes"] for r in receipts)},
              **vs, "problems": [],
              "channelsNotUploaded": ["pack/channels/dev.json", "pack/channels/beta.json", "pack/channels/stable.json"]}
    open(f"{OUT}/report.json", "wb").write(dump(report))
    for n in CATALOG_FILES:
        b = open(f"{OUT}/{n}", "rb").read()
        plan.append({"id": None, "kind": "catalog", "path": n, "objectKey": f"pack/{PACK}/{n}", "source": f"{OUT}/{n}",
                     "contentType": "application/json", "bytes": len(b), "sha256": sha(b)})
    open(f"{OUT}/plan.json", "wb").write(dump(plan))
    # 上传包：zip 内按对象键放（确定性：固定时间戳、固定顺序、不压缩元数据差异）
    zp = f"{OUT}/upload/posehub-r2-v4-upload.zip"
    with zipfile.ZipFile(zp, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(plan, key=lambda x: x["objectKey"]):
            zi = zipfile.ZipInfo(p["objectKey"], date_time=(2026, 11, 6, 0, 0, 0)); zi.compress_type = zipfile.ZIP_DEFLATED
            zi.external_attr = 0o644 << 16
            z.writestr(zi, open(p["source"], "rb").read())
        zi = zipfile.ZipInfo("plan.json", date_time=(2026, 11, 6, 0, 0, 0)); zi.compress_type = zipfile.ZIP_DEFLATED; zi.external_attr = 0o644 << 16
        z.writestr(zi, open(f"{OUT}/plan.json", "rb").read())
    zb = open(zp, "rb").read()
    sums = "".join(f"{p['sha256']}  {p['objectKey']}\n" for p in sorted(plan, key=lambda x: x["objectKey"]))
    open(f"{OUT}/upload/SHA256SUMS", "w").write(sums)
    open(f"{OUT}/upload/zip.sha256", "w").write(f"{sha(zb)}  posehub-r2-v4-upload.zip\n")
    print(json.dumps({"catalog": report["catalog"], "semantic": report["semantic"], "mediaReceipts": report["mediaReceipts"],
                      "voiceFiles": vs["voiceFiles"], "pending": vs["pendingVoiceIds"], "uploadFiles": len(plan),
                      "uploadBytes": sum(p["bytes"] for p in plan), "zip": {"bytes": len(zb), "sha256": sha(zb)}}, ensure_ascii=False))


if __name__ == "__main__": main()
