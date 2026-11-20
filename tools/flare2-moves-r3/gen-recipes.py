#!/usr/bin/env python3
"""Flare 2.0 moves r3 batch 2a (2026-11-21, copy of tools/flare2-moves-r2/gen-recipes.py with r3 paths and deps). r2: (2026-11-21, copy of tools/flare2-moves/gen-recipes.py; r1: copy of tools/thomas-sup/gen-recipes.py): write catalog/production/flare2-moves-r3/recipes/<id>.json
from tools/flare2-moves-r3/actions.json
(spec LF sha256 recomputed every run). Same recipe format/model/corrections as the remaining219-r1 production recipes.
   python3 tools/flare2-moves-r3/gen-recipes.py [--check]   (--check: fail if any written recipe would change)"""
import hashlib, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PLAN = json.load(open(os.path.join(ROOT, 'tools/flare2-moves-r3/actions.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'catalog/production/flare2-moves-r3/recipes')
DEPS = ['drill-anim/lib/flare2-r2.mjs', 'drill-anim/lib/flare2-r3.mjs', 'tools/flare2-moves-r3/v5/v5r2-ext.js']
check = '--check' in sys.argv
os.makedirs(OUT, exist_ok=True)
changed = []
for a in PLAN['actions']:
    spec = a['spec']
    raw = open(os.path.join(ROOT, spec), 'rb').read().decode('utf-8').replace('\r\n', '\n').encode('utf-8')
    r = {
        'format': 'pose-hub-action-recipe@1', 'id': a['id'], 'nameZh': a['nameZh'], 'spec': spec,
        'specSha256Lf': hashlib.sha256(raw).hexdigest(),
        # r2: the specs import drill-anim/lib/flare2-r3.mjs and V5 draws them with v5/v5r2-ext.js; their hashes are part of the recipe
        # so produce.mjs re-renders an action when either changes (resume compares the recipe sha256)
        'r2DepsSha256Lf': {d: hashlib.sha256(open(os.path.join(ROOT, d), 'rb').read().decode('utf-8').replace('\r\n', '\n').encode('utf-8')).hexdigest() for d in DEPS},
        'model': {'profile': 'training-human-v3-armfix', 'version': '0.1.0-r2'},
        'hands': a['hands'],
        'camera': {**{'pad': 0.12, 'k': 0.9, 'drift': 0, 'fitTimeline': True, 'orbitDegrees': 0, 'frontSweepDegrees': 0}, **a['camera']},
        'cameraScale': a.get('cameraScale', 1.15),
        'output': {'groundShadow': False, 'cameraMotion': False, 'wholeCycleContentRect': True, 'fps': 30, 'exerciseMat': a.get('exerciseMat', True),
                   **({'matProp': a['matProp']} if a.get('matProp') else {})},
        'jointCorrections': [{'profile': 'upper-arm-contour-r3', 'version': '0.1.0-r3'}, {'profile': 'ankle-join-r5', 'version': '0.1.0-r5'}],
        **({k: a[k] for k in ('fixedCorrectionStack', 'fixedBarGrip', 'fixedDumbbellsHidden') if k in a}),
        'adaptation': {'status': 'flare2-moves-r3-draft', 'method': 'New spec authored in the sandbox (CPU solve + V5 low-res preview); V5 720p sample render pending on the render machine.'},
        'source': {'brief': 'Flare 2.0 练后 专项补强 + Flare2 2026-11-21 (hark-mhgd；Google 表 1aCseEk4vslsG-QKb-zsZwg30amvoYh5tMxzy6p9n8vA) ' + a['item'], 'plans': a['plans']},
        'sampledOnly': True, 'fullCycleValidated': False, 'reviewed': False, 'userAccepted': False, 'releaseEligible': False,
    }
    text = json.dumps(r, ensure_ascii=False, indent=2) + '\n'
    f = os.path.join(OUT, a['id'] + '.json')
    old = open(f, encoding='utf-8').read() if os.path.exists(f) else None
    if old != text:
        changed.append(a['id'])
        if not check: open(f, 'w', encoding='utf-8', newline='\n').write(text)
print(json.dumps({'recipes': len(PLAN['actions']), 'changed': changed}))
if check and changed: sys.exit(1)
