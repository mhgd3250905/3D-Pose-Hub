#!/usr/bin/env python3
"""主题皮肤媒体 theme-r1：浅色 tech-white / 深色 neon-night（开哥 2026-11-16 18:03 选定）。

导出目录结构（渲染机用与 r2-v14 相同的生产导出器与参数，只换皮肤）：
  <root>/media/<id>/theme-r1/<id>.<theme>.rgb-alpha.mp4
  <root>/media/<id>/theme-r1/<id>.<theme>.cover.alpha.webp
  <root>/media/<id>/theme-r1/<id>.<theme>.thumbnail.alpha.webp
theme ∈ light(tech-white) / dark(neon-night)；249 × 2 × 3 = 1494 个文件。

本脚本只做核对并写上传清单 <root>/plan.json 与 <root>/theme-media.json（每动作每主题的 path/bytes/sha256/尺寸，
供之后生成新 catalog 用）。不上传、不改 catalog、不动指针。
用法：python tools/theme-skins/plan_theme_media.py --root F:/PoseHub-v3/app-pack/theme-r1
退出码 0 = 全部齐全且尺寸/编码与 r2-v14 一致；1 = 有问题（见 problems）。
"""
import argparse, hashlib, json, os, subprocess, sys

REV = "theme-r1"
PREFIX = "pack/r2-v1/"
BASE = "https://media.uuugk.win/" + PREFIX
THEMES = {"light": "tech-white", "dark": "neon-night"}
KINDS = {"video": ("rgb-alpha.mp4", "video/mp4", (720, 1440)),
         "cover": ("cover.alpha.webp", "image/webp", (640, 640)),
         "thumbnail": ("thumbnail.alpha.webp", "image/webp", (192, 192))}

def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()

def probe(p):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height,codec_name,pix_fmt", "-of", "json", p], capture_output=True, text=True)
    s = json.loads(o.stdout or "{}").get("streams") or [{}]
    return s[0]

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--root", required=True)
    a = ap.parse_args()
    here = os.path.dirname(os.path.abspath(__file__))
    ids = json.load(open(os.path.join(here, "actions.json"), encoding="utf-8"))["actions"]
    problems, plan, media = [], [], {}
    for i in ids:
        media[i] = {}
        for th, skin in THEMES.items():
            ent = {"skin": skin}
            for kind, (suf, ctype, size) in KINDS.items():
                rel = f"media/{i}/{REV}/{i}.{th}.{suf}"
                fp = os.path.join(a.root, rel)
                if not os.path.isfile(fp) or os.path.getsize(fp) == 0:
                    problems.append(f"缺文件或空文件 {rel}"); continue
                pr = probe(fp); w, h = int(pr.get("width", 0)), int(pr.get("height", 0))
                if (w, h) != size: problems.append(f"{rel}: 尺寸 {w}x{h} ≠ {size[0]}x{size[1]}")
                f = {"path": rel, "bytes": os.path.getsize(fp), "sha256": sha(fp), "width": w, "height": h,
                     "assetName": os.path.basename(rel), "downloadUrl": BASE + rel, "status": "ready"}
                if kind == "video":
                    f.update({"codec": pr.get("codec_name"), "pixelFormat": pr.get("pix_fmt")})
                    if (f["codec"], f["pixelFormat"]) != ("h264", "yuv420p"): problems.append(f"{rel}: 编码 {f['codec']}/{f['pixelFormat']}")
                else:
                    f["alpha"] = True
                ent[kind] = f
                plan.append({"id": i, "theme": th, "kind": kind, "path": rel, "objectKey": PREFIX + rel, "source": fp,
                             "contentType": ctype, "bytes": f["bytes"], "sha256": f["sha256"]})
            media[i][th] = ent
    out = {"revision": REV, "themes": THEMES, "actions": len(ids), "files": len(plan),
           "bytes": sum(p["bytes"] for p in plan), "problemCount": len(problems), "problems": problems[:200]}
    json.dump(plan, open(os.path.join(a.root, "plan.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump({"revision": REV, "baseUrl": BASE, "objectKeyPrefix": PREFIX, "themes": THEMES, "media": media},
              open(os.path.join(a.root, "theme-media.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(out, ensure_ascii=False))
    sys.exit(1 if problems else 0)

if __name__ == "__main__":
    main()
