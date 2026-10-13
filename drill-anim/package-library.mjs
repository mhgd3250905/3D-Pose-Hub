// Portable playback + provenance archive. Does not render, decode, compress or deploy.
// node package-library.mjs --library <completed-root> --audit <independent-audit> --out <new-directory>
// Defaults to the canonical 94-item catalogue. --fixture permits a small test catalogue and labels the package as a fixture.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
function option(key, fallback) {
  const i = args.indexOf(key); if (i < 0) return fallback;
  assert(args[i + 1] && !args[i + 1].startsWith('--'), `Missing value: ${key}`); return args[i + 1];
}
if (args.includes('--help')) {
  console.log('Usage: node package-library.mjs --library <root> --audit <audit-dir> --out <new-dir> [--delivery <reframed-dir>] [--catalog <canonical-json>] [--source-root <repo>] [--fixture]'); process.exit(0);
}
const repo = path.resolve(option('--source-root', path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')));
const libraryArg = option('--library'), outArg = option('--out');
assert(libraryArg && outArg, '--library and --out are required');
const library = path.resolve(libraryArg), auditDir = path.resolve(option('--audit', path.join(library, 'audit'))), out = path.resolve(outArg);
const catalogueFile = path.resolve(option('--catalog', path.join(repo, 'tools/drill-anim/batches/training-human-v2-20261013/job-catalog.json')));
const canonicalDir = path.dirname(catalogueFile), fixture = args.includes('--fixture');
const deliveryRoot = option('--delivery') ? path.resolve(option('--delivery')) : null;
const slash = p => p.split(path.sep).join('/');
const inside = (base, p) => { const r = path.relative(base, p); return r !== '..' && !r.startsWith('..' + path.sep) && !path.isAbsolute(r); };
assert(!inside(library, out) && !inside(auditDir, out), 'Choose a new package directory outside production and audit directories');
assert(!deliveryRoot || !inside(deliveryRoot, out), 'Package output must be outside derived media inputs');
assert(!fs.existsSync(out), 'Package output already exists; choose a new directory. Existing output is never overwritten');
const digest = b => crypto.createHash('sha256').update(b).digest('hex');
const shaFile = file => new Promise((resolve, reject) => {
  const h = crypto.createHash('sha256'), s = fs.createReadStream(file);
  s.on('data', d => h.update(d)); s.on('error', reject); s.on('end', () => resolve(h.digest('hex')));
});
function read(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { throw Error(`Invalid or missing JSON: ${file}`); } }
const stable = value => JSON.stringify(value, (_key, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
function within(base, relative) {
  assert(typeof relative === 'string' && !path.isAbsolute(relative), 'Expected a relative package/library path');
  const p = path.resolve(base, relative); assert(inside(base, p), `Path escapes allowed root: ${relative}`);
  if (fs.existsSync(p)) assert(inside(fs.realpathSync(base), fs.realpathSync(p)), `Symlink escapes allowed root: ${relative}`);
  return p;
}
const forbiddenFile = /(?:^|[\\/])(?:\.git|\.codex|\.agents|node_modules|xwechat_files|wxid_[^\\/]*|personal|drafts|user-data)(?:[\\/]|$)|Air[-_ ]?Flare|user-saved|saved-right-mirrors|(?:^|[\\/])\.env(?:[.\\/]|$)/i;
function privacyCheck(file, bytes) {
  assert(!forbiddenFile.test(file), `Excluded private/reference location: ${path.basename(file)}`);
  const ext = path.extname(file).toLowerCase();
  assert(['.json', '.js', '.mjs', '.md', '.txt', '.html', '.mp4', '.jpg'].includes(ext), `Unsupported archive file type: ${ext}`);
  if (['.mp4', '.jpg'].includes(ext)) return;
  const text = bytes.toString('utf8');
  assert(!/(?:Bearer\s+[A-Za-z0-9._~+/-]{12,}|\bgh[pousr]_[A-Za-z0-9]{20,}|\bsk-[A-Za-z0-9_-]{20,})/.test(text), `Credential-shaped content refused: ${path.basename(file)}`);
  if (ext === '.json') {
    const secretKey = /^(?:continueCode|access_?token|refresh_?token|id_?token|token|api_?key|password|secret|authorization|cookie|cookies|credentials|sessionToken)$/i;
    const walk = v => {
      if (!v || typeof v !== 'object') return;
      for (const [key, value] of Object.entries(v)) {
        assert(!(secretKey.test(key) && value !== null && value !== '' && value !== false), `Credential field refused in ${path.basename(file)}: ${key}`);
        walk(value);
      }
    };
    walk(read(file));
  }
}

const planFile = path.join(library, 'plan.json'), auditFile = path.join(auditDir, 'manifest.json'), inventoryFile = path.join(auditDir, 'directory-manifest.json');
const plan = read(planFile), audit = read(auditFile), inventory = read(inventoryFile), catalogue = read(catalogueFile);
assert.equal(audit.schemaVersion, 2, 'Expected the completed schema2 independent audit');
assert.equal(Boolean(deliveryRoot), Boolean(audit.delivery), 'Use the same --delivery selection as the completed independent audit');
const deliveryManifestFile = deliveryRoot ? within(deliveryRoot, 'delivery-manifest.json') : null;
const delivery = deliveryManifestFile ? read(deliveryManifestFile) : null;
const deliverySha256 = deliveryManifestFile ? await shaFile(deliveryManifestFile) : null;
if (delivery) {
  assert.equal(deliverySha256, audit.delivery.manifest?.sha256, 'Derived manifest differs from independent audit');
  assert.equal(delivery.schemaVersion, 1); assert.equal(delivery.kind, 'constant_full_cycle_reframe');
  assert.equal(stable(delivery.sourceModel), stable({ id: plan.model.id, version: plan.model.version }));
  assert.deepEqual(Object.keys(delivery.overrides).sort(), [...audit.delivery.selectedIds].sort(), 'Not all requested derived files passed independent audit');
}
assert(Array.isArray(plan.jobs) && Array.isArray(audit.jobs) && Array.isArray(catalogue.jobs), 'Missing job collections');
const count = catalogue.jobs.length;
assert(fixture ? count > 0 : count === 94, 'Formal packaging requires the canonical 94-item catalogue; use --fixture only for a labelled development fixture');
const ids = rows => rows.map(r => r.id).sort();
assert(new Set(ids(catalogue.jobs)).size === count, 'Duplicate canonical IDs');
assert.deepEqual(ids(plan.jobs), ids(catalogue.jobs), 'Plan differs from canonical catalogue');
assert.deepEqual(ids(audit.jobs), ids(catalogue.jobs), 'Audit differs from canonical catalogue');
assert.equal(audit.summary?.planned, count); assert.equal(audit.summary?.auditedResults, count);
assert.equal(audit.summary?.allCompleted, true, 'All jobs must finish before packaging');
assert.equal(audit.summary?.independentDecode, true, 'Independent audit must include full CPU decode');
assert(audit.jobs.every(j => ['ready', 'review_required'].includes(j.status)), 'Pending/failed audit jobs cannot be packaged as a completed library');
assert.equal(audit.summary.states?.pending || 0, 0); assert.equal(audit.summary.states?.failed || 0, 0);
assert.equal(audit.summary.modelId, plan.model?.id); assert.equal(audit.summary.modelVersion, plan.model?.version);
assert(inventory.completeTree === true, 'Use the complete independent directory audit, not --no-tree');
const inputHashes = new Map(inventory.files.filter(f => f.sha256).map(f => [f.path, f.sha256]));
const canonicalHashesFile = path.join(canonicalDir, 'source-sha256.json'), canonicalHashes = read(canonicalHashesFile);
assert.equal(canonicalHashes.catalog?.jobs, count, 'Canonical hash registry count differs');
const catalogueBytes = fs.readFileSync(catalogueFile);
assert.equal(digest(catalogueBytes.toString('utf8').replace(/\r\n/g, '\n')), canonicalHashes.catalog.sha256CanonicalLf, 'Canonical catalogue changed');
const sourceRegistry = new Map((canonicalHashes.sources || []).map(s => [s.path, s]));
const exactCopies = [], generated = [], jobs = [];

async function queue(file, target, expected, kind, auditBound = false) {
  assert(fs.existsSync(file) && fs.statSync(file).isFile(), `Missing required ${kind}: ${file}`);
  within(out, target); const observed = await shaFile(file);
  if (expected) assert.equal(observed, expected, `SHA conflict: ${target}`);
  if (auditBound) assert.equal(observed, inputHashes.get(slash(path.relative(library, file))), `Missing/stale independent audit binding: ${target}`);
  privacyCheck(file, ['.mp4', '.jpg'].includes(path.extname(file).toLowerCase()) ? Buffer.alloc(0) : fs.readFileSync(file));
  const prior = exactCopies.find(c => c.target === target);
  if (prior) { assert.equal(prior.sha256, observed, `Conflicting package destinations: ${target}`); return; }
  exactCopies.push({ file, target, sha256: observed, bytes: fs.statSync(file).size, kind });
}
function sourceLocation(originalPath) {
  const record = sourceRegistry.get(originalPath);
  const p = record?.repositoryRelativePath ? within(repo, record.repositoryRelativePath) : originalPath;
  assert(typeof p === 'string' && fs.existsSync(p), `Authored source is unavailable: ${originalPath}`);
  return p;
}
async function mediaLocation(row, kind, description) {
  const candidate = row.links?.[kind] ? path.resolve(auditDir, decodeURIComponent(row.links[kind])) : null;
  if (candidate && inside(auditDir, candidate) && fs.existsSync(candidate)) {
    assert.equal(await shaFile(candidate), description.sha256, `SHA conflict in audit bundle: ${row.id}/${kind}`);
    return candidate;
  }
  return within(description.storageRoot === 'delivery' ? deliveryRoot : library, description.path);
}

for (const job of plan.jobs) {
  assert(/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(job.id), 'Unsafe job ID');
  const folder = within(library, 'jobs/' + job.id), entry = catalogue.jobs.find(e => e.id === job.id), row = audit.jobs.find(e => e.id === job.id);
  const input = read(path.join(folder, 'input.json')), result = read(path.join(folder, 'result.json')), source = read(path.join(folder, 'source.json')), status = read(path.join(folder, 'status.json'));
  assert(['ready', 'review_required'].includes(status.phase) && status.phase === result.status, `Producer is not committed: ${job.id}`);
  assert.equal(result.source?.fingerprint, job.fingerprint); assert.equal(input.fingerprint, job.fingerprint);
  const { fingerprint, ...frozen } = input; assert.equal(digest(JSON.stringify(frozen)), fingerprint, `Input changed: ${job.id}`);
  assert.equal(stable(input.entry), stable(entry), `Canonical source entry differs: ${job.id}`);
  assert.equal(row.inputFingerprintPass, true); assert.equal(row.motionContractPass, true);
  assert.equal(row.motionInvarianceScope, 'full_cycle', `Full-cycle independent joint proof missing: ${job.id}`);
  assert.equal(row.fullCycleJointAudit?.pass, true); assert.equal(row.fullCycleJointAudit.checkedIncludingStill, job.frames + 1);
  assert.equal(row.fullCycleBoneEvidence?.metadataValid, true);
  assert.equal(result.frames, job.frames); assert.equal(result.duration, job.duration); assert.equal(result.fps, 30);
  assert.equal(result.modelProfile, plan.model.id); assert.equal(result.modelVersion, plan.model.version);
  const override = delivery?.overrides?.[job.id];
  if (override) {
    assert.equal(row.framingDelivery?.pass, true); assert.equal(row.framingDelivery.manifestSha256, deliverySha256);
    assert.equal(row.framingDelivery.sourceFingerprint, job.fingerprint); assert.equal(override.sourceFingerprint, job.fingerprint);
    assert.equal(row.framingDelivery.alphaAudit?.pass, true); assert.equal(row.framingDelivery.alphaAudit.checkedIncludingStill, job.frames + 1);
    assert.equal(row.framingDelivery.alphaAudit.fitAllFrames, true); assert.equal(row.framingDelivery.alphaAudit.edgeTouchFrames, 0);
    assert.equal(row.framingDelivery.bodyQaInherited, true); assert.equal(row.framingDelivery.appearanceAndMotionUnchanged, true);
    assert(row.originalProducerAudit && (row.originalProducerAudit.status !== 'review_required' || row.status === 'review_required'), 'Derived selection must preserve original review status');
    for (const [name, expected] of Object.entries(override.sourceEvidenceSha256)) assert.equal(await shaFile(within(folder, name)), expected, 'Derived source binding changed: ' + name);
  }
  const packageLinks = { evidence: {}, media: {} };
  for (const name of ['input.json', 'source.json', 'status.json', 'result.json', 'spec-original.json', 'spec.json', 'theme.json', 'motion-invariance.json', 'renderer.json', 'qa.json', 'baseline-qa.json', 'frames/met-cycle.json', 'reference/met-cycle.json', 'composite/place.json']) {
    const file = path.join(folder, name), target = `evidence/jobs/${job.id}/${name}`;
    await queue(file, target, null, name === 'composite/place.json' ? 'producer framing metadata' : 'job evidence', name !== 'composite/place.json'); packageLinks.evidence[name] = target;
  }
  if (fs.existsSync(path.join(folder, 'reference/metrics.json'))) await queue(path.join(folder, 'reference/metrics.json'), `evidence/jobs/${job.id}/reference/metrics.json`, null, 'static reference metrics');
  if (override) {
    const proofTarget = `evidence/delivery/${job.id}/framing-proof.json`;
    assert.equal(override.framingProof.sha256, row.framingDelivery.framingProof.sha256);
    await queue(within(deliveryRoot, override.framingProof.path), proofTarget, override.framingProof.sha256, 'independently checked full-cycle derived framing proof');
    packageLinks.evidence['derived/framing-proof.json'] = proofTarget;
    const originalTarget = `evidence/delivery/${job.id}/original-producer-audit.json`;
    generated.push([originalTarget, JSON.stringify(row.originalProducerAudit, null, 2) + '\n']);
    packageLinks.evidence['derived/original-producer-audit.json'] = originalTarget;
  }
  const authored = sourceLocation(entry.sourceSpecPath), authoredTarget = `sources/authored/${job.id}/spec${path.extname(authored)}`;
  assert(/^[a-f0-9]{64}$/i.test(source.sourceSpecSha256 || ''), `Authored specification hash missing: ${job.id}`);
  await queue(authored, authoredTarget, source.sourceSpecSha256, 'authored specification'); packageLinks.authoredSpec = authoredTarget;
  if (entry.sourceThemePath) {
    const themeFile = sourceLocation(entry.sourceThemePath), themeTarget = `sources/authored/${job.id}/theme.json`;
    assert(/^[a-f0-9]{64}$/i.test(source.sourceThemeSha256 || ''), `Authored theme hash missing: ${job.id}`);
    await queue(themeFile, themeTarget, source.sourceThemeSha256, 'authored theme'); packageLinks.authoredTheme = themeTarget;
  }
  for (const kind of ['master', 'mobile']) {
    const description = row.media?.[kind], decode = description?.decode;
    assert(description?.headerPass && description.sha256MatchesProducer && decode?.independent === true && decode.pass === true && decode.decodedFrames === job.frames && decode.mediaSha256 === description.sha256, `Independent video proof missing: ${job.id}/${kind}`);
    assert.equal(description.sha256, override ? override.media[kind]?.sha256 : result.media?.[kind]?.sha256);
    if (override) assert.equal(row.originalProducerAudit.media?.[kind]?.sha256, result.media?.[kind]?.sha256);
    const file = await mediaLocation(row, kind, description), target = `media/${kind}/${job.id}.mp4`;
    await queue(file, target, description.sha256, 'new rendered video'); packageLinks.media[kind] = target;
  }
  const poster = row.poster; assert(poster?.sha256 && poster.dimensions?.join('x') === '540x540', `Poster proof missing: ${job.id}`);
  if (override) assert.equal(poster.sha256, override.poster.sha256);
  else if (result.posterSha256) assert.equal(poster.sha256, result.posterSha256);
  const posterFile = await mediaLocation(row, 'poster', poster), posterTarget = `media/posters/${job.id}.jpg`;
  await queue(posterFile, posterTarget, poster.sha256, 'new rendered poster'); packageLinks.media.poster = posterTarget;
  const packagedFraming = row.framingDelivery ? structuredClone(row.framingDelivery) : null;
  if (packagedFraming?.pass) {
    packagedFraming.framingProof.path = packageLinks.evidence['derived/framing-proof.json'];
    packagedFraming.framingProof.storageRoot = 'package';
  }
  jobs.push({ id: job.id, name: row.name, category: row.category, auditStatus: row.status, producerStatus: result.status, frames: job.frames, durationSeconds: job.duration, posterTimeSeconds: row.poster.timeSeconds,
    newBodyFlags: row.bodyQaAttribution?.newBodyFlags ?? null, inheritedBodyFlags: row.bodyQaAttribution?.inheritedBodyFlags ?? null, framingDelivery: packagedFraming, knownLimitations: row.knownLimitations || [], packageLinks,
    originalSourceLocations: { purpose: 'Historical host locations only; not package resource links', authoredSpec: entry.sourceSpecPath, authoredTheme: entry.sourceThemePath || null, oldMedia: entry.oldMediaPath || null } });
}
if (delivery) await queue(deliveryManifestFile, 'evidence/delivery/delivery-manifest.original.json', deliverySha256, 'derived media source bindings and output hashes');
for (const name of ['job-catalog.json', 'source-sha256.json', 'historical-source-manifest.json', 'flare-v41-source-manifest.json', 'flare-loading-camera-source.json', 'README.md']) {
  const file = name === 'job-catalog.json' ? catalogueFile : path.join(canonicalDir, name);
  if (fixture && !fs.existsSync(file)) continue;
  await queue(file, 'sources/canonical/' + (name === 'README.md' ? 'README.original.md' : name), null, 'canonical source catalogue');
}
const modelFile = within(repo, 'tools/drill-anim/models/training-human-v2.json');
assert.equal(stable(read(modelFile)), stable(plan.model), 'Current model manifest differs from frozen batch');
await queue(modelFile, 'sources/model/training-human-v2.json', null, 'model manifest');
const documents = [
  ['docs/training-human-v2.md', 'documentation/training-human-v2.md'],
  ['docs/training-media-library-2026-10-13.md', 'documentation/training-media-library.md'],
  ['output/rerender-planning-20261013/material-attribution.md', 'documentation/material-attribution.md'],
  ['public/coach/ATTRIBUTION.md', 'licenses/Snow-coach-ATTRIBUTION.md'],
  ['public/anatomy/ATTRIBUTION.md', 'licenses/head-and-historical-anatomy-ATTRIBUTION.md'],
  ['app/assets/licenses/Drill-media-ATTRIBUTION.md', 'licenses/Drill-media-ATTRIBUTION.md'],
  ['assets/blender-studio-source/SOURCE.md', 'licenses/Blender-source-acquisition.original.md'],
];
const linkTargets = new Map(documents.map(([source, target]) => [path.resolve(repo, source), target]));
linkTargets.set(modelFile, 'sources/model/training-human-v2.json');
for (const name of ['job-catalog.json', 'source-sha256.json', 'historical-source-manifest.json', 'flare-v41-source-manifest.json', 'flare-loading-camera-source.json']) {
  const target = 'sources/canonical/' + name;
  if (exactCopies.some(copy => copy.target === target)) linkTargets.set(path.join(repo, 'tools/drill-anim/batches/training-human-v2-20261013', name), target);
}
// Preserve the exact original documents separately. Companion documentation uses only real package links;
// links to omitted project files become explicit historical source locations rather than broken package links.
for (const [source, target] of documents) {
  const sourceFile = within(repo, source);
  if (!target.startsWith('documentation/')) { await queue(sourceFile, target, null, 'existing attribution or acquisition record'); continue; }
  const originalTarget = 'evidence/documentation/' + path.basename(sourceFile);
  await queue(sourceFile, originalTarget, null, 'exact original model documentation');
  const originalText = fs.readFileSync(sourceFile, 'utf8');
  const relocated = originalText.replace(/\[([^\]\n]+)\]\(([^)\n]+)\)/g, (whole, label, href) => {
    const bare = href.replace(/^<|>$/g, ''); if (/^(?:https?:|mailto:)/i.test(bare) || bare.startsWith('#')) return whole;
    const hashAt = bare.indexOf('#'), fragment = hashAt < 0 ? '' : bare.slice(hashAt), local = hashAt < 0 ? bare : bare.slice(0, hashAt);
    const original = path.resolve(path.dirname(sourceFile), local.replaceAll('/', path.sep)), mapped = linkTargets.get(original);
    if (mapped) return `[${label}](${slash(path.relative(path.dirname(target), mapped))}${fragment})`;
    return `${label}（原来源定位：\`${slash(original)}${fragment}\`；未纳入此包）`;
  });
  generated.push([target, `> 包内阅读副本：已将已保存文件的链接改为相对路径；其余项目链接标为原来源定位。事实与许可范围沿用[原始说明](${slash(path.relative(path.dirname(target), originalTarget))})。正文中的原机器路径不代表包内资源。\n\n` + relocated]);
}
for (const name of ['three-MIT.txt', 'lucide-ISC.txt']) await queue(within(repo, 'licenses/' + name), 'licenses/' + name, null, 'existing dependency license');
await queue(planFile, 'evidence/batch/plan.original.json', inputHashes.get('plan.json'), 'original batch plan');
const runtimeFile = path.join(library, 'runtime.json');
let runtimeLink = null;
if (fs.existsSync(runtimeFile)) {
  const runtime = read(runtimeFile); assert.equal(runtime.recipeSha256, plan.recipe?.sha256?.['batch-rerender.mjs'], 'Runtime record belongs to a different frozen driver');
  runtimeLink = 'evidence/batch/runtime.original.json';
  await queue(runtimeFile, runtimeLink, inputHashes.get('runtime.json'), 'actual production tool versions; dependencies not included');
}
const reviewNotes = [];
for (const name of ['review-notes.json', 'review-notes.md']) {
  const file = path.join(library, name); if (!fs.existsSync(file)) continue;
  const target = 'evidence/batch/' + name;
  await queue(file, target, inputHashes.get(name), 'lead-agent measured QA interpretation; audit status unchanged');
  reviewNotes.push(target);
}
await queue(auditFile, 'evidence/audit/manifest.original.json', null, 'original independent audit');
await queue(inventoryFile, 'evidence/audit/directory-manifest.original.json', null, 'original audited library inventory');
const galleryFile = path.join(auditDir, 'index.html'); assert(fs.existsSync(galleryFile), 'Independent gallery is missing');
const gallery = fs.readFileSync(galleryFile, 'utf8'); privacyCheck(galleryFile, Buffer.from(gallery));
const portableAudit = structuredClone(audit); portableAudit.libraryRoot = '.';
portableAudit.packageScope = 'Playback and traceable evidence archive; original absolute source locations are provenance only. Not a complete cross-machine rerender environment.';
for (const row of portableAudit.jobs) {
  const packaged = jobs.find(j => j.id === row.id);
  row.links = { ...packaged.packageLinks.media, result: `manifest.json#${encodeURIComponent(row.id)}`, evidence: Object.values(packaged.packageLinks.evidence) };
  row.originalSourceLocations = packaged.originalSourceLocations;
  for (const kind of ['master', 'mobile']) { row.media[kind].path = packaged.packageLinks.media[kind]; if (row.media[kind].storageRoot) row.media[kind].storageRoot = 'package'; }
  row.poster.path = packaged.packageLinks.media.poster;
  if (row.poster.storageRoot) row.poster.storageRoot = 'package';
  if (row.framingDelivery?.pass) {
    row.framingDelivery.framingProof.path = packaged.packageLinks.evidence['derived/framing-proof.json'];
    row.framingDelivery.framingProof.storageRoot = 'package';
  }
}
const embedded = JSON.stringify({ summary: portableAudit.summary, jobs: portableAudit.jobs }).replaceAll('<', '\\u003c');
let replaced = 0;
const html = gallery.replace(/(<script\b[^>]*\bid=["']audit-data["'][^>]*>)[\s\S]*?(<\/script>)/i, (_match, open, close) => { replaced++; return open + embedded + close; });
assert.equal(replaced, 1, 'Unknown gallery schema; cannot safely relocate links');
generated.push(['index.html', html], ['manifest.json', JSON.stringify(portableAudit, null, 2) + '\n']);
generated.push(['portable-catalog.json', JSON.stringify({ schemaVersion: 1, fixture, modelId: plan.model.id, modelVersion: plan.model.version, jobs, exclusions: plan.exclusions || [], sourceLocationPolicy: 'originalSourceLocations and raw copied evidence retain original machine paths as provenance; only packageLinks and gallery links identify packaged resources.' }, null, 2) + '\n']);
const summary = { planned: count, ready: audit.jobs.filter(j => j.status === 'ready').length, reviewRequired: audit.jobs.filter(j => j.status === 'review_required').length, failed: 0, pending: 0 };
const info = { schemaVersion: 1, packageType: fixture ? 'development_fixture' : 'portable_training_media_library', createdAt: new Date().toISOString(), summary, model: { id: plan.model.id, version: plan.model.version, manifest: 'sources/model/training-human-v2.json' },
  recipeId: plan.recipe?.id || null, recipeDriverSha256: plan.recipe?.sha256?.['batch-rerender.mjs'] || null, canonicalCatalogue: 'sources/canonical/job-catalog.json', portableCatalogue: 'portable-catalog.json', independentAudit: 'evidence/audit/manifest.original.json', gallery: 'index.html',
  productionRuntimeMetadata: runtimeLink,
  reviewNotes,
  framingDelivery: delivery ? { manifest: 'evidence/delivery/delivery-manifest.original.json', selectedIds: audit.delivery.selectedIds, classification: 'composite_framing_repair_only', statusPolicy: 'Original producer body QA and review status preserved' } : null,
  included: ['New1080 masters,720 mobile videos,540 posters', 'Resolved original/rendered specifications, original specification modules and themes', 'Producer new/original QA, full paired metric sequences and motion records', 'Independent audit, canonical source catalogues, model manifest, human description and existing attributions'],
  excluded: ['Raw/composite/reference PNGs', 'Original actor reference videos/ZIPs and Air-Flare files', 'Personal pose libraries/drafts, tokens, machine configs and logs', '3D source/model assets, node_modules, renderer/browser/runtime toolchains'],
  scope: 'Sufficient for offline playback, selecting existing media and tracing parameters/proof. It does not contain all assets/dependencies needed for direct rerender on another machine. Numeric review_required states are preserved; no blanket full-QA pass or expanded media-license grant is claimed.',
  copiedFiles: exactCopies.map(({ target, sha256, bytes, kind }) => ({ path: target, sha256, bytes, kind })) };
generated.push(['package-manifest.json', JSON.stringify(info, null, 2) + '\n']);
generated.push(['README.md', `# ${fixture ? '开发夹具 · 非正式94项交付' : 'Flare训练素材便携包'}\n\n包含${count}项：ready ${summary.ready}、review_required ${summary.reviewRequired}。待复核问题、来源限制和原/new QA原样保留；此包不宣称全部数值QA通过。\n\n打开[手机画廊](index.html)播放720版；[便携动作目录](portable-catalog.json)提供1080母版、540封面、规格和证据的包内相对链接。[包清单](package-manifest.json)与[文件SHA清单](SHA256SUMS.txt)说明实际保存内容。整个目录可一起搬移，播放不需要联网或原项目路径。\n\n原样保存的source/input/plan/audit/canonical JSON及说明中，绝对路径仅是原机器的溯源定位。它们不一定在新机器存在，也不是包内链接。包内资源请使用portable-catalog的packageLinks；旧媒体地址未被下载或复制。\n\n人体标准见[模型清单](sources/model/training-human-v2.json)、[人体说明](documentation/training-human-v2.md)与[来源核对](documentation/material-attribution.md)。许可见[Snow署名](licenses/Snow-coach-ATTRIBUTION.md)、[头部及历史资产署名](licenses/head-and-historical-anatomy-ATTRIBUTION.md)、[既有动作媒体署名](licenses/Drill-media-ATTRIBUTION.md)。头部署名中其他历史解剖资产没有因此加入视频。依赖代码的MIT/ISC许可不代表全部成片都改成该许可。\n\n${runtimeLink ? `[生产工具版本记录](${runtimeLink})保存实际环境与recipe身份，只是元数据，未附完整运行时依赖；不表示App构建或安装变化。` : '本夹具/批次未提供生产工具版本记录，不补写或推测环境身份。'}\n\n此包足够离线播放和追踪制作规格、逐帧J比对与QA；未包含全部3D资产、原始PNG、依赖或工具链，不承诺异机直接重渲。未复制用户演员参考视频、Air-Flare、个人库/草稿、token/config/log；未压缩、上传或部署。\n`]);

if (reviewNotes.length) {
  const readme = generated.find(([name]) => name === 'README.md');
  readme[1] += '\n主Agent实测复核说明：' + reviewNotes.map(link => `[${path.basename(link)}](${link})`).join('、') + '。这些说明解释新旧QA提示，不更改独立audit状态，也不把review_required升级为ready。\n';
}
if (delivery) {
  const readme = generated.find(([name]) => name === 'README.md');
  readme[1] += '\n' + audit.delivery.selectedIds.map(id => {
    const row = audit.jobs.find(r => r.id === id);
    return `${id}采用另存构图版：原合成触边${row.framingDelivery.originalCompositeEdgeFrames}帧 → 派生0帧`;
  }).join('；') + '。动作、机位轨迹、时序和原人体QA保持；原producer审计及逐帧构图证明另存，见[派生清单](evidence/delivery/delivery-manifest.original.json)。仅修复合成构图，不把原warnings或review_required改为ready。\n';
}

// All preconditions pass before creating a new directory. Recheck each copied source and audit-bound SHA during copying.
fs.mkdirSync(out, { recursive: false });
const marker = path.join(out, '.package-incomplete.json'); fs.writeFileSync(marker, JSON.stringify({ startedAt: new Date().toISOString(), fixture }));
try {
  for (const copy of exactCopies) {
    assert.equal(await shaFile(copy.file), copy.sha256, `Source changed during packaging: ${copy.target}`);
    const dest = within(out, copy.target); fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest)) assert.equal(await shaFile(dest), copy.sha256, `SHA conflict: ${copy.target}`);
    else fs.copyFileSync(copy.file, dest, fs.constants.COPYFILE_EXCL);
    assert.equal(await shaFile(dest), copy.sha256, `Copied SHA differs: ${copy.target}`);
  }
  for (const [name, text] of generated) {
    const p = within(out, name); assert(!fs.existsSync(p), `Generated file conflict: ${name}`); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text, { flag: 'wx' });
  }
  const files = [];
  async function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name); if (file === marker) continue;
      assert(!entry.isSymbolicLink(), 'Package must contain actual files, not symlinks');
      if (entry.isDirectory()) await visit(file);
      else { const p = slash(path.relative(out, file)); files.push({ path: p, bytes: fs.statSync(file).size, sha256: await shaFile(file) }); }
    }
  }
  await visit(out); files.sort((a, b) => a.path.localeCompare(b.path));
  const listing = { schemaVersion: 1, fixture, complete: true, fileCountExcludingManifests: files.length, selfHashPolicy: 'This directory manifest excludes itself and SHA256SUMS.txt. SHA256SUMS includes the directory manifest and excludes only itself.', files };
  const listFile = path.join(out, 'directory-manifest.json'); fs.writeFileSync(listFile, JSON.stringify(listing, null, 2) + '\n', { flag: 'wx' });
  const sums = [...files, { path: 'directory-manifest.json', sha256: await shaFile(listFile) }].map(f => `${f.sha256}  ${f.path}`).join('\n') + '\n';
  fs.writeFileSync(path.join(out, 'SHA256SUMS.txt'), sums, { flag: 'wx' }); fs.unlinkSync(marker);
  console.log(JSON.stringify({ output: out, fixture, complete: true, ...summary, copiedFiles: exactCopies.length, files: files.length + 2 }));
} catch (error) { console.error('Package remains incomplete; preserved for diagnosis. Choose a fresh output directory after fixing the condition.'); throw error; }
