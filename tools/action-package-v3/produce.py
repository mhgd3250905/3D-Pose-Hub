"""Scripted batch production: recipes -> masters -> packages -> definition -> voice -> action.json -> index. Strictly serial.

  python tools/action-package-v3/produce.py --root <out root> [--profile default] [--model profile@version]
         [--recipes <file|dir|glob> ...] [--ids a,b] [--skins a,b] [--dry-run] [--verify-size 256 --verify-frames 0,60,120]

Default recipe set = every recipe in catalog/production/remaining219-r1/recipes and
catalog/production/remaining32-r4/groups/* (249 actions; dropped actions have no recipe).
Per action: render masters, compose the render package, build definition.json from the action text
(catalog/production/v3-text/<id>.json) with cue points read from the masters, synthesize + audit the voice,
and write packages/<id>/action.json. An action without text ends as 'needs-text'; any failure is logged
and the batch moves on (production-log.jsonl). Use --no-voice for render-only runs.
Each finished stage is skipped on re-run, so an interrupted batch resumes
with the same command. One render at a time (pass --heavy to wrap each render in
/workspace/bin/heavy on the Hark sandbox). Needs the app dev server (npm run dev -- --port 8830).
"""
from __future__ import annotations

import argparse
import glob
import hashlib
import json
import os
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import text as T  # noqa: E402
REPO = HERE.parent.parent
DEFAULT_SETS = ['catalog/production/remaining219-r1/recipes/*.json', 'catalog/production/remaining32-r4/groups/*/*.json']


def collect(patterns):
    files = []
    for p in patterns:
        path = REPO / p if not Path(p).is_absolute() else Path(p)
        if path.is_dir():
            files += sorted(path.glob('*.json'))
        else:
            files += sorted(Path(x) for x in glob.glob(str(path)))
    seen, out = set(), []
    for f in files:
        r = json.loads(f.read_text('utf-8'))
        if r.get('format') != 'pose-hub-action-recipe@1':
            continue
        if r['id'] in seen:
            raise SystemExit(f'duplicate action id {r["id"]} in recipe sets')
        seen.add(r['id']); out.append((r['id'], f))
    return out


VENV = {**os.environ, 'PYTHONPATH': '/workspace/work/pylib' + os.pathsep + os.environ.get('PYTHONPATH', '')}


HEAVY = [False]


def heavy(cmd):
    return ['/workspace/bin/heavy', '--'] + cmd if HEAVY[0] else cmd


def bundle(root: Path, aid: str):
    """packages/<id>/action.json: the one file a consumer opens (render package + definition + voice, with hashes)."""
    pdir = root / 'packages' / aid
    ref = lambda n: {'path': f'packages/{aid}/{n}', 'sha256': hashlib.sha256((pdir / n).read_bytes()).hexdigest()}
    d = json.loads((pdir / 'definition.json').read_text('utf-8'))
    v = json.loads((pdir / 'voice-manifest.json').read_text('utf-8'))
    p = json.loads((pdir / 'package.json').read_text('utf-8'))
    out = {'format': 'pose-hub-action@3', 'id': aid, 'name': d['definition']['name'],
           'layers': {'render': ref('package.json'), 'definition': ref('definition.json'), 'voice': ref('voice-manifest.json'),
                      'voiceCommon': {'path': 'voice/common/manifest.json'}},
           'status': {'render': 'sampled' if p['flags'].get('sampledOnly') else 'complete', 'voiceTechnical': v['status'],
                      'editorialReview': d['review']['editorial'], 'contentReview': v['contentReview'],
                      'manualListening': v['manualListening'], 'userAccepted': False, 'releaseEligible': False}}
    (pdir / 'action.json').write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n', 'utf-8')


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--root', type=Path, required=True)
    ap.add_argument('--profile', default='default')
    ap.add_argument('--model')
    ap.add_argument('--recipes', nargs='+', default=DEFAULT_SETS)
    ap.add_argument('--ids')
    ap.add_argument('--skins')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--no-voice', action='store_true', help='render packages only (skip definition + voice)')
    ap.add_argument('--heavy', action='store_true')
    ap.add_argument('--verify-size', type=int, help='small verification render (marks output sampled)')
    ap.add_argument('--verify-frames', help='e.g. 0,60,120; default all frames')
    args = ap.parse_args(argv)
    HEAVY[0] = args.heavy
    root = args.root.resolve()
    items = collect(args.recipes)
    if args.ids:
        want = args.ids.split(',')
        missing = [w for w in want if w not in dict(items)]
        if missing:
            raise SystemExit('no recipe for: ' + ','.join(missing))
        items = [x for x in items if x[0] in want]
    log = root / 'production-log.jsonl'
    root.mkdir(parents=True, exist_ok=True)
    print(json.dumps({'event': 'plan', 'actions': len(items), 'root': str(root)}), flush=True)
    results = []
    for aid, recipe in items:
        pkg = root / 'packages' / aid / 'package.json'
        masters = root / 'masters' / aid / 'layer-manifest.json'
        state = 'complete' if (root / 'packages' / aid / 'action.json').exists() else 'packaged' if pkg.exists() else 'mastered' if masters.exists() else 'todo'
        if state == 'complete' and not args.dry_run:
            results.append({'id': aid, 'state': 'complete', 'seconds': 0}); continue
        if args.dry_run:
            results.append({'id': aid, 'recipe': str(recipe.relative_to(REPO)), 'state': state}); continue
        t0 = time.time()
        try:
            if state == 'todo':
                if (root / 'masters' / aid).exists():
                    raise RuntimeError(f'incomplete masters for {aid} (failure.json?); inspect, then move that folder away')
                cmd = ['node', str(HERE / 'render-masters.mjs'), '--recipe', str(recipe), '--root', str(root), '--profile', args.profile]
                if args.model: cmd += ['--model', args.model]
                if args.skins: cmd += ['--skins', args.skins]
                if args.verify_size: cmd += ['--size', str(args.verify_size)]
                if args.verify_frames: cmd += ['--frames', args.verify_frames]
                if args.heavy: cmd = ['/workspace/bin/heavy', '--'] + cmd
                subprocess.run(cmd, check=True, cwd=REPO)
            if state != 'packaged':
                cmd = [sys.executable, str(HERE / 'compose.py'), '--root', str(root), '--id', aid, '--profile', args.profile]
                if args.verify_size or args.verify_frames: cmd += ['--allow-partial', '--sizes-from-masters']
                subprocess.run(cmd, check=True, cwd=REPO, env=VENV)
            row = {'id': aid, 'state': 'packaged', 'seconds': round(time.time() - t0, 1)}
            # definition + voice: derived from the action text, the masters' timing and the pinned voice standard
            if not args.no_voice:
                pdir = root / 'packages' / aid
                if not (T.TEXT_DIR / f'{aid}.json').exists():
                    row['state'] = 'needs-text'
                else:
                    if not (pdir / 'definition.json').exists():
                        subprocess.run([sys.executable, str(HERE / 'definition.py'), '--root', str(root), '--id', aid], check=True, cwd=REPO, env=VENV)
                    if not (pdir / 'voice-manifest.json').exists():
                        if not (root / 'voice/common/manifest.json').exists():
                            subprocess.run(heavy([sys.executable, str(HERE / 'voice.py'), '--root', str(root), '--common']), check=True, cwd=REPO, env=VENV)
                        subprocess.run(heavy([sys.executable, str(HERE / 'voice.py'), '--root', str(root), '--id', aid]), check=True, cwd=REPO, env=VENV)
                    v = json.loads((pdir / 'voice-manifest.json').read_text('utf-8'))
                    bundle(root, aid)
                    row['state'] = 'complete' if v['status'] == 'technical-passed' else 'voice-audit-failed'
                    row['seconds'] = round(time.time() - t0, 1)
        except Exception as e:  # keep going; the log says what failed
            row = {'id': aid, 'state': 'failed', 'error': str(e)[:500]}
        results.append(row)
        with log.open('a') as fh:
            fh.write(json.dumps({**row, 'at': time.strftime('%Y-%m-%dT%H:%M:%S%z')}) + '\n')
        print(json.dumps(row), flush=True)
    index = {'format': 'pose-hub-package-index@1', 'profile': args.profile, 'actions': []}
    for aid, _ in collect(args.recipes):
        pkg = root / 'packages' / aid / 'package.json'
        if pkg.exists():
            p = json.loads(pkg.read_text('utf-8'))
            row = {'id': aid, 'package': f'packages/{aid}/package.json', 'skins': list(p['skins']), 'flags': p['flags']}
            if (pkg.parent / 'action.json').exists(): row['action'] = f'packages/{aid}/action.json'
            index['actions'].append(row)
    if not args.dry_run:
        (root / 'index.json').write_text(json.dumps(index, indent=2, ensure_ascii=False) + '\n')
    summary = {}
    for r in results:
        summary[r['state']] = summary.get(r['state'], 0) + 1
    print(json.dumps({'event': 'summary', **summary, 'indexed': len(index['actions'])}), flush=True)
    return 1 if summary.get('failed') else 0


if __name__ == '__main__':
    sys.exit(main())
