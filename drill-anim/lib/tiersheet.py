# tiersheet.py <tier> <out.png> [tile px] : one labelled tile per drill of a tier (A/B/C), taken from <out_dir>/<id>.mp4
# at the spec's stillAt-free key moment (the middle key frame of the spec, else 40 % of the loop). Missing drills get a
# labelled placeholder tile. Run from the drill-anim folder (reads config.json for out_dir, drills_json, font).
import json, os, subprocess, sys, re, tempfile
from PIL import Image, ImageDraw, ImageFont
here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(here, 'config.json'), encoding='utf-8'))
P = lambda k: os.environ.get(k.upper(), cfg[k]) if os.path.isabs(os.environ.get(k.upper(), cfg[k])) else os.path.join(here, os.environ.get(k.upper(), cfg[k]))
args = [a for a in sys.argv[1:] if a != '--overwrite']
tier, out = args[0], args[1]; T = int(args[2]) if len(args) > 2 else 360
if os.path.exists(out) and '--overwrite' not in sys.argv: raise FileExistsError('Existing sheet preserved; use --overwrite: ' + out)
OUT, DJ, FONT = P('out_dir'), P('drills_json'), P('font')
WORK = P('work_dir'); os.makedirs(WORK, exist_ok=True)
D = json.load(open(DJ, encoding='utf-8'))['drills']
def run(*args, **kwargs):
    if os.name == 'nt': kwargs.setdefault('creationflags', subprocess.CREATE_NO_WINDOW)
    return subprocess.run(*args, **kwargs)
ids = [(g, D[g][tier]) for g in D if tier in D[g]]
def keyt(sid):
    sp = os.path.join(here, 'specs', sid + '.js')
    if not os.path.exists(sp): return None
    js = "import {pathToFileURL} from 'node:url';const {default:s}=await import(pathToFileURL(process.argv[1]).href);console.log(JSON.stringify({k:s.keyFrames||[],d:s.timeline.duration}));"
    r = run(['node', '--input-type=module', '-e', js, sp], capture_output=True, text=True, check=True, encoding='utf-8')
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
        t = keyt(sid) or 0
        with tempfile.TemporaryDirectory(prefix='tiersheet-', dir=WORK) as tmpdir:
            png = os.path.join(tmpdir, 'frame.png')
            run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.3f}', '-i', mp4, '-frames:v', '1', png], check=True)
            with Image.open(png) as image: S.paste(image.convert('RGB').resize((T, T), Image.LANCZOS), (X, Y))
        done += 1
    else:
        d.rectangle([X + 4, Y + 4, X + T - 4, Y + T - 4], outline=(90, 90, 96), width=2); d.text((X + 20, Y + T // 2), '未完成 / pending', font=f1, fill=(150, 150, 156))
    d.rectangle([X, Y + T - int(T * 0.17), X + T, Y + T], fill=(0, 0, 0))
    d.text((X + 10, Y + T - int(T * 0.165)), x['name'], font=f1, fill=(255, 255, 255))
    d.text((X + 10, Y + T - int(T * 0.085)), sid, font=f2, fill=(255, 140, 80))
    d.rectangle([X, Y, X + T - 1, Y + T - 1], outline=(40, 40, 44))
S.save(out); print(out, S.size, f'{done}/{len(ids)} rendered')
