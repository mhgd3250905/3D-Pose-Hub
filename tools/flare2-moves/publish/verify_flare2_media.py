#!/usr/bin/env python3
"""r2-v20（Flare 2.0 新动作 8 个）核对。照抄 tools/thomas-sup/publish/verify_flare2_media.py（r2-v19）。只读：不上传、不改任何对象（结果另存 <catalog 目录>/verify-<mode>.json）。

  # 上传前，本地文件（24 个成片 + 新语音）字节数与 SHA-256 对目录：
  python tools/thomas-sup/publish/verify_flare2_media.py local  <out>/catalog.json --media-root <导出目录> --voice-root <语音目录>
  # 上传前，确认要上传的对象键在线上都还不存在（不覆盖）：
  python tools/thomas-sup/publish/verify_flare2_media.py absent <out>/catalog.json --plan <out>/plan.json
  # 上传后，公网 CDN 回读（新对象全部 + pack/r2-v20 目录 4 个文件 + 抽查 r2-v19 旧对象 6+2 个动作的 24 个成片没被动过）：
  python tools/thomas-sup/publish/verify_flare2_media.py online <out>/catalog.json --plan <out>/plan.json
串行、每个间隔 0.2 秒、429/5xx/网络错误退避 2/4/8/16/32/60 秒。
另外每种模式都核对：pack = r2-v20、269 个动作、前 261 个与 r2-v19 基线逐字段相同、新 8 个的成片/语音路径都是 r2-v20 新键。
最后一行打印 JSON：{"mode","checked","ok","failed","problemCount","problems":[前 30 条]}。全部通过退出码 0，否则 1。
"""
import argparse, hashlib, json, os, sys, time, urllib.error, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PACK, N_OLD, N_NEW = "r2-v20", 261, 8
BASE = os.path.join(HERE, "base-r2-v19", "catalog.json")
ORIGIN = "https://media.uuugk.win/"
BACKOFF = (2, 4, 8, 16, 32, 60)
SPOT_OLD = 6   # online：抽查 r2-v19 旧动作的成片对象（前 N 个动作 × 3，r2-v18 部分）没被动过
SPOT_TS = 2    # online：再抽查 r2-v19 托马斯补充前 N 个动作 × 3 个成片（r2-v19 新键）没被动过


def sha_file(p):
    h = hashlib.sha256(); n = 0
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b); n += len(b)
    return h.hexdigest(), n


def fetch(url, method="GET"):
    last = None
    for wait in (0,) + BACKOFF:
        if wait: time.sleep(wait)
        try:
            req = urllib.request.Request(url, method=method, headers={"User-Agent": "posehub-verify-flare2", "Cache-Control": "no-cache"})
            with urllib.request.urlopen(req, timeout=120) as r: return r.status, (r.read() if method == "GET" else b""), None
        except urllib.error.HTTPError as e:
            last = f"HTTP {e.code}"
            if e.code != 429 and e.code < 500: return e.code, None, last
        except Exception as e:
            last = str(e)
    return None, None, last


def structure(c, problems):
    base = json.load(open(BASE, encoding="utf-8"))
    if c.get("pack") != PACK: problems.append(f"catalog pack {c.get('pack')} ≠ {PACK}")
    acts = c.get("actions") or []
    if len(acts) != N_OLD + N_NEW: problems.append(f"动作数 {len(acts)} ≠ {N_OLD + N_NEW}")
    for x, y in zip(acts, base["actions"]):
        if x != y: problems.append(f"{y['id']}: 与 r2-v19 基线不同")
    if c.get("voiceCommon") != base["voiceCommon"]: problems.append("voiceCommon 与 r2-v19 不同")
    new = acts[N_OLD:]
    for a in new:
        for k, f in a["files"].items():
            if not f["path"].startswith(f"media/{a['id']}/{PACK}/"): problems.append(f"{a['id']}.{k} 不是 {PACK} 新键：{f['path']}")
        for f in (a.get("voice") or {}).get("files", []):
            if not f["path"].startswith(f"voice/{a['id']}/{PACK}/"): problems.append(f"{a['id']} 语音不是 {PACK} 新键：{f['path']}")
        if (a.get("voice") or {}).get("status") != "ready": problems.append(f"{a['id']}: 语音 {(a.get('voice') or {}).get('status')}")
    return base, new


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("mode", choices=("local", "absent", "online")); ap.add_argument("catalog")
    ap.add_argument("--media-root"); ap.add_argument("--voice-root"); ap.add_argument("--plan")
    ap.add_argument("--interval", type=float, default=0.2)
    a = ap.parse_args()
    if a.mode == "local" and not (a.media_root and a.voice_root): raise SystemExit("local 需要 --media-root 和 --voice-root")
    if a.mode in ("absent", "online") and not a.plan: raise SystemExit(f"{a.mode} 需要 --plan")
    c = json.load(open(a.catalog, encoding="utf-8"))
    problems, rows = [], []
    base, new = structure(c, problems)
    files = [(x["id"], f) for x in new for f in list(x["files"].values()) + (x.get("voice") or {}).get("files", [])]
    if a.mode == "local":
        for i, f in files:
            fp = os.path.join(a.voice_root, "packages", i, f["sourcePath"].split(f"packages/{i}/", 1)[1]) if f["path"].startswith("voice/") \
                else os.path.join(a.media_root, f["path"])
            if not os.path.isfile(fp): problems.append(f"缺文件 {f['path']}"); rows.append({"path": f["path"], "ok": False}); continue
            h, n = sha_file(fp); ok = (n == f["bytes"] and h == f["sha256"])
            if not ok: problems.append(f"不一致 {f['path']}：{n}/{h[:12]} ≠ 目录 {f['bytes']}/{(f['sha256'] or '')[:12]}")
            rows.append({"path": f["path"], "ok": ok})
    else:
        plan = json.load(open(a.plan, encoding="utf-8"))
        if any(e["objectKey"].startswith("pack/channels/") for e in plan): problems.append("plan.json 含渠道指针（不允许）")
        want = {e["objectKey"]: e for e in plan}
        for i, f in files:
            key = c["mediaDistribution"]["objectKeyPrefix"] + f["path"]
            if key not in want: problems.append(f"plan.json 缺 {key}")
        if a.mode == "absent":
            for e in plan:
                st, _, err = fetch(ORIGIN + e["objectKey"], "HEAD"); time.sleep(a.interval)
                ok = st == 404
                if not ok: problems.append(f"已存在或读不到 {e['objectKey']}（{st or err}）")
                rows.append({"objectKey": e["objectKey"], "ok": ok, "status": st})
        else:
            checks = [(e["objectKey"], e["bytes"], e["sha256"]) for e in plan]
            for x in base["actions"][:SPOT_OLD] + base["actions"][249:249 + SPOT_TS]:
                for f in x["files"].values(): checks.append((base["mediaDistribution"]["objectKeyPrefix"] + f["path"], f["bytes"], f["sha256"]))
            for key, nb, hs in checks:
                st, b, err = fetch(ORIGIN + key); time.sleep(a.interval)
                if b is None: problems.append(f"下载失败 {key} {err}"); rows.append({"objectKey": key, "ok": False, "err": err}); continue
                h, n = hashlib.sha256(b).hexdigest(), len(b); ok = (n == nb and h == hs)
                if not ok: problems.append(f"不一致 {key}：{n}/{h[:12]} ≠ {nb}/{hs[:12]}")
                rows.append({"objectKey": key, "ok": ok})
    out = {"mode": a.mode, "checked": len(rows), "ok": sum(r["ok"] for r in rows), "failed": sum(not r["ok"] for r in rows),
           "problemCount": len(problems), "problems": problems[:30]}
    json.dump({**out, "problems": problems, "rows": rows}, open(os.path.join(os.path.dirname(os.path.abspath(a.catalog)), f"verify-{a.mode}.json"), "w",
              encoding="utf-8"), ensure_ascii=False, indent=0)
    print(json.dumps(out, ensure_ascii=False))
    sys.exit(0 if not problems and out["checked"] > 0 else 1)


if __name__ == "__main__": main()
