"""Generate a local review page for exactly one batch; never grants approval.

python tools/action-library-v2/gallery.py --batch catalog/v2/batches/b001.json \
  --root F:/PoseHub-v2-production/batches/b001 \
  --voice-manifest catalog/voice-v2/batches/b001-manifest.json

Missing videos or voice clips are shown as pending. Generation does not play
audio, render media, import catalog changes or modify existing media files.
"""
from __future__ import annotations
import argparse
import html
import json
from pathlib import Path
import re
from urllib.parse import quote

REPO=Path(__file__).resolve().parents[2]
SKINS=['realistic','tech-white','neon-night','neon-night-b','hologram']
SKIN_NAMES={'realistic':'原型原配色','tech-white':'白金','neon-night':'蓝色','neon-night-b':'绿色','hologram':'全息'}
LINES={'name':'动作名','primaryCue':'主要点','phase.start':'起始引导','phase.peak':'到位引导','phase.end':'回程引导'}


def read(path):return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def media_url(root,ref):
 """Only existing files inside this batch root can become media URLs."""
 if not isinstance(ref,dict) or ref.get('root','media')!='media':return None
 relative=ref.get('path')
 if not isinstance(relative,str) or not relative or '\\' in relative or ':' in relative:return None
 path=Path(relative)
 if path.is_absolute() or '..' in path.parts:return None
 target=(root/path).resolve()
 if not target.is_relative_to(root.resolve()) or not target.is_file():return None
 return quote(path.as_posix(),safe='/._-')


def build_data(batch_path,root,voice_manifest=None):
 root=Path(root).resolve();batch=read(batch_path)
 if batch.get('format')!='pose-hub-v2-production-batch@1':raise ValueError('Unknown batch format')
 batch_id=batch.get('id')
 if not isinstance(batch_id,str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*',batch_id):raise ValueError('Invalid batch ID')
 ids=[action.get('id') for action in batch.get('actions',[])]
 if not ids or len(ids)!=len(set(ids)) or any(not isinstance(aid,str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*',aid) for aid in ids):
  raise ValueError('Batch actions must be unique safe IDs')
 if batch.get('skins',SKINS)!=SKINS:raise ValueError('Expected the five approved skins')
 source=root/'manifests/derivatives.json';derived=read(source) if source.is_file() else {}
 voice_path=Path(voice_manifest).resolve() if voice_manifest else REPO/'catalog/voice-v2/batches'/f'{batch_id}-manifest.json'
 voice=read(voice_path) if voice_path.is_file() else {}
 selected={}
 for variant in derived.get('variants',[]):
  key=(variant.get('actionId'),variant.get('skin'),variant.get('theme'))
  if key[0] not in ids or key[1] not in SKINS or key[2] not in ('light','dark'):continue
  if key in selected and selected[key]!=variant:raise ValueError(f'Conflicting variants for {key}')
  selected[key]=variant
 variants=[]
 for (aid,skin,theme),variant in selected.items():
  video=variant.get('video',{});video_relative=video.get('path','')
  off={'root':'media','path':str(Path(video_relative).parent/'comparison.off.720.png').replace('\\','/')}
  peak=next((x.get('asset') for x in variant.get('keyframes',[]) if x.get('phase')=='peak'),None)
  enabled=variant.get('highlight',{}).get('enabled') is True
  variants.append({'actionId':aid,'skin':skin,'theme':theme,'video':media_url(root,video),
   'cover':media_url(root,variant.get('cover')),'peakOn':media_url(root,peak or variant.get('cover')) if enabled else None,
   'peakOff':media_url(root,variant.get('comparisonOff',off)),'highlightEnabled':enabled})
 actions=[]
 for aid in ids:
  # No glob: an unrelated pilot/global action must never create a card.
  path=REPO/'catalog/v2/actions'/f'{aid}.json';package=read(path) if path.is_file() else {}
  name=package.get('definition',{}).get('name',{})
  lines={}
  for lang in ('zh','en'):
   lines[lang]={}
   source_lines=voice.get('actions',{}).get(aid,{}).get('lines',{}).get(lang,{})
   for key in LINES:
    item=source_lines.get(key,{})
    lines[lang][key]={'text':item.get('text'),'status':item.get('status','pending'),
     'url':media_url(root,item.get('ref'))}
  actions.append({'id':aid,'name':{'zh':name.get('zh',aid),'en':name.get('en','')},'voice':lines})
 return {'batchId':batch_id,'actions':actions,'skins':[{'id':skin,'name':SKIN_NAMES[skin]} for skin in SKINS],
  'themes':['light','dark'],'lineLabels':LINES,'variants':variants,
  'readyVideos':sum(bool(v['video']) for v in variants),'expectedVideos':len(ids)*len(SKINS)*2,
  'mosaic':media_url(root,{'root':'media','path':'previews/action-skin-theme-highlight-mosaic.png'}),
  'contentReview':voice.get('contentReview','pending'),'manualListening':voice.get('manualListening','pending')}


def render_html(data):
 title=f'Pose-Hub · {data["batchId"]} · {len(data["actions"])} 动作样片'
 return HTML.replace('__TITLE__',html.escape(title)).replace('__DATA__',json.dumps(data,ensure_ascii=False).replace('</','<\\/'))


HTML='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>__TITLE__</title><link rel="icon" href="data:,">
<style>
:root{font-family:system-ui,"Microsoft YaHei",sans-serif;color:#ecedf1;background:#12151b;color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:36px;max-width:1700px;margin:auto}h1{font-size:28px;margin:6px 0}p{color:#adb4c2;line-height:1.65}.bar{display:flex;gap:20px;align-items:center;flex-wrap:wrap;padding:20px 0;position:sticky;top:0;background:#12151bf5;z-index:5}select{font:inherit;border:1px solid #3d4759;border-radius:6px;padding:8px;background:#202733;color:inherit}a{color:#9bd4ff}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.card{border:1px solid #303746;border-radius:12px;background:#1a202a;padding:18px;min-width:0}.card h2{font-size:19px;margin:0 0 4px}.id{font-family:monospace;color:#97a3b8;font-size:12px}video{width:100%;aspect-ratio:1;display:block;margin:16px 0 8px;background:#101013;border-radius:6px}.compare{display:grid;grid-template-columns:1fr 1fr;gap:8px}figure{margin:0}figure img{display:block;width:100%;aspect-ratio:1;object-fit:contain;background:#101013;border-radius:4px}figcaption{color:#b5becd;font-size:12px;margin:5px 0 12px}.voice{display:flex;gap:8px;align-items:center;margin-top:8px}.voice audio{width:100%;height:32px}.voice select{font-size:12px;max-width:42%}.badge{display:inline-block;border:1px solid #786238;color:#f3dca4;border-radius:20px;padding:4px 10px;font-size:12px}.note,.pending{font-size:13px;color:#b1bac9}.foot{border-top:1px solid #303746;margin-top:28px;padding-top:18px}[hidden]{display:none!important}@media(max-width:1100px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){body{padding:18px}.grid{grid-template-columns:1fr}.bar{gap:10px}}
</style>
<span class="badge">本批样片审阅 · 尚未发布</span><h1 id="title"></h1>
<p>原型原配色、白金、蓝色、绿色、全息共五套。选择背景查看循环视频及同一顶峰帧的高亮开关对照；未制作完成的素材会明确显示待制。</p>
<p class="note" id="progress"></p>
<div class="bar"><label>皮肤 <select id="skin"></select></label><label>背景 <select id="theme"><option value="light">浅色</option><option value="dark">深色</option></select></label><a id="mosaic" target="_blank" hidden>本批完整拼图</a></div>
<div class="grid" id="grid"></div>
<div class="foot"><p>循环视频无音轨，中英语音为独立文件，播放需手动点击。相位引导句是候选提示；消费端须按完整句时长安排，不能在短相位结束时截断。</p><p>技术检测不代替人工看样、文案确认与试听；本页不授予发布、合并或上传批准。</p></div>
<script>const data=__DATA__;
document.querySelector('#title').textContent=data.batchId+' · '+data.actions.length+' 个动作样片';
document.querySelector('#progress').textContent='可审阅视频：'+data.readyVideos+' / '+data.expectedVideos+'；文案确认：'+data.contentReview+'；人工试听：'+data.manualListening;
const grid=document.querySelector('#grid'),skinSelect=document.querySelector('#skin');
for(const skin of data.skins){const option=document.createElement('option');option.value=skin.id;option.textContent=skin.name;skinSelect.append(option)}
const mosaic=document.querySelector('#mosaic');if(data.mosaic){mosaic.href=data.mosaic;mosaic.hidden=false}
function setImage(image,url,caption,title){if(url){image.src=url;image.hidden=false;caption.textContent=title}else{image.removeAttribute('src');image.hidden=true;caption.textContent=title+' · 待制'}}
for(const action of data.actions){const card=document.createElement('section');card.className='card';card.dataset.id=action.id;
card.innerHTML='<h2></h2><div class="id"></div><video controls loop muted playsinline preload="metadata"></video><p class="note video-status"></p><div class="compare"><figure><img class="off" alt="高亮关闭的顶峰关键帧"><figcaption class="off-caption"></figcaption></figure><figure><img class="on" alt="高亮开启的同一顶峰关键帧"><figcaption class="on-caption"></figcaption></figure></div><div class="voices"></div>';
card.querySelector('h2').textContent=action.name.zh;card.querySelector('.id').textContent=action.id+' / '+action.name.en;
for(const lang of ['zh','en']){const row=document.createElement('div');row.className='voice';const label=document.createElement('span');label.textContent=lang==='zh'?'中':'EN';const select=document.createElement('select');for(const [key,title]of Object.entries(data.lineLabels)){const option=document.createElement('option');option.value=key;option.textContent=title;select.append(option)}const audio=document.createElement('audio');audio.controls=true;audio.preload='none';const pending=document.createElement('span');pending.className='pending';function change(){const line=action.voice[lang][select.value];audio.pause();if(line&&line.url){audio.src=line.url;audio.title=line.text||'';audio.hidden=false;pending.textContent=''}else{audio.removeAttribute('src');audio.load();audio.hidden=true;pending.textContent='语音待制'}}select.onchange=change;change();row.append(label,select,audio,pending);card.querySelector('.voices').append(row)}grid.append(card)}
function refresh(){const skin=skinSelect.value,theme=document.querySelector('#theme').value;for(const card of grid.children){const variant=data.variants.find(v=>v.actionId===card.dataset.id&&v.skin===skin&&v.theme===theme);const video=card.querySelector('video');video.pause();if(variant&&variant.video){video.src=variant.video;video.hidden=false;if(variant.cover)video.poster=variant.cover;else video.removeAttribute('poster');card.querySelector('.video-status').textContent='循环样片 · 高亮'+(variant.highlightEnabled?'开':'关')}else{video.removeAttribute('src');video.removeAttribute('poster');video.load();video.hidden=true;card.querySelector('.video-status').textContent='该皮肤与背景的视频待制'}setImage(card.querySelector('.off'),variant&&variant.peakOff,card.querySelector('.off-caption'),'高亮关 · 顶峰关键帧');setImage(card.querySelector('.on'),variant&&variant.peakOn,card.querySelector('.on-caption'),'高亮开 · 同一关键帧')}}
skinSelect.onchange=refresh;document.querySelector('#theme').onchange=refresh;refresh();
</script></html>'''


def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--batch',required=True,type=Path)
 parser.add_argument('--root',required=True,type=Path)
 parser.add_argument('--voice-manifest',type=Path)
 args=parser.parse_args();root=args.root.resolve()
 data=build_data(args.batch,root,args.voice_manifest)
 root.mkdir(parents=True,exist_ok=True)
 target=root/'index.html';target.write_text(render_html(data),encoding='utf-8');print(target)
if __name__=='__main__':main()
