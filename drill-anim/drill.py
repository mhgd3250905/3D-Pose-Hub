#!/usr/bin/env python3
"""drill-anim batch CLI.

  python3 drill.py render deltoids-A [rotator-cuff-A ...] [--theme other.json] [--jobs 2] [--frames 0,60,120] [--keep]
  python3 drill.py qa <id>              # recompute metrics/<id>.json from the last render's frame data
  python3 drill.py masks                # 17-group highlight check sheet on the neutral standing pose
  python3 drill.py swatch <id> --themes a.json,b.json  # same frame, several themes
Outputs go to config.json:out_dir (<id>.mp4, <id>.gif, <id>-sheet.png, metrics/<id>.json).
"""
import json, os, sys, subprocess, shutil, time, socket, glob, argparse, re, tempfile
ROOT = os.path.dirname(os.path.abspath(__file__))
def cfg():
    with open(os.path.join(ROOT, 'config.json'), encoding='utf-8') as source:
        c = json.load(source)
    for k in list(c):
        if os.environ.get(k.upper()): c[k] = os.environ[k.upper()]
    for k in ('app_dir', 'playwright_module', 'font', 'ref_dir', 'drills_json', 'out_dir', 'work_dir', 'python_path', 'playwright_browsers_path'):
        if c.get(k) and c[k] != '0': c[k] = os.path.abspath(os.path.join(ROOT, c[k]))
    if c.get('ld_library_path'):
        c['ld_library_path'] = os.pathsep.join(os.path.abspath(os.path.join(ROOT, p)) if p else p for p in c['ld_library_path'].split(os.pathsep))
    return c
C = cfg()
os.environ.setdefault('PYTHONUTF8', '1')
if C.get('python_path'):
    os.environ['PYTHONPATH'] = C['python_path'] + os.pathsep + os.environ.get('PYTHONPATH', ''); sys.path.insert(0, C['python_path'])
ENV = dict(os.environ)
if C.get('playwright_browsers_path'): ENV['PLAYWRIGHT_BROWSERS_PATH'] = C['playwright_browsers_path']
if C.get('ld_library_path'): ENV['LD_LIBRARY_PATH'] = C['ld_library_path'] + os.pathsep + os.environ.get('LD_LIBRARY_PATH', '')
OUT = C['out_dir']; WORK = C['work_dir']
os.makedirs(OUT + '/metrics', exist_ok=True); os.makedirs(WORK, exist_ok=True)

def run(*args, **kwargs):
    if os.name == 'nt': kwargs.setdefault('creationflags', subprocess.CREATE_NO_WINDOW)
    return subprocess.run(*args, **kwargs)
def popen(*args, **kwargs):
    if os.name == 'nt': kwargs.setdefault('creationflags', subprocess.CREATE_NO_WINDOW)
    return subprocess.Popen(*args, **kwargs)
def spec_path(sid):
    if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*', sid): raise ValueError('Invalid drill id: ' + sid)
    f = os.path.join(ROOT, 'specs', sid + '.js')
    if not os.path.isfile(f): raise ValueError('Unknown drill id: ' + sid)
    return f
def contains(parent, child):
    try: return os.path.commonpath((parent, child)) == parent
    except ValueError: return False
def clean_scratch(sid, tag):
    spec_path(sid)
    if tag and not re.fullmatch(r'-sw\d+', tag): raise ValueError('Invalid scratch tag')
    work = os.path.realpath(WORK); target = os.path.realpath(os.path.join(WORK, sid + tag))
    protected = [os.path.realpath(p) for p in (ROOT, OUT, C['app_dir'])]
    protected += [os.path.realpath(os.path.join(ROOT, p)) for p in ('specs', 'page', 'assets', 'lib', 'tools')]
    protected += [os.path.realpath(os.path.join(C['app_dir'], p)) for p in ('src', 'public', 'app', 'assets', 'docs', 'dist')]
    if target == work or not contains(work, target) or any(contains(target, p) for p in protected):
        raise ValueError('Refusing to delete outside drill scratch: ' + target)
    if any(contains(p, target) for p in protected[3:]) or contains(os.path.realpath(OUT), target):
        raise ValueError('Refusing to delete source/output content: ' + target)
    if os.path.islink(os.path.join(WORK, sid + tag)): raise ValueError('Refusing linked scratch directory')
    if os.path.exists(target): shutil.rmtree(target)
def ensure_outputs(sid, overwrite):
    spec_path(sid)
    paths = [os.path.join(OUT, sid + ext) for ext in ('.mp4', '.gif', '-sheet.png')]
    paths.append(os.path.join(OUT, 'metrics', sid + '.json'))
    existing = [p for p in paths if os.path.exists(p)]
    if existing and not overwrite: raise FileExistsError('Existing outputs preserved; use --overwrite to replace: ' + ', '.join(existing))

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
            self.p = popen(['node', os.path.join(C['app_dir'], 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', str(C['app_port']), '--strictPort'],
                          cwd=C['app_dir'], stdout=open(WORK + '/vite.log', 'w'), stderr=subprocess.STDOUT)
            try:
                for _ in range(120):
                    if self.p.poll() is not None: raise RuntimeError('Vite exited; see ' + os.path.join(WORK, 'vite.log'))
                    if port_open(C['app_port']): break
                    time.sleep(0.5)
                else: raise RuntimeError('Vite did not become ready; see ' + os.path.join(WORK, 'vite.log'))
            except BaseException:
                self.__exit__(); raise
        return self
    def __exit__(self, *a):
        if self.p:
            log('stopping vite')
            if self.p.poll() is None: self.p.terminate()
            try: self.p.wait(timeout=20)
            except subprocess.TimeoutExpired: self.p.kill(); self.p.wait()

def spec_json(sid):
    f = spec_path(sid); j = os.path.join(WORK, sid + '.spec.json')
    run(['node', '--input-type=module', '-e', "import fs from 'node:fs';import {pathToFileURL} from 'node:url';const m=await import(pathToFileURL(process.argv[1]).href);fs.writeFileSync(process.argv[2],JSON.stringify(m.default));", f, j], check=True, cwd=ROOT)
    with open(j, encoding='utf-8') as source:
        return f, j, json.load(source)
def theme_json(path, tag):
    out = os.path.join(WORK, f'theme-{tag}.json')
    run(['node', '--input-type=module', '-e', "import fs from 'node:fs';import {pathToFileURL} from 'node:url';const {loadTheme}=await import(pathToFileURL(process.argv[1]).href);fs.writeFileSync(process.argv[2],JSON.stringify(loadTheme(process.argv[3]||null)));", os.path.join(ROOT, 'lib/config.mjs'), out, os.path.abspath(os.path.join(ROOT, path)) if path else ''], check=True, cwd=ROOT)
    return out

def node_render(specf, fr, a, b, theme, extra=()):
    args = ['node', os.path.join(ROOT, 'lib/render.mjs'), specf, fr, str(a), str(b)] + (['--theme', theme] if theme else []) + list(extra)
    return popen(args, env=ENV, cwd=ROOT, stdout=open(f'{fr}-log-{a}.txt', 'w'), stderr=subprocess.STDOUT)

def render(sid, theme=None, jobs=2, frames=None, keep=False, tag=''):
    specf, specj, spec = spec_json(sid); fps = spec.get('fps', 30); N = round(spec['timeline']['duration'] * fps)
    fr = os.path.join(WORK, sid + tag, 'fr'); cdir = os.path.join(WORK, sid + tag, 'c')
    if not keep:
        clean_scratch(sid, tag)
    os.makedirs(fr, exist_ok=True)
    thj = theme_json(theme, sid + tag)
    t0 = time.time()
    if frames is not None:
        code = node_render(specf, fr, frames[0], frames[0] + 1, theme, ['--frames', ','.join(map(str, [-1] + frames))]).wait()
        if code: raise RuntimeError('Preview renderer failed; see frame log')
    else:
        step = -(-N // jobs); ps = []
        for i in range(jobs):
            a, b = i * step, min(N, (i + 1) * step)
            ps.append(node_render(specf, fr, a, b, theme, ['--with-still'] if i == 0 else []))
        [p.wait() for p in ps]
        for attempt in range(2):  # a browser launch can fail transiently: re-run any job whose frames are missing
            miss = [i for i in range(jobs) if any(not os.path.exists(f'{fr}/m-{f:04d}.png') for f in range(i * step, min(N, (i + 1) * step)))]
            if not miss: break
            log(sid, 'retrying render jobs', miss)
            ps = [node_render(specf, fr, i * step, min(N, (i + 1) * step), theme, ['--with-still'] if i == 0 else []) for i in miss]
            [p.wait() for p in ps]
        lost = [f for f in range(N) if not os.path.exists(f'{fr}/m-{f:04d}.png')]
        if lost: raise SystemExit(f'{sid}: {len(lost)} of {N} frames missing after retries (first {lost[0]})')
    log(sid, 'render', round(time.time() - t0), 's')
    for f in glob.glob(fr + '-log-*.txt'):
        t = open(f, encoding='utf-8', errors='replace').read()
        if 'pageerror' in t or 'Error' in t: log('LOG ERRORS', f, t[-1500:])
    t1 = time.time()
    if frames is not None:
        run([sys.executable, os.path.join(ROOT, 'lib/comp.py'), fr, specj, thj, cdir], check=True)
    else:
        step = -(-N // jobs)
        ps = [popen([sys.executable, os.path.join(ROOT, 'lib/comp.py'), fr, specj, thj, cdir, f'{i*step}:{min(N,(i+1)*step)}']) for i in range(jobs)]
        codes = [p.wait() for p in ps]
        if any(codes): raise RuntimeError('Compositor failed; refusing to encode incomplete output')
        run([sys.executable, os.path.join(ROOT, 'lib/comp.py'), fr, specj, thj, cdir, '-1:0'], check=True)
    log(sid, 'comp', round(time.time() - t1), 's')
    return fr, cdir, spec, specj

def encode(sid, cdir, spec):
    fps = spec.get('fps', 30); count = round(spec['timeline']['duration'] * fps)
    if any(not os.path.isfile(os.path.join(cdir, f'{f:04d}.png')) for f in range(count)):
        raise RuntimeError('Missing composited frames; refusing to encode incomplete output')
    with tempfile.TemporaryDirectory(prefix='encode-' + sid + '-', dir=WORK) as tmpdir:
        tmp = os.path.join(tmpdir, sid + '.mp4'); g = os.path.join(tmpdir, sid + '.gif')
        run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', cdir + '/%04d.png', '-frames:v', str(count), '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp], check=True)
        run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', cdir + '/%04d.png', '-vf', 'fps=15,scale=540:540:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', g], check=True)
        shutil.copy(tmp, f'{OUT}/{sid}.mp4'); shutil.copy(g, f'{OUT}/{sid}.gif')

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
    run([sys.executable, os.path.join(ROOT, 'lib/qa.py'), fr, specj, f'{OUT}/metrics/{sid}.json', os.path.join(WORK, sid, 'c')], check=True)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('cmd'); ap.add_argument('ids', nargs='*'); ap.add_argument('--theme'); ap.add_argument('--themes')
    ap.add_argument('--jobs', type=int, default=2); ap.add_argument('--frames'); ap.add_argument('--keep', action='store_true'); ap.add_argument('--out'); ap.add_argument('--overwrite', action='store_true')
    a = ap.parse_args()
    if a.cmd not in ('render', 'qa', 'masks', 'swatch'): ap.error('Unknown command: ' + a.cmd)
    if a.jobs < 1: ap.error('--jobs must be positive')
    if a.cmd in ('render', 'qa', 'swatch') and not a.ids: ap.error('At least one drill id is required')
    for sid in a.ids: spec_path(sid)
    if a.cmd == 'render' and not a.frames:
        for sid in a.ids: ensure_outputs(sid, a.overwrite)
    if a.cmd == 'qa' and not a.overwrite:
        for sid in a.ids:
            if os.path.exists(os.path.join(OUT, 'metrics', sid + '.json')): raise FileExistsError('Existing metrics preserved; use --overwrite to recompute: ' + sid)
    sheetout = a.out or (os.path.join(OUT, 'mask-sheet.png') if a.cmd == 'masks' else os.path.join(OUT, 'swatch-sheet.png') if a.cmd == 'swatch' else None)
    if sheetout and os.path.exists(sheetout) and not a.overwrite: raise FileExistsError('Existing output preserved; use --overwrite: ' + sheetout)
    if a.cmd == 'qa':
        for sid in a.ids: qa(sid)
        return
    with Vite():
        if a.cmd == 'render':
            for sid in a.ids:
                fl = list(map(int, a.frames.split(','))) if a.frames else None
                if fl is not None:
                    _, _, spec = spec_json(sid); count = round(spec['timeline']['duration'] * spec.get('fps', 30))
                    if not fl or any(f < 0 or f >= count for f in fl): ap.error('--frames must be within 0..' + str(count - 1))
                fr, cdir, spec, specj = render(sid, a.theme, a.jobs, fl, a.keep)
                if fl is None:
                    encode(sid, cdir, spec); sheet(sid, cdir, spec); qa(sid, fr)
                log(sid, 'done')
        elif a.cmd == 'masks':
            run(['node', os.path.join(ROOT, 'lib/masks.mjs'), os.path.join(WORK, 'masks')] + (['--theme', a.theme] if a.theme else []), env=ENV, cwd=ROOT, check=True)
            run([sys.executable, os.path.join(ROOT, 'lib/masksheet.py'), os.path.join(WORK, 'masks'), sheetout, C['font']], check=True)
        elif a.cmd == 'swatch':
            sid = a.ids[0]; themes = [None] + a.themes.split(','); frame = int(a.frames or 0); tiles = []
            for i, th in enumerate(themes):
                fr, cdir, spec, specj = render(sid, th, 1, [frame], False, tag=f'-sw{i}')
                tiles.append((th or 'theme.json (default)', f'{cdir}/{frame:04d}.png'))
            run([sys.executable, os.path.join(ROOT, 'lib/swatch.py'), sheetout, C['font'], json.dumps(tiles)], check=True)
if __name__ == '__main__':
    main()
