"""Build a self-contained local review page; all media stays under the approved root."""
import argparse
import json
from pathlib import Path

REPO=Path(__file__).resolve().parents[2]


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',required=True,type=Path)
    args=parser.parse_args();root=args.root
    data=json.loads((root/'manifests/derivatives.json').read_text(encoding='utf-8'))
    data['actions']=[json.loads(p.read_text(encoding='utf-8-sig')) for p in sorted((REPO/'catalog/v2/actions').glob('*.json'))]
    data['voice']=json.loads((REPO/'catalog/voice-v2/manifest.json').read_text(encoding='utf-8-sig'))
    content=HTML.replace('__DATA__',json.dumps(data,ensure_ascii=False).replace('</','<\\/'))
    (root/'index.html').write_text(content,encoding='utf-8')
    print(root/'index.html')


HTML='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pose-Hub · 新人体六动作试制</title>
<link rel="icon" href="data:,">
<style>
:root{font-family:system-ui,"Microsoft YaHei",sans-serif;color:#ecedf1;background:#12151b;color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:36px;max-width:1700px;margin:auto}h1{font-size:28px;margin:6px 0}p{color:#adb4c2;line-height:1.65}.bar{display:flex;gap:20px;align-items:center;flex-wrap:wrap;padding:20px 0;position:sticky;top:0;background:#12151bf5;z-index:5}select,button{font:inherit;border:1px solid #3d4759;border-radius:6px;padding:8px;background:#202733;color:inherit}a{color:#9bd4ff}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.card{border:1px solid #303746;border-radius:12px;background:#1a202a;padding:18px;min-width:0}.card h2{font-size:19px;margin:0 0 4px}.id{font-family:monospace;color:#97a3b8;font-size:12px}video{width:100%;aspect-ratio:1;display:block;margin:16px 0 8px;background:#101013;border-radius:6px}.compare{display:grid;grid-template-columns:1fr 1fr;gap:8px}figure{margin:0}figure img{display:block;width:100%;border-radius:4px}figcaption{color:#b5becd;font-size:12px;margin:5px 0 12px}.voice{display:flex;gap:8px;align-items:center;margin-top:8px}.voice audio{width:100%;height:32px}.voice select{font-size:12px;max-width:42%}.badge{display:inline-block;border:1px solid #786238;color:#f3dca4;border-radius:20px;padding:4px 10px;font-size:12px}.note{font-size:13px;color:#b1bac9}.foot{border-top:1px solid #303746;margin-top:28px;padding-top:18px}@media(max-width:1100px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){body{padding:18px}.grid{grid-template-columns:1fr}.bar{gap:10px}}
</style>
<span class="badge">样片审阅 · 尚未发布</span><h1>新人体 · 六个代表动作</h1>
<p>原型原配色、白金、蓝色、绿色、全息共五套。所有背景和高亮对照均由分层母版合成。每份循环视频为 720×720 / 30fps / 8 秒；高亮开关的关键帧对照在视频下方。</p>
<p class="note">看样重点：原配色及蓝绿皮肤在深底上的暗部辨识、白金在浅底上的轮廓对比，以及臀桥当前视角的臀部高亮可见度。当前保留正式材质；高亮按实际遮挡显示。</p>
<div class="bar"><label>皮肤 <select id="skin"><option value="realistic">原型原配色</option><option value="tech-white">白金</option><option value="neon-night">蓝色</option><option value="neon-night-b">绿色</option><option value="hologram">全息</option></select></label><label>背景 <select id="theme"><option value="light">浅色</option><option value="dark">深色</option></select></label><a href="previews/action-skin-theme-highlight-mosaic.png" target="_blank">完整拼图：6 动作 × 5 皮肤 × 深浅色 × 高亮开关</a></div>
<div class="grid" id="grid"></div>
<div class="foot"><p>人物与道具、遮挡高亮遮罩、地面阴影分别保存在 masters/；语音位于 voice/，来源与校验位于 manifests/ 和 qa/。字幕和语音是独立素材，循环视频无音轨。单腿臀桥演示左腿支撑，换边口令在完成该侧剂量后的循环边界触发，不生成镜像版本。</p><p>技术检测不代替人工看样与试听。此页用于确认外观、动作和声音，合入 main、推送与全库生产仍等待开哥确认。</p></div>
<script>const data=__DATA__;
const grid=document.querySelector('#grid');
const lineLabels={name:'动作名',primaryCue:'主要点','phase.start':'起始引导','phase.peak':'到位引导','phase.end':'回程引导'};
for(const action of data.actions){const card=document.createElement('section');card.className='card';card.dataset.id=action.id;
card.innerHTML='<h2></h2><div class="id"></div><video controls loop muted playsinline preload="metadata"></video><p class="note">循环样片 · 高亮开</p><div class="compare"><figure><img class="off"><figcaption>高亮关 · 顶峰关键帧</figcaption></figure><figure><img class="on"><figcaption>高亮开 · 同一关键帧</figcaption></figure></div><div class="voices"></div>';
card.querySelector('h2').textContent=action.definition.name.zh;card.querySelector('.id').textContent=action.id+' / '+action.definition.name.en;
const cue=document.createElement('p');cue.className='note';cue.textContent=action.definition.cues.find(c=>c.primary).text.zh;card.querySelector('.voices').before(cue);
for(const lang of ['zh','en']){const row=document.createElement('div');row.className='voice';const label=document.createElement('span');label.textContent=lang==='zh'?'中':'EN';const select=document.createElement('select');for(const [key,title]of Object.entries(lineLabels)){const op=document.createElement('option');op.value=key;op.textContent=title;select.append(op)}const audio=document.createElement('audio');audio.controls=true;audio.preload='none';function change(){const line=data.voice.actions[action.id].lines[lang][select.value];audio.src=line.ref.path;audio.title=line.text}select.onchange=change;change();row.append(label,select,audio);card.querySelector('.voices').append(row)}grid.append(card)}
function refresh(){const skin=document.querySelector('#skin').value,theme=document.querySelector('#theme').value;for(const card of grid.children){const variant=data.variants.find(v=>v.actionId===card.dataset.id&&v.skin===skin&&v.theme===theme);if(!variant)continue;const video=card.querySelector('video');video.pause();video.src=variant.video.path;video.poster=variant.cover.path;card.querySelector('.on').src=variant.cover.path;card.querySelector('.off').src=variant.video.path.replace('loop.720.mp4','comparison.off.720.png')}}
document.querySelector('#skin').onchange=refresh;document.querySelector('#theme').onchange=refresh;refresh();
</script></html>'''


if __name__=='__main__':main()
