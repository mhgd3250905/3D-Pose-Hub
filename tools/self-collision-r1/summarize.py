#!/usr/bin/env python3
"""Summarize fast.json (+ optional full-chain results.jsonl) -> per-action worst pair list, CSV.
   python3 summarize.py fast.json full.jsonl out.csv out.json
Score per pair = d10 (10th deepest vertex, mm). A pair counts as collision when d10 > 10 mm and n10 >= 30
(at least 30 vertices deeper than 10 mm), so single stray vertices do not count.
UpperArm>torso is listed but flagged 'armpit' (low confidence: armpit skin folds near the shoulder exclusion ring)."""
import json, sys, csv, os
fast = json.load(open(sys.argv[1])) if os.path.exists(sys.argv[1]) else {}
full = {}
if len(sys.argv) > 2 and os.path.exists(sys.argv[2]):
    for l in open(sys.argv[2]):
        r = json.loads(l); full[r['id']] = r
TH, NMIN = 10.0, 30
names = {}
for i in set(fast) | set(full):
    p = f'catalog/production/v3-text/{i}.json'
    if os.path.exists(p):
        names[i] = json.load(open(p)).get('name', {}).get('zh', '')
rows = []; per = {}
def scan(src, r):
    out = {}
    for f in r.get('frames', []):
        for k, p in f['pairs'].items():
            if p['d10'] <= TH or p['n10'] < NMIN: continue
            a, b = k.split('>'); key = '/'.join(sorted([a, b]))
            cur = out.get(key)
            if not cur or p['d10'] > cur['d10']:
                out[key] = dict(d10=p['d10'], dmax=p['dmax'], n10=p['n10'], tag=f['tag'], t=f['t'], at=p['at'], dir=k)
    return out
for i in sorted(set(fast) | set(full)):
    src = 'full' if i in full else 'fast'
    r = full.get(i) or fast.get(i)
    if r.get('error'): per[i] = {'error': r['error']}; continue
    pairs = scan(src, r)
    per[i] = {'src': src, 'pairs': pairs, 'name': names.get(i, '')}
    for key, p in pairs.items():
        rows.append([i, names.get(i, ''), src, key, 'armpit' if 'UpperArm/torso' in key else '', p['d10'], p['dmax'], p['n10'], p['tag'], p['t'], p['dir'], ' '.join(map(str, p['at']))])
rows.sort(key=lambda x: -x[5])
with open(sys.argv[3], 'w', newline='') as fh:
    w = csv.writer(fh); w.writerow(['action', 'name_zh', 'check', 'pair', 'flag', 'depth_d10_mm', 'depth_max_mm', 'verts_over_10mm', 'frame', 't_s', 'direction', 'deepest_xyz'])
    w.writerows(rows)
json.dump(per, open(sys.argv[4], 'w'), ensure_ascii=False, indent=1)
acts = {}
for r in rows:
    if r[4]: continue
    acts.setdefault(r[0], r)
print('actions scanned', len(per), 'errors', sum(1 for v in per.values() if 'error' in v))
print('actions with non-armpit collision', len(acts))
print('actions with armpit-only', len({r[0] for r in rows if r[4]} - set(acts)))
for i, r in sorted(acts.items(), key=lambda x: -x[1][5])[:40]:
    print(f'{r[0]:34s} {r[1][:14]:14s} {r[3]:28s} {r[5]:6.1f} n{r[7]:<5d} {r[8]} {r[9]}')
