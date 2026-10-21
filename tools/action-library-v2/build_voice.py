"""Batch-isolated voice import/synthesis/audit. No global catalog writes.

Required --script, --manifest, --root and --hiplab select every batch destination.
Use --synthesize explicitly for free online Edge TTS. A failed request remains
pending; default is one attempt, and synthesis is sequential (one TTS request).
"""
from __future__ import annotations
import argparse
import ast
import asyncio
from contextlib import contextmanager
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import time

REPO=Path(__file__).resolve().parents[2]
PINS={
 'audio':'7256b4816f34aa932efbee29a741702d1f6932bf90e850a0681a761fd935e5c0',
 'hiplabBuild':'dc73e1b88b1b1b1ae999ea9c3479a0a96988e42882842db778cffd54fd130a23',
 'hiplabAudit':'5d57b4ea9fc2a095d8d9d581d9d7c4dd94f9fb5a8e30687fbf0ebb1cdc70b468'}
VOICES={'zh':'zh-CN-XiaoxiaoNeural','en':'en-US-JennyNeural'}
RATES={'zh':'+6%','en':'+4%'}
STANDARD={'lufsTarget':-16,'lufsTolerance':1,'truePeakMaxDbtp':-1,'codec':'aac','sampleRate':44100,'channels':1}


def read(path):return json.loads(Path(path).read_text(encoding='utf-8-sig'))
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def fingerprint(text,voice,rate):
 return hashlib.sha256(json.dumps([text,voice,rate,PINS['audio']],ensure_ascii=False).encode()).hexdigest()
def under(root,relative):
 p=Path(relative)
 if p.is_absolute() or '..' in p.parts or '\\' in str(relative) or ':' in str(relative):
  raise ValueError('Expected a relative POSIX media path')
 result=(root/p).resolve()
 if not result.is_relative_to(root.resolve()):raise ValueError('Media path escapes batch root')
 return result
def pin(path,digest):
 if sha(path)!=digest:raise ValueError(f'Pinned voice tool changed: {path}')
def load_audio():
 path=REPO/'tools/voice-v2/hiplab_audio.py';pin(path,PINS['audio'])
 spec=importlib.util.spec_from_file_location('posehub_batch_audio_pinned',path)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 return module


def entries(script):
 if script.get('voices')!=VOICES or script.get('rates')!=RATES or script.get('languages')!=['zh','en']:
  raise ValueError('Batch must use the pinned HipLab zh/en voice and rate profiles')
 for action,lines in script['actions'].items():
  if not action or any(x not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-' for x in action):
   raise ValueError('Invalid stable action ID')
  if not {'name','primaryCue','phase.start','phase.peak','phase.end'}<=set(lines):
   raise ValueError('Each action needs name, primaryCue and three phase lines')
  for key,texts in lines.items():
   if any(x not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-' for x in key):raise ValueError('Invalid line ID')
   for lang in ['zh','en']:
    text=texts.get(lang)
    if not isinstance(text,str) or not text.strip():raise ValueError(f'Missing {action}/{key}/{lang}')
    yield action,key,lang,text,f'voice/{lang}/{action}/{key}.m4a'
 for key,texts in script['common'].items():
  for lang in ['zh','en']:
   if not isinstance(texts.get(lang),str) or not texts[lang].strip():raise ValueError('Missing common vocabulary text')
   relative=f'voice/common/{lang}/{key}.m4a'
   under(Path.cwd(),relative)
   yield 'common',key,lang,texts[lang],relative


@contextmanager
def batch_lock(path,timeout=5):
 path.parent.mkdir(parents=True,exist_ok=True)
 handle=open(path.with_name(path.name+'.lock'),'a+b');locked=False
 try:
  if os.fstat(handle.fileno()).st_size==0:handle.write(b'\0');handle.flush()
  end=time.monotonic()+timeout
  while True:
   try:
    handle.seek(0)
    if os.name=='nt':
     import msvcrt
     msvcrt.locking(handle.fileno(),msvcrt.LK_NBLCK,1)
    else:
     import fcntl
     fcntl.flock(handle.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
    locked=True;break
   except OSError:
    if time.monotonic()>=end:raise TimeoutError('Another voice builder owns this batch manifest') from None
    time.sleep(.05)
  yield
 finally:
  try:
   if locked:
    handle.seek(0)
    if os.name=='nt':
     import msvcrt
     msvcrt.locking(handle.fileno(),msvcrt.LK_UNLCK,1)
    else:
     import fcntl
     fcntl.flock(handle.fileno(),fcntl.LOCK_UN)
  finally:handle.close()


def atomic_manifest(path,data):
 if path.exists() and read(path).get('batchFingerprint')!=data['batchFingerprint']:
  raise FileExistsError('Different batch fingerprint; select a new script manifest and output root')
 tmp=None
 try:
  with tempfile.NamedTemporaryFile(mode='w',encoding='utf-8',dir=path.parent,
        prefix=path.name+'.',suffix='.tmp',delete=False) as handle:
   tmp=Path(handle.name);json.dump(data,handle,ensure_ascii=False,indent=2)
   handle.write('\n');handle.flush();os.fsync(handle.fileno())
  os.replace(tmp,path)
 finally:
  if tmp and tmp.exists():tmp.unlink()


def source_pool(hiplab,pilot_root,pilot_manifest):
 """Verify public source bindings; rate is part of every lookup key."""
 pool={};sources={}
 def add(lang,voice,rate,text,path,source,key,expected=None):
  if not path.is_file():return
  digest=sha(path)
  if expected is not None and digest!=expected:raise ValueError(f'Source SHA mismatch: {path}')
  pool.setdefault((lang,voice,rate,text),{'path':path,'sha256':digest,'source':source,'key':key})
 if pilot_manifest.is_file():
  manifest=read(pilot_manifest);sources['pilotManifestSha256']=sha(pilot_manifest)
  for action,record in list(manifest.get('actions',{}).items())+[('common',manifest.get('sharedVocabulary',{}))]:
   for lang,lines in record.get('lines',{}).items():
    profile=manifest['voiceProfile'][lang]
    for key,item in lines.items():
     if item.get('status')=='passed':
      ref=item['ref'];add(lang,profile['voice'],profile['rate'],item['text'],under(pilot_root,ref['path']),
         'approved-pilot',action+'/'+key,ref['sha256'])
 build=hiplab/'tools/voice/build_voice.py';audit=hiplab/'tools/voice/audit_voice.py'
 pin(build,PINS['hiplabBuild']);pin(audit,PINS['hiplabAudit'])
 rates=None
 for node in ast.parse(build.read_text(encoding='utf-8')).body:
  if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='RATE' for t in node.targets):rates=ast.literal_eval(node.value)
 if rates!=RATES:raise ValueError('HipLab source rate differs from pinned profiles')
 path=hiplab/'assets/voice/manifest.json';manifest=read(path);sources['hiplabManifestSha256']=sha(path)
 for key,texts in manifest['lines'].items():
  for lang,text in texts.items():
   add(lang,manifest['voices'][lang],rates[lang],text,hiplab/'assets/voice'/lang/(key+'.m4a'),'HipLab',key)
 return pool,sources


def run(args):
 root=Path(args.root).resolve();script_path=Path(args.script).resolve();output=Path(args.manifest).resolve()
 if output==REPO/'catalog/voice-v2/manifest.json':raise ValueError('Global voice manifest is read-only; choose a batch manifest')
 if root==Path(args.pilot_root).resolve():raise ValueError('Pilot media is read-only; choose a new batch root')
 script=read(script_path);rows=list(entries(script))
 batch_fingerprint=hashlib.sha256(json.dumps({'scriptSha256':sha(script_path),'toolPins':PINS},sort_keys=True).encode()).hexdigest()
 output.parent.mkdir(parents=True,exist_ok=True)
 with batch_lock(output):
  previous=read(output) if output.exists() else {}
  if previous and previous.get('batchFingerprint')!=batch_fingerprint:raise FileExistsError('Existing batch has another fingerprint')
  work=root/'work/voice';work.mkdir(parents=True,exist_ok=True)
  os.environ['TEMP']=os.environ['TMP']=os.environ['TMPDIR']=str(work)
  # A fresh CLI process selects F as its default temp directory. Never monkey
  # patch the imported audio module or tempfile.tempdir, nor another batch.
  if not Path(tempfile.gettempdir()).resolve().is_relative_to(root):
   raise RuntimeError('Run this builder in a fresh process with TEMP/TMP set inside the batch root')
  sys.path.insert(0,str(Path(args.deps_dir).resolve()))
  audio=load_audio();pool,sources=source_pool(Path(args.hiplab).resolve(),Path(args.pilot_root).resolve(),Path(args.pilot_manifest).resolve())
  data={'schema':'pose-hub-voice@2','batchFingerprint':batch_fingerprint,'scriptSha256':sha(script_path),'toolPins':PINS,
   'voices':VOICES,'rates':RATES,'voiceProfile':{lang:{'voice':VOICES[lang],'rate':RATES[lang]} for lang in VOICES},
   'auditStandard':STANDARD,'contentReview':'pending-user-review','manualListening':'pending',
   'actions':{},'sharedVocabulary':{'lines':{}},'networkErrors':[],**sources}
  if 'phaseBindings' in script:data['phaseBindings']=script['phaseBindings']
  jobs=[]
  for action,key,lang,text,relative in rows:
   record=data['sharedVocabulary'] if action=='common' else data['actions'].setdefault(action,{'lines':{}})
   item={'text':text,'role':key.split('.')[0],'status':'pending','ref':None,
     'fingerprint':fingerprint(text,VOICES[lang],RATES[lang])}
   record['lines'].setdefault(lang,{})[key]=item
   oldrecord=previous.get('sharedVocabulary',{}) if action=='common' else previous.get('actions',{}).get(action,{})
   old=oldrecord.get('lines',{}).get(lang,{}).get(key,{})
   if old.get('fingerprint')==item['fingerprint']:
    item.update(old)
   jobs.append((action,key,lang,text,relative,item,old))
  def save():
   states=[item['status'] for *_,item,old in jobs]
   data['summary']={state:states.count(state) for state in ['passed','pending','failed']};data['summary']['total']=len(states)
   for record in list(data['actions'].values())+[data['sharedVocabulary']]:
    record['status']='passed' if all(x['status']=='passed' for lines in record['lines'].values() for x in lines.values()) else 'incomplete'
   atomic_manifest(output,data)
  save()
  async def produce():
   blocked=False
   for action,key,lang,text,relative,item,old in jobs:
    dest=under(root,relative);dest.parent.mkdir(parents=True,exist_ok=True)
    raw=work/'raw'/f'{item["fingerprint"]}.mp3';raw.parent.mkdir(parents=True,exist_ok=True)
    match=pool.get((lang,VOICES[lang],RATES[lang],text))
    try:
     if dest.exists():
      expected=old.get('ref',{}).get('sha256') if old.get('ref') else match.get('sha256') if match else None
      if expected is None or sha(dest)!=expected or old and old.get('fingerprint')!=item['fingerprint']:
       raise FileExistsError(f'Unverified existing batch audio; refusing overwrite: {dest}')
      item['provenance']=old.get('provenance',{})
      if not item['provenance'] and match:
       item['provenance']={'kind':'imported','source':match['source'],'sourceKey':match['key'],
        'sourceSha256':match['sha256'],'sourceVoice':VOICES[lang],'sourceRate':RATES[lang]}
     elif match:
      if sha(match['path'])!=match['sha256']:raise ValueError('Import source changed after inventory')
      partial=dest.with_suffix('.importing.m4a');shutil.copyfile(match['path'],partial)
      if sha(partial)!=match['sha256']:raise ValueError('Imported bytes differ')
      os.replace(partial,dest)
      item['provenance']={'kind':'imported','source':match['source'],'sourceKey':match['key'],
       'sourceSha256':match['sha256'],'sourceVoice':VOICES[lang],'sourceRate':RATES[lang]}
     elif args.synthesize and not blocked:
      import edge_tts
      if not raw.exists():
       for attempt in range(args.attempts):
        partial=raw.with_suffix('.partial.mp3')
        try:
         await asyncio.wait_for(edge_tts.Communicate(text,VOICES[lang],rate=RATES[lang]).save(str(partial)),40)
         if not partial.is_file() or partial.stat().st_size==0:raise ValueError('TTS returned empty audio')
         os.replace(partial,raw);break
        except Exception as error:
         if partial.exists():partial.unlink()
         data['networkErrors'].append({'actionId':action,'lineId':key,'lang':lang,'attempt':attempt+1,'type':type(error).__name__,'error':str(error)})
         if attempt+1==args.attempts:blocked=True
         else:await asyncio.sleep(2)
      if not raw.exists():item['pendingReason']='TTS failed; further network calls stopped';save();continue
      partial=dest.with_suffix('.processing.m4a');audio._process(raw,partial);os.replace(partial,dest)
      item['provenance']={'kind':'new-text-or-translation','review':'pending-user-review','voice':VOICES[lang],
       'rate':RATES[lang],'rawSha256':sha(raw)}
     else:
      item['pendingReason']='No exact text/voice/rate source; synthesis disabled or stopped after network failure';save();continue
     decoded=audio.decode(dest);result=audio.audit_clip(dest,text,lang,round(len(decoded)/audio.SR*1000),raw if raw.exists() else None)
     result['rawComparison']=raw.is_file();item['audit']=result
     item['ref']={'root':'media','path':relative,'sha256':sha(dest),'bytes':dest.stat().st_size,
      'durationSeconds':round(len(decoded)/audio.SR,6),'sampleRate':audio.SR,'channels':1,'codec':'aac'}
     item['status']='failed' if result['fails'] else 'passed'
     if item['status']=='passed':pool.setdefault((lang,VOICES[lang],RATES[lang],text),
        {'path':dest,'sha256':item['ref']['sha256'],'source':'same-batch','key':action+'/'+key})
    except FileExistsError:
     raise
    except Exception as error:
     item['status']='failed';item['audit']={'fails':[f'{type(error).__name__}: {error}'],'rawComparison':False}
    save()
    print(json.dumps({'actionId':action,'lineId':key,'lang':lang,'status':item['status']},ensure_ascii=False),flush=True)
  asyncio.run(produce());save()
  print(json.dumps({'manifest':str(output),'summary':data['summary'],'networkErrors':data['networkErrors']},ensure_ascii=False))
  return 0 if data['summary']['passed']==len(jobs) else 1


def main():
 parser=argparse.ArgumentParser(description=__doc__)
 for key in ['script','manifest','root','hiplab']:parser.add_argument('--'+key,required=True)
 parser.add_argument('--pilot-root',default='F:/PoseHub-v2-pilot')
 parser.add_argument('--pilot-manifest',default=str(REPO/'catalog/voice-v2/manifest.json'))
 parser.add_argument('--deps-dir',default='F:/PoseHub-v2-pilot/work/python-deps')
 parser.add_argument('--synthesize',action='store_true')
 parser.add_argument('--attempts',type=int,choices=[1,2],default=1)
 return run(parser.parse_args())
if __name__=='__main__':raise SystemExit(main())
