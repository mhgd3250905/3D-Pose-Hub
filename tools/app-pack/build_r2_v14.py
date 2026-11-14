#!/usr/bin/env python3
"""r2-v13 → r2-v14：V4 定版（开哥 2026-11-14 09:06 / 09:30 同意）。

一次换三样，249 个动作全部：
  1. 媒体：V4 全量渲染（codex/v4-render，渲染内容 = main d6fb47c，新建模）导出的成片 media/<id>/r2-v14/<id>.*
  2. 文字：main 的 catalog/production/v3-text（动作包核对 r3，PR #42）——名称、用途、口令、常见错误、注意事项、
     相位口令、剂量、训练节奏、难度、主要/协同肌群；新字段 voiceGuide（中途引导、报数）和 training.sideSwitchSeconds
  3. 语音：tools/v4/voice_v4.py 按新文字重合成的基础语音 + 引导句 voice/<id>/r2-v14/<lang>/<clip>.m4a，
     以及共用词 voice/_common/r2-v14/<lang>/<key>.m4a（catalog 顶层 voiceCommon）
约定见 docs/voice-guide-pack-contract.md。状态标志（reviewed、userAccepted、releaseEligible、state、status）、动作 id 集合、
doseRange 以外的其他字段一律沿用 r2-v13。媒体/语音仍在 pack/r2-v1/ 前缀下（只追加新对象键），目录放 pack/r2-v14/。

  # 草稿（沙箱，没有媒体和语音）：检查文字映射，写 catalog.draft.json + report.json
  python3 tools/app-pack/build_r2_v14.py --out <dir> --source-commit <40 位> --draft
  # 定稿（本机）：
  python tools/app-pack/build_r2_v14.py --out F:/PoseHub-v3/app-pack/r2-v14 --source-commit <40 位> \
      --v4-root F:/PoseHub-v3/runs/2026-11-12_v4_d6fb47c --media-root F:/PoseHub-v3/app-pack/r2-v14 \
      --voice-root F:/PoseHub-v3/runs/2026-11-14_v4_voice
定稿写 catalog.json、catalog/catalog.json、report.json、media-receipts.json、plan.json（上传清单：本地文件 → 对象键 + 字节 + SHA）、
channels/{dev,beta}.json（不生成 stable）。有问题列出并拒绝写目录（退出码 1）。
"""
import argparse, hashlib, json, os, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalog_pointer import default_published_at, published_at, validate_catalog_pointer  # noqa: E402

PACK, PREV, MEDIA_PACK = "r2-v14", "r2-v13", "r2-v1"
CAT_BASE = f"https://media.uuugk.win/pack/{PACK}/"
SRC = f"release/app-pack-{PREV}"
SRC_CATALOG_SHA = "09237458290ea3c161f446bab7c267e027b672892b61c4c4ac2662c0e945e7c5"
SRC_SEMANTIC_SHA = "4958eb7d3679365739747947df1d3a2eea02165db7704451fa6f2dc2c5fdee81"
RENDER_BRANCH, RENDER_BASE = "codex/v4-render", "d6fb47cf5ea8768a73cec0594fd1bfbcbfe85cdc"
MEDIA_SET = "2026-11-12_v4_d6fb47c"
MIN_SDK = "0.8.0"
KINDS = {"video": "rgb-alpha.mp4", "cover": "cover.alpha.webp", "thumbnail": "thumbnail.alpha.webp"}
EXTRA = {"poster": "poster.alpha.webp"}
BASE_CLIPS = ["name", "primaryCue", "phase.start", "phase.peak", "phase.end"]
LANGS = ["zh", "en"]
SECTIONS = (("set", "set"), ("reminders", "rem"), ("steps", "step"))
TEXT_DIR = "catalog/production/v3-text"


def sha(b): return hashlib.sha256(b).hexdigest()
def sha_lf(p): return sha(open(p, "rb").read().replace(b"\r\n", b"\n"))
def dump(o): return (json.dumps(o, ensure_ascii=False, indent=1) + "\n").encode()
def rd(p): return open(p, "rb").read()


def probe(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                                   "stream=width,height,codec_name,pix_fmt", "-of", "json", path])
    return json.loads(out)["streams"][0]


def exec_phases(phases):
    """r2 起 rhythm.execution.phases 是一行文字（go=1.5s@phase.start; …），与线上格式一致。"""
    if not phases: return ""
    return "; ".join(f"{p['id']}={p['seconds']:g}s" + (f"@{p['cue']}" if p.get("cue") else "") for p in phases)


def in_range(v, r): return r is None or (r[0] <= v <= r[1])


def apply_text(act, drill, t, problems, notes):
    i = act["id"]
    cues = t["cues"]; prim = [k for k, c in enumerate(cues) if c.get("primary")]
    if len(prim) != 1: problems.append(f"{i}: primary cue 数量 {len(prim)}"); return
    tags = t.get("tags", {})
    upd = {
        "nameZh": t["name"]["zh"], "nameEn": t["name"]["en"],
        "purpose": t["purpose"]["zh"], "purposeEn": t["purpose"]["en"],
        "cues": {"zh": [c["text"]["zh"] for c in cues]}, "cuesEn": [c["text"]["en"] for c in cues], "primaryCue": prim[0],
        "cautions": [c["zh"] for c in t.get("cautions", [])], "cautionsEn": [c["en"] for c in t.get("cautions", [])],
        "commonErrors": t.get("commonErrors", []), "phases": t["phases"], "training": t["training"],
        "defaultDose": t["defaultDose"], "unilateral": t["unilateral"], "reviewStatus": t["reviewStatus"],
    }
    if "difficulty" in tags: upd["level"] = tags["difficulty"]
    for k in ("activeMuscles", "synergistMuscles", "category", "position"):
        if k in tags: upd[k] = tags[k]
    # 器械：ai-tags 词表（resistance-band、cable-machine…）与目录词表（band、cable…）不同，目录沿用 r2-v13 不改
    act.update(upd)
    if t["unilateral"] and t.get("startingSide"): act["startingSide"] = t["startingSide"]
    pht = {k: v for k, v in t.items() if k not in ("voiceGuide", "review")}
    act["poseHubText"] = pht
    # 剂量要落在 doseRange 里；不在就把范围放宽到包含默认值（记 report）。doseRange 为空或缺键是 r2-v13 原样，不动
    dr, dd = act.get("doseRange") or {}, t["defaultDose"]
    for k in ("sets", "reps", "seconds", "restSeconds"):
        if k in dd and k in dr and not in_range(dd[k], dr[k]):
            old = list(dr[k]); dr[k] = [min(dr[k][0], dd[k]), max(dr[k][1], dd[k])]
            notes.append(f"{i}: doseRange.{k} {old} → {dr[k]}（容纳新默认 {dd[k]}）")
    # rhythm.execution 跟训练节奏走
    rh = act["rhythm"]; tr = t["training"]
    ex = {"kind": tr["kind"], "leadSeconds": tr.get("leadSeconds", 1), "phases": exec_phases(tr.get("phases")), "source": tr.get("source")}
    if dd.get("mode") == "reps": ex["reps"] = dd.get("reps")
    for k in ("perSide", "repUnit", "sideSwitchSeconds"):
        if k in tr: ex[k] = tr[k]
    if t.get("startingSide"): ex["startingSide"] = t["startingSide"]
    rh["execution"] = ex; rh["executionStatus"] = t["reviewStatus"]
    tp = f"{TEXT_DIR}/{i}.json"; tsha = sha(rd(tp))
    rh["executionSource"] = {"path": tp, "actionId": i, "sha256": tsha}
    for ev in act.get("trainingSemantics", {}).get("evidence", []):
        if ev.get("path") == tp: ev["sha256"] = tsha
    if drill is not None:
        drill.update({"name": t["name"], "purpose": t["purpose"]["zh"], "cues": {"zh": [c["text"]["zh"] for c in cues]},
                      "primaryCue": prim[0], "cautions": [c["zh"] for c in t.get("cautions", [])], "defaultDose": dd,
                      "doseRange": act.get("doseRange", drill.get("doseRange")), "unilateral": t["unilateral"],
                      "level": act["level"], "review": {"status": t["reviewStatus"]}})


def voice_guide(t):
    g = json.loads(json.dumps(t["voiceGuide"])); g["status"] = "ready"; ids = []
    for sec, short in SECTIONS:
        for k, x in enumerate(g.get(sec) or []):
            if isinstance(x, dict) and "zh" in x and "en" in x and "key" not in x:
                x["clipId"] = f"g.{short}.{k}"; ids.append(x["clipId"])
    return g, ids


def common_keys(g):
    ks = set()
    for sec in ("set", "reminders", "steps", "before"):
        for x in g.get(sec) or []:
            if isinstance(x, str): ks.add(x)
            elif isinstance(x, dict) and "key" in x: ks.add(x["key"])
    for v in (g.get("afterSet") or {}).values(): ks.update(v)
    if (g.get("count") or {}).get("key", "").startswith("n."): ks.add("n.1")
    return ks


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", required=True); ap.add_argument("--source-commit", required=True)
    ap.add_argument("--v4-root"); ap.add_argument("--media-root"); ap.add_argument("--voice-root")
    ap.add_argument("--published-at", type=published_at, default=default_published_at())
    ap.add_argument("--draft", action="store_true")
    a = ap.parse_args()
    if not a.draft and not (a.v4_root and a.media_root and a.voice_root): raise SystemExit("定稿需要 --v4-root --media-root --voice-root")
    if len(a.source_commit) != 40: raise SystemExit("--source-commit 要 40 位完整提交号")
    raw, sraw = rd(f"{SRC}/catalog.json"), rd(f"{SRC}/catalog/catalog.json")
    if sha(raw) != SRC_CATALOG_SHA: raise SystemExit("r2-v13 catalog.json SHA 不符")
    if sha(sraw) != SRC_SEMANTIC_SHA: raise SystemExit("r2-v13 catalog/catalog.json SHA 不符")
    cat, sem = json.loads(raw), json.loads(sraw)
    md = cat["mediaDistribution"]; base = md["baseUrl"]; prefix = md["objectKeyPrefix"]
    plan_ids = [x for x in json.load(open("tools/v4/v4-actions.json", encoding="utf-8"))["actions"]]
    v4 = {x["id"]: x for x in plan_ids}
    acts = {x["id"]: x for x in cat["actions"]}
    drills = {d.get("id"): d for d in sem.get("drills", [])}
    problems, notes, receipts, plan = [], [], [], []
    if set(v4) != set(acts): problems.append(f"V4 名单与 r2-v13 动作集合不同：多 {sorted(set(v4)-set(acts))} 少 {sorted(set(acts)-set(v4))}")
    need_common = set()

    def add_file(i, kind, rel, fp, ctype, extra=None):
        ent = {"id": i, "kind": kind, "path": rel, "objectKey": prefix + rel, "source": fp, "contentType": ctype}
        b = rd(fp); ent.update({"bytes": len(b), "sha256": sha(b)})
        if not b: problems.append(f"{rel}: 空文件")
        if extra: ent.update(extra)
        plan.append(ent); receipts.append({k: ent[k] for k in ent if k != "source"})
        return ent

    for act in cat["actions"]:
        i = act["id"]; act["packRevision"] = PACK
        t = json.load(open(f"{TEXT_DIR}/{i}.json", encoding="utf-8"))
        apply_text(act, drills.get(i), t, problems, notes)
        # ---- 来源（V4 渲染）
        spec = v4[i]["spec"]; rp = v4[i]["recipe"]
        if not os.path.exists(spec): problems.append(f"{i}: spec 不存在 {spec}"); continue
        rec = json.load(open(rp, encoding="utf-8"))
        if rec.get("spec") != spec: problems.append(f"{i}: 配方 spec {rec.get('spec')} ≠ V4 名单 {spec}")
        if rec.get("specSha256Lf") and sha_lf(spec) != rec["specSha256Lf"]: problems.append(f"{i}: specSha256Lf 与文件不符")
        rsha = sha(rd(rp)); model = act["source"].get("model")
        if a.v4_root:
            mp = os.path.join(a.v4_root, "masters", i, "layer-manifest.json")
            if not os.path.isfile(mp): problems.append(f"{i}: 缺 V4 母帧清单"); continue
            m = json.load(open(mp, encoding="utf-8")); model = m.get("productionModel", model)
            rh = act["rhythm"]; fps = m["fps"]; dur = m["durationSeconds"]
            for fk, dk, nk in (("fps", "durationSeconds", "frames"), ("sourceFps", "durationSeconds", "sourceFrames")):
                if fk in rh: rh[fk] = fps
                if nk in rh: rh[nk] = int(round(dur * fps))
            rh["durationSeconds"] = dur
        act["source"] = {"branch": RENDER_BRANCH, "commit": a.source_commit, "renderCommit": RENDER_BASE,
                         "spec": {"path": spec, "sha256": sha_lf(spec)}, "mediaSet": MEDIA_SET, "model": model}
        act["sourceRevision"] = os.path.basename(spec)[:-3]; act["mediaRevision"] = PACK; act["revision"] = f"{i}-{PACK}"
        act["repairReason"] = "V4 全量重渲（新建模，main d6fb47c；开哥 2026-11-14 定版）"
        act["recipe"] = {"path": rp, "sha256": rsha, "fingerprint": "sha256:" + rsha}
        if isinstance(act.get("qa"), dict) and isinstance(act["qa"].get("report"), dict): act["qa"]["report"]["path"] = f"qa/{i}/{PACK}/export-check.json"
        for ev in act.get("trainingSemantics", {}).get("evidence", []):
            if ev.get("path") == rp: ev["sha256"] = rsha
        cat["latestOverrides"][i] = act["sourceRevision"]
        # ---- 媒体
        for kind, suffix in {**KINDS, **EXTRA}.items():
            rel = f"media/{i}/{PACK}/{i}.{suffix}"
            ctype = "video/mp4" if suffix.endswith("mp4") else "image/webp"
            if kind in KINDS:
                old = act["files"][kind]; f = dict(old)
                f.update({"path": rel, "assetName": f"{i}.{suffix}", "downloadUrl": base + rel})
            if not a.media_root:
                if kind in KINDS: f.update({"bytes": None, "sha256": None, "status": "pending-export"}); act["files"][kind] = f
                continue
            fp = os.path.join(a.media_root, rel)
            if not os.path.isfile(fp): problems.append(f"缺文件 {rel}"); continue
            ent = add_file(i, kind, rel, fp, ctype, {"inCatalog": kind in KINDS})
            if kind not in KINDS: continue
            pr = probe(fp); f.update({"bytes": ent["bytes"], "sha256": ent["sha256"], "width": int(pr["width"]), "height": int(pr["height"]), "status": "ready"})
            if kind == "video": f.update({"codec": pr["codec_name"], "pixelFormat": pr["pix_fmt"]})
            if (f["width"], f["height"]) != (old["width"], old["height"]): problems.append(f"{rel}: 尺寸 {f['width']}x{f['height']} ≠ 旧 {old['width']}x{old['height']}")
            if kind == "video" and (f["codec"], f["pixelFormat"]) != (old["codec"], old["pixelFormat"]): problems.append(f"{rel}: 编码 ≠ 旧版")
            act["files"][kind] = f
        # ---- 语音
        g, gids = voice_guide(t); need_common |= common_keys(g)
        act["voiceGuide"] = g
        if not a.voice_root:
            act["voice"] = {"status": "pending-voice", "revision": PACK, "files": []}; continue
        pdir = os.path.join(a.voice_root, "packages", i)
        try:
            mb, gb = rd(os.path.join(pdir, "voice-manifest.json")), rd(os.path.join(pdir, "voice-guide-manifest.json"))
        except OSError as e:
            problems.append(f"{i}: 缺语音清单 {e.filename}"); continue
        m, gm = json.loads(mb), json.loads(gb)
        if m.get("status") != "technical-passed": problems.append(f"{i}: 基础语音 {m.get('status')} {m['summary']['auditFailed']}")
        if gm.get("status") != "technical-passed": problems.append(f"{i}: 引导语音 {gm.get('status')} {gm['summary']['auditFailed']}")
        files = []
        for lang in LANGS:
            for clip in BASE_CLIPS + gids:
                src = (m if clip in BASE_CLIPS else gm)["lines"][lang].get(clip)
                if not src: problems.append(f"{i}: 缺语音 {lang}/{clip}"); continue
                fp = os.path.join(pdir, "voice", lang, f"{clip}.m4a")
                if not os.path.isfile(fp): problems.append(f"{i}: 缺文件 {fp}"); continue
                rel = f"voice/{i}/{PACK}/{lang}/{clip}.m4a"
                ent = add_file(i, "voice", rel, fp, "audio/mp4", {"language": lang, "clipId": clip, "text": src["text"], "inCatalog": True})
                if ent["sha256"] != src["ref"]["sha256"]: problems.append(f"{fp}: 与清单 SHA 不符")
                files.append({"language": lang, "clipId": clip, "role": src.get("role", "guide"), "path": rel, "sourcePath": f"packages/{i}/voice/{lang}/{clip}.m4a",
                              "bytes": ent["bytes"], "sha256": ent["sha256"], "durationSeconds": src["ref"]["durationSeconds"],
                              "assetName": f"{clip}.m4a", "downloadUrl": base + rel, "contentType": "audio/mp4", "text": src["text"]})
        act["voice"] = {"status": "ready", "sourceBatch": os.path.basename(os.path.normpath(a.voice_root)), "revision": PACK,
                        "sourceManifest": {"path": f"packages/{i}/voice-manifest.json", "sha256": sha(mb), "status": m["status"]},
                        "guideManifest": {"path": f"packages/{i}/voice-guide-manifest.json", "sha256": sha(gb), "status": gm["status"]},
                        "manualListening": "pending", "files": files}
    # ---- 共用词
    vc = {"format": "pose-hub-voice-common@1", "revision": PACK, "files": []}
    if a.voice_root:
        cp = os.path.join(a.voice_root, "voice", "common", "manifest.json"); cb0 = rd(cp); cm = json.loads(cb0)
        if cm["summary"]["auditFailed"]: problems.append(f"共用词审核不过 {cm['summary']['auditFailed']}")
        vc["sourceManifest"] = {"path": "voice/common/manifest.json", "sha256": sha(cb0)}
        for lang in LANGS:
            for key, src in sorted(cm["lines"][lang].items()):
                fp = os.path.join(a.voice_root, "voice", "common", lang, f"{key}.m4a")
                rel = f"voice/_common/{PACK}/{lang}/{key}.m4a"
                ent = add_file(None, "voice-common", rel, fp, "audio/mp4", {"language": lang, "key": key, "text": src["text"], "inCatalog": True})
                if ent["sha256"] != src["ref"]["sha256"]: problems.append(f"{fp}: 与清单 SHA 不符")
                vc["files"].append({"key": key, "language": lang, "path": rel, "downloadUrl": base + rel, "bytes": ent["bytes"], "sha256": ent["sha256"],
                                    "durationSeconds": src["ref"]["durationSeconds"], "contentType": "audio/mp4", "text": src["text"]})
        have = {f["key"] for f in vc["files"]}
        if need_common - have: problems.append(f"共用词缺 {sorted(need_common - have)}")
    script = json.load(open("catalog/voice-v2/script.json", encoding="utf-8"))["common"]
    if need_common - set(script): problems.append(f"voiceGuide 用到 script.json 没有的共用词 {sorted(need_common - set(script))}")
    cat["voiceCommon"] = vc
    # ---- 总数与 SDK 规则
    seen, n, tot = set(), 0, 0
    allv = vc["files"] + [f for x in cat["actions"] for f in (x.get("voice") or {}).get("files", [])]
    for act in cat["actions"]:
        for f in list(act["files"].values()) + (act.get("voice") or {}).get("files", []):
            if f["path"] in seen: problems.append(f"重复路径 {f['path']}")
            seen.add(f["path"])
            if f["downloadUrl"] != base + f["path"]: problems.append(f"downloadUrl 不符 {f['path']}")
            if not f["downloadUrl"].startswith(base): problems.append(f"downloadUrl 不在 objectKeyPrefix 内 {f['path']}")
        for f in act["files"].values(): n += 1; tot += f["bytes"] or 0
    md.update({"mediaFiles": n, "mediaBytes": tot, "voiceFiles": len(allv), "voiceBytes": sum(f["bytes"] or 0 for f in allv),
               "pendingVoiceIds": sorted(x["id"] for x in cat["actions"] if (x.get("voice") or {}).get("status") != "ready"),
               "version": f"posehub-app-pack-{PACK}",
               "note": f"{PACK}：V4 定版。249 个动作全部换 V4 成片 media/<id>/{PACK}/、新文字（动作包核对 r3）、重合成语音 voice/<id>/{PACK}/ "
                       f"与引导句（voiceGuide），共用词 voice/_common/{PACK}/；媒体仍在 pack/{MEDIA_PACK}/ 前缀，只追加"})
    cat["sourceRuns"] = cat["sourceRuns"] + [{"batch": MEDIA_SET, "commit": RENDER_BASE, "selectedActions": len(acts), "replaces": f"{PREV} media/text/voice (V4)"}]
    cat["pack"], cat["id"], cat["sourceCommit"], cat["previousPack"] = PACK, f"app-pack-{PACK}", a.source_commit, PREV
    sem["source"].update({"pack": PACK, "previousPack": PREV, "commit": a.source_commit, "text": TEXT_DIR})
    if a.published_at: sem["generatedAt"] = a.published_at
    sem_bytes = dump(sem); cat["semanticCatalog"].update({"bytes": len(sem_bytes), "sha256": sha(sem_bytes)})
    report = {"pack": PACK, "from": PREV, "fromCatalogSha256": SRC_CATALOG_SHA, "mediaPrefix": f"pack/{MEDIA_PACK}/", "catalogPrefix": f"pack/{PACK}/",
              "sourceCommit": a.source_commit, "actions": len(acts), "voiceGuideActions": sum(1 for x in cat["actions"] if x.get("voiceGuide")),
              "commonKeysUsed": sorted(need_common), "notes": notes, "problems": problems,
              "channelsGenerated": ["channels/dev.json", "channels/beta.json"], "stableUntouched": True}
    os.makedirs(os.path.join(a.out, "catalog"), exist_ok=True)
    if a.draft:
        cb = dump(cat); open(os.path.join(a.out, "catalog.draft.json"), "wb").write(cb)
        open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
        report.update({"draft": True, "catalogDraft": {"bytes": len(cb), "sha256": sha(cb)}})
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print(json.dumps({"actions": len(acts), "notes": len(notes), "problems": problems[:30], "problemCount": len(problems)}, ensure_ascii=False)); return
    if problems:
        print("\n".join(problems)); print(json.dumps({"error": f"{len(problems)} 个问题，未写目录"}, ensure_ascii=False)); sys.exit(1)
    cb = dump(cat)
    ptr = {"schema": 1, "pack": PACK, "catalog": CAT_BASE + "catalog.json", "catalog_sha256": sha(cb), "catalog_bytes": len(cb),
           "min_sdk": MIN_SDK, "published_at": a.published_at}
    validate_catalog_pointer(ptr)
    open(os.path.join(a.out, "catalog.json"), "wb").write(cb); open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
    os.makedirs(os.path.join(a.out, "channels"), exist_ok=True)
    for ch in ("dev", "beta"): open(os.path.join(a.out, "channels", f"{ch}.json"), "wb").write(dump(ptr))
    rb = dump(receipts); open(os.path.join(a.out, "media-receipts.json"), "wb").write(rb)
    report.update({"catalog": {"bytes": len(cb), "sha256": sha(cb)}, "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)},
                   "receipts": {"files": len(receipts), "totalBytes": sum(r["bytes"] for r in receipts)},
                   "mediaFiles": n, "mediaBytes": tot, "voiceFiles": len(allv), "pointer": ptr})
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    for nme in ("catalog.json", "catalog/catalog.json", "report.json", "media-receipts.json"):
        b = rd(os.path.join(a.out, nme))
        plan.append({"id": None, "kind": "catalog", "path": nme, "objectKey": f"pack/{PACK}/{nme}", "source": os.path.join(a.out, nme),
                     "contentType": "application/json", "bytes": len(b), "sha256": sha(b)})
    open(os.path.join(a.out, "plan.json"), "wb").write(dump(plan))
    print(json.dumps({"catalog": report["catalog"], "semantic": report["semantic"], "uploadFiles": len(plan), "mediaFiles": n, "mediaBytes": tot,
                      "voiceFiles": len(allv), "notes": len(notes), "pointer": ptr}, ensure_ascii=False))


if __name__ == "__main__": main()
