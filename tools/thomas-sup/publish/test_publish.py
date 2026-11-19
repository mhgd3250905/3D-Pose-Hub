#!/usr/bin/env python3
"""build_r2_v19.py / verify_ts_media.py 的沙箱自测（小样数据，不联网，不上传）。

    python3 tools/thomas-sup/publish/test_publish.py [--keep <dir>]

用 make_fixture.py --fake-voice 生成 12 个动作的小样母帧清单/成片/语音，然后：
  1. 草稿构建 problemCount 0；
  2. 定稿构建 problemCount 0：261 个动作、前 249 个与 r2-v18 逐字节相同、36 成片 + 160 语音 + 4 目录 = 200 个上传对象、
     plan.json 没有任何 pack/channels/ 键、没写 channels/ 目录；
  3. 本地核对 196/196；
  4. 反例必须被拦下：缺一个成片 → 构建拒绝；语音清单文字与文字稿不同 → 构建拒绝；母帧配方 SHA 不符 → 构建拒绝；
     导出文件被改一个字节 → 本地核对失败；目录里旧动作被改 → 本地核对失败。
最后一行打印 JSON {"passed": n, "failed": [...]}；全部通过退出码 0。
"""
import argparse, json, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
PY = sys.executable


def run(*a):
    p = subprocess.run([PY, *a], cwd=ROOT, capture_output=True, text=True)
    last = (p.stdout.strip().splitlines() or [""])[-1]
    try: j = json.loads(last)
    except Exception: j = {"raw": last, "stderr": p.stderr[-500:]}
    return p.returncode, j


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--keep"); a = ap.parse_args()
    d = a.keep or tempfile.mkdtemp(prefix="ts-pub-")
    if a.keep and os.path.exists(d): shutil.rmtree(d)
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    B, V = os.path.join(HERE, "build_r2_v19.py"), os.path.join(HERE, "verify_ts_media.py")
    res, failed = [], []

    def check(name, ok, info=None):
        res.append(name)
        if not ok: failed.append({"test": name, "info": info})

    rc, j = run(os.path.join(HERE, "make_fixture.py"), "--root", d, "--fake-voice")
    check("fixture", rc == 0, j)
    rc, j = run(B, "--out", f"{d}/draft", "--source-commit", commit, "--draft")
    check("draft build problemCount 0", rc == 0 and j.get("problemCount") == 0, j)
    args = ["--source-commit", commit, "--render-root", f"{d}/render", "--media-root", f"{d}/media", "--voice-root", f"{d}/voice"]
    rc, j = run(B, "--out", f"{d}/pack", *args)
    check("final build problemCount 0", rc == 0 and j.get("problemCount") == 0 and j.get("uploadFiles") == 200, j)
    if rc == 0:
        cat = json.load(open(f"{d}/pack/catalog.json", encoding="utf-8"))
        base = json.load(open(os.path.join(HERE, "base-r2-v18", "catalog.json"), encoding="utf-8"))
        check("261 actions, first 249 identical", len(cat["actions"]) == 261 and cat["actions"][:249] == base["actions"])
        plan = json.load(open(f"{d}/pack/plan.json", encoding="utf-8"))
        check("no channel pointer in plan", not any(e["objectKey"].startswith("pack/channels/") for e in plan))
        check("no channels dir written", not os.path.exists(f"{d}/pack/channels"))
        check("catalog keys only pack/r2-v19", sorted(e["objectKey"] for e in plan if e["kind"] == "catalog") ==
              sorted(f"pack/r2-v19/{n}" for n in ("catalog.json", "catalog/catalog.json", "report.json", "media-receipts.json")))
        rc, j = run(V, "local", f"{d}/pack/catalog.json", "--media-root", f"{d}/media", "--voice-root", f"{d}/voice")
        check("verify local 196/196", rc == 0 and j.get("checked") == 196 and j.get("ok") == 196, j)
        # 反例：导出文件改一个字节
        mp = f"{d}/media/media/t-frog-stand/r2-v19/t-frog-stand.cover.alpha.webp"
        orig = open(mp, "rb").read(); open(mp, "wb").write(orig[:-1] + bytes([orig[-1] ^ 1]))
        rc, j = run(V, "local", f"{d}/pack/catalog.json", "--media-root", f"{d}/media", "--voice-root", f"{d}/voice")
        check("verify local catches changed byte", rc != 0 and j.get("failed") == 1, j)
        open(mp, "wb").write(orig)
        # 反例：目录里旧动作被改
        bad = json.loads(json.dumps(cat)); bad["actions"][0]["nameZh"] += "x"
        json.dump(bad, open(f"{d}/pack/catalog.bad.json", "w", encoding="utf-8"), ensure_ascii=False)
        rc, j = run(V, "local", f"{d}/pack/catalog.bad.json", "--media-root", f"{d}/media", "--voice-root", f"{d}/voice")
        check("verify catches changed old action", rc != 0 and any("abs-A" in p for p in j.get("problems", [])), j)
    # 反例：缺一个成片
    vp = f"{d}/media/media/t-pushup-plus/r2-v19/t-pushup-plus.rgb-alpha.mp4"; os.rename(vp, vp + ".x")
    rc, j = run(B, "--out", f"{d}/neg1", *args)
    check("build refuses missing media", rc == 1 and j.get("problemCount", 0) >= 1, j)
    os.rename(vp + ".x", vp)
    # 反例：语音文字与文字稿不同
    gp = f"{d}/voice/packages/t-pushup-plus/voice-manifest.json"; g0 = open(gp, encoding="utf-8").read()
    g = json.loads(g0); g["lines"]["zh"]["name"]["text"] = "俯卧撑"; json.dump(g, open(gp, "w", encoding="utf-8"), ensure_ascii=False)
    rc, j = run(B, "--out", f"{d}/neg2", *args)
    check("build refuses voice text mismatch", rc == 1, j)
    open(gp, "w", encoding="utf-8").write(g0)
    # 反例：母帧配方 SHA 不符（不是本分支配方的渲染）
    lp = f"{d}/render/masters/t-frog-stand/layer-manifest.json"; l0 = open(lp, encoding="utf-8").read()
    l = json.loads(l0); l["recipe"]["sha256"] = "0" * 64; json.dump(l, open(lp, "w", encoding="utf-8"))
    rc, j = run(B, "--out", f"{d}/neg3", *args)
    check("build refuses foreign masters", rc == 1, j)
    open(lp, "w", encoding="utf-8").write(l0)
    if not a.keep: shutil.rmtree(d, ignore_errors=True)
    print(json.dumps({"passed": len(res) - len(failed), "total": len(res), "failed": failed}, ensure_ascii=False))
    sys.exit(1 if failed else 0)


if __name__ == "__main__": main()
