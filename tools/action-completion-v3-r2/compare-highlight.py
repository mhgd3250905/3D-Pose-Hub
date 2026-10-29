"""Create the local material review page without altering either captured variant."""
import argparse
import json
from pathlib import Path


def create(batch):
    pairs = [
        ('双哑铃反握弯举', 'h-db-reverse-curl', 'attempt04-warm', 'attempt06-glow'),
        ('佐特曼弯举', 'h-db-zottman-curl', 'attempt02-warm', 'attempt03-glow'),
    ]
    sections = []
    receipts = []
    for label, action, old, new in pairs:
        cards = []
        for title, attempt in [('原版 · 实色高亮', old), ('试版 · 半透明柔光', new)]:
            folder = batch / action / attempt
            capture = json.loads((folder / 'capture.json').read_text(encoding='utf-8'))
            review = json.loads((folder / 'review/review.json').read_text(encoding='utf-8'))
            assert capture['complete'] and capture['size'] == 480
            receipts.append({'id': action, 'attempt': attempt, 'review': review})
            cards.append(f'<article><h3>{title}</h3><video controls loop muted playsinline preload="auto" src="../{action}/{attempt}/review/preview.mp4"></video></article>')
        sections.append(f'<section><h2>{label}</h2><div class="buttons"><button onclick="sync(this,1)">同步播放</button><button onclick="sync(this,.5)">半速对比</button><button onclick="pausePair(this)">暂停</button></div><div class="pair">'+''.join(cards)+'</div></section>')
    document = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>橙红色高亮 · 材质对比</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f5f6f8;color:#263244;font:16px/1.6 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1160px;margin:auto;padding:24px}h1{font-size:28px;margin-bottom:6px}.intro{color:#627086}section{margin:28px 0 44px}h2{font-size:22px;margin-bottom:10px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:20px}article{border:1px solid #e0e4ea;background:white;border-radius:14px;overflow:hidden}h3{font-size:16px;margin:12px 18px}video{display:block;width:100%;background:#edf0f4}.buttons{display:flex;gap:10px;margin:12px 0}button{background:white;border:1px solid #ccd3de;padding:7px 14px;border-radius:7px;cursor:pointer}a{color:#b34c30}footer{color:#627086}@media(max-width:650px){main{padding:14px}.pair{gap:8px}h3{font-size:13px;margin:8px}}</style>
<main><h1>橙红色高亮 · 材质对比</h1><p class="intro">左：原来的实色覆盖　右：底色可透出的柔光覆盖<br>动作、镜头、手型相同；480 px 低清预览，材质待你选择。</p>'''+''.join(sections)+'''<footer>看右侧的通透感和发光强度是否合适。<a href="../">返回原审片页</a></footer></main>
<script>function sync(button,speed){const videos=[...button.closest('section').querySelectorAll('video')];videos.forEach(v=>{v.pause();v.currentTime=0;v.playbackRate=speed});Promise.all(videos.map(v=>v.play())).catch(()=>{});}function pausePair(button){button.closest('section').querySelectorAll('video').forEach(v=>v.pause());}</script></html>'''
    out = batch / 'glow-trial'
    out.mkdir(exist_ok=False)
    (out / 'index.html').write_text(document, encoding='utf-8')
    (out / 'comparison.json').write_text(json.dumps({'purpose': 'material-trial-only', 'reviewed': False, 'releaseEligible': False, 'variants': receipts}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('batch', type=Path)
    create(parser.parse_args().batch)
