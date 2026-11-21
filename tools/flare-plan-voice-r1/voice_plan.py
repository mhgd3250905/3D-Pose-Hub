#!/usr/bin/env python3
"""Flare 热身/练后计划口播（flare-plan-voice-r1）：按 Flare 导出的清单逐条用 Pose-Hub 标准语音流程合成。

合成、处理与审核与 r2-v14…r2-v22 动作语音完全相同（tools/action-package-v3/voice.py：Edge TTS zh-CN-XiaoxiaoNeural +6%，
HipLab 处理 AAC 44.1 kHz 单声道 64 kbps、-16 LUFS、真峰值 ≤ -1 dBTP；审核不过自动换输入重试，同 voice_flare2.py）。
另加一道可懂度粗检：中文语速须在 2.5–8.5 字/秒、有效语音 ≥ 0.4 秒，否则记审核不过。

    python tools/flare-plan-voice-r1/voice_plan.py build  --manifest <manifest.json> --work <工作目录> --out <handoff out 目录>
    python tools/flare-plan-voice-r1/voice_plan.py verify absent|online --work <工作目录>
    python tools/flare-plan-voice-r1/voice_plan.py build  --manifest <...> --check-only     # 只读清单，不联网不写文件

清单：JSON 数组，或 {items|entries|clips|files: [...]}；每条 {file, text, lang?}（lang 缺省 zh，只支持 zh）。
file 是包内相对路径，原样作为输出相对路径。扩展名 .m4a/.aac 直接用 AAC 成品；.mp3/.wav/.ogg 由同一成品转码（响度不变），
其余扩展名报错。

build 写：
  <work>/clips/<file>           成品（与 <out>/<file> 逐字节相同）
  <work>/voice-cache/           TTS 原始音频缓存（可续跑）
  <work>/plan-voice-manifest.json  每条 file/text/sha256/bytes/durationSeconds/audit（上传到 R2）
  <work>/plan.json              上传清单（数组：id/kind/path/objectKey/source/bytes/sha256/contentType），与 r2-v2x plan.json 同格式
R2 只追加：pack/r2-v1/plan-voice/flare-plan-voice-r1/<file> 与 …/manifest.json；不写任何 pack/channels/、不改任何 catalog。
最后一行打印 JSON 汇总；有失败或审核不过退出码 3，清单/参数问题退出码 1。
"""
from __future__ import annotations
import argparse, hashlib, json, shutil, subprocess, sys, time, traceback, urllib.request, urllib.error
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(REPO / 'tools/action-package-v3'))

VERSION = 'flare-plan-voice-r1'
PREFIX = f'pack/r2-v1/plan-voice/{VERSION}/'
BASE_URL = 'https://media.uuugk.win/'
CT = {'.m4a': 'audio/mp4', '.aac': 'audio/aac', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.json': 'application/json'}
AAC_EXT = {'.m4a', '.aac'}
TRANSCODE = {'.mp3': ['-c:a', 'libmp3lame', '-b:a', '64k'], '.wav': ['-c:a', 'pcm_s16le'], '.ogg': ['-c:a', 'libvorbis', '-q:a', '4']}


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def load_manifest(path: Path):
    d = json.loads(path.read_text('utf-8-sig'))
    if isinstance(d, dict):
        for k in ('items', 'entries', 'clips', 'files', 'lines'):
            if isinstance(d.get(k), list): d = d[k]; break
    if not isinstance(d, list): raise SystemExit(json.dumps({'error': '清单不是数组也没有 items/entries/clips/files'}, ensure_ascii=False))
    items, problems, seen = [], [], set()
    for i, x in enumerate(d):
        f, t, lang = (x or {}).get('file'), (x or {}).get('text'), (x or {}).get('lang', 'zh')
        if not f or not isinstance(t, str) or not t.strip(): problems.append(f'#{i}: 缺 file 或 text'); continue
        f = f.replace('\\', '/').lstrip('/')
        if '..' in f.split('/'): problems.append(f'#{i}: file 含 ..'); continue
        if lang != 'zh': problems.append(f'#{i} {f}: lang={lang} 只支持 zh')
        ext = Path(f).suffix.lower()
        if ext not in AAC_EXT and ext not in TRANSCODE: problems.append(f'#{i} {f}: 不支持的扩展名 {ext}')
        if f.lower() in seen: problems.append(f'#{i} {f}: file 重复')
        seen.add(f.lower())
        items.append({'file': f, 'text': t.strip(), 'lang': 'zh'})
    return items, problems


def intelligibility(text: str, c: dict):
    chars = sum(1 for ch in text if '\u4e00' <= ch <= '\u9fff' or ch.isalnum())
    a = c['audit']; dur = c['ref']['durationSeconds']
    speech = max(0.0, dur - ((a.get('leadMs') or 0) + (a.get('tailMs') or 0)) / 1000)
    rate = chars / speech if speech > 0 else 0
    fails = []
    if speech < 0.4: fails.append(f'speech {speech:.2f}s too short')
    elif not 2.5 <= rate <= 8.5: fails.append(f'rate {rate:.1f} chars/s out of 2.5-8.5')
    return round(rate, 2), round(speech, 3), fails


def build(a):
    items, problems = load_manifest(a.manifest)
    if problems or a.check_only:
        print(json.dumps({'checkProblems': problems, 'items': len(items)}, ensure_ascii=False)); return 1 if problems else 0
    import voice as V  # noqa: E402
    work, out = a.work.resolve(), a.out.resolve()
    (work / 'clips').mkdir(parents=True, exist_ok=True); out.mkdir(parents=True, exist_ok=True)
    log = open(work / 'voice-plan.log', 'a', encoding='utf-8')

    def L(s):
        line = f'{time.strftime("%Y-%m-%d %H:%M:%S")} {s}'; print(line, flush=True); log.write(line + '\n'); log.flush()

    def variants(t):
        return [v for v in (t, t.rstrip('。.!！') + '。', t.rstrip('。.!！') + '…') if v]

    def make(text, dest_aac):
        c, tried = None, list(dict.fromkeys(variants(text)))
        for n, t2 in enumerate(tried):
            if n: dest_aac.unlink(missing_ok=True)
            c = V.make_clip(work, t2, 'zh', dest_aac)
            if t2 != text: c['text'] = text; c['provenance']['ttsInput'] = t2
            r, sp, f = intelligibility(text, c)
            c['audit']['charsPerSecond'], c['audit']['speechSeconds'] = r, sp
            if f: c['audit']['fails'] = list(c['audit']['fails']) + f; c['audit']['status'] = 'failed'
            if c['audit']['status'] == 'passed': break
        return c

    res = {'format': 'flare-plan-voice-run@1', 'version': VERSION, 'manifest': {'path': str(a.manifest), 'sha256': sha(a.manifest)},
           'items': len(items), 'done': 0, 'failed': {}, 'auditFailed': {}}
    lines, plan = [], []
    for n, it in enumerate(items, 1):
        f = it['file']; ext = Path(f).suffix.lower()
        dest = work / 'clips' / f
        try:
            aac = dest if ext in AAC_EXT else work / 'aac' / (f + '.m4a')
            c = make(it['text'], aac)
            if ext not in AAC_EXT and not dest.exists():
                dest.parent.mkdir(parents=True, exist_ok=True)
                tmp = dest.with_name(dest.name + '.part' + ext)
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(aac), '-ar', '44100', '-ac', '1', *TRANSCODE[ext], str(tmp)], check=True)
                tmp.replace(dest)
            o = out / f; o.parent.mkdir(parents=True, exist_ok=True); shutil.copyfile(dest, o)
            h = sha(dest)
            if sha(o) != h: raise RuntimeError('out 副本与成品不一致')
            lines.append({'file': f, 'text': it['text'], 'objectKey': PREFIX + f, 'sha256': h, 'bytes': dest.stat().st_size,
                          'durationSeconds': c['ref']['durationSeconds'], 'format': ext.lstrip('.'),
                          'aacSha256': sha(aac), 'provenance': c['provenance'], 'audit': c['audit']})
            plan.append({'id': None, 'kind': 'plan-voice', 'path': f, 'objectKey': PREFIX + f, 'source': str(dest), 'bytes': dest.stat().st_size, 'sha256': h, 'contentType': CT[ext]})
            res['done'] += 1
            if c['audit']['status'] != 'passed': res['auditFailed'][f] = c['audit']['fails']
            L(f'[{n}/{len(items)}] {f} ok {c["ref"]["durationSeconds"]:.2f}s audit={c["audit"]["status"]}')
        except Exception as e:
            res['failed'][f] = f'{type(e).__name__}: {e}'
            L(f'[{n}/{len(items)}] {f} FAILED {e}\n{traceback.format_exc()}')
    man = {'format': 'pose-hub-plan-voice@1', 'version': VERSION, 'app': 'flare', 'objectPrefix': PREFIX,
           'sourceManifestSha256': res['manifest']['sha256'], 'voiceProfile': V.PROFILES['zh'], 'standard': V.STANDARD,
           'count': len(lines), 'lines': lines}
    mp = work / 'plan-voice-manifest.json'
    mp.write_text(json.dumps(man, ensure_ascii=False, indent=1) + '\n', 'utf-8')
    plan.append({'id': None, 'kind': 'manifest', 'path': 'manifest.json', 'objectKey': PREFIX + 'manifest.json', 'source': str(mp), 'bytes': mp.stat().st_size, 'sha256': sha(mp), 'contentType': CT['.json']})
    if any(p['objectKey'].startswith('pack/channels/') for p in plan): raise SystemExit('plan 含 channels 键')
    (work / 'plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=1) + '\n', 'utf-8')
    res.update({'uploadFiles': len(plan), 'manifestSha256': sha(mp), 'manifestBytes': mp.stat().st_size,
                'objectPrefix': PREFIX, 'out': str(out)})
    (work / 'voice-plan-result.json').write_text(json.dumps(res, ensure_ascii=False, indent=1) + '\n', 'utf-8')
    print(json.dumps({k: v for k, v in res.items() if k != 'failed'} | {'failedCount': len(res['failed']),
                      'auditFailedCount': len(res['auditFailed']), 'failed': dict(list(res['failed'].items())[:20])}, ensure_ascii=False))
    return 3 if res['failed'] or res['auditFailed'] else 0


def fetch(url, method='GET'):
    req = urllib.request.Request(url, method=method, headers={'User-Agent': 'curl/8.5.0', 'Cache-Control': 'no-cache'})
    for wait in (0, 2, 4, 8, 16, 32, 60):
        time.sleep(wait)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                body = r.read() if method == 'GET' else b''
                cl = r.headers.get('Content-Length')
                if method == 'GET' and cl and int(cl) != len(body): continue
                return r.status, body
        except urllib.error.HTTPError as e:
            if e.code == 404: return 404, b''
            if e.code == 429 or e.code >= 500: continue
            return e.code, b''
        except Exception:
            continue
    return None, b''


def verify(a):
    plan = json.loads((a.work / 'plan.json').read_text('utf-8'))
    ok, problems = 0, []
    for p in plan:
        code, body = fetch(BASE_URL + p['objectKey'])
        if a.mode == 'absent':
            if code == 404: ok += 1
            else: problems.append(f'{p["objectKey"]}: {code}')
        else:
            if code == 200 and len(body) == p['bytes'] and hashlib.sha256(body).hexdigest() == p['sha256']: ok += 1
            else: problems.append(f'{p["objectKey"]}: {code} bytes={len(body)}')
        time.sleep(0.2)
    print(json.dumps({'mode': a.mode, 'checked': len(plan), 'ok': ok, 'failed': len(problems), 'problems': problems[:50]}, ensure_ascii=False))
    return 0 if not problems else 3


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    b = sp.add_parser('build'); b.add_argument('--manifest', type=Path, required=True); b.add_argument('--work', type=Path)
    b.add_argument('--out', type=Path); b.add_argument('--check-only', action='store_true')
    v = sp.add_parser('verify'); v.add_argument('mode', choices=['absent', 'online']); v.add_argument('--work', type=Path, required=True)
    a = ap.parse_args(argv)
    if a.cmd == 'build':
        if not a.check_only and not (a.work and a.out): print(json.dumps({'error': '需要 --work 和 --out'})); return 1
        return build(a)
    return verify(a)


if __name__ == '__main__':
    sys.exit(main())
