"""Action text (definition + voice script source) for v3 packages: one bilingual JSON per action.

    catalog/production/v3-text/<id>.json   format pose-hub-action-text@1

The text is the ONLY hand-authored input of the definition and voice layers; everything else
(timing, dose rhythm, file refs, hashes) is derived by definition.py / voice.py. Validate:

    python3 tools/action-package-v3/text.py [--ids a,b]       # all files, exit 1 on any error
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


def validate(t: dict, aid: str) -> list[str]:
    e = []
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
    if t.get('unilateral') and tr.get('perSide') not in ('each-side-separately', 'alternate', 'one-side-only'):
        e.append('training.perSide: each-side-separately | alternate | one-side-only')
    return e


SHARED = REPO / 'catalog/voice-v2/script.json'
WARN: list[str] = []
VG_GAP, VG_LEAD, VG_TAIL, VG_MARGIN = 10.0, 3.0, 4.0, 0.3   # anti-blank gap, first-line earliest, countdown zone, line spacing (s)


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
        if vg.get('phaseCues') not in ('first-2-reps', 'every-rep'): e.append('voiceGuide.phaseCues: first-2-reps | every-rep')
        if (vg.get('count') or {}).get('key') != 'n.{rep}': e.append('voiceGuide.count.key n.{rep}')
        rem, last = vg.get('reminders') or [], 0
        for i, x in enumerate(rem):
            a = x.get('afterRep')
            if not (isinstance(a, int) and last < a < N): e.append(f'voiceGuide.reminders[{i}].afterRep: increasing, 1..reps-1'); continue
            if a - last > 3: e.append(f'voiceGuide.reminders[{i}]: {a - last} reps without a line (max 3)')
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


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--ids')
    a = ap.parse_args(argv)
    files = sorted(TEXT_DIR.glob('*.json')) if not a.ids else [TEXT_DIR / f'{i}.json' for i in a.ids.split(',')]
    bad = 0
    for p in files:
        try:
            load(p.stem)
        except Exception as ex:
            bad += 1; print(str(ex)[:600])
    for w in WARN: print('WARN', w)
    print(json.dumps({'checked': len(files), 'failed': bad, 'warnings': len(WARN)}))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
