#!/usr/bin/env python3
"""沙箱小样数据（只给 build_r2_v22.py / verify_flare2_media.py / SDK 预检做端到端自测，不是成片，不能上传）。

    python3 tools/flare2-moves-r3/publish/make_fixture.py --root <dir> [--fake-voice]

写：
  <root>/render/masters/<id>/layer-manifest.json   与 render-masters-v5 同字段子集（fps 30、8 s、complete、v5-toon、配方 SHA = 本分支）
  <root>/render/packages/<id>/package.json         loopFrames、keyframes.peak、flags
  <root>/media/media/<id>/r2-v22/<id>.{rgb-alpha.mp4,cover.alpha.webp,thumbnail.alpha.webp}
      ffmpeg 生成的 1 帧小样（720×1440 h264 yuv420p / 640 / 192 webp，每个动作颜色不同 → SHA 不同）
  --fake-voice：<root>/voice/packages/<id>/... 正弦波 m4a + 两份清单（不联网）；不加则用 voice_flare2.py 真合成。
"""
import argparse, hashlib, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, HERE)
import build_r2_v22 as B  # noqa: E402


def sha(p): return hashlib.sha256(open(p, "rb").read()).hexdigest()


def ff(*a): subprocess.run(["ffmpeg", "-v", "error", "-y", *a], check=True)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--root", required=True); ap.add_argument("--fake-voice", action="store_true")
    a = ap.parse_args(); r = os.path.abspath(a.root)
    ids = [x["id"] for x in json.load(open(os.path.join(ROOT, "tools/flare2-moves-r3/actions.json"), encoding="utf-8"))["actions"]]
    for n, i in enumerate(ids):
        t = json.load(open(os.path.join(ROOT, B.TEXT_DIR, f"{i}.json"), encoding="utf-8"))
        rp = os.path.join(ROOT, B.RECIPE_DIR, f"{i}.json")
        fps, dur = 30, 8.0; N = int(fps * dur)
        hold = t["defaultDose"]["mode"] == "time"
        frames = [{"frame": f, "time": f / fps, "endpoint": False, "pulse": 1.0 if hold else round(0.5 - 0.5 * __import__("math").cos(f / N * 6.283), 4)} for f in range(N)]
        frames.append({"frame": N, "time": dur, "endpoint": True, "pulse": frames[0]["pulse"]})
        m = {"format": "fixture-layer-manifest", "id": i, "fps": fps, "durationSeconds": dur, "loopFrames": N, "complete": True,
             "profile": {"id": "v5"}, "skins": [{"id": "v5-toon"}], "recipe": {"path": B.RECIPE_DIR + f"/{i}.json", "sha256": sha(rp)},
             "productionModel": {"profile": "training-human-v3-armfix", "version": "0.1.0-r2"}, "frames": frames, "fixture": True}
        md = os.path.join(r, "render", "masters", i); os.makedirs(md, exist_ok=True)
        json.dump(m, open(os.path.join(md, "layer-manifest.json"), "w"), indent=1)
        pd = os.path.join(r, "render", "packages", i); os.makedirs(pd, exist_ok=True)
        json.dump({"actionId": i, "loopFrames": N, "keyframes": {"start": 0, "peak": N // 2, "end": N - 1}, "flags": {"sampledOnly": False}, "fixture": True},
                  open(os.path.join(pd, "package.json"), "w"), indent=1)
        od = os.path.join(r, "media", "media", i, B.PACK); os.makedirs(od, exist_ok=True)
        col = f"0x{(37 * n + 40) % 256:02x}{(91 * n + 80) % 256:02x}{(13 * n + 120) % 256:02x}"
        ff("-f", "lavfi", "-i", f"color=c={col}:s=720x1440:d=0.1:r=30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-frames:v", "2", os.path.join(od, f"{i}.rgb-alpha.mp4"))
        for kind, s in (("cover", 640), ("thumbnail", 192)):
            ff("-f", "lavfi", "-i", f"color=c={col}:s={s}x{s}", "-frames:v", "1", "-c:v", "libwebp", "-quality", "80", os.path.join(od, f"{i}.{kind}.alpha.webp"))
        if a.fake_voice:
            vd = os.path.join(r, "voice", "packages", i); tp = os.path.join(ROOT, B.TEXT_DIR, f"{i}.json")
            g, gids = B.voice_guide(t)
            cues = t["cues"]; prim = next(c for c in cues if c["primary"])
            vs = {"name": t["name"], "primaryCue": prim["text"], **{f"phase.{k}": t["phases"][k] for k in ("start", "peak", "end")}}
            base = {"status": "technical-passed", "summary": {"auditFailed": []}, "lines": {}}
            gm = {"status": "technical-passed", "summary": {"auditFailed": []}, "text": {"sha256": sha(tp)}, "lines": {}}
            for lang in ("zh", "en"):
                base["lines"][lang], gm["lines"][lang] = {}, {}
                for clip, text in [(c, vs[c][lang]) for c in vs] + [(c, x[lang]) for c, x in gids]:
                    fp = os.path.join(vd, "voice", lang, f"{clip}.m4a"); os.makedirs(os.path.dirname(fp), exist_ok=True)
                    ff("-f", "lavfi", "-i", f"sine=f={300 + 7 * n + len(text)}:d=0.3", "-c:a", "aac", "-b:a", "64k", fp)
                    ent = {"text": text, "role": "guide" if clip.startswith("g.") else B.BASE_CLIPS.index(clip) < 2 and "intro" or "phase",
                           "ref": {"sha256": sha(fp), "durationSeconds": 0.3}}
                    (gm if clip.startswith("g.") else base)["lines"][lang][clip] = ent
            json.dump(base, open(os.path.join(vd, "voice-manifest.json"), "w"), ensure_ascii=False)
            json.dump(gm, open(os.path.join(vd, "voice-guide-manifest.json"), "w"), ensure_ascii=False)
    print(json.dumps({"fixture": r, "actions": len(ids), "fakeVoice": a.fake_voice}))


if __name__ == "__main__": main()
