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
REVIEW = {'draft-ai-needs-user-review', 'user-reviewed', 'imported-reviewed'}
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
    ph = t.get('phases') or {}
    for k in ('start', 'peak', 'end'):
        bi(ph.get(k), f'phases.{k}', e, 'phase')
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
    print(json.dumps({'checked': len(files), 'failed': bad}))
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
