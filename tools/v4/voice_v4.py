#!/usr/bin/env python3
"""r2-v14 语音：按 main 的新文字（catalog/production/v3-text，动作包核对 r3）重新合成全部语音。

    python tools/v4/voice_v4.py --v4-root <V4 渲染目录> --out <新语音目录> [--ids a,b] [--common-only]

每个动作：
  1. definition.json：文字取当前检出的 v3-text，相位时间点取 V4 母帧 <v4-root>/masters/<id>/layer-manifest.json
     （与正式生产 definition.py 同一函数），写到 <out>/packages/<id>/definition.json。
  2. 基础语音（name、primaryCue、phase.start/peak/end，中英）：voice.py 的 action()，与线上同一套 Edge TTS + HipLab 处理与审核。
  3. 引导句（voiceGuide 里自写的句子，中英）：<out>/packages/<id>/voice/<lang>/g.<set|rem|step>.<i>.m4a，
     clipId 规则见 docs/voice-guide-pack-contract.md；清单写 <out>/packages/<id>/voice-guide-manifest.json。
共用词（报数、开始、休息 N 秒、换边……）：<out>/voice/common/，跑一次。

可续跑：已有 voice-manifest.json 与 voice-guide-manifest.json 的动作跳过；TTS 原始音频按文本缓存在 <out>/voice-cache。
最后一行打印 JSON 汇总；有动作失败或审核不过时退出码 3（其余照常完成），参数/环境问题退出码 1。
"""
from __future__ import annotations
import argparse, hashlib, json, sys, time, traceback
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(REPO / 'tools/action-package-v3'))
import definition as D  # noqa: E402
import voice as V  # noqa: E402

# 单词句 TTS 收尾太急（与 voice_fill_r1 相同处理）：只换合成输入，manifest 里的 text 仍是原文。
TTS_INPUT = {('en', 'Breathe'): 'Breathe\u2026',
             ('en', 'seventeen'): 'Seventeen',
             ('en', 'Breathe out, sink'): 'Breathe out, sink down.'}  # s-pigeon phase.end：原句后半弱 9–11 dB，加标点/省略号都不过  # 小写原样合成响度 -17.7 LUFS 不达标，首字母大写后 -16.1
_orig_make_clip = V.make_clip


def _variants(text, lang):
    """审核不过时依次换的合成输入：句末加标点 / 首字母大写 / 省略号。只换 TTS 输入，text 不变。"""
    t = text.rstrip()
    out = [t + ('。' if lang == 'zh' else '.'), t + '…']
    if lang == 'en' and t[:1].islower(): out.insert(0, t[:1].upper() + t[1:])
    return [v for v in out if v != text]


def make_clip(root, text, lang, dest):
    first = TTS_INPUT.get((lang, text), text)
    tried = [first] + _variants(text, lang)
    c = None
    for n, t2 in enumerate(tried):
        if n:
            Path(dest).unlink(missing_ok=True)  # make_clip 不覆盖已有成品，换输入前先删掉不合格的那条
        c = _orig_make_clip(root, t2, lang, dest)
        if t2 != text:
            c['text'] = text
            c['provenance']['ttsInput'] = t2
        if c['audit']['status'] == 'passed':
            break
    if len(tried) > 1 and c['provenance'].get('ttsInput'):
        c['provenance']['ttsRetries'] = tried.index(c['provenance']['ttsInput'])
    return c


V.make_clip = make_clip
SECTIONS = (('set', 'set'), ('reminders', 'rem'), ('steps', 'step'))


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def guide_lines(g: dict):
    """自写句子 -> (clipId, {zh, en})；带 key 的是共用词，不在这里合成。"""
    for sec, short in SECTIONS:
        for i, x in enumerate(g.get(sec) or []):
            if isinstance(x, dict) and 'zh' in x and 'en' in x and 'key' not in x:
                yield f'g.{short}.{i}', x


def do_action(v4: Path, out: Path, aid: str) -> dict:
    pdir = out / 'packages' / aid
    if not (v4 / 'masters' / aid / 'layer-manifest.json').exists():
        raise RuntimeError(f'缺 V4 母帧清单 masters/{aid}/layer-manifest.json')
    d = D.build(v4, aid)
    V.write_once(pdir / 'definition.json', d)
    if not (pdir / 'voice-manifest.json').exists():
        V.action(out, aid)
    base = json.loads((pdir / 'voice-manifest.json').read_text('utf-8'))
    text = json.loads((REPO / 'catalog/production/v3-text' / f'{aid}.json').read_text('utf-8'))
    g = text.get('voiceGuide')
    if not g:
        raise RuntimeError('v3-text 没有 voiceGuide')
    gm = {'format': 'pose-hub-voice-guide-clips@1', 'actionId': aid,
          'text': {'path': f'catalog/production/v3-text/{aid}.json', 'sha256': sha(REPO / 'catalog/production/v3-text' / f'{aid}.json')},
          'standard': V.STANDARD, 'voiceProfile': V.PROFILES, 'lines': {}}
    for lang in V.PROFILES:
        L = {}
        for cid, x in guide_lines(g):
            c = make_clip(out, x[lang], lang, pdir / 'voice' / lang / f'{cid}.m4a')
            c['role'] = 'guide'
            c['guideRole'] = x.get('role')
            L[cid] = c
        gm['lines'][lang] = L
    clips = [c for l in gm['lines'].values() for c in l.values()]
    gm['summary'] = {'clips': len(clips), 'auditFailed': [c['ref']['path'] for c in clips if c['audit']['status'] != 'passed']}
    gm['status'] = 'technical-passed' if not gm['summary']['auditFailed'] else 'technical-failed'
    V.write_once(pdir / 'voice-guide-manifest.json', gm)
    return {'base': base['status'], 'baseFailed': base['summary']['auditFailed'],
            'guide': gm['status'], 'guideFailed': gm['summary']['auditFailed'], 'guideClips': len(clips)}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--v4-root', type=Path, required=True)
    ap.add_argument('--out', type=Path, required=True)
    ap.add_argument('--ids')
    ap.add_argument('--common-only', action='store_true')
    a = ap.parse_args(argv)
    v4, out = a.v4_root.resolve(), a.out.resolve()
    out.mkdir(parents=True, exist_ok=True)
    log = open(out / 'voice-v4.log', 'a', encoding='utf-8')

    def L(s):
        line = f'{time.strftime("%Y-%m-%d %H:%M:%S")} {s}'
        print(line, flush=True); log.write(line + '\n'); log.flush()

    res = {'format': 'pose-hub-voice-v4-run@1', 'out': str(out), 'done': [], 'skipped': [], 'failed': {}, 'auditFailed': {}}
    if not (out / 'voice/common/manifest.json').exists():
        L('common'); res['common'] = V.common(out)
    else:
        res['common'] = json.loads((out / 'voice/common/manifest.json').read_text('utf-8'))['summary']
    if a.common_only:
        print(json.dumps(res, ensure_ascii=False)); return 0
    plan = json.loads((REPO / 'tools/v4/v4-actions.json').read_text('utf-8'))
    ids = [x['id'] for x in plan['actions']]
    if a.ids:
        want = a.ids.split(',')
        bad = sorted(set(want) - set(ids))
        if bad:
            print(json.dumps({'error': f'不在 V4 名单: {bad}'}, ensure_ascii=False)); return 1
        ids = want
    for n, aid in enumerate(ids, 1):
        pdir = out / 'packages' / aid
        if (pdir / 'voice-manifest.json').exists() and (pdir / 'voice-guide-manifest.json').exists():
            res['skipped'].append(aid); continue
        try:
            r = do_action(v4, out, aid)
            res['done'].append(aid)
            bad = r['baseFailed'] + r['guideFailed']
            if bad: res['auditFailed'][aid] = bad
            L(f'[{n}/{len(ids)}] {aid} ok guide={r["guideClips"]} auditFailed={len(bad)}')
        except Exception as e:  # 一个动作失败不影响其余
            res['failed'][aid] = f'{type(e).__name__}: {e}'
            L(f'[{n}/{len(ids)}] {aid} FAILED {e}\n{traceback.format_exc()}')
    total = len(ids)
    ok = len(res['done']) + len(res['skipped'])
    if res['common'].get('auditFailed'): res['auditFailed']['_common'] = res['common']['auditFailed']
    res['report'] = (f'语音 {ok}/{total} 个动作完成，失败 {len(res["failed"])} 个，'
                     f'审核不过 {sum(len(v) for v in res["auditFailed"].values())} 条，共用词 {res["common"]["clips"]} 条')
    (out / 'voice-v4-result.json').write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', 'utf-8')
    print(json.dumps(res, ensure_ascii=False))
    return 3 if res['failed'] or res['auditFailed'] else 0


if __name__ == '__main__':
    sys.exit(main())
