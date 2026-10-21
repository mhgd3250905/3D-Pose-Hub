#!/usr/bin/env python3
"""Action-package v2 authoring, six-layer completeness, and release gate.

No v1 completeness flags are trusted. Drafts retain honest gaps. --release also
checks every referenced file and frame against SHA-256; unresolved roots fail.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys

CAT = Path(__file__).resolve().parents[1]
REPO = CAT.parent
LAYERS = ('definition', 'source', 'masters', 'derivatives', 'voice', 'validation')
QA = ('intersections', 'handsFeet', 'propFlicker', 'loopSeam')
SHA = re.compile(r'^[0-9a-f]{64}$')
SKINS = ['realistic', 'tech-white', 'neon-night', 'neon-night-b', 'hologram']
VOCABULARY = {f'n.{i}' for i in range(11)} | {'p.ready', 'p.go', 'p.last_rep', 'p.release', 'p.again', 'p.right_first', 'p.switch_left', 'p.switch_right', 'p.rest', 'p.nice', 'sec.5', 'sec.10', 'sec.15', 'sec.30', 'sec.60'}
PROFILES = {'zh': {'voice': 'zh-CN-XiaoxiaoNeural', 'rate': '+6%'}, 'en': {'voice': 'en-US-JennyNeural', 'rate': '+4%'}}
MEDIA_PROBES = {}

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def write(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

def nonempty(value):
    return isinstance(value, str) and bool(value.strip())

def bilingual(value):
    return isinstance(value, dict) and all(nonempty(value.get(lang)) for lang in ('zh', 'en'))

def relative_path(value):
    return (nonempty(value) and '\\' not in value and ':' not in value
            and not value.startswith('/') and '..' not in PurePosixPath(value).parts)

def dependency_paths(path):
    """Relative static module imports are part of the reproducible motion source."""
    seen = set()
    def visit(file):
        for imported in re.findall(r'import\s+(?:[^;]*?\s+from\s+)?[\'"](\.[^\'"]+)[\'"]', file.read_text(encoding='utf-8-sig')):
            child = (file.parent / imported).resolve()
            if child not in seen:
                if not child.is_relative_to(REPO) or not child.is_file():
                    raise ValueError('spec dependency outside repository or missing')
                seen.add(child)
                visit(child)
    visit(Path(path).resolve())
    return sorted(seen)

class Check:
    def __init__(self, package, registry, roots=None, check_files=False):
        self.p = package
        self.registry = registry
        self.roots = {'repo': REPO, **(roots or {})}
        self.check_files = check_files
        self.errors = {layer: [] for layer in LAYERS}
        self.seen_refs = set()
        self.probes = MEDIA_PROBES

    def need(self, layer, condition, message):
        if not condition:
            self.errors[layer].append(message)
        return bool(condition)

    def ref(self, layer, ref, label, prefix=None):
        if not self.need(layer, isinstance(ref, dict), f'{label}: reference missing'):
            return None
        ok = self.need(layer, ref.get('root') in ('repo', 'media'), f'{label}: root must be repo/media')
        ok &= self.need(layer, relative_path(ref.get('path')), f'{label}: relative POSIX path required')
        ok &= self.need(layer, bool(SHA.fullmatch(str(ref.get('sha256', '')))), f'{label}: SHA-256 required')
        ok &= self.need(layer, type(ref.get('bytes')) is int and ref['bytes'] > 0, f'{label}: positive bytes required')
        if prefix:
            ok &= self.need(layer, ref.get('root') == 'media' and str(ref.get('path', '')).startswith(prefix), f'{label}: must be under media:{prefix}')
        if not ok or not self.check_files:
            return None
        root = self.roots.get(ref['root'])
        if not self.need(layer, root is not None, f'{label}: unresolved root {ref["root"]}'):
            return None
        root = Path(root).resolve()
        path = (root / ref['path']).resolve()
        if not self.need(layer, path.is_relative_to(root) and path.is_file(), f'{label}: missing file or escaped root {ref["path"]}'):
            return None
        key = (str(path), ref['sha256'], ref['bytes'], ref.get('normalization'))
        if key not in self.seen_refs:
            data = path.read_bytes()
            self.need(layer, len(data) == ref['bytes'], f'{label}: byte count mismatch')
            if ref.get('normalization') == 'lf':
                data = data.replace(b'\r\n', b'\n')
            self.need(layer, hashlib.sha256(data).hexdigest() == ref['sha256'], f'{label}: SHA-256 mismatch')
            self.seen_refs.add(key)
        if path.suffix.lower() in ('.png', '.jpg', '.jpeg', '.mp4', '.m4a', '.wav'):
            self.probe_ref(layer, path, ref, label)
        return path

    def probe_ref(self, layer, path, metadata, label):
        """Decode actual media. Filename/declared metadata is never proof of format."""
        try:
            stat = path.stat()
            key = (str(path), stat.st_mtime_ns, stat.st_size)
            if key not in self.probes:
                if path.suffix.lower() in ('.png', '.jpg', '.jpeg'):
                    from PIL import Image, ImageChops
                    with Image.open(path) as image:
                        image.load()
                        info = {'width': image.width, 'height': image.height, 'alpha': 'A' in image.getbands(), 'format': image.format}
                        rgb = image.convert('RGB')
                        red, green, blue = rgb.split()
                        info['grayscale'] = ImageChops.difference(red, green).getextrema()[1] <= 1 and ImageChops.difference(red, blue).getextrema()[1] <= 1
                    self.probes[key] = info
                else:
                    process = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', str(path)], capture_output=True, text=True, timeout=60, check=True)
                    data = json.loads(process.stdout)
                    streams = data.get('streams', [])
                    info = next((x for x in streams if x.get('codec_type') == ('video' if path.suffix.lower() == '.mp4' else 'audio')), {})
                    info['durationSeconds'] = float(info.get('duration', data.get('format', {}).get('duration', 0)))
                    self.probes[key] = info
            info = self.probes[key]
            for field in ('width', 'height', 'channels'):
                if field in metadata:
                    self.need(layer, info.get(field) == metadata[field], f'{label}: actual {field} mismatch')
            if metadata.get('alpha') is True:
                self.need(layer, info.get('alpha') is True, f'{label}: actual alpha channel missing')
            if metadata.get('grayscale') is True:
                self.need(layer, info.get('grayscale') is True, f'{label}: actual mask is not grayscale')
            if path.suffix.lower() in ('.png', '.jpg', '.jpeg'):
                self.need(layer, info.get('format') == ('PNG' if path.suffix.lower() == '.png' else 'JPEG'), f'{label}: actual image format mismatch')
            if 'sampleRate' in metadata:
                self.need(layer, int(info.get('sample_rate', 0)) == metadata['sampleRate'], f'{label}: actual sampleRate mismatch')
            if 'codec' in metadata:
                self.need(layer, info.get('codec_name') == metadata['codec'], f'{label}: actual codec mismatch')
            if 'durationSeconds' in metadata:
                self.need(layer, abs(info.get('durationSeconds', 0) - metadata['durationSeconds']) <= 0.08, f'{label}: actual duration mismatch')
            frames = metadata.get('frameCount', metadata.get('frames'))
            if frames is not None:
                self.need(layer, int(info.get('nb_read_frames', info.get('nb_frames', 0))) == frames, f'{label}: actual frame count mismatch')
            if 'fps' in metadata:
                num, den = info.get('r_frame_rate', '0/1').split('/')
                self.need(layer, abs(float(num) / float(den) - metadata['fps']) < .001, f'{label}: actual fps mismatch')
        except (OSError, ValueError, ImportError, subprocess.SubprocessError, ZeroDivisionError) as error:
            self.need(layer, False, f'{label}: media decoding/probing failed ({type(error).__name__})')

    def review(self, layer, value, label):
        value = value if isinstance(value, dict) else {}
        self.need(layer, value.get('status') == 'pass', f'{label}: review has not passed')
        self.need(layer, nonempty(value.get('reviewer')) and nonempty(value.get('reviewedAt')), f'{label}: reviewer and reviewedAt required')
        evidence = value.get('evidence', [])
        self.need(layer, isinstance(evidence, list) and bool(evidence), f'{label}: review evidence required')
        for index, item in enumerate(evidence if isinstance(evidence, list) else []):
            self.ref(layer, item, f'{label}.evidence[{index}]')

    def qa_binding(self, review, check_name):
        """A QA pass must refer to the actual action, sources, skins and sequences."""
        if not self.check_files:
            return
        matched = False
        for reference in review.get('evidence', []):
            path = self.ref('source', reference, f'qa.{check_name}.binding')
            if not path or path.suffix.lower() != '.json':
                continue
            try:
                data = read(path)
                identity = (data.get('id') == self.p.get('id')
                            and data.get('specSha256') == self.p.get('source', {}).get('spec', {}).get('sha256')
                            and data.get('modelVersion') == self.p.get('source', {}).get('model', {}).get('version')
                            and data.get('skins') == SKINS)
                actual = data.get('checks', {}).get(check_name, {})
                frames = actual.get('framesReviewed', [])
                identity &= actual.get('status') == 'pass' and frames == review.get('framesReviewed')
                if check_name == 'loopSeam':
                    identity &= 0 in frames and 240 in frames
                sequence_shas = {(x.get('skin'), x.get('kind'), x.get('sha256')) for x in data.get('fullSequences', [])}
                expected = set()
                for skin, entry in self.p.get('masters', {}).get('skins', {}).items():
                    for kind in ('bodyProps', 'highlightMask', 'shadow'):
                        item = entry.get(kind, {})
                        if 'sequence' in item:
                            expected.add((skin, kind, item['sequence'].get('sha256')))
                identity &= bool(expected) and expected <= sequence_shas
                matched |= identity
            except (ValueError, TypeError, AttributeError):
                pass
        self.need('source', matched, f'qa.{check_name}: evidence must bind id/spec SHA/model version/five skins/actual reviewed frames/full sequence SHA; loop needs frames 0 and 240')

    def run(self):
        p = self.p
        self.need('masters', self.skin_ids() == SKINS, 'skin registry must equal the five canonical production skins; alternate registries cannot reduce release coverage')
        try:
            import jsonschema
            schema = read(CAT / 'action-package-v2.schema.json')
            for error in jsonschema.Draft202012Validator(schema).iter_errors(p):
                self.need('validation', False, f'schema.{".".join(map(str, error.absolute_path))}: {error.message}')
        except ImportError:
            # The semantic gate remains mandatory. Formal-schema validation must
            # also be available for a release; missing tooling never means pass.
            self.need('validation', not self.check_files, 'jsonschema is required for file-verified release validation')
        self.need('validation', p.get('format') == 'action-package@2', 'format must be action-package@2')
        self.need('validation', p.get('status') in ('draft', 'review', 'ready', 'published'), 'invalid lifecycle status')
        self.need('definition', bool(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', str(p.get('id', '')))), 'stable ID required')
        self.definition()
        self.source()
        self.masters()
        self.derivatives()
        self.voice()
        v = p.get('validation', {})
        self.need('validation', v.get('modelVersion') == p.get('source', {}).get('model', {}).get('version'), 'validation modelVersion must match source')
        manifestpath = self.ref('validation', v.get('manifest'), 'validation.manifest')
        if manifestpath:
            manifest = read(manifestpath)
            self.need('validation', manifest.get('format') == 'action-package-media-manifest@2' and manifest.get('id') == p.get('id') and manifest.get('modelVersion') == p.get('source', {}).get('model', {}).get('version'), 'media manifest format/id/modelVersion mismatch')
            assets = manifest.get('assets', [])
            self.need('validation', isinstance(assets, list) and bool(assets), 'media manifest must list assets')
            indexed = {}
            for index, entry in enumerate(assets if isinstance(assets, list) else []):
                self.ref('validation', entry, f'manifest.assets[{index}]')
                self.need('validation', entry.get('skin') in self.skin_ids() and entry.get('modelVersion') == manifest.get('modelVersion'), f'manifest.assets[{index}]: skin/modelVersion required')
                self.need('validation', type(entry.get('width')) is int and type(entry.get('height')) is int, f'manifest.assets[{index}]: dimensions required')
                indexed[(entry.get('root'), entry.get('path'))] = entry
            def refs(value):
                if isinstance(value, dict):
                    if value.get('root') == 'media' and 'sha256' in value:
                        yield value
                    else:
                        for child in value.values():
                            yield from refs(child)
                elif isinstance(value, list):
                    for child in value:
                        yield from refs(child)
            sequences = {skin: {kind: value.get(kind, {}) for kind in ('bodyProps', 'highlightMask', 'shadow')} for skin, value in p.get('masters', {}).get('skins', {}).items()}
            derivative_media = {key: value for key, value in p.get('derivatives', {}).items() if key not in ('provenance', 'compositor')}
            for reference in refs({'masters': sequences, 'derivatives': derivative_media}):
                entry = indexed.get((reference['root'], reference.get('path')), {})
                self.need('validation', entry.get('sha256') == reference.get('sha256') and entry.get('bytes') == reference.get('bytes'), f'media manifest missing/mismatched asset: {reference.get("path")}')
        self.review('validation', v.get('review'), 'validation.review')
        self.need('validation', v.get('mirrorGenerated') is False, 'mirrors must not be generated')
        # No local absolute paths or machine roots may enter portable packages.
        def walk(value, path=''):
            if isinstance(value, dict):
                for k, item in value.items():
                    walk(item, f'{path}.{k}')
            elif isinstance(value, list):
                for index, item in enumerate(value):
                    walk(item, f'{path}[{index}]')
            elif isinstance(value, str) and (re.match(r'^[A-Za-z]:[\\/]', value) or value.startswith(('\\\\', 'file://'))):
                self.need('validation', False, f'{path}: absolute machine path forbidden')
        walk(p)
        result = {k: {'complete': not self.errors[k], 'missing': self.errors[k]} for k in LAYERS}
        return {'id': p.get('id'), 'complete': all(v['complete'] for v in result.values()), 'layers': result}

    def definition(self):
        d = self.p.get('definition', {})
        self.review('definition', d.get('editorialReview'), 'editorialReview')
        for field in ('name', 'purpose'):
            self.need('definition', bilingual(d.get(field)), f'{field}: zh/en required')
        aliases = d.get('idMappings')
        self.need('definition', isinstance(aliases, list), 'idMappings must explicitly list renames or []')
        for item in aliases if isinstance(aliases, list) else []:
            self.need('definition', isinstance(item, dict) and nonempty(item.get('oldId')) and item.get('newId') == self.p['id'] and item['oldId'] != item['newId'], 'invalid oldId -> newId mapping')
        tags = d.get('tags', {})
        for field in ('category', 'position', 'difficulty', 'trainingType'):
            self.need('definition', nonempty(tags.get(field)) if field != 'difficulty' else type(tags.get(field)) is int and 1 <= tags['difficulty'] <= 5, f'tags.{field} required')
        self.need('definition', tags.get('trainingType') in ('strength', 'stretch', 'control'), 'trainingType must be strength/stretch/control')
        for field in ('activeMuscles', 'synergistMuscles', 'equipment', 'scenes'):
            val = tags.get(field)
            self.need('definition', isinstance(val, list) and all(nonempty(x) for x in val) and (bool(val) or field in ('synergistMuscles', 'equipment')), f'tags.{field} required')
        self.need('definition', type(d.get('unilateral')) is bool, 'unilateral must be explicit boolean')
        if d.get('unilateral'):
            self.need('definition', d.get('startingSide') in ('left', 'right'), 'unilateral startingSide required')
            self.need('definition', nonempty(d.get('countingSemantics')), 'unilateral countingSemantics required; unilateral does not imply doubling the dose')
        cues = d.get('cues', [])
        self.need('definition', isinstance(cues, list) and 3 <= len(cues) <= 5, '3-5 bilingual cues required')
        for cue in cues if isinstance(cues, list) else []:
            self.need('definition', isinstance(cue, dict) and bilingual(cue.get('text')) and type(cue.get('primary')) is bool and nonempty(cue.get('id')), 'each cue needs id, zh/en text, primary boolean')
        self.need('definition', any(isinstance(c, dict) and c.get('primary') is True for c in cues), 'mark at least one primary cue')
        mistakes = d.get('commonErrors', [])
        self.need('definition', isinstance(mistakes, list) and 2 <= len(mistakes) <= 3 and all(bilingual(x) for x in mistakes), '2-3 bilingual common errors required')
        for field in ('cautions', 'contraindications'):
            value = d.get(field, {})
            self.need('definition', isinstance(value, dict) and isinstance(value.get('items'), list) and all(bilingual(x) for x in value.get('items', [])), f'{field}: reviewed bilingual items or reviewed empty list required')
            self.review('definition', value.get('review'), f'{field}.review')
        for field in ('alternatives', 'regressions', 'progressions'):
            self.need('definition', isinstance(d.get(field), list) and all(nonempty(x) and x != self.p.get('id') for x in d[field]), f'{field}: explicit action ID list required')
        dose = d.get('defaultDose', {})
        mode = dose.get('mode')
        self.need('definition', mode in ('reps', 'time'), 'defaultDose.mode required')
        for field in ('sets', 'restSeconds', 'reps' if mode == 'reps' else 'seconds'):
            val = dose.get(field)
            limits = d.get('doseRange', {}).get(field)
            self.need('definition', type(val) in (int, float) and val >= (0 if field == 'restSeconds' else 1), f'defaultDose.{field} required')
            self.need('definition', isinstance(limits, list) and len(limits) == 2 and all(type(n) in (int, float) for n in limits) and limits[0] <= limits[1] and type(val) in (int, float) and limits[0] <= val <= limits[1], f'doseRange.{field} must contain default')
        rhythm = d.get('rhythm', {})
        self.need('definition', rhythm.get('kind') in ('rep_updown', 'rep_cycle', 'rep_alternate', 'rep_hold', 'rep_breath', 'hold', 'self_paced'), 'rhythm.kind required')
        self.need('definition', type(rhythm.get('leadSeconds')) in (int, float) and rhythm['leadSeconds'] >= 0, 'rhythm.leadSeconds required')
        phases = rhythm.get('phases', [])
        self.need('definition', isinstance(phases, list) and bool(phases), 'rhythm.phases must describe phase timing')
        for phase in phases if isinstance(phases, list) else []:
            self.need('definition', isinstance(phase, dict) and nonempty(phase.get('id')) and type(phase.get('seconds')) in (int, float) and phase['seconds'] > 0, 'phase id and positive seconds required')
        self.need('definition', isinstance(d.get('apps'), list) and bool(d['apps']) and all(x in ('hiplab', 'flarelab', 'smartfit') for x in d['apps']), 'App ownership required')

    def source(self):
        s = self.p.get('source', {})
        model = s.get('model', {})
        self.need('source', isinstance(s.get('spec'), dict) and s['spec'].get('root') == 'repo', 'production spec must live in the repository')
        self.need('source', isinstance(model.get('manifest'), dict) and model['manifest'].get('root') == 'repo', 'production model manifest must live in the repository')
        self.need('source', model.get('id') == 'training-human-v2plus', 'new production must use training-human-v2plus; v2 is deprecated')
        self.need('source', nonempty(model.get('version')), 'model version required')
        modelpath = self.ref('source', model.get('manifest'), 'model.manifest')
        specpath = self.ref('source', s.get('spec'), 'source.spec')
        if specpath:
            declared = {}
            for dependency in s.get('dependencies', []):
                file = self.ref('source', dependency, 'source.dependencies')
                if file:
                    declared[str(file)] = dependency
            try:
                required = dependency_paths(specpath)
                self.need('source', set(declared) == {str(file) for file in required}, 'source.dependencies must pin the complete resolved motion import closure')
            except (ValueError, OSError):
                self.need('source', False, 'invalid spec dependency graph')
            try:
                proc = subprocess.run(['node', '--input-type=module', '-e', 'const s=(await import(process.argv[1])).default; console.log(JSON.stringify({modelProfile:s.modelProfile,v2plus:s.v2plus}));', specpath.as_uri()], capture_output=True, text=True, timeout=30, check=True)
                resolved = json.loads(proc.stdout)
                self.need('source', resolved.get('modelProfile') == 'training-human-v2plus', 'resolved spec must bind training-human-v2plus')
            except (OSError, ValueError, subprocess.SubprocessError):
                self.need('source', False, 'cannot load actual spec model binding with Node')
        if modelpath:
            manifest = read(modelpath)
            self.need('source', manifest.get('id') == model.get('id') and manifest.get('version') == model.get('version'), 'model manifest identity mismatch')
            sources = manifest.get('sourceSha256', {})
            self.need('source', isinstance(sources, dict) and bool(sources), 'model manifest must pin runtime source SHA-256')
            for relative, digest in sources.items():
                file = REPO / relative
                self.need('source', relative_path(relative) and file.is_file(), f'model runtime source missing: {relative}')
                if relative_path(relative) and file.is_file():
                    self.need('source', hashlib.sha256(file.read_bytes().replace(b'\r\n', b'\n')).hexdigest() == digest, f'model runtime source SHA mismatch: {relative}')
        times = s.get('keyMoments', {})
        for name in ('start', 'peak', 'end'):
            value = times.get(name)
            self.need('source', type(value) in (int, float) and 0 <= value <= 8, f'keyMoments.{name}: seconds 0..8 required')
        if all(type(times.get(k)) in (int, float) for k in ('start', 'peak', 'end')):
            self.need('source', times['start'] <= times['peak'] <= times['end'], 'keyMoments out of order')
        if self.p.get('definition', {}).get('unilateral'):
            switch = times.get('switchPoint', {})
            self.need('source', switch.get('kind') in ('in-clip', 'loop-boundary'), 'unilateral switchPoint required')
            self.need('source', type(switch.get('seconds')) in (int, float) and 0 < switch['seconds'] <= 8 and nonempty(switch.get('semantics')), 'switchPoint seconds and semantics required')
            if switch.get('kind') == 'loop-boundary':
                self.need('source', switch.get('seconds') == 8 and s.get('demonstratedSide') in ('left', 'right'), 'single-side loop boundary requires demonstratedSide and second 8')
        groups = s.get('highlightMuscles')
        self.need('source', isinstance(groups, list) and bool(groups) and all(nonempty(x) for x in groups), 'highlightMuscles required')
        qa = s.get('qa', {})
        for item in QA:
            self.review('source', qa.get(item), f'qa.{item}')
            frames = qa.get(item, {}).get('framesReviewed', [])
            self.need('source', isinstance(frames, list) and bool(frames) and all(type(x) is int and 0 <= x <= 240 for x in frames), f'qa.{item}: actual frames reviewed required')
            if qa.get(item, {}).get('status') == 'pass':
                self.qa_binding(qa[item], item)

    def skin_ids(self):
        return [item['id'] for item in self.registry.get('skins', [])]

    def masters(self):
        m = self.p.get('masters', {})
        expected = self.skin_ids()
        self.need('masters', m.get('requiredSkins') == expected, 'requiredSkins must equal complete registry order')
        skins = m.get('skins', {})
        self.need('masters', set(skins) == set(expected), 'all registered skins required, no extra skins')
        for skin in expected:
            value = skins.get(skin, {})
            for field in ('geometrySha256', 'occlusionSha256'):
                self.need('masters', bool(SHA.fullmatch(str(value.get(field, '')))), f'{skin}.{field}: measured SHA required')
            measurement = self.ref('masters', value.get('measurement'), f'{skin}.measurement')
            if measurement:
                record = read(measurement)
                self.need('masters', record.get('format') == 'pose-hub-layer-render@2' and record.get('actionId') == self.p.get('id') and record.get('skin') == skin and record.get('complete') is True and record.get('geometrySha256') == value.get('geometrySha256') and record.get('occlusionSha256') == value.get('occlusionSha256'), f'{skin}: measurement record does not bind actual geometry/occlusion/action/skin')
                measured_model = record.get('model', {})
                self.need('masters', record.get('spec', {}).get('sha256') == self.p.get('source', {}).get('spec', {}).get('sha256') and measured_model.get('version', measured_model.get('modelVersion')) == self.p.get('source', {}).get('model', {}).get('version') and measured_model.get('id', measured_model.get('modelProfile')) == self.p.get('source', {}).get('model', {}).get('id'), f'{skin}: measurement source/model binding mismatch')
            for name in ('bodyProps', 'highlightMask', 'shadow'):
                layer = value.get(name, {})
                if 'sharedFrom' in layer:
                    other = layer['sharedFrom']
                    source = skins.get(other, {})
                    allowed = name != 'bodyProps' and other in expected and other != skin
                    allowed &= all(SHA.fullmatch(str(value.get(k, ''))) and value.get(k) == source.get(k) for k in ('geometrySha256', 'occlusionSha256'))
                    allowed &= isinstance(source.get(name), dict) and 'sharedFrom' not in source[name]
                    self.need('masters', allowed, f'{skin}.{name}: sharing needs measured identical geometry and occlusion, one direct source')
                    continue
                self.need('masters', layer.get('width') == 1080 and layer.get('height') == 1080 and layer.get('frameCount') == 240 and layer.get('fps') == 30 and layer.get('durationSeconds') == 8, f'{skin}.{name}: requires 1080 square / 240 frames / 30fps / 8s')
                self.need('masters', layer.get('alpha') is True, f'{skin}.{name}: alpha required')
                if name == 'highlightMask':
                    self.need('masters', layer.get('grayscale') is True and layer.get('occlusionAware') is True, f'{skin}.{name}: grayscale and occlusionAware required')
                seqpath = self.ref('masters', layer.get('sequence'), f'{skin}.{name}.sequence', f'masters/{skin}/{self.p.get("id")}/')
                if seqpath:
                    try:
                        frames = read(seqpath).get('frames', [])
                        self.need('masters', len(frames) == 240, f'{skin}.{name}: sequence must contain 240 frame refs')
                        self.need('masters', len({r.get('path') for r in frames}) == 240, f'{skin}.{name}: frame paths must be unique')
                        for index, ref in enumerate(frames):
                            framepath = self.ref('masters', ref, f'{skin}.{name}.frame[{index}]', f'masters/{skin}/{self.p.get("id")}/')
                            self.need('masters', ref.get('frame') == index, f'{skin}.{name}: frame index/order mismatch at {index}')
                            if framepath:
                                self.probe_ref('masters', framepath, {'width': 1080, 'height': 1080, 'alpha': True, 'grayscale': name == 'highlightMask'}, f'{skin}.{name}.frame[{index}]')
                    except (ValueError, AttributeError, TypeError):
                        self.need('masters', False, f'{skin}.{name}: invalid sequence manifest')
        self.review('masters', m.get('loopReview'), 'masters.loopReview')

    def derivatives(self):
        d = self.p.get('derivatives', {})
        self.need('derivatives', d.get('method') == 'composite-from-masters', 'derivatives must composite masters without rerendering')
        self.need('derivatives', d.get('mirrored') is False, 'mirrored derivatives forbidden')
        self.ref('derivatives', d.get('compositor'), 'derivatives.compositor')
        if d.get('provenance', {}).get('framing'):
            self.ref('derivatives', d['provenance']['framing'], 'derivatives.provenance.framing')
        self.need('derivatives', nonempty(d.get('framingId')), 'one framingId required for thumbnails/keyframes')
        variants = d.get('variants', [])
        keys = []
        for var in variants if isinstance(variants, list) else []:
            key = (var.get('skin'), var.get('theme'))
            keys.append(key)
            label = '/'.join(map(str, key))
            self.need('derivatives', var.get('modelVersion') == self.p.get('source', {}).get('model', {}).get('version'), f'{label}: modelVersion mismatch')
            hl = var.get('highlight', {})
            self.need('derivatives', type(hl.get('enabled')) is bool and bool(re.fullmatch(r'#[0-9A-Fa-f]{6}', str(hl.get('color', '')))) and type(hl.get('brightness')) in (float, int) and 0 <= hl['brightness'] <= 2, f'{label}: highlight enabled/color/brightness required')
            for field in ('video', 'cover', 'thumbnail'):
                ref = var.get(field)
                self.ref('derivatives', ref, f'{label}.{field}')
                self.need('derivatives', isinstance(ref, dict) and type(ref.get('width')) is int and type(ref.get('height')) is int, f'{label}.{field}: dimensions required')
            video = var.get('video', {})
            self.need('derivatives', video.get('width') == 720 and video.get('height') == 720 and video.get('codec') == 'h264' and video.get('durationSeconds') == 8 and video.get('frameCount', video.get('frames')) == 240, f'{label}: video must be 720 H.264 / 8s / 240 frames')
            keyframes = var.get('keyframes', [])
            self.need('derivatives', isinstance(keyframes, list) and len(keyframes) == 3 and {x.get('phase') for x in keyframes} == {'start', 'peak', 'end'}, f'{label}: three start/peak/end keyframes required')
            for frame in keyframes if isinstance(keyframes, list) else []:
                self.ref('derivatives', frame.get('asset'), f'{label}.keyframe.{frame.get("phase")}')
        expected = {(skin, theme) for skin in self.skin_ids() for theme in ('light', 'dark')}
        self.need('derivatives', set(keys) == expected and len(keys) == len(expected), 'each skin x light/dark required exactly once; highlight remains a compositor parameter')
        for skin in self.skin_ids():
            ref = d.get('transparentCovers', {}).get(skin)
            self.ref('derivatives', ref, f'{skin}.transparentCover')
            self.need('derivatives', isinstance(ref, dict) and ref.get('alpha') is True, f'{skin}: transparent cover alpha required')

    def voice(self):
        v = self.p.get('voice', {})
        self.need('voice', v.get('actionId') == self.p.get('id'), 'voice.actionId must match package')
        manifest = self.ref('voice', v.get('manifest'), 'voice.manifest')
        if not manifest:
            self.need('voice', False, 'voice manifest contents require --check-files or --release')
            return
        data = read(manifest)
        self.need('voice', data.get('schema') == 'pose-hub-voice@2' or data.get('format') == 'pose-hub-voice@2', 'voice manifest schema mismatch')
        self.need('voice', data.get('contentReview') == 'passed' and data.get('manualListening') == 'passed', 'voice content review and manual listening must pass')
        standard = data.get('auditStandard', {})
        self.need('voice', standard.get('lufsTarget') == -16 and standard.get('lufsTolerance') == 1 and standard.get('truePeakMaxDbtp') == -1 and standard.get('codec') == 'aac' and standard.get('sampleRate') == 44100 and standard.get('channels') == 1, 'voice must use pinned HipLab loudness/codec standard')
        vocab = data.get('sharedVocabulary', {})
        self.need('voice', vocab.get('status') == 'passed', 'shared vocabulary incomplete')
        action = data.get('actions', {}).get(self.p.get('id'), {})
        primary = next((c.get('text') for c in self.p.get('definition', {}).get('cues', []) if c.get('primary')), {})
        for lang in ('zh', 'en'):
            profile = data.get('voiceProfile', {}).get(lang, {})
            self.need('voice', profile == PROFILES[lang], f'{lang}: pinned HipLab voice/rate required')
            lines = action.get('lines', {}).get(lang, {})
            self.need('voice', {'name', 'primaryCue', 'phase.start', 'phase.peak', 'phase.end'} <= set(lines), f'{lang}: name, primaryCue, phase.start/peak/end required')
            self.need('voice', lines.get('primaryCue', {}).get('text') == primary.get(lang), f'{lang}: primaryCue differs from definition')
            self.need('voice', lines.get('name', {}).get('text', '').casefold() == self.p.get('definition', {}).get('name', {}).get(lang, '').casefold(), f'{lang}: voice name differs from definition')
            shared = vocab.get('lines', {}).get(lang, {})
            self.need('voice', VOCABULARY <= set(shared), f'{lang}: complete shared vocabulary entries required')
            for line_id, line in {**{f'shared.{key}': val for key, val in shared.items()}, **lines}.items():
                label = f'{lang}.{line_id}'
                self.need('voice', nonempty(line.get('text')) and line.get('status') == 'passed', f'{label}: text/audio status must pass')
                ref = line.get('ref')
                self.ref('voice', ref, label)
                self.need('voice', isinstance(ref, dict) and type(ref.get('durationSeconds')) in (int, float) and ref['durationSeconds'] > 0, f'{label}: measured audio duration required')
                audit = line.get('audit', {})
                self.need('voice', audit.get('fails') == [] and type(audit.get('lufs')) in (int, float) and -17 <= audit['lufs'] <= -15 and type(audit.get('true_peak')) in (int, float) and audit['true_peak'] <= -1, f'{label}: measured loudness/peak audit must pass')
                imported_original = line.get('provenance', {}).get('kind') == 'imported' and isinstance(ref, dict) and line.get('provenance', {}).get('sourceSha256') == ref.get('sha256')
                self.need('voice', audit.get('rawComparison') is True or imported_original, f'{label}: raw-source comparison or byte-identical HipLab original provenance required')

def validate(package, registry, roots=None, check_files=False):
    return Check(package, registry, roots, check_files).run()

def packages(directory):
    return [read(path) for path in sorted(Path(directory).glob('*.json'))]

def generate(items, results, output):
    output = Path(output)
    lines = ['# Action library v2', '', 'Generated from catalog/v2/actions. Completeness is computed across six layers; v1 flags are ignored.', '', '| ID | Name | Release eligible | Missing |', '|---|---|---|---|']
    for p, result in zip(items, results):
        name = p.get('definition', {}).get('name', {})
        missing = [f'{layer}: {message}' for layer, value in result['layers'].items() for message in value['missing']]
        lines.append(f'| [{p["id"]}]({p["id"]}.md) | {name.get("zh", "")} / {name.get("en", "")} | {result["complete"]} | {len(missing)} |')
        detail = [f'# {name.get("zh", p["id"])} / {name.get("en", "pending")}', '', f'ID: `{p["id"]}`. State: {p.get("status")}. Release eligible: {result["complete"]}.', '', '## Definition', '', '```json', json.dumps(p.get('definition', {}), ensure_ascii=False, indent=2), '```', '', '## Six-layer completeness', '']
        for layer, value in result['layers'].items():
            detail += [f'### {layer}: {"complete" if value["complete"] else "incomplete"}', ''] + [f'- {message}' for message in value['missing']] + ['']
        detail += ['## Source and production metadata', '', '```json', json.dumps({k: p.get(k) for k in LAYERS[1:]}, ensure_ascii=False, indent=2), '```', '']
        output.mkdir(parents=True, exist_ok=True)
        (output / f'{p["id"]}.md').write_text('\n'.join(detail), encoding='utf-8')
    (output / 'index.md').write_text('\n'.join(lines) + '\n', encoding='utf-8')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('validate', 'report', 'generate', 'release'))
    parser.add_argument('--actions', type=Path, default=CAT / 'v2/actions')
    parser.add_argument('--skins', type=Path, default=CAT / 'v2/skins.json')
    parser.add_argument('--media-root', action='append', default=[], metavar='media=PATH')
    parser.add_argument('--release', action='store_true', help='strict gate; implies all file/hash checks')
    parser.add_argument('--check-files', action='store_true')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    roots = {}
    for item in args.media_root:
        name, path = item.split('=', 1)
        if name != 'media':
            parser.error('--media-root only accepts media=PATH; repo is fixed')
        roots[name] = Path(path)
    try:
        items = packages(args.actions)
        registry = read(args.skins)
        strict = args.release or args.command == 'release'
        results = [validate(p, registry, roots, strict or args.check_files) for p in items]
        ids = [p['id'] for p in items]
        if not items or len(ids) != len(set(ids)):
            raise ValueError('empty action set or duplicate IDs')
        if args.command == 'generate':
            generate(items, results, args.output or CAT / 'action-library')
        if args.command == 'release':
            if not all(x['complete'] for x in results):
                print('Release blocked: every layer of every selected action must be complete.', file=sys.stderr)
            elif args.output:
                write(args.output, {'format': 'action-library-release@2', 'skins': registry['skins'], 'actions': items})
        report = {'format': 'action-package-completeness@2', 'complete': sum(x['complete'] for x in results), 'total': len(results), 'actions': results}
        if args.command == 'report' and args.output:
            write(args.output, report)
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return int(strict and not all(x['complete'] for x in results))
    except (ValueError, TypeError, AttributeError, KeyError, OSError) as error:
        print(f'Invalid action package: {error}', file=sys.stderr)
        return 1

if __name__ == '__main__':
    sys.exit(main())
