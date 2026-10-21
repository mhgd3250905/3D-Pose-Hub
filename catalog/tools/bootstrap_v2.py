#!/usr/bin/env python3
"""Explicit pilot draft migration. Refuses to overwrite existing authored packages."""
from pathlib import Path
from action_package_v2 import CAT, REPO, dependency_paths, read, write
import hashlib

IDS = ['w-dead-bug', 'h-chair-step-up', 'h-db-curl', 'glute-max-A', 's-frog', 'h-catcow-quad']
SKINS = ['realistic', 'tech-white', 'neon-night', 'neon-night-b', 'hologram']
PRIMARY = {
    'w-dead-bug': ('下背紧贴地面，对侧手脚慢慢伸远', 'Keep your lower back on the floor and slowly extend the opposite arm and leg'),
    'h-chair-step-up': ('整只脚踩稳椅面，用前腿发力站起', 'Plant your whole foot on the seat and stand up using the front leg'),
    'h-db-curl': ('大臂贴住身体，只动小臂', 'Keep your upper arms by your sides and move only your forearms'),
    'glute-max-A': ('一条腿抬起，用臀部把身体推高', 'One leg up, drive your hips up with your glutes'),
    's-frog': ('膝盖向两侧打开，脚尖朝外，臀部慢慢往后坐', 'Knees wide, toes out, sit your hips back slowly'),
    'h-catcow-quad': ('收腹拱背，缓慢抬胸，手脚保持稳定', 'Round your back, then gently lift your chest, keeping your hands and knees still'),
}
EDITORIAL = {
    'w-dead-bug': {
        'purpose': 'Practice trunk control while moving opposite limbs.',
        'cues': [('回程缓慢，回到起始位再换另一组手脚', 'Return slowly to the starting position before alternating limbs.'), ('保持呼吸，动作幅度以腰背稳定为限', 'Keep breathing and limit your reach to the range you can control.')],
        'errors': [('伸手伸腿时腰背明显拱起', 'Arching the lower back as the limbs extend.'), ('用甩动代替缓慢控制', 'Swinging the limbs instead of controlling the movement.')],
    },
    'h-chair-step-up': {
        'purpose': 'Train the legs and hips with a controlled step-up.',
        'cues': [('膝盖保持与脚尖同向，站起后再缓慢下降', 'Keep your knee aligned with your toes, then lower slowly.'), ('使用稳固、防滑、适合自己高度的支撑物', 'Use a stable, non-slip support at a height you can control.')],
        'errors': [('后脚猛蹬地面或借惯性冲起', 'Pushing hard with the trailing foot or using momentum.'), ('椅子晃动或脚掌只踩在边缘', 'Using an unstable chair or placing only part of the foot on its edge.')],
    },
    'h-db-curl': {
        'purpose': 'Train elbow flexion with alternating dumbbell curls.',
        'cues': [('左右交替弯举，下降时继续控制重量', 'Alternate arms and keep control of the weight as you lower it.'), ('身体保持稳定，手腕与前臂保持自然对齐', 'Keep your body steady and your wrists naturally aligned with your forearms.')],
        'errors': [('身体前后摆动带起哑铃', 'Rocking the body to lift the dumbbells.'), ('弯举时肘部大幅前移', 'Moving the elbows far forward during the curl.')],
    },
    'glute-max-A': {
        'purpose': 'Practice a single-leg hip bridge with a level pelvis.',
        'cues': [('左脚稳定支撑，保持骨盆朝向一致', 'Keep the left foot planted and the pelvis level.'), ('缓慢放回起始位，不用腰部猛顶', 'Lower slowly to the starting position without thrusting through the lower back.')],
        'errors': [('抬起时骨盆明显倾斜或旋转', 'Tilting or rotating the pelvis as you lift.'), ('借腰部过度后仰代替臀部发力', 'Overarching the lower back instead of driving through the hip.')],
    },
    's-frog': {
        'purpose': 'Explore a comfortable inner-thigh stretch in a wide-knee position.',
        'cues': [('缓慢移动，停在自己能控制的幅度', 'Move slowly and stop within a range you can control.'), ('保持呼吸，回程也要平稳', 'Keep breathing and return smoothly.')],
        'errors': [('强压髋部追求过大的幅度', 'Forcing the hips into an excessive range.'), ('出现不适仍弹震或继续加深', 'Bouncing or pushing deeper despite discomfort.')],
    },
    'h-catcow-quad': {
        'purpose': 'Practice gentle spinal movement from a stable quadruped position.',
        'cues': [('手掌与膝盖保持稳定支撑，慢慢活动脊柱', 'Keep your palms and knees stable as you gently move your spine.'), ('头颈跟随躯干自然活动，保持呼吸', 'Let your head and neck follow the torso naturally and keep breathing.')],
        'errors': [('动作过快或用力甩头', 'Moving too quickly or throwing the head.'), ('手脚不断移动，支撑位置失稳', 'Shifting the hands and knees and losing a stable base.')],
    },
}

def ref(path, lf=False):
    data = (REPO / path).read_bytes()
    value = {'root': 'repo', 'path': path, 'sha256': hashlib.sha256(data.replace(b'\r\n', b'\n') if lf else data).hexdigest(), 'bytes': len(data)}
    if lf:
        value['normalization'] = 'lf'
    return value

def bi(pair):
    return dict(zip(('zh', 'en'), pair))

def main():
    old = {d['id']: d for d in read(CAT / 'catalog.json')['drills']}
    production = read(REPO / 'drill-anim/models/current-production.json')
    registry = {'format': 'action-package-skins@2', 'aliases': {'tech-white-b': 'tech-white', 'default': 'realistic'}, 'skins': [{'id': skin, 'geometryVerification': 'pending', 'note': 'Do not assume material-only equivalence; measured runtime geometry and occlusion SHA are required before layer sharing.'} for skin in SKINS]}
    if not (CAT / 'v2/skins.json').exists():
        write(CAT / 'v2/skins.json', registry)
    for action in IDS:
        target = CAT / f'v2/actions/{action}.json'
        if target.exists():
            print(f'Skip existing authored package {action}')
            continue
        d = old[action]
        e = EDITORIAL[action]
        spec = f'drill-anim/specs/{action}-r{3 if action == "s-frog" else 2}.js'
        pending = {'status': 'pending', 'reviewer': None, 'reviewedAt': None, 'evidence': []}
        cues = [PRIMARY[action], *e['cues']]
        definition = {
            'idMappings': [], 'name': {**d['name'], **({'en': 'Frog Stretch'} if action == 's-frog' else {})},
            'purpose': {'zh': d['purpose'], 'en': e['purpose']},
            'tags': {'category': d['category'], 'activeMuscles': d['muscleGroups'], 'synergistMuscles': [], 'equipment': d['equipment'], 'position': d['position'], 'scenes': d['scenes'], 'difficulty': d['level'], 'trainingType': 'stretch' if d['category'] == 'stretch' else 'strength' if d['category'] == 'strength' else 'control'},
            'unilateral': action in ('glute-max-A', 'h-chair-step-up', 'h-db-curl'), 'startingSide': 'left' if action == 'glute-max-A' else 'right' if action in ('h-chair-step-up', 'h-db-curl') else None,
            'cues': [{'id': f'cue{index + 1}', 'text': bi(pair), 'primary': index == 0} for index, pair in enumerate(cues)],
            'commonErrors': [bi(pair) for pair in e['errors']],
            'cautions': {'items': [{'zh': item, 'en': {'腰': 'Lower back', '膝': 'Knees', '大腿内侧': 'Inner thighs'}.get(item, '')} for item in d['cautions']], 'review': pending},
            'contraindications': {'items': [], 'review': pending},
            'alternatives': [d['alternative']] if d.get('alternative') else [], 'regressions': [], 'progressions': [],
            'defaultDose': d['defaultDose'], 'doseRange': d['doseRange'],
            'rhythm': d.get('rhythm', {'kind': 'rep_cycle', 'leadSeconds': 0, 'phases': [{'id': 'cycle', 'seconds': 8}], 'source': 'pilot-editorial'}),
            'apps': d['apps'], 'editorialReview': pending,
            'editorialNotes': ['Migrated tags/dose from legacy catalog; bilingual cues/errors are editorial drafts pending review. Empty contraindications do not mean medically cleared.', 'Alternative/regression/progression coverage requires editorial review; [] is not an assertion of no possible alternatives.'],
        }
        if not definition['rhythm'].get('phases'):
            definition['rhythm']['phases'] = [{'id': 'hold', 'seconds': 8}]
        if definition['unilateral']:
            definition['countingSemantics'] = 'per-side-repetitions' if action == 'glute-max-A' else 'alternating-each-side-counts-as-one'
        if action == 'w-dead-bug':
            definition['movementSides'] = 'alternating-cross-body'
        timing = read(CAT / 'v2/timeline-semantics.json')['actions'][action]
        definition['rhythm'] = {'kind': timing['kind'], 'leadSeconds': 0, 'source': 'source-timeline', 'phases': [{'id': name, 'seconds': seconds} for name, seconds in timing['phases']]}
        definition['countingSemantics'] = timing['countingSemantics']
        if timing.get('movementSides'):
            definition['movementSides'] = timing['movementSides']
        source = {'model': {'id': production['modelProfile'], 'version': production['modelVersion'], 'manifest': ref('drill-anim/models/training-human-v2plus.json', True)}, 'spec': ref(spec, True), 'keyMoments': {}, 'highlightMuscles': d['muscleGroups'], 'qa': {key: {**pending, 'framesReviewed': []} for key in ('intersections', 'handsFeet', 'propFlicker', 'loopSeam')}}
        source['dependencies'] = [ref(path.relative_to(REPO).as_posix(), True) for path in dependency_paths(REPO / spec)]
        if action == 'glute-max-A':
            source.update({'demonstratedSide': 'left', 'oppositeSideMedia': 'not-produced'})
            source['keyMoments']['switchPoint'] = {'kind': 'loop-boundary', 'seconds': 8, 'semantics': 'The clip demonstrates only the left support side. At the end of the loop the App may cue the opposite side; no within-clip switch and no mirrored media are produced.'}
        elif action in ('h-chair-step-up', 'h-db-curl'):
            source['demonstratedSide'] = 'both'
            source['keyMoments']['switchPoint'] = {'kind': 'in-clip', 'seconds': 4, 'semantics': 'The first repetition uses the right side; the second repetition uses the left side. Each side repetition counts once; do not double the default dose.'}
        package = {'format': 'action-package@2', 'id': action, 'version': '2.0.0-draft.1', 'status': 'draft', 'definition': definition, 'source': source, 'masters': {'requiredSkins': SKINS, 'skins': {}, 'loopReview': pending}, 'derivatives': {'method': 'composite-from-masters', 'mirrored': False, 'variants': [], 'transparentCovers': {}}, 'voice': {'actionId': action}, 'validation': {'modelVersion': production['modelVersion'], 'mirrorGenerated': False, 'review': pending}}
        write(target, package)
    write(CAT / 'v2/pilot.json', {'format': 'action-package-pilot@2', 'actionIds': IDS, 'categories': dict(zip(IDS, ['supine', 'chair-prop', 'dumbbell', 'unilateral', 'wide-hip-range', 'hands-on-floor'])), 'storageRootAlias': 'media', 'historicalFormats': ['drill-pack@1', 'action-kit@1', 'flarelab-drill-media@1'], 'legacyCompleteNotReusable': True})

if __name__ == '__main__':
    main()
