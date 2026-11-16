#!/usr/bin/env python3
"""r2-v16 → r2-v17：主题皮肤 theme-r1（开哥 2026-11-16 21:39 同意：发带主题的新 pack、只让新 SDK 读、合 SDK PR #31、SF 出包）。

只加一样：每个动作 files.themes.light / files.themes.dark（tech-white / neon-night），内容逐字取自
qa/theme-r1-1116 的 theme-media.json（渲染机 2026-11-16 上传核验 1494/1494）。原 files.video/cover/thumbnail、
语音、文字、状态标志全部沿用 r2-v16，不改。

兼容：已发布的 SDK 0.8.0 会拒收 themes 字段，所以指针 min_sdk = 0.9.0（SDK PR #31 把 poseHubCatalogSdkVersion 升到 0.9.0）。
旧 App 看到 min_sdk 高于自身就跳过，继续用 r2-v16；新 App 才换到 r2-v17。

  python3 tools/theme-skins/build_r2_v17.py --out <dir> --source-commit <40 位> \
      --r2-v16 <dir 含 catalog.json 与 catalog/catalog.json> --theme-media <theme-media.json>
写 catalog.json、catalog/catalog.json、report.json、plan.json（只有目录文件，媒体已上线）、channels/{dev,beta,stable}.json。
有问题列出并拒绝写目录（退出码 1）。
"""
import argparse, copy, hashlib, json, os, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app-pack"))
from catalog_pointer import default_published_at, published_at, validate_catalog_pointer  # noqa: E402

PACK, PREV = "r2-v17", "r2-v16"
CAT_BASE = f"https://media.uuugk.win/pack/{PACK}/"
SRC_CATALOG_SHA = "c8536ffcf13e677449c251720183bcf099ae5ca166182026be411544d9bfa562"
SRC_SEMANTIC_SHA = "03d61ba5baa08b22026240f7dc645dd62d041664e5d17c2d0ad68e2d9ec17820"
THEME_MEDIA_SHA = "e063e8e2725423cd01e6f08a3857db3b96a8d9bf4f793f13dcb0f3bd0d71d2e8"
MIN_SDK = "0.9.0"
THEMES = {"light": "tech-white", "dark": "neon-night"}
KINDS = ("video", "cover", "thumbnail")
SIZES = {"video": (720, 1440), "cover": (640, 640), "thumbnail": (192, 192)}


def sha(b): return hashlib.sha256(b).hexdigest()
def rd(p): return open(p, "rb").read()
def dump(o): return (json.dumps(o, ensure_ascii=False, indent=1) + "\n").encode()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", required=True); ap.add_argument("--source-commit", required=True)
    ap.add_argument("--r2-v16", required=True); ap.add_argument("--theme-media", required=True)
    ap.add_argument("--published-at", type=published_at, default=default_published_at())
    a = ap.parse_args()
    if len(a.source_commit) != 40: raise SystemExit("--source-commit 要 40 位完整提交号")
    raw, sraw, traw = rd(os.path.join(a.r2_v16, "catalog.json")), rd(os.path.join(a.r2_v16, "catalog", "catalog.json")), rd(a.theme_media)
    if sha(raw) != SRC_CATALOG_SHA: raise SystemExit("r2-v16 catalog.json SHA 不符")
    if sha(sraw) != SRC_SEMANTIC_SHA: raise SystemExit("r2-v16 catalog/catalog.json SHA 不符")
    if sha(traw) != THEME_MEDIA_SHA: raise SystemExit("theme-media.json SHA 不符")
    cat, sem, tm = json.loads(raw), json.loads(sraw), json.loads(traw)
    before = copy.deepcopy(cat)
    md = cat["mediaDistribution"]; base, prefix = md["baseUrl"], md["objectKeyPrefix"]
    problems = []
    if tm["themes"] != THEMES: problems.append(f"theme-media themes {tm['themes']} ≠ {THEMES}")
    if tm["baseUrl"] != base or tm["objectKeyPrefix"] != prefix: problems.append("theme-media baseUrl/objectKeyPrefix 与 r2-v16 不符")
    ids = [x["id"] for x in cat["actions"]]
    if set(ids) != set(tm["media"]): problems.append(f"动作不符 目录多 {sorted(set(ids) - set(tm['media']))} 主题多 {sorted(set(tm['media']) - set(ids))}")
    seen = {f["path"] for x in cat["actions"] for f in x["files"].values()}
    files_n = bytes_n = 0
    for act in cat["actions"]:
        i = act["id"]; m = tm["media"].get(i)
        if m is None: continue
        themes = {}
        for th, skin in THEMES.items():
            e = m.get(th)
            if not e or e.get("skin") != skin: problems.append(f"{i}: {th} 缺或皮肤不符"); continue
            for k in KINDS:
                f = e.get(k) or {}
                want_path = f"media/{i}/theme-r1/{i}.{th}." + {"video": "rgb-alpha.mp4", "cover": "cover.alpha.webp", "thumbnail": "thumbnail.alpha.webp"}[k]
                if f.get("path") != want_path: problems.append(f"{i}: {th}.{k} path {f.get('path')}")
                if f.get("downloadUrl") != base + want_path: problems.append(f"{i}: {th}.{k} downloadUrl 不符")
                if (f.get("width"), f.get("height")) != SIZES[k]: problems.append(f"{i}: {th}.{k} 尺寸 {f.get('width')}x{f.get('height')}")
                if f.get("status") != "ready" or not isinstance(f.get("bytes"), int) or f["bytes"] <= 0 or len(f.get("sha256") or "") != 64:
                    problems.append(f"{i}: {th}.{k} 状态/字节/SHA 不全")
                if set(f) - set(act["files"][k]) - {"alpha"}: problems.append(f"{i}: {th}.{k} 多出字段 {sorted(set(f) - set(act['files'][k]))}")
                if f.get("path") in seen: problems.append(f"重复路径 {f.get('path')}")
                seen.add(f.get("path")); files_n += 1; bytes_n += f.get("bytes") or 0
            themes[th] = {"skin": skin, **{k: e[k] for k in KINDS}}
        act["files"]["themes"] = themes
    # 其余逐字不变
    for x, y in zip(cat["actions"], before["actions"]):
        xx = copy.deepcopy(x); xx["files"].pop("themes", None)
        if xx != y: problems.append(f"{x['id']}: 除 themes 外有改动")
    if files_n != 1494: problems.append(f"主题文件 {files_n} ≠ 1494")
    md.update({"version": f"posehub-app-pack-{PACK}", "themeRevision": tm["revision"], "themes": THEMES,
               "themeFiles": files_n, "themeBytes": bytes_n,
               "note": f"{PACK}：主题皮肤 theme-r1——每个动作 files.themes.light（tech-white）/ dark（neon-night），"
                       f"对象 media/<id>/theme-r1/；原 files.video/cover/thumbnail 与语音沿用 {PREV}，作旧版与缺主题回退。min_sdk {MIN_SDK}。"})
    cat["sourceRuns"] = cat["sourceRuns"] + [{"batch": "theme-r1", "commit": a.source_commit, "selectedActions": len(ids),
                                              "replaces": "adds files.themes (light tech-white / dark neon-night)"}]
    cat["pack"], cat["id"], cat["sourceCommit"], cat["previousPack"] = PACK, f"app-pack-{PACK}", a.source_commit, PREV
    sem["source"].update({"pack": PACK, "previousPack": PREV, "commit": a.source_commit})
    sem["generatedAt"] = a.published_at
    sem_bytes = dump(sem); cat["semanticCatalog"].update({"bytes": len(sem_bytes), "sha256": sha(sem_bytes)})
    report = {"pack": PACK, "from": PREV, "fromCatalogSha256": SRC_CATALOG_SHA, "themeMediaSha256": THEME_MEDIA_SHA,
              "mediaPrefix": prefix, "catalogPrefix": f"pack/{PACK}/", "sourceCommit": a.source_commit, "actions": len(ids),
              "themeFiles": files_n, "themeBytes": bytes_n, "minSdk": MIN_SDK, "problems": problems, "problemCount": len(problems)}
    os.makedirs(os.path.join(a.out, "catalog"), exist_ok=True)
    if problems:
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print("\n".join(problems[:50])); print(json.dumps({"error": f"{len(problems)} 个问题，未写目录", "problemCount": len(problems)}, ensure_ascii=False)); sys.exit(1)
    cb = dump(cat)
    ptr = {"schema": 1, "pack": PACK, "catalog": CAT_BASE + "catalog.json", "catalog_sha256": sha(cb), "catalog_bytes": len(cb),
           "min_sdk": MIN_SDK, "published_at": a.published_at}
    validate_catalog_pointer(ptr)
    open(os.path.join(a.out, "catalog.json"), "wb").write(cb); open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
    os.makedirs(os.path.join(a.out, "channels"), exist_ok=True)
    for ch in ("dev", "beta", "stable"): open(os.path.join(a.out, "channels", f"{ch}.json"), "wb").write(dump(ptr))
    report.update({"catalog": {"bytes": len(cb), "sha256": sha(cb)}, "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)}, "pointer": ptr})
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    plan = []
    for nme in ("catalog.json", "catalog/catalog.json", "report.json"):
        b = rd(os.path.join(a.out, nme))
        plan.append({"id": None, "kind": "catalog", "path": nme, "objectKey": f"pack/{PACK}/{nme}", "source": nme,
                     "contentType": "application/json", "bytes": len(b), "sha256": sha(b)})
    open(os.path.join(a.out, "plan.json"), "wb").write(dump(plan))
    print(json.dumps({"problemCount": 0, "catalog": report["catalog"], "semantic": report["semantic"], "themeFiles": files_n,
                      "themeBytes": bytes_n, "pointer": ptr}, ensure_ascii=False))


if __name__ == "__main__": main()
