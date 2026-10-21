"""Batch voice isolation and offline reuse regressions; never requests TTS."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

spec=importlib.util.spec_from_file_location('batch_voice',Path(__file__).with_name('build_voice.py'))
b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)


class BatchVoiceTests(unittest.TestCase):
 def test_rate_is_part_of_identity_and_wrong_profile_is_rejected(self):
  self.assertNotEqual(b.fingerprint('same','voice','+4%'),b.fingerprint('same','voice','+6%'))
  with self.assertRaises(ValueError):list(b.entries({'voices':b.VOICES,'rates':{'zh':'+4%','en':'+4%'},'languages':['zh','en']}))

 def test_media_paths_cannot_escape_batch(self):
  for relative in ['../outside.m4a','C:/outside.m4a','/outside.m4a','voice\\outside.m4a']:
   with self.assertRaises(ValueError):b.under(Path.cwd(),relative)

 def test_pinned_audit_change_and_manifest_replacement_are_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   file=Path(tmp)/'audit.py';file.write_bytes(b'changed')
   with self.assertRaises(ValueError):b.pin(file,b.PINS['audio'])
   manifest=Path(tmp)/'manifest.json';b.atomic_manifest(manifest,{'batchFingerprint':'one','summary':{}})
   original=manifest.read_bytes()
   with self.assertRaises(FileExistsError):b.atomic_manifest(manifest,{'batchFingerprint':'two'})
   self.assertEqual(original,manifest.read_bytes())

 def test_offline_batch_reuses_verified_bytes_without_touching_global_manifest(self):
  with tempfile.TemporaryDirectory() as tmp:
   base=Path(tmp);root=base/'batch';manifest=base/'batch-manifest.json';script=base/'script.json'
   # All wording comes from the pilot common vocabulary; no synthesis is allowed.
   text={'zh':'开始','en':'Go'}
   payload={'languages':['zh','en'],'voices':b.VOICES,'rates':b.RATES,
    'actions':{'fixture':{key:copy.deepcopy(text) for key in ['name','primaryCue','phase.start','phase.peak','phase.end']}},
    'common':{'p.rest':{'zh':'休息','en':'Rest for'}}}
   script.write_text(json.dumps(payload,ensure_ascii=False),encoding='utf-8')
   global_path=b.REPO/'catalog/voice-v2/manifest.json';original=global_path.read_bytes()
   command=[sys.executable,'-B','-X','utf8',str(Path(b.__file__)),
    '--script',str(script),'--manifest',str(manifest),'--root',str(root),'--hiplab','E:/AII-3D/3D-Hip']
   env=dict(os.environ);env['TEMP']=env['TMP']=env['TMPDIR']=str(root/'work/voice')
   (root/'work/voice').mkdir(parents=True)
   result=subprocess.run(command,env=env,text=True,encoding='utf-8',capture_output=True,timeout=60)
   self.assertEqual(result.returncode,0,result.stdout+result.stderr)
   data=b.read(manifest);self.assertEqual(data['summary'],{'passed':12,'pending':0,'failed':0,'total':12})
   self.assertEqual(data['contentReview'],'pending-user-review');self.assertEqual(data['manualListening'],'pending')
   sample=data['actions']['fixture']['lines']['zh']['name'];self.assertEqual(sample['provenance']['sourceRate'],'+6%')
   self.assertEqual(sample['ref']['sha256'],sample['provenance']['sourceSha256'])
   self.assertEqual(global_path.read_bytes(),original)
   # Same fingerprint can resume/re-audit. A changed script cannot replace it.
   again=subprocess.run(command,env=env,text=True,encoding='utf-8',capture_output=True,timeout=60)
   self.assertEqual(again.returncode,0,again.stdout+again.stderr)
   saved=manifest.read_bytes();payload['actions']['fixture']['name']['zh']='different'
   script.write_text(json.dumps(payload),encoding='utf-8')
   rejected=subprocess.run(command,env=env,text=True,encoding='utf-8',capture_output=True,timeout=60)
   self.assertNotEqual(rejected.returncode,0)
   self.assertEqual(manifest.read_bytes(),saved)
   self.assertEqual(global_path.read_bytes(),original)

 def test_failed_transport_leaves_missing_lines_pending_and_stops_requests(self):
  with tempfile.TemporaryDirectory() as tmp:
   base=Path(tmp);root=base/'batch';manifest=base/'manifest.json';script=base/'script.json';deps=base/'deps'
   deps.mkdir();marker=base/'requests.txt'
   # Stub only the optional transport module in a fresh child process. This
   # test deliberately never contacts Edge TTS or a paid speech service.
   (deps/'edge_tts.py').write_text(
    'from pathlib import Path\nclass Communicate:\n'
    ' def __init__(self,*args,**kwargs):pass\n'
    f' async def save(self,path):\n  marker=Path({str(marker)!r})\n'
    '  marker.write_text(marker.read_text()+"request\\n" if marker.exists() else "request\\n")\n'
    '  raise RuntimeError("test transport unavailable")\n',encoding='utf-8')
   text={'zh':'批次离线失败占位','en':'Batch failure fixture'}
   payload={'languages':['zh','en'],'voices':b.VOICES,'rates':b.RATES,
    'actions':{'fixture':{key:copy.deepcopy(text) for key in ['name','primaryCue','phase.start','phase.peak','phase.end']}},
    'common':{'p.rest':{'zh':'休息','en':'Rest for'}}}
   script.write_text(json.dumps(payload,ensure_ascii=False),encoding='utf-8')
   command=[sys.executable,'-B','-X','utf8',str(Path(b.__file__)),
    '--script',str(script),'--manifest',str(manifest),'--root',str(root),'--hiplab','E:/AII-3D/3D-Hip',
    '--deps-dir',str(deps),'--synthesize']
   env=dict(os.environ);env['TEMP']=env['TMP']=env['TMPDIR']=str(root/'work/voice');(root/'work/voice').mkdir(parents=True)
   result=subprocess.run(command,env=env,text=True,encoding='utf-8',capture_output=True,timeout=60)
   self.assertEqual(result.returncode,1,result.stdout+result.stderr)
   data=b.read(manifest)
   self.assertEqual(data['summary'],{'passed':2,'pending':10,'failed':0,'total':12})
   self.assertEqual(len(data['networkErrors']),1)
   self.assertEqual(marker.read_text(),'request\n')
   self.assertEqual(data['manualListening'],'pending')


if __name__=='__main__':unittest.main()
