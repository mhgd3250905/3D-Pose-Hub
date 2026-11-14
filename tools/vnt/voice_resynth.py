#!/usr/bin/env python3
"""voice-no-tempo-r1 发包：只重合成 resynth.json 列出的讲解句（开哥 2026-11-15 00:08 同意）。

    python tools/vnt/voice_resynth.py --out <新语音目录> [--ids a,b] [--check-only]

清单：catalog/review/voice-no-tempo-r1/resynth.json（193 个动作，557 个片段：中文 280、英文 277）。
动作名、开组要领、相位片段、共用词不重合成，发包时沿用 r2-v15 已上线对象。
合成与审核与 r2-v14 完全相同（tools/v4/voice_v4.py 的 make_clip：Edge TTS + HipLab 处理与审核，审核不过自动换输入重试）。

每个动作写 <out>/packages/<id>/voice/<lang>/<clipId>.m4a 和 <out>/packages/<id>/voice-resynth-manifest.json。
开始前逐条核对 resynth.json 的文字与当前检出的 catalog/production/v3-text/<id>.json 的 voiceGuide 一致，不一致退出码 1。
可续跑：已有 voice-resynth-manifest.json 的动作跳过；TTS 原始音频按文本缓存在 <out>/voice-cache。
最后一行打印 JSON 汇总；有动作失败或审核不过时退出码 3，参数/环境/清单问题退出码 1。
"""
from __future__ import annotations
import argparse, json, sys, time, traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
RESYNTH = REPO / 'catalog/review/voice-no-tempo-r1/resynth.json'
TEXT_DIR = REPO / 'catalog/production/v3-text'
SECTIONS = {'set': 'set', 'rem': 'reminders', 'step': 'steps'}


def guide_text(g: dict, clip: str, lang: str):
    """clipId g.<set|rem|step>.<i> → voiceGuide 里那句的文字（自写句才有）。"""
    _, short, i = clip.split('.')
    arr = g.get(SECTIONS[short]) or []
    i = int(i)
    if i >= len(arr) or not isinstance(arr[i], dict) or 'key' in arr[i]:
        return None
    return arr[i].get(lang)


def check(plan: dict) -> list[str]:
    problems = []
    n = 0
    for aid, ent in plan['actions'].items():
        t = json.loads((TEXT_DIR / f'{aid}.json').read_text('utf-8'))
        g = t.get('voiceGuide') or {}
        for x in ent['synthesize']:
            n += 1
            cur = guide_text(g, x['clipId'], x['language'])
            if cur != x['text']:
                problems.append(f"{aid} {x['language']}/{x['clipId']}: resynth.json {x['text']!r} ≠ v3-text {cur!r}")
        for x in ent['obsolete']:
            if guide_text(g, x['clipId'], x['language']) is not None:
                problems.append(f"{aid} {x['language']}/{x['clipId']}: 标为作废，但 v3-text 里仍有这句")
    st = plan['stats']
    if n != st['resynthClipFiles']:
        problems.append(f"synthesize 共 {n} 条 ≠ stats.resynthClipFiles {st['resynthClipFiles']}")
    return problems


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', type=Path)
    ap.add_argument('--ids')
    ap.add_argument('--check-only', action='store_true')
    a = ap.parse_args(argv)
    plan = json.loads(RESYNTH.read_text('utf-8'))
    problems = check(plan)
    if problems or a.check_only:
        print(json.dumps({'checkProblems': problems, 'actions': sum(1 for v in plan['actions'].values() if v['synthesize']),
                          'clips': plan['stats']['resynthClipFiles']}, ensure_ascii=False))
        return 1 if problems else 0
    if not a.out:
        print(json.dumps({'error': '需要 --out'}, ensure_ascii=False)); return 1
    sys.path.insert(0, str(REPO / 'tools/v4'))
    import voice_v4 as W  # noqa: E402  (make_clip：与 r2-v14 同一套合成/处理/审核与重试)
    V = W.V
    out = a.out.resolve(); out.mkdir(parents=True, exist_ok=True)
    log = open(out / 'voice-resynth.log', 'a', encoding='utf-8')

    def L(s):
        line = f'{time.strftime("%Y-%m-%d %H:%M:%S")} {s}'
        print(line, flush=True); log.write(line + '\n'); log.flush()

    ids = [k for k, v in plan['actions'].items() if v['synthesize']]
    if a.ids:
        want = a.ids.split(',')
        bad = sorted(set(want) - set(ids))
        if bad:
            print(json.dumps({'error': f'不在重合成清单: {bad}'}, ensure_ascii=False)); return 1
        ids = want
    res = {'format': 'pose-hub-voice-resynth-run@1', 'out': str(out), 'resynth': str(RESYNTH.relative_to(REPO)),
           'done': [], 'skipped': [], 'failed': {}, 'auditFailed': {}, 'clips': 0}
    for n, aid in enumerate(ids, 1):
        pdir = out / 'packages' / aid
        mp = pdir / 'voice-resynth-manifest.json'
        if mp.exists():
            m = json.loads(mp.read_text('utf-8'))
            res['skipped'].append(aid); res['clips'] += m['summary']['clips']
            if m['summary']['auditFailed']: res['auditFailed'][aid] = m['summary']['auditFailed']
            continue
        try:
            tp = TEXT_DIR / f'{aid}.json'
            m = {'format': 'pose-hub-voice-resynth-clips@1', 'actionId': aid,
                 'text': {'path': f'catalog/production/v3-text/{aid}.json', 'sha256': W.sha(tp)},
                 'standard': V.STANDARD, 'voiceProfile': V.PROFILES, 'lines': {l: {} for l in V.PROFILES}}
            for x in plan['actions'][aid]['synthesize']:
                lang, cid = x['language'], x['clipId']
                c = W.make_clip(out, x['text'], lang, pdir / 'voice' / lang / f'{cid}.m4a')
                c['role'] = 'guide'
                m['lines'][lang][cid] = c
            clips = [c for l in m['lines'].values() for c in l.values()]
            m['summary'] = {'clips': len(clips), 'auditFailed': [c['ref']['path'] for c in clips if c['audit']['status'] != 'passed']}
            m['status'] = 'technical-passed' if not m['summary']['auditFailed'] else 'technical-failed'
            V.write_once(mp, m)
            res['done'].append(aid); res['clips'] += len(clips)
            if m['summary']['auditFailed']: res['auditFailed'][aid] = m['summary']['auditFailed']
            L(f'[{n}/{len(ids)}] {aid} ok clips={len(clips)} auditFailed={len(m["summary"]["auditFailed"])}')
        except Exception as e:  # 一个动作失败不影响其余
            res['failed'][aid] = f'{type(e).__name__}: {e}'
            L(f'[{n}/{len(ids)}] {aid} FAILED {e}\n{traceback.format_exc()}')
    ok = len(res['done']) + len(res['skipped'])
    res['report'] = (f'重合成 {ok}/{len(ids)} 个动作完成，片段 {res["clips"]} 条，失败 {len(res["failed"])} 个，'
                     f'审核不过 {sum(len(v) for v in res["auditFailed"].values())} 条')
    (out / 'voice-resynth-result.json').write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', 'utf-8')
    print(json.dumps(res, ensure_ascii=False))
    return 3 if res['failed'] or res['auditFailed'] else 0


if __name__ == '__main__':
    sys.exit(main())
