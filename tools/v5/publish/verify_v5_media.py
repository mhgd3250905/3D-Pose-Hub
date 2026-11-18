#!/usr/bin/env python3
"""r2-v18（V5 换片）媒体核对。对 build_r2_v18.py 写出的 catalog.json，逐个核对 249 × 3 个成片（video/cover/thumbnail）
的字节数与 SHA-256，并确认路径都是 media/<id>/r2-v18/。

  # 上传前（本地文件，--media-root 是导出目录）：
  python tools/v5/publish/verify_v5_media.py local  F:/PoseHub-v3/app-pack/r2-v18/catalog.json --media-root F:/PoseHub-v3/app-pack/r2-v18
  # 上传后（公网 CDN 回读，串行、每个间隔 0.2 秒、429/5xx 退避 2/4/8/16/32/60 秒）：
  python tools/v5/publish/verify_v5_media.py online F:/PoseHub-v3/app-pack/r2-v18/catalog.json
最后一行打印一个 JSON：{"mode","checked","ok","failed","problems":[前 30 条]}。全部通过退出码 0，否则 1。
只读，不上传、不改任何文件（结果另存 <catalog 目录>/verify-<mode>.json）。
"""
import argparse, hashlib, json, os, sys, time, urllib.error, urllib.request

PACK = "r2-v18"
KINDS = ("video", "cover", "thumbnail")
BACKOFF = (2, 4, 8, 16, 32, 60)


def sha_file(p):
    h = hashlib.sha256(); n = 0
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b); n += len(b)
    return h.hexdigest(), n


def fetch(url):
    last = None
    for wait in (0,) + BACKOFF:
        if wait: time.sleep(wait)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "posehub-verify-v5", "Cache-Control": "no-cache"})
            with urllib.request.urlopen(req, timeout=120) as r: return r.read(), None
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}"
            if e.code != 429 and e.code < 500: return None, last
        except Exception as e:  # 网络错误也退避重试
            last = str(e)
    return None, last


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=("local", "online")); ap.add_argument("catalog")
    ap.add_argument("--media-root"); ap.add_argument("--interval", type=float, default=0.2)
    a = ap.parse_args()
    if a.mode == "local" and not a.media_root: raise SystemExit("local 需要 --media-root")
    c = json.load(open(a.catalog, encoding="utf-8"))
    problems, rows = [], []
    if c.get("pack") != PACK: problems.append(f"catalog pack {c.get('pack')} ≠ {PACK}")
    if len(c["actions"]) != 249: problems.append(f"动作数 {len(c['actions'])} ≠ 249")
    for act in c["actions"]:
        i = act["id"]
        for k in KINDS:
            f = act["files"].get(k)
            if not f: problems.append(f"{i}.{k} 缺"); continue
            if not f["path"].startswith(f"media/{i}/{PACK}/"): problems.append(f"{i}.{k} 路径不是 {PACK}：{f['path']}")
            if a.mode == "local":
                fp = os.path.join(a.media_root, f["path"])
                if not os.path.isfile(fp): problems.append(f"缺文件 {f['path']}"); rows.append({"path": f["path"], "ok": False}); continue
                h, n = sha_file(fp)
            else:
                b, err = fetch(f["downloadUrl"]); time.sleep(a.interval)
                if b is None: problems.append(f"下载失败 {f['path']} {err}"); rows.append({"path": f["path"], "ok": False, "err": err}); continue
                h, n = hashlib.sha256(b).hexdigest(), len(b)
            ok = (n == f["bytes"] and h == f["sha256"])
            if not ok: problems.append(f"不一致 {f['path']}：{n}/{h[:12]} ≠ 目录 {f['bytes']}/{(f['sha256'] or '')[:12]}")
            rows.append({"path": f["path"], "ok": ok, "bytes": n, "sha256": h})
    out = {"mode": a.mode, "checked": len(rows), "ok": sum(r["ok"] for r in rows), "failed": sum(not r["ok"] for r in rows),
           "problemCount": len(problems), "problems": problems[:30]}
    json.dump({**out, "problems": problems, "rows": rows}, open(os.path.join(os.path.dirname(os.path.abspath(a.catalog)), f"verify-{a.mode}.json"), "w",
              encoding="utf-8"), ensure_ascii=False, indent=0)
    print(json.dumps(out, ensure_ascii=False))
    sys.exit(0 if not problems and out["checked"] == 747 else 1)


if __name__ == "__main__": main()
