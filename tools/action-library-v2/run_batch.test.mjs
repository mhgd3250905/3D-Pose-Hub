import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {SKINS, sha256, reference, mediaPath, validateBatch, buildRecipe, inspectExisting, receiptFile, validateReview, dispatch, checkFreeSpace, acquireLock, runtimeProof} from './run_batch.mjs';
import {loadRuntime,absoluteFileReference,publicConfig,validateActualWebGL} from './runtime-profile.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
function fixture(t) {
  const base = fs.realpathSync(os.tmpdir()), root = fs.mkdtempSync(path.join(base, 'posehub-v2-runner-test-'));
  t.after(() => { const real = fs.realpathSync(root); assert.equal(path.dirname(real), base); assert.ok(path.basename(real).startsWith('posehub-v2-runner-test-')); fs.rmSync(real, {recursive: true}); });
  const action = {id: 'test-action', spec: 'drill-anim/specs/test-action.js', peakFrame: 60, previewFrames: [0, 60, 180, 239, 240], sourceSha256: 'source-sha', model: {id: 'training-human-v2plus', version: '1.0.0-rc2'}};
  const recipe = {batchId: 'test-batch', batchSha256: 'batch-sha', sha256: 'recipe-sha', actions: [action]};
  return {root, action, recipe};
}
const writeJson = (file, value) => { fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, JSON.stringify(value) + '\n'); };
function preview(root, action, recipe) {
  const manifests = {};
  for (const skin of SKINS) {
    const folder = path.join(root, 'qa/preview', skin, action.id), sequences = {};
    for (const layer of ['body', 'highlight', 'shadow']) {
      const frames = action.previewFrames.map(frame => { const file = path.join(folder, layer, `${frame}.png`); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, `fixture-${skin}-${layer}-${frame}`); return {frame, ...reference(root, file)}; });
      const index = path.join(folder, layer, 'index.json'); writeJson(index, {frames}); sequences[layer] = reference(root, index);
    }
    const file = path.join(folder, 'layer-manifest.json');
    writeJson(file, {actionId: action.id, skin, sourceSha256: action.sourceSha256, diagnosticOnly: false, complete: false, width: 1080, height: 1080, fps: 30, durationSeconds: 8, frameCount: action.previewFrames.length, model: action.model, sequences});
    manifests[skin] = reference(root, file);
  }
  writeJson(receiptFile(root, action, 'preview'), {recipeSha256: recipe.sha256, sourceSha256: action.sourceSha256, stage: 'preview', reviewSha256: null, manifests});
  return manifests;
}
function review(action, recipe, manifests) {
  return {format: 'pose-hub-v2-actual-review@1', actualReview: true, approved: true, reviewedBy: 'Fixture reviewer', reviewedAt: '2026-10-21T12:00:00Z', batchId: recipe.batchId, batchSha256: recipe.batchSha256, recipeSha256: recipe.sha256,
    actions: [{id: action.id, approved: true, sourceSha256: action.sourceSha256, previewManifests: manifests, actualVisualFrames: Object.fromEntries(SKINS.map(skin => [skin, action.previewFrames]))}]};
}

test('eight wrappers retain original motion/props/camera and register exact LF source hashes', async () => {
  const batchFile = path.join(repo, 'catalog/v2/batches/b001.json'), batch = validateBatch(JSON.parse(fs.readFileSync(batchFile)));
  assert.equal(batch.actions.length, 8);
  const registry = JSON.parse(fs.readFileSync(path.join(repo, 'drill-anim/data/home-pr-candidates.json'))), attrs = fs.readFileSync(path.join(repo, '.gitattributes'), 'utf8');
  for (const action of batch.actions) {
    const spec = (await import(pathToFileURL(path.join(repo, action.spec)))).default, base = (await import(pathToFileURL(path.join(repo, action.source.path)))).default;
    for (const key of ['timeline', 'pose', 'props', 'camera', 'qa', 'highlight', 'keyFrames', 'stillAt', 'frame']) assert.deepEqual(spec[key], base[key], `${action.id}: source ${key} must remain unchanged`);
    const bytes = fs.readFileSync(path.join(repo, action.spec)); assert.ok(!bytes.includes(13));
    assert.equal(registry.specs[path.basename(action.spec)].sha256, sha256(bytes));
    assert.ok(attrs.includes(`${action.spec} text eol=lf`));
    assert.ok([0, 30, 90, 120, 180, 210, 239, 240, action.peakFrame].every(f => action.previewFrames.includes(f)));
  }
  const recipe = await buildRecipe(repo, batchFile, batch, {sha256:'fixture-runtime-sha',id:'fixture',profile:{browserVersion:'fixture',actualWebGLRenderer:'fixture device',chromiumArgs:[],chromiumChannel:null}}); assert.equal(recipe.actions.length, 8); assert.match(recipe.sha256, /^[a-f0-9]{64}$/);
});

test('review requires actual viewing, matching source, every skin/frame and exact manifest/index/PNG hashes', t => {
  const {root, action, recipe} = fixture(t), manifests = preview(root, action, recipe), good = review(action, recipe, manifests);
  assert.doesNotThrow(() => validateReview(root, recipe, good));
  // Object order is irrelevant; the file bytes referenced by each SHA are exact.
  good.actions[0].previewManifests = Object.fromEntries(Object.entries(manifests).reverse());
  assert.doesNotThrow(() => validateReview(root, recipe, good));
  for (const mutate of [r => r.actualReview = false, r => r.actions[0].sourceSha256 = 'stale', r => r.actions[0].actualVisualFrames.hologram = [0]]) {
    const bad = structuredClone(good); mutate(bad); assert.throws(() => validateReview(root, recipe, bad));
  }
  const image = path.join(root, 'qa/preview/realistic/test-action/body/60.png'); fs.appendFileSync(image, 'changed');
  assert.throws(() => validateReview(root, recipe, good), /SHA\/bytes changed/);
});

test('partial output is preserved and refused, while matching complete receipts permit skip', t => {
  const {root, action, recipe} = fixture(t);
  assert.equal(inspectExisting(root, action, 'preview', recipe), 'run');
  const partial = path.join(root, 'qa/preview/realistic/test-action/body/0.png'); fs.mkdirSync(path.dirname(partial), {recursive: true}); fs.writeFileSync(partial, 'partial-original');
  assert.throws(() => inspectExisting(root, action, 'preview', recipe), /partial or unreceipted/);
  assert.equal(fs.readFileSync(partial, 'utf8'), 'partial-original');
  preview(root, action, recipe); assert.equal(inspectExisting(root, action, 'preview', recipe), 'skip');
  assert.throws(() => inspectExisting(root, action, 'preview', {...recipe, sha256: 'another-recipe'}), /receipt SHA/);
  const mf = path.join(root, 'qa/preview/hologram/test-action/layer-manifest.json'); fs.appendFileSync(mf, ' ');
  assert.throws(() => inspectExisting(root, action, 'preview', recipe), /manifest bytes changed/);
});

test('references cannot escape their batch and batch IDs/preview coverage are validated', t => {
  const {root} = fixture(t);
  assert.throws(() => mediaPath(root, {root: 'media', path: '../outside.json'}), /escapes/);
  assert.throws(() => mediaPath(root, {root: 'other', path: 'file'}));
  const b = JSON.parse(fs.readFileSync(path.join(repo, 'catalog/v2/batches/b001.json'))); b.actions[0].previewFrames = [0, 239, 240];
  assert.throws(() => validateBatch(b), /missing start\/peak/);
});

test('scheduler caps workers at two and stops new dispatch after an observed failure', async () => {
  const started = [], finished = []; let active = 0, max = 0;
  await assert.rejects(dispatch([0, 1, 2, 3], 2, async item => {
    started.push(item); active++; max = Math.max(max, active);
    await new Promise(resolve => setTimeout(resolve, item === 0 ? 5 : 20)); active--;
    if (item === 0) throw new Error('fixture failure'); finished.push(item);
  }), /fixture failure/);
  assert.deepEqual(started, [0, 1]); assert.deepEqual(finished, [1]); assert.equal(max, 2);
  await assert.rejects(dispatch([0], 3, async () => {}), /Workers/);
});

test('free-space query fails closed and enforces 50 GiB before dispatch', t => {
  const {root} = fixture(t), block = 1024n ** 3n;
  assert.equal(checkFreeSpace(root, () => ({bavail: 50n, bsize: block})).availableBytes, String(50n * block));
  assert.throws(() => checkFreeSpace(root, () => ({bavail: 49n, bsize: block})), /at least 50 GiB/);
  assert.throws(() => checkFreeSpace(root, () => { throw new Error('unsupported'); }), /Cannot query output free space/);
  assert.throws(() => checkFreeSpace(root, null), /unavailable/);
  assert.throws(() => checkFreeSpace(root, () => ({bavail: 100, bsize: 4096})), /Invalid filesystem/);
});

test('shared coordinator lock refuses a second runner and preserves active or stale owner bytes', t => {
  const {root} = fixture(t), file = path.join(root, '.action-library-v2-render.lock');
  const release = acquireLock(file, {root: 'b001', workers: 2}), owner = fs.readFileSync(file, 'utf8');
  assert.throws(() => acquireLock(file, {root: 'b002', workers: 2}), /active\/stale/);
  assert.equal(fs.readFileSync(file, 'utf8'), owner);
  release(); assert.ok(!fs.existsSync(file));
  fs.writeFileSync(file, 'stale-owner');
  assert.throws(() => acquireLock(file, {}), /active\/stale/);
  assert.equal(fs.readFileSync(file, 'utf8'), 'stale-owner');
});

test('r3 changes exactly the two ankle Y coordinate tracks and retains every other motion value', async () => {
  const base=(await import(pathToFileURL(path.join(repo,'drill-anim/specs/h-step-jack-r2.js')))).default;
  const next=(await import(pathToFileURL(path.join(repo,'drill-anim/specs/h-step-jack-r3.js')))).default;
  assert.deepEqual(next.pose,base.pose); assert.equal(next.timeline.duration,base.timeline.duration);
  const changed=[];
  for(const [key,track] of Object.entries(base.timeline.tracks)) {
    if(['k22','k26'].includes(key)) {
      changed.push(key);
      track.forEach(([time,value,...rest],i)=>{const [nt,nv,...nr]=next.timeline.tracks[key][i];assert.equal(nt,time);assert.deepEqual(nr,rest);assert.ok(Math.abs(nv-value-0.00227077778868)<1e-12);});
    } else assert.deepEqual(next.timeline.tracks[key],track);
  }
  assert.deepEqual(changed.sort(),['k22','k26']);
  for(const key of ['props','camera','qa','highlight','keyFrames','stillAt','frame'])assert.deepEqual(next[key],base[key]);
});

function runtimeFixture(t) {
  const {root}=fixture(t), files={};
  for(const kind of ['browser','playwright','script']){const p=path.join(root,kind+'.txt');fs.writeFileSync(p,kind);files[kind]=absoluteFileReference(p);}
  const c={chromium_args:['--use-angle=d3d11'],playwright_module:files.playwright.path,playwright_browsers_path:root,app_url:'http://fixture'};
  const args=['--use-angle=d3d11','--force_high_performance_gpu'],device='ANGLE (NVIDIA, fixture GPU D3D11)';
  const probes=[0,1].map(i=>{const p=path.join(root,`probe-${i}.json`);writeJson(p,{success:true,probeSourceSha256:files.script.sha256,browserVersion:'130.fixture',webgl:{unmaskedRenderer:device,contextLost:false},requestedArgs:args,actualCommandLine:{arguments:[files.browser.path]}});return absoluteFileReference(p);});
  const profile={format:'pose-hub-render-runtime@1',id:'fixture',defaultConfig:publicConfig(c),chromiumArgs:args,chromiumChannel:null,browserVersion:'130.fixture',actualWebGLRenderer:device,browserExecutable:files.browser,playwrightModule:files.playwright,probe:{script:files.script,results:probes}};
  const file=path.join(root,'runtime.json');writeJson(file,profile);return {root,c,profile,file};
}

test('runtime binds actual repeated probe device, binary/script hashes and current public config', t => {
  const {c,profile,file}=runtimeFixture(t);
  assert.equal(loadRuntime(file,{config:c}).profile.actualWebGLRenderer,profile.actualWebGLRenderer);
  assert.throws(()=>loadRuntime(file,{config:{...c,chromium_args:['--different']}}),/public config\/env/);
  const changed={...profile,chromiumArgs:['--different']};writeJson(file,changed);
  assert.throws(()=>loadRuntime(file,{config:c}),/launch arguments/);
  writeJson(file,profile);fs.appendFileSync(profile.browserExecutable.path,'changed');
  assert.throws(()=>loadRuntime(file,{config:c}),/Runtime reference SHA/);
});

test('same-browser actual WebGL guard rejects wrong device, lost context, arguments and version', t => {
  const {profile}=runtimeFixture(t),actual={unmaskedRenderer:profile.actualWebGLRenderer,contextLost:false};
  assert.doesNotThrow(()=>validateActualWebGL(profile,profile.browserVersion,actual,profile.chromiumArgs,null));
  assert.throws(()=>validateActualWebGL(profile,profile.browserVersion,{...actual,unmaskedRenderer:'Intel'},profile.chromiumArgs,null),/Actual WebGL/);
  assert.throws(()=>validateActualWebGL(profile,profile.browserVersion,{...actual,contextLost:true},profile.chromiumArgs,null),/context was lost/);
  assert.throws(()=>validateActualWebGL(profile,'changed',actual,profile.chromiumArgs,null),/browser version/);
  assert.throws(()=>validateActualWebGL(profile,profile.browserVersion,actual,[],null),/launch arguments/);
});

test('runtime proof binds same-browser device and guarded source before completing an action', t => {
  const {root,action,recipe}=fixture(t);recipe.runtime={sha256:'runtime-sha',browserVersion:'130.fixture',actualWebGLRenderer:'NVIDIA fixture',chromiumArgs:['--fixture'],chromiumChannel:null};recipe.runnerFiles=[{path:'tools/action-library-v2/runtime-guard.mjs',sha256:'guard-sha'}];
  const file=path.join(root,'qa/runtime/preview/test-action.json');const proof={actionId:action.id,stage:'preview',runtimeSha256:'runtime-sha',guardSha256:'guard-sha',browserVersion:'130.fixture',actualWebGL:{unmaskedRenderer:'NVIDIA fixture',contextLost:false},browserCount:1,args:['--fixture'],channel:null};writeJson(file,proof);
  assert.equal(runtimeProof(root,action,'preview',recipe).path,'qa/runtime/preview/test-action.json');
  writeJson(file,{...proof,actualWebGL:{unmaskedRenderer:'Intel',contextLost:false}});assert.throws(()=>runtimeProof(root,action,'preview',recipe),/actual runtime device/);
});
