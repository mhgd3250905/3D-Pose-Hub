"""Hub-specific CPU regressions. No browser, GPU, actual batch or repo lock.

Run: python drill-anim/tools/hd/test_render_hub.py -v
All writable inputs and outputs, including real cross-process slot locks, are
under TemporaryDirectory. Git is mocked; one Node test imports a real overlay.
"""
from contextlib import contextmanager, redirect_stdout
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import queue
import shutil
import subprocess
import sys
import tempfile
import threading
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from PIL import Image


HERE = Path(__file__).resolve().parent


def module_from_file(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


class HubCpuTest(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix='pose-hub-cpu-')
        self.addCleanup(temporary.cleanup)
        self.directory = Path(temporary.name).resolve()
        self.repo = self.directory/'fake hub repo'
        self.root = self.repo/'drill-anim'
        self.tools = self.repo/'drill-anim/tools/hd'
        self.output = self.directory/'isolated batch'
        # Both specs and overlays are ESM, including on Node versions without
        # automatic module-syntax detection. Spaces exercise file-URI encoding.
        (self.directory/'package.json').write_text('{"type":"module"}\n', encoding='utf8')
        for folder in ('specs','themes','lib','page','assets','models','tools/hd'):
            (self.root/folder).mkdir(parents=True, exist_ok=True)
        self.ids = ['unlisted-hub-move','short-move','other-move']
        for sid in self.ids:
            (self.root/'specs'/f'{sid}.js').write_text(
                'export default '+json.dumps({'id':sid,'fps':15,
                    'timeline':{'duration':0.05,'tracks':{'move':[[0,0],[0.05,1]]}},
                    'pose':{'base':{'original':True}},'stillAt':90,'keyFrames':[10,90]})+';\n',
                encoding='utf8')
        self.theme = self.root/'themes/glow-soft.json'
        self.theme.write_text('{"fixture":true}\n', encoding='utf8')
        for relative in ('drill.py','lib/math.mjs','page/view.js','assets/grip.json'):
            (self.root/relative).write_text('fixture\n', encoding='utf8')
        (self.root/'config.json').write_text('{}\n', encoding='utf8')
        self.model_asset = self.repo/'runtime/public/model.bin'
        self.model_asset.parent.mkdir(parents=True)
        self.model_asset.write_bytes(b'fixture model')
        (self.root/'models/training-human-v2.json').write_text(json.dumps({
            'id':'training-human-v2','version':'2.0.1',
            'sourceSha256':{'runtime/public/model.bin':hashlib.sha256(self.model_asset.read_bytes()).hexdigest()}
        }), encoding='utf8')
        # Existing fixture expectations explicitly opt into the legacy model;
        # the production-default regression below supplies the real v2plus recipe.
        self.production=self.root/'models/current-production.json'
        self.production.write_text(json.dumps({'format':'pose-hub-production-model','formatVersion':1,
            'modelProfile':'training-human-v2','modelVersion':'2.0.1','alignClavicles':False}),encoding='utf8')
        (self.tools/'producer.py').write_text('# fixture producer\n', encoding='utf8')
        (self.tools/'gpu_probe.mjs').write_text('// fixture probe\n', encoding='utf8')
        self.renderer = module_from_file('hub_renderer_test', HERE/'render_batch.py')
        for name,value in [('REPO',self.repo),('ROOT',self.root),('HERE',self.tools)]:
            patcher=patch.object(self.renderer,name,value)
            patcher.start();self.addCleanup(patcher.stop)

    def args(self, **changes):
        values=dict(output=self.output,app=None,ids=self.ids,spec_overrides=None,
            theme='themes/glow-soft.json',pr=2,format='green',stage='prepare',
            port=18859,frames=None,reviewed=False)
        values.update(changes)
        return SimpleNamespace(**values)

    @contextmanager
    def no_production_processes(self):
        with (patch.object(self.renderer.subprocess,'check_output',return_value='1'*40+'\n') as git,
              patch.object(self.renderer.subprocess,'run',side_effect=AssertionError('Unexpected external command')),
              patch.object(self.renderer.subprocess,'Popen',side_effect=AssertionError('Unexpected production process'))):
            yield git

    def prepare(self, **changes):
        with self.no_production_processes() as git:
            result=self.renderer.prepare(self.args(**changes))
            git.assert_called_once_with(['git','rev-parse','HEAD'],cwd=self.repo,text=True)
            return result

    def snapshot(self):
        return {p.relative_to(self.output).as_posix():p.read_bytes()
                for p in self.output.rglob('*') if p.is_file()}

    def revision(self):
        p=self.root/'specs/unlisted-hub-move-r2.js'
        p.write_text("export default {id:'unlisted-hub-move-r2',fps:15,timeline:{duration:8},pose:{fixed:true}};\n",encoding='utf8')
        mapping=self.directory/'revisions.json'
        mapping.write_text(json.dumps({'unlisted-hub-move':p.relative_to(self.repo).as_posix()}),encoding='utf8')
        return p,mapping

    def v2plus_production(self):
        self.v2plus_options={'outfit':'compression','torso':'base','limbs':'base','hands':'base','skin':'realistic'}
        sources=['lib/human-v2plus.mjs','page/human-v2plus.js','page/human-v2plus-regions.js']
        sources+=['models/training-human-v2plus-'+name+'.json' for name in
            ('hands','outfit','torso-base','limbs-base','hands-base','head-base','regions')]
        self.v2plus_inputs=[]
        hashes={}
        for relative in sources:
            path=self.root/relative;path.write_text('{}\n' if path.suffix=='.json' else '// new runtime\n',encoding='utf8')
            self.v2plus_inputs.append(path);hashes[path.relative_to(self.repo).as_posix()]=self.renderer.sha(path)
        model=self.root/'models/training-human-v2plus.json'
        model.write_text(json.dumps({'id':'training-human-v2plus','version':'1.0.0-rc2','sourceSha256':hashes}),encoding='utf8')
        self.production.write_text(json.dumps({'format':'pose-hub-production-model','formatVersion':1,
            'modelProfile':'training-human-v2plus','modelVersion':'1.0.0-rc2','alignClavicles':False,
            'v2plus':self.v2plus_options}),encoding='utf8')
        return model

    @unittest.skipUnless(shutil.which('node'),'Node is required for the real ESM import regression')
    def test_current_production_default_imports_full_v2plus_options_without_changing_motion(self):
        model=self.v2plus_production();source=self.root/'specs/short-move.js';source_bytes=source.read_bytes()
        manifest,_,_,_=self.prepare(ids=['short-move'])
        self.assertEqual(manifest['profile'],'training-human-v2plus')
        self.assertEqual(manifest['model_version'],'1.0.0-rc2')
        self.assertEqual(manifest['profile_options'],{'alignClavicles':False,'v2plus':self.v2plus_options})
        self.assertEqual(manifest['production_config'],{'path':'drill-anim/models/current-production.json',
            'sha256':self.renderer.sha(self.production)})
        for path in [model,self.production,self.model_asset,*self.v2plus_inputs]:
            self.assertEqual(manifest['render_inputs'][path.relative_to(self.repo).as_posix()],self.renderer.sha(path))
        overlay=self.output/'specs/short-move.js'
        environment=dict(os.environ);environment.pop('NODE_COMPILE_CACHE',None)
        run=subprocess.run(['node','--input-type=module','-e',
            'const a=await import(process.argv[1]),b=await import(process.argv[2]);console.log(JSON.stringify([a.default,b.default]));',
            overlay.as_uri(),source.as_uri()],cwd=self.directory,env=environment,capture_output=True,text=True,
            encoding='utf8',timeout=20,check=True)
        value,original=json.loads(run.stdout)
        self.assertEqual(value,{**original,'id':'short-move','fps':30,'size':1080,
            'modelProfile':'training-human-v2plus','alignClavicles':False,'v2plus':self.v2plus_options})
        self.assertEqual(source.read_bytes(),source_bytes)

    def test_v2plus_semantically_equivalent_reordered_manifest_keeps_exact_bytes(self):
        self.v2plus_production();manifest,_,_,_=self.prepare()
        # Sorting the stored JSON reorders nested v2plus keys; this must not
        # regenerate a byte-different overlay or rewrite the saved manifest.
        path=self.output/'source-manifest.json'
        path.write_text(' \n'+json.dumps(manifest,sort_keys=True,indent=1)+'\n',encoding='utf8',newline='\n')
        before=self.snapshot();self.prepare(ids=['short-move'])
        self.assertEqual(self.snapshot(),before)

    def test_v2plus_model_data_manifest_and_production_changes_reject_without_mutation(self):
        model=self.v2plus_production();self.prepare();before=self.snapshot()
        for path in [model,self.production,*[p for p in self.v2plus_inputs if p.suffix=='.json']]:
            with self.subTest(changed=path.name):
                original=path.read_bytes();path.write_bytes(original+b' ')
                try:
                    with self.assertRaisesRegex(RuntimeError,'Batch source/recipe changed'):
                        self.prepare(ids=['short-move'])
                    self.assertEqual(self.snapshot(),before)
                finally:path.write_bytes(original)

    def test_legacy_manifest_without_profile_options_keeps_exact_overlay_bytes(self):
        manifest,_,_,_=self.prepare()
        for key in ('profile_options','model_version','production_config'):manifest.pop(key)
        self.renderer.write_json(self.output/'source-manifest.json',manifest)
        for sid in self.ids:
            source=self.root/'specs'/(sid+'.js')
            old=('// Pose-Hub HD: preserve source pose/camera/timing; explicit canonical ID.\n'
                'import source from '+json.dumps(source.as_uri())+';\n'
                'export default {...source,id:'+json.dumps(sid)+
                ",fps:30,size:1080,modelProfile:'training-human-v2',alignClavicles:false};\n")
            (self.output/'specs'/(sid+'.js')).write_text(old,encoding='utf8',newline='\n')
        before=self.snapshot();resumed,_,_,_=self.prepare(ids=['short-move'])
        self.assertEqual(resumed,manifest);self.assertEqual(self.snapshot(),before)
        # A new production default and its inputs cannot rebind an old batch.
        self.v2plus_production()
        with self.assertRaisesRegex(RuntimeError,'original frozen checkout/tools'):
            self.prepare(ids=['short-move'])
        self.assertEqual(self.snapshot(),before)
        self.assertNotIn('training-human-v2plus',(self.output/'specs/short-move.js').read_text(encoding='utf8'))

    def test_invalid_new_production_version_is_rejected_before_creating_batch(self):
        self.v2plus_production();config=json.loads(self.production.read_text(encoding='utf8'))
        config['modelVersion']='not-the-manifest-version'
        self.production.write_text(json.dumps(config),encoding='utf8')
        with self.assertRaisesRegex(ValueError,'does not match its model manifest'):self.prepare()
        self.assertFalse(self.output.exists())

    def test_any_registered_hub_ids_prepare_without_an_app_and_subset_keeps_registry(self):
        manifest,drills,_,_=self.prepare()
        self.assertEqual(list(drills),self.ids)
        self.assertEqual([x['id'] for x in manifest['drills']],self.ids)
        self.assertTrue(all(x['original_app_status'] is None for x in manifest['drills']))
        before=self.snapshot()
        manifest2,drills2,_,_=self.prepare(ids=['short-move'])
        self.assertEqual(list(drills2),self.ids)
        self.assertEqual(manifest2,manifest)
        self.assertEqual(self.snapshot(),before)
        self.assertTrue((self.output/'references/unlisted-hub-move.png').is_file())

    @unittest.skipUnless(shutil.which('node'),'Node is required for the real ESM import regression')
    def test_revision_overlay_really_imports_and_restores_canonical_id_in_node(self):
        revision,mapping=self.revision()
        before=revision.read_bytes()
        manifest,_,_,_=self.prepare(ids=None,spec_overrides=mapping)
        overlay=self.output/'specs/unlisted-hub-move.js'
        environment=dict(os.environ)
        environment.pop('NODE_COMPILE_CACHE',None)
        run=subprocess.run(['node','--input-type=module','-e',
            'const m=await import(process.argv[1]);console.log(JSON.stringify(m.default));',overlay.as_uri()],
            cwd=self.directory,env=environment,capture_output=True,text=True,encoding='utf8',timeout=20,check=True)
        value=json.loads(run.stdout)
        self.assertEqual(value,{'id':'unlisted-hub-move','fps':30,'timeline':{'duration':8},
            'pose':{'fixed':True},'size':1080,'modelProfile':'training-human-v2','alignClavicles':False})
        self.assertEqual(revision.read_bytes(),before)
        self.assertTrue(manifest['drills'][0]['revision'])
        self.assertEqual(manifest['drills'][0]['base_source'],str((self.root/'specs/unlisted-hub-move.js').relative_to(self.repo)))

    def test_theme_runtime_model_and_tool_changes_reject_without_output_mutation(self):
        self.prepare();before=self.snapshot()
        inputs=[self.theme,self.root/'drill.py',self.root/'lib/math.mjs',self.root/'page/view.js',
            self.root/'assets/grip.json',self.root/'models/training-human-v2.json',self.model_asset,
            self.tools/'producer.py',self.tools/'gpu_probe.mjs']
        for path in inputs:
            with self.subTest(input=path.relative_to(self.repo).as_posix()):
                original=path.read_bytes()
                # Append whitespace: valid JSON stays valid, while its identity
                # changes. This tests byte bindings rather than parsing errors.
                path.write_bytes(original+b' ')
                try:
                    with self.assertRaisesRegex(RuntimeError,'Batch source/recipe changed'):
                        self.prepare(ids=['short-move'])
                    self.assertEqual(self.snapshot(),before)
                finally:path.write_bytes(original)

    def test_removed_runtime_input_rejects_but_python_caches_and_test_files_do_not(self):
        self.prepare();before=self.snapshot();p=self.root/'page/view.js';original=p.read_bytes();p.unlink()
        try:
            with self.assertRaisesRegex(RuntimeError,'Batch source/recipe changed'):self.prepare()
            self.assertEqual(self.snapshot(),before)
        finally:p.write_bytes(original)
        cache=self.root/'lib/__pycache__';cache.mkdir();(cache/'cache.pyc').write_bytes(b'not a producer input')
        (self.tools/'test_added.py').write_text('# not a producer input\n',encoding='utf8')
        self.prepare(ids=['other-move'])
        self.assertEqual(self.snapshot(),before)

    def assert_transitive_spec_change_is_frozen(self, dependency_name):
        sid='unlisted-hub-move'
        dependency=self.root/'specs'/dependency_name
        dependency.write_text(
            "export default {id:'base-only',fps:15,timeline:{duration:8},pose:{height:1}};\n",
            encoding='utf8')
        selected=self.root/'specs'/f'{sid}.js'
        selected.write_text(
            f"import base from './{dependency_name}';\n"
            f"export default {{...base,id:'{sid}'}};\n",encoding='utf8')
        selected_bytes=selected.read_bytes()
        manifest,_,_,_=self.prepare(ids=[sid])
        self.assertEqual([x['id'] for x in manifest['drills']],[sid])
        self.assertNotEqual(dependency.stem,sid)
        before=self.snapshot()
        dependency.write_text(
            "export default {id:'base-only',fps:15,timeline:{duration:8},pose:{height:2}};\n",
            encoding='utf8')
        self.assertEqual(selected.read_bytes(),selected_bytes)
        with self.assertRaisesRegex(RuntimeError,'Batch source/recipe changed'):
            self.prepare(ids=[sid])
        # A changed imported module must not silently rebind an unchanged
        # selected wrapper, or rewrite any manifest/overlay/reference bytes.
        self.assertEqual(self.snapshot(),before)
        self.assertEqual(selected.read_bytes(),selected_bytes)

    def test_changed_imported_shared_mjs_rejects_unchanged_selected_wrapper(self):
        self.assert_transitive_spec_change_is_frozen('_shared.mjs')

    def test_changed_imported_base_js_rejects_unchanged_selected_wrapper(self):
        self.assert_transitive_spec_change_is_frozen('base-only.js')

    def test_unsafe_ids_and_missing_canonical_specs_are_rejected_before_writes(self):
        for ids in [[],None,['../escape'],['a/b'],['a\\b'],['bad id'],[''],['x\n'],
                    ['unlisted-hub-move','unlisted-hub-move'],['not-registered']]:
            with self.subTest(ids=ids):
                with self.assertRaises(ValueError):self.prepare(ids=ids)
                self.assertFalse(self.output.exists())

    def test_revision_paths_outside_specs_non_js_and_missing_files_are_rejected(self):
        self.prepare();before=self.snapshot()
        outside=self.directory/'outside.js';outside.write_text('export default {};',encoding='utf8')
        wrong=self.root/'specs/wrong.py';wrong.write_text('# wrong extension',encoding='utf8')
        directory=self.root/'specs/directory.js';directory.mkdir()
        inside_wrong=self.repo/'not-spec.js';inside_wrong.write_text('export default {};',encoding='utf8')
        mapping=self.directory/'invalid-revisions.json'
        for value in [outside.as_posix(),'../outside.js',inside_wrong.as_posix(),
                      wrong.relative_to(self.repo).as_posix(),directory.relative_to(self.repo).as_posix(),
                      'drill-anim/specs/missing.js',123]:
            with self.subTest(path=value):
                mapping.write_text(json.dumps({'unlisted-hub-move':value}),encoding='utf8')
                with self.assertRaises(ValueError):self.prepare(ids=None,spec_overrides=mapping)
                self.assertEqual(self.snapshot(),before)

    def test_output_source_and_ancestor_protection_has_no_side_effects(self):
        before={p.relative_to(self.directory).as_posix():p.read_bytes()
                for p in self.directory.rglob('*') if p.is_file()}
        for output in [self.directory,self.repo,self.root,self.root/'specs/new-batch',self.repo/'runtime/out']:
            with self.subTest(output=output):
                with self.assertRaisesRegex(ValueError,'Batch output'):
                    self.prepare(output=output)
        after={p.relative_to(self.directory).as_posix():p.read_bytes()
               for p in self.directory.rglob('*') if p.is_file()}
        self.assertEqual(after,before)
        self.assertEqual(self.renderer.protected_output(self.repo/'output/new'),(self.repo/'output/new').resolve())
        self.assertEqual(self.renderer.protected_output(self.output),self.output)

    def test_theme_cannot_escape_repo_and_frozen_overlay_tamper_is_not_repaired(self):
        self.prepare();before=self.snapshot()
        outside=self.directory/'outside-theme.json';outside.write_text('{}',encoding='utf8')
        with self.assertRaisesRegex(ValueError,'Theme must exist inside'):self.prepare(theme=str(outside))
        self.assertEqual(self.snapshot(),before)
        overlay=self.output/'specs/short-move.js';overlay.write_bytes(overlay.read_bytes()+b'// changed\n')
        changed=self.snapshot()
        with self.assertRaisesRegex(RuntimeError,'Existing overlay changed'):self.prepare(ids=['short-move'])
        self.assertEqual(self.snapshot(),changed)

    def test_frame_selection_is_bounded_for_one_and_two_frame_clips(self):
        for count in [1,2]:
            with self.subTest(count=count):
                default=self.renderer.clamp_frames(count,still=90,keys=[-10,30,99])
                explicit=self.renderer.clamp_frames(count,'-100,0,1,63,120,10000')
                self.assertEqual(default,list(range(count)))
                self.assertEqual(explicit,list(range(count)))
        with self.assertRaises(ValueError):self.renderer.clamp_frames(0)

    def preview_fixture(self,sid='short-move'):
        work=self.output/'preview-work';fr=work/sid/'fr';c=work/sid/'c'
        fr.mkdir(parents=True);c.mkdir(parents=True)
        for f in [0,1]:Image.new('RGBA',(12,12),(40,100,160,255)).save(c/f'{f:04d}.png')
        (fr/'met-fixture.json').write_text('[{"f":0},{"f":1}]',encoding='utf8')
        qa={'id':sid,'frames':2,'fps':30,'duration_s':0.05,'pass':True,'frames_complete':False}
        fixture_files={work/(sid+'.spec.json'):{'id':sid,'fps':30,'timeline':{'duration':0.05}},
            work/('theme-'+sid+'.json'):{'fixture':True},
            self.output/'preview-master/metrics'/(sid+'.json'):qa}
        for p,value in fixture_files.items():
            p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(value),encoding='utf8')
        self.renderer.bind_preview(self.output,sid,[0,1],work,qa)
        return self.output/'preview-evidence'/(sid+'.json')

    def test_preview_binds_actual_images_metrics_spec_theme_contact_and_manifest(self):
        self.prepare();evidence_path=self.preview_fixture();e=self.renderer.verify_preview(self.output,'short-move')
        self.assertEqual(e['frames'],[0,1]);self.assertFalse(e['qa']['frames_complete'])
        for relative in e['inputs']:
            p=self.output/relative;original=p.read_bytes()
            with self.subTest(changed=relative):
                p.write_bytes(original+b'changed')
                try:
                    with self.assertRaisesRegex(ValueError,'Preview evidence changed'):
                        self.renderer.verify_preview(self.output,'short-move')
                finally:p.write_bytes(original)
        manifest=self.output/'source-manifest.json';original=manifest.read_bytes();manifest.write_bytes(original+b' ')
        try:
            with self.assertRaisesRegex(ValueError,'another recipe'):self.renderer.verify_preview(self.output,'short-move')
        finally:manifest.write_bytes(original)
        self.assertEqual(json.loads(evidence_path.read_text(encoding='utf8')),e)

    def test_preview_rejects_outside_evidence_even_when_its_sha_is_correct(self):
        self.prepare();p=self.preview_fixture();e=json.loads(p.read_text(encoding='utf8'))
        outside=self.directory/'outside-evidence.json';outside.write_text('{}',encoding='utf8')
        e['inputs']['../outside-evidence.json']=self.renderer.sha(outside)
        p.write_text(json.dumps(e),encoding='utf8')
        with self.assertRaisesRegex(ValueError,'Preview evidence changed'):
            self.renderer.verify_preview(self.output,'short-move')

    def test_preview_rejects_a_different_drill_id_in_the_sidecar(self):
        self.prepare();p=self.preview_fixture();e=json.loads(p.read_text(encoding='utf8'))
        e['id']='other-move';p.write_text(json.dumps(e),encoding='utf8')
        with self.assertRaises((ValueError,RuntimeError)):
            self.renderer.verify_preview(self.output,'short-move')

    def test_preview_rejects_removal_of_the_bound_file_set(self):
        self.prepare();p=self.preview_fixture();e=json.loads(p.read_text(encoding='utf8'))
        e['inputs']={};p.write_text(json.dumps(e),encoding='utf8')
        with self.assertRaises((ValueError,RuntimeError)):
            self.renderer.verify_preview(self.output,'short-move')

    def test_preview_cannot_hide_a_changed_frame_by_dropping_only_its_binding(self):
        self.prepare();p=self.preview_fixture();e=json.loads(p.read_text(encoding='utf8'))
        relative='preview-work/short-move/c/0000.png'
        self.assertIn(relative,e['inputs'])
        del e['inputs'][relative]
        Image.new('RGBA',(12,12),(210,10,30,255)).save(self.output/relative)
        p.write_text(json.dumps(e),encoding='utf8')
        # Other valid bindings remain, so checking only that inputs is nonempty
        # would still silently lose the required first-frame evidence.
        self.assertTrue(e['inputs'])
        with self.assertRaises((ValueError,RuntimeError)):
            self.renderer.verify_preview(self.output,'short-move')

    def test_subset_preview_dispatches_only_requested_id_with_bounded_frames_without_gpu(self):
        self.prepare();manifest=self.output/'source-manifest.json';before=manifest.read_bytes()
        captured=[];work=self.output/'preview-work';qa_out=self.output/'preview-master'
        @contextmanager
        def fake_slot(path):
            self.assertEqual(path,self.repo/'output/.hd-gpu-slots');yield 0
        @contextmanager
        def fake_vite():yield
        def render(sid,theme,jobs,frames):
            self.assertEqual(jobs,1);captured.append((sid,frames))
            self.preview_fixture(sid)
            return work/sid/'fr',work/sid/'c',{'timeline':{'duration':0.05}},None
        engine=SimpleNamespace(Vite=fake_vite,OUT=str(qa_out),
            spec_json=lambda sid:(None,None,{'timeline':{'duration':0.05},'stillAt':90,'keyFrames':[99]}),
            ensure_outputs=lambda *args:None,render=render,qa=lambda *args:None)
        # preview_fixture creates the metric file that main reads, with sparse
        # QA. No real engine import, environment update or GPU slot occurs.
        with (patch.object(self.renderer,'load_drill',return_value=(engine,work)) as load,
              patch.object(self.renderer,'resource_guard'),
              patch.dict(sys.modules,{'render_slots':SimpleNamespace(gpu_slot=fake_slot)}),
              patch.object(sys,'argv',['render_batch.py','preview','--output',str(self.output),
                  '--ids','short-move','--frames','0,63,120']),
              self.no_production_processes(),redirect_stdout(io.StringIO())):
            environment=dict(os.environ);self.renderer.main();self.assertEqual(dict(os.environ),environment)
        self.assertEqual(captured,[('short-move',[0,1])])
        self.assertEqual(list(load.call_args.args[2]),self.ids)
        self.assertEqual(manifest.read_bytes(),before)
        self.assertEqual([x['id'] for x in json.loads(before)['drills']],self.ids)
        evidence=self.renderer.verify_preview(self.output,'short-move')
        self.assertFalse(evidence['qa']['frames_complete'])
        self.assertFalse(json.loads((self.output/'progress-8859.json').read_text(encoding='utf8'))['items']['short-move']['full_loop_accepted'])


class TemporarySlotTest(unittest.TestCase):
    def setUp(self):
        temporary=tempfile.TemporaryDirectory(prefix='pose-hub-slot-test-')
        self.addCleanup(temporary.cleanup);self.directory=Path(temporary.name)
        self.slots=module_from_file('hub_slots_test',HERE/'render_slots.py')

    def worker(self):
        code='''import importlib.util,sys
from pathlib import Path
s=importlib.util.spec_from_file_location('isolated_slots',sys.argv[1])
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
with m.gpu_slot(Path(sys.argv[2])) as slot:
 print('ACQUIRED '+str(slot),flush=True)
 sys.stdin.readline()
'''
        p=subprocess.Popen([sys.executable,'-B','-c',code,str(HERE/'render_slots.py'),str(self.directory/'slots')],
            stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,encoding='utf8',
            **({'creationflags':subprocess.CREATE_NO_WINDOW} if os.name=='nt' else {}))
        def cleanup():
            if p.poll() is None:
                try:p.stdin.write('release\n');p.stdin.flush();p.wait(timeout=5)
                except (OSError,subprocess.TimeoutExpired):p.terminate();p.wait(timeout=5)
            for f in (p.stdin,p.stdout,p.stderr):f.close()
        self.addCleanup(cleanup)
        received=queue.Queue();threading.Thread(target=lambda:received.put(p.stdout.readline()),daemon=True).start()
        try:line=received.get(timeout=15)
        except queue.Empty:self.fail('Slot helper did not start within 15 seconds')
        self.assertRegex(line,r'^ACQUIRED [01]');return p,int(line.strip().split()[-1])

    def test_two_processes_occupy_slots_third_rejects_and_clean_exit_releases(self):
        first,a=self.worker();second,b=self.worker();self.assertNotEqual(a,b)
        with self.assertRaisesRegex(RuntimeError,'Both HD GPU slots are occupied'):
            with self.slots.gpu_slot(self.directory/'slots'):self.fail('Third slot was acquired')
        first.stdin.write('release\n');first.stdin.flush();self.assertEqual(first.wait(timeout=10),0)
        with self.slots.gpu_slot(self.directory/'slots') as available:self.assertEqual(available,a)
        second.stdin.write('release\n');second.stdin.flush();self.assertEqual(second.wait(timeout=10),0)
        with self.slots.gpu_slot(self.directory/'slots') as one:
            with self.slots.gpu_slot(self.directory/'slots') as two:self.assertNotEqual(one,two)

    def test_exception_releases_its_temporary_slot(self):
        with self.assertRaisesRegex(LookupError,'fixture failure'):
            with self.slots.gpu_slot(self.directory/'slots'):raise LookupError('fixture failure')
        with self.slots.gpu_slot(self.directory/'slots') as first:
            with self.slots.gpu_slot(self.directory/'slots') as second:self.assertNotEqual(first,second)


if __name__=='__main__':unittest.main()
