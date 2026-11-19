#!/usr/bin/env python3
"""Thomas supplement r1: write catalog/production/thomas-supplement-r1/recipes/<id>.json from tools/thomas-sup/actions.json
(spec LF sha256 recomputed every run). Same recipe format/model/corrections as the remaining219-r1 production recipes.
   python3 tools/thomas-sup/gen-recipes.py [--check]   (--check: fail if any written recipe would change)"""
import hashlib, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PLAN = json.load(open(os.path.join(ROOT, 'tools/thomas-sup/actions.json'), encoding='utf-8'))
OUT = os.path.join(ROOT, 'catalog/production/thomas-supplement-r1/recipes')
check = '--check' in sys.argv
os.makedirs(OUT, exist_ok=True)
changed = []
for a in PLAN['actions']:
    spec = a['spec']
    raw = open(os.path.join(ROOT, spec), 'rb').read().decode('utf-8').replace('\r\n', '\n').encode('utf-8')
    r = {
        'format': 'pose-hub-action-recipe@1', 'id': a['id'], 'nameZh': a['nameZh'], 'spec': spec,
        'specSha256Lf': hashlib.sha256(raw).hexdigest(),
        'model': {'profile': 'training-human-v3-armfix', 'version': '0.1.0-r2'},
        'hands': a['hands'],
        'camera': {**{'pad': 0.12, 'k': 0.9, 'drift': 0, 'fitTimeline': True, 'orbitDegrees': 0, 'frontSweepDegrees': 0}, **a['camera']},
        'cameraScale': a.get('cameraScale', 1.15),
        'output': {'groundShadow': False, 'cameraMotion': False, 'wholeCycleContentRect': True, 'fps': 30, 'exerciseMat': a.get('exerciseMat', True),
                   **({'matProp': a['matProp']} if a.get('matProp') else {})},
        'jointCorrections': [{'profile': 'upper-arm-contour-r3', 'version': '0.1.0-r3'}, {'profile': 'ankle-join-r5', 'version': '0.1.0-r5'}],
        **({k: a[k] for k in ('fixedCorrectionStack', 'fixedBarGrip') if k in a}),
        'adaptation': {'status': 'thomas-supplement-r1-draft', 'method': 'New spec authored in the sandbox (CPU solve + V5 low-res preview); V5 720p sample render pending on the render machine.'},
        'source': {'brief': '托马斯动作库补充-制作说明 2026-11-19 item ' + a['item'], 'thomasAngle': a['thomasAngle']},
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
