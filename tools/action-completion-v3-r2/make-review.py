"""Build low-resolution review clips and a small review page from capture evidence.

This never renders a model, changes source frames, or marks an action accepted.
"""
import argparse
import hashlib
import html
import json
from pathlib import Path
import shutil
import subprocess
from PIL import Image, ImageDraw


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(capture_file):
    root = capture_file.parent
    data = json.loads(capture_file.read_text(encoding='utf-8'))
    if not data.get('complete') or data.get('mode') != 'preview' or data['size'] > 480:
        raise ValueError('Completed low-resolution preview capture required')
    out = root / 'review'
    out.mkdir(exist_ok=False)
    seq = out / 'frames'
    seq.mkdir()
    frames = data['plan']['previewPlaybackFrames']
    fps = data['plan']['previewFps']
    bounds = []
    for i, frame in enumerate(frames):
        src = root / 'main' / f'main-{frame:04d}.png'
        rgba = Image.open(src).convert('RGBA')
        box = rgba.getchannel('A').point(lambda x: 255 if x > 8 else 0).getbbox()
        if box:
            bounds.append(box)
        background = Image.new('RGBA', rgba.size, '#edf0f4')
        background.alpha_composite(rgba)
        background.convert('RGB').save(seq / f'{i:04d}.png')
    video = out / 'preview.mp4'
    subprocess.run([shutil.which('ffmpeg') or 'ffmpeg', '-hide_banner', '-loglevel', 'error',
                    '-framerate', str(fps), '-i', str(seq / '%04d.png'), '-an',
                    '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', '-n', str(video)], check=True)
    sheet = Image.new('RGB', (960, 1040), '#edf0f4')
    draw = ImageDraw.Draw(sheet)
    for cell in range(16):
        i = round(cell * (len(frames)-1) / 15)
        im = Image.open(seq / f'{i:04d}.png').resize((240, 240), Image.Resampling.LANCZOS)
        x, y = cell % 4 * 240, cell // 4 * 260
        sheet.paste(im, (x, y))
        draw.text((x+8, y+242), f'{frames[i]/30:.2f}s / frame {frames[i]}', fill='#263244')
    sheet.save(out / 'contact-sheet.jpg', quality=94)
    diagnostic = [r for r in data['images'] if r['view'] in ['side', 'opposite']]
    diag = Image.new('RGB', (480*3, 500*2), '#edf0f4')
    dd = ImageDraw.Draw(diag)
    for i, record in enumerate(diagnostic[:6]):
        im = Image.open(root / record['path']).convert('RGBA')
        bg = Image.new('RGBA', im.size, '#edf0f4'); bg.alpha_composite(im)
        x,y = i%3*480,i//3*500
        diag.paste(bg.convert('RGB'), (x,y))
        dd.text((x+10,y+482), f"{record['view']} {record['frame']/30:.2f}s", fill='#263244')
    diag.save(out / 'side-check.jpg', quality=94)
    union = [min(b[0] for b in bounds), min(b[1] for b in bounds),
             max(b[2] for b in bounds), max(b[3] for b in bounds)]
    result = {'purpose':'low-resolution-user-review-only', 'stableId':data['stableId'],
              'captureSha256':digest(capture_file),'sourceSha256':data['sourceSha256'],
              'recipeSha256':data['recipeSha256'],'size':data['size'],'fps':fps,
              'durationSeconds':len(frames)/fps, 'sampledAlphaContentRect':union,
              'contentRectScope':'Union of review playback samples; final 30fps production bounds remain deferred.',
              'camera':data['camera'],'reviewed':False,'releaseEligible':False,
              'files':{n:{'bytes':(out/n).stat().st_size,'sha256':digest(out/n)}
                       for n in ['preview.mp4','contact-sheet.jpg','side-check.jpg']}}
    (out / 'review.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return result


def page(batch, captures):
    labels={'h-db-reverse-curl':'01 · 双哑铃反握弯举','h-db-zottman-curl':'02 · 佐特曼弯举'}
    cards=[]
    for cap in captures:
        data=json.loads(cap.read_text(encoding='utf-8'))
        rel=(cap.parent/'review').relative_to(batch).as_posix()
        label=labels.get(data['stableId'],data['stableId'])
        cards.append(f'''<article><div class="title"><h2>{html.escape(label)}</h2><span>待你确认</span></div>
<video controls loop muted playsinline preload="auto" src="{rel}/preview.mp4"></video>
<div class="speed">播放速度 <button onclick="this.closest('article').querySelector('video').playbackRate=.5">0.5×</button><button onclick="this.closest('article').querySelector('video').playbackRate=1">1×</button></div>
<p>看动作是否自然、手腕有无扭转、镜头是否能讲清动作。</p>
<details><summary>查看完整循环的关键帧</summary><img src="{rel}/contact-sheet.jpg"></details>
<details><summary>查看侧面与背面</summary><img src="{rel}/side-check.jpg"></details></article>''')
    document='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>动作模板 · 第一组审片</title><style>
*{box-sizing:border-box}body{margin:0;background:#f6f7f9;color:#1c2839;font:16px/1.6 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1120px;margin:36px auto;padding:0 24px}h1{font-size:28px;margin-bottom:8px}.sub{color:#627086;margin:0 0 24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(350px,1fr));gap:24px}article{background:white;border:1px solid #e1e5ec;border-radius:16px;padding:20px}.title{display:flex;justify-content:space-between;gap:12px;align-items:center}h2{font-size:20px}.title span{font-size:13px;color:#946315;background:#fff4d9;border-radius:16px;padding:4px 10px;white-space:nowrap}video{width:100%;background:#edf0f4;border-radius:10px}button{border:1px solid #d7dde6;border-radius:6px;background:white;padding:4px 12px;margin-left:8px;cursor:pointer}.speed{margin:10px 0;color:#627086}p{font-size:14px}details{margin-top:10px;border-top:1px solid #edf0f4;padding-top:10px}summary{cursor:pointer;font-size:14px}img{width:100%;margin-top:12px}footer{color:#627086;margin-top:24px;font-size:14px}
</style><main><h1>动作模板 · 第一组</h1><p class="sub">480 px 低清审片 · 固定镜头 · 无地面投影 · 当前只确认动作与镜头</p><div class="grid">'''+''.join(cards)+'''</div><footer>请按动作给意见：通过，或指出需要调整的时间点和部位。通过后逐项保存模板；正式素材最后统一制作。</footer></main></html>'''
    (batch/'index.html').write_text(document,encoding='utf-8')


if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('captures',nargs='+',type=Path);ap.add_argument('--batch',required=True,type=Path);args=ap.parse_args()
    for cap in args.captures:
        print(json.dumps(build(cap),ensure_ascii=True))
    page(args.batch,args.captures)
