"""Rank actions by forearm axial roll (twist about the elbow->wrist axis) from scan-fast.mjs output.
Usage: python analyze.py scan-all.json out.csv
Per side:
  rollRange  = range over the cycle of the forearm's effective local roll (solve + twistShare transfer), accumulated
               from per-sample increments about the forearm long axis (pure swing adds 0)
  rollStep   = biggest roll change between consecutive samples (deg per 1/hz s)
  elbowSkin  = range of mean skin rotation of forearm verts near the elbow (t<=0.3) about the axis, in the
               swing-carried upper-arm frame (what shows as a wrung elbow)
  midSkin / wristSkin = same for t in (0.3,0.7) / t>=0.7
  handRoll   = range of hand roll vs forearm (theta), share of which the runtime pushes into the forearm
  solvedRange= roll range of the pose solve alone (before the twistShare transfer)
  hingeDev   = max angle between the elbow swing axis and its median, over samples with flex > 20 deg
"""
import json, sys, math, csv
import numpy as np

def qmul(a, b):
    ax, ay, az, aw = a; bx, by, bz, bw = b
    return np.array([aw*bx+ax*bw+ay*bz-az*by, aw*by-ax*bz+ay*bw+az*bx, aw*bz+ax*by-ay*bx+az*bw, aw*bw-ax*bx-ay*by-az*bz])
def qinv(a): return np.array([-a[0], -a[1], -a[2], a[3]])
def twist(q, a):
    p = q[0]*a[0]+q[1]*a[1]+q[2]*a[2]; w = q[3]
    if w < 0: w, p = -w, -p
    return math.degrees(2*math.atan2(p, w))
def unwrap(xs):
    out = []; off = 0
    for i, x in enumerate(xs):
        if x is None: out.append(None); continue
        if out and out[-1] is not None:
            d = x+off-out[-1]
            while d > 180: off -= 360; d -= 360
            while d < -180: off += 360; d += 360
        out.append(x+off)
    return out
def rng(xs):
    xs = [x for x in xs if x is not None]
    return (max(xs)-min(xs)) if xs else 0.0

def side_metrics(rows, side, aL):
    qs = [np.array(r[side]['q']) for r in rows]
    cum = [0.0]; steps = []
    for i in range(1, len(qs)):
        d = twist(qmul(qinv(qs[i-1]), qs[i]), aL); steps.append(abs(d)); cum.append(cum[-1]+d)
    theta = unwrap([r[side]['theta'] for r in rows])
    share = rows[0].get('_share', 0.5)
    sol = [0.0]
    for i in range(1, len(qs)): sol.append(sol[-1] + (cum[i]-cum[i-1]) - share*(theta[i]-theta[i-1]))
    solved = sol
    # prototype r6 (continuous theta, |share*theta| <= 40): solve roll + capped transfer
    rawt = [r[side]['theta'] for r in rows]
    wrapped = [share*x for x in rawt]
    capped = [max(-40.0, min(40.0, share*x)) for x in theta]
    base0 = [cum[i]-wrapped[i] for i in range(len(cum))]
    proto = [base0[i]+capped[i] for i in range(len(cum))]
    proto = unwrap(proto)
    p_steps = [abs(proto[i]-proto[i-1]) for i in range(1, len(proto))]
    share0 = unwrap([base0[i] for i in range(len(cum))])
    share1 = unwrap([base0[i]+rawt[i] for i in range(len(cum))])
    s1_steps = [abs(share1[i]-share1[i-1]) for i in range(1, len(share1))]
    elbow = unwrap([r[side]['meshElbow'] for r in rows]); mid = unwrap([r[side]['meshMid'] for r in rows]); wrist = unwrap([r[side]['meshWrist'] for r in rows])
    axes = [np.array(r[side]['swingAxis']) for r in rows if 20 < r[side]['flex'] < 150 and r[side]['swingAxis']]
    hinge = 0.0
    if len(axes) >= 2:
        med = np.median(np.array(axes), axis=0); med /= np.linalg.norm(med)
        hinge = max(math.degrees(math.acos(max(-1, min(1, float(a@med))))) for a in axes)
    raw = [r[side]['theta'] for r in rows]
    wraps = [rows[i]['t'] for i in range(1, len(raw)) if abs(raw[i]-raw[i-1]) > 270]
    ed = [r[side]['elbowDeg'] for r in rows]
    pop = max([abs(ed[i]-ed[i-1]) for i in range(1, len(ed))] or [0])
    i_step = int(np.argmax(steps))+1 if steps else 0
    i_el = int(np.argmax(np.abs(np.array([e if e is not None else 0 for e in elbow])-np.nanmin([e for e in elbow if e is not None]))))
    # time of max deviation of the effective roll from its cycle median (problem frame for close-ups)
    med = float(np.median(cum)); i_dev = int(np.argmax(np.abs(np.array(cum)-med)))
    return dict(rollRange=rng(cum), rollStep=max(steps) if steps else 0, rollStepAt=rows[i_step]['t'],
                elbowSkin=rng(elbow), midSkin=rng(mid), wristSkin=rng(wrist), handRoll=rng(theta), handRollMax=max(abs(r[side]['theta']) for r in rows),
                hingeDev=hinge, worstAt=rows[i_dev]['t'], elbowWorstAt=rows[i_el]['t'],
                flexRange=rng(ed), wrapFlips=len(wraps), wrapAt=wraps[0] if wraps else '', elbowPop=pop, protoRange=rng(proto), protoStep=max(p_steps or [0]), share0Range=rng(share0), share1Range=rng(share1), share1Step=max(s1_steps or [0]), solvedRange=rng(share0))

def infer_axis(rows, side):
    axes = [np.array(r[side]['swingAxis']) for r in rows if r[side]['swingAxis'] and r[side]['flex'] > 10]
    best = None
    for i in range(len(axes)):
        for j in range(i+1, len(axes)):
            c = np.cross(axes[i], axes[j]); n = np.linalg.norm(c)
            if best is None or n > best[0]: best = (n, c/n if n > 0 else c)
    return best[1]

def main(src, dst):
    data = json.load(open(src))
    out = []
    for aid, d in sorted(data.items()):
        if d.get('error'): out.append(dict(id=aid, error=d['error'])); continue
        rows = d['rows']
        for r in rows: r['_share'] = d['share']
        rec = dict(id=aid, share=d['share'], hands='/'.join(sorted(set((d['hands'] or {}).values()))),
                                     handAdapter=d['handAdapter'], corrective=d['corrective'] or '', wristCorrective=d['nativeWristCorrective'], spec=d['spec'])
        for side in ('left', 'right'):
            aL = np.array(d['rig'][side]['aL']) if d.get('rig') else infer_axis(rows, side)
            m = side_metrics(rows, side, aL)
            for k, v in m.items(): rec[side[0]+'_'+k] = round(v, 1) if isinstance(v, float) else v
        for k in ('rollRange', 'rollStep', 'elbowSkin', 'midSkin', 'wristSkin', 'handRoll', 'handRollMax', 'solvedRange', 'hingeDev', 'wrapFlips', 'elbowPop', 'protoRange', 'protoStep', 'share0Range', 'share1Range', 'share1Step'):
            rec[k] = max(rec['l_'+k], rec['r_'+k])
        rec['side'] = 'L' if rec['l_rollRange'] >= rec['r_rollRange'] else 'R'
        rec['worstAt'] = rec[rec['side'].lower()+'_worstAt']
        out.append(rec)
    ok = [r for r in out if 'error' not in r]
    # severity: forearm roll during the cycle (primary), abrupt steps, skin wrung at the elbow
    for r in ok:
        r['severity'] = round(max(0, r['rollRange']-45)/30 + max(0, r['rollStep']-20)/20, 2)
        r['flag'] = 'severe' if (r['rollRange'] >= 120 or r['rollStep'] >= 50) else \
                    'suspect' if (r['rollRange'] >= 75 or r['rollStep'] >= 30) else 'ok'
    for r in ok:
        r['protoFlag'] = 'severe' if (r['protoRange'] >= 120 or r['protoStep'] >= 50) else 'suspect' if (r['protoRange'] >= 75 or r['protoStep'] >= 30) else 'ok'
    ok.sort(key=lambda r: -r['severity'])
    import collections
    for r in ok:
        r['share1Flag'] = 'severe' if (r['share1Range'] >= 120 or r['share1Step'] >= 50) else 'suspect' if (r['share1Range'] >= 75 or r['share1Step'] >= 30) else 'ok'
    print('proto r6 flags', collections.Counter(r['protoFlag'] for r in ok), 'share=1.0 flags', collections.Counter(r['share1Flag'] for r in ok))
    keys = ['id', 'flag', 'protoFlag', 'share1Flag', 'severity', 'side', 'worstAt', 'rollRange', 'rollStep', 'handRollMax', 'wrapFlips', 'elbowPop', 'protoRange', 'protoStep', 'share0Range', 'share1Range', 'share1Step', 'elbowSkin', 'midSkin', 'wristSkin', 'handRoll', 'solvedRange', 'hingeDev',
            'share', 'hands', 'handAdapter', 'corrective', 'wristCorrective', 'spec'] + sorted(k for k in ok[0] if k[:2] in ('l_', 'r_'))
    with open(dst, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=keys+['error'], extrasaction='ignore'); w.writeheader()
        for r in ok + [r for r in out if 'error' in r]: w.writerow(r)
    print('actions', len(out), 'errors', len(out)-len(ok), 'severe', sum(r['flag'] == 'severe' for r in ok), 'suspect', sum(r['flag'] == 'suspect' for r in ok))
    for r in ok[:25]:
        print(r['id'], r['flag'], r['severity'], r['side'], 't=%s' % r['worstAt'], 'roll', r['rollRange'], 'step', r['rollStep'], 'elbowSkin', r['elbowSkin'], 'mid', r['midSkin'], 'wrist', r['wristSkin'], 'handMax', r['handRollMax'], 'wraps', r['wrapFlips'], 'pop', round(r['elbowPop']), 'solved', r['solvedRange'], 'share', r['share'], r['hands'], r['handAdapter'])

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
