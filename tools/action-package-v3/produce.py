"""Scripted batch production: recipes -> masters -> packages -> index. Strictly serial.

  python tools/action-package-v3/produce.py --root <out root> [--profile default] [--model profile@version]
         [--recipes <file|dir|glob> ...] [--ids a,b] [--skins a,b] [--dry-run] [--verify-size 256 --verify-frames 0,60,120]

Default recipe set = every recipe in catalog/production/remaining219-r1/recipes and
catalog/production/remaining32-r4/groups/* (249 actions; dropped actions have no recipe).
Each action is skipped when its package already exists, so an interrupted batch resumes
with the same command. One render at a time (pass --heavy to wrap each render in
/workspace/bin/heavy on the Hark sandbox). Needs the app dev server (npm run dev -- --port 8830).
"""
from __future__ import annotations

import argparse
import glob
import json
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
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


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--root', type=Path, required=True)
    ap.add_argument('--profile', default='default')
    ap.add_argument('--model')
    ap.add_argument('--recipes', nargs='+', default=DEFAULT_SETS)
    ap.add_argument('--ids')
    ap.add_argument('--skins')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--heavy', action='store_true')
    ap.add_argument('--verify-size', type=int, help='small verification render (marks output sampled)')
    ap.add_argument('--verify-frames', help='e.g. 0,60,120; default all frames')
    args = ap.parse_args(argv)
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
        state = 'packaged' if pkg.exists() else 'mastered' if masters.exists() else 'todo'
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
                subprocess.run(cmd, check=True, cwd=REPO)
            row = {'id': aid, 'state': 'packaged', 'seconds': round(time.time() - t0, 1)}
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
            index['actions'].append({'id': aid, 'package': f'packages/{aid}/package.json', 'skins': list(p['skins']), 'flags': p['flags']})
    if not args.dry_run:
        (root / 'index.json').write_text(json.dumps(index, indent=2, ensure_ascii=False) + '\n')
    summary = {}
    for r in results:
        summary[r['state']] = summary.get(r['state'], 0) + 1
    print(json.dumps({'event': 'summary', **summary, 'indexed': len(index['actions'])}), flush=True)
    return 1 if summary.get('failed') else 0


if __name__ == '__main__':
    sys.exit(main())
