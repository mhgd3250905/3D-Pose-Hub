#!/usr/bin/env python3
"""Validate catalog/ai-tags/actions/*.json against vocabulary.json and the 249 finalized actions.

python tools/ai-tags/validate.py            # 校验已有标签文件；缺标签只报告数量，不判失败
python tools/ai-tags/validate.py --strict   # 批量完成后用：缺标签也判失败
python tools/ai-tags/validate.py --json     # 机器可读结果

Only the Python standard library. Errors (exit 1): value not in vocabulary, missing required field,
bad type, related action id not in the finalized list, id/filename mismatch, schema enums out of sync
with vocabulary. Warnings (exit 0): cross-checks against v3 text (laterality, cautions, source hash) and
scene plausibility (office + floor, high impact in hotel/office ...).
"""
import argparse, glob, hashlib, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TAGS = os.path.join(ROOT, 'catalog', 'ai-tags')
TEXT = os.path.join(ROOT, 'catalog', 'production', 'v3-text')
RECIPES = ['catalog/production/remaining219-r1/recipes/*.json', 'catalog/production/remaining32-r4/groups/*/*.json']
CAUTION_WORDS = {'knee': ['膝'], 'lumbar': ['腰', '下背'], 'shoulder': ['肩'], 'wrist': ['手腕', '腕'], 'neck': ['脖子', '颈'], 'ankle': ['脚踝', '踝'], 'hip': ['髋']}
ORDER = {'none': 0, 'low': 1, 'moderate': 2}


def load(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)


def sha_lf(p):
    with open(p, 'rb') as f:
        return hashlib.sha256(f.read().replace(b'\r\n', b'\n')).hexdigest()


def finalized_ids():
    text_ids = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(TEXT, '*.json'))}
    recipe_ids = set()
    for g in RECIPES:
        for p in glob.glob(os.path.join(ROOT, g)):
            recipe_ids.add(load(p).get('id'))
    return text_ids, recipe_ids


def enums(voc):
    D = voc['dimensions']
    E = {}
    for k, d in D.items():
        if 'values' in d and d.get('type') in ('single', 'multi'):
            E[k] = set(d['values'])
    E['equipment'] = set(D['equipment']['values'])
    E['muscles'] = set(D['muscles']['values'])
    E['joint'] = set(D['joints']['jointValues'])
    E['jointAction'] = set(D['joints']['actionValues'])
    E['jointStressLevel'] = set(D['jointStress']['values'])
    E['jointStressKeys'] = list(D['jointStress']['keys'])
    E['population'] = set(D['populationNotes']['populations'])
    E['popFlag'] = set(D['populationNotes']['flags'])
    E['popReason'] = set(D['populationNotes']['reasons'])
    return E


def schema_sync(voc, schema, errs):
    """The schema's enums are generated from the vocabulary; they must not drift."""
    E = enums(voc)
    P = schema.get('properties', {})
    pairs = {'scenes': P['scenes']['items']['enum'], 'trainingType': P['trainingType']['items']['enum'],
             'movementPattern': P['movementPattern']['items']['enum'], 'goals': P['goals']['items']['enum'],
             'equipment': P['requiredEquipment']['items']['enum'], 'muscles': P['primaryMuscles']['items']['enum'],
             'prerequisites': P['prerequisites']['items']['enum'], 'laterality': P['laterality']['enum'],
             'joint': P['joints']['items']['properties']['joint']['enum']}
    for k, lst in pairs.items():
        if set(lst) != E[k]:
            errs.append(f'schema: {k} enum differs from vocabulary ({sorted(set(lst) ^ E[k])})')
    if P['jointStress']['required'] != E['jointStressKeys']:
        errs.append('schema: jointStress keys differ from vocabulary')


def check_file(path, voc, schema, E, ids, errs, warns):
    fid = os.path.basename(path)[:-5]
    try:
        t = load(path)
    except Exception as ex:
        errs.append(f'{fid}: invalid JSON ({ex})'); return None
    e = lambda m: errs.append(f'{fid}: {m}')
    w = lambda m: warns.append(f'{fid}: {m}')
    P = schema['properties']
    for k in schema['required']:
        if k not in t:
            e(f'missing required field {k}')
    for k in t:
        if k not in P:
            e(f'unknown field {k}')
    if t.get('format') != 'pose-hub-ai-tags@1': e('format must be pose-hub-ai-tags@1')
    if t.get('id') != fid: e(f'id {t.get("id")!r} != filename')
    if fid not in ids: e('id is not one of the finalized actions')
    if t.get('vocabularyVersion') != voc['version']: w(f'vocabularyVersion {t.get("vocabularyVersion")} != {voc["version"]}')

    def one(field, key=None):
        if field in t and t[field] not in E[key or field]: e(f'{field}={t[field]!r} not in vocabulary')

    def many(field, key=None, min1=False):
        if field not in t: return
        v = t[field]
        if not isinstance(v, list): e(f'{field} must be a list'); return
        if min1 and not v: e(f'{field} must not be empty')
        if len(set(map(str, v))) != len(v): e(f'{field} has duplicates')
        for x in v:
            if x not in E[key or field]: e(f'{field}: {x!r} not in vocabulary')

    many('scenes', min1=True); one('space'); one('impact'); one('sweat'); one('intensity'); one('laterality'); one('confidence')
    if 'floorRequired' in t and not isinstance(t['floorRequired'], bool): e('floorRequired must be boolean')
    many('requiredEquipment', 'equipment'); many('optionalEquipment', 'equipment')
    many('trainingType', min1=True); many('movementPattern'); many('contraction', min1=True); many('plane', min1=True); many('bodyRegion', min1=True)
    for f in ('primaryMuscles', 'secondaryMuscles', 'stabilizers', 'stretchedMuscles'): many(f, 'muscles')
    many('prerequisites'); many('sessionRole', min1=True); many('goals', min1=True)
    d = t.get('difficulty')
    if not (isinstance(d, int) and not isinstance(d, bool) and 1 <= d <= 5): e('difficulty must be integer 1-5')
    for s in t.get('substitutes', []) or []:
        if s.get('for') not in E['equipment']: e(f'substitutes.for {s.get("for")!r} not in vocabulary')
        elif s['for'] not in t.get('requiredEquipment', []): w(f'substitutes.for {s["for"]} is not in requiredEquipment')
        for u in s.get('use', []):
            if u not in E['equipment']: e(f'substitutes.use {u!r} not in vocabulary')
        if s.get('loadNote') not in (None, 'lighter', 'similar', 'heavier'): e('substitutes.loadNote invalid')
    for j in t.get('joints', []) or []:
        if j.get('joint') not in E['joint']: e(f'joints.joint {j.get("joint")!r} not in vocabulary')
        if not j.get('actions'): e(f'joints.{j.get("joint")} has no actions')
        for a in j.get('actions', []):
            if a not in E['jointAction']: e(f'joints action {a!r} not in vocabulary')
    jst = t.get('jointStress', {}) or {}
    for k in E['jointStressKeys']:
        if k not in jst: e(f'jointStress.{k} missing')
        elif jst[k] not in E['jointStressLevel']: e(f'jointStress.{k}={jst[k]!r} not in vocabulary')
    for k in jst:
        if k not in E['jointStressKeys']: e(f'jointStress.{k} unknown key')
    for p in t.get('populationNotes', []) or []:
        if p.get('population') not in E['population']: e(f'populationNotes population {p.get("population")!r} not in vocabulary')
        if p.get('flag') not in E['popFlag']: e(f'populationNotes flag {p.get("flag")!r} not in vocabulary')
        for r in p.get('reasons', []):
            if r not in E['popReason']: e(f'populationNotes reason {r!r} not in vocabulary')
    for f in ('alternatives', 'regressions', 'progressions'):
        for x in t.get(f, []) or []:
            if x not in ids: e(f'{f}: {x!r} is not a finalized action id')
            if x == fid: e(f'{f}: references itself')
    s = t.get('aiSummary') or {}
    if not (isinstance(s, dict) and s.get('zh') and s.get('en')): e('aiSummary needs zh and en')
    elif len(s['zh']) > 60: w(f'aiSummary.zh is {len(s["zh"])} chars (>60)')

    # cross rules
    tt = set(t.get('trainingType', []))
    if tt & {'static-stretch', 'dynamic-stretch'} and not t.get('stretchedMuscles'): e('stretch trainingType requires stretchedMuscles')
    if not t.get('primaryMuscles') and not t.get('stretchedMuscles'): e('primaryMuscles empty and no stretchedMuscles')
    layers = [set(t.get(k, [])) for k in ('primaryMuscles', 'secondaryMuscles', 'stabilizers')]
    if (layers[0] & layers[1]) or (layers[0] & layers[2]) or (layers[1] & layers[2]): w('a muscle appears in more than one of primary/secondary/stabilizers')
    if set(t.get('requiredEquipment', [])) & set(t.get('optionalEquipment', [])): e('equipment both required and optional')
    sc = set(t.get('scenes', []))
    if 'office' in sc and t.get('floorRequired'): w('office scene but floorRequired=true')
    if sc & {'office', 'hotel'} and t.get('impact') == 'high': w('office/hotel scene with high impact')
    if 'office' in sc and t.get('sweat') in ('moderate', 'high'): w('office scene but sweat >= moderate')
    gym_only = {k for k, v in voc['dimensions']['equipment']['values'].items() if v['defaultScenes'] == ['gym']}
    if sc - {'gym'} and set(t.get('requiredEquipment', [])) & gym_only and not t.get('substitutes'): w('non-gym scene but requires gym-only equipment without substitutes')

    # cross-check with v3 text
    tp = os.path.join(TEXT, fid + '.json')
    if os.path.exists(tp):
        v3 = load(tp)
        src = t.get('source', {})
        if src.get('textSha256Lf') and src['textSha256Lf'] != sha_lf(tp): w('v3 text changed since tagging (textSha256Lf mismatch); re-check')
        lat = t.get('laterality')
        if lat and (lat != 'bilateral') != bool(v3.get('unilateral')): w(f'laterality={lat} vs v3 unilateral={v3.get("unilateral")}')
        kind = (v3.get('training') or {}).get('kind')
        if lat == 'unilateral' and kind == 'rep_alternate': w('laterality=unilateral but v3 training.kind=rep_alternate (alternating?)')
        # cautions follow 'X 时 Y'; only the condition X names the stressed joint
        caut = ' '.join(c.get('zh', '').split('时')[0] for c in v3.get('cautions', []))
        for k, words in CAUTION_WORDS.items():
            if any(x in caut for x in words) and ORDER.get(jst.get(k), 0) == 0: w(f'v3 cautions mention {k} but jointStress.{k}=none')
        if v3['tags'].get('difficulty') and isinstance(d, int) and abs(d - v3['tags']['difficulty']) >= 2 and not t.get('notes'):
            w(f'difficulty {d} differs from v3 {v3["tags"]["difficulty"]} by >=2 without notes')
    return t


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--strict', action='store_true', help='missing tag files are errors')
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    errs, warns = [], []
    voc = load(os.path.join(TAGS, 'vocabulary.json'))
    schema = load(os.path.join(TAGS, 'ai-tags.schema.json'))
    schema_sync(voc, schema, errs)
    E = enums(voc)
    text_ids, recipe_ids = finalized_ids()
    if text_ids != recipe_ids:
        warns.append(f'finalized list: v3-text {len(text_ids)} vs recipes {len(recipe_ids)}; diff {sorted(text_ids ^ recipe_ids)[:10]}')
    ids = text_ids
    files = sorted(glob.glob(os.path.join(TAGS, 'actions', '*.json')))
    tagged = set()
    for p in files:
        if check_file(p, voc, schema, E, ids, errs, warns) is not None:
            tagged.add(os.path.basename(p)[:-5])
    missing = sorted(ids - tagged)
    if a.strict and missing:
        errs.append(f'{len(missing)} finalized actions have no tag file')
    res = {'finalized': len(ids), 'tagged': len(tagged & ids), 'missing': len(missing), 'errors': errs, 'warnings': warns}
    if a.json:
        print(json.dumps(res, ensure_ascii=False, indent=2))
    else:
        print(f'finalized actions: {len(ids)}  tagged: {len(tagged & ids)}  missing: {len(missing)}' + ('' if a.strict else '  (missing not failing; use --strict after batch)'))
        for x in errs: print('ERROR', x)
        for x in warns: print('WARN ', x)
        print('OK' if not errs else f'{len(errs)} error(s)')
    sys.exit(1 if errs else 0)


if __name__ == '__main__':
    main()
