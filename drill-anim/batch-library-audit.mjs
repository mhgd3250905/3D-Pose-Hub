// Independent, renderer-free audit and portable offline gallery for batch-rerender output.
// node drill-anim/batch-library-audit.mjs <output-root> [--out <audit-dir>] [--decode] [--bundle]
// --decode independently decodes both videos; without it, producer frame counts remain reported evidence.
// Only audit files and optional bundled copies are written. Production jobs/media are read-only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const value = (name, fallback) => {
  const i = argv.indexOf(name);
  if (i < 0) return fallback;
  if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw Error(`Missing value for ${name}`);
  return argv[i + 1];
};
if (!argv[0] || argv[0].startsWith('--') || argv.includes('--help')) {
  console.log('Usage: node batch-library-audit.mjs <output-root> [--out <audit-dir>] [--decode] [--bundle] [--delivery <reframed-dir>] [--no-tree] [--ffprobe <exe>] [--ffmpeg <exe>] [--source-root <repo>]');
  process.exit(argv.includes('--help') ? 0 : 2);
}
const root = path.resolve(argv[0]);
const out = path.resolve(value('--out', path.join(root, 'audit')));
const independentDecode = argv.includes('--decode');
const bundle = argv.includes('--bundle');
const deliveryRoot = value('--delivery') ? path.resolve(value('--delivery')) : null;
const slash = p => p.split(path.sep).join('/');
const relative = p => slash(path.relative(root, p));
const inside = (base, p) => { const r = path.relative(base, p); return !r.startsWith('..' + path.sep) && r !== '..' && !path.isAbsolute(r); };
if (out === root || ['jobs', 'media', 'review-required'].some(d => inside(path.join(root, d), out))) throw Error('Audit output must be separate from production jobs/media.');
if (deliveryRoot && (out === deliveryRoot || ['jobs', 'media', 'review-required'].some(d => inside(path.join(deliveryRoot, d), out)))) throw Error('Audit output must be separate from derived jobs/media.');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fileSha = p => new Promise((resolve, reject) => {
  const h = crypto.createHash('sha256'), s = fs.createReadStream(p);
  s.on('data', chunk => h.update(chunk)); s.on('error', reject); s.on('end', () => resolve(h.digest('hex')));
});
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = p => fs.existsSync(p);
const atomic = (p, data) => {
  fs.mkdirSync(path.dirname(p), { recursive: true }); const temp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(temp, data); fs.renameSync(temp, p);
};
const json = (p, data) => atomic(p, JSON.stringify(data, null, 2) + '\n');
const stable = x => JSON.stringify(x && typeof x === 'object' ? Array.isArray(x) ? x.map(v => JSON.parse(stable(v))) : Object.fromEntries(Object.keys(x).sort().map(k => [k, JSON.parse(stable(x[k]))])) : x);
const stripAppearance = s => { const x = structuredClone(s); for (const k of ['modelProfile', 'trainingCollar', 'alignClavicles', 'size', 'fps']) delete x[k]; return x; };
const command = (exe, args) => new Promise(resolve => {
  let stdout = '', stderr = ''; const p = spawn(exe, args, { windowsHide: true });
  p.stdout.on('data', d => { stdout += d; }); p.stderr.on('data', d => { stderr = (stderr + d).slice(-12000); });
  p.on('error', error => resolve({ code: null, stdout, stderr, unavailable: error.message }));
  p.on('close', code => resolve({ code, stdout, stderr }));
});
const safeFile = (p, base = root) => {
  if (typeof p !== 'string') throw Error('Missing media path');
  const resolved = path.resolve(base, p); if (!inside(base, resolved)) throw Error(`Media path escapes allowed library: ${p}`);
  if (exists(resolved) && !inside(fs.realpathSync(base), fs.realpathSync(resolved))) throw Error(`Media symlink escapes allowed library: ${p}`);
  return resolved;
};
function dimensions(p) {
  const b = fs.readFileSync(p);
  if (b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  if (b[0] !== 255 || b[1] !== 216) throw Error(`Unsupported image: ${p}`);
  for (let i = 2; i < b.length;) {
    if (b[i++] !== 255) continue;
    while (b[i] === 255) i++;
    const marker = b[i++];
    if (marker === 217 || marker === 218) break;
    if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
    const length = b.readUInt16BE(i);
    if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker)) return [b.readUInt16BE(i + 5), b.readUInt16BE(i + 3)];
    i += length;
  }
  throw Error(`No JPEG dimensions: ${p}`);
}
const plan = read(path.join(root, 'plan.json'));
if (!Array.isArray(plan.jobs)) throw Error('plan.json must contain jobs');
if (new Set(plan.jobs.map(j => j.id)).size !== plan.jobs.length) throw Error('Duplicate planned job ID');
const deliveryManifestFile = deliveryRoot ? safeFile('delivery-manifest.json', deliveryRoot) : null;
const delivery = deliveryManifestFile ? read(deliveryManifestFile) : null;
if (delivery && (delivery.schemaVersion !== 1 || delivery.kind !== 'constant_full_cycle_reframe' || !delivery.overrides || Array.isArray(delivery.overrides) || delivery.sourceModel?.id !== plan.model?.id || delivery.sourceModel?.version !== plan.model?.version || Object.keys(delivery.overrides).some(id => !plan.jobs.some(j => j.id === id)))) throw Error('Invalid delivery schema/model/job binding');
const deliveryManifestIdentity = deliveryManifestFile ? { path: 'delivery-manifest.json', bytes: fs.statSync(deliveryManifestFile).size, sha256: await fileSha(deliveryManifestFile), storageRoot: 'delivery' } : null;
fs.mkdirSync(out, { recursive: true });
const lock = path.join(out, '.audit-lock');
const evidenceFiles = new Set([path.join(root, 'plan.json')]);
const inventoryHashes = new Map();
const sourceRoot = path.resolve(value('--source-root', path.join(path.dirname(fileURLToPath(import.meta.url)), '..')));
const modelSourceChecks = [];
for (const [name, expected] of Object.entries(plan.model?.sourceSha256 || {})) {
  const p = path.resolve(sourceRoot, name), available = inside(sourceRoot, p) && exists(p);
  const bytes = available ? fs.readFileSync(p) : null;
  const observed = bytes ? sha(name.endsWith('.glb') ? bytes : bytes.toString('utf8').replace(/\r\n/g, '\n')) : null;
  modelSourceChecks.push({ path: name, available, expectedSha256: expected, observedSha256: observed, pass: available ? observed === expected : null });
}
const lockFd = fs.openSync(lock, 'wx'); fs.closeSync(lockFd);

async function snapshotFile(p, base = root) {
  evidenceFiles.add(p); if (!exists(p)) return null;
  const stat = fs.statSync(p), hash = await fileSha(p); inventoryHashes.set(relative(p), hash);
  return { path: slash(path.relative(base, p)), bytes: stat.size, sha256: hash, ...(base !== root ? { storageRoot: 'delivery' } : {}) };
}
function loadEvidence(folder, name, issues) {
  const p = path.join(folder, name); evidenceFiles.add(p);
  if (!exists(p)) return null;
  try { return read(p); } catch (e) { issues.push({ severity: 'failed', code: 'invalid_json', message: `${relative(p)}: ${e.message}` }); return null; }
}
function exactFrames(rows, N, fps) {
  const real = rows.filter(r => r.f >= 0);
  return real.length === N && real.every((r, i) => r.f === i && Number.isFinite(r.t) && Math.abs(r.t - i / fps) < 1e-8);
}
function cycleShape(rows, N, stillAt) {
  const validArray = Array.isArray(rows);
  const still = validArray ? rows.filter(r => r.f === -1) : [];
  return { records: validArray ? rows.length : 0, cycleFrames: validArray ? rows.filter(r => r.f >= 0).length : 0, stillFrames: still.length,
    exactIndicesAndTimes: validArray && rows.length === N + 1 && exactFrames(rows, N, 30) && still.length === 1 && Number.isFinite(still[0].t) && Math.abs(still[0].t - stillAt) < 1e-8 };
}
function pairedJoints(original, rendered, N, stillAt) {
  const a = cycleShape(original, N, stillAt), b = cycleShape(rendered, N, stillAt);
  const result = { independent: true, source: 'reference/met-cycle.json versus frames/met-cycle.json', original: a, rendered: b,
    frames: N, checkedIncludingStill: 0, sameFrameAndTime: true, identicalJointKeys: true, finiteCoordinates: true, jointMmMax: 0, thresholdMmExclusive: 1e-5, solverParametersMatch: true, solverWarningsMatch: true, worst: null };
  if (!a.exactIndicesAndTimes || !b.exactIndicesAndTimes) return { ...result, pass: false, failure: 'invalid_cycle_indices_or_times' };
  const byFrame = new Map(original.map(r => [r.f, r]));
  for (const next of rendered) {
    const prior = byFrame.get(next.f);
    if (!prior || !Number.isFinite(next.t) || Math.abs(prior.t - next.t) > 1e-10) result.sameFrameAndTime = false;
    if (!prior?.J || !next.J || typeof prior.J !== 'object' || typeof next.J !== 'object') { result.identicalJointKeys = false; continue; }
    const oldKeys = Object.keys(prior.J).sort(), newKeys = Object.keys(next.J).sort();
    if (!oldKeys.length || stable(oldKeys) !== stable(newKeys)) { result.identicalJointKeys = false; continue; }
    for (const joint of oldKeys) {
      const x = prior.J[joint], y = next.J[joint];
      if (!Array.isArray(x) || !Array.isArray(y) || x.length !== 3 || y.length !== 3 || !x.every(Number.isFinite) || !y.every(Number.isFinite)) { result.finiteCoordinates = false; continue; }
      for (let coordinate = 0; coordinate < 3; coordinate++) {
        const mm = Math.abs(x[coordinate] - y[coordinate]) * 1000;
        if (mm > result.jointMmMax) { result.jointMmMax = mm; result.worst = { f: next.f, t: next.t, joint, coordinate, original: x[coordinate], rendered: y[coordinate], differenceMm: mm }; }
      }
    }
    result.solverParametersMatch &&= stable(prior.x ?? null) === stable(next.x ?? null);
    result.solverWarningsMatch &&= stable(prior.solverWarn ?? null) === stable(next.solverWarn ?? null);
    result.checkedIncludingStill++;
  }
  result.pass = result.sameFrameAndTime && result.identicalJointKeys && result.finiteCoordinates && result.checkedIncludingStill === N + 1 && result.jointMmMax < result.thresholdMmExclusive;
  return result;
}
function bodyFlags(q) {
  return { belowFloor: q.below_floor, capsule: !q.self_clip?.ok, knee: !q.limits?.knee_flex_backward, elbow: !q.limits?.elbow_flex_forward, hip: !q.limits?.hip_ok, waist: !q.limits?.waist_ok,
    ...Object.fromEntries(Object.entries(q.hand_clip || {}).filter(([, v]) => v && typeof v === 'object').map(([k, v]) => ['hand:' + k, v.ok === false])),
    ...Object.fromEntries(Object.entries(q.pins || {}).map(([k, v]) => ['pin:' + k, v.ok === false])),
    ...Object.fromEntries(Object.entries(q.straight || {}).map(([k, v]) => ['straight:' + k, !v.ok])) };
}
function filesComplete(folder, N) {
  const missing = [], expected = ['still', ...Array.from({ length: N }, (_, i) => String(i).padStart(4, '0'))];
  for (const f of expected) {
    for (const type of ['m', 'g']) { const p = path.join(folder, 'frames', `${type}-${f}.png`); if (!exists(p) || fs.statSync(p).size <= 100) missing.push(relative(p)); }
    const p = path.join(folder, 'composite', f + '.png'); if (!exists(p) || fs.statSync(p).size <= 100) missing.push(relative(p));
  }
  return { expectedCycleFrames: N, expectedStillFrames: 1, expectedRawPassFiles: (N + 1) * 2, expectedCompositeFiles: N + 1, missingCount: missing.length, firstMissing: missing.slice(0, 20), pass: missing.length === 0 };
}
async function auditVideo(kind, description, N, duration, issues, base = root) {
  const size = kind === 'master' ? 1080 : 720;
  let p;
  try { p = safeFile(description?.path, base); } catch (e) { issues.push({ severity: 'failed', code: 'media_path', message: e.message }); return null; }
  if (!exists(p)) { issues.push({ severity: 'failed', code: 'media_missing', message: relative(p) }); return null; }
  const identity = await snapshotFile(p, base), before = fs.statSync(p);
  const row = { ...identity, producer: description, sha256MatchesProducer: identity.sha256 === description.sha256 };
  if (!row.sha256MatchesProducer || before.size !== description.bytes) issues.push({ severity: 'failed', code: 'media_identity_mismatch', message: relative(p) });
  const q = await command(value('--ffprobe', 'ffprobe'), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,pix_fmt,width,height,avg_frame_rate,r_frame_rate,nb_frames,sample_aspect_ratio:format=duration', '-of', 'json', p]);
  if (q.unavailable) issues.push({ severity: 'review_required', code: 'ffprobe_unavailable', message: q.unavailable });
  else if (q.code !== 0) issues.push({ severity: 'failed', code: 'ffprobe_failed', message: q.stderr });
  else {
    try {
      row.probe = JSON.parse(q.stdout); const v = row.probe.streams[0], D = Number(row.probe.format.duration);
      row.headerPass = v?.codec_name === 'h264' && v.pix_fmt === 'yuv420p' && v.width === size && v.height === size && v.avg_frame_rate === '30/1' && v.r_frame_rate === '30/1' && Number(v.nb_frames) === N && Math.abs(D - duration) < 0.02 && (!v.sample_aspect_ratio || ['1:1', 'N/A'].includes(v.sample_aspect_ratio));
      if (!row.headerPass) issues.push({ severity: 'failed', code: 'video_header_mismatch', message: `${kind}: expected ${size}² H264/yuv420p/30fps/${N}frames/${duration}s` });
    } catch (e) { issues.push({ severity: 'failed', code: 'probe_json', message: e.message }); }
  }
  row.decode = { mode: 'producer_frame_count_report', independent: false, reportedDecodedFrames: Number(description.nb_read_frames), producerCountMatches: Number(description.nb_read_frames) === N, caveat: 'result.json reports ffprobe counted frames; no separate per-command full-decode record exists in this schema.' };
  if (!row.decode.producerCountMatches) issues.push({ severity: 'review_required', code: 'producer_decode_count_missing', message: `${kind}: producer decoded-frame count is missing or differs` });
  if (independentDecode) {
    const args = ['-v', 'error', '-xerror', '-err_detect', 'explode', '-threads', '1', '-i', p, '-map', '0:v:0', '-an', '-progress', 'pipe:1', '-nostats', '-f', 'null', '-'];
    const r = await command(value('--ffmpeg', 'ffmpeg'), args);
    const frames = [...r.stdout.matchAll(/^frame=(\d+)\s*$/gm)].map(m => Number(m[1]));
    row.decode = { mode: 'independent_full_cpu_decode', independent: true, exitCode: r.code, decodedFrames: frames.at(-1) ?? null, complete: r.stdout.includes('progress=end'), stderr: r.stderr, command: [value('--ffmpeg', 'ffmpeg'), ...args.map(a => a === p ? relative(p) : a)], checkedAt: new Date().toISOString(), mediaSha256: identity.sha256 };
    row.decode.pass = r.code === 0 && row.decode.complete && row.decode.decodedFrames === N;
    if (!row.decode.pass) issues.push({ severity: r.unavailable ? 'review_required' : 'failed', code: 'independent_decode_failed', message: r.unavailable || `${kind}: exit ${r.code}, decoded ${row.decode.decodedFrames}/${N}: ${r.stderr}` });
  }
  const after = fs.statSync(p);
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) issues.push({ severity: 'failed', code: 'media_changed_during_audit', message: relative(p) });
  return row;
}

async function auditJob(job) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(job.id)) throw Error('Unsafe planned job ID: ' + job.id);
  const folder = path.join(root, 'jobs', job.id), issues = [];
  const status = loadEvidence(folder, 'status.json', issues), result = loadEvidence(folder, 'result.json', issues), input = loadEvidence(folder, 'input.json', issues), source = loadEvidence(folder, 'source.json', issues);
  const row = { id: job.id, name: result?.name || input?.entry?.name || job.id, category: job.category || result?.category || 'unclassified', producerPhase: status?.phase || 'queued', plannedFrames: job.frames, plannedDuration: job.duration, modelId: plan.model?.id, modelVersion: plan.model?.version, source: source || input?.entry || null, issues };
  row.evidence = ['input.json', 'source.json', 'status.json', 'result.json', 'spec-original.json', 'spec.json', 'theme.json', 'motion-invariance.json', 'renderer.json', 'qa.json', 'baseline-qa.json', 'reference/met-cycle.json', 'frames/met-cycle.json'].filter(n => exists(path.join(folder, n))).map(n => relative(path.join(folder, n)));
  if (!result) {
    if (status?.phase === 'failed') issues.push({ severity: 'failed', code: 'producer_failed', message: status.error || 'Producer failed without result' });
    row.status = issues.some(i => i.severity === 'failed') ? 'failed' : 'pending';
    return row;
  }
  if (!input || !source) issues.push({ severity: 'review_required', code: 'frozen_input_missing', message: 'input.json or source.json is absent' });
  const N = Number(job.frames), duration = Number(job.duration);
  if (!Number.isInteger(N) || N <= 0 || Math.round(duration * 30) !== N || result.frames !== N || result.fps !== 30 || result.duration !== duration || result.id !== job.id) issues.push({ severity: 'failed', code: 'result_contract_mismatch', message: 'ID, 30fps, duration or frame count differs from plan' });
  if (result.modelProfile !== plan.model?.id || result.modelVersion !== plan.model?.version) issues.push({ severity: 'failed', code: 'model_version_mismatch', message: `${result.modelProfile}@${result.modelVersion}` });
  if (input) {
    const { fingerprint, ...frozen } = input;
    row.inputFingerprintPass = sha(JSON.stringify(frozen)) === fingerprint && fingerprint === job.fingerprint && source?.fingerprint === fingerprint && result.source?.fingerprint === fingerprint;
    if (!row.inputFingerprintPass) issues.push({ severity: 'failed', code: 'input_fingerprint_mismatch', message: 'Frozen input/plan/result identity differs' });
    row.authoredJsonSha256 = sha(JSON.stringify(input.original));
    row.authoredJsonMatchesSource = !source?.authoredSpecJsonSha256 || row.authoredJsonSha256 === source.authoredSpecJsonSha256;
    if (!row.authoredJsonMatchesSource) issues.push({ severity: 'failed', code: 'authored_json_hash_mismatch', message: 'Original imported action no longer matches recorded source' });
    row.motionContractPass = stable(stripAppearance(input.original)) === stable(stripAppearance(input.spec));
    row.appearanceOverrides = Object.fromEntries(['modelProfile', 'trainingCollar', 'alignClavicles', 'size', 'fps'].filter(k => stable(input.original[k] ?? null) !== stable(input.spec[k] ?? null)).map(k => [k, { original: input.original[k] ?? null, rendered: input.spec[k] ?? null }]));
    if (!row.motionContractPass) issues.push({ severity: 'failed', code: 'motion_contract_changed', message: 'Action fields changed beyond recorded appearance/resolution overrides' });
    for (const [name, expected] of [['spec-original.json', input.original], ['spec.json', input.spec], ['theme.json', input.theme]]) {
      const actual = loadEvidence(folder, name, issues);
      if (!actual || stable(actual) !== stable(expected)) issues.push({ severity: 'failed', code: 'input_snapshot_mismatch', message: name });
    }
    row.currentSource = [];
    for (const [p, expected, kind] of [[source?.sourceSpecPath, source?.sourceSpecSha256, 'spec'], [source?.sourceThemePath, source?.sourceThemeSha256, 'theme']]) {
      if (!p || !expected) continue;
      const found = exists(p), observed = found ? await fileSha(p) : null;
      row.currentSource.push({ kind, path: p, available: found, expectedSha256: expected, observedSha256: observed, pass: found ? expected === observed : null });
      if (found && observed !== expected) issues.push({ severity: 'failed', code: 'live_source_drift', message: `${kind}: ${p}` });
    }
  }
  row.motionInvariance = loadEvidence(folder, 'motion-invariance.json', issues) || result.motionInvariance;
  const samples = row.motionInvariance?.records;
  if (!row.motionInvariance?.pass || !Array.isArray(samples) || !samples.length || samples.some(r => !Number.isFinite(r.boneDelta) || !Number.isFinite(r.jointMm) || r.boneDelta > 1e-9 || r.jointMm > 0.001)) issues.push({ severity: 'failed', code: 'motion_invariance_failed', message: 'Same-source old/new profile bone/joint samples are absent or differ' });
  row.motionInvarianceScope = 'key_phase';
  row.motionInvarianceScopeDescription = 'Only the recorded representative phases; no full-cycle matrix/joint claim or downloaded old-film pixel equality.';
  row.renderer = loadEvidence(folder, 'renderer.json', issues);
  if (!row.renderer) issues.push({ severity: 'review_required', code: 'renderer_evidence_missing', message: 'renderer.json is absent' });
  else if (row.renderer.errors?.length || row.renderer.completeFrames !== N || row.renderer.profile?.enabled !== true || row.renderer.profile?.profileId !== plan.model?.id) issues.push({ severity: 'failed', code: 'renderer_evidence_failed', message: 'Renderer errors, missing frames or inactive/wrong profile' });
  const metricFile = path.join(folder, 'frames', 'met-cycle.json'); evidenceFiles.add(metricFile);
  let newMetrics = null;
  if (!exists(metricFile)) issues.push({ severity: 'failed', code: 'metrics_missing', message: relative(metricFile) });
  else {
    try { newMetrics = read(metricFile); row.metrics = cycleShape(newMetrics, N, input?.spec?.stillAt ?? 0);
      if (!row.metrics.exactIndicesAndTimes) issues.push({ severity: 'failed', code: 'metric_indices_invalid', message: 'Expected one still at stillAt and exact unique cycle indices 0..N−1 at f/30' });
    } catch (e) { issues.push({ severity: 'failed', code: 'metric_json_invalid', message: e.message }); }
  }
  const full = row.motionInvariance?.fullCycle;
  const referenceFile = path.join(folder, 'reference', 'met-cycle.json'); evidenceFiles.add(referenceFile);
  if (full || exists(referenceFile)) {
    if (!exists(referenceFile) || !newMetrics) issues.push({ severity: 'failed', code: 'paired_cycle_missing', message: 'Claimed full-cycle evidence lacks an original/new metric sequence' });
    else {
      try {
        row.fullCycleJointAudit = pairedJoints(read(referenceFile), newMetrics, N, input?.spec?.stillAt ?? 0);
        if (!row.fullCycleJointAudit.pass) issues.push({ severity: 'failed', code: 'paired_cycle_joints_failed', message: `Independent old/new J comparison: ${JSON.stringify(row.fullCycleJointAudit.worst || row.fullCycleJointAudit.failure || row.fullCycleJointAudit)}` });
      } catch (e) { issues.push({ severity: 'failed', code: 'paired_cycle_invalid', message: e.message }); }
    }
  }
  if (full) {
    row.motionInvarianceScope = 'full_cycle_failed';
    row.motionInvarianceScopeDescription = 'Declared full-cycle proof did not pass independent validation; no full-cycle pose-invariance pass is claimed.';
    row.fullCycleBoneEvidence = { ...full, independentlyRecomputed: false, source: 'producer motion-invariance.fullCycle; matrices themselves are not serialized' };
    const valid = full.pass === true && full.frames === N && full.checkedIncludingStill === N + 1 && Number.isFinite(full.boneDeltaMax) && full.boneDeltaMax >= 0 && full.boneDeltaMax < 1e-8 && Number.isFinite(full.jointMmMax) && full.jointMmMax >= 0 && full.jointMmMax < 1e-5;
    row.fullCycleBoneEvidence.metadataValid = valid;
    if (!valid) issues.push({ severity: 'failed', code: 'full_cycle_record_invalid', message: 'Producer fullCycle count, pass or maximum errors violate its declared full-cycle contract' });
    const matches = row.fullCycleJointAudit?.pass === true && Math.abs(row.fullCycleJointAudit.jointMmMax - full.jointMmMax) <= 1e-8;
    row.fullCycleJointAudit && (row.fullCycleJointAudit.producerMaximumMatches = matches);
    if (!matches) issues.push({ severity: 'failed', code: 'full_cycle_joint_max_mismatch', message: 'Independent J maximum differs from producer fullCycle record' });
    if (valid && matches) {
      row.motionInvarianceScope = 'full_cycle';
      row.motionInvarianceScopeDescription = 'Audit independently compared all recorded J coordinates at every frame plus still; full-cycle bone-matrix maxima are producer records, not independently recomputed. No old-film pixel-equality claim.';
    }
  }
  row.frameFiles = filesComplete(folder, N);
  if (!row.frameFiles.pass) issues.push({ severity: 'failed', code: 'frame_files_missing', message: `${row.frameFiles.missingCount} raw/composite files missing` });
  row.qa = loadEvidence(folder, 'qa.json', issues) || result.qa;
  row.baselineQa = loadEvidence(folder, 'baseline-qa.json', issues);
  row.baselineComparison = result.baselineComparison || null;
  row.qaCoverage = result.qaCoverage || null;
  row.bodyQaAttribution = { category: 'baseline_unavailable', independentlyRecomputed: false, newBodyFlags: null, inheritedBodyFlags: null };
  if (row.baselineQa && row.qa) {
    const old = row.baselineQa, current = row.qa, previousFlags = bodyFlags(old), currentFlags = bodyFlags(current);
    const added = Object.keys(currentFlags).filter(k => currentFlags[k] && !previousFlags[k]).sort(), inherited = Object.keys(currentFlags).filter(k => currentFlags[k] && previousFlags[k]).sort();
    row.bodyQaAttribution = { category: added.length ? 'new_body_issue' : inherited.length ? 'inherited_body_issue' : 'no_body_flags', independentlyRecomputed: true, sameFrozenSource: row.baselineComparison?.sameFrozenSource === true,
      oldQaPass: old.pass, newQaPass: current.pass, oldSolverWarningFrames: old.solver_warning_frames, newSolverWarningFrames: current.solver_warning_frames, newBodyFlags: added, inheritedBodyFlags: inherited,
      oldBodyFlags: previousFlags, newBodyFlagsMap: currentFlags, newRenderFrameEdgeTouches: current.frame_edge_touch_frames ?? null, frameEdgeComparison: 'New render only; no old-profile composite edge evidence claimed.' };
    if (!old.frames_complete || old.frames !== N || !Array.isArray(old.per_frame) || old.per_frame.length !== N || old.per_frame.some((r, i) => r.f !== i)) issues.push({ severity: 'failed', code: 'baseline_qa_incomplete', message: 'Original-profile QA does not completely cover the same cycle' });
    if (row.baselineComparison) {
      const recorded = row.baselineComparison;
      const matches = recorded.sameFrozenSource === true && recorded.oldQaPass === old.pass && recorded.newQaPass === current.pass && recorded.oldSolverWarningFrames === old.solver_warning_frames && recorded.newSolverWarningFrames === current.solver_warning_frames && stable([...(recorded.newBodyFlags || [])].sort()) === stable(added) && stable([...(recorded.inheritedBodyFlags || [])].sort()) === stable(inherited);
      row.bodyQaAttribution.producerFlagsMatch = matches;
      if (!matches) issues.push({ severity: 'failed', code: 'baseline_comparison_mismatch', message: 'Producer baselineComparison differs from independently recomputed old/new QA flags' });
    } else issues.push({ severity: 'review_required', code: 'baseline_comparison_missing', message: 'Original-profile QA exists but committed attribution is absent' });
    if (added.length) issues.push({ severity: 'review_required', code: 'new_body_qa_flags', message: 'New-body flags: ' + added.join(', ') });
    if (inherited.length) issues.push({ severity: 'review_required', code: 'inherited_body_qa_flags', message: 'Inherited original-profile flags: ' + inherited.join(', ') });
    const compact = { ...old }; delete compact.per_frame; row.baselineQa = compact;
  } else if (full) issues.push({ severity: 'review_required', code: 'baseline_qa_missing', message: 'Full-cycle motion proof exists but original-profile QA/attribution is absent' });
  if (row.qa && result.qa && stable(row.qa) !== stable(result.qa)) issues.push({ severity: 'failed', code: 'qa_result_mismatch', message: 'qa.json differs from committed result QA' });
  if (!row.qa || !row.qa.frames_complete || row.qa.frames !== N) issues.push({ severity: 'failed', code: 'qa_incomplete', message: 'Complete cycle QA absent' });
  else {
    if (row.qa.pass !== true) issues.push({ severity: 'review_required', code: 'numeric_qa_failed', message: 'Original QA reports pass=false; complete media is retained for review' });
    if (row.qa.solver_warning_frames > 0) issues.push({ severity: 'review_required', code: 'solver_warnings', message: `${row.qa.solver_warning_frames} warning frames; original QA pass excludes solver warnings` });
    const pf = row.qa.per_frame;
    if (!Array.isArray(pf) || pf.length !== N || pf.some((r, i) => r.f !== i)) issues.push({ severity: 'failed', code: 'qa_frame_indices_invalid', message: 'QA per_frame must exactly cover 0..N−1' });
    const empty = [...Object.entries(row.qa.pins || {}), ...Object.entries(row.qa.straight || {}), ...Object.entries(row.qa.hand_clip || {}).filter(([k]) => k.startsWith('contact_'))].filter(([, v]) => v?.frames === 0).map(([k]) => k);
    if (empty.length) issues.push({ severity: 'review_required', code: 'qa_condition_not_covered', message: empty.join(', ') });
    const qaCompact = { ...row.qa }; delete qaCompact.per_frame; row.qa = qaCompact;
  }
  row.knownLimitations = result.knownLimitations || source?.knownLimitations || [];
  row.media = {};
  for (const kind of ['master', 'mobile']) row.media[kind] = await auditVideo(kind, result.media?.[kind], N, duration, issues);
  if (result.poster) {
    try {
      const p = safeFile(result.poster); row.poster = { ...await snapshotFile(p), dimensions: dimensions(p), timeSeconds: result.posterTime };
      if (row.poster.dimensions.join('x') !== '540x540' || !Number.isFinite(result.posterTime) || result.posterTime < 0 || result.posterTime >= duration) issues.push({ severity: 'failed', code: 'poster_contract_mismatch', message: 'Expected540² and a valid original playback phase' });
      const expected = Math.min(N - 1, Math.max(0, Math.round((input?.entry?.posterTimeSeconds ?? input?.spec?.stillAt ?? 0) * 30))) / 30;
      if (Math.abs(expected - result.posterTime) > 1e-9) issues.push({ severity: 'failed', code: 'poster_time_mismatch', message: `${result.posterTime}s differs from frozen ${expected}s` });
    } catch (e) { issues.push({ severity: 'failed', code: 'poster_missing_or_invalid', message: e.message }); }
  } else issues.push({ severity: 'failed', code: 'poster_missing', message: 'No result.poster path' });
  if (['ready', 'review_required'].includes(status?.phase) && status.phase !== result.status) issues.push({ severity: 'failed', code: 'producer_status_mismatch', message: 'status and result disagree' });
  if (!['ready', 'review_required'].includes(status?.phase)) issues.push({ severity: 'review_required', code: 'producer_not_committed', message: `Current phase: ${status?.phase || 'missing'}` });
  if (result.status === 'review_required') issues.push({ severity: 'review_required', code: 'producer_requires_review', message: 'Producer retained output for review' });
  row.status = issues.some(i => i.severity === 'failed') ? 'failed' : issues.some(i => i.severity === 'review_required') ? 'review_required' : 'ready';
  return row;
}

// Reframing is a derived media selection. Original QA/motion/media audit is retained verbatim;
// it cannot promote the original producer's review state to ready.
const alphaCheckPython = String.raw`
import json,sys,os,math
from PIL import Image
proof=json.load(open(sys.argv[1],encoding='utf8'))
root=os.path.realpath(sys.argv[2]); tr=proof['constantTransform']; threshold=proof['alphaThreshold']; size=proof['canvasSize']
resampling=getattr(Image.Resampling,tr.get('resampling',proof.get('resampling','LANCZOS')))
def bbox(im):
    b=im.point(lambda a:255 if a>threshold else 0).getbbox()
    if b is None: raise ValueError('Empty body alpha')
    return [b[0],b[1],b[2]-1,b[3]-1]
minimum=size; minimum_uncropped=size; mismatches=[]; fit_all=True; edges=0; union=None
for frame in proof['frames']:
    src=os.path.realpath(os.path.join(root,frame['raw']['gPath']))
    if os.path.commonpath([root,src])!=root: raise ValueError('Raw alpha path escape')
    with Image.open(src) as image:
        if list(image.size)!=frame['raw']['size']: raise ValueError('Raw dimensions differ')
        alpha=image.convert('RGBA').getchannel('A'); raw=bbox(alpha)
        resized=alpha.resize((tr['resizedWidth'],tr['resizedHeight']),resampling); resized_box=bbox(resized)
    translated=[resized_box[0]+tr['pasteX'],resized_box[1]+tr['pasteY'],resized_box[2]+tr['pasteX'],resized_box[3]+tr['pasteY']]
    uncropped_margin=min(translated[0],translated[1],size-1-translated[2],size-1-translated[3]); minimum_uncropped=min(minimum_uncropped,uncropped_margin)
    canvas=Image.new('L',(size,size)); canvas.paste(resized,(tr['pasteX'],tr['pasteY']),resized); actual=bbox(canvas)
    boundary=max(canvas.crop((0,0,size,2)).getextrema()[1],canvas.crop((0,size-2,size,size)).getextrema()[1],canvas.crop((0,0,2,size)).getextrema()[1],canvas.crop((size-2,0,size,size)).getextrema()[1])
    edge=boundary>0
    margin=min(actual[0],actual[1],size-1-actual[2],size-1-actual[3]); minimum=min(minimum,margin)
    fit=uncropped_margin>=40 and margin>=40 and not edge
    fit_all=fit_all and fit; edges+=int(edge)
    union=raw[:] if union is None else [min(union[0],raw[0]),min(union[1],raw[1]),max(union[2],raw[2]),max(union[3],raw[3])]
    recorded=frame['composite']
    if raw!=frame['raw']['bbox'] or translated!=recorded['uncroppedBodyAlphaBBox'] or actual!=recorded['bodyAlphaBBox'] or fit!=recorded['fit'] or edge!=recorded['edgeTouch'] or boundary!=recorded['edgeAlphaMax'] or margin!=recorded['minimumMarginPixels']:
        mismatches.append({'f':frame['f'],'actualRawBBox':raw,'actualCompositeBBox':actual,'fit':fit,'edgeTouch':edge,'minimumMarginPixels':margin})
summary=proof['summary']; count=len(proof['frames']); frames=count-1
summary_match=summary['frames']==frames and summary['checkedIncludingStill']==count and summary['fitAllFrames']==fit_all and summary['edgeTouchFrames']==edges and summary['minimumBodyMarginPixels']==minimum and union==proof['unionRawBBox']
print(json.dumps({'independent':True,'method':'Actual raw g-alpha with Pillow; uncropped full resize bounds require40px margin and final masked-paste alpha bounds are checked','checkedIncludingStill':count,'frames':frames,'fitAllFrames':fit_all,'edgeTouchFrames':edges,'minimumBodyMarginPixels':minimum,'minimumUncroppedMarginPixels':minimum_uncropped,'summaryMatches':summary_match,'mismatchCount':len(mismatches),'firstMismatch':mismatches[:1],'pass':fit_all and edges==0 and summary_match and not mismatches}))
`;
async function applyDelivery(row, job) {
  const override = delivery?.overrides?.[job.id]; if (!override) return row;
  row.originalProducerAudit = structuredClone(row);
  const issues = [], failure = message => { throw Error(message); };
  try {
    if (override.sourceFingerprint !== job.fingerprint || override.modelId !== plan.model.id || override.modelVersion !== plan.model.version || override.bodyQaInherited !== true || override.appearanceAndMotionUnchanged !== true) failure('Derived fingerprint/model/motion binding differs');
    const required = ['input.json', 'result.json', 'qa.json', 'baseline-qa.json', 'motion-invariance.json', 'frames/met-cycle.json', 'reference/met-cycle.json', 'spec.json', 'theme.json', 'composite/place.json'];
    const sourceEvidence = [];
    for (const name of required) {
      const source = safeFile(`jobs/${job.id}/${name}`), expected = override.sourceEvidenceSha256?.[name];
      if (!/^[a-f0-9]{64}$/i.test(expected || '') || await fileSha(source) !== expected) failure('Derived source evidence SHA differs: ' + name);
      sourceEvidence.push({ path: relative(source), sha256: expected });
    }
    if (override.originalComposite?.edgeTouchFrames !== row.qa?.frame_edge_touch_frames) failure('Original composite edge count differs from original QA');
    const proofFile = safeFile(override.framingProof?.path, deliveryRoot), proofIdentity = await snapshotFile(proofFile, deliveryRoot);
    if (proofIdentity.sha256 !== override.framingProof?.sha256) failure('Framing proof SHA differs');
    const proof = read(proofFile), frames = proof.frames, tr = proof.constantTransform;
    const expectedStill = read(safeFile(`jobs/${job.id}/spec.json`)).stillAt ?? 0;
    if (proof.id !== job.id || proof.sourceFingerprint !== job.fingerprint || stable(proof.rawSize) !== '[2160,2160]' || proof.canvasSize !== 1080 || proof.alphaThreshold !== 10 || !Array.isArray(frames) || frames.length !== job.frames + 1 || !tr || !Number.isFinite(tr.s) || tr.s <= 0 || ![tr.resizedWidth, tr.resizedHeight, tr.pasteX, tr.pasteY].every(Number.isInteger) || tr.resizedWidth <= 0 || tr.resizedHeight <= 0 || Math.abs(tr.resizedWidth / 2160 - tr.s) > 1 / 2160 || Math.abs(tr.resizedHeight / 2160 - tr.s) > 1 / 2160) failure('Invalid full-cycle constant transform proof');
    const indices = frames.map(f => f.f).sort((a, b) => a - b);
    if (indices.some((f, i) => f !== i - 1)) failure('Derived proof must contain one still and all unique cycle frames');
    for (const frame of frames) {
      const tag = frame.f === -1 ? 'still' : String(frame.f).padStart(4, '0'), t = frame.f === -1 ? expectedStill : frame.f / 30;
      if (!Number.isFinite(frame.timeSeconds) || Math.abs(frame.timeSeconds - t) > 1e-8 || stable(frame.raw?.size) !== '[2160,2160]') failure('Derived frame indices/time/dimensions differ');
      for (const kind of ['g', 'm']) {
        const name = `jobs/${job.id}/frames/${kind}-${tag}.png`;
        if (frame.raw[kind + 'Path'] !== name || !/^[a-f0-9]{64}$/i.test(frame.raw[kind + 'Sha256'] || '') || await fileSha(safeFile(name)) !== frame.raw[kind + 'Sha256']) failure('Derived raw frame SHA differs: ' + name);
      }
    }
    const a = await command(value('--python', 'python'), ['-c', alphaCheckPython, proofFile, root]);
    if (a.code !== 0) failure('Independent full-cycle alpha check failed: ' + (a.unavailable || a.stderr));
    const alpha = JSON.parse(a.stdout); if (!alpha.pass || alpha.checkedIncludingStill !== job.frames + 1) failure('Independent full-cycle fit/edge proof failed: ' + JSON.stringify(alpha));
    const media = {};
    for (const kind of ['master', 'mobile']) media[kind] = await auditVideo(kind, override.media?.[kind], job.frames, job.duration, issues, deliveryRoot);
    if (!independentDecode || Object.values(media).some(v => !v?.headerPass || !v.sha256MatchesProducer || !v.decode?.independent || !v.decode?.pass)) failure('Derived videos require independent header/SHA/full CPU decode');
    if (Object.entries(media).some(([kind, v]) => v.sha256 === row.originalProducerAudit.media?.[kind]?.sha256)) failure('Framing repair must select new video bytes rather than the original cropped movie');
    const posterFile = safeFile(override.poster?.path, deliveryRoot), poster = { ...await snapshotFile(posterFile, deliveryRoot), dimensions: dimensions(posterFile), timeSeconds: override.poster?.timeSeconds };
    if (poster.sha256 !== override.poster?.sha256 || poster.bytes !== override.poster?.bytes || poster.dimensions.join('x') !== '540x540' || !Number.isFinite(poster.timeSeconds) || Math.abs(poster.timeSeconds - row.poster?.timeSeconds) > 1e-9) failure('Derived poster identity/dimensions/original time differ');
    if (issues.length) failure('Derived media validation has issues: ' + JSON.stringify(issues));
    row.media = media; row.poster = poster;
    row.framingDelivery = { pass: true, classification: 'composite_framing_repair_only', manifestSha256: deliveryManifestIdentity.sha256, sourceFingerprint: job.fingerprint, sourceEvidence, framingProof: proofIdentity, alphaAudit: alpha,
      originalCompositeEdgeFrames: override.originalComposite.edgeTouchFrames, derivedCompositeEdgeFrames: alpha.edgeTouchFrames, bodyQaInherited: true, appearanceAndMotionUnchanged: true, originalAuditStatus: row.originalProducerAudit.status, statusPolicy: 'Original body QA and review state retained; framing repair cannot upgrade ready status.' };
  } catch (e) {
    row.framingDelivery = { pass: false, manifestSha256: deliveryManifestIdentity.sha256, error: e.message };
    row.issues.push({ severity: 'failed', code: 'delivery_validation_failed', message: e.message }); row.status = 'failed';
  }
  return row;
}

async function manifestTree() {
  const files = [];
  async function visit(folder) {
    for (const d of fs.readdirSync(folder, { withFileTypes: true })) {
      const p = path.join(folder, d.name);
      if (inside(out, p)) continue;
      if (d.isSymbolicLink()) { files.push({ path: relative(p), kind: 'symlink', target: fs.readlinkSync(p), followed: false }); continue; }
      if (d.isDirectory()) await visit(p);
      else if (d.isFile()) {
        const s = fs.statSync(p); const hash = inventoryHashes.get(relative(p)) || (evidenceFiles.has(p) ? await fileSha(p) : null);
        files.push({ path: relative(p), bytes: s.size, sha256: hash, modifiedAt: s.mtime.toISOString() });
      }
    }
  }
  await visit(root); files.sort((a, b) => a.path.localeCompare(b.path));
  return files;
}
async function galleryFiles(rows) {
  for (const row of rows) {
    row.links = {};
    for (const [name, file] of [['master', row.media?.master], ['mobile', row.media?.mobile], ['poster', row.poster]]) {
      if (!file?.path) continue;
      const p = safeFile(file.path, file.storageRoot === 'delivery' ? deliveryRoot : root);
      let target = p;
      if (bundle) {
        target = path.join(out, 'media', name === 'poster' ? 'posters' : name, row.id + (name === 'poster' ? '.jpg' : '.mp4'));
        fs.mkdirSync(path.dirname(target), { recursive: true });
        if (exists(target) && await fileSha(target) !== file.sha256) throw Error(`Existing bundle copy differs; choose a fresh --out: ${target}`);
        if (!exists(target)) fs.copyFileSync(p, target);
      }
      row.links[name] = slash(path.relative(out, target)).split('/').map(encodeURIComponent).join('/');
    }
    row.links.result = `manifest.json#${encodeURIComponent(row.id)}`;
    if (!bundle) row.links.evidence = row.evidence.map(p => slash(path.relative(out, safeFile(p))).split('/').map(encodeURIComponent).join('/'));
  }
}
function gallery(report) {
  const data = JSON.stringify({ summary: report.summary, jobs: report.jobs }).replaceAll('<', '\\u003c');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flare训练演示 · 新人体</title><style>
  :root{color-scheme:dark;font-family:system-ui,"Microsoft Yahei",sans-serif;background:#111318;color:#ecf0f2}*{box-sizing:border-box}body{margin:0;padding:18px;max-width:1260px;margin:auto}h1{font-size:24px;margin:8px 0}p{line-height:1.6;color:#b4bec5;font-size:14px}.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0;position:sticky;top:0;background:#111318ed;padding:8px 0;z-index:1}input,select,button,a{font:inherit}input,select{border:1px solid #3b454f;border-radius:9px;background:#20262e;color:#fff;padding:10px}input{flex:1;min-width:130px}.group h2{font-size:19px;border-bottom:1px solid #323c45;padding-bottom:10px}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}.card{border:1px solid #303b45;background:#1a2028;border-radius:12px;overflow:hidden}.preview{display:block;width:100%;aspect-ratio:1;padding:0;border:0;background:#101013;cursor:pointer}.preview:disabled{cursor:default}.preview img{width:100%;height:100%;object-fit:contain;display:block}.empty{display:grid;place-items:center;height:100%;font-size:14px;color:#9eabb5}.info{padding:12px}.info h3{font-size:15px;margin:0 0 6px;overflow-wrap:anywhere}.id{font-size:11px;color:#91a2ae;overflow-wrap:anywhere}.status{font-size:12px;display:inline-block;margin:8px 0;border-radius:5px;padding:3px 6px}.ready{background:#143d35;color:#93e3c7}.review_required{background:#473619;color:#f5d38e}.failed{background:#492730;color:#f0a7b6}.pending{background:#2a3541;color:#b0c6da}.note{font-size:12px;line-height:1.5;margin:5px 0;color:#b5c0c9;overflow-wrap:anywhere}a{color:#8fdbc9}details{margin-top:7px;font-size:12px}details ul{padding-left:18px;line-height:1.5}dialog{background:#171d25;color:#eaf0f2;border:1px solid #485661;border-radius:12px;width:min(750px,96vw);max-height:95vh;padding:14px}dialog::backdrop{background:#000b}dialog video{width:100%;max-height:72vh;aspect-ratio:1;object-fit:contain;background:#101013}.dialoghead{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:10px}button.close{background:#273440;color:#fff;border:1px solid #4a5e6b;border-radius:8px;padding:8px 12px}.downloads{display:flex;gap:20px;padding:12px 0}.hidden{display:none!important}@media(max-width:900px){.cards{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:640px){body{padding:12px}.cards{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.info{padding:9px}h1{font-size:21px}.toolbar{gap:7px}.toolbar select{max-width:100%;font-size:13px}}
  </style></head><body><h1>Flare训练演示 · 新人体</h1><p id="summary"></p><p>点击画面播放720手机版；母版1080、封面540。状态反映制作证据；“待复核”保留数值问题或求解警告，未标为全部QA通过。</p><div class="toolbar"><input id="search" placeholder="搜索动作或编号" aria-label="搜索动作"><select id="category" aria-label="类别"><option value="">全部类别</option></select><select id="state" aria-label="验证状态"><option value="">全部状态</option><option value="ready">已完成</option><option value="review_required">待复核</option><option value="failed">失败</option><option value="pending">制作中</option></select></div><main id="groups"></main><p><a href="manifest.json">完整审计清单JSON</a> · <a href="directory-manifest.json">文件目录清单JSON</a></p><dialog id="viewer"><div class="dialoghead"><strong id="video-title"></strong><button class="close" id="close" type="button">关闭</button></div><video id="video" controls loop muted playsinline preload="auto"></video><div class="downloads" id="downloads"></div><p id="video-note"></p></dialog><script id="audit-data" type="application/json">${data}</script><script>
  const data=JSON.parse(document.getElementById('audit-data').textContent),$=id=>document.getElementById(id);
  const names={'frozen-v1.0.0':'正式训练与拉伸','office':'办公室拉伸','sitting-strength':'久坐强化','thomas-specialized':'托马斯专项','historical-runtime':'早期教学演示','baked-flare-v41':'Flare正式全旋','historical-demo':'历史教学演示','historical-teaching':'历史教学演示','historical':'历史教学演示'};
  const states={ready:'已完成',review_required:'待复核',failed:'失败',pending:'制作中'};
  function issueText(i,j){const labels={numeric_qa_failed:'数值检查未全部通过，保留完整成片供复核。',solver_warnings:'仍有'+(j.qa?.solver_warning_frames||0)+'帧求解警告。',producer_requires_review:'制作流程将该项保留为待复核。',motion_invariance_failed:'新旧人体的动作位置对照未通过。',paired_cycle_joints_failed:'整圈新旧人体关节位置比对未通过。',full_cycle_record_invalid:'整圈动作证明记录不完整或超出容差。',new_body_qa_flags:'发现新增人体问题：'+(j.bodyQaAttribution?.newBodyFlags||[]).join('、'),inherited_body_qa_flags:'保留原动作已有问题：'+(j.bodyQaAttribution?.inheritedBodyFlags||[]).join('、'),baseline_comparison_mismatch:'新旧检查结果的归因记录不一致。',motion_contract_changed:'冻结动作参数发生了变化。',qa_condition_not_covered:'部分检查条件没有对应采样。',media_identity_mismatch:'成片文件与制作记录不一致。',model_source_drift:'人体源文件已改变，须核对制作版本。',producer_failed:'该项制作失败。',independent_decode_failed:'视频完整解码未通过。',frame_files_missing:'该项原始帧或合成帧不完整。'};return labels[i.code]||i.message}
  $('summary').textContent='共'+data.summary.planned+'项 · 已完成'+(data.summary.states.ready||0)+' · 待复核'+(data.summary.states.review_required||0)+' · 失败'+(data.summary.states.failed||0)+' · 制作中'+(data.summary.states.pending||0)+'。模型 '+data.summary.modelId+' / '+data.summary.modelVersion;
  const cats=[...new Set(data.jobs.map(j=>j.category))];for(const c of cats){const o=document.createElement('option');o.value=c;o.textContent=names[c]||c;$('category').append(o)}
  function anchor(label,href){const a=document.createElement('a');a.textContent=label;a.href=href;return a}
  function open(j){const v=$('video');v.pause();$('video-title').textContent=j.name;v.poster=j.links.poster||'';v.src=j.links.mobile;v.onloadedmetadata=()=>{v.currentTime=j.poster?.timeSeconds||0};v.oncanplay=()=>{v.oncanplay=null;v.play().catch(()=>{})};$('downloads').replaceChildren();for(const k of ['master','mobile','poster'])if(j.links[k])$('downloads').append(anchor({master:'1080母版',mobile:'720手机版',poster:'540封面'}[k],j.links[k]));const scope=j.motionInvarianceScope==='full_cycle'?'整圈关节位置已独立核对；骨矩阵保持来自制作流程整圈记录。':j.motionInvarianceScope==='full_cycle_failed'?'整圈动作证明未通过独立核对。':'动作保持仅覆盖已记录的代表相位。';$('video-note').textContent=(j.issues.map(i=>issueText(i,j)).join('；')||'媒体与制作证据通过。')+' '+scope+(j.framingDelivery?.pass?' 构图已另存修复版：原合成触边'+j.framingDelivery.originalCompositeEdgeFrames+'帧 → 派生0帧，原人体QA与待复核状态保持。':'');$('viewer').showModal();v.load()}
  function close(){const v=$('video');v.pause();v.removeAttribute('src');v.load();$('viewer').close()}
  $('close').onclick=close;$('viewer').addEventListener('cancel',e=>{e.preventDefault();close()});
  function render(){const q=$('search').value.trim().toLowerCase(),cat=$('category').value,state=$('state').value;$('groups').replaceChildren();for(const c of cats){const jobs=data.jobs.filter(j=>j.category===c&&(!cat||cat===c)&&(!state||state===j.status)&&(!q||(j.name+' '+j.id).toLowerCase().includes(q)));if(!jobs.length)continue;const section=document.createElement('section');section.className='group';const h=document.createElement('h2');h.textContent=(names[c]||c)+' · '+jobs.length;section.append(h);const cards=document.createElement('div');cards.className='cards';section.append(cards);for(const j of jobs){const card=document.createElement('article');card.className='card';const b=document.createElement('button');b.className='preview';b.type='button';b.disabled=!j.links?.mobile;b.setAttribute('aria-label',j.name+'：播放演示');if(j.links?.poster){const img=document.createElement('img');img.src=j.links.poster;img.alt=j.name;img.loading='lazy';b.append(img)}else{const span=document.createElement('span');span.className='empty';span.textContent=states[j.status]||j.status;b.append(span)}b.onclick=()=>open(j);card.append(b);const info=document.createElement('div');info.className='info';const title=document.createElement('h3');title.textContent=j.name;info.append(title);const id=document.createElement('div');id.className='id';id.textContent=j.id;info.append(id);const badge=document.createElement('span');badge.className='status '+j.status;badge.textContent=states[j.status]||j.status;info.append(badge);const note=document.createElement('div');note.className='note';note.textContent=(j.plannedDuration||0)+'秒 · '+(j.plannedFrames||0)+'帧';info.append(note);if(j.issues.length){const d=document.createElement('details');const s=document.createElement('summary');s.textContent='查看验证问题（'+j.issues.length+'）';d.append(s);const ul=document.createElement('ul');for(const issue of j.issues){const li=document.createElement('li');li.textContent=issueText(issue,j);ul.append(li)}d.append(ul);info.append(d)}card.append(info);cards.append(card)}$('groups').append(section)}}
  for(const id of ['search','category','state'])$(id).addEventListener('input',render);render();
  </script></body></html>`;
}

try {
  const rows = [];
  for (const job of plan.jobs) {
    let row;
    try { row = await applyDelivery(await auditJob(job), job); }
    catch (e) { row = { id: job.id, name: job.id, category: job.category || 'unclassified', plannedFrames: job.frames, plannedDuration: job.duration, status: 'failed', evidence: [], issues: [{ severity: 'failed', code: 'job_audit_exception', message: e.message }] }; }
    if (row.status !== 'pending' && modelSourceChecks.some(s => s.pass === false)) { row.issues.push({ severity: 'failed', code: 'model_source_drift', message: modelSourceChecks.filter(s => s.pass === false).map(s => s.path).join(', ') }); row.status = 'failed'; }
    rows.push(row); console.log(`${row.id}: ${row.status}${row.issues.length ? ` (${row.issues.length} issues)` : ''}`);
  }
  await galleryFiles(rows);
  const states = Object.fromEntries(['ready', 'review_required', 'failed', 'pending'].map(s => [s, rows.filter(r => r.status === s).length]));
  const report = {
    schemaVersion: 2, generatedAt: new Date().toISOString(), libraryRoot: bundle ? '.' : root,
    delivery: delivery ? { schemaVersion: 1, kind: delivery.kind, manifest: deliveryManifestIdentity, sourceLibraryLocation: delivery.sourceLibraryRoot, sourceModel: delivery.sourceModel, selectedIds: rows.filter(r => r.framingDelivery?.pass).map(r => r.id), statusPolicy: 'Original producer QA, warnings and audit state retained. Only selected media framing differs.' } : null,
    summary: { planned: plan.jobs.length, auditedResults: rows.filter(r => r.media).length, states, modelId: plan.model?.id, modelVersion: plan.model?.version, independentDecode, bundled: bundle, allCompleted: states.pending === 0, allReady: states.ready === plan.jobs.length,
      motionScopes: { fullCycle: rows.filter(r => r.motionInvarianceScope === 'full_cycle').length, keyPhase: rows.filter(r => r.motionInvarianceScope === 'key_phase').length, failedFullCycle: rows.filter(r => r.motionInvarianceScope === 'full_cycle_failed').length }, bodyQaAttribution: { newBodyIssue: rows.filter(r => r.bodyQaAttribution?.category === 'new_body_issue').length, inheritedBodyIssue: rows.filter(r => r.bodyQaAttribution?.category === 'inherited_body_issue').length, noBodyFlags: rows.filter(r => r.bodyQaAttribution?.category === 'no_body_flags').length, baselineUnavailable: rows.filter(r => r.bodyQaAttribution?.category === 'baseline_unavailable').length } },
    verificationScope: { source: 'Frozen input fingerprint, imported action JSON, snapshots and current source SHA where available.', motion: 'Per-job full_cycle: audit independently compares every recorded old/new J coordinate including still; full-cycle bone-matrix maxima are producer records. Earlier jobs lacking fullCycle retain key_phase scope. Action JSON remains frozen; no downloaded old-film pixel-equality claim.', video: independentDecode ? 'Independent actual-file SHA, headers and full CPU decode of master/mobile.' : 'Independent actual-file SHA and headers; decoded frame counts are reported producer evidence, not a separate independent full-decode check.', geometry: 'New/old original-profile full-cycle QA retained where available; body flags independently attributed to added versus inherited failures. False pass, solver warnings and new-render-only edge checks are explicit. No renderer is run.', gallery: 'Self-contained inline HTML/CSS/JS with relative media paths and no CDN. --bundle copies final media for a standalone gallery folder.' },
    modelSourceChecks, exclusions: plan.exclusions || [], jobs: rows
  };
  const files = argv.includes('--no-tree') ? [] : await manifestTree();
  json(path.join(out, 'directory-manifest.json'), { schemaVersion: 1, generatedAt: report.generatedAt, completeTree: !argv.includes('--no-tree'), auditDirectoryExcluded: true, hashScope: 'Final media/posters and referenced input/result/QA/metric documents. Raw/composite PNGs are inventoried with byte counts; their complete hashes are not recomputed.', files });
  json(path.join(out, 'manifest.json'), report);
  atomic(path.join(out, 'index.html'), gallery(report));
  const sourceCheck = rows.flatMap(r => r.currentSource || []);
  const text = `# 新人体演示批量审计\n\n模型：${plan.model?.id}@${plan.model?.version}。计划${plan.jobs.length}项；ready ${states.ready}、review_required ${states.review_required}、failed ${states.failed}、pending ${states.pending}。\n\n视频验证：${report.verificationScope.video}\n动作验证：${report.verificationScope.motion}\n\n整圈关节自查${report.summary.motionScopes.fullCycle}项；早期关键相位${report.summary.motionScopes.keyPhase}项。新增人体问题${report.summary.bodyQaAttribution.newBodyIssue}项、仅继承原动作问题${report.summary.bodyQaAttribution.inheritedBodyIssue}项。\n\n当前源可访问${sourceCheck.filter(s => s.available).length}处，不可访问${sourceCheck.filter(s => !s.available).length}处；不可访问不冒称已核对，冻结输入仍独立核验。\n\n画廊：index.html；完整清单：manifest.json；实际文件目录：directory-manifest.json。${bundle ? 'media副本可随本目录一起迁移。' : '迁移时保留本audit目录与整套library相对位置。'}\n\nready表示本工具核验范围内通过。逐帧关节坐标可由成对metric独立复核；未保存的骨矩阵只能引用制作流程整圈记录。缺fullCycle的早期job仍是关键相位范围，不能表述为原下载视频逐像素相同或所有旧动作都曾取得全QA。\n`;
  atomic(path.join(out, 'README.md'), text);
  console.log(JSON.stringify({ auditDirectory: out, ...report.summary }));
  process.exitCode = states.failed ? 2 : states.review_required || states.pending ? 1 : 0;
} finally { fs.unlinkSync(lock); }
