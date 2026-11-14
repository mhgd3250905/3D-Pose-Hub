"""Action text (definition + voice script source) for v3 packages: one bilingual JSON per action.

    catalog/production/v3-text/<id>.json   format pose-hub-action-text@1

The text is the ONLY hand-authored input of the definition and voice layers; everything else
(timing, dose rhythm, file refs, hashes) is derived by definition.py / voice.py. Validate:

    python3 tools/action-package-v3/text.py [--ids a,b]       # all files, exit 1 on any error
    python3 tools/action-package-v3/text.py --dupes [--dupes-min 4]   # report sentences shared across actions (STYLE §9, report only)
    python3 tools/action-package-v3/text.py --tempo   # list voiceGuide lines hitting the beat/tempo-command word list (STYLE §8, must be 0)
"""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
TEXT_DIR = REPO / 'catalog/production/v3-text'
FORMAT = 'pose-hub-action-text@1'
REVIEW = {'draft-ai-needs-user-review', 'ai-reviewed-r2-needs-user-review', 'ai-reviewed-r3-needs-user-review', 'user-reviewed', 'imported-reviewed'}
KINDS = {'rep_updown', 'rep_hold', 'rep_alternate', 'rep_cycle', 'hold'}
# words a listener rarely understands on first hearing: never in spoken lines (name/primaryCue/phases)
JARGON = ['弹震', '离心', '向心', '等长', '伸髋', '屈髋', '屈伸', '内旋', '外旋', '内收', '外展', '背屈', '跖屈', '对侧', '同侧',
          '中立位', '髋铰链', '激活', '代偿', '矢状', '冠状', '胸椎', '腰椎', '颈椎', '桡偏', '尺偏', '旋前', '旋后', '超伸', '前伸', '后缩', '骨盆后倾', '骨盆前倾']
JARGON_EN = ['ballistic', 'eccentric', 'concentric', 'isometric', 'flexion', 'extension', 'abduct', 'adduct', 'internal rotation', 'external rotation',
             'dorsiflex', 'plantarflex', 'contralateral', 'ipsilateral', 'neutral spine', 'hinge', 'activate', 'thoracic', 'lumbar', 'protract', 'retract', 'posterior tilt', 'anterior tilt']
# coach voice (STYLE.md §9): jargon/bookish words banned in EVERY text field incl. voiceGuide lines (error) ...
JARGON_ALL = ['弹震', '代偿', '激活', '中立位', '离心', '向心', '等长', '髋铰链', '募集', '稳定性', '核心收紧', '收紧核心', '脊柱', '躯干', '姿态', '下肢', '上肢', '矢状面', '冠状面']
# ... and vague/bookish words that should usually be said more concretely (warning only; counted, list with --weak)
WEAK = ['髋部', '骨盆', '幅度', '控制', '核心', '均匀', '感受', '稳定']
WEAK_EN = ['maintain', 'ensure', 'engage', 'core', 'stabil', 'control']
WEAK_HITS: list[str] = []
STRICT, CUR = [False], ['']   # jargon is an error only for r3-reviewed actions (older drafts warn until their batch)
CATEGORY = {'strength', 'mobility', 'stretch', 'stability', 'cardio', 'balance', 'breathing', 'assessment'}
POSITION = {'standing', 'seated', 'kneeling', 'half-kneeling', 'supine', 'prone', 'side-lying', 'quadruped', 'plank', 'hanging', 'other'}
DOSE = {'reps', 'hold', 'time'}
ZH = re.compile(r'[\u4e00-\u9fff]')
# spoken lines must be short enough to fit a phase (zh chars / en words); longer text belongs in cues
LIMITS = {'phase': (8, 5), 'primaryCue': (24, 18), 'name': (14, 6)}


def bi(v, path, errs, kind=None):
    if not (isinstance(v, dict) and isinstance(v.get('zh'), str) and v['zh'].strip() and isinstance(v.get('en'), str) and v['en'].strip()):
        errs.append(f'{path}: needs non-empty zh and en'); return
    if not ZH.search(v['zh']):
        errs.append(f'{path}.zh: not Chinese')
    if ZH.search(v['en']):
        errs.append(f'{path}.en: contains Chinese')
    if kind:
        zmax, emax = LIMITS[kind]
        if len(re.sub(r'[\s，。、！？,.!?]', '', v['zh'])) > zmax:
            errs.append(f'{path}.zh: longer than {zmax} characters for a spoken {kind}')
        if len(v['en'].split()) > emax:
            errs.append(f'{path}.en: longer than {emax} words for a spoken {kind}')
        if kind in ('phase', 'primaryCue'):
            bad = [w for w in JARGON if w in v['zh']] + [w for w in JARGON_EN if w in v['en'].lower()]
            if bad: errs.append(f'{path}: spoken line uses hard-to-hear words {bad}')
    bad = [w for w in JARGON_ALL if w in v['zh']]
    if bad:
        if STRICT[0]: errs.append(f'{path}: jargon not allowed anywhere (STYLE §9) {bad}')
        else: WARN.append(f'{CUR[0]}: {path} jargon {bad} (error once the action is r3-reviewed)')
    weak = [w for w in WEAK if w in v['zh']] + [w for w in WEAK_EN if w in v['en'].lower()]
    if weak: WEAK_HITS.append(f'{path}: {weak}')


def validate(t: dict, aid: str) -> list[str]:
    e = []
    STRICT[0], CUR[0] = t.get('reviewStatus') == 'ai-reviewed-r3-needs-user-review', aid
    if t.get('format') != FORMAT: e.append('format')
    if t.get('id') != aid: e.append('id must match file name')
    if t.get('reviewStatus') not in REVIEW: e.append('reviewStatus')
    if not (isinstance(t.get('sources'), list) and t['sources']): e.append('sources: list the files the text was drafted from')
    bi(t.get('name'), 'name', e, 'name')
    bi(t.get('purpose'), 'purpose', e)
    cues = t.get('cues')
    if not (isinstance(cues, list) and 2 <= len(cues) <= 4): e.append('cues: 2-4')
    else:
        if sum(1 for c in cues if c.get('primary')) != 1: e.append('cues: exactly one primary')
        for i, c in enumerate(cues):
            bi(c.get('text'), f'cues[{i}].text', e, 'primaryCue' if c.get('primary') else None)
    errs = t.get('commonErrors')
    if not (isinstance(errs, list) and 1 <= len(errs) <= 3): e.append('commonErrors: 1-3')
    else:
        for i, x in enumerate(errs): bi(x, f'commonErrors[{i}]', e)
    for i, x in enumerate(t.get('cautions') or []): bi(x, f'cautions[{i}]', e)
    tags = t.get('tags') or {}
    if tags.get('category') not in CATEGORY: e.append(f'tags.category one of {sorted(CATEGORY)}')
    if tags.get('position') not in POSITION: e.append(f'tags.position one of {sorted(POSITION)}')
    if not (isinstance(tags.get('activeMuscles'), list) and tags['activeMuscles']): e.append('tags.activeMuscles')
    if not isinstance(tags.get('equipment'), list): e.append('tags.equipment (list, [] = none)')
    if tags.get('difficulty') not in (1, 2, 3): e.append('tags.difficulty 1-3')
    if not isinstance(t.get('unilateral'), bool): e.append('unilateral')
    if t.get('unilateral') and t.get('startingSide') not in ('left', 'right'): e.append('startingSide')
    d = t.get('defaultDose') or {}
    if d.get('mode') not in DOSE: e.append('defaultDose.mode')
    elif d['mode'] == 'reps' and not isinstance(d.get('reps'), int): e.append('defaultDose.reps')
    elif d['mode'] in ('hold', 'time') and not isinstance(d.get('seconds'), int): e.append('defaultDose.seconds')
    if not isinstance(d.get('sets'), int) or not isinstance(d.get('restSeconds'), int): e.append('defaultDose.sets/restSeconds')
    if t.get('reviewStatus') != 'draft-ai-needs-user-review':
        e += training_errors(t)
    e += voice_guide_errors(t)
    ph = t.get('phases') or {}
    for k in ('start', 'peak', 'end'):
        bi(ph.get(k), f'phases.{k}', e, 'phase')
    return e


def training_errors(t: dict) -> list[str]:
    """training = how the app counts or times one set (ugk_trainer Rhythm): reps -> counted rep kinds with phases, time -> hold timer."""
    e, tr, d = [], t.get('training'), t.get('defaultDose') or {}
    if not isinstance(tr, dict): return ['training: missing (count/timer rhythm)']
    k = tr.get('kind')
    if k not in KINDS: return [f'training.kind one of {sorted(KINDS)}']
    if d.get('mode') in ('hold', 'time') and k != 'hold': e.append('training: time dose must use kind hold (timer)')
    if d.get('mode') == 'reps':
        if k == 'hold': e.append('training: reps dose needs a counted kind')
        ph = tr.get('phases')
        if not (isinstance(ph, list) and ph): e.append('training.phases required for counted kinds')
        else:
            for i, x in enumerate(ph):
                if x.get('id') not in ('go', 'hold', 'back', 'rest') or not (isinstance(x.get('seconds'), (int, float)) and x['seconds'] > 0):
                    e.append(f'training.phases[{i}]: id go/hold/back/rest + seconds > 0')
                if x.get('cue') not in (None, 'phase.start', 'phase.peak', 'phase.end'): e.append(f'training.phases[{i}].cue')
                if x.get('cue') and t.get('reviewStatus') == 'ai-reviewed-r3-needs-user-review':
                    e.append(f'training.phases[{i}].cue: no phase voice markers (voice-no-tempo-r1: phase words are not spoken)')
    if t.get('unilateral') and tr.get('perSide') not in ('each-side-separately', 'alternate', 'one-side-only'):
        e.append('training.perSide: each-side-separately | alternate | one-side-only')
    if 'sideSwitchSeconds' in tr:   # r3, optional, not read by the App yet
        ss = tr['sideSwitchSeconds']
        if not (isinstance(ss, int) and 5 <= ss <= 20): e.append('training.sideSwitchSeconds: integer 5-20')
        if tr.get('perSide') != 'each-side-separately': e.append('training.sideSwitchSeconds only for perSide each-side-separately')
    if t.get('reviewStatus') == 'ai-reviewed-r3-needs-user-review':
        if k != 'hold' and tr.get('source') != 'real-tempo r3': e.append('training.source: real-tempo r3 (tempo from real training, not the animation)')
        if k != 'hold' and isinstance(tr.get('phases'), list):
            one = sum(p.get('seconds', 0) for p in tr['phases'])
            if not 1.5 <= one <= 8 and t.get('id') not in LONG_REP_OK: WARN.append(f"{t.get('id')}: one rep {one:.1f} s outside the usual 1.5-8 s")
    return e


SHARED = REPO / 'catalog/voice-v2/script.json'
WARN: list[str] = []
# voice-no-tempo-r1 (开哥 2026-11-14 23:45): voiceGuide 只讲「怎么做对」，不喊跟着每下节拍走的动作口令、不指挥快慢（STYLE §8）。
# 词表命中即报错；`--tempo` 列出全部命中（目标 0）。改写成状态/要领描述：「蹲那侧脚后跟踩实」而不是「蹲过去、踩住」。
TEMPO_ZH = ['现在', '下一下', '每一下', '每下', '这一下', '一下一下', '再来', '回来', '回去', '回到', '回正', '下去', '上去', '过去',
            '放下', '放回', '落下', '落回', '收回', '转回', '摆回', '并回', '躺回', '坐回', '推起', '推上', '推出去', '推回', '推直',
            '蹲下', '蹲过去', '站起来', '坐起来', '撑起来', '顶起来', '抬起来', '踩住', '稳住', '停住', '停一下', '停两秒', '停一秒',
            '顿一下', '保持住', '顶住', '换边', '换腿', '换手', '吸气', '呼气', '慢', '快一点', '快点', '越做越快',
            '节奏', '跟着数', '数两秒', '数到', '到顶', '到底', '继续', '夹一下', '碰一下', '再往', '再沉', '再够', '再滑', '再夹', '再转',
            '再松', '再推', '再抬', '再坐', '再挪', '先轻后重']
TEMPO_ZH_RE = [r'停\s*\d', r'\d\s*秒']
TEMPO_EN_RE = [r'\bnow\b', r'\bagain\b', r'\bnext (rep|one)\b', r'\bexhale\b', r'\binhale\b', r'\bbreathe (in|out)\b', r'\bswitch\b',
               r'\bhold\b', r'\bpause\b', r'\bslow(ly|er)?\b', r'\bfast(er)?\b', r'\bthen\b', r'\bcome back\b', r'\bback (up|down|in|out|to)\b',
               r'\bstand up\b', r'\bsit up\b', r'\bpush up\b', r'\blie back\b', r'\blower(?! back)\b', r'\bfor (one|two|1|2)\b',
               r'\b\d+ ?(s|sec|seconds?)\b', r'\bat the top\b', r'\ball the way (up|down)\b', r'\bkeep going\b', r'\bone more\b']
TEMPO_HITS: list[str] = []
VG_MIN_ZH, VG_MIN_EN = 5, 3   # shorter self-written lines sound like barked commands (「腰别塌」「Hold」); say what right looks like
VG_REPS_MAX_LINES, VG_REPS_MIN_SPACING = 2, 2   # reps: at most 2 self-written lines per set, >= 2 reps apart (counts already fill the set)
LONG_REP_OK = {'deltoids-B'}   # 半程土耳其起立：一下约 14 s 是真实节奏（开哥 2026-11-14 同意）


def tempo_hits(zh: str, en: str) -> list[str]:
    h = [w for w in TEMPO_ZH if w in zh] + [p for p in TEMPO_ZH_RE if re.search(p, zh)]
    return h + [p for p in TEMPO_EN_RE if re.search(p, en.lower())]
VG_GAP, VG_LEAD, VG_TAIL, VG_MARGIN = 10.0, 3.0, 4.0, 0.3   # anti-blank gap, first-line earliest, countdown zone, line spacing (s)
VG_STEP_MIN, VG_STEP_LEAD, VG_STEP_TAIL = 8.0, 1.5, 0.8   # steps mode: min rep length, first step earliest, room left for the count (s)


def _speak_s(v):
    zh = len(re.sub(r'[\s，。、！？,.!?]', '', v['zh'])) / 4.0
    en = len(v['en'].split()) / 2.5
    return max(zh, en)


def _from_ok(t, ref):
    m = re.fullmatch(r'(commonErrors|cautions)\[(\d+)\]', ref)
    if m: return int(m.group(2)) < len(t.get(m.group(1)) or [])
    return any(c.get('id') == ref for c in t.get('cues') or [])


def voice_guide_errors(t: dict) -> list[str]:
    """voiceGuide (optional, STYLE.md §8): mid-set voice lines + countdown. Script only; not read by produce.py / the App yet."""
    vg = t.get('voiceGuide')
    if vg is None: return []
    e, d, aid = [], t.get('defaultDose') or {}, t.get('id')
    if vg.get('format') != 'pose-hub-voice-guide@1': e.append('voiceGuide.format')
    if vg.get('status') != 'script-only': e.append('voiceGuide.status: script-only until audio exists')
    want = 'hold' if d.get('mode') in ('hold', 'time') else 'reps'
    if vg.get('mode') != want: e.append(f'voiceGuide.mode must be {want} for this dose')
    try: vocab = set(json.loads(SHARED.read_text('utf-8'))['common'])
    except Exception: vocab = None
    def key_ok(k, path):
        if k == 'n.{rep}' or vocab is None: return
        if k not in vocab:
            if k.startswith('sec.'): WARN.append(f'{aid}: {path} {k} not in shared vocabulary yet (needs a clip)')
            else: e.append(f'{path}: {k} not in shared vocabulary')
    def line_ok(x, path):
        if 'key' in x: key_ok(x['key'], path); return 0.0
        bi(x, path, e)
        if isinstance(x.get('zh'), str) and isinstance(x.get('en'), str):
            hit = tempo_hits(x['zh'], x['en'])
            if hit:
                TEMPO_HITS.append(f'{aid} {path}: {hit} {x["zh"]} / {x["en"]}')
                e.append(f'{path}: beat/tempo command words {hit} (STYLE §8: say how to do it right, not what to do now)')
            if len(re.sub(r'[\s，。、！？,.!?；;]', '', x['zh'])) < VG_MIN_ZH or len(x['en'].split()) < VG_MIN_EN:
                e.append(f'{path}: line shorter than {VG_MIN_ZH} zh chars / {VG_MIN_EN} en words reads as a command; describe the form')
        if not (isinstance(x.get('from'), list) and x['from']): e.append(f'{path}.from: list the cue/error/caution it comes from')
        else:
            for r in x['from']:
                if not _from_ok(t, r): e.append(f'{path}.from: {r} not in this action')
        return _speak_s(x) if isinstance(x.get('zh'), str) and isinstance(x.get('en'), str) else 0.0
    for k, v in (vg.get('afterSet') or {}).items():
        for kk in v: key_ok(kk, f'voiceGuide.afterSet.{k}')
    for kk in vg.get('before') or []: key_ok(kk, 'voiceGuide.before')
    if want == 'hold':
        S, ev = d.get('seconds') or 0, vg.get('set') or []
        ats = [x.get('at') for x in ev]
        if ats != sorted(ats) or not ev: e.append('voiceGuide.set: events sorted by at'); return e
        if [x.get('key') for x in ev[-3:]] != ['n.3', 'n.2', 'n.1'] or [x['at'] for x in ev[-3:]] != [S - 3, S - 2, S - 1]:
            e.append('voiceGuide.set: end with n.3/n.2/n.1 at seconds-3..-1')
        for i, x in enumerate(ev):
            dur = line_ok(x, f'voiceGuide.set[{i}]')
            nxt = ev[i + 1]['at'] if i + 1 < len(ev) else S
            if 'key' not in x:
                if not (VG_LEAD <= x['at'] <= S - VG_TAIL): e.append(f'voiceGuide.set[{i}]: line at {x["at"]} s outside {VG_LEAD}..{S - VG_TAIL}')
                if x['at'] + dur > nxt - VG_MARGIN: e.append(f'voiceGuide.set[{i}]: ~{dur:.1f} s line overruns next event at {nxt} s')
            if nxt - x['at'] > VG_GAP: e.append(f'voiceGuide.set[{i}]: {nxt - x["at"]} s silent gap (max {VG_GAP})')
    else:
        N, tr = d.get('reps') or 0, t.get('training') or {}
        one = sum(p.get('seconds', 0) for p in tr.get('phases') or []) * (2 if tr.get('repUnit') == 'left+right' else 1)
        R = vg.get('repSeconds')
        if not isinstance(R, (int, float)) or abs(R - one) > 0.15: e.append(f'voiceGuide.repSeconds must equal one counted rep ({one:.1f} s)')
        # voice-no-tempo-r1 (开哥 2026-11-14 23:45): no phase words between counts -> phaseCues none; first-2-reps/steps/every-rep stay parseable for old drafts
        steps = vg.get('phaseCues') == 'steps'
        if vg.get('phaseCues') not in ('none', 'first-2-reps', 'every-rep', 'steps'): e.append('voiceGuide.phaseCues: none | first-2-reps | steps | every-rep')
        if t.get('reviewStatus') == 'ai-reviewed-r3-needs-user-review' and vg.get('phaseCues') != 'none': e.append('voiceGuide.phaseCues: r3 uses none (no phase/step words, only counts + form lines)')
        if steps:
            if not (isinstance(R, (int, float)) and R >= VG_STEP_MIN): e.append(f'voiceGuide.phaseCues steps only for one rep >= {VG_STEP_MIN:.0f} s')
            st, prev_end = vg.get('steps') or [], None
            if len(st) < 2: e.append('voiceGuide.steps: at least 2 step lines')
            for i, x in enumerate(st):
                dur = line_ok(x, f'voiceGuide.steps[{i}]')
                a = x.get('at')
                if not isinstance(a, (int, float)): e.append(f'voiceGuide.steps[{i}].at'); continue
                if a < VG_STEP_LEAD: e.append(f'voiceGuide.steps[{i}]: first step not before {VG_STEP_LEAD} s (room for the count / last-rep cue)')
                if prev_end is not None and a < prev_end + VG_MARGIN: e.append(f'voiceGuide.steps[{i}]: overlaps the previous step line')
                prev_end = a + dur
            if prev_end is not None and isinstance(R, (int, float)) and prev_end > R - VG_STEP_TAIL: e.append(f'voiceGuide.steps: last line runs into the count (ends ~{prev_end:.1f} s of {R} s)')
        elif 'steps' in vg: e.append('voiceGuide.steps only with phaseCues steps')
        if N > 10 and vocab is not None and f'n.{N}' not in vocab: WARN.append(f'{aid}: counts up to {N} but shared vocabulary stops at n.10')
        if (vg.get('count') or {}).get('key') != 'n.{rep}': e.append('voiceGuide.count.key n.{rep}')
        rem, last = vg.get('reminders') or [], 0
        legacy = vg.get('phaseCues') != 'none'
        own = [x.get('afterRep') for x in rem if 'key' not in x]
        if not legacy:
            if len(own) > VG_REPS_MAX_LINES: e.append(f'voiceGuide.reminders: {len(own)} self-written lines (max {VG_REPS_MAX_LINES} per set; the counts fill the set)')
            if any(isinstance(a, int) and isinstance(b, int) and b - a < VG_REPS_MIN_SPACING for a, b in zip(own, own[1:])): e.append(f'voiceGuide.reminders: self-written lines < {VG_REPS_MIN_SPACING} reps apart')
        for i, x in enumerate(rem):
            a = x.get('afterRep')
            if not (isinstance(a, int) and last < a < N): e.append(f'voiceGuide.reminders[{i}].afterRep: increasing, 1..reps-1'); continue
            if legacy and a < min(2, N - 1): e.append(f'voiceGuide.reminders[{i}]: first 2 reps carry the phase cues; start after rep 2')
            if steps and 'key' not in x: e.append(f'voiceGuide.reminders[{i}]: steps mode fills every rep; only p.last_rep')
            if legacy and a - last > 3 and not steps: e.append(f'voiceGuide.reminders[{i}]: {a - last} reps without a line (max 3)')
            dur = line_ok(x, f'voiceGuide.reminders[{i}]')
            if isinstance(R, (int, float)) and dur > R - 1.0: e.append(f'voiceGuide.reminders[{i}]: ~{dur:.1f} s line longer than one rep minus the count')
            last = a
        if not rem or rem[-1].get('key') != 'p.last_rep' or rem[-1].get('afterRep') != N - 1: e.append('voiceGuide.reminders: end with p.last_rep after rep reps-1')
    return e


def load(aid: str) -> dict:
    p = TEXT_DIR / f'{aid}.json'
    t = json.loads(p.read_text('utf-8'))
    errs = validate(t, aid)
    if errs:
        raise ValueError(f'{aid}: ' + '; '.join(errs))
    return t


# ---- cross-action repeated sentences (STYLE §9 去套话; report only, never fails the check)
_DUP_PUN = re.compile(r"[\s，。、！？,.!?；;：:「」\"'“”‘’（）()…—\-]")


def _dup_items(t):
    o = [('purpose', t['purpose'])] + [(c['id'], c['text']) for c in t['cues']]
    o += [(f'commonErrors[{i}]', x) for i, x in enumerate(t['commonErrors'])]
    o += [(f'cautions[{i}]', x) for i, x in enumerate(t.get('cautions') or [])]
    o += [(f'phases.{k}', v) for k, v in t['phases'].items()]
    vg = t.get('voiceGuide') or {}
    for sec in ('set', 'reminders', 'steps'):
        o += [(f'voiceGuide.{sec}[{i}]', x) for i, x in enumerate(vg.get(sec, [])) if 'zh' in x]
    return o


def _lev(a, b, m):
    if abs(len(a) - len(b)) > m: return m + 1
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb))
        if min(cur) > m: return m + 1
        prev = cur
    return prev[-1]


def dupes(files, min_actions=4):
    """Sentences (exact after stripping punctuation, or differing by 1-2 chars / words) that appear in
    >= min_actions actions. Short commands (zh <= 4 chars, en <= 3 words) are reported as 口令."""
    occ = {'zh': {}, 'en': {}}; raw = {'zh': {}, 'en': {}}
    for p in files:
        t = json.loads(p.read_text('utf-8'))
        for _, v in _dup_items(t):
            for L in ('zh', 'en'):
                n = _DUP_PUN.sub('', v[L]); n = n.lower() if L == 'en' else n
                if n: occ[L].setdefault(n, set()).add(t['id']); raw[L].setdefault(n, v[L])
    groups = []
    for L in ('zh', 'en'):
        keys = sorted(occ[L], key=lambda k: -len(occ[L][k])); used = set()
        words = {k: [_DUP_PUN.sub('', w) for w in raw[L][k].lower().split()] for k in keys} if L == 'en' else {}
        for k in keys:
            if k in used: continue
            mem = [k]; used.add(k)
            for k2 in keys:
                if k2 in used: continue
                if L == 'zh':
                    m = 1 if len(k) < 10 else 2
                    if len(k) >= 6 and _lev(k, k2, m) <= m: mem.append(k2); used.add(k2)
                else:
                    w1 = words[k]; m = 1 if len(w1) < 7 else 2
                    if len(w1) >= 4 and _lev(w1, words[k2], m) <= m: mem.append(k2); used.add(k2)
            ids = sorted(set().union(*[occ[L][x] for x in mem]))
            if len(ids) >= min_actions:
                short = all((len(x) <= 4 if L == 'zh' else len(raw[L][x].split()) <= 3) for x in mem)
                groups.append({'lang': L, 'command': short, 'actions': len(ids), 'text': [raw[L][x] for x in mem], 'ids': ids})
    return groups


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--ids')
    ap.add_argument('--weak', action='store_true', help='list every vague/bookish word hit (STYLE §9)')
    ap.add_argument('--dupes', action='store_true', help='report sentences repeated across actions (STYLE §9, report only)')
    ap.add_argument('--dupes-min', type=int, default=4, help='min number of actions for --dupes (default 4)')
    ap.add_argument('--tempo', action='store_true', help='list voiceGuide lines with beat/tempo command words (STYLE §8, target 0)')
    a = ap.parse_args(argv)
    files = sorted(TEXT_DIR.glob('*.json')) if not a.ids else [TEXT_DIR / f'{i}.json' for i in a.ids.split(',')]
    bad = 0
    for p in files:
        try:
            load(p.stem)
        except Exception as ex:
            bad += 1; print(str(ex)[:600])
    for w in WARN: print('WARN', w)
    for w in WEAK_HITS if a.weak else []: print('WEAK', w)
    for w in TEMPO_HITS if a.tempo else []: print('TEMPO', w)
    summary = {'checked': len(files), 'failed': bad, 'warnings': len(WARN), 'weakWords': len(WEAK_HITS), 'tempoHits': len(TEMPO_HITS)}
    if a.dupes:
        g = dupes(files, a.dupes_min)
        for x in g:
            tag = '口令' if x['command'] else '句子'
            print(f"DUPE {tag} {x['lang']} ×{x['actions']}: {' | '.join(x['text'][:4])} :: {', '.join(x['ids'])}")
        summary['dupeSentences'] = sum(1 for x in g if not x['command'])
        summary['dupeCommands'] = sum(1 for x in g if x['command'])
    print(json.dumps(summary))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
