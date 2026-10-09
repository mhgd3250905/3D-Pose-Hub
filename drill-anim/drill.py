#!/usr/bin/env python3
"""drill-anim batch CLI.

  python3 drill.py render deltoids-A [rotator-cuff-A ...] [--theme other.json] [--jobs 2] [--frames 0,60,120] [--keep]
  python3 drill.py qa <id>              # recompute metrics/<id>.json from the last render's frame data
  python3 drill.py masks                # 17-group highlight check sheet on the neutral standing pose
  python3 drill.py swatch <id> --themes a.json,b.json  # same frame, several themes
Outputs go to config.json:out_dir (<id>.mp4, <id>.gif, <id>-sheet.png, metrics/<id>.json).
"""
import json, os, sys, subprocess, shutil, time, socket, glob, argparse
ROOT = os.path.dirname(os.path.abspath(__file__))
def cfg():
    c = json.load(open(os.path.join(ROOT, 'config.json')))
    for k in list(c):
        if os.environ.get(k.upper()): c[k] = os.environ[k.upper()]
    return c
C = cfg()
if C.get('python_path'):
    os.environ['PYTHONPATH'] = C['python_path'] + ':' + os.environ.get('PYTHONPATH', ''); sys.path.insert(0, C['python_path'])
ENV = dict(os.environ, PLAYWRIGHT_BROWSERS_PATH=C['playwright_browsers_path'], LD_LIBRARY_PATH=C['ld_library_path'] + ':' + os.environ.get('LD_LIBRARY_PATH', ''))
OUT = C['out_dir']; WORK = C['work_dir']
os.makedirs(OUT + '/metrics', exist_ok=True); os.makedirs(WORK, exist_ok=True)

def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
def port_open(p):
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', int(p))); return True
    except Exception: return False
    finally: s.close()
class Vite:
    """starts the 3D Coach dev server if it is not already up, stops it again on exit (only if we started it)"""
    def __enter__(self):
        self.p = None
        if not port_open(C['app_port']):
            log('starting vite on', C['app_port'])
            self.p = subprocess.Popen([os.path.join(C['app_dir'], 'node_modules/.bin/vite'), '--host', '127.0.0.1', '--port', str(C['app_port']), '--strictPort'],
                                      cwd=C['app_dir'], stdout=open(WORK + '/vite.log', 'w'), stderr=subprocess.STDOUT, start_new_session=True)
            for _ in range(120):
                if port_open(C['app_port']): break
                time.sleep(0.5)
        return self
    def __exit__(self, *a):
        if self.p:
            log('stopping vite'); os.killpg(self.p.pid, 15); self.p.wait(timeout=20)

def spec_json(sid):
    f = os.path.join(ROOT, 'specs', sid + '.js'); j = os.path.join(WORK, sid + '.spec.json')
    subprocess.run(['node', '-e', f"import('{f}').then(m=>require('fs').writeFileSync('{j}',JSON.stringify(m.default)))"], check=True, cwd=ROOT)
    return f, j, json.load(open(j))
def theme_json(path, tag):
    out = os.path.join(WORK, f'theme-{tag}.json')
    subprocess.run(['node', '--input-type=module', '-e', f"import {{loadTheme}} from '{ROOT}/lib/config.mjs';import fs from 'node:fs';fs.writeFileSync('{out}',JSON.stringify(loadTheme({json.dumps(path) if path else 'null'})));"], check=True, cwd=ROOT)
    return out

def node_render(specf, fr, a, b, theme, extra=()):
    args = ['node', os.path.join(ROOT, 'lib/render.mjs'), specf, fr, str(a), str(b)] + (['--theme', theme] if theme else []) + list(extra)
    return subprocess.Popen(args, env=ENV, cwd=ROOT, stdout=open(f'{fr}-log-{a}.txt', 'w'), stderr=subprocess.STDOUT)

def render(sid, theme=None, jobs=2, frames=None, keep=False, tag=''):
    specf, specj, spec = spec_json(sid); fps = spec.get('fps', 30); N = round(spec['timeline']['duration'] * fps)
    fr = os.path.join(WORK, sid + tag, 'fr'); cdir = os.path.join(WORK, sid + tag, 'c')
    if not keep:
        shutil.rmtree(os.path.join(WORK, sid + tag), ignore_errors=True)
    os.makedirs(fr, exist_ok=True)
    thj = theme_json(theme, sid + tag)
    t0 = time.time()
    if frames is not None:
        node_render(specf, fr, frames[0], frames[0] + 1, theme, ['--frames', ','.join(map(str, [-1] + frames))]).wait()
    else:
        step = -(-N // jobs); ps = []
        for i in range(jobs):
            a, b = i * step, min(N, (i + 1) * step)
            ps.append(node_render(specf, fr, a, b, theme, ['--with-still'] if i == 0 else []))
        [p.wait() for p in ps]
    log(sid, 'render', round(time.time() - t0), 's')
    for f in glob.glob(fr + '-log-*.txt'):
        t = open(f).read()
        if 'pageerror' in t or 'Error' in t: log('LOG ERRORS', f, t[-1500:])
    t1 = time.time()
    if frames is not None:
        subprocess.run(['python3', os.path.join(ROOT, 'lib/comp.py'), fr, specj, thj, cdir], check=True)
    else:
        step = -(-N // jobs)
        ps = [subprocess.Popen(['python3', os.path.join(ROOT, 'lib/comp.py'), fr, specj, thj, cdir, f'{i*step}:{min(N,(i+1)*step)}']) for i in range(jobs)]
        [p.wait() for p in ps]
        subprocess.run(['python3', os.path.join(ROOT, 'lib/comp.py'), fr, specj, thj, cdir, '-1:0'], check=False)
    log(sid, 'comp', round(time.time() - t1), 's')
    return fr, cdir, spec, specj

def encode(sid, cdir, spec):
    fps = spec.get('fps', 30); tmp = f'/tmp/{sid}.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', cdir + '/%04d.png', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp], check=True)
    shutil.copy(tmp, f'{OUT}/{sid}.mp4')
    g = f'/tmp/{sid}.gif'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', cdir + '/%04d.png', '-vf', 'fps=15,scale=540:540:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', g], check=True)
    shutil.copy(g, f'{OUT}/{sid}.gif')

def sheet(sid, cdir, spec, out=None):
    from PIL import Image, ImageDraw, ImageFont
    fps = spec.get('fps', 30); W = 540
    f = ImageFont.truetype(C['font'], 24); fs = ImageFont.truetype(C['font'], 18)
    ref = Image.open(os.path.join(C['ref_dir'], sid + '.png')).convert('RGB').resize((W, W))
    ks = spec.get('keyFrames', [0, spec['timeline']['duration'] / 3, spec['timeline']['duration'] * 2 / 3])
    tiles = [ref] + [Image.open(f'{cdir}/{round(t*fps)%round(spec["timeline"]["duration"]*fps):04d}.png').convert('RGB').resize((W, W), Image.LANCZOS) for t in ks]
    S = Image.new('RGB', (W * len(tiles), W + 44), (18, 18, 20)); d = ImageDraw.Draw(S)
    for i, t in enumerate(tiles):
        S.paste(t, (i * W, 44)); d.text((i * W + 12, 8), 'reference' if i == 0 else f't = {ks[i-1]:.2f} s', font=fs, fill=(220, 220, 225))
    d.text((W * len(tiles) - 12, 8), f"{sid}  {spec.get('name','')}", font=f, fill=(255, 140, 90), anchor='ra')
    S.save(out or f'{OUT}/{sid}-sheet.png')

def qa(sid, fr=None):
    specf, specj, spec = spec_json(sid); fr = fr or os.path.join(WORK, sid, 'fr')
    subprocess.run(['python3', os.path.join(ROOT, 'lib/qa.py'), fr, specj, f'{OUT}/metrics/{sid}.json', os.path.join(WORK, sid, 'c')], check=True)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('cmd'); ap.add_argument('ids', nargs='*'); ap.add_argument('--theme'); ap.add_argument('--themes')
    ap.add_argument('--jobs', type=int, default=2); ap.add_argument('--frames'); ap.add_argument('--keep', action='store_true'); ap.add_argument('--out')
    a = ap.parse_args()
    if a.cmd == 'qa':
        for sid in a.ids: qa(sid)
        return
    with Vite():
        if a.cmd == 'render':
            for sid in a.ids:
                fl = list(map(int, a.frames.split(','))) if a.frames else None
                fr, cdir, spec, specj = render(sid, a.theme, a.jobs, fl, a.keep)
                if fl is None:
                    encode(sid, cdir, spec); sheet(sid, cdir, spec); qa(sid, fr)
                log(sid, 'done')
        elif a.cmd == 'masks':
            subprocess.run(['node', os.path.join(ROOT, 'lib/masks.mjs'), os.path.join(WORK, 'masks')] + (['--theme', a.theme] if a.theme else []), env=ENV, cwd=ROOT, check=True)
            subprocess.run(['python3', os.path.join(ROOT, 'lib/masksheet.py'), os.path.join(WORK, 'masks'), a.out or f'{OUT}/mask-sheet.png', C['font']], check=True)
        elif a.cmd == 'swatch':
            sid = a.ids[0]; themes = [None] + a.themes.split(','); frame = int(a.frames or 0); tiles = []
            for i, th in enumerate(themes):
                fr, cdir, spec, specj = render(sid, th, 1, [frame], False, tag=f'-sw{i}')
                tiles.append((th or 'theme.json (default)', f'{cdir}/{frame:04d}.png'))
            subprocess.run(['python3', os.path.join(ROOT, 'lib/swatch.py'), a.out or f'{OUT}/swatch-sheet.png', C['font'], json.dumps(tiles)], check=True)
if __name__ == '__main__':
    main()
