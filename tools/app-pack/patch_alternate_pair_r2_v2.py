"""r2-v1 → r2-v2：把左右轮流动作的计数单位写进 rhythm.execution（文本、语音、媒体都不变）。

    python3 tools/app-pack/patch_alternate_pair_r2_v2.py --out release/app-pack-r2-v2 \
        --published-at 2026-11-05T00:00:00Z --source-commit <sha>

对 r2-v1 里 unilateral=true 且 v3-text training 为 perSide=alternate、repUnit=left+right 的动作，
在 rhythm.execution 追加 perSide / repUnit / startingSide（startingSide 取 v3-text）。
SDK 的 Rhythm.fromJson(execution) 据此把「一左一右算 1 次」当一组计数，不再按单侧分两段。
旧 SDK 忽略这三个字段，行为与 r2-v1 相同。
输入只读 release/app-pack-r2-v1 与 catalog/production/v3-text；r2-v1 文件不改，媒体沿用 pack/r2-v1/ 路径。
"""
import argparse, hashlib, json, os
PACK, OLD = "r2-v2", "r2-v1"
BASE = f"https://media.uuugk.win/pack/{PACK}/"
SRC = f"release/app-pack-{OLD}"

def sha(b): return hashlib.sha256(b).hexdigest()
def dump(o): return (json.dumps(o, ensure_ascii=False, indent=1) + "\n").encode()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True); ap.add_argument("--published-at", required=True)
    ap.add_argument("--source-commit", required=True)
    a = ap.parse_args()
    cat = json.load(open(f"{SRC}/catalog.json", encoding="utf-8"))
    sem = json.load(open(f"{SRC}/catalog/catalog.json", encoding="utf-8"))
    changed = []
    for act in cat["actions"]:
        act["packRevision"] = PACK
        tpath = f"catalog/production/v3-text/{act['id']}.json"
        if not os.path.exists(tpath): continue
        t = json.load(open(tpath, encoding="utf-8"))
        tr = t.get("training") or {}
        if not (act.get("unilateral") and tr.get("perSide") == "alternate" and tr.get("repUnit") == "left+right"):
            continue
        side = t.get("startingSide")
        if side not in ("left", "right"): raise SystemExit(f"{act['id']}: startingSide {side!r}")
        ex = act["rhythm"]["execution"]
        if ex.get("kind") != "rep_alternate": raise SystemExit(f"{act['id']}: execution.kind {ex.get('kind')}")
        ex.update({"perSide": "alternate", "repUnit": "left+right", "startingSide": side})
        act["revision"] = f"{act['id']}-{PACK}"
        changed.append({"id": act["id"], "nameZh": act["nameZh"], "startingSide": side})
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
    report = {"pack": PACK, "from": OLD, "change": "rhythm.execution += perSide/repUnit/startingSide（左右轮流动作）",
              "changedActions": changed, "catalog": {"bytes": len(cat_bytes), "sha256": sha(cat_bytes)},
              "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)},
              "upload": [f"pack/{PACK}/catalog.json", f"pack/{PACK}/catalog/catalog.json"],
              "channelsNotUploaded": ["pack/channels/dev.json", "pack/channels/beta.json", "pack/channels/stable.json"]}
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    print(len(changed), json.dumps({k: report[k] for k in ("catalog", "semantic")}, ensure_ascii=False))

if __name__ == "__main__": main()
