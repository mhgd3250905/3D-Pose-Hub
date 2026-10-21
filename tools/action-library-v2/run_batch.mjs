import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {sourceFingerprint} from '../../drill-anim/tools/v2/source-fingerprint.mjs';
import {loadRuntime} from './runtime-profile.mjs';

export const SKINS = ['realistic', 'tech-white', 'neon-night', 'neon-night-b', 'hologram'];
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const check = (condition, message) => { if (!condition) throw new Error(message); };
const equal = isDeepStrictEqual;
const writeNew = (file, value) => { fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', {flag: 'wx'}); };

export function checkFreeSpace(root, statfs = fs.statfsSync) {
  check(typeof statfs === 'function', 'Filesystem free-space query is unavailable; refusing render dispatch');
  let existing = path.resolve(root);
  while (!fs.existsSync(existing)) { const parent = path.dirname(existing); check(parent !== existing, 'No existing volume ancestor for output root'); existing = parent; }
  let stats;
  try { stats = statfs(existing, {bigint: true}); } catch (error) { throw new Error(`Cannot query output free space; refusing render dispatch: ${error.message}`); }
  check(typeof stats.bavail === 'bigint' && typeof stats.bsize === 'bigint' && stats.bavail >= 0n && stats.bsize > 0n, 'Invalid filesystem free-space response; refusing render dispatch');
  const available = stats.bavail * stats.bsize, minimum = 50n * 1024n ** 3n;
  check(available >= minimum, `Output volume has ${(Number(available) / 1024 ** 3).toFixed(2)} GiB free; at least 50 GiB required before every action dispatch`);
  return {availableBytes: available.toString(), minimumBytes: minimum.toString()};
}

export function acquireLock(file, record) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  let fd;
  try { fd = fs.openSync(file, 'wx'); } catch { throw new Error(`An active/stale render lock exists at ${file}; inspect it before proceeding. No automatic cleanup.`); }
  try { fs.writeFileSync(fd, JSON.stringify(record)); } catch (error) { fs.closeSync(fd); fs.unlinkSync(file); throw error; }
  return () => { fs.closeSync(fd); fs.unlinkSync(file); };
}

export function mediaPath(root, ref) {
  check(ref?.root === 'media' && typeof ref.path === 'string' && !path.isAbsolute(ref.path), 'Expected a relative media-root reference');
  const file = path.resolve(root, ref.path), relative = path.relative(root, file);
  check(relative && !relative.startsWith('..') && !path.isAbsolute(relative), 'Reference escapes the batch root');
  return file;
}

export function reference(root, file) {
  const bytes = fs.readFileSync(file);
  return {root: 'media', path: path.relative(root, file).replaceAll('\\', '/'), sha256: sha256(bytes), bytes: bytes.length};
}

export function verifyReference(root, ref, cache = new Map()) {
  const file = mediaPath(root, ref);
  if (!cache.has(file)) cache.set(file, reference(root, file));
  const actual = cache.get(file);
  check(actual.sha256 === ref.sha256 && actual.bytes === ref.bytes, `SHA/bytes changed: ${file}`);
  return file;
}

export function validateBatch(batch) {
  check(batch.format === 'pose-hub-v2-production-batch@1' && /^[\w-]+$/.test(batch.id), 'Invalid production batch identity');
  check(equal(batch.skins, SKINS), 'This renderer recipe requires the five canonical production skins');
  check(batch.fps === 30 && batch.width === 1080 && batch.height === 1080 && batch.durationSeconds === 8, 'Expected 1080 square / 30 fps / native eight seconds');
  check(Array.isArray(batch.actions) && batch.actions.length > 0, 'Batch actions must not be empty');
  const seen = new Set();
  for (const action of batch.actions) {
    check(/^[\w-]+$/.test(action.id) && !seen.has(action.id), 'Duplicate/invalid action ID'); seen.add(action.id);
    check(/^drill-anim\/specs\/[\w-]+\.js$/.test(action.spec), `${action.id}: invalid repository-relative spec`);
    check(Number.isInteger(action.peakFrame) && action.peakFrame > 0 && action.peakFrame < 239, `${action.id}: invalid peak`);
    const f = action.previewFrames;
    check(Array.isArray(f) && f.every((v, i) => Number.isInteger(v) && v >= 0 && v <= 240 && (!i || f[i - 1] < v)), `${action.id}: preview frames must be sorted, unique integers`);
    check([0, action.peakFrame, 239, 240].every(v => f.includes(v)), `${action.id}: missing start/peak/end/endpoint preview`);
    check(action.phase && action.side && Array.isArray(action.risks), `${action.id}: phase/side/risk annotation required`);
  }
  return batch;
}

export async function buildRecipe(repo, batchFile, batch, runtime) {
  check(runtime?.sha256 && runtime.profile, 'A validated GPU runtime is required to build the render recipe');
  const model = json(path.join(repo, 'drill-anim/models/current-production.json'));
  check(model.modelProfile === batch.model?.id && model.modelVersion === batch.model?.version, 'Batch model/version does not match the current production entry');
  const runnerFiles = fs.readdirSync(HERE).filter(f => f.endsWith('.mjs')).sort().map(f => ({path: `tools/action-library-v2/${f}`, sha256: sha256(fs.readFileSync(path.join(HERE, f)))}));
  const actions = [];
  for (const action of batch.actions) {
    const specFile = path.join(repo, action.spec), spec = (await import(pathToFileURL(specFile))).default;
    check(spec.timeline?.duration === 8 && spec.modelProfile === 'training-human-v2plus', `${action.id}: wrapper must explicitly use v2plus and a native eight-second motion`);
    check(spec.fps === 30 && spec.size === 1080 && spec.alignClavicles === false, `${action.id}: explicit production size/fps/clavicle settings required`);
    for (const [k, v] of Object.entries({outfit: 'compression', torso: 'base', limbs: 'base', hands: 'base', skin: 'realistic'})) check(spec.v2plus?.[k] === v, `${action.id}: missing production v2plus.${k}`);
    if (action.source) check(sha256(fs.readFileSync(path.join(repo, action.source.path))) === action.source.sha256, `${action.id}: original motion source changed`);
    actions.push({...action, model: batch.model, specSha256: sha256(fs.readFileSync(specFile)), sourceSha256: sourceFingerprint(repo, specFile).sha256});
  }
  const batchSha256 = sha256(fs.readFileSync(batchFile));
  const environment = {sha256: runtime.sha256, profileId: runtime.id, browserVersion: runtime.profile.browserVersion,
    actualWebGLRenderer: runtime.profile.actualWebGLRenderer, chromiumArgs: runtime.profile.chromiumArgs, chromiumChannel: runtime.profile.chromiumChannel};
  const material = {batchId: batch.id, batchSha256, runtime: environment, runnerFiles, actions: actions.map(a => ({id: a.id, spec: a.spec, sourceSha256: a.sourceSha256, specSha256: a.specSha256}))};
  return {format: 'pose-hub-v2-batch-source@1', ...material, sha256: sha256(JSON.stringify(material)), actions};
}

function actionManifests(root, action, stage, cache = new Map()) {
  return Object.fromEntries(SKINS.map(skin => {
    const relative = `${stage === 'preview' ? 'qa/preview' : 'masters'}/${skin}/${action.id}/layer-manifest.json`;
    const file = path.join(root, relative), manifest = json(file);
    check(manifest.actionId === action.id && manifest.skin === skin && manifest.sourceSha256 === action.sourceSha256, `${action.id}/${skin}: identity/source mismatch`);
    check(!manifest.diagnosticOnly && manifest.complete === (stage === 'full'), `${action.id}/${skin}: incomplete/diagnostic output`);
    check(manifest.width === 1080 && manifest.height === 1080 && manifest.fps === 30 && manifest.durationSeconds === 8, `${action.id}/${skin}: dimensions/timing mismatch`);
    check(manifest.model?.id === action.model.id && manifest.model?.version === action.model.version, `${action.id}/${skin}: unexpected model recipe`);
    const expected = stage === 'preview' ? action.previewFrames : Array.from({length: 240}, (_, i) => i);
    check(manifest.frameCount === expected.length, `${action.id}/${skin}: frame count mismatch`);
    for (const layer of ['body', 'highlight', 'shadow']) {
      const index = json(verifyReference(root, manifest.sequences?.[layer], cache));
      check(equal(index.frames?.map(f => f.frame), expected), `${action.id}/${skin}/${layer}: sequence coverage mismatch`);
      check(new Set(index.frames.map(f => f.path)).size === expected.length, `${action.id}/${skin}/${layer}: repeated frame path`);
      for (const frame of index.frames) verifyReference(root, frame, cache);
      if (stage === 'full') {
        const endpoint = manifest.qaEndpoint?.[layer];
        check(endpoint?.frame === 240 && endpoint.path.startsWith('qa/endpoints/'), `${action.id}/${skin}/${layer}: missing independent QA endpoint`);
        verifyReference(root, endpoint, cache);
      }
    }
    if (stage === 'full') {
      check(manifest.reviewed === true, `${action.id}/${skin}: renderer did not bind a reviewed preview`);
      verifyReference(root, manifest.reviewedPreview, cache);
    }
    return [skin, reference(root, file)];
  }));
}

export function receiptFile(root, action, stage) { return path.join(root, 'manifests/completed', `${stage}-${action.id}.json`); }

export function runtimeProof(root, action, stage, recipe) {
  const file = path.join(root, 'qa/runtime', stage, `${action.id}.json`), proof = json(file);
  const guard = recipe.runnerFiles.find(f => f.path.endsWith('/runtime-guard.mjs'));
  check(proof.actionId === action.id && proof.stage === stage && proof.runtimeSha256 === recipe.runtime.sha256 && proof.guardSha256 === guard?.sha256, `${action.id}: actual runtime proof source binding mismatch`);
  check(proof.browserVersion === recipe.runtime.browserVersion && proof.actualWebGL?.unmaskedRenderer === recipe.runtime.actualWebGLRenderer && !proof.actualWebGL.contextLost && proof.browserCount === 1, `${action.id}: actual runtime device/browser mismatch`);
  check(equal(proof.args, recipe.runtime.chromiumArgs) && proof.channel === recipe.runtime.chromiumChannel, `${action.id}: actual runtime arguments/channel mismatch`);
  return reference(root, file);
}

export function inspectExisting(root, action, stage, recipe, reviewSha256 = null) {
  const parent = stage === 'preview' ? 'qa/preview' : 'masters';
  const occupied = SKINS.some(skin => { const folder = path.join(root, parent, skin, action.id); return fs.existsSync(folder) && fs.readdirSync(folder).length > 0; });
  const receipt = receiptFile(root, action, stage);
  if (!occupied && !fs.existsSync(receipt)) return 'run';
  check(fs.existsSync(receipt), `${action.id}: partial or unreceipted ${stage} output exists; it is preserved. Use a new root after inspecting it; this runner never overwrites it.`);
  const prior = json(receipt);
  check(prior.recipeSha256 === recipe.sha256 && prior.sourceSha256 === action.sourceSha256 && prior.stage === stage && prior.reviewSha256 === reviewSha256, `${action.id}: completed receipt SHA/review differs; choose a new root`);
  if (recipe.runtime) {
    check(prior.runtimeSha256 === recipe.runtime.sha256, `${action.id}: completed receipt runtime differs`);
    check(equal(prior.runtimeProof, runtimeProof(root, action, stage, recipe)), `${action.id}: actual runtime proof bytes changed`);
  }
  const actual = actionManifests(root, action, stage);
  check(equal(actual, prior.manifests), `${action.id}: completed manifest bytes changed`);
  return 'skip';
}

export function validateReview(root, recipe, review) {
  check(review.format === 'pose-hub-v2-actual-review@1' && review.actualReview === true && review.approved === true, 'Full production requires an explicit external actual-review approval');
  check(typeof review.reviewedBy === 'string' && review.reviewedBy.trim() && Number.isFinite(Date.parse(review.reviewedAt)), 'Actual reviewer and review timestamp are required');
  check(review.batchId === recipe.batchId && review.batchSha256 === recipe.batchSha256 && review.recipeSha256 === recipe.sha256, 'Actual review is bound to another batch/runner recipe');
  check(Array.isArray(review.actions) && review.actions.length === recipe.actions.length && new Set(review.actions.map(a => a.id)).size === recipe.actions.length, 'Actual review must cover each action exactly once');
  for (const action of recipe.actions) {
    const record = review.actions.find(x => x.id === action.id);
    check(record?.approved === true && record.sourceSha256 === action.sourceSha256, `${action.id}: actual review is absent or source SHA changed`);
    // A valid runner receipt proves preview completion, not human viewing. Human
    // viewing is separately attested by the external JSON and exact frame lists.
    check(inspectExisting(root, action, 'preview', recipe) === 'skip', `${action.id}: no complete preview receipt`);
    const actual = actionManifests(root, action, 'preview');
    check(equal(actual, record.previewManifests), `${action.id}: actual preview manifest SHA changed`);
    for (const skin of SKINS) {
      const seen = record.actualVisualFrames?.[skin];
      check(Array.isArray(seen) && action.previewFrames.every(frame => seen.includes(frame)), `${action.id}/${skin}: actual viewing attestation does not cover required preview frames`);
    }
  }
  return review;
}

export async function dispatch(items, workers, work) {
  check(Number.isInteger(workers) && workers >= 1 && workers <= 2, 'Workers must be 1 or 2');
  let next = 0, failure;
  await Promise.all(Array.from({length: workers}, async () => {
    while (!failure && next < items.length) {
      const item = items[next++];
      try { await work(item); } catch (error) { failure ||= error; }
    }
  }));
  // In-flight jobs finish and retain their receipts. After the first observed
  // failure no worker takes another action; partial output is never cleaned up.
  if (failure) throw failure;
}

function childRender(repo, root, action, stage, logFile, runtime) {
  return new Promise((resolve, reject) => {
    const args = ['--import', pathToFileURL(path.join(HERE, 'runtime-guard.mjs')).href, 'drill-anim/tools/v2/render_layers.mjs', '--root', root, '--spec', action.spec, '--action', action.id, '--skins', 'all', ...(stage === 'preview' ? ['--frames', action.previewFrames.join(',')] : ['--reviewed'])];
    const log = fs.createWriteStream(logFile, {flags: 'wx'});
    const env = {...process.env, CHROMIUM_ARGS: runtime.profile.chromiumArgs.join(' '), POSE_HUB_RENDER_RUNTIME: runtime.file,
      POSE_HUB_RENDER_ROOT: root, POSE_HUB_RENDER_ACTION: action.id, POSE_HUB_RENDER_STAGE: stage};
    const child = spawn(process.execPath, args, {cwd: repo, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']});
    let tail = '', line = '';
    for (const stream of [child.stdout, child.stderr]) stream.on('data', bytes => { log.write(bytes); tail = (tail + bytes).slice(-6000); });
    child.stdout.on('data', bytes => {
      line += bytes; const lines = line.split(/\r?\n/); line = lines.pop();
      for (const value of lines) { try { const event = JSON.parse(value); if (event.event === 'frame' && event.frame % 30 === 0) console.log(JSON.stringify({event: 'progress', stage, actionId: action.id, frame: event.frame})); } catch {} }
    });
    child.once('error', error => { log.end(); reject(error); });
    child.once('close', code => { log.end(); code === 0 ? resolve() : reject(new Error(`${action.id}: renderer exited ${code}; partial output retained. Log ${logFile}\n${tail}`)); });
  });
}

export async function main(argv = process.argv.slice(2)) {
  const value = key => { const i = argv.indexOf(key); return i < 0 ? undefined : argv[i + 1]; };
  check(value('--batch') && value('--root') && value('--coordinator-root') && value('--runtime'), 'Pass explicit --batch, absolute --root, --coordinator-root and --runtime');
  const batchFile = path.resolve(value('--batch')), root = value('--root'), coordinator = value('--coordinator-root'), workers = Number(value('--workers') ?? 1), stage = argv.includes('--preview') ? 'preview' : 'full';
  check(path.isAbsolute(root) && path.isAbsolute(coordinator), '--root and --coordinator-root must be absolute');
  const withinCoordinator = path.relative(coordinator, root);
  check(withinCoordinator && !withinCoordinator.startsWith('..') && !path.isAbsolute(withinCoordinator), '--root must be a descendant of the shared --coordinator-root');
  const relative = path.relative(REPO, root);
  check(relative.startsWith('..') || path.isAbsolute(relative), 'Batch output must be outside the source repository');
  check(Number.isInteger(workers) && workers >= 1 && workers <= 2, '--workers must be 1 or 2; each action uses one browser/job');
  const runtime = loadRuntime(value('--runtime'));
  const batch = validateBatch(json(batchFile)), recipe = await buildRecipe(REPO, batchFile, batch, runtime);
  if (batch.runtimeSha256) check(batch.runtimeSha256 === runtime.sha256, 'Batch is bound to another GPU runtime profile');
  const freshRecipe = () => buildRecipe(REPO, batchFile, batch, loadRuntime(runtime.file));
  check(workers <= (batch.maxWorkers ?? 2), 'Requested workers exceed batch policy');
  const snapshot = path.join(root, 'manifests/batch-source.json');
  if (fs.existsSync(snapshot)) check(json(snapshot).sha256 === recipe.sha256, 'Batch root already belongs to another frozen source recipe; choose a new root');
  let reviewSha256 = null;
  if (stage === 'full') {
    check(value('--review'), 'Full production requires --review <external-actual-review.json>; this runner never writes or grants review approval');
    validateReview(root, recipe, json(path.resolve(value('--review'))));
    reviewSha256 = sha256(fs.readFileSync(path.resolve(value('--review'))));
  }
  // Preflight every action before launching any browser, including completed
  // receipts and partial directories left by an interrupted previous attempt.
  const plans = recipe.actions.map(action => ({action, decision: inspectExisting(root, action, stage, recipe, reviewSha256)}));
  const freeSpace = checkFreeSpace(root), globalLock = path.join(coordinator, '.action-library-v2-render.lock');
  check(!fs.existsSync(globalLock), `An active/stale global render lock exists at ${globalLock}; inspect it before proceeding. No automatic cleanup.`);
  console.log(JSON.stringify({event: 'plan', stage, root, coordinator, workers, freeSpace, recipe, actions: plans.map(({action, decision}) => ({id: action.id, decision}))}));
  if (argv.includes('--dry-run')) return;
  const lockFile = path.join(root, '.run_batch.lock');
  const lockRecord = {pid: process.pid, root, coordinator, workers, recipeSha256: recipe.sha256, stage, started: new Date().toISOString()};
  const releaseGlobal = acquireLock(globalLock, lockRecord);
  let releaseBatch;
  try {
    releaseBatch = acquireLock(lockFile, lockRecord);
    if (!fs.existsSync(snapshot)) writeNew(snapshot, recipe);
    const runId = new Date().toISOString().replaceAll(/[:.]/g, '-');
    const logs = path.join(root, 'logs'); fs.mkdirSync(logs, {recursive: true});
    await dispatch(plans.filter(x => x.decision === 'run'), workers, async ({action}) => {
      check((await freshRecipe()).sha256 === recipe.sha256, `${action.id}: source/batch/runner/runtime changed before dispatch`);
      console.log(JSON.stringify({event: 'free-space', actionId: action.id, ...checkFreeSpace(root)}));
      const logFile = path.join(logs, `${runId}-${stage}-${action.id}.log`);
      console.log(JSON.stringify({event: 'action-start', stage, actionId: action.id, logFile}));
      await childRender(REPO, root, action, stage, logFile, runtime);
      check((await freshRecipe()).sha256 === recipe.sha256, `${action.id}: source/batch/runner/runtime changed during rendering`);
      const manifests = actionManifests(root, action, stage);
      const proof = runtimeProof(root, action, stage, recipe);
      writeNew(receiptFile(root, action, stage), {format: 'pose-hub-v2-completed-render@1', stage, actionId: action.id, recipeSha256: recipe.sha256, sourceSha256: action.sourceSha256, runtimeSha256: runtime.sha256, runtimeProof: proof, reviewSha256, manifests, completedAt: new Date().toISOString(), logFile});
      console.log(JSON.stringify({event: 'action-complete', stage, actionId: action.id, skins: 5, productionFrames: stage === 'full' ? 240 : 0, previewFrames: stage === 'preview' ? action.previewFrames : undefined}));
    });
    check((await freshRecipe()).sha256 === recipe.sha256, 'Source/batch/runner/runtime changed before batch completion');
    console.log(JSON.stringify({event: 'batch-complete', batchId: batch.id, stage, recipeSha256: recipe.sha256}));
  } finally { try { releaseBatch?.(); } finally { releaseGlobal(); } }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
}
