#!/usr/bin/env python3
"""build_r2_v21.py / verify_flare2_media.py 的沙箱自测（小样数据，不联网，不上传）。照抄 tools/flare2-moves/publish/test_publish.py（r2-v20）。

    python3 tools/flare2-moves-r2/publish/test_publish.py [--keep <dir>]

用 make_fixture.py --fake-voice 生成 6 个动作的小样母帧清单/成片/语音，然后：
  1. 草稿构建 problemCount 0；
  2. 定稿构建 problemCount 0：275 个动作、前 269 个与 r2-v20 逐字节相同、18 成片 + 102 语音 + 4 目录 = 124 个上传对象、
     plan.json 没有任何 pack/channels/ 键、没写 channels/ 目录、deferred 的 t-child-pose-side-reach 不在目录里；
  3. 本地核对 120/120；
  4. 反例必须被拦下：缺一个成片 → 构建拒绝；语音清单文字与文字稿不同 → 构建拒绝；母帧配方 SHA 不符 → 构建拒绝；
     pack-fields 多一个动作（如 deferred 的 id）→ 构建拒绝；导出文件被改一个字节 → 本地核对失败；
     目录里旧动作（r2-v18 / 托马斯补充 / Flare r1 各一个）被改 → 本地核对失败；
  5. verify 的网络重试（本机 127.0.0.1 假服务器，不碰线上）：GET 正文 IncompleteRead、连接被重置、503 → 退避后读到完整正文；
     404 立即返回不重试；一直截断 → 最终失败（不当作通过）。
最后一行打印 JSON {"passed": n, "failed": [...]}；全部通过退出码 0。
"""
import argparse, http.server, json, os, shutil, socket, subprocess, sys, tempfile, threading

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
PY = sys.executable
N_OLD, N_NEW = 269, 6
DEFERRED = "t-child-pose-side-reach"


def run(*a):
    p = subprocess.run([PY, *a], cwd=ROOT, capture_output=True, text=True)
    last = (p.stdout.strip().splitlines() or [""])[-1]
    try: j = json.loads(last)
    except Exception: j = {"raw": last, "stderr": p.stderr[-500:]}
    return p.returncode, j


def fetch_tests(check):
    """verify_flare2_media.fetch 的重试规则（只连本机假服务器）。"""
    for k in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY", "all_proxy", "ALL_PROXY"): os.environ.pop(k, None)
    os.environ["no_proxy"] = os.environ["NO_PROXY"] = "127.0.0.1,localhost"
    sys.path.insert(0, HERE)
    import verify_flare2_media as V
    V.BACKOFF = (0.01,) * 6
    body = b"x" * 1000
    hits = {}

    class H(http.server.BaseHTTPRequestHandler):
        def log_message(self, *a): pass

        def do_GET(self):
            n = hits[self.path] = hits.get(self.path, 0) + 1
            if self.path == "/incomplete" and n == 1 or self.path == "/always-incomplete":
                self.send_response(200); self.send_header("Content-Length", str(len(body))); self.end_headers()
                self.wfile.write(body[:400]); self.wfile.flush(); self.connection.shutdown(socket.SHUT_RDWR); return
            if self.path == "/reset" and n == 1:
                self.connection.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, b"\x01\x00\x00\x00\x00\x00\x00\x00")
                self.connection.close(); return
            if self.path == "/503" and n <= 2:
                self.send_response(503); self.send_header("Content-Length", "0"); self.end_headers(); return
            if self.path == "/404":
                self.send_response(404); self.send_header("Content-Length", "0"); self.end_headers(); return
            self.send_response(200); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    u = f"http://127.0.0.1:{srv.server_address[1]}"
    try:
        st, b, err = V.fetch(u + "/incomplete")
        check("fetch retries GET IncompleteRead then reads full body", st == 200 and b == body and hits["/incomplete"] == 2, [st, err, hits])
        st, b, err = V.fetch(u + "/reset")
        check("fetch retries connection reset", st == 200 and b == body and hits["/reset"] == 2, [st, err, hits])
        st, b, err = V.fetch(u + "/503")
        check("fetch retries 5xx", st == 200 and b == body and hits["/503"] == 3, [st, err, hits])
        st, b, err = V.fetch(u + "/404")
        check("fetch 404 returns at once (no retry)", st == 404 and b is None and hits["/404"] == 1, [st, err, hits])
        st, b, err = V.fetch(u + "/always-incomplete")
        check("fetch gives up after 7 truncated reads (not a pass)", st is None and b is None and hits["/always-incomplete"] == 7, [st, err, hits])
    finally:
        srv.shutdown()


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--keep"); a = ap.parse_args()
    d = a.keep or tempfile.mkdtemp(prefix="f2r2-pub-")
    if a.keep and os.path.exists(d): shutil.rmtree(d)
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    B, V = os.path.join(HERE, "build_r2_v21.py"), os.path.join(HERE, "verify_flare2_media.py")
    res, failed = [], []

    def check(name, ok, info=None):
        res.append(name)
        if not ok: failed.append({"test": name, "info": info})

    rc, j = run(os.path.join(HERE, "make_fixture.py"), "--root", d, "--fake-voice")
    check("fixture", rc == 0, j)
    rc, j = run(B, "--out", f"{d}/draft", "--source-commit", commit, "--draft")
    check("draft build problemCount 0", rc == 0 and j.get("problemCount") == 0 and j.get("actions") == N_OLD + N_NEW, j)
    args = ["--source-commit", commit, "--render-root", f"{d}/render", "--media-root", f"{d}/media", "--voice-root", f"{d}/voice"]
    rc, j = run(B, "--out", f"{d}/pack", *args)
    check("final build problemCount 0 (124 = 18 + 102 + 4)", rc == 0 and j.get("problemCount") == 0 and j.get("uploadFiles") == 124
          and j.get("mediaFiles") == 18 and j.get("voiceFiles") == 102, j)
    if rc == 0:
        cat = json.load(open(f"{d}/pack/catalog.json", encoding="utf-8"))
        base = json.load(open(os.path.join(HERE, "base-r2-v20", "catalog.json"), encoding="utf-8"))
        check("275 actions, first 269 identical", len(cat["actions"]) == N_OLD + N_NEW and cat["actions"][:N_OLD] == base["actions"])
        check("deferred t-child-pose-side-reach not in catalog", DEFERRED not in {x["id"] for x in cat["actions"]})
        plan = json.load(open(f"{d}/pack/plan.json", encoding="utf-8"))
        check("no channel pointer in plan", not any(e["objectKey"].startswith("pack/channels/") for e in plan))
        check("no channels dir written", not os.path.exists(f"{d}/pack/channels"))
        check("all new object keys are r2-v21 keys", all(e["objectKey"].startswith(("pack/r2-v1/media/", "pack/r2-v1/voice/")) and "/r2-v21/" in e["objectKey"]
                                                          for e in plan if e["kind"] != "catalog"))
        sq = next(x for x in cat["actions"] if x["id"] == "t-wide-side-squat-shift")
        check("t-wide-side-squat-shift: startingSide right + alternate left+right (每侧 5 次)",
              sq.get("startingSide") == "right" and sq["rhythm"]["execution"].get("repUnit") == "left+right"
              and sq["rhythm"]["execution"].get("perSide") == "alternate", sq["rhythm"]["execution"])
        ws = next(x for x in cat["actions"] if x["id"] == "t-standing-wrist-flexor-stretch")
        check("t-standing-wrist-flexor-stretch: startingSide right + each-side-separately",
              ws.get("startingSide") == "right" and ws["rhythm"]["execution"].get("perSide") == "each-side-separately", ws["rhythm"]["execution"])
        check("guide sentences 556 (535 + 21 new)", sum(1 for x in cat["actions"] for s2 in ("set", "reminders", "steps")
              for y in (x.get("voiceGuide") or {}).get(s2) or [] if isinstance(y, dict) and "clipId" in y) == 556)
        check("catalog keys only pack/r2-v21", sorted(e["objectKey"] for e in plan if e["kind"] == "catalog") ==
              sorted(f"pack/r2-v21/{n}" for n in ("catalog.json", "catalog/catalog.json", "report.json", "media-receipts.json")))
        sem = json.load(open(f"{d}/pack/catalog/catalog.json", encoding="utf-8"))
        nd = [x for x in sem["drills"] if x["id"] in {y["id"] for y in cat["actions"][N_OLD:]}]
        check("new drills apps [] tags thomas + flare2:moves-r2", len(nd) == N_NEW and all(x["apps"] == [] and x["tags"] == ["thomas", "flare2:moves-r2"] for x in nd))
        rc, j = run(V, "local", f"{d}/pack/catalog.json", "--media-root", f"{d}/media", "--voice-root", f"{d}/voice")
        check("verify local 120/120", rc == 0 and j.get("checked") == 120 and j.get("ok") == 120, j)
        # 反例：导出文件改一个字节
        mp = f"{d}/media/media/t-side-lying-straight-leg-abduction/r2-v21/t-side-lying-straight-leg-abduction.cover.alpha.webp"
        orig = open(mp, "rb").read(); open(mp, "wb").write(orig[:-1] + bytes([orig[-1] ^ 1]))
        rc, j = run(V, "local", f"{d}/pack/catalog.json", "--media-root", f"{d}/media", "--voice-root", f"{d}/voice")
        check("verify local catches changed byte", rc != 0 and j.get("failed") == 1, j)
        open(mp, "wb").write(orig)
        # 反例：目录里旧动作被改（r2-v18 部分 / 托马斯补充 / Flare 2.0 r1 都必须逐字节不变）
        for k, label in ((0, "r2-v18"), (249, "Thomas supplement"), (261, "Flare 2.0 r1")):
            bad = json.loads(json.dumps(cat)); bad["actions"][k]["nameZh"] += "x"
            json.dump(bad, open(f"{d}/pack/catalog.bad{k}.json", "w", encoding="utf-8"), ensure_ascii=False)
            rc, j = run(V, "local", f"{d}/pack/catalog.bad{k}.json", "--media-root", f"{d}/media", "--voice-root", f"{d}/voice")
            check(f"verify catches changed {label} action ({base['actions'][k]['id']})",
                  rc != 0 and any(base["actions"][k]["id"] in p for p in j.get("problems", [])), j)
    # 反例：缺一个成片
    vp = f"{d}/media/media/t-wide-side-squat-shift/r2-v21/t-wide-side-squat-shift.rgb-alpha.mp4"; os.rename(vp, vp + ".x")
    rc, j = run(B, "--out", f"{d}/neg1", *args)
    check("build refuses missing media", rc == 1 and j.get("problemCount", 0) >= 1, j)
    os.rename(vp + ".x", vp)
    # 反例：语音文字与文字稿不同
    gp = f"{d}/voice/packages/t-standing-neck-side-stretch/voice-manifest.json"; g0 = open(gp, encoding="utf-8").read()
    g = json.loads(g0); g["lines"]["zh"]["name"]["text"] = "拉伸"; json.dump(g, open(gp, "w", encoding="utf-8"), ensure_ascii=False)
    rc, j = run(B, "--out", f"{d}/neg2", *args)
    check("build refuses voice text mismatch", rc == 1, j)
    open(gp, "w", encoding="utf-8").write(g0)
    # 反例：母帧配方 SHA 不符（不是本分支配方的渲染）
    lp = f"{d}/render/masters/t-step-jack-arm-circles/layer-manifest.json"; l0 = open(lp, encoding="utf-8").read()
    l = json.loads(l0); l["recipe"]["sha256"] = "0" * 64; json.dump(l, open(lp, "w", encoding="utf-8"))
    rc, j = run(B, "--out", f"{d}/neg3", *args)
    check("build refuses foreign masters", rc == 1, j)
    open(lp, "w", encoding="utf-8").write(l0)
    # 反例：pack-fields 多出 deferred 的 id（动作集合与 actions.json 不同）
    pfp = os.path.join(HERE, "pack-fields.json"); pf0 = open(pfp, "rb").read()
    try:
        pf = json.loads(pf0); pf["actions"][DEFERRED] = dict(pf["actions"]["t-standing-neck-side-stretch"])
        open(pfp, "w", encoding="utf-8").write(json.dumps(pf, ensure_ascii=False, indent=1) + "\n")
        rc, j = run(B, "--out", f"{d}/neg4", *args)
        check("build refuses pack-fields with deferred id", rc == 1, j)
    finally:
        open(pfp, "wb").write(pf0)
    fetch_tests(check)
    if not a.keep: shutil.rmtree(d, ignore_errors=True)
    print(json.dumps({"passed": len(res) - len(failed), "total": len(res), "failed": failed}, ensure_ascii=False))
    sys.exit(1 if failed else 0)


if __name__ == "__main__": main()
