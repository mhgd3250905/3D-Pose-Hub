"""Build an auditable review index from completed captures; never imply approval."""
import argparse,json,html
from pathlib import Path

def build(root,recipes):
    cards=[];entries=[]
    overrides=json.loads((recipes/'review-overrides.json').read_text(encoding='utf-8')).get('actions',{}) if (recipes/'review-overrides.json').exists() else {}
    for group in ['gap','home','thomas']:
        for file in sorted((recipes/'groups'/group).glob('*.json')):
            recipe=json.loads(file.read_text(encoding='utf-8'))
            if not isinstance(recipe,dict) or recipe.get('format')!='pose-hub-action-recipe@1' or recipe.get('templateReview',{}).get('status')=='accepted':continue
            action=recipe['id'];attempts=sorted((root/action).glob('*/capture.json'))
            complete=[p for p in attempts if json.loads(p.read_text(encoding='utf-8')).get('complete') and (p.parent/'review/preview.mp4').exists()]
            title=html.escape(recipe.get('nameZh',action));group_name={'gap':'新增补齐','home':'居家动作','thomas':'支撑与专项'}[group]
            if not complete:
                cards.append(f'<article data-group="{group}" data-title="{title} {action}"><h2>{title}</h2><p class="issue">预览未完成，见问题清单</p></article>');entries.append({'id':action,'complete':False});continue
            cap=complete[-1];d=json.loads(cap.read_text(encoding='utf-8'));rel=cap.parent.relative_to(root).as_posix()
            triage=json.loads((cap.parent/'triage.json').read_text(encoding='utf-8')) if (cap.parent/'triage.json').exists() else {'flags':[]}
            visual_file=cap.parent/'visual-review.json';visual=json.loads(visual_file.read_text(encoding='utf-8')) if visual_file.exists() else None
            notes=visual.get('userNotes',visual.get('userNotesChinese',[])) if visual else []
            state='待你验收' if visual and visual.get('passedAsCandidate') else '正在复核'
            override=overrides.get(action)
            if override and not override.get('resolved'):
                state='需修正';notes=[override['reason']]+notes
            approval=(override or {}).get('upperArmReview', {})
            if approval.get('status')=='accepted' and approval.get('attempt')==cap.parent.name:
                state='大臂 r3 已确认收尾 · 其他项目按各自记录'
                notes=['大臂连续轮廓已确认；轻微表面波纹保留，当前版不再修整。']
            note_html=''.join('<p class="issue">'+html.escape(n)+'</p>' for n in notes)
            cards.append(f'''<article data-group="{group}" data-title="{title} {action}"><div class="meta">{group_name} · {state}</div><h2>{title}</h2><video controls loop muted playsinline preload="none" poster="{rel}/main/main-0000.png" src="{rel}/review/preview.mp4"></video><div class="buttons"><button onclick="speed(this,.5)">半速</button><button onclick="speed(this,1)">正常</button></div>{note_html}<details><summary>关键帧与辅助视角</summary><img loading="lazy" src="{rel}/review/contact-sheet.jpg"><img loading="lazy" src="{rel}/review/side-check.jpg"></details><small>{action}</small></article>''')
            entries.append({'id':action,'group':group,'nameZh':recipe.get('nameZh',action),'complete':True,'capture':str(cap),'triage':triage,'visualReview':visual,'upperArmReview':approval,'reviewed':False,'releaseEligible':False})
    count=sum(e['complete'] for e in entries)
    page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>剩余30动作 · 第一版验收</title><style>*{box-sizing:border-box}body{margin:0;background:#f5f6f8;color:#233146;font:15px/1.6 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1440px;margin:auto;padding:26px}h1{font-size:27px}p.sub,.meta,small{color:#69778b}.filters{display:flex;gap:12px;flex-wrap:wrap;position:sticky;top:0;background:#f5f6f8ee;padding:14px 0;z-index:2}input,select,button{padding:8px 12px;border:1px solid #d5dce6;background:white;border-radius:7px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:20px}article{background:white;border:1px solid #e1e5eb;border-radius:14px;padding:18px}h2{font-size:18px;margin:6px 0 12px}video{display:block;width:100%;background:#edf0f4;border-radius:8px}img{width:100%}.buttons{display:flex;gap:8px;margin:10px 0}details{margin:12px 0}summary{cursor:pointer}.issue{color:#94601d;background:#fff6e5;padding:8px;border-radius:6px}article[hidden]{display:none}</style><main>'''
    page+=f'<h1>剩余 30 个动作 · 第一版验收</h1><p class="sub">低清预览已完成 {count}/30 · 此前 2 个动作模板已通过<br>当前确认动作、手型与镜头；颜色和材质可后选。正式高清素材最后统一制作。</p>'
    if (root/'feedback-20261029/index.html').exists():
        page+='<p><a href="feedback-20261029/index.html">查看本轮反馈修订：手型、脚踝与肘部对照</a></p>'
    page+='''<div class="filters"><input id="search" placeholder="搜索动作名称" oninput="filter()"><select id="group" onchange="filter()"><option value="">全部动作</option><option value="gap">新增补齐</option><option value="home">居家动作</option><option value="thomas">支撑与专项</option></select><button onclick="document.querySelectorAll('video').forEach(v=>v.pause())">全部暂停</button></div><div class="grid">'''+''.join(cards)+'''</div></main><script>function speed(b,s){let v=b.closest('article').querySelector('video');v.playbackRate=s;v.play()}function filter(){let q=document.querySelector('#search').value.toLowerCase(),g=document.querySelector('#group').value;document.querySelectorAll('article').forEach(a=>{a.hidden=!!((g&&a.dataset.group!==g)||!a.dataset.title.toLowerCase().includes(q));if(a.hidden)a.querySelector('video')?.pause()})}document.addEventListener('play',e=>{if(e.target.tagName==='VIDEO')document.querySelectorAll('video').forEach(v=>{if(v!==e.target)v.pause()})},true)</script></html>'''
    (root/'index.html').write_text(page,encoding='utf-8')
    (root/'review-index.json').write_text(json.dumps({'format':'pose-hub-template-review-index@1','requested':30,'complete':count,'reviewed':False,'releaseEligible':False,'actions':entries},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'previewCount':count,'total':30,'index':str(root/'index.html')}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('root',type=Path);p.add_argument('recipes',type=Path);args=p.parse_args();build(args.root,args.recipes)
