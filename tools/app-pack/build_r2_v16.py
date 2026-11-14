#!/usr/bin/env python3
"""r2-v15 → r2-v16：voice-no-tempo-r1 讲解语音改版（开哥 2026-11-15 00:08 同意：重合成讲解语音、发新 pack、切 dev/beta/stable）。

只换两样：
  1. 文字：catalog/production/v3-text（PR #43 codex/voice-no-tempo-r1：voiceGuide 去掉节拍/相位口令，只留报数 + 要领讲解；
     training.phases 不再绑 cue，所以 rhythm.execution.phases 没有 @phase.* 标记）。套用与 r2-v14/r2-v15 相同的 apply_text。
  2. 语音：只把 catalog/review/voice-no-tempo-r1/resynth.json 列出的讲解句换成 tools/vnt/voice_resynth.py 新合成的
     voice/<id>/r2-v16/<lang>/<clipId>.m4a；列为作废的片段从 voice.files 删掉（对象不删）；其余语音（动作名、开组要领、
     相位片段、未改的讲解句）、共用词 voiceCommon、成片全部沿用 r2-v15 已上线对象。
SDK 兼容（docs/voice-guide-pack-contract.md §4）：现有 SDK 不认 phaseCues "none"，会丢掉整套 voiceGuide，
所以下发时把 "none" 写成 "first-2-reps"（这批 execution.phases 已无 @phase 标记，播放效果相同），并核对确实没有标记。
状态标志（reviewed、userAccepted、releaseEligible、state、status）一律沿用 r2-v15。目录放 pack/r2-v16/，对象仍在 pack/r2-v1/ 前缀下只追加。

  # 草稿（沙箱，不需要新语音）：
  python3 tools/app-pack/build_r2_v16.py --out <dir> --source-commit <40 位> --draft
  # 定稿（本机）：
  python tools/app-pack/build_r2_v16.py --out F:/PoseHub-v3/app-pack/r2-v16 --source-commit <40 位> \
      --voice-root F:/PoseHub-v3/runs/2026-11-15_vnt_voice
定稿写 catalog.json、catalog/catalog.json、report.json、media-receipts.json（只含新语音）、plan.json（上传清单：新语音 + 目录文件）、
channels/{dev,beta,stable}.json（内容相同）。有问题列出并拒绝写目录（退出码 1）。
"""
import argparse, copy, hashlib, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catalog_pointer import default_published_at, published_at, validate_catalog_pointer  # noqa: E402
import build_r2_v14 as B  # noqa: E402  apply_text / voice_guide / common_keys / DEFINITION_FIELDS 与上一版同一份

PACK, PREV = "r2-v16", "r2-v15"
CAT_BASE = f"https://media.uuugk.win/pack/{PACK}/"
SRC = f"release/app-pack-{PREV}"
SRC_CATALOG_SHA = "90f68175a17338be0d07ef69d3a1b2d42657c86a4ca200fa0d1102aa1c915230"
SRC_SEMANTIC_SHA = "5c9582098cf347d4c4e2c2cc0b2717c120975f2a11f606a84c1bbe50700ff7a4"
RESYNTH = "catalog/review/voice-no-tempo-r1/resynth.json"
MIN_SDK = "0.8.0"
LANGS = ["zh", "en"]
TEXT_DIR = B.TEXT_DIR
FLAGS = ("reviewed", "userAccepted", "releaseEligible", "state", "status", "availableForTraining", "availableForApp")


def sha(b): return hashlib.sha256(b).hexdigest()
def rd(p): return open(p, "rb").read()
def dump(o): return B.dump(o)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", required=True); ap.add_argument("--source-commit", required=True)
    ap.add_argument("--voice-root"); ap.add_argument("--published-at", type=published_at, default=default_published_at())
    ap.add_argument("--draft", action="store_true")
    a = ap.parse_args()
    if not a.draft and not a.voice_root: raise SystemExit("定稿需要 --voice-root")
    if len(a.source_commit) != 40: raise SystemExit("--source-commit 要 40 位完整提交号")
    raw, sraw = rd(f"{SRC}/catalog.json"), rd(f"{SRC}/catalog/catalog.json")
    if sha(raw) != SRC_CATALOG_SHA: raise SystemExit("r2-v15 catalog.json SHA 不符")
    if sha(sraw) != SRC_SEMANTIC_SHA: raise SystemExit("r2-v15 catalog/catalog.json SHA 不符")
    cat, sem = json.loads(raw), json.loads(sraw)
    before = {x["id"]: copy.deepcopy(x) for x in cat["actions"]}
    plan_rs = json.load(open(RESYNTH, encoding="utf-8"))
    md = cat["mediaDistribution"]; base = md["baseUrl"]; prefix = md["objectKeyPrefix"]
    drills = {d.get("id"): d for d in sem.get("drills", [])}
    problems, notes, receipts, plan = [], [], [], []
    stat = {"voiceGuideChanged": 0, "phaseCuesNoneMapped": 0, "resynthClips": 0, "obsoleteClipsDropped": 0, "guideSentences": 0,
            "keptGuideClips": 0, "textChangedActions": 0}
    need_common = set()
    if set(plan_rs["actions"]) - set(before): problems.append(f"resynth.json 有目录里没有的动作 {sorted(set(plan_rs['actions']) - set(before))}")

    for act in cat["actions"]:
        i = act["id"]
        t = json.load(open(f"{TEXT_DIR}/{i}.json", encoding="utf-8"))
        B.apply_text(act, drills.get(i), t, problems, notes)
        # 状态标志不动
        for f in FLAGS:
            if before[i].get(f) != act.get(f): problems.append(f"{i}: 状态标志 {f} 被改动")
        # voiceGuide：none → first-2-reps（SDK 兼容），并核对执行节奏里没有相位标记
        g, gids = B.voice_guide(t); need_common |= B.common_keys(g)
        if g.get("mode") == "reps":
            if g.get("phaseCues") == "none":
                g["phaseCues"] = "first-2-reps"; stat["phaseCuesNoneMapped"] += 1
            else:
                problems.append(f"{i}: 次数类 phaseCues={g.get('phaseCues')!r}（应为 none）")
            if g.get("steps"): problems.append(f"{i}: 仍有 steps")
        if "@" in (act["rhythm"]["execution"].get("phases") or ""): problems.append(f"{i}: execution.phases 仍有相位标记")
        if g != before[i].get("voiceGuide"): stat["voiceGuideChanged"] += 1
        act["voiceGuide"] = g
        if json.dumps({k: v for k, v in act.items() if k not in ("voice",)}, sort_keys=True) != json.dumps({k: v for k, v in before[i].items() if k != "voice"}, sort_keys=True):
            stat["textChangedActions"] += 1
        # ---- 语音：作废的删、重合成的换、其余沿用
        rs = plan_rs["actions"].get(i, {"synthesize": [], "obsolete": []})
        v = act["voice"]; files = v["files"]
        drop = {(x["clipId"], x["language"]) for x in rs["obsolete"]}
        for x in rs["obsolete"]:
            if not any((f["clipId"], f["language"]) == (x["clipId"], x["language"]) for f in files):
                problems.append(f"{i}: 作废片段 {x['language']}/{x['clipId']} 在 r2-v15 里不存在")
        n0 = len(files); files = [f for f in files if (f["clipId"], f["language"]) not in drop]; stat["obsoleteClipsDropped"] += n0 - len(files)
        rman = None
        if rs["synthesize"] and a.voice_root:
            mp = os.path.join(a.voice_root, "packages", i, "voice-resynth-manifest.json")
            try:
                mb = rd(mp); rman = json.loads(mb)
            except OSError:
                problems.append(f"{i}: 缺重合成清单 {mp}"); rman = None
            if rman and rman.get("status") != "technical-passed": problems.append(f"{i}: 重合成审核 {rman.get('status')} {rman['summary']['auditFailed']}")
            if rman: v["resynthManifest"] = {"path": f"packages/{i}/voice-resynth-manifest.json", "sha256": sha(mb), "status": rman["status"]}
        for x in rs["synthesize"]:
            lang, cid = x["language"], x["clipId"]
            rel = f"voice/{i}/{PACK}/{lang}/{cid}.m4a"
            ent = {"language": lang, "clipId": cid, "role": "guide", "path": rel, "sourcePath": f"packages/{i}/voice/{lang}/{cid}.m4a",
                   "assetName": f"{cid}.m4a", "downloadUrl": base + rel, "contentType": "audio/mp4", "text": x["text"]}
            if rman is not None:
                src = rman["lines"][lang].get(cid)
                fp = os.path.join(a.voice_root, "packages", i, "voice", lang, f"{cid}.m4a")
                if not src or not os.path.isfile(fp): problems.append(f"{i}: 缺新语音 {lang}/{cid}"); continue
                b = rd(fp)
                if sha(b) != src["ref"]["sha256"]: problems.append(f"{fp}: 与清单 SHA 不符")
                if src["text"] != x["text"]: problems.append(f"{i}: 新语音文字与 resynth.json 不符 {lang}/{cid}")
                ent.update({"bytes": len(b), "sha256": sha(b), "durationSeconds": src["ref"]["durationSeconds"]})
                pe = {"id": i, "kind": "voice", "path": rel, "objectKey": prefix + rel, "source": fp, "contentType": "audio/mp4",
                      "bytes": len(b), "sha256": sha(b), "language": lang, "clipId": cid, "text": x["text"], "inCatalog": True}
                plan.append(pe); receipts.append({k: pe[k] for k in pe if k != "source"})
            else:
                ent.update({"bytes": None, "sha256": None, "durationSeconds": None, "status": "pending-voice"})
            files = [f for f in files if not (f["clipId"] == cid and f["language"] == lang)]
            files.append(ent); stat["resynthClips"] += 1
        order = {c: k for k, c in enumerate(B.BASE_CLIPS + gids)}
        files.sort(key=lambda f: (LANGS.index(f["language"]), order.get(f["clipId"], 999)))
        v["files"] = files
        if rs["synthesize"]: v["resynthRevision"] = PACK
        # 完整性：每个动作的 voice.files 恰好 = 基础 5 段 + 当前讲解句，中英各一份；讲解句文字与 voiceGuide 一致
        have = {(f["clipId"], f["language"]): f for f in files}
        want = {(c, l) for l in LANGS for c in B.BASE_CLIPS + gids}
        if set(have) != want:
            problems.append(f"{i}: voice.files 不符 多 {sorted(set(have) - want)} 少 {sorted(want - set(have))}")
        texts = {}
        for sec, short in B.SECTIONS:
            for k, x in enumerate(g.get(sec) or []):
                if isinstance(x, dict) and "clipId" in x: texts[x["clipId"]] = x
        stat["guideSentences"] += len(texts)
        for cid, x in texts.items():
            for l in LANGS:
                f = have.get((cid, l))
                if f and f.get("text") != x[l]: problems.append(f"{i}: {l}/{cid} 语音文字 {f.get('text')!r} ≠ voiceGuide {x[l]!r}（resynth.json 漏列？）")
                if f and not f["path"].startswith(f"voice/{i}/{PACK}/"): stat["keptGuideClips"] += 1
    # ---- 共用词沿用 r2-v15
    vc = cat["voiceCommon"]; have_c = {f["key"] for f in vc["files"]}
    if need_common - have_c: problems.append(f"共用词缺 {sorted(need_common - have_c)}")
    # ---- 定义字段与 semantic catalog 逐字一致
    for act in cat["actions"]:
        d = drills.get(act["id"])
        if d is None: continue
        if act.get("nameZh") != (d.get("name") or {}).get("zh"): problems.append(f"{act['id']}: nameZh 与 semantic catalog 不一致")
        for f in B.DEFINITION_FIELDS:
            if f in act and act[f] != d.get(f): problems.append(f"{act['id']}: {f} 与 semantic catalog 不一致")
    # ---- 路径与总数
    seen = set()
    allv = vc["files"] + [f for x in cat["actions"] for f in (x.get("voice") or {}).get("files", [])]
    for act in cat["actions"]:
        for f in list(act["files"].values()) + (act.get("voice") or {}).get("files", []):
            if f["path"] in seen: problems.append(f"重复路径 {f['path']}")
            seen.add(f["path"])
            if f["downloadUrl"] != base + f["path"]: problems.append(f"downloadUrl 不符 {f['path']}")
    md.update({"voiceFiles": len(allv), "voiceBytes": sum(f["bytes"] or 0 for f in allv),
               "pendingVoiceIds": sorted(x["id"] for x in cat["actions"] if any(f.get("status") == "pending-voice" for f in x["voice"]["files"])),
               "version": f"posehub-app-pack-{PACK}",
               "note": f"{PACK}：voice-no-tempo-r1（PR #43）——voiceGuide 去掉节拍/相位口令，只留报数 + 要领讲解；"
                       f"重合成讲解句 voice/<id>/{PACK}/，其余成片/语音/共用词沿用 r2-v14 对象；次数类 phaseCues 以 first-2-reps 下发（无 @phase 标记，等同 none）"})
    cat["sourceRuns"] = cat["sourceRuns"] + [{"batch": "voice-no-tempo-r1", "commit": a.source_commit, "selectedActions": stat["voiceGuideChanged"],
                                              "replaces": f"{PREV} voiceGuide + {stat['resynthClips']} guide clips"}]
    cat["pack"], cat["id"], cat["sourceCommit"], cat["previousPack"] = PACK, f"app-pack-{PACK}", a.source_commit, PREV
    sem["source"].update({"pack": PACK, "previousPack": PREV, "commit": a.source_commit, "text": TEXT_DIR})
    if a.published_at: sem["generatedAt"] = a.published_at
    sem_bytes = dump(sem); cat["semanticCatalog"].update({"bytes": len(sem_bytes), "sha256": sha(sem_bytes)})
    report = {"pack": PACK, "from": PREV, "fromCatalogSha256": SRC_CATALOG_SHA, "mediaPrefix": prefix, "catalogPrefix": f"pack/{PACK}/",
              "sourceCommit": a.source_commit, "actions": len(cat["actions"]),
              "voiceGuideActions": sum(1 for x in cat["actions"] if x.get("voiceGuide")), "stats": stat,
              "resynthExpected": plan_rs["stats"], "notes": notes, "problems": problems,
              "channelsGenerated": ["channels/dev.json", "channels/beta.json", "channels/stable.json"]}
    if stat["resynthClips"] != plan_rs["stats"]["resynthClipFiles"]: problems.append(f"重合成 {stat['resynthClips']} ≠ {plan_rs['stats']['resynthClipFiles']}")
    if stat["obsoleteClipsDropped"] != plan_rs["stats"]["obsoleteClipFiles"]: problems.append(f"作废 {stat['obsoleteClipsDropped']} ≠ {plan_rs['stats']['obsoleteClipFiles']}")
    os.makedirs(os.path.join(a.out, "catalog"), exist_ok=True)
    if a.draft:
        cb = dump(cat); open(os.path.join(a.out, "catalog.draft.json"), "wb").write(cb)
        open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
        report.update({"draft": True, "catalogDraft": {"bytes": len(cb), "sha256": sha(cb)}})
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print(json.dumps({"actions": len(cat["actions"]), "stats": stat, "notes": len(notes), "problems": problems[:30], "problemCount": len(problems)}, ensure_ascii=False)); return
    report["problemCount"] = len(problems)
    if problems:
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print("\n".join(problems)); print(json.dumps({"error": f"{len(problems)} 个问题，未写目录", "problemCount": len(problems)}, ensure_ascii=False)); sys.exit(1)
    cb = dump(cat)
    ptr = {"schema": 1, "pack": PACK, "catalog": CAT_BASE + "catalog.json", "catalog_sha256": sha(cb), "catalog_bytes": len(cb),
           "min_sdk": MIN_SDK, "published_at": a.published_at}
    validate_catalog_pointer(ptr)
    open(os.path.join(a.out, "catalog.json"), "wb").write(cb); open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
    os.makedirs(os.path.join(a.out, "channels"), exist_ok=True)
    for ch in ("dev", "beta", "stable"): open(os.path.join(a.out, "channels", f"{ch}.json"), "wb").write(dump(ptr))
    rb = dump(receipts); open(os.path.join(a.out, "media-receipts.json"), "wb").write(rb)
    report.update({"catalog": {"bytes": len(cb), "sha256": sha(cb)}, "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)},
                   "receipts": {"files": len(receipts), "totalBytes": sum(r["bytes"] for r in receipts)}, "voiceFiles": len(allv), "pointer": ptr})
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    for nme in ("catalog.json", "catalog/catalog.json", "report.json", "media-receipts.json"):
        b = rd(os.path.join(a.out, nme))
        plan.append({"id": None, "kind": "catalog", "path": nme, "objectKey": f"pack/{PACK}/{nme}", "source": os.path.join(a.out, nme),
                     "contentType": "application/json", "bytes": len(b), "sha256": sha(b)})
    open(os.path.join(a.out, "plan.json"), "wb").write(dump(plan))
    print(json.dumps({"problemCount": 0, "catalog": report["catalog"], "semantic": report["semantic"], "uploadFiles": len(plan),
                      "newVoiceFiles": len(receipts), "voiceFiles": len(allv), "stats": stat, "pointer": ptr}, ensure_ascii=False))


if __name__ == "__main__": main()
