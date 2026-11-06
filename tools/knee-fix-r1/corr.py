#!/usr/bin/env python3
# Knee fix r1, step 2: closed-loop per-frame pelvis-y correction. Reads a knee scan (scan-knee.mjs output, 5 Hz rows of
# hip-knee-ankle bend per leg) of the lifted -kn1 specs, maps each sample's measured bend theta on the chosen leg to a
# target T(theta), converts the change to a pelvis-y step with the two-segment leg (hip-ankle distance
# D = sqrt(a^2 + b^2 + 2ab cos theta)), and accumulates it into tools/knee-fix-r1/corr/<id>.json (dy(t), metres).
#   python3 tools/knee-fix-r1/corr.py <scan.json> <id>...
import json, math, os, sys
a, b = 0.410, 0.417
D = lambda th: math.sqrt(a*a + b*b + 2*a*b*math.cos(math.radians(th)))
def stand(target=5, lo=20, hi=35):          # straight stance: <=lo -> target, fades out by hi (squat/lunge depth untouched)
    return lambda th: target if th <= lo else (th if th >= hi else target + (th - target) * (th - lo) / (hi - lo))
const = lambda target: (lambda th: target)
# id -> (leg, T, why). leg: min | max | left | right | mean
HINGE = ('mean', const(17), 'hinge: knees soft ~17 deg, held through the lowering')
P = {}
for i in ['h-db-rdl','h-good-morning','h-db-kickback','h-db-reverse-fly','h-db-row','h-chair-lat','h-chair-elbow-triceps-stretch',
          'o-wall-hip-hinge-stretch','h-close-stance-forward-fold-native']: P[i] = HINGE
P['o-supported-hip-airplane'] = ('left', const(17), 'support knee soft ~17 deg')
P['h-wall-angel'] = ('mean', const(15), 'wall stand, knees soft ~15 deg')
P['h-step-jack'] = ('min', stand(15, 25, 40), 'stance knees soft ~15 deg')
P['n-pelvis-circle'] = ('mean', const(15), 'text: knees slightly bent ~15 deg')
P['h-bent-knee-calf-raise'] = ('mean', const(40), 'fixed bent knee ~40 deg (soleus)')
P['h-db-split-squat'] = ('left', stand(12, 35, 55), 'top: front knee ~12 deg')
P['o-stand-lunge'] = ('right', const(25), 'back leg straighter ~20-25 deg')
P['h-wall-calf'] = ('right', const(5), 'back leg straight')
P['n-wide-fold'] = ('mean', const(7), 'knees straight, not locked')
P['o-stand-ham'] = ('right', const(6), 'stretched leg straight')
P['o-stand-crossreach'] = ('right', const(5), 'legs naturally straight')
P['n-slider-lateral'] = ('min', const(6), 'sliding leg straight, standing leg straight at rest')
P['h-lateral-step-lunge'] = ('min', stand(8, 60, 80), 'trailing leg straight at the lunge, both straight standing')
P['hip-flexors-C'] = ('right', const(4), 'raised leg straight')
P['h-band-straight-leg-raise'] = ('right', const(5), 'working leg straight')
P['o-supported-mini-squat'] = ('mean', lambda th: 5 if th <= 22 else (th + 14 if th >= 38 else 5 + (th + 14 - 5) * (th - 22) / 16), 'top straight, bottom ~60 deg')
def leg(r, how):
    L, R = r['left'], r['right']
    return {'min': min(L, R), 'max': max(L, R), 'left': L, 'right': R, 'mean': (L + R) / 2}[how]
if __name__ == '__main__':
    scan = json.load(open(sys.argv[1])); root = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'corr')
    os.makedirs(root, exist_ok=True)
    for i in sys.argv[2:]:
        how, T, why = P.get(i, ('min', stand(), 'standing leg straight ~5 deg'))
        f = os.path.join(root, i + '.json'); old = json.load(open(f)) if os.path.exists(f) else {'dy': [], 'why': why}
        prev = dict((round(t, 3), v) for t, v in old['dy'])
        out = []
        for r in scan[i]['rows']:
            th = leg(r, how); tt = T(th); dy = D(tt) - D(th)
            out.append([r['t'], round(prev.get(round(r['t'], 3), 0) + dy, 5)])
        json.dump({'dy': out, 'why': why}, open(f, 'w'))
        print(i, why, 'max|dy| %.3f' % max(abs(v) for _, v in out))
