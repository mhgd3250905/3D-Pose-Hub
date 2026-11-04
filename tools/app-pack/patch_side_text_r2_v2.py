"""r2-v1 → r2-v2：只换 23 个单侧轮流动作的口令文本（与 unilateral 一致）+ 3 条重产的 primaryCue 语音。

    python3 tools/app-pack/patch_side_text_r2_v2.py --changes <changes.json> --voice-root <dir> --out release/app-pack-r2-v2

输入：release/app-pack-r2-v1（基线，不改）、catalog/production/v3-text（已改好的源文本）。
新语音放在 r2-v1 媒体根下的新路径 voice/<id>/r2-v2/<lang>/primaryCue.m4a（只追加，不覆盖旧文件）。
产物：catalog.json → pack/r2-v2/catalog.json；catalog/catalog.json → pack/r2-v2/catalog/catalog.json；
channels/*.json → pack/channels/（需用户批准再传）；upload/ 下是要追加上传到 pack/r2-v1/ 的语音。
"""
import argparse, hashlib, json, os, shutil
PACK, OLD = "r2-v2", "r2-v1"
BASE = f"https://media.uuugk.win/pack/{PACK}/"
MEDIA_BASE = f"https://media.uuugk.win/pack/{OLD}/"
SRC = "release/app-pack-r2-v1"

def sha(b): return hashlib.sha256(b).hexdigest()
def dump(o): return (json.dumps(o, ensure_ascii=False, indent=1) + "\n").encode()

def replace_str(o, rep):
    if isinstance(o, str): return rep.get(o, o)
    if isinstance(o, list): return [replace_str(x, rep) for x in o]
    if isinstance(o, dict): return {k: replace_str(v, rep) for k, v in o.items()}
    return o

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--changes", required=True); ap.add_argument("--voice-root", required=True)
    ap.add_argument("--out", required=True); ap.add_argument("--published-at", required=True)
    ap.add_argument("--source-commit", required=True)
    a = ap.parse_args()
    changes = {c["id"]: c for c in json.load(open(a.changes, encoding="utf-8"))}
    clips = json.load(open(os.path.join(a.voice_root, "clips.json"), encoding="utf-8"))
    cat = json.load(open(f"{SRC}/catalog.json", encoding="utf-8"))
    sem = json.load(open(f"{SRC}/catalog/catalog.json", encoding="utf-8"))
    upload = []
    for act in cat["actions"]:
        act["packRevision"] = PACK
        c = changes.get(act["id"])
        if not c: continue
        rep = {}
        for ch in c["changes"]:
            for lang in ("zh", "en"): rep[ch["old"][lang]] = ch["new"][lang]
        files = act.get("voice", {}).get("files", [])
        act.update(replace_str({k: v for k, v in act.items() if k not in ("voice", "files")}, rep))
        act["revision"] = f"{act['id']}-{PACK}"
        tpath = f"catalog/production/v3-text/{act['id']}.json"
        tsha = sha(open(tpath, "rb").read())
        ph = json.load(open(tpath, encoding="utf-8"))
        act["poseHubText"] = ph
        es = act["rhythm"]["executionSource"]
        if es.get("path") == tpath: es["sha256"] = tsha
        for ev in act.get("trainingSemantics", {}).get("evidence", []):
            if ev.get("path") == tpath and "sha256" in ev: ev["sha256"] = tsha
        for f in files:
            k = f"{act['id']}/{f['language']}"
            if f["clipId"] == "primaryCue" and k in clips:
                src = os.path.join(a.voice_root, "voice", act["id"], f["language"], "primaryCue.m4a")
                b = open(src, "rb").read()
                rel = f"voice/{act['id']}/{PACK}/{f['language']}/primaryCue.m4a"
                f.update({"path": rel, "sourcePath": f"release/app-pack-{PACK}/upload/pack/{OLD}/{rel}", "bytes": len(b),
                          "sha256": sha(b), "durationSeconds": clips[k]["ref"]["durationSeconds"],
                          "downloadUrl": MEDIA_BASE + rel})
                dst = os.path.join(a.out, "upload", "pack", OLD, rel)
                os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(src, dst)
                upload.append({"key": f"pack/{OLD}/{rel}", "bytes": len(b), "sha256": sha(b)})
    for d in sem["drills"]:
        c = changes.get(d["id"])
        if not c: continue
        rep = {}
        for ch in c["changes"]:
            for lang in ("zh", "en"): rep[ch["old"][lang]] = ch["new"][lang]
        d.update(replace_str(d, rep))
    sem["source"]["pack"] = PACK
    sem["source"]["previousPack"] = OLD
    sem["generatedAt"] = a.published_at
    sem_bytes = dump(sem)
    cat["pack"], cat["id"], cat["sourceCommit"] = PACK, f"app-pack-{PACK}", a.source_commit
    cat["previousPack"] = OLD
    cat["semanticCatalog"].update({"bytes": len(sem_bytes), "sha256": sha(sem_bytes)})
    cat_bytes = dump(cat)
    os.makedirs(os.path.join(a.out, "catalog"), exist_ok=True); os.makedirs(os.path.join(a.out, "channels"), exist_ok=True)
    open(os.path.join(a.out, "catalog.json"), "wb").write(cat_bytes)
    open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
    old_ptr = json.load(open(f"{SRC}/channels/dev.json"))
    ptr = {"schema": 1, "pack": PACK, "catalog": BASE + "catalog.json", "catalog_sha256": sha(cat_bytes),
           "catalog_bytes": len(cat_bytes), "min_sdk": old_ptr["min_sdk"], "published_at": a.published_at}
    for ch in ("dev", "beta", "stable"): open(os.path.join(a.out, "channels", f"{ch}.json"), "wb").write(dump(ptr))
    report = {"pack": PACK, "from": OLD, "changedActions": sorted(changes), "catalog": {"bytes": len(cat_bytes), "sha256": sha(cat_bytes)},
              "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)}, "voiceUpload": upload,
              "upload": [f"pack/{PACK}/catalog.json", f"pack/{PACK}/catalog/catalog.json"] + [u["key"] for u in upload],
              "channelsNotUploaded": ["pack/channels/dev.json", "pack/channels/beta.json", "pack/channels/stable.json"]}
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    print(json.dumps({k: report[k] for k in ("catalog", "semantic")}, ensure_ascii=False), len(upload))

if __name__ == "__main__": main()
