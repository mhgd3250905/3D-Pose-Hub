"""Build a whole-library viewing index from actual local assets; no approval."""
from __future__ import annotations
import argparse
import html
import json
import os
from pathlib import Path
import time
from urllib.parse import quote

REPO = Path(__file__).resolve().parents[2]
SKINS = ['realistic', 'tech-white', 'neon-night', 'neon-night-b', 'hologram']


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def atomic(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + f'.{os.getpid()}.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, path)


def url(review_root, media_root, ref, public_prefix=None):
    if not isinstance(ref, dict) or ref.get('root') != 'media':
        return None
    relative = ref.get('path', '')
    if not relative or ':' in relative or '\\' in relative:
        return None
    target = (media_root / relative).resolve()
    if not target.is_relative_to(media_root.resolve()) or not target.is_file():
        return None
    if public_prefix:
        return public_prefix + quote(Path(relative).as_posix(), safe='/._-')
    return quote(Path(os.path.relpath(target, review_root)).as_posix(), safe='/._-')


def build(production, pilot, draft):
    plan = read(REPO / 'catalog/v2/production-plan.json')
    target = production / 'review'
    def asset(root, ref):
        # The accepted pilot already has its own loopback-only server. The
        # production HTTP root cannot serve a relative path outside itself.
        prefix = 'http://127.0.0.1:8876/' + quote(pilot.name) + '/' if root == pilot else None
        return url(target, root, ref, prefix)
    reused = {aid: pilot for aid in plan['reusedPilot']['actions']}
    for batch in plan['batches']:
        root = batch.get('root', {})
        if root.get('alias') == 'production':
            for aid in batch['actions']:
                reused[aid] = production / root['relativePath']
    inventory_path = production / 'planning/draft-first-source-inventory-r1.json'
    if (production / 'planning/draft-first-source-inventory-r2.json').is_file():
        inventory_path = production / 'planning/draft-first-source-inventory-r2.json'
    inventory = read(inventory_path) if inventory_path.exists() else {'actions': []}
    info = {item['id']: item for item in inventory['actions']}
    run_status_path = draft / 'manifests/draft-run-status.json'
    run_status = read(run_status_path) if run_status_path.is_file() else {}
    ids = sorted(set(plan['reusedPilot']['actions']) | {aid for b in plan['batches'] for aid in b['actions']})
    manifests = {}
    for root in set(reused.values()) | {draft}:
        path = root / 'manifests/derivatives.json'
        manifests[root] = read(path) if path.is_file() else {}
    legacy = read(REPO / 'catalog/catalog.json')
    names = {item['id']: item.get('name', {}) for item in legacy.get('drills', [])}
    cards = []
    for aid in ids:
        roots = [draft, reused.get(aid)]
        variants = []
        chosen = None
        for root in roots:
            if root is None:
                continue
            for variant in manifests.get(root, {}).get('variants', []):
                if variant.get('actionId') != aid:
                    continue
                video = asset(root, variant.get('video'))
                if not video:
                    continue
                video_path = Path(variant['video']['path'])
                off = {'root': 'media', 'path': (video_path.parent / 'comparison.off.720.png').as_posix()}
                peak = next((f['asset'] for f in variant.get('keyframes', []) if f['phase'] == 'peak'), None)
                variants.append({'skin': variant['skin'], 'theme': variant['theme'], 'video': video,
                                 'cover': asset(root, variant.get('cover')),
                                 'on': asset(root, peak), 'off': asset(root, off)})
            if len(variants) == 10:
                chosen = root
                break
            if variants:
                chosen = root
                break
        package_path = REPO / 'catalog/v2/actions' / f'{aid}.json'
        package = read(package_path) if package_path.exists() else {}
        name = package.get('definition', {}).get('name') or names.get(aid) or {}
        if isinstance(name, str):
            name = {'zh': name}
        full = any(root is not None and (root / 'manifests/completed' / f'full-{aid}.json').is_file()
                   for root in roots)
        started = (draft / 'masters/realistic' / aid / 'source-manifest.json').is_file()
        state = ('ready' if len(variants) == 10 else 'composing' if full or variants
                 else 'failed' if run_status.get('failedActionId') == aid
                 else 'rendering' if started else 'pending')
        mosaic = None
        if chosen:
            specific = f'previews/action-skin-theme-highlight-mosaic.{aid}.png'
            mosaic = asset(chosen, {'root': 'media', 'path': specific})
        cards.append({'id': aid, 'name': name.get('zh', aid), 'state': state, 'variants': variants,
                      'knownIssues': info.get(aid, {}).get('knownIssues', []), 'mosaic': mosaic,
                      'userReview': 'pending'})
    data = {'format': 'pose-hub-library-viewing-index@1', 'target': len(ids),
            'readyActions': sum(c['state'] == 'ready' for c in cards),
            'availableVideos': sum(len(c['variants']) for c in cards),
            'reviewed': False, 'releaseEligible': False,
            'updated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'actions': cards}
    atomic(target / 'status.json', data)
    target.mkdir(parents=True, exist_ok=True)
    page = target / 'index.html'
    if not page.exists() or page.read_text(encoding='utf-8') != PAGE:
        page.write_text(PAGE, encoding='utf-8')
    return data


PAGE = r'''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pose-Hub 全库看样</title><link rel="icon" href="data:,">
<style>:root{font-family:system-ui,"Microsoft YaHei",sans-serif;background:#14181f;color:#e6eaf0;color-scheme:dark}body{max-width:1600px;margin:auto;padding:28px}h1{font-size:28px}p{color:#aeb7c5;line-height:1.7}button,input,select,textarea{font:inherit;background:#222b38;color:inherit;border:1px solid #495467;border-radius:6px;padding:8px}button{cursor:pointer}a{color:#a0d8ff}.bar{display:flex;gap:12px;flex-wrap:wrap;align-items:center;position:sticky;top:0;background:#14181ff5;padding:16px 0;z-index:2}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.card{border:1px solid #354050;background:#1b222d;border-radius:12px;padding:16px;min-width:0}h2{font-size:18px;margin:0 0 6px}.id{color:#9facbf;font:13px monospace}video{width:100%;aspect-ratio:1;background:#101013;margin-top:12px;border-radius:6px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}figure{margin:0}img{width:100%;aspect-ratio:1;object-fit:contain}figcaption{font-size:12px;color:#aeb7c5}textarea{width:100%;box-sizing:border-box;margin-top:12px}summary{font-size:13px;color:#aeb7c5;cursor:pointer}.badge{font-size:12px;color:#f2d094}#pages{margin:18px 0;display:flex;gap:12px;align-items:center}[hidden]{display:none!important}@media(max-width:1000px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){body{padding:14px}.grid{grid-template-columns:1fr}}</style>
<span class="badge">第一版 · 等待你看样</span><h1>新人体模型 · 全库看样</h1><p>先完成全库，再按你的反馈修正。母版为透明分层，下面的深浅背景由脚本合成。可以直接告诉我动作 ID 和问题，或在卡片记下反馈后导出。草稿尚未验收、合并或发布。</p><p id="progress">读取中…</p>
<div class="bar"><input id="q" placeholder="搜索动作名 / ID"><select id="state"><option value="ready">可看样</option><option value="all">全部动作</option><option value="feedback">已有我的反馈</option></select><select id="skin"><option value="realistic">原型原配色</option><option value="tech-white">白金</option><option value="neon-night">蓝色</option><option value="neon-night-b">绿色</option><option value="hologram">全息</option></select><select id="theme"><option value="light">浅色</option><option value="dark">深色</option></select><button id="reload">刷新样片</button><button id="export">导出我的反馈</button></div><div id="pages"></div><div class="grid" id="grid"></div>
<script>
let data={actions:[]},page=0;const size=18,$=s=>document.querySelector(s),key='pose-hub-v2-review-feedback-r1';let feedback={};try{feedback=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
function filtered(){const q=$('#q').value.trim().toLowerCase(),state=$('#state').value;return data.actions.filter(a=>(a.id+' '+a.name).toLowerCase().includes(q)&&(state==='all'||(state==='feedback'?Boolean(feedback[a.id]):a.state==='ready')))}
function render(){const list=filtered(),count=Math.max(1,Math.ceil(list.length/size));page=Math.min(page,count-1);$('#pages').replaceChildren();for(const [label,fn] of [['上一页',()=>{page=Math.max(0,page-1);render()}],[`${page+1} / ${count} · ${list.length} 个动作`,null],['下一页',()=>{page=Math.min(count-1,page+1);render()}]]){const el=document.createElement(fn?'button':'span');el.textContent=label;if(fn)el.onclick=fn;$('#pages').append(el)}$('#grid').replaceChildren();for(const a of list.slice(page*size,(page+1)*size)){const card=document.createElement('section');card.className='card';const title=document.createElement('h2');title.textContent=a.name;const id=document.createElement('div');id.className='id';id.textContent=a.id+' · '+({ready:'待你审核',composing:'正在合成',rendering:'正在渲染',failed:'制作中断 · 待处理',pending:'待制作'}[a.state]||a.state);card.append(title,id);const v=a.variants.find(v=>v.skin===$('#skin').value&&v.theme===$('#theme').value);if(v){const video=document.createElement('video');video.controls=true;video.loop=true;video.muted=true;video.playsInline=true;video.preload='none';video.src=v.video;if(v.cover)video.poster=v.cover;card.append(video);const pair=document.createElement('div');pair.className='pair';for(const [url,label]of [[v.off,'高亮关 · 顶峰'],[v.on,'高亮开 · 同一顶峰']]){const fig=document.createElement('figure'),img=document.createElement('img'),cap=document.createElement('figcaption');if(url)img.src=url;img.loading='lazy';img.alt=label;cap.textContent=label;fig.append(img,cap);pair.append(fig)}card.append(pair)}if(a.mosaic){const link=document.createElement('a');link.href=a.mosaic;link.target='_blank';link.textContent='本动作全部皮肤 / 背景 / 高亮对照';card.append(link)}if(a.knownIssues.length){const d=document.createElement('details'),s=document.createElement('summary'),p=document.createElement('p');s.textContent='制作记录 · 待你判断';p.textContent=a.knownIssues.join('\n');d.append(s,p);card.append(d)}const notes=document.createElement('textarea');notes.rows=2;notes.placeholder='例如：2 秒处右手穿进腹部';notes.value=feedback[a.id]||'';notes.oninput=()=>{feedback[a.id]=notes.value;localStorage.setItem(key,JSON.stringify(feedback))};card.append(notes);$('#grid').append(card)}}
async function refresh(rebuild=true){try{const r=await fetch('status.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error(r.status);data=await r.json();$('#progress').textContent='可看样：'+data.readyActions+' / '+data.target+' 个动作；五套皮肤 × 深浅色视频：'+data.availableVideos+' 份。更新时间：'+new Date(data.updated).toLocaleString();if(rebuild)render()}catch(e){$('#progress').textContent='暂时无法读取制作进度，请稍后刷新。'}}
for(const id of ['q','state','skin','theme'])$('#'+id).oninput=()=>{page=0;render()};$('#reload').onclick=()=>refresh();$('#export').onclick=()=>{const items=Object.entries(feedback).filter(([id,note])=>note.trim()).map(([actionId,note])=>({actionId,note}));const blob=new Blob([JSON.stringify({format:'pose-hub-user-review-feedback@1',created:new Date().toISOString(),items},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='pose-hub-review-feedback.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};refresh();setInterval(()=>refresh(false),30000);
</script></html>'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--production-root', type=Path, required=True)
    parser.add_argument('--pilot-root', type=Path, required=True)
    parser.add_argument('--draft-root', type=Path, required=True)
    parser.add_argument('--watch', action='store_true')
    args = parser.parse_args()
    while True:
        try:
            data = build(args.production_root.resolve(), args.pilot_root.resolve(), args.draft_root.resolve())
        except (OSError, ValueError) as error:
            if not args.watch:
                raise
            print('Viewing index refresh deferred: ' + str(error), flush=True)
            time.sleep(20)
            continue
        if not args.watch:
            print(json.dumps({k: data[k] for k in ('target', 'readyActions', 'availableVideos')}, ensure_ascii=False))
            break
        time.sleep(20)


if __name__ == '__main__':
    main()
