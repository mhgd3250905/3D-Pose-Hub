"""Build current 32-template review state without upgrading incomplete evidence."""
import hashlib
import html
import json
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
RECIPES = REPO/'catalog/production/remaining32-r4'
OUT = Path('F:/PoseHub-v2-production/template-finalization-20261029')
read = lambda p: json.loads(p.read_text(encoding='utf-8-sig'))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def resolve_rotation_advisories(folder, flags):
    """Keep hard failures; only a separately evidenced path review may close an advisory."""
    file = folder/'technical-review.json'
    if not file.exists():
        return flags, []
    review = read(file)
    valid = (review.get('captureSha256') == sha(folder/'capture.json')
             and review.get('triageSha256') == sha(folder/'triage.json')
             and review.get('rotationPathSha256') == sha(folder/'rotation-path.json')
             and review.get('userAccepted') is False
             and bool(review.get('viewed'))
             and all((folder/v['path']).is_file() and sha(folder/v['path']) == v['sha256']
                     for v in review.get('viewed', [])))
    if not valid:
        return flags, []
    paths = read(folder/'rotation-path.json')['tracks']
    resolved = []
    for item in review.get('adjudications', []):
        flag = item.get('flag')
        if not isinstance(flag, dict):
            continue
        track = paths.get(flag.get('channel'), {})
        if (flag in flags and flag.get('kind') == 'cumulative-relative-rotation-review'
                and item.get('decision') == 'reviewed-return-motion'
                and isinstance(item.get('reason'), str) and len(item['reason']) >= 40
                and track.get('maxAdjacentShortestDeg', 999) <= 35
                and track.get('endpointShortestDeg', 999) <= 5
                and abs(track.get('totalAngularTravelDeg', -999)-flag['degrees']) < 1e-7):
            resolved.append(flag)
    return [f for f in flags if f not in resolved], resolved


def build():
    rows, cards = [], []
    issue_file=OUT/'qa/known-issues-r2.json'
    known_issues=read(issue_file).get('issues',[]) if issue_file.exists() else []
    for file in sorted((RECIPES/'groups').glob('*/*.json')):
        recipe = read(file)
        action = recipe['id']
        attempts = sorted((OUT/'captures'/action).glob('attempt*'))
        ready = [p for p in attempts if (p/'capture.json').exists() and read(p/'capture.json').get('complete')]
        row = {'id': action, 'name': recipe['nameZh'], 'recipeSha256':sha(file),
               'status':'pending', 'userReviewed':False, 'releaseEligible':False}
        body = '<p>等待修正或复核预览</p>'
        if ready:
            folder = ready[-1]
            capture = read(folder/'capture.json')
            flags = read(folder/'triage.json').get('flags',[]) if (folder/'triage.json').exists() else [{'kind':'triage-missing'}]
            raw_flags = flags[:]
            flags, resolved_flags = resolve_rotation_advisories(folder, flags)
            visual = read(folder/'visual-review.json') if (folder/'visual-review.json').exists() else {}
            matches = capture.get('recipeSha256') == row['recipeSha256']
            reviewed = (visual.get('passedAsCandidate') is True
                        and visual.get('captureSha256') == sha(folder/'capture.json')
                        and visual.get('recipeSha256') == row['recipeSha256']
                        and bool(visual.get('viewed'))
                        and all((folder/v['path']).is_file() and sha(folder/v['path']) == v['sha256']
                                for v in visual.get('viewed',[])))
            row.update(attempt=folder.name, capture=str(folder/'capture.json'), flags=flags,
                       status='needs-fix' if flags else ('candidate-reviewed' if reviewed else 'visual-review-pending'))
            row.update(rawFlags=raw_flags, resolvedRotationAdvisories=resolved_flags)
            if not matches: row['status']='superseded-recipe-preview'
            relative=folder.relative_to(OUT).as_posix()
            if (folder/'review/preview.mp4').exists():
                body=f'<video controls loop muted playsinline preload="none" poster="{relative}/main/main-0000.png" src="{relative}/review/preview.mp4"></video>'
            if reviewed and visual.get('acceptedLimitationsZh'):
                row['acceptedLimitationsZh'] = visual['acceptedLimitationsZh']
                body += '<p>'+html.escape('；'.join(visual['acceptedLimitationsZh']))+'</p>'
            if flags:
                row['note']='原始检查存在待处理项，不计入完成。'
                body+='<p class="issue">'+html.escape(row['note'])+'</p><details><summary>检查记录</summary><pre>'+html.escape(json.dumps(flags,ensure_ascii=False,indent=2))+'</pre></details>'
            body+=f'<details><summary>关键帧</summary><img loading="lazy" src="{relative}/review/contact-sheet.jpg"><img loading="lazy" src="{relative}/review/side-check.jpg"></details>'
            detail_images = [v for v in capture.get('images',[]) if v['view'].startswith('detail-')]
            if detail_images:
                body+='<details><summary>关节与接触近景</summary>'
                for v in detail_images:
                    body+=f'<small>{html.escape(v["view"])} · {v["frame"]/30:.2f}s</small><img loading="lazy" src="{relative}/{html.escape(v["path"])}">'
                body+='</details>'
        unresolved=[i for i in known_issues if i['id']==action and i['status']=='open']
        if unresolved:
            row['status']='needs-fix';row['knownIssues']=unresolved
            body+='<p class="issue">'+html.escape('；'.join(i['summaryZh'] for i in unresolved))+'</p>'
        labels={'pending':'准备中','needs-fix':'发现问题 · 待修复','visual-review-pending':'技术检查完成 · 待看样复核','candidate-reviewed':'候选复核完成 · 待你验收','superseded-recipe-preview':'配方已更新 · 此预览已过期'}
        cards.append('<article id="'+html.escape(action)+'"><small>'+labels[row['status']]+'</small><h2>'+html.escape(recipe['nameZh'])+'</h2>'+body+'<small>'+action+'</small></article>')
        rows.append(row)
    assert len(rows)==32
    counts={key:sum(r['status']==key for r in rows) for key in sorted({r['status'] for r in rows})}
    (OUT/'status.json').write_text(json.dumps({'format':'pose-hub-finalization-status@1','counts':counts,'actions':rows,'userReviewed':False,'releaseEligible':False},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>32动作模板 · 修正复核</title><style>body{font:16px/1.6 system-ui,"Microsoft YaHei";color:#253347;background:#f5f6f8;margin:0}main{max-width:1400px;margin:auto;padding:24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:18px}article{background:white;border:1px solid #dce2e9;border-radius:12px;padding:18px}h2{font-size:19px}small{color:#67758a}img,video{width:100%}.issue{color:#92661c}pre{white-space:pre-wrap;font-size:12px}summary{cursor:pointer}</style><main><h1>32动作模板 · 修正复核</h1><p>__REVIEW_STAGE_MESSAGE__</p><div class="grid">'''+''.join(cards)+'''</div><p><a href="status.json">逐项检查状态</a></p></main><script>document.addEventListener('play',e=>{if(e.target.tagName==='VIDEO')document.querySelectorAll('video').forEach(v=>{if(v!==e.target)v.pause()})},true)</script></html>'''
    completed = counts.get('candidate-reviewed', 0)
    message = (f'{completed}/32 个模板完成本轮候选复核。' + ('全部候选已准备好，请逐项查看完整循环并给出验收意见。' if completed == 32 else '其余动作继续修正，旧预览保留供对照。') + '候选复核不等于你已验收；高亮材质仍可后选，正式高清制作留到最后。')
    page = page.replace('__REVIEW_STAGE_MESSAGE__', message)
    (OUT/'index.html').write_text(page,encoding='utf-8')
    print(json.dumps(counts))


if __name__=='__main__':build()
