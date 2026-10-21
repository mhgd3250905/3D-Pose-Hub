"""CPU-only review page contract checks. Never generates the production page."""
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('batch_gallery',Path(__file__).with_name('gallery.py'))
g=importlib.util.module_from_spec(spec);spec.loader.exec_module(g)


class GalleryTests(unittest.TestCase):
 def fixture(self,base):
  root=base/'media';repo=base/'repo';root.mkdir();repo.mkdir()
  batch=base/'batch.json';batch.write_text(json.dumps({'format':'pose-hub-v2-production-batch@1',
   'id':'test-batch','skins':g.SKINS,'actions':[{'id':'new-action'}]}),encoding='utf-8')
  package=repo/'catalog/v2/actions/new-action.json';package.parent.mkdir(parents=True)
  package.write_text(json.dumps({'definition':{'name':{'zh':'本批动作','en':'Current action'}}}),encoding='utf-8')
  def media(relative):
   p=root/relative;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b'URL contract fixture, not decoded media')
   return {'root':'media','path':relative}
  cover=media('derivatives/realistic/new-action/light/peak.720.png')
  media('derivatives/realistic/new-action/light/comparison.off.720.png')
  video=media('derivatives/realistic/new-action/light/loop.720.mp4')
  variant={'actionId':'new-action','skin':'realistic','theme':'light','highlight':{'enabled':True},
   'video':video,'cover':cover,'keyframes':[{'phase':'peak','asset':cover}]}
  manifest=root/'manifests/derivatives.json';manifest.parent.mkdir()
  manifest.write_text(json.dumps({'variants':[variant,{**variant,'actionId':'w-dead-bug'}]}),encoding='utf-8')
  voice=base/'voice.json';voice.write_text(json.dumps({'actions':{'new-action':{'lines':{'zh':{
    'name':{'text':'本批动作','status':'passed','ref':media('voice/zh/new-action/name.m4a')}}}},
    'w-dead-bug':{'lines':{'zh':{'name':{'text':'Old pilot','ref':media('voice/zh/w-dead-bug/name.m4a')}}}}}}),encoding='utf-8')
  return root,repo,batch,voice

 def test_only_batch_actions_and_existing_batch_media_are_embedded(self):
  with tempfile.TemporaryDirectory() as tmp:
   root,repo,batch,voice=self.fixture(Path(tmp))
   with patch.object(g,'REPO',repo):data=g.build_data(batch,root,voice)
   self.assertEqual([x['id'] for x in data['actions']],['new-action'])
   self.assertEqual(len(data['variants']),1);self.assertEqual(data['readyVideos'],1);self.assertEqual(data['expectedVideos'],10)
   self.assertEqual(data['actions'][0]['voice']['zh']['name']['url'],'voice/zh/new-action/name.m4a')
   self.assertIsNone(data['actions'][0]['voice']['en']['name']['url'])
   for key in ['video','cover','peakOn','peakOff']:self.assertTrue((root/data['variants'][0][key]).is_file())
   page=g.render_html(data);self.assertNotIn('w-dead-bug',page);self.assertIn('test-batch',page)
   self.assertFalse((root/'index.html').exists())

 def test_missing_voice_manifest_and_unfinished_variants_remain_pending(self):
  with tempfile.TemporaryDirectory() as tmp:
   root,repo,batch,_=self.fixture(Path(tmp));(root/'manifests/derivatives.json').unlink()
   with patch.object(g,'REPO',repo):data=g.build_data(batch,root,Path(tmp)/'not-produced.json')
   self.assertEqual(data['readyVideos'],0);self.assertEqual(data['variants'],[])
   self.assertTrue(all(line['url'] is None and line['status']=='pending'
    for lines in data['actions'][0]['voice'].values() for line in lines.values()))
   script=g.render_html(data).split('<script>',1)[1].split('</script>',1)[0]
   result=subprocess.run(['node','-e','new Function(require("fs").readFileSync(0,"utf8"));'],
    input=script,text=True,encoding='utf-8',capture_output=True,timeout=10)
   self.assertEqual(result.returncode,0,result.stderr)

 def test_media_url_rejects_cross_root_and_missing_assets(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp)/'batch';root.mkdir();(Path(tmp)/'outside.m4a').write_bytes(b'outside')
   for ref in [{'root':'media','path':'../outside.m4a'},{'root':'repo','path':'outside.m4a'},
      {'root':'media','path':'C:/outside.m4a'},{'root':'media','path':'https://example.com/outside'},
      {'root':'media','path':'missing.m4a'}]:self.assertIsNone(g.media_url(root,ref))

 def test_actual_b001_voice_shape_and_eight_card_scope_without_writing_html(self):
  batch=g.REPO/'catalog/v2/batches/b001.json'
  if not batch.is_file():self.skipTest('b001 not authored in this checkout')
  root=Path('F:/PoseHub-v2-production/batches/b001');voice=g.REPO/'catalog/voice-v2/batches/b001-manifest.json'
  if not voice.is_file():self.skipTest('b001 voice production not available')
  data=g.build_data(batch,root,voice);expected=[x['id'] for x in g.read(batch)['actions']]
  self.assertEqual([x['id'] for x in data['actions']],expected);self.assertEqual(len(expected),8)
  self.assertEqual(data['expectedVideos'],80)
  self.assertEqual(sum(bool(line['url']) for action in data['actions'] for lines in action['voice'].values() for line in lines.values()),80)
  self.assertNotIn('w-dead-bug',[x['id'] for x in data['actions']])
  self.assertNotIn('glute-max-A',[x['id'] for x in data['actions']])


if __name__=='__main__':unittest.main()
