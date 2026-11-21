# progress.py <list> <phase> <last_id>: rewrites PROGRESS.json every 5 completed actions of the list (and at the end).
import json, sys, os, datetime, time
L, phase, last = sys.argv[1:4]
W = '/workspace/work/legacy-audit-r1'
ids = [l.split('\t')[0] for l in open(L) if l.strip()]
done = [i for i in ids if os.path.exists(f'{W}/an/{i}.json') and os.path.getsize(f'{W}/an/{i}.json') > 0 or os.path.exists(f'{W}/dumps/{i}.json') is False and False]
done = [i for i in ids if os.path.exists(f'{W}/dumps/{i}.json')]
st = f'{W}/progress-state-{phase}.json'
S = json.load(open(st)) if os.path.exists(st) else {'t0': time.time() - 75, 'reported': 0}
fails = open(f'{W}/dumps/_fail.txt').read().split('\n') if os.path.exists(f'{W}/dumps/_fail.txt') else []
n = len(done)
pos = ids.index(last) + 1 if last in ids else n
if pos - S['reported'] >= 5 or pos == len(ids):
    sev = 0; latest = ids[max(0, pos - 5):pos]; notes = []
    for i in ids[:pos]:
        p = f'{W}/an/{i}.json'
        if os.path.exists(p) and os.path.getsize(p):
            a = json.load(open(p)); s1 = [f for f in a['findings'] if f['severity'] == 1]
            if s1: sev += 1
            if i in latest and s1: notes.append(f"{i}:{s1[0]['msg'][:30]}")
    el = time.time() - S['t0']; rate = el / max(pos - S.get('pos0', 0), 1)
    eta = round(rate * (len(ids) - pos) / 60)
    pr = {'updated_at': (lambda g: f'{g.tm_year:04d}-{g.tm_mon:02d}-{g.tm_mday:02d}T{g.tm_hour:02d}:{g.tm_min:02d}:{g.tm_sec:02d}+08:00')(time.gmtime(time.time() + 8 * 3600)), 'phase': phase, 'done': pos,
          'total': len(ids), 'severe_so_far': sev, 'latest_ids': latest,
          'latest_findings': ('；'.join(notes) if notes else '最近 5 个未见严重级自动告警（待评审复核）') + (f'；失败 {len([f for f in fails if f])} 个' if any(fails) else ''),
          'eta_minutes': eta, 'eta_basis': f'本阶段已完成 {pos} 个，平均 {rate:.0f} 秒/个（串行，单个动作 V5 场景启动约 90 秒 + 逐帧测量）'}
    json.dump(pr, open(f'{W}/PROGRESS.json', 'w'), ensure_ascii=False, indent=1)
    S['reported'] = pos
json.dump(S, open(st, 'w'))
