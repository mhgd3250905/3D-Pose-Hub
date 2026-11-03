#!/usr/bin/env python3
"""Check a produce.py output root and write a report (read-only on the packages).

  python tools/action-package-v3/check_run.py --root F:/PoseHub-v3/runs/<run>
  -> <root>/_run/check-report.json and check-report.md, exit 0 when every action is OK

Per action: action.json present, every skin has its dark/light/transparent files,
definition.json + voice-manifest.json present, voice status technical-passed with no
auditFailed lines, training present. Also reports actions with no output at all.
"""
from __future__ import annotations
import argparse, json, sys, time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import produce as P  # noqa: E402  (recipe list = the same set produce.py runs)

THEME_FILES = ['loop.{s}.mp4', 'start.{s}.png', 'peak.{s}.png', 'end.{s}.png', 'peak.highlight-off.{s}.png', 'cover.{s}.jpg']
SKIN_FILES = ['loop.alpha.{s}.webm', 'first-frame.transparent.{s}.png']


def check_action(root: Path, aid: str) -> dict:
    pdir = root / 'packages' / aid
    out = {'id': aid, 'problems': []}
    bad = out['problems'].append
    if not pdir.exists():
        out['state'] = 'missing'
        if (root / 'masters' / aid).exists():
            bad('masters folder exists but no package (render or compose failed)')
        return out
    if not (pdir / 'action.json').exists():
        bad('no action.json')
    pkg = pdir / 'package.json'
    if not pkg.exists():
        bad('no package.json')
        out['state'] = 'broken'
        return out
    p = json.loads(pkg.read_text('utf-8'))
    out['flags'] = p.get('flags', {})
    for skin in p.get('skins', []):
        sdir = pdir / skin
        if not sdir.exists():
            bad(f'skin folder missing: {skin}'); continue
        files = [f.name for f in sdir.rglob('*') if f.is_file()]
        for pat in SKIN_FILES:
            if not any(n.startswith(pat.split('{s}')[0]) and n.endswith(pat.split('{s}')[1]) for n in files):
                bad(f'{skin}: missing {pat.format(s="*")}')
        for theme in ('dark', 'light'):
            tnames = [f.name for f in (sdir / theme).glob('*')] if (sdir / theme).exists() else []
            for pat in THEME_FILES:
                a, b = pat.split('{s}')
                if not any(n.startswith(a) and n.endswith(b) for n in tnames):
                    bad(f'{skin}/{theme}: missing {pat.format(s="*")}')
    d = pdir / 'definition.json'
    if not d.exists():
        bad('no definition.json')
    else:
        dj = json.loads(d.read_text('utf-8'))
        if not (dj.get('definition') or {}).get('training') and not dj.get('training'):
            bad('definition has no training (count/timer)')
    v = pdir / 'voice-manifest.json'
    if not v.exists():
        bad('no voice-manifest.json')
    else:
        vj = json.loads(v.read_text('utf-8'))
        out['voiceStatus'] = vj.get('status')
        if vj.get('status') != 'technical-passed':
            bad(f"voice status {vj.get('status')}")
        if vj.get('auditFailed'):
            bad(f"voice auditFailed: {vj['auditFailed']}")
        if (vj.get('cuePoints') or {}).get('sampled'):
            out['sampled'] = True
    out['state'] = 'ok' if not out['problems'] else 'problem'
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', type=Path, required=True)
    a = ap.parse_args(argv)
    root = a.root
    ids = [aid for aid, _ in P.collect(P.DEFAULT_SETS)]
    rows = [check_action(root, aid) for aid in ids]
    summary = {}
    for r in rows:
        summary[r['state']] = summary.get(r['state'], 0) + 1
    log = root / 'production-log.jsonl'
    last = {}
    if log.exists():
        for line in log.read_text('utf-8').splitlines():
            if line.strip():
                j = json.loads(line); last[j['id']] = j
    rep = {'format': 'pose-hub-run-check@1', 'root': str(root), 'checkedAt': time.strftime('%Y-%m-%dT%H:%M:%S%z'),
           'expected': len(ids), 'summary': summary,
           'commonVoice': (root / 'voice/common/manifest.json').exists(),
           'problems': [r for r in rows if r['state'] != 'ok'],
           'lastLogErrors': {k: v.get('error') for k, v in last.items() if v.get('state') == 'failed'}}
    run = root / '_run'
    run.mkdir(parents=True, exist_ok=True)
    (run / 'check-report.json').write_text(json.dumps(rep, indent=2, ensure_ascii=False) + '\n', 'utf-8')
    md = [f'# Run check {rep["checkedAt"]}', '', f'- root: `{root}`', f'- expected actions: {len(ids)}',
          f'- summary: {json.dumps(summary, ensure_ascii=False)}', f'- common voice present: {rep["commonVoice"]}', '']
    if rep['problems']:
        md += ['| id | state | problems |', '|---|---|---|']
        for r in rep['problems']:
            md.append(f"| {r['id']} | {r['state']} | {'; '.join(r['problems'])[:300]} |")
    else:
        md.append('All actions OK.')
    if rep['lastLogErrors']:
        md += ['', '## Last logged errors', ''] + [f'- {k}: {v}' for k, v in rep['lastLogErrors'].items()]
    (run / 'check-report.md').write_text('\n'.join(md) + '\n', 'utf-8')
    print(json.dumps({'event': 'check', **summary, 'expected': len(ids)}))
    return 0 if summary.get('ok', 0) == len(ids) else 1


if __name__ == '__main__':
    sys.exit(main())
