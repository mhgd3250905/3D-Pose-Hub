#!/usr/bin/env python3
"""Flare 2.0 新动作 8 个进包：r2-v19 → r2-v20（开哥 2026-11-21 00:25 同意：正式出片、上传成片到服务器、生成新 pack 目录；
不切任何指针、不合并、不 tag）。照抄 tools/thomas-sup/publish/build_r2_v19.py（r2-v18 → r2-v19）的结构。

r2-v20 = 线上 r2-v19 的 261 个动作逐字节不变（r2-v18 的 249 + 托马斯补充 12；动作、语音、voiceGuide、共用词、定义字段、taxonomy 全部原样）
        + 末尾追加 8 个 Flare 2.0 新动作（tools/flare2-moves/actions.json 的顺序）。
新动作的对象键只追加、不覆盖：成片 media/<id>/r2-v20/<id>.{rgb-alpha.mp4,cover.alpha.webp,thumbnail.alpha.webp}、
语音 voice/<id>/r2-v20/<lang>/<clip>.m4a（仍在 pack/r2-v1/ 前缀下，与 r2-v19 同一 mediaDistribution）；目录在 pack/r2-v20/。
共用词（报数、开始、休息 N 秒、换边……）直接用 r2-v19（= r2-v18）的 voiceCommon，不重合成。

新动作的内容来源（都在本分支，脚本只搬运、不编写）：
  - 文字与 voiceGuide：catalog/production/flare2-moves-r1/text/<id>.json（草稿，reviewStatus 原样写进目录）；
  - 目录字段（肌群、器械、体位、类别、剂量范围、禁忌、替代）：tools/flare2-moves/publish/pack-fields.json（草稿）；
  - 节奏（fps、帧数、时长、封面帧）：正式渲染母帧/成片包 <render-root>/masters|packages/<id>/；
  - 媒体与语音：导出目录 <media-root>、语音目录 <voice-root>（tools/flare2-moves/publish/voice_flare2.py 的输出）。

**不生成任何渠道指针**（没有 channels/ 目录）。只写 pointer-preview.json 给 SDK 本地预检用，它不上传。

  # 草稿（沙箱，没有成片和语音）：
  python3 tools/flare2-moves/publish/build_r2_v20.py --out <dir> --source-commit <40 位> --draft
  # 定稿（渲染机）：
  python tools/flare2-moves/publish/build_r2_v20.py --out F:/PoseHub-v3/app-pack/r2-v20 --source-commit <40 位> \
      --render-root <正式渲染目录> --media-root F:/PoseHub-v3/app-pack/r2-v20 --voice-root <语音目录>
定稿写 catalog.json、catalog/catalog.json、report.json、media-receipts.json、plan.json（上传清单：24 个成片 + 新语音 + 最后 4 个目录文件）、
pointer-preview.json。有问题列出并拒绝写目录（退出码 1）。最后一行打印 JSON（problemCount 等）。
"""
import argparse, copy, hashlib, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "app-pack"))
from catalog_pointer import default_published_at, published_at, validate_catalog_pointer  # noqa: E402

PACK, PREV = "r2-v20", "r2-v19"
CAT_BASE = f"https://media.uuugk.win/pack/{PACK}/"
SRC = os.path.join(HERE, "base-r2-v19")
SRC_CATALOG_SHA = "2100641560ee3a6e5d53c0a948b9e7034c4fe3120c71389f1b0d3726c0f19060"   # 线上 pack/r2-v19/catalog.json（5,386,565 B；没有指针指向它）
SRC_SEMANTIC_SHA = "39539f805bb838166cac518a5a26724af8b0c20e35ba6ca081cf34e111327758"   # 线上 pack/r2-v19/catalog/catalog.json（335,221 B）
TEXT_DIR = "catalog/production/flare2-moves-r1/text"
RECIPE_DIR = "catalog/production/flare2-moves-r1/recipes"
RENDER_BRANCH = "codex/flare2-publish"
RENDER_BASE = "3fbc22e555b4d88cdab5cc4a3eb051c4b1643435"   # 渲染内容 = codex/flare2-moves-r1 3fbc22e（开哥审过样片，2026-11-21 00:25 同意出片）
SKIN, THEME = "v5-toon", "light"
MIN_SDK = "0.8.0"   # 与 r2-v18 线上指针、r2-v19 预览指针相同
N_OLD, N_NEW = 261, 8
KINDS = {"video": "rgb-alpha.mp4", "cover": "cover.alpha.webp", "thumbnail": "thumbnail.alpha.webp"}
CTYPE = {"video": "video/mp4", "cover": "image/webp", "thumbnail": "image/webp"}
# 新片规格 = r2-v18 同类文件（脚本核对）
SPEC = {"video": (720, 1440, "h264", "yuv420p"), "cover": (640, 640), "thumbnail": (192, 192)}
BASE_CLIPS = ["name", "primaryCue", "phase.start", "phase.peak", "phase.end"]
LANGS = ["zh", "en"]
SECTIONS = (("set", "set"), ("reminders", "rem"), ("steps", "step"))
DEFINITION_FIELDS = ["purpose", "category", "muscles", "muscleGroups", "equipment", "position", "unilateral", "level", "scenes",
                     "defaultDose", "doseRange", "cues", "primaryCue", "cautions", "contraindications", "alternative"]
# 与 r2-v18/r2-v19 的 t-tuck-planche 同一套键（单侧动作多 startingSide）
TEMPLATE_ID = "t-tuck-planche"
TOP_CHANGED = ("pack", "id", "sourceCommit", "previousPack", "mediaDistribution", "sourceRuns", "semanticCatalog", "actions",
               "latestOverrides", "trainingSemantics", "readyCount", "totalCount")
MD_CHANGED = ("version", "note", "mediaFiles", "mediaBytes", "voiceFiles", "voiceBytes")
TS_CHANGED = ("updatedActionIds", "updatedActionCount", "definitionCompleteIds", "definitionCompleteCount")


def sha(b): return hashlib.sha256(b).hexdigest()
def rd(p):
    with open(p, "rb") as f: return f.read()
def jl(p):
    # Windows 上 compose.py 按本机编码（GBK）写 package.json，同 tools/v5/batch-sheet.py 的处理
    b = rd(p)
    for enc in ("utf-8-sig", "gbk"):
        try: return json.loads(b.decode(enc))
        except UnicodeDecodeError: continue
    raise SystemExit(f"无法解码 {p}（utf-8/gbk 都不行）")
def dump(o): return (json.dumps(o, ensure_ascii=False, indent=1) + "\n").encode()
def sha_lf(p): return sha(rd(p).replace(b"\r\n", b"\n"))


def probe(p):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                        "stream=width,height,codec_name,pix_fmt", "-of", "json", p], capture_output=True, text=True)
    return (json.loads(o.stdout or "{}").get("streams") or [{}])[0]


def exec_phases(phases):
    if not phases: return ""
    return "; ".join(f"{p['id']}={p['seconds']:g}s" + (f"@{p['cue']}" if p.get("cue") else "") for p in phases)


def voice_guide(t):
    """文字稿 voiceGuide → 目录 voiceGuide：status ready、自写句加 clipId；phaseCues none 写成 first-2-reps
    （r2-v16 起的发包做法：现有 SDK 不认 none 会整段回退；training.phases 没有 cue 标记，效果同 none）。"""
    g = copy.deepcopy(t["voiceGuide"]); g["status"] = "ready"; ids = []
    if g.get("phaseCues") == "none": g["phaseCues"] = "first-2-reps"
    for sec, short in SECTIONS:
        for k, x in enumerate(g.get(sec) or []):
            if isinstance(x, dict) and "zh" in x and "en" in x and "key" not in x:
                x["clipId"] = f"g.{short}.{k}"; ids.append((x["clipId"], x))
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


def scenes_for(equipment, position, tax):
    sc = ["home", "office", "gym"]
    for e in equipment: sc = [s for s in sc if s in tax["equipment"][e]["scenes"]]
    if tax["positions"][position]["floor"]: sc = [s for s in sc if s != "office"]
    return sc


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", required=True); ap.add_argument("--source-commit", required=True)
    ap.add_argument("--render-root"); ap.add_argument("--media-root"); ap.add_argument("--voice-root")
    ap.add_argument("--published-at", type=published_at, default=default_published_at())
    ap.add_argument("--draft", action="store_true")
    a = ap.parse_args()
    if not a.draft and not (a.render_root and a.media_root and a.voice_root): raise SystemExit("定稿需要 --render-root --media-root --voice-root")
    if len(a.source_commit) != 40: raise SystemExit("--source-commit 要 40 位完整提交号")
    os.chdir(ROOT)
    raw, sraw = rd(os.path.join(SRC, "catalog.json")), rd(os.path.join(SRC, "catalog", "catalog.json"))
    if sha(raw) != SRC_CATALOG_SHA: raise SystemExit(f"{PREV} catalog.json SHA 不符（base-r2-v19 不是线上 r2-v19）")
    if sha(sraw) != SRC_SEMANTIC_SHA: raise SystemExit(f"{PREV} catalog/catalog.json SHA 不符")
    cat, sem = json.loads(raw), json.loads(sraw)
    before, sem_before = copy.deepcopy(cat), copy.deepcopy(sem)
    md = cat["mediaDistribution"]; base, prefix = md["baseUrl"], md["objectKeyPrefix"]
    tax = sem["taxonomy"]
    plan_ts = jl("tools/flare2-moves/actions.json")["actions"]
    fields = jl(os.path.join(HERE, "pack-fields.json"))
    old_ids = [x["id"] for x in cat["actions"]]
    tmpl = next(x for x in cat["actions"] if x["id"] == TEMPLATE_ID)
    problems, notes, receipts, plan = [], [], [], []
    stat = {"actions": 0, "mediaFiles": 0, "mediaBytes": 0, "voiceFiles": 0, "voiceBytes": 0, "pendingExport": 0, "pendingVoice": 0}
    if len(old_ids) != N_OLD: problems.append(f"{PREV} 动作数 {len(old_ids)} ≠ {N_OLD}")
    new_ids = [x["id"] for x in plan_ts]
    if len(new_ids) != N_NEW or len(set(new_ids)) != N_NEW: problems.append(f"Flare 2.0 新动作名单 {len(new_ids)} 个（应 {N_NEW}）")
    if set(new_ids) & set(old_ids): problems.append(f"新动作 id 已在 {PREV}：{sorted(set(new_ids) & set(old_ids))}")
    if set(fields["actions"]) != set(new_ids): problems.append("pack-fields.json 动作集合与 actions.json 不同")
    vc_keys = {}
    for f in cat["voiceCommon"]["files"]: vc_keys.setdefault(f["language"], set()).add(f["key"])
    new_actions, new_drills = [], []

    for p in plan_ts:
        i = p["id"]
        tp, rp, spec = f"{TEXT_DIR}/{i}.json", f"{RECIPE_DIR}/{i}.json", p["spec"]
        t, rec, pf = jl(tp), jl(rp), fields["actions"][i]
        if t.get("id") != i: problems.append(f"{i}: 文字稿 id 不符")
        if rec.get("spec") != spec: problems.append(f"{i}: 配方 spec {rec.get('spec')} ≠ 名单 {spec}")
        if rec.get("specSha256Lf") != sha_lf(spec): problems.append(f"{i}: 配方 specSha256Lf 与 spec 文件不符（先跑 gen-recipes.py --check）")
        if not t.get("voiceGuide"): problems.append(f"{i}: 文字稿没有 voiceGuide"); continue
        cues = t["cues"]; prim = [k for k, c in enumerate(cues) if c.get("primary")]
        if len(prim) != 1: problems.append(f"{i}: primary cue 数量 {len(prim)}"); continue
        tags = t["tags"]; dd = t["defaultDose"]; tr = t["training"]
        for e in pf["equipment"]:
            if e not in tax["equipment"]: problems.append(f"{i}: 器械 {e} 不在目录词表")
        for m in pf["muscleGroups"]:
            if m not in tax["muscleGroups"]: problems.append(f"{i}: 肌群 {m} 不在目录词表")
        if pf["position"] not in tax["positions"]: problems.append(f"{i}: 体位 {pf['position']} 不在目录词表")
        if pf["category"] not in tax["categories"]: problems.append(f"{i}: 类别 {pf['category']} 不在目录词表")
        for c in pf["contraindications"]:
            if c not in tax["cautions"]: problems.append(f"{i}: 禁忌 {c} 不在目录词表")
        if pf["alternative"] is not None and pf["alternative"] not in old_ids + new_ids: problems.append(f"{i}: 替代动作 {pf['alternative']} 不存在")
        dr = pf["doseRange"]
        for k in ("sets", "reps", "seconds", "restSeconds"):
            if k in dd and dr and k in dr and not (dr[k][0] <= dd[k] <= dr[k][1]): problems.append(f"{i}: defaultDose.{k} {dd[k]} 不在 doseRange {dr[k]}")
        if any(e not in tax["equipment"] for e in pf["equipment"]) or pf["position"] not in tax["positions"]: continue
        scenes = scenes_for(pf["equipment"], pf["position"], tax)
        muscles = [tax["muscleGroups"][m]["zh"] for m in pf["muscleGroups"]]
        # ---- 节奏（正式渲染）
        fps, frames, dur, cover_frame, model = 30, None, None, None, None
        if a.render_root:
            mp = os.path.join(a.render_root, "masters", i, "layer-manifest.json")
            pp = os.path.join(a.render_root, "packages", i, "package.json")
            if not os.path.isfile(mp): problems.append(f"{i}: 缺正式母帧 masters/{i}/layer-manifest.json"); continue
            if not os.path.isfile(pp): problems.append(f"{i}: 缺正式成片包 packages/{i}/package.json"); continue
            m, pk = jl(mp), jl(pp)
            if m.get("complete") is not True: problems.append(f"{i}: 母帧不完整（complete={m.get('complete')}）")
            if [s.get("id") for s in m.get("skins", [])] != [SKIN]: problems.append(f"{i}: 母帧皮肤 ≠ [{SKIN}]")
            if (m.get("profile") or {}).get("id") != "v5": problems.append(f"{i}: 母帧 profile ≠ v5")
            if (m.get("recipe") or {}).get("sha256") != sha(rd(rp)): problems.append(f"{i}: 母帧配方 SHA 与本分支配方不同（不是这次的正式渲染？）")
            fps, dur, frames, cover_frame = m["fps"], m["durationSeconds"], pk["loopFrames"], pk["keyframes"]["peak"]
            model = m.get("productionModel")
            if (pk.get("flags") or {}).get("sampledOnly"): problems.append(f"{i}: 成片包 sampledOnly")
        else:
            notes.append(f"{i}: 草稿，无母帧，节奏按 8 s / 30 fps 占位")
            dur, frames, cover_frame = 8, 240, 120
        if isinstance(model, dict): model = f"{model.get('profile')}@{model.get('version')}"
        # r2-v19 的母帧 productionModel 已是完整串，套了两层（"…(pose solved on coach-v3r3-wristfix@v5-toon (pose solved on …))"）；
        # 这里已是完整串时原样用，只套一层
        model_s = model if isinstance(model, str) and model.startswith("coach-") else \
            f"coach-v3r3-wristfix@v5-toon (pose solved on {model or 'training-human-v3-armfix@0.1.0-r2'})"
        ex = {"kind": tr["kind"], "leadSeconds": tr.get("leadSeconds", 1), "phases": exec_phases(tr.get("phases")), "source": tr.get("source")}
        if dd.get("mode") == "reps": ex["reps"] = dd.get("reps")
        for k in ("perSide", "repUnit", "sideSwitchSeconds"):
            if k in tr: ex[k] = tr[k]
        if t.get("startingSide"): ex["startingSide"] = t["startingSide"]
        tsha, rsha = sha(rd(tp)), sha(rd(rp))
        act = {
            "id": i, "nameZh": t["name"]["zh"], "muscleGroups": pf["muscleGroups"], "equipment": pf["equipment"],
            "rhythm": {"fps": fps, "frames": frames, "durationSeconds": dur, "coverFrame": cover_frame, "policy": "pose-hub-v3-source-motion",
                       "execution": ex, "executionStatus": t["reviewStatus"],
                       "executionSource": {"path": tp, "actionId": i, "sha256": tsha}, "videoLoopIsTrainingDose": False},
            "source": {"branch": RENDER_BRANCH, "commit": a.source_commit, "renderCommit": RENDER_BASE,
                       "spec": {"path": spec, "sha256": sha_lf(spec)}, "mediaSet": os.path.basename(os.path.normpath(a.render_root)) if a.render_root else "pending-render",
                       "model": model_s},
            "revision": f"{i}-{PACK}", "state": "ready-test-unreviewed", "reviewed": False, "releaseEligible": False, "family": i,
            "muscleGroupsZh": "、".join(muscles), "equipmentZh": "、".join(tax["equipment"][e]["zh"] for e in pf["equipment"]),
            "trainingDefinitionComplete": True,
            "trainingSemantics": {"status": "complete-unreviewed", "reviewed": False, "releaseEligible": False, "batchId": "flare2-moves-r1",
                                  "definitionComplete": True, "missingRequiredFields": [], "unknownFields": [],
                                  "evidence": [{"path": tp, "sha256": tsha}, {"path": rp, "sha256": rsha},
                                               {"path": "tools/flare2-moves/publish/pack-fields.json", "actionId": i},
                                               {"path": "catalog/catalog.json", "actionId": i}],
                                  "videoLoopIsTrainingDose": False},
            "purpose": t["purpose"]["zh"], "category": pf["category"], "muscles": muscles, "position": pf["position"],
            "unilateral": t["unilateral"], "level": tags["difficulty"], "scenes": scenes, "defaultDose": dd, "doseRange": dr,
            "cues": {"zh": [c["text"]["zh"] for c in cues]}, "primaryCue": prim[0],
            "cautions": [c["zh"] for c in t.get("cautions", [])], "contraindications": pf["contraindications"], "alternative": pf["alternative"],
            "sourceRevision": os.path.basename(spec)[:-3], "mediaRevision": PACK,
            "repairReason": "Flare 2.0 新动作 r1（V5 日漫 v5-toon；开哥审过样片 3fbc22e，2026-11-21 00:25 同意正式出片上传）",
            "files": {}, "qa": {"report": {"path": f"qa/{i}/{PACK}/export-check.json", "bytes": None, "sha256": None}, "metrics": {"status": "pending-export"}},
            "availableForApp": True, "availableForTraining": True,
            "nameEn": t["name"]["en"], "purposeEn": t["purpose"]["en"],
            "activeMuscles": tags["activeMuscles"], "synergistMuscles": tags.get("synergistMuscles", []), "equipmentEn": pf["equipment"],
            "cuesEn": [c["text"]["en"] for c in cues], "commonErrors": t.get("commonErrors", []),
            "cautionsEn": [c["en"] for c in t.get("cautions", [])], "phases": t["phases"], "training": tr,
            "reviewStatus": t["reviewStatus"], "packRevision": PACK, "assetStatus": "pending-export",
            "recipe": {"path": rp, "sha256": rsha, "fingerprint": "sha256:" + rsha},
            "doseRangeSource": "flare2-default-dose-single-point-2026-11-21", "scenesSource": "inferred-from-equipment-and-position",
            "poseHubText": {k: v for k, v in t.items() if k not in ("voiceGuide", "review")},
            "voice": None, "status": "active",
        }
        if t["unilateral"]:
            if t.get("startingSide") not in ("left", "right"): problems.append(f"{i}: 单侧动作缺 startingSide")
            act["startingSide"] = t["startingSide"]
        g, gids = voice_guide(t)
        act["voiceGuide"] = g
        for lang in LANGS:
            miss = common_keys(g) - vc_keys.get(lang, set())
            if miss: problems.append(f"{i}: voiceGuide 用到 {PREV} 共用词没有的 {lang} {sorted(miss)}")
        want = set(tmpl) | ({"startingSide"} if t["unilateral"] else set())
        if set(act) != want: problems.append(f"{i}: 字段集合与 {TEMPLATE_ID} 不同 {sorted(set(act) ^ want)}")
        # ---- 媒体
        for kind, suffix in KINDS.items():
            o = tmpl["files"][kind]
            rel = f"media/{i}/{PACK}/{i}.{suffix}"
            f = {k: None for k in o}
            f.update({"path": rel, "assetName": f"{i}.{suffix}", "downloadUrl": base + rel})
            if kind != "video": f["alpha"] = True
            if not a.media_root:
                sp = SPEC[kind]; f.update({"width": sp[0], "height": sp[1], "bytes": None, "sha256": None, "status": "pending-export"})
                if kind == "video": f.update({"codec": sp[2], "pixelFormat": sp[3]})
                act["files"][kind] = f; stat["pendingExport"] += 1; continue
            fp = os.path.join(a.media_root, rel)
            if not os.path.isfile(fp) or os.path.getsize(fp) == 0: problems.append(f"缺文件或空文件 {rel}"); continue
            b = rd(fp); h, n = sha(b), len(b)
            pr = probe(fp); w, hh = int(pr.get("width") or 0), int(pr.get("height") or 0)
            f.update({"bytes": n, "sha256": h, "width": w, "height": hh, "status": "ready"})
            if (w, hh) != SPEC[kind][:2]: problems.append(f"{rel}: 尺寸 {w}x{hh} ≠ {SPEC[kind][0]}x{SPEC[kind][1]}")
            if kind == "video":
                f.update({"codec": pr.get("codec_name"), "pixelFormat": pr.get("pix_fmt")})
                if (f["codec"], f["pixelFormat"]) != SPEC["video"][2:]: problems.append(f"{rel}: 编码 {f['codec']}/{f['pixelFormat']} ≠ h264/yuv420p")
            if set(f) != set(o): problems.append(f"{i}.{kind}: 字段集合与 {PREV} 不同 {sorted(set(f) ^ set(o))}")
            act["files"][kind] = f
            ent = {"id": i, "kind": kind, "path": rel, "objectKey": prefix + rel, "source": fp, "contentType": CTYPE[kind],
                   "bytes": n, "sha256": h, "inCatalog": True}
            plan.append(ent); receipts.append({k: ent[k] for k in ent if k != "source"})
            stat["mediaFiles"] += 1; stat["mediaBytes"] += n
        act["files"] = {k: act["files"][k] for k in KINDS if k in act["files"]}
        # ---- 语音（基础 5 句 + 自写引导句，中英）
        if not a.voice_root:
            act["voice"] = {"status": "pending-voice", "revision": PACK, "files": []}; stat["pendingVoice"] += 1
        else:
            pdir = os.path.join(a.voice_root, "packages", i)
            try:
                mb, gb = rd(os.path.join(pdir, "voice-manifest.json")), rd(os.path.join(pdir, "voice-guide-manifest.json"))
            except OSError as e:
                problems.append(f"{i}: 缺语音清单 {e.filename}"); mb = gb = None
            if mb is not None:
                m, gm = json.loads(mb), json.loads(gb)
                if m.get("status") != "technical-passed": problems.append(f"{i}: 基础语音 {m.get('status')} {m.get('summary', {}).get('auditFailed')}")
                if gm.get("status") != "technical-passed": problems.append(f"{i}: 引导语音 {gm.get('status')} {gm.get('summary', {}).get('auditFailed')}")
                if gm.get("text", {}).get("sha256") != tsha: problems.append(f"{i}: 引导语音清单的文字稿 SHA 与本分支不同（文字改过要重合成）")
                vs = {"name": t["name"], "primaryCue": cues[prim[0]]["text"], **{f"phase.{k}": t["phases"][k] for k in ("start", "peak", "end")}}
                files = []
                for lang in LANGS:
                    for clip in BASE_CLIPS + [c for c, _ in gids]:
                        src = (m if clip in BASE_CLIPS else gm)["lines"][lang].get(clip)
                        if not src: problems.append(f"{i}: 缺语音 {lang}/{clip}"); continue
                        want_text = vs[clip][lang] if clip in BASE_CLIPS else dict(gids)[clip][lang]
                        if src["text"] != want_text: problems.append(f"{i}: 语音 {lang}/{clip} 文字 {src['text']!r} ≠ 文字稿 {want_text!r}")
                        fp = os.path.join(pdir, "voice", lang, f"{clip}.m4a")
                        if not os.path.isfile(fp): problems.append(f"{i}: 缺文件 {fp}"); continue
                        b = rd(fp); h, n = sha(b), len(b)
                        if h != src["ref"]["sha256"]: problems.append(f"{fp}: 与清单 SHA 不符")
                        rel = f"voice/{i}/{PACK}/{lang}/{clip}.m4a"
                        ent = {"id": i, "kind": "voice", "path": rel, "objectKey": prefix + rel, "source": fp, "contentType": "audio/mp4",
                               "bytes": n, "sha256": h, "language": lang, "clipId": clip, "text": src["text"], "inCatalog": True}
                        plan.append(ent); receipts.append({k: ent[k] for k in ent if k != "source"})
                        files.append({"language": lang, "clipId": clip, "role": src.get("role", "guide"), "path": rel,
                                      "sourcePath": f"packages/{i}/voice/{lang}/{clip}.m4a", "bytes": n, "sha256": h,
                                      "durationSeconds": src["ref"]["durationSeconds"], "assetName": f"{clip}.m4a",
                                      "downloadUrl": base + rel, "contentType": "audio/mp4", "text": src["text"]})
                        stat["voiceFiles"] += 1; stat["voiceBytes"] += n
                act["voice"] = {"status": "ready", "sourceBatch": os.path.basename(os.path.normpath(a.voice_root)), "revision": PACK,
                                "sourceManifest": {"path": f"packages/{i}/voice-manifest.json", "sha256": sha(mb), "status": m["status"]},
                                "guideManifest": {"path": f"packages/{i}/voice-guide-manifest.json", "sha256": sha(gb), "status": gm["status"]},
                                "manualListening": "pending", "files": files}
        drill = {"id": i, "name": t["name"], "purpose": act["purpose"], "category": act["category"], "muscles": muscles,
                 "muscleGroups": act["muscleGroups"], "equipment": act["equipment"], "position": act["position"], "unilateral": act["unilateral"],
                 "level": act["level"], "scenes": scenes, "defaultDose": dd, "doseRange": dr, "cues": act["cues"], "primaryCue": prim[0],
                 "cautions": act["cautions"], "contraindications": act["contraindications"], "alternative": act["alternative"],
                 "apps": fields["apps"], "tags": fields["tags"], "review": {"status": t["reviewStatus"]}}
        new_actions.append(act); new_drills.append(drill); stat["actions"] += 1

    # ---- 追加
    cat["actions"] = cat["actions"] + new_actions
    sem["drills"] = sem["drills"] + new_drills
    for x in new_actions: cat["latestOverrides"][x["id"]] = x["sourceRevision"]
    cat["totalCount"] = cat["readyCount"] = len(cat["actions"])
    ts = cat["trainingSemantics"]
    for k in ("updatedActionIds", "definitionCompleteIds"): ts[k] = ts[k] + [x["id"] for x in new_actions]
    ts["updatedActionCount"] = len(ts["updatedActionIds"]); ts["definitionCompleteCount"] = len(ts["definitionCompleteIds"])

    # ---- 旧 261 个动作（r2-v19 全部）、旧 drills 逐字节不变
    for x, y in zip(cat["actions"], before["actions"]):
        if dump(x) != dump(y): problems.append(f"{y['id']}: {PREV} 旧动作被改动")
    for x, y in zip(sem["drills"], sem_before["drills"]):
        if dump(x) != dump(y): problems.append(f"{y['id']}: {PREV} 旧 drill 被改动")
    # 定义字段与 semantic catalog 逐字一致（SDK _validateSemanticCatalog）
    drills = {d["id"]: d for d in sem["drills"]}
    for act in new_actions:
        d = drills[act["id"]]
        if act["nameZh"] != d["name"]["zh"]: problems.append(f"{act['id']}: nameZh 与 semantic catalog 不一致")
        for f in DEFINITION_FIELDS:
            if act.get(f) != d.get(f): problems.append(f"{act['id']}: {f} 与 semantic catalog 不一致")
    # 路径唯一、在前缀内；新动作对象全是 r2-v20 新键
    seen = set()
    for act in cat["actions"]:
        for f in list(act["files"].values()) + ((act.get("voice") or {}).get("files") or []):
            if f["path"] in seen: problems.append(f"重复路径 {f['path']}")
            seen.add(f["path"])
            if f["downloadUrl"] != base + f["path"]: problems.append(f"downloadUrl 不符 {f['path']}")
    old_paths = {f["path"] for x in before["actions"] for f in list(x["files"].values()) + (x.get("voice") or {}).get("files", [])}
    old_paths |= {f["path"] for f in before["voiceCommon"]["files"]}
    for act in new_actions:
        for f in list(act["files"].values()) + ((act.get("voice") or {}).get("files") or []):
            if f["path"] in old_paths: problems.append(f"新动作路径与 {PREV} 已有对象重复 {f['path']}")
            if not (f["path"].startswith(f"media/{act['id']}/{PACK}/") or f["path"].startswith(f"voice/{act['id']}/{PACK}/")):
                problems.append(f"{act['id']}: {f['path']} 不是 {PACK} 新键")
    if a.media_root and stat["mediaFiles"] != 3 * N_NEW: problems.append(f"成片 {stat['mediaFiles']} ≠ {3 * N_NEW}")
    if a.voice_root:
        want_v = sum(2 * (len(BASE_CLIPS) + len(voice_guide(jl(f'{TEXT_DIR}/{x}.json'))[1])) for x in new_ids)
        if stat["voiceFiles"] != want_v: problems.append(f"新语音 {stat['voiceFiles']} ≠ {want_v}")

    # ---- 顶层
    allv = cat["voiceCommon"]["files"] + [f for x in cat["actions"] for f in (x.get("voice") or {}).get("files", [])]
    md.update({"mediaFiles": sum(len(x["files"]) for x in cat["actions"]),
               "mediaBytes": sum(f["bytes"] or 0 for x in cat["actions"] for f in x["files"].values()),
               "voiceFiles": len(allv), "voiceBytes": sum(f["bytes"] or 0 for f in allv),
               "version": f"posehub-app-pack-{PACK}",
               "note": f"{PACK}：{PREV} 的 {N_OLD} 个动作原样不变 + 追加 Flare 2.0 新动作 {N_NEW} 个（V5 v5-toon 成片 media/<id>/{PACK}/、"
                       f"语音 voice/<id>/{PACK}/；共用词沿用 {PREV}）。新动作文字为草稿，未经开哥审核；本目录发布时不切任何渠道指针"})
    cat["sourceRuns"] = cat["sourceRuns"] + [{"batch": os.path.basename(os.path.normpath(a.render_root)) if a.render_root else "pending-render",
                                              "commit": RENDER_BASE, "selectedActions": len(new_actions),
                                              "replaces": f"{PREV} + {N_NEW} new Flare 2.0 actions (V5 toon)"}]
    cat["pack"], cat["id"], cat["sourceCommit"], cat["previousPack"] = PACK, f"app-pack-{PACK}", a.source_commit, PREV
    sem["source"].update({"pack": PACK, "previousPack": PREV, "commit": a.source_commit})
    sem["generatedAt"] = a.published_at
    sem_bytes = dump(sem); cat["semanticCatalog"].update({"bytes": len(sem_bytes), "sha256": sha(sem_bytes)})
    for k in set(cat) | set(before):
        if k not in TOP_CHANGED and cat.get(k) != before.get(k): problems.append(f"顶层字段 {k} 被改动")
    for k in set(md) | set(before["mediaDistribution"]):
        if k not in MD_CHANGED and md.get(k) != before["mediaDistribution"].get(k): problems.append(f"mediaDistribution.{k} 被改动")
    for k in set(ts) | set(before["trainingSemantics"]):
        if k not in TS_CHANGED and ts.get(k) != before["trainingSemantics"].get(k): problems.append(f"trainingSemantics.{k} 被改动")
    if {k: v for k, v in cat["semanticCatalog"].items() if k not in ("bytes", "sha256")} != \
       {k: v for k, v in before["semanticCatalog"].items() if k not in ("bytes", "sha256")}: problems.append("semanticCatalog 除 bytes/sha256 外被改动")
    for k in set(sem) | set(sem_before):
        if k in ("source", "generatedAt", "drills"): continue
        if sem.get(k) != sem_before.get(k): problems.append(f"semantic catalog {k} 被改动")
    for k, v in before["latestOverrides"].items():
        if cat["latestOverrides"].get(k) != v: problems.append(f"latestOverrides.{k} 被改动")

    report = {"pack": PACK, "from": PREV, "fromCatalogSha256": SRC_CATALOG_SHA, "renderBranch": RENDER_BRANCH, "renderBase": RENDER_BASE,
              "skin": SKIN, "mediaPrefix": prefix, "catalogPrefix": f"pack/{PACK}/", "sourceCommit": a.source_commit,
              "actions": len(cat["actions"]), "newActions": [x["id"] for x in new_actions], "stats": stat, "minSdk": MIN_SDK,
              "textReviewStatus": sorted({x["reviewStatus"] for x in new_actions}), "notes": notes, "problems": problems,
              "channelsGenerated": [], "pointersUntouched": True}
    os.makedirs(os.path.join(a.out, "catalog"), exist_ok=True)
    if a.draft:
        cb = dump(cat); open(os.path.join(a.out, "catalog.draft.json"), "wb").write(cb)
        open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
        report.update({"draft": True, "problemCount": len(problems), "catalogDraft": {"bytes": len(cb), "sha256": sha(cb)}})
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print(json.dumps({"draft": True, "actions": len(cat["actions"]), "stats": stat, "problems": problems[:30], "problemCount": len(problems)}, ensure_ascii=False))
        sys.exit(1 if problems else 0)
    report["problemCount"] = len(problems)
    if problems:
        open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
        print("\n".join(problems[:100])); print(json.dumps({"error": f"{len(problems)} 个问题，未写目录", "problemCount": len(problems)}, ensure_ascii=False)); sys.exit(1)
    cb = dump(cat)
    ptr = {"schema": 1, "pack": PACK, "catalog": CAT_BASE + "catalog.json", "catalog_sha256": sha(cb), "catalog_bytes": len(cb),
           "min_sdk": MIN_SDK, "published_at": a.published_at}
    validate_catalog_pointer(ptr)
    open(os.path.join(a.out, "catalog.json"), "wb").write(cb); open(os.path.join(a.out, "catalog", "catalog.json"), "wb").write(sem_bytes)
    # 只给 SDK 本地预检用；不上传、不是渠道指针
    open(os.path.join(a.out, "pointer-preview.json"), "wb").write(dump(ptr))
    open(os.path.join(a.out, "media-receipts.json"), "wb").write(dump(receipts))
    report.update({"catalog": {"bytes": len(cb), "sha256": sha(cb)}, "semantic": {"bytes": len(sem_bytes), "sha256": sha(sem_bytes)},
                   "receipts": {"files": len(receipts), "totalBytes": sum(r["bytes"] for r in receipts)}, "pointerPreview": ptr})
    open(os.path.join(a.out, "report.json"), "wb").write(dump(report))
    for nme in ("catalog.json", "catalog/catalog.json", "report.json", "media-receipts.json"):
        b = rd(os.path.join(a.out, nme))
        plan.append({"id": None, "kind": "catalog", "path": nme, "objectKey": f"pack/{PACK}/{nme}", "source": os.path.join(a.out, nme),
                     "contentType": "application/json", "bytes": len(b), "sha256": sha(b)})
    for e in plan:
        if e["objectKey"].startswith("pack/channels/"): raise SystemExit("plan.json 里出现了渠道指针（不允许）")
    open(os.path.join(a.out, "plan.json"), "wb").write(dump(plan))
    print(json.dumps({"problemCount": 0, "catalog": report["catalog"], "semantic": report["semantic"], "uploadFiles": len(plan),
                      "mediaFiles": stat["mediaFiles"], "voiceFiles": stat["voiceFiles"], "pointerPreview": ptr}, ensure_ascii=False))


if __name__ == "__main__": main()
