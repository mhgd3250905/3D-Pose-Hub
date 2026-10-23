"""Copy completed local review videos into a new, self-contained review folder."""
import argparse,hashlib,html,json,shutil
from datetime import datetime,timezone
from pathlib import Path

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def build(plan_file,out):
    if out.exists():raise FileExistsError('Review output already exists; choose a new folder')
    plan=json.loads(plan_file.read_bytes());prepared=[]
    for item in plan['actions']:
        report_file=Path(item['report']);report=json.loads(report_file.read_bytes())
        if not(report.get('complete') and report.get('mode')=='full' and len(report['frames'])==241):
            raise ValueError('Incomplete full review: '+str(report_file))
        if report.get('solverWarningFrames') or report.get('diagnosticWarningFrames'):
            raise ValueError('Review still has warnings: '+report['id'])
        if report['loopJointErrorMm']>1e-4 or not report['loopPngIdentical']:
            raise ValueError('Review loop does not close: '+report['id'])
        files={entry['path']:entry for entry in report['files']}
        for name in ['review.mp4','frame-0000.png']:
            source=report_file.parent/name;entry=files[name]
            if source.stat().st_size!=entry['bytes'] or sha(source)!=entry['sha256']:
                raise ValueError('Review file changed: '+str(source))
        prepared.append((item,report,report_file))
    out.mkdir(parents=True)
    manifest={'generatedAt':datetime.now(timezone.utc).isoformat(),'baseCommit':plan['baseCommit'],
              'sourceCommits':plan['sourceCommits'],'reviewed':False,'releaseEligible':False,'actions':[]}
    cards=[]
    for item,r,source in prepared:
        identity=r['id'];video=identity+'.mp4';poster=identity+'.png'
        shutil.copyfile(source.parent/'review.mp4',out/video);shutil.copyfile(source.parent/'frame-0000.png',out/poster)
        row={'id':identity,'nameZh':item['nameZh'],'profile':r['profile'],'video':{'path':video,'bytes':(out/video).stat().st_size,'sha256':sha(out/video)},
             'poster':poster,'sourceReport':str(source.resolve()),'sourceReportSha256':sha(source),
             'checkedPoses':241,'loopJointErrorMm':r['loopJointErrorMm'],'notes':item.get('notes',''),'reviewed':False,'releaseEligible':False}
        manifest['actions'].append(row)
        cards.append('<article><h2>'+html.escape(item['nameZh'])+'</h2><video controls loop preload="metadata" poster="'+poster+'" src="'+video+'"></video><p>'+html.escape(item.get('notes',''))+'</p><small>'+html.escape(identity)+' · 8 秒 · 30 fps · 待审核</small></article>')
    (out/'review-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PR15 动作修复审阅</title>
<style>body{margin:0;background:#13151a;color:#edf0f5;font:16px/1.6 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:32px}h1{font-size:28px}header p{color:#b3bdcc}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}article{background:#20242c;border-radius:12px;padding:18px}h2{font-size:20px;margin:0 0 12px}video{width:100%;background:#101013;border-radius:8px}small{color:#a4b0c0}article p{min-height:50px}</style>
<main><header><h1>PR15 动作修复审阅</h1><p>本机审阅视频。动作与成片等待你的确认，尚未发布；原规格和历史失败版本均保留。</p></header><div class="grid">'''+''.join(cards)+'</div></main></html>'
    (out/'index.html').write_text(page,encoding='utf-8');print(out.resolve())

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('plan',type=Path);parser.add_argument('out',type=Path)
    args=parser.parse_args();build(args.plan,args.out)
