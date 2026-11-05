#!/usr/bin/env python3
"""Pick top-3 per class and write shots.json for self-collision-r1/render-closeup.mjs (production camera direction).
usage: make-shots.py fast.json outdir_csv imgdir shots.json"""
import json, sys, csv
fast = json.load(open(sys.argv[1])); C = sys.argv[2]; IMG = sys.argv[3]
def top(name, n=3, pre=()):
    rows = list(csv.DictReader(open(f'{C}/{name}')))
    rows = [r for r in rows if int(r['severity']) > 0]
    out = [r for r in rows if r['id'] in pre] + [r for r in rows if r['id'] not in pre]
    return out[:n]
shots = []
def pelvis(r, t):
    J = min(r['J'], key=lambda f: abs(f['t'] - t))['j']; return J['pelvis'], J
for r in top('class1-motion-amplitude.csv', pre=('h-crossbody',)):
    f = fast[r['id']]; D = f['duration']
    for k, t in enumerate([0, D * 0.25, D * 0.5, D * 0.75]):
        p, J = pelvis(f, t)
        at = [p[0], (p[1] + J['head'][1]) / 2 if J['head'][1] > p[1] + 0.3 else p[1], p[2]]
        shots.append(dict(id=r['id'], t=round(t, 2), at=[round(x, 3) for x in at], dir=f['camDir'], dist=3.2, size=280, mark=False,
                          out=f'{IMG}/c1-{r["id"]}-{k}.png'))
for r in top('class2-contact-position.csv', pre=('h-knee-hug', 'h-crossbody')):
    f = fast[r['id']]; tag, t = r['bestFrame'].split('@'); t = float(t)
    fr = next(x for x in f['C'] if x['tag'] == tag)
    # aim at the contact: hand centroid for body/hand rules, elbow for forearm, foot for foot
    eff = 'leftFoot' if 'foot' in r['rule'] or '脚' in r['rule'] else 'leftHand'
    side = 'right' if 'right' in r['detail'].split('|')[-1][:6] else 'left'
    c = fr['c'].get(side + eff[4:]) or fr['c'][eff]
    shots.append(dict(id=r['id'], t=t, at=c['c'], dir=f['camDir'], dist=3.2, size=320, mark=True, out=f'{IMG}/c2-{r["id"]}-prod.png'))
    shots.append(dict(id=r['id'], t=t, at=c['c'], dir=f['camDir'], dist=1.0, size=320, mark=True, out=f'{IMG}/c2-{r["id"]}-close.png'))
for r in top('class5-extra.csv'):
    f = fast[r['id']]; D = f['duration']; p, J = pelvis(f, D * 0.5)
    shots.append(dict(id=r['id'], t=round(D * 0.5, 2), at=p, dir=f['camDir'], dist=3.2, size=320, mark=False, out=f'{IMG}/c5-{r["id"]}.png'))
json.dump(shots, open(sys.argv[4], 'w'), indent=0)
print(len(shots), sorted(set(s['id'] for s in shots)))
