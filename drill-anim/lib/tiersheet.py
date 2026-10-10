# tiersheet.py <tier> <out.png> [tile px] : one labelled tile per drill of a tier (A/B/C), taken from <out_dir>/<id>.mp4
# at the spec's stillAt-free key moment (the middle key frame of the spec, else 40 % of the loop). Missing drills get a
# labelled placeholder tile. Run from the drill-anim folder (reads config.json for out_dir, drills_json, font).
import json, os, subprocess, sys, re
from PIL import Image, ImageDraw, ImageFont
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(here, 'config.json')))
P = lambda k: os.environ.get(k.upper(), cfg[k]) if os.path.isabs(os.environ.get(k.upper(), cfg[k])) else os.path.join(here, os.environ.get(k.upper(), cfg[k]))
tier, out = sys.argv[1], sys.argv[2]; T = int(sys.argv[3]) if len(sys.argv) > 3 else 360
OUT, DJ, FONT = P('out_dir'), P('drills_json'), P('font')
D = json.load(open(DJ))['drills']
ids = [(g, D[g][tier]) for g in D if tier in D[g]]
def keyt(sid):
    sp = os.path.join(here, 'specs', sid + '.js')
    if not os.path.exists(sp): return None
    js = f"import('{sp}').then(m=>{{const s=m.default;const k=s.keyFrames||[];console.log(JSON.stringify({{k,d:s.timeline.duration}}))}})"
    r = subprocess.run(['node', '-e', js], capture_output=True, text=True)
    try: j = json.loads(r.stdout.strip().splitlines()[-1])
    except Exception: return None
    k = j['k']; return k[len(k) // 2] if k else 0.4 * j['d']
f1 = ImageFont.truetype(FONT, int(T * 0.06)); f2 = ImageFont.truetype(FONT, int(T * 0.045)); fh = ImageFont.truetype(FONT, int(T * 0.09))
cols = 6; rows = -(-len(ids) // cols); H = int(T * 0.16)
S = Image.new('RGB', (cols * T, rows * T + H), (14, 14, 16)); d = ImageDraw.Draw(S)
d.text((20, int(H * 0.2)), f'Flare drill-anim · {tier} 档 · {len(ids)} 个动作', font=fh, fill=(255, 140, 80))
done = 0
for i, (g, x) in enumerate(ids):
    sid = x['id']; X, Y = (i % cols) * T, H + (i // cols) * T; mp4 = os.path.join(OUT, sid + '.mp4')
    if os.path.exists(mp4):
        t = keyt(sid) or 0; png = f'/tmp/tiersheet-{sid}.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', mp4, '-frames:v', '1', png])
        S.paste(Image.open(png).convert('RGB').resize((T, T), Image.LANCZOS), (X, Y)); done += 1
    else:
        d.rectangle([X + 4, Y + 4, X + T - 4, Y + T - 4], outline=(90, 90, 96), width=2); d.text((X + 20, Y + T // 2), '未完成 / pending', font=f1, fill=(150, 150, 156))
    d.rectangle([X, Y + T - int(T * 0.17), X + T, Y + T], fill=(0, 0, 0))
    d.text((X + 10, Y + T - int(T * 0.165)), x['name'], font=f1, fill=(255, 255, 255))
    d.text((X + 10, Y + T - int(T * 0.085)), sid, font=f2, fill=(255, 140, 80))
    d.rectangle([X, Y, X + T - 1, Y + T - 1], outline=(40, 40, 44))
S.save(out); print(out, S.size, f'{done}/{len(ids)} rendered')
