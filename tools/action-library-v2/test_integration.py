"""CPU-only adapter/root-binding regressions using isolated structural fixtures.

Fixture media bytes are deliberately not production media. These tests do not
scan PNG sequences, invoke a renderer or grant any review/release approval.
"""
import copy
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch

HERE=Path(__file__).resolve().parent
REAL_REPO=HERE.parents[1]


def load(name,file):
 spec=importlib.util.spec_from_file_location(name,file)
 value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value


report=load('library_report_test_target',HERE/'report_library.py')
integrate=load('library_integrate_test_target',HERE/'integrate_batch.py')
SKINS=['realistic','tech-white','neon-night','neon-night-b','hologram']
PILOT=['glute-max-A','h-catcow-quad','h-chair-step-up','h-db-curl','s-frog','w-dead-bug']


def write(path,data):
 path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
 path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


def reference(root,relative,payload=b'structural CPU fixture; not a production asset',**metadata):
 path=root/relative;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(payload)
 return {'root':'media','path':relative,'sha256':hashlib.sha256(payload).hexdigest(),'bytes':len(payload),**metadata}


class IntegrationFixture:
 def __init__(self,base):
  self.repo=base/'repo';self.root=base/'media';self.ids=['new-a','new-b']
  self.batch={'format':'pose-hub-v2-production-batch@1','id':'fixture-batch','model':{'id':'training-human-v2plus','version':'1.0.0-rc2'},
   'skins':SKINS,'actions':[{'id':aid,'spec':f'drill-anim/specs/{aid}-r2.js','peakFrame':60} for aid in self.ids]}
  self.batch_path=self.repo/'catalog/v2/batches/fixture.json';write(self.batch_path,self.batch)
  self.recipe={'batchId':self.batch['id'],'sha256':hashlib.sha256(b'recipe').hexdigest(),
   'batchSha256':hashlib.sha256(self.batch_path.read_bytes()).hexdigest(),
   'actions':[{'id':aid,'sourceSha256':hashlib.sha256(aid.encode()).hexdigest()} for aid in self.ids]}
  write(self.root/'manifests/batch-source.json',self.recipe)
  derived={'schema':'pose-hub-derivatives@2','variants':[],'transparentCovers':{}}
  voice=copy.deepcopy(json.loads((REAL_REPO/'catalog/voice-v2/manifest.json').read_text(encoding='utf-8')))
  voice['actions']={}
  audio=reference(self.root,'voice/fixture.m4a',durationSeconds=1,channels=1,sampleRate=44100,codec='aac')
  for lines in voice['sharedVocabulary']['lines'].values():
   for line in lines.values():line['ref']=copy.deepcopy(audio)
  for action in self.batch['actions']:
   aid=action['id'];digest=hashlib.sha256((aid+'-spec').encode()).hexdigest()
   package={'format':'action-package@2','id':aid,'source':{'spec':{'path':action['spec'],'sha256':digest},'qa':{'status':'pending'}},
    'masters':{'skins':{}},'derivatives':{},'voice':{'actionId':'w-dead-bug','manifest':{}},'status':'draft'}
   receipt={'actionId':aid,'stage':'full','recipeSha256':self.recipe['sha256'],
    'sourceSha256':next(x['sourceSha256'] for x in self.recipe['actions'] if x['id']==aid),
    'reviewSha256':hashlib.sha256((aid+'-review').encode()).hexdigest(),'manifests':{}}
   derived['transparentCovers'][aid]={}
   for skin in SKINS:
    sequence={}
    for layer in ['body','highlight','shadow']:
     relative=f'masters/{skin}/{aid}/{layer}/index.json'
     sequence[layer]=reference(self.root,relative,payload=json.dumps({'frameCount':240,'frames':[{'frame':i} for i in range(240)]}).encode())
    manifest={'format':'pose-hub-layer-render@2','actionId':aid,'skin':skin,'complete':True,'frameCount':240,
     'sourceSha256':next(x['sourceSha256'] for x in self.recipe['actions'] if x['id']==aid),
     'spec':{'path':action['spec'],'sha256':digest},'model':{'id':'training-human-v2plus','version':'1.0.0-rc2','modelVersion':'1.0.0-rc2'},
     'geometrySha256':'0'*64,'occlusionSha256':'1'*64,'sequences':sequence}
    relative=f'masters/{skin}/{aid}/layer-manifest.json'
    receipt['manifests'][skin]=reference(self.root,relative,payload=json.dumps(manifest).encode())
    package['masters']['skins'][skin]={'geometrySha256':'0'*64,'occlusionSha256':'1'*64,'measurement':receipt['manifests'][skin]}
    for theme in ['light','dark']:
     prefix=f'derivatives/{skin}/{aid}/{theme}'
     video=reference(self.root,prefix+'/loop.mp4',width=720,height=720,codec='h264',durationSeconds=8,frames=240,fps=30)
     image=reference(self.root,prefix+'/cover.png',width=720,height=720)
     derived['variants'].append({'actionId':aid,'skin':skin,'theme':theme,'modelVersion':'1.0.0-rc2',
      'video':video,'cover':image,'thumbnail':image,'keyframes':[{'phase':phase,'asset':image} for phase in ['start','peak','end']]})
    derived['transparentCovers'][aid][skin]=reference(self.root,f'derivatives/{skin}/{aid}/transparent.png',width=1080,height=1080,alpha=True)
   write(self.root/f'manifests/completed/full-{aid}.json',receipt)
   write(self.repo/f'catalog/v2/actions/{aid}.json',package)
   voice['actions'][aid]={'lines':{lang:{key:{'text':f'{aid} {lang} {key}','status':'passed','fingerprint':'fixture',
    'ref':copy.deepcopy(audio),'audit':{'fails':[],'lufs':-16,'true_peak':-2,'rawComparison':True}}
     for key in ['name','primaryCue','phase.start','phase.peak','phase.end']} for lang in ['zh','en']}}
  # An unrelated old entry in an accumulated manifest must not import a pilot
  # action; only this batch's configured IDs may be passed to the core importer.
  derived['variants'].append({**derived['variants'][0],'actionId':'w-dead-bug'})
  self.voice=self.repo/'catalog/voice-v2/batches/fixture-manifest.json';write(self.voice,voice)
  write(self.root/'manifests/derivatives.json',derived)
  self.pilot_before={}
  for aid in PILOT:
   path=self.repo/f'catalog/v2/actions/{aid}.json';write(path,{'id':aid,'sentinel':'accepted pilot must remain unchanged'})
   self.pilot_before[path]=path.read_bytes()
  # Adapter-only importer spy: prove PEAKS is restricted to this batch, without
  # scanning or writing any media. Actual importer behavior is tested elsewhere.
  importer=self.repo/'tools/action-package-v2/import_pilot.py';importer.parent.mkdir(parents=True)
  importer.write_text('import json,sys\nfrom pathlib import Path\nPEAKS={"w-dead-bug":2}\n'
   'def main():\n root=Path(sys.argv[sys.argv.index("--root")+1]);(root/"importer-called.json").write_text(json.dumps(list(PEAKS)))\n',encoding='utf-8')
  for relative in ['tools/action-package-v2/composite.py','tools/action-library-v2/media.py']:
   path=self.repo/relative;path.parent.mkdir(parents=True,exist_ok=True);path.write_text('# structural fixture\n',encoding='utf-8')
  self.core=types.SimpleNamespace(SKINS=SKINS,IDS=self.ids,write_json=write)

 def call(self):
  with (patch.object(integrate,'REPO',self.repo),patch.object(integrate,'__file__',str(self.repo/'tools/action-library-v2/integrate_batch.py')),
       patch.object(integrate,'core_for',return_value=self.core),patch.object(sys,'argv',[
        'integrate_batch.py','--batch',str(self.batch_path),'--root',str(self.root),'--voice-manifest',str(self.voice)])):
   integrate.main()

 def preflight(self):
  with patch.object(integrate,'REPO',self.repo):integrate.preflight(self.batch,self.root,self.voice)


class BatchIntegrationTests(unittest.TestCase):
 def test_batch_source_change_is_rejected_before_import(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));before={p:p.read_bytes() for p in (f.repo/'catalog/v2/actions').glob('*.json')}
   f.batch['actions'][0]['peakFrame']=61;write(f.batch_path,f.batch)
   with self.assertRaisesRegex(ValueError,'batch file changed'):f.call()
   self.assertFalse((f.root/'importer-called.json').exists())
   for p,raw in before.items():self.assertEqual(p.read_bytes(),raw)

 def test_import_configures_only_batch_ids_and_binds_voice_without_touching_pilot(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));f.call()
   self.assertEqual(json.loads((f.root/'importer-called.json').read_text()),f.ids)
   for path,original in f.pilot_before.items():self.assertEqual(path.read_bytes(),original)
   for aid in f.ids:
    package=integrate.read(f.repo/f'catalog/v2/actions/{aid}.json')
    self.assertEqual(package['voice']['actionId'],aid)
    self.assertEqual(package['voice']['manifest']['path'],'catalog/voice-v2/batches/fixture-manifest.json')
    self.assertEqual(package['voice']['manifest']['sha256'],hashlib.sha256(f.voice.read_bytes()).hexdigest())
    self.assertEqual(package['source']['qa'],{'status':'pending'})

 def test_missing_voice_action_is_rejected_before_importer_or_catalog_writes(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));voice=integrate.read(f.voice);del voice['actions'][f.ids[-1]];write(f.voice,voice)
   before={p:p.read_bytes() for p in (f.repo/'catalog/v2/actions').glob('*.json')}
   with self.assertRaises(ValueError):f.call()
   self.assertFalse((f.root/'importer-called.json').exists())
   self.assertTrue(all(path.read_bytes()==original for path,original in before.items()))

 def test_repo_bound_cli_inputs_are_rejected_before_import_if_outside_repo(self):
  for selected in ['voice','batch_path']:
   with self.subTest(input=selected),tempfile.TemporaryDirectory() as tmp:
    base=Path(tmp);f=IntegrationFixture(base)
    external=base/f'external-{selected}.json';external.write_bytes(getattr(f,selected).read_bytes());setattr(f,selected,external)
    before={p:p.read_bytes() for p in (f.repo/'catalog/v2/actions').glob('*.json')}
    with self.assertRaises(ValueError):f.call()
    self.assertFalse((f.root/'importer-called.json').exists())
    self.assertTrue(all(path.read_bytes()==original for path,original in before.items()))

 def test_receipt_reference_cannot_escape_batch_root(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));path=f.root/f'manifests/completed/full-{f.ids[0]}.json';receipt=integrate.read(path)
   receipt['manifests'][SKINS[0]]['path']='../outside.json';write(path,receipt)
   with self.assertRaises(ValueError):f.preflight()

 def test_missing_derivative_matrix_is_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));path=f.root/'manifests/derivatives.json';derived=integrate.read(path)
   derived['variants'].pop(0);write(path,derived)
   with self.assertRaises(ValueError):f.preflight()

 def test_ten_duplicate_variants_cannot_replace_the_five_skin_theme_matrix(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));path=f.root/'manifests/derivatives.json';derived=integrate.read(path)
   first=next(v for v in derived['variants'] if v['actionId']==f.ids[0])
   derived['variants']=[copy.deepcopy(first) for _ in range(10)]+[v for v in derived['variants'] if v['actionId']!=f.ids[0]]
   write(path,derived)
   with self.assertRaises(ValueError):f.preflight()

 def test_missing_voice_file_is_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));(f.root/'voice/fixture.m4a').unlink()
   with self.assertRaises((ValueError,OSError)):f.preflight()

 def test_later_action_sequence_change_is_rejected_before_import(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));index=f.root/f'masters/{SKINS[0]}/{f.ids[-1]}/body/index.json'
   index.write_bytes(b'changed after full receipt')
   before={p:p.read_bytes() for p in (f.repo/'catalog/v2/actions').glob('*.json')}
   with self.assertRaises((ValueError,OSError)):f.call()
   self.assertFalse((f.root/'importer-called.json').exists())
   self.assertTrue(all(path.read_bytes()==original for path,original in before.items()))

 def test_later_action_missing_or_changed_derivative_is_rejected(self):
  for mutation in ['missing','changed']:
   with self.subTest(mutation=mutation),tempfile.TemporaryDirectory() as tmp:
    f=IntegrationFixture(Path(tmp));asset=f.root/f'derivatives/{SKINS[-1]}/{f.ids[-1]}/dark/loop.mp4'
    if mutation=='missing':asset.unlink()
    else:asset.write_bytes(b'changed derivative')
    with self.assertRaises((ValueError,OSError)):f.preflight()

 def test_full_manifest_must_bind_the_receipted_action_skin(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));path=f.root/f'manifests/completed/full-{f.ids[0]}.json';receipt=integrate.read(path)
   receipt['manifests'][SKINS[1]]=receipt['manifests'][SKINS[0]];write(path,receipt)
   with self.assertRaises(ValueError):f.preflight()

 def test_pending_voice_text_is_allowed_without_claiming_audio_pass(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));voice=integrate.read(f.voice)
   for action in voice['actions'].values():
    for lines in action['lines'].values():
     for line in lines.values():line['status']='pending';line['ref']=None
   write(f.voice,voice);f.preflight()

 def test_catalog_package_identity_must_match_the_batch_action(self):
  with tempfile.TemporaryDirectory() as tmp:
   f=IntegrationFixture(Path(tmp));path=f.repo/f'catalog/v2/actions/{f.ids[0]}.json';package=integrate.read(path)
   package['id']='w-dead-bug';write(path,package)
   with self.assertRaises(ValueError):f.preflight()

 def test_voice_requires_both_languages_and_all_five_roles(self):
  for missing in [('en',None),('zh','phase.end')]:
   with self.subTest(missing=missing),tempfile.TemporaryDirectory() as tmp:
    f=IntegrationFixture(Path(tmp));voice=integrate.read(f.voice);lines=voice['actions'][f.ids[0]]['lines']
    if missing[1] is None:del lines[missing[0]]
    else:del lines[missing[0]][missing[1]]
    write(f.voice,voice)
    with self.assertRaises(ValueError):f.preflight()

 def test_passed_voice_cannot_use_bad_sha_or_escaped_file(self):
  for mutation in ['bad-sha','escape','missing-ref']:
   with self.subTest(mutation=mutation),tempfile.TemporaryDirectory() as tmp:
    f=IntegrationFixture(Path(tmp));voice=integrate.read(f.voice);line=voice['actions'][f.ids[0]]['lines']['zh']['name']
    if mutation=='bad-sha':line['ref']['sha256']='0'*64
    elif mutation=='escape':line['ref']['path']='../outside.m4a'
    else:line['ref']=None
    write(f.voice,voice)
    with self.assertRaises((ValueError,OSError,TypeError,AttributeError)):f.preflight()


class LibraryReportTests(unittest.TestCase):
 def test_plan_rejects_duplicate_counts_and_unsafe_action_ids(self):
  base={'primaryTarget':2,'actions':[{'id':'a','batchId':'b'},{'id':'c','batchId':'b'}],
   'reusedPilot':{'actions':[]},'batches':[{'id':'b','root':{'relativePath':'batches/b'}}]}
  for mutation in ['duplicate','wrong-target','unsafe-id']:
   with self.subTest(mutation=mutation):
    plan=copy.deepcopy(base)
    if mutation=='duplicate':plan['actions'][1]['id']='a'
    elif mutation=='wrong-target':plan['primaryTarget']=142
    else:plan['actions'][0]['id']='../escape'
    with self.assertRaises(ValueError):report.validate_plan(plan)

 def test_context_uses_each_actions_own_batch_or_explicit_pilot_root(self):
  with tempfile.TemporaryDirectory() as tmp:
   base=Path(tmp);production=base/'production';pilot=base/'pilot'
   plan={'reusedPilot':{'actions':['accepted']},'actions':[{'id':'a','batchId':'b1'},{'id':'b','batchId':'b2'}],
    'batches':[{'id':'b1','root':{'relativePath':'batches/b1'}},{'id':'b2','root':{'relativePath':'batches/b2'}}]}
   self.assertEqual(report.context_for('accepted',plan,production,pilot),pilot.resolve())
   self.assertEqual(report.context_for('a',plan,production,pilot),(production/'batches/b1').resolve())
   self.assertEqual(report.context_for('b',plan,production,pilot),(production/'batches/b2').resolve())
   for relative in ['../outside','/outside','C:/outside','batches\\outside','']:
    plan['batches'][0]['root']['relativePath']=relative
    with self.assertRaises(ValueError):report.context_for('a',plan,production,pilot)

 def test_report_accounts_for_all_142_real_plan_ids_without_scanning_media(self):
  plan=report.REPO/'catalog/v2/production-plan.json'
  if not plan.exists():self.skipTest('Full-library plan not authored')
  actual=json.loads(plan.read_text(encoding='utf-8'));self.assertEqual(len(actual['actions']),142)
  self.assertEqual(len({a['id'] for a in actual['actions']}),142)
  with tempfile.TemporaryDirectory() as tmp:
   base=Path(tmp);repo=base/'repo';production=base/'production';pilot=base/'pilot';output=base/'report.json'
   plan_copy=repo/'catalog/v2/production-plan.json';write(plan_copy,actual);write(repo/'catalog/v2/skins.json',{'skins':[]})
   gate=repo/'catalog/tools/action_package_v2.py';gate.parent.mkdir(parents=True)
   gate.write_text('import json\nfrom pathlib import Path\n'
    'def read(p):return json.loads(Path(p).read_text(encoding="utf-8"))\n'
    'def write(p,d):Path(p).write_text(json.dumps(d),encoding="utf-8")\n'
    'def validate(p,registry,roots,check):return {"id":p["id"],"complete":False,"observedRoot":str(roots["media"])}\n',encoding='utf-8')
   authored=actual['actions'][:14]
   for item in authored:write(repo/f'catalog/v2/actions/{item["id"]}.json',{'id':item['id']})
   with patch.object(report,'REPO',repo),patch.object(sys,'argv',['report_library.py','--plan',str(plan_copy),
     '--production-root',str(production),'--pilot-root',str(pilot),'--output',str(output)]),contextlib.redirect_stdout(io.StringIO()):report.main()
   data=json.loads(output.read_text(encoding='utf-8'))
   self.assertEqual(data['target'],142);self.assertEqual(data['authored'],14);self.assertEqual(len(data['unwritten']),128)
   self.assertEqual(data['authored']+len(data['unwritten']),142);self.assertEqual(data['complete'],0)
   self.assertEqual([r['id'] for r in data['actions']],[x['id'] for x in authored])
   for result in data['actions']:
    self.assertEqual(Path(result['observedRoot']),report.context_for(result['id'],actual,production,pilot))
   # A wrong package id cannot be counted as the scheduled file's action.
   first=repo/f'catalog/v2/actions/{authored[0]["id"]}.json';write(first,{'id':'wrong-action'})
   original=output.read_bytes()
   with patch.object(report,'REPO',repo),patch.object(sys,'argv',['report_library.py','--plan',str(plan_copy),
     '--production-root',str(production),'--pilot-root',str(pilot),'--output',str(output)]),self.assertRaises(ValueError):report.main()
   self.assertEqual(output.read_bytes(),original)


if __name__=='__main__':unittest.main()
