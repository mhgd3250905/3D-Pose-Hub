"""Pose-Hub HD producer migrated from 3D-Body #120.

Prepare, probe GPU, preview, actually inspect images, then render --reviewed.
Original specs, model, published media and historical batches stay unchanged.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

sys.dont_write_bytecode=True
REPO=Path(__file__).resolve().parents[3]
ROOT=REPO/'drill-anim'
HERE=Path(__file__).resolve().parent
BAD_LOG=re.compile(r'pageerror|console\s|shader error|context.?lost|TargetClosedError|browser has been closed|out of memory|GL_INVALID_OPERATION',re.I)

def read(path):return json.loads(Path(path).read_text(encoding='utf-8-sig'))
def sha(path):
    with Path(path).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def write_json(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    content=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
    if path.exists() and path.read_text(encoding='utf-8')==content:return
    temporary=path.with_name(path.name+f'.{os.getpid()}.tmp')
    temporary.write_text(content,encoding='utf-8',newline='\n');temporary.replace(path)
def safe_ids(ids):
    if not ids or len(set(ids))!=len(ids) or any(not isinstance(s,str) or not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_-]*',s) for s in ids):
        raise ValueError('Expected nonempty unique safe drill IDs')
    return ids

def load_selection(app,output,ids,override_path):
    """Read only. --ids executes a subset of an already frozen batch."""
    overrides=read(override_path) if override_path else {}
    if not isinstance(overrides,dict) or (override_path and not overrides):raise ValueError('Spec overrides must be a nonempty JSON map')
    if app:
        content=read(Path(app)/'assets/hip/hip-content.json')['drills'];safe_ids([d['id'] for d in content])
        drills={d['id']:d for d in content}
        if overrides:
            if not set(overrides)<=set(drills):raise ValueError('Unknown override drill ID')
            drills={sid:drills[sid] for sid in overrides}
    else:
        previous=Path(output)/'source-manifest.json'
        selected=list(overrides) if overrides else [d['id'] for d in read(previous)['drills']] if previous.is_file() else ids
        safe_ids(selected);drills={sid:{'id':sid,'media':{}} for sid in selected}
    safe_ids(list(drills))
    if ids:
        safe_ids(ids)
        if not set(ids)<=set(drills):raise ValueError('Unknown batch drill ID')
    for sid in drills:
        if not (ROOT/'specs'/(sid+'.js')).is_file():raise ValueError('Missing canonical spec: '+sid)
    resolved={}
    for sid,relative in overrides.items():
        if sid not in drills or not isinstance(relative,str):raise ValueError('Unknown override drill ID')
        source=(REPO/relative).resolve()
        if not source.is_relative_to((ROOT/'specs').resolve()) or not source.is_file() or source.suffix!='.js':
            raise ValueError('Revision must be an existing .js under drill-anim/specs: '+str(source))
        resolved[sid]=source
    return drills,resolved

def protected_output(output):
    output=output.resolve();repo=REPO.resolve()
    if repo.is_relative_to(output) or (output.is_relative_to(repo) and not output.is_relative_to(repo/'output')):
        raise ValueError('Batch output must be outside source, or under repository output/')
    return output
def input_hashes():
    paths={ROOT/'drill.py'}
    for folder in ('lib','page','assets'):
        paths.update(p for p in (ROOT/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
    paths.update(p for p in (ROOT/'specs').rglob('*') if p.is_file() and p.suffix in ('.js','.mjs'))
    paths.update(p for p in (REPO/'runtime/src').rglob('*') if p.is_file() and p.suffix in ('.js','.mjs','.json'))
    # Freeze both the legacy base and every optional v2plus runtime/data source.
    paths.add(ROOT/'models/current-production.json')
    for name in ('training-human-v2','training-human-v2plus'):
        model=ROOT/'models'/(name+'.json')
        if model.is_file():
            paths.add(model);paths.update(REPO/p for p in read(model)['sourceSha256'])
    return {p.relative_to(REPO).as_posix():sha(p) for p in sorted(paths) if p.is_file()}
def tool_hashes():
    return {p.name:sha(p) for p in sorted(HERE.iterdir()) if p.suffix in ('.py','.mjs') and not p.name.startswith('test_')}

def production_recipe():
    path=ROOT/'models/current-production.json';config=read(path)
    if config.get('format')!='pose-hub-production-model' or config.get('formatVersion')!=1:
        raise ValueError('Unsupported current-production model format')
    profile=config.get('modelProfile')
    if profile not in ('training-human-v2','training-human-v2plus'):
        raise ValueError('Unsupported production model profile')
    if type(config.get('alignClavicles')) is not bool or not isinstance(config.get('modelVersion'),str):
        raise ValueError('Production model needs modelVersion and boolean alignClavicles')
    model=read(ROOT/'models'/(profile+'.json'))
    if model.get('id')!=profile or model.get('version')!=config['modelVersion']:
        raise ValueError('Production model version does not match its model manifest')
    options={'alignClavicles':config['alignClavicles']}
    if profile=='training-human-v2plus':
        if not isinstance(config.get('v2plus'),dict):raise ValueError('Production v2plus model needs its options')
        options['v2plus']=config['v2plus']
    return {'profile':profile,'profile_options':options,'model_version':config['modelVersion'],
        'production_config':{'path':path.relative_to(REPO).as_posix(),'sha256':sha(path)}}

def overlay_content(source,sid,recipe):
    prefix=('// Pose-Hub HD: preserve source pose/camera/timing; explicit canonical ID.\n'
        'import source from '+json.dumps(source.as_uri())+';\n'
        'export default {...source,id:'+json.dumps(sid)+',fps:30,size:1080,')
    if 'profile_options' not in recipe:
        # Historical manifests retain the exact pre-v2plus overlay byte format.
        if recipe['profile']!='training-human-v2':raise ValueError('Historical batch lacks its model options')
        return prefix+"modelProfile:'training-human-v2',alignClavicles:false};\n"
    options=recipe['profile_options']
    if not isinstance(options,dict) or set(options)-{'alignClavicles','v2plus'}:
        raise ValueError('Unsupported frozen profile options')
    fields={'modelProfile':recipe['profile'],**{k:options[k] for k in ('alignClavicles','v2plus') if k in options}}
    return prefix+','.join(k+':'+json.dumps(v,separators=(',',':'),sort_keys=True) for k,v in fields.items())+'};\n'

def prepare(a):
    output=protected_output(a.output)
    path=output/'source-manifest.json';previous=read(path) if path.is_file() else None
    # Resume keeps the frozen recipe, while current input/tool hashes must still
    # match. A changed production default never silently rewrites old overlays.
    recipe=({k:previous[k] for k in ('profile','profile_options','model_version','production_config') if k in previous}
        if previous is not None else production_recipe())
    drills,overrides=load_selection(a.app,output,a.ids,a.spec_overrides)
    theme=(ROOT/a.theme).resolve()
    if not theme.is_relative_to(REPO.resolve()) or not theme.is_file():raise ValueError('Theme must exist inside Pose-Hub')
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip()
    entries=[];overlays={}
    for sid,d in drills.items():
        original=ROOT/'specs'/(sid+'.js');source=overrides.get(sid,original);target=output/'specs'/(sid+'.js')
        overlays[target]=overlay_content(source,sid,recipe)
        entry={'id':sid,'source':str(source.relative_to(REPO)),
            'source_sha256':hashlib.sha256(source.read_bytes().replace(b'\r\n',b'\n')).hexdigest(),
            'overlay':str(target),'original_app_status':d.get('media',{}).get('status')}
        if sid in overrides:
            entry.update(revision=True,base_source=str(original.relative_to(REPO)),
                base_source_sha256=hashlib.sha256(original.read_bytes().replace(b'\r\n',b'\n')).hexdigest())
        entries.append(entry)
    manifest={'source_commit':previous['source_commit'] if previous else commit,**recipe,
        'fps':30,'output_size':1080,'pixel_ratio':a.pr,'pose_camera_timing_unchanged':not bool(overrides),
        'drills':entries,'theme':theme.relative_to(REPO).as_posix(),'theme_sha256':sha(theme),
        'render_inputs':input_hashes(),'tools':tool_hashes(),'format':a.format}
    if previous is not None and previous!=manifest:
        raise RuntimeError('Batch source/recipe changed; preserve this batch and resume from its original frozen checkout/tools, or use a new output directory')
    for target,content in overlays.items():
        if target.exists() and target.read_text(encoding='utf-8')!=content:raise RuntimeError('Existing overlay changed; preserve this batch')
    output.mkdir(parents=True,exist_ok=True)
    if previous is None:write_json(path,manifest)
    for target,content in overlays.items():
        target.parent.mkdir(parents=True,exist_ok=True)
        if not target.exists():target.write_text(content,encoding='utf-8',newline='\n')
    from PIL import Image,ImageDraw
    for sid,d in drills.items():
        ref=output/'references'/(sid+'.png')
        if ref.exists():continue
        ref.parent.mkdir(exist_ok=True);poster=d.get('media',{}).get('poster')
        if poster:Image.open(a.app/poster).convert('RGB').resize((540,540)).save(ref)
        else:
            im=Image.new('RGB',(540,540),(18,18,20));ImageDraw.Draw(im).text((30,240),'No prior App media - reference placeholder',fill=(190,190,190));im.save(ref)
    return manifest,drills,theme,commit

def clamp_frames(count,requested=None,still=1,keys=()):
    if count<1:raise ValueError('No animation frames')
    values=[int(f) for f in requested.split(',')] if requested else [0,round(still*30),count//2,count-1,*[round(t*30) for t in keys]]
    return sorted({max(0,min(count-1,f)) for f in values})
def resource_guard(output):
    if shutil.disk_usage(output).free<15*(1<<30):raise RuntimeError('Less than 15 GiB free; dispatch stopped')
    if os.name=='nt':
        import ctypes
        class Memory(ctypes.Structure):
            _fields_=[('length',ctypes.c_ulong),('load',ctypes.c_ulong),*[(k,ctypes.c_ulonglong) for k in ('total','available','page','availablePage','virtual','availableVirtual','extended')]]
        memory=Memory();memory.length=ctypes.sizeof(memory)
        if not ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(memory)) or memory.available<1<<30:
            raise RuntimeError('Less than 1 GiB available RAM; dispatch stopped')
def verify_preview(output,sid):
    path=output/'preview-evidence'/(sid+'.json')
    if not path.is_file():raise RuntimeError('Run preview and inspect images before render: '+sid)
    evidence=read(path)
    if evidence['source_manifest_sha256']!=sha(output/'source-manifest.json'):raise ValueError('Preview belongs to another recipe')
    frames=evidence.get('frames')
    if evidence.get('id')!=sid or not isinstance(frames,list) or not frames or any(type(f) is not int or f<0 for f in frames) or len(set(frames))!=len(frames):
        raise ValueError('Preview drill/frame identity mismatch')
    metadata=list((output/'preview-work'/sid/'fr').glob('met-*.json'))
    required={f'preview-work/{sid}.spec.json',f'preview-work/theme-{sid}.json',f'preview-master/metrics/{sid}.json',f'preview-evidence/{sid}-samples.png'}
    required.update(f'preview-work/{sid}/c/{f:04d}.png' for f in frames)
    required.update(p.relative_to(output).as_posix() for p in metadata)
    inputs=evidence.get('inputs')
    if not metadata or not isinstance(inputs,dict) or not required<=set(inputs):raise ValueError('Preview evidence changed: missing required file binding')
    contact=evidence.get('sample_contact',{})
    if contact.get('path')!=f'preview-evidence/{sid}-samples.png' or contact.get('sha256')!=inputs[contact['path']]:
        raise ValueError('Preview evidence changed: contact binding mismatch')
    for relative,expected in inputs.items():
        p=(output/relative).resolve()
        if not p.is_relative_to(output) or sha(p)!=expected:raise ValueError('Preview evidence changed: '+relative)
    return evidence
def bind_preview(output,sid,frames,work,qa):
    from PIL import Image,ImageDraw
    paths=[work/(sid+'.spec.json'),work/('theme-'+sid+'.json'),output/'preview-master/metrics'/(sid+'.json')]
    paths += [work/sid/'c'/(f'{f:04d}.png') for f in frames]+sorted((work/sid/'fr').glob('met-*.json'))
    evidence={'id':sid,'frames':frames,'qa':qa,'source_manifest_sha256':sha(output/'source-manifest.json'),
        'inputs':{p.relative_to(output).as_posix():sha(p) for p in paths},
        'scope':'Actual sparse preview files; operator must inspect images before --reviewed; full-loop QA still required.'}
    sheet=Image.new('RGB',(320*len(frames),350),(18,18,20));draw=ImageDraw.Draw(sheet)
    for i,f in enumerate(frames):
        with Image.open(work/sid/'c'/(f'{f:04d}.png')) as im:
            tile=Image.new('RGBA',im.size,(18,18,20,255));tile.alpha_composite(im.convert('RGBA'))
            sheet.paste(tile.convert('RGB').resize((320,320)),(i*320,30))
        draw.text((i*320+8,8),sid+' frame '+str(f),fill='white')
    path=output/'preview-evidence'/(sid+'-samples.png');path.parent.mkdir(exist_ok=True);sheet.save(path)
    evidence['sample_contact']={'path':path.relative_to(output).as_posix(),'sha256':sha(path)}
    evidence['inputs'][path.relative_to(output).as_posix()]=sha(path)
    write_json(output/'preview-evidence'/(sid+'.json'),evidence)

def load_drill(a,output,drills):
    preview=a.stage=='preview';work=output/('preview-work' if preview else 'work')
    os.environ.update(PYTHONUTF8='1',PYTHONIOENCODING='utf-8',DRILL_PR=str(a.pr),APP_PORT=str(a.port),
        APP_URL=f'http://127.0.0.1:{a.port}',APP_DIR=str(REPO),REF_DIR=str(output/'references'),
        OUT_DIR=str(output/('preview-master' if preview else 'master')),WORK_DIR=str(work))
    spec=importlib.util.spec_from_file_location('posehub_hd_drill',ROOT/'drill.py')
    drill=importlib.util.module_from_spec(spec);spec.loader.exec_module(drill)
    def spec_path(sid):
        if sid not in drills:raise ValueError('Unknown batch ID: '+sid)
        return str(output/'specs'/(sid+'.js'))
    drill.spec_path=spec_path;node_render=drill.node_render
    def checked_render(specf,fr,start,stop,theme,extra=()):
        process=node_render(specf,fr,start,stop,theme,extra);wait=process.wait
        def checked_wait(*args,**kw):
            code=wait(*args,**kw)
            values=list(map(int,extra[list(extra).index('--frames')+1].split(','))) if '--frames' in extra else list(range(start,stop))
            names=['still' if f<0 else f'{f:04d}' for f in values]
            if '--with-still' in extra:names.append('still')
            if code or any(not (Path(fr)/(prefix+name+'.png')).is_file() for name in names for prefix in ('m-','g-')):
                raise RuntimeError('Renderer failed or frame gap; preserve scratch and diagnose memory/disk/driver before a new attempt')
            for p in Path(fr).parent.glob('fr-log-*.txt'):
                if BAD_LOG.search(p.read_text(encoding='utf-8',errors='replace')):raise RuntimeError('Render log error; diagnose before resuming: '+str(p))
            return code
        process.wait=checked_wait;return process
    drill.node_render=checked_render
    if a.format=='green':
        run,popen=drill.run,drill.popen
        def command(args):
            args=list(args)
            if len(args)>1 and Path(args[1]).resolve()==(ROOT/'lib/comp.py').resolve():args[1]=str(HERE/'composite_alpha_parallel.py')
            return args
        drill.run=lambda args,**kw:run(command(args),**kw)
        drill.popen=lambda args,**kw:popen(command(args),**kw)
    return drill,work
def validate_green(output,sid):
    r=read(output/'greenscreen/jobs'/sid/'result.json')
    if r['id']!=sid or r['status']!='green_media_complete' or not r['composition_qa_pass'] or not r['video_validation']['full_cpu_decode']:raise ValueError('Green result incomplete: '+sid)
    qa=r['inherited_source_qa'];count=r['frames']
    if count<1 or r['fps']!=30 or qa.get('fps')!=30 or not qa.get('frames_complete') or qa.get('frames')!=count:
        raise ValueError('Green frame count/QA incomplete: '+sid)
    if {k for k in r['outputs'] if k.startswith('alpha_')}!={f'alpha_{i}' for i in range(count)}:
        raise ValueError('Green alpha index incomplete: '+sid)
    for relative,digest in r['inputs'].items():
        p=(output/relative).resolve()
        if not p.is_relative_to(output) or sha(p)!=digest:raise ValueError('Result input changed: '+relative)
    for row in r['outputs'].values():
        p=(output/'greenscreen'/row['path']).resolve()
        if not p.is_relative_to(output/'greenscreen') or p.stat().st_size!=row['bytes'] or sha(p)!=row['sha256']:raise ValueError('Result output changed: '+str(p))
    if r['inherited_source_qa']!=read(output/'master/metrics'/(sid+'.json')):raise ValueError('Original QA differs')
    return r

def verify_completed(output,sid):
    """Read-only completed-result reuse: current SHA/recipe plus full CPU decode."""
    validate_green(output,sid)
    spec=importlib.util.spec_from_file_location('posehub_hd_fast_verify',HERE/'export_greenscreen_fast.py')
    exporter=importlib.util.module_from_spec(spec);spec.loader.exec_module(exporter)
    # A completed result was required above; this branch never exports or writes
    # aggregate summaries and cannot turn a partial result into a completed one.
    return exporter.export_job(output,sid,keep_alpha=True)

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('stage',choices=('prepare','gpu','preview','render'))
    ap.add_argument('--app',type=Path);ap.add_argument('--output',required=True,type=Path)
    ap.add_argument('--ids',nargs='+');ap.add_argument('--spec-overrides',type=Path)
    ap.add_argument('--theme',default='themes/glow-soft.json');ap.add_argument('--pr',type=float,default=2)
    ap.add_argument('--frames');ap.add_argument('--port',type=int,default=8859)
    ap.add_argument('--format',choices=('green','dark'),default='green')
    ap.add_argument('--reviewed',action='store_true',help='Operator actually inspected bound preview images')
    a=ap.parse_args();a.output=a.output.resolve();a.app=a.app.resolve() if a.app else None
    if not 0<a.pr<=2:ap.error('--pr must be >0 and <=2')
    if not 1024<=a.port<=65535:ap.error('Invalid port')
    manifest,drills,theme,commit=prepare(a)
    if a.stage=='prepare':print('Prepared',len(drills),'Pose-Hub source-preserving overlays at',a.output);return 0
    if not (ROOT/'config.json').is_file():raise RuntimeError('Configure ignored drill-anim/config.json first')
    ids=a.ids or list(drills)
    if a.stage=='render' and (not a.reviewed or a.pr!=2):raise RuntimeError('HD render needs --pr 2 and --reviewed after inspecting preview images')
    if a.stage=='render':
        gpu=read(a.output/'gpu.json')
        if gpu['source_manifest_sha256']!=sha(a.output/'source-manifest.json') or 'NVIDIA' not in gpu['renderer'] or (gpu['width'],gpu['height'])!=(2160,2160):
            raise RuntimeError('Run gpu stage to verify 2160 NVIDIA rendering for this batch')
        for sid in ids:verify_preview(a.output,sid)
    ledger_path=a.output/f'progress-{a.port}.json';ledger=read(ledger_path) if ledger_path.exists() else {'items':{}}
    from render_slots import gpu_slot
    resource_guard(a.output)
    with gpu_slot(REPO/'output/.hd-gpu-slots'):
        drill,work=load_drill(a,a.output,drills)
        if a.stage=='gpu':
            target=a.output/'gpu.json'
            if target.exists():raise FileExistsError('GPU evidence exists; use a fresh batch for a new probe')
            with drill.Vite():subprocess.run(['node',str(HERE/'gpu_probe.mjs'),str(target),str(theme)],cwd=ROOT,check=True)
            gpu=read(target);gpu['source_manifest_sha256']=sha(a.output/'source-manifest.json');write_json(target,gpu);return 0
        with drill.Vite():
            for sid in ids:
                resource_guard(a.output)
                if a.stage=='preview' and (a.output/'preview-evidence'/(sid+'.json')).exists():verify_preview(a.output,sid);print('RESUME verified preview',sid);continue
                previous=ledger['items'].get(sid,{})
                if a.stage=='render' and previous.get('status') in ('pass','review'):
                    if a.format!='green':raise ValueError('Dark reference resume requires a fresh batch; keep existing media')
                    verify_completed(a.output,sid)
                    print('RESUME verified result',sid);continue
                scratch=work/sid
                if scratch.exists() and any(scratch.iterdir()):raise FileExistsError('Partial scratch preserved; inspect and use a new batch: '+str(scratch))
                started=time.time();ledger['items'][sid]={'status':'rendering','stage':a.stage,'source_commit':manifest['source_commit'],'tooling_commit':commit,'fps':30,'pixel_ratio':a.pr};write_json(ledger_path,ledger)
                try:
                    _,_,spec=drill.spec_json(sid)
                    frames=clamp_frames(round(spec['timeline']['duration']*30),a.frames,spec.get('stillAt',1),spec.get('keyFrames',[])) if a.stage=='preview' else None
                    drill.ensure_outputs(sid,False)
                    if a.stage=='render':write_json(a.output/'reviewed-previews'/(sid+'.json'),{'id':sid,'operator_reviewed':True,'preview_evidence_sha256':sha(a.output/'preview-evidence'/(sid+'.json'))})
                    fr,cdir,spec,_=drill.render(sid,str(theme),jobs=1,frames=frames);drill.qa(sid,fr)
                    qa=read(Path(drill.OUT)/'metrics'/(sid+'.json'))
                    if a.stage=='preview':
                        bind_preview(a.output,sid,frames,work,qa);ledger['items'][sid].update(status='preview_complete',frames=qa['frames'],full_loop_accepted=False)
                    else:
                        if a.format=='green':
                            subprocess.run([sys.executable,str(HERE/'export_greenscreen_fast.py'),'--output',str(a.output),'--ids',sid,'--once','--keep-alpha'],check=True);validate_green(a.output,sid)
                        else:
                            drill.encode(sid,cdir,spec);subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(a.output/'master'/(sid+'.mp4')),'-f','null','-'],check=True)
                        drill.sheet(sid,cdir,spec);ledger['items'][sid].update(status='pass' if qa['pass'] else 'review',qa_pass=qa['pass'],decode_pass=True,frames=qa['frames'],warnings=qa.get('solver_warning_frames'))
                except BaseException as exc:
                    ledger['items'][sid].update(status='error',error=str(exc),diagnosis_required=True);write_json(ledger_path,ledger);raise
                ledger['items'][sid]['elapsed_seconds']=round(time.time()-started,1);write_json(ledger_path,ledger);print('BATCH_RESULT',sid,json.dumps(ledger['items'][sid]),flush=True)
    return 0

if __name__=='__main__':
    try:raise SystemExit(main())
    except Exception as error:print('HD_STOP:',error,file=sys.stderr);raise SystemExit(2)
