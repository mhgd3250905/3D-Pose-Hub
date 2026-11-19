#!/usr/bin/env python3
"""托马斯补充 12 个动作的语音（r2-v19 用）。合成与审核与 r2-v14 完全相同（codex/v4-publish tools/v4/voice_v4.py：
tools/action-package-v3/voice.py 的 Edge TTS + HipLab 处理与审核，审核不过自动换输入重试），只是：
  - 文字取本分支 catalog/production/thomas-supplement-r1/text/<id>.json（草稿，含 voiceGuide）；
  - 相位时间点取正式渲染母帧 <render-root>/masters/<id>/layer-manifest.json；
  - 共用词（报数、开始、休息、换边……）不合成，r2-v19 直接沿用 r2-v18 线上的 voiceCommon（build_r2_v19.py 核对用到的键都在）。

    python tools/thomas-sup/publish/voice_ts.py --render-root <正式渲染目录> --out <语音目录> [--ids a,b] [--check-only]

每个动作写 <out>/packages/<id>/definition.json、voice-manifest.json（name、primaryCue、phase.start/peak/end 中英）、
voice-guide-manifest.json（voiceGuide 自写句中英，clipId g.<set|rem|step>.<i>）和 voice/<lang>/<clip>.m4a。
可续跑：两份清单都在的动作跳过；TTS 原始音频按文本缓存在 <out>/voice-cache。
--check-only：只核对文字稿（text.py 规则）和要合成的句子数，不联网、不写文件。
最后一行打印 JSON 汇总；有动作失败或审核不过时退出码 3（其余照常完成），参数/环境/文字问题退出码 1。
"""
from __future__ import annotations
import argparse, hashlib, json, sys, time, traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
TEXT_DIR = REPO / 'catalog/production/thomas-supplement-r1/text'
sys.path.insert(0, str(REPO / 'tools/action-package-v3'))
import text as T  # noqa: E402
T.TEXT_DIR = TEXT_DIR   # definition.build / T.load 读托马斯补充文字稿
SECTIONS = (('set', 'set'), ('reminders', 'rem'), ('steps', 'step'))
# 单词句 TTS 收尾太急（与 voice_v4 相同处理）：只换合成输入，manifest 里的 text 仍是原文。
TTS_INPUT = {('en', 'Breathe'): 'Breathe\u2026'}


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def guide_lines(g: dict):
    """自写句子 -> (clipId, {zh, en})；带 key 的是共用词，不在这里合成。clipId 规则与 build_r2_v19.voice_guide 相同。"""
    for sec, short in SECTIONS:
        for i, x in enumerate(g.get(sec) or []):
            if isinstance(x, dict) and 'zh' in x and 'en' in x and 'key' not in x:
                yield f'g.{short}.{i}', x


def plan_ids():
    return [x['id'] for x in json.loads((REPO / 'tools/thomas-sup/actions.json').read_text('utf-8'))['actions']]


def check_texts(ids):
    problems, clips = [], 0
    for aid in ids:
        try:
            t = T.load(aid)   # 文字规则（含 voiceGuide：节拍词、句长、间隔）不过就报错
        except Exception as e:
            problems.append(str(e)); continue
        if not t.get('voiceGuide'): problems.append(f'{aid}: 文字稿没有 voiceGuide'); continue
        clips += 2 * (5 + len(list(guide_lines(t['voiceGuide']))))
    return problems, clips


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--render-root', type=Path)
    ap.add_argument('--out', type=Path)
    ap.add_argument('--ids')
    ap.add_argument('--check-only', action='store_true')
    a = ap.parse_args(argv)
    ids = plan_ids()
    if a.ids:
        want = a.ids.split(',')
        bad = sorted(set(want) - set(ids))
        if bad: print(json.dumps({'error': f'不在托马斯补充名单: {bad}'}, ensure_ascii=False)); return 1
        ids = want
    problems, clips = check_texts(ids)
    if problems or a.check_only:
        print(json.dumps({'checkProblems': problems, 'actions': len(ids), 'clips': clips}, ensure_ascii=False))
        return 1 if problems else 0
    if not (a.render_root and a.out):
        print(json.dumps({'error': '需要 --render-root 和 --out'}, ensure_ascii=False)); return 1

    import definition as D  # noqa: E402
    import voice as V  # noqa: E402
    _orig = V.make_clip

    def variants(text, lang):
        t = text.rstrip()
        out = [t + ('。' if lang == 'zh' else '.'), t + '…']
        if lang == 'en' and t[:1].islower(): out.insert(0, t[:1].upper() + t[1:])
        return [v for v in out if v != text]

    def make_clip(root, text, lang, dest):
        tried = [TTS_INPUT.get((lang, text), text)] + variants(text, lang)
        c = None
        for n, t2 in enumerate(tried):
            if n: Path(dest).unlink(missing_ok=True)   # make_clip 不覆盖已有成品，换输入前先删掉不合格的那条
            c = _orig(root, t2, lang, dest)
            if t2 != text:
                c['text'] = text; c['provenance']['ttsInput'] = t2
            if c['audit']['status'] == 'passed': break
        if len(tried) > 1 and c['provenance'].get('ttsInput'):
            c['provenance']['ttsRetries'] = tried.index(c['provenance']['ttsInput'])
        return c
    V.make_clip = make_clip

    rr, out = a.render_root.resolve(), a.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    log = open(out / 'voice-ts.log', 'a', encoding='utf-8')

    def L(s):
        line = f'{time.strftime("%Y-%m-%d %H:%M:%S")} {s}'
        print(line, flush=True); log.write(line + '\n'); log.flush()

    res = {'format': 'thomas-sup-voice-run@1', 'out': str(out), 'renderRoot': str(rr), 'done': [], 'skipped': [], 'failed': {}, 'auditFailed': {}}
    for n, aid in enumerate(ids, 1):
        pdir = out / 'packages' / aid
        if (pdir / 'voice-manifest.json').exists() and (pdir / 'voice-guide-manifest.json').exists():
            res['skipped'].append(aid); continue
        try:
            if not (rr / 'masters' / aid / 'layer-manifest.json').exists():
                raise RuntimeError(f'缺正式母帧清单 masters/{aid}/layer-manifest.json')
            V.write_once(pdir / 'definition.json', D.build(rr, aid))
            if not (pdir / 'voice-manifest.json').exists():
                V.action(out, aid)
            base = json.loads((pdir / 'voice-manifest.json').read_text('utf-8'))
            tp = TEXT_DIR / f'{aid}.json'
            g = json.loads(tp.read_text('utf-8'))['voiceGuide']
            gm = {'format': 'pose-hub-voice-guide-clips@1', 'actionId': aid,
                  'text': {'path': str(tp.relative_to(REPO)).replace('\\', '/'), 'sha256': sha(tp)},
                  'standard': V.STANDARD, 'voiceProfile': V.PROFILES, 'lines': {}}
            for lang in V.PROFILES:
                Lm = {}
                for cid, x in guide_lines(g):
                    c = make_clip(out, x[lang], lang, pdir / 'voice' / lang / f'{cid}.m4a')
                    c['role'] = 'guide'; c['guideRole'] = x.get('role')
                    Lm[cid] = c
                gm['lines'][lang] = Lm
            cl = [c for l in gm['lines'].values() for c in l.values()]
            gm['summary'] = {'clips': len(cl), 'auditFailed': [c['ref']['path'] for c in cl if c['audit']['status'] != 'passed']}
            gm['status'] = 'technical-passed' if not gm['summary']['auditFailed'] else 'technical-failed'
            V.write_once(pdir / 'voice-guide-manifest.json', gm)
            bad = base['summary']['auditFailed'] + gm['summary']['auditFailed']
            res['done'].append(aid)
            if bad: res['auditFailed'][aid] = bad
            L(f'[{n}/{len(ids)}] {aid} ok guide={len(cl)} auditFailed={len(bad)}')
        except Exception as e:  # 一个动作失败不影响其余
            res['failed'][aid] = f'{type(e).__name__}: {e}'
            L(f'[{n}/{len(ids)}] {aid} FAILED {e}\n{traceback.format_exc()}')
    ok = len(res['done']) + len(res['skipped'])
    res['report'] = (f'托马斯补充语音 {ok}/{len(ids)} 个动作完成，失败 {len(res["failed"])} 个，'
                     f'审核不过 {sum(len(v) for v in res["auditFailed"].values())} 条')
    (out / 'voice-ts-result.json').write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', 'utf-8')
    print(json.dumps(res, ensure_ascii=False))
    return 3 if res['failed'] or res['auditFailed'] else 0


if __name__ == '__main__':
    sys.exit(main())
