# report.py: aggregate analyze.py results (+ review.json verdicts) into findings.json and the evidence contact sheets.
#   python3 tools/legacy-audit-r1/report.py [--sheets]
import json, os, sys, glob, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.abspath(os.path.join(HERE, '../..'))
W = '/workspace/work/legacy-audit-r1'; OUT = os.path.join(W, 'out'); os.makedirs(OUT, exist_ok=True)
V = json.load(open(os.path.join(REPO, 'tools/v5/v5-actions.json')))['actions']
REV = json.load(open(os.path.join(HERE, 'review.json'))) if os.path.exists(os.path.join(HERE, 'review.json')) else {}

FIX = {
    'rom-footVsKnee': '脚相对小腿装反/翻转：在 spec 里把该脚的脚尖改回膝盖（髌骨）一侧、足底朝向地面或身后；屈膝侧撑类双脚叠放、足外侧贴地',
    'sideplank-feet-off-floor': '屈膝侧撑：双膝约 90°，小腿放到身后，双脚叠放贴地（下侧脚外侧着地）',
    'sideplank-foot-above-knee': '同上：小腿不要翻向上，脚低于膝',
    'sideplank-shin-not-behind': '同上：小腿在身后',
    'sideplank-knee-angle': '屈膝改到约 90°',
    'knee-inside-foot': '下蹲/屈膝负重时膝盖对准第 2–3 脚趾：加大髋外旋或调整膝 pole 方向，避免膝落到脚内侧',
    'knee-outside-foot': '膝盖收回到脚尖正上方：减小髋外展/外旋（膝 pole 往内），小腿接近竖直',
    'rom-thighFace': '膝 pole（膝盖朝向提示）改成与脚尖同向，让膝在髌骨正后方弯曲',
    'rom-shinFace': '去掉小腿绕长轴的滚转，小腿前侧与屈膝方向一致',
    'rom-kneeAxisDev': '膝只做铰链屈伸：髋负责内外旋，膝 pole 与脚尖同向',
    'text-no-switch': '二选一：①按文案重做左右换髋（双膝翻到另一侧、上身坐直）并补对侧；②保留现有单侧前倾，把动作名/Flare 文案改成单侧拉伸',
    'sidesquat-com-off-foot': '骨盆横移到屈膝脚上方、臀部往后坐，重心投影落在该脚中后部；伸直腿只点地',
    'sidesquat-heel-up': '下蹲腿后跟踩实',
    'sidesquat-knee-toe': '下蹲腿膝盖对准脚尖',
    'cossack-straight-leg': '伸直腿膝盖伸直',
    'squat-heel-up': '负重腿全脚掌踩实',
    'crotch-bulge': '模型级：V5 裆部（会阴/前裆）蒙皮权重在髋深屈/大外展时鼓包，建议在 V5 皮肤层加裆部权重平滑或形状修正（全库一次修，不逐动作改姿势）；改好前可让机位避开正对裆部',
    'floor-penetration': '抬高该部位或调整接触，消除穿地（注意垫子顶面在 mat.at.y）',
    'foot-hover': '站定的脚落地（脚底贴地）',
    'com-outside-support': '调整重心使投影回到支撑面内（或补支撑点）',
    'asymmetry': '检查左右是否应对称，修正偏离的一侧',
    'text-forearm-support': '按文字改为小臂撑地，或改文字为手撑',
    '9090-torso-upright': '换髋版上身坐直',
    'knee-valgus': '膝盖对准脚尖',
    'knee-out-of-toe': '膝盖对准脚尖',
    'unexpected-switch': '确认单侧动作是否该在视频里换边',
}
SEVNAME = {1: '严重（一眼可见/反人类/敏感/文不对题）', 2: '明显不准', 3: '细节'}

def name_of(aid):
    r = json.load(open(os.path.join(REPO, next(a['recipe'] for a in V if a['id'] == aid))))
    return r.get('nameZh') or aid

def nearest_png(aid, frames):
    d = os.path.join(W, 'png', aid)
    if not os.path.isdir(d): return None, []
    have = sorted({int(f[:4]) for f in os.listdir(d) if f.endswith('.png')})
    if not have: return None, []
    tgt = frames[len(frames) // 2] if frames else have[len(have) // 2]
    f = min(have, key=lambda x: abs(x - tgt))
    return f, [os.path.join(d, f'{f:04d}-{v}.png') for v in ('cam', 'pfront', 'pside', 'ptop', 'camcr')]

def main():
    rows = []
    for a in V:
        p = os.path.join(W, 'an', a['id'] + '.json')
        if not os.path.exists(p) or not os.path.getsize(p): continue
        an = json.load(open(p))
        for f in an['findings']:
            key = f"{a['id']}|{f['code']}"
            rv = REV.get(key) or REV.get(a['id'] + '|*') or {}
            if rv.get('verdict') == 'false-positive': continue
            sev = rv.get('severity', f['severity'])
            kf, imgs = nearest_png(a['id'], f['frames'])
            rows.append({'id': a['id'], 'nameZh': name_of(a['id']), 'code': f['code'], 'issue': f['msg'], 'evidence': {'value': f['value'], 'metrics': {k: v for k, v in an['metrics'].items() if not k.startswith('info_')}},
                         'keyFrames': f['frames'], 'evidenceFrame': kf, 'severity': sev, 'severityName': SEVNAME[sev], 'level': 'model' if f['code'] == 'crotch-bulge' else 'action',
                         'suggestedFix': FIX.get(f['code'], ''), 'confidence': rv.get('confidence', f['confidence']), 'review': rv.get('verdict', 'unreviewed'), 'reviewNote': rv.get('note', ''),
                         'images': imgs})
    rows.sort(key=lambda r: (r['severity'], r['level'] == 'model', r['id']))
    json.dump(rows, open(os.path.join(HERE, 'findings.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(rows), 'findings')
    if '--sheets' in sys.argv:
        groups = {}
        for r in rows:
            if r['severity'] == 3: continue
            g = f"S{r['severity']}-{r['level']}"
            groups.setdefault(g, {}).setdefault(r['id'], []).append(r)
        for g, acts in groups.items():
            items = list(acts.items()); n = 8
            for k in range(0, len(items), n):
                sheet = []
                for aid, rs in items[k:k + n]:
                    r0 = rs[0]
                    imgs = r0['images'] if r0['level'] == 'model' else r0['images'][:4]
                    sheet.append({'title': f"{aid} {r0['nameZh']}", 'sev': r0['severity'], 'lines': [f"· {x['issue']}" for x in rs][:6] + [f"帧 {r0['evidenceFrame']}（关键帧 {','.join(map(str, r0['keyFrames'][:4]))}）"],
                                  'images': imgs, 'labels': ['机位', '正', '侧', '俯', '裆部'][:len(imgs)]})
                js = os.path.join(OUT, f'_{g}-{k // n + 1}.json'); json.dump(sheet, open(js, 'w'), ensure_ascii=False)
                subprocess.run([sys.executable, os.path.join(HERE, 'contact_sheet.py'), js, os.path.join(OUT, f'{g}-{k // n + 1:02d}.png')], check=True)
                os.remove(js)

if __name__ == '__main__': main()
