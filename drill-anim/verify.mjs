// Source contracts only. This does not render, import media or edit the App.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, '..');
// Pose-Hub commit 1adcab8 = 3D-Body 68043f71651056c57c72a3b8813cbb354979346f (Merge PR #89), rewritten by
// git filter-repo during the 2026-10-17 migration; tools/drill-anim/ became drill-anim/. See MIGRATION.md.
const source = '1adcab8343186c29a36483339ddee6e2725f8ca1';
const legacySource = '68043f71651056c57c72a3b8813cbb354979346f';
// Reviewed candidates are optional while PRs land one by one. These canonical
// text hashes identify the reviewed parameter revision without requiring an
// unmerged audit-worktree Git object on a fresh clone. This is source integrity,
// not acceptance of a full rendered movie or the App's existing 51 videos.
const homeCandidates = JSON.parse(fs.readFileSync(path.join(root, 'data/home-pr-candidates.json'), 'utf8')).specs;
const additions = {
  ...homeCandidates,
  'o-seated-fig4.js': {pr:97, sha256:'66a147a7da04a444f705bcd3e2fd23788a1349c533847bba9f1a36ae32a0ac48'},
  'o-seated-twist.js': {pr:98, sha256:'e4f0c990b184f7999dcfa73c6d505a6486048bcea10fabb81810e5038cdebd6b'},
  'o-seated-ham.js': {pr:99, sha256:'871ccbd2022c8a9d2ce561750d1d75b7a45b2853ff357ca76c133a49db5a6527'},
  'o-stand-lunge.js': {pr:100, sha256:'c2f3984febb97819713bbbbea85196498fa6f95c8cb1a5e869cc89e580b4beaa'},
  'o-stand-quad.js': {pr:101, sha256:'95a4eead342c558dabcac458a0e14cb64dd64a7fc872d552a91b87eaf507ab49'},
  'o-stand-crossreach.js': {pr:102, sha256:'9c79a2e76a8b7f87134ccec346740dc0a7122305579dd839a422056cdb464b3b'},
  'o-stand-sidebend.js': {pr:103, sha256:'971b40526a08ecf039b675f9d3c156b45aad3e3bd332b203fbe866fb0861413e'},
  'o-seated-catcow.js': {pr:104, sha256:'732e8a213f1a4c851b48b9a157b537e79d5ec016f7fe3ee7ae15b7e293ade42a'},
  'w-bird-dog.js': {pr:105, sha256:'58b052b8d254e4ffbab5fd07bcc5945696cb5e26d2d9b9dfdc6c135473c3ca7a'},
  'w-chair-hip-thrust.js': {pr:105, sha256:'85e0e27abe7f323f82858e8206540fa25c1b21c93007fb8a88d695934cdb199a'},
  'w-clamshell.js': {pr:105, sha256:'f3647e83bf4a87521600cbc96d5c124c1e8413bdd06c3f72235ff3cbb9a05ff1'},
  'w-dead-bug.js': {pr:105, sha256:'89c13a96b9cb23f6fe055586ef2990506f65d4b996257f33fffad7d4660a894a'},
  'w-feet-on-chair-bridge.js': {pr:105, sha256:'a1f5f1fd1997ae56a5692ce4c5e9f6aea65db5b20d7715209a104ddde4f65a7d'},
  'w-fire-hydrant.js': {pr:105, sha256:'6b53673cd7026ac41ae02db04ee054c3da4f0090582c9b516b9cfef11c219d9f'},
  'w-prone-swimmer.js': {pr:105, sha256:'d4f9b0a41b0b09e6feacb7c37e9bceb2070c2e583ed82deebc49062a68a55734'},
  'w-wall-sit.js': {pr:105, sha256:'d9e8e0a3ffad2b701c1b7758028f71561e4b65620a03324bc29bd4c111c775fa'},
  // Local revision 4ef5556, visually accepted on 2026-10-13. These remain
  // a separate preview collection; half-straddle is stopped, not accepted.
  't-flare-side-hold.js': {pr:106, sha256:'760349503c03b402fdaceb28888856915053163b6d1070843a5e5288da5d52e2'},
  't-half-straddle.js': {pr:106, sha256:'df59518eb023662e4ae2581418f469e795091a83f8855628316411104f9ca760'},
  't-lsit-open-close.js': {pr:106, sha256:'9c1bba1e5e9a9eec862f748b02fd422b8db9b2b2dcb123c0ee0e3f0ba6990daa'},
  't-lsit-tuck.js': {pr:106, sha256:'2973832f55d1143f5bc8fbe135e99547deaeb5fb85d16674a323e26f3c365f22'},
  't-lsit-vsit-circles.js': {pr:106, sha256:'a799d4804a429f9cf4aa48feb4107afe7b827224a309f44f1c6fa67cec617348'},
  't-lsit-wide.js': {pr:106, sha256:'022a41e08db8222b75f730df7b56e7f5dbdc9bba7de11fc75f697cf3db17b0d2'},
  't-seated-straddle-ext.js': {pr:106, sha256:'b3cc83958d1a9a8abc71877a7b920d34ef1ad831055e8f0aba332f19d9a7fbf9'},
  't-seated-straddle-lift-1leg.js': {pr:106, sha256:'ae5d188dcdda9bc3b9aa446fa14138f41e14b15f2e3d810d76060f4045bd3d30'},
  't-seated-straddle-lifts.js': {pr:106, sha256:'e5424a98d9965ec2b2b3f63cde4bf83ffca5aeb7884d8fede247ef1fd3fd4c41'},
  't-straddle-hold.js': {pr:106, sha256:'2af9da74124b17c1f4a852d7cd87e8e9aa4e6fc2793f8afebe6bb0ea54b84d05'},
  't-tuck-planche.js': {pr:106, sha256:'cf3a12bcc38413a0c9bd93d37533564280175f0e4bec9fc2c39b8e47ecf6c497'},
  't-vsit.js': {pr:106, sha256:'4f51eff6ec4876713da3f10c62269b6026e0fc38d0138f64a7fc24552294e540'},
};
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/drills.json'), 'utf8'));
const ids = Object.values(catalog.drills).flatMap(tiers => Object.values(tiers).map(d => d.id));
assert.equal(ids.length, 51);
assert.equal(new Set(ids).size, 51);
const files = fs.readdirSync(path.join(root, 'specs')).filter(f => f.endsWith('.js')).sort();
const listing = spawnSync('git', ['ls-tree', '--name-only', source, 'drill-anim/specs/'], {cwd:repo,encoding:'utf8',windowsHide:true});
assert.equal(listing.status, 0, 'Original spec inventory unavailable');
const baseline = listing.stdout.trim().split(/\r?\n/).map(f => path.basename(f));
assert.equal(baseline.length, 59, 'Original spec inventory changed');
for (const file of baseline) assert.ok(files.includes(file), `Original action spec missing: ${file}`);
const hash = b => createHash('sha256').update(b).digest('hex');
const textHash = file => hash(Buffer.from(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')));
for (const [file, expected] of Object.entries({
  '_thomas.mjs': '5154ceb449ecaee9aaa8c370f8712bf9778229ac5bf2b77c2d8626dc2b2c6d9a',
  '_thomas-pr106.mjs': 'bb034087440df871aab2854180fcc9680d0b63119feedafeb2312c50e14e36fd',
  '_thomas-mirror.mjs': '478fa7a901007c40c9ed64d6dc0908e622cf60cef4d5f8018229385bc73c847d',
})) assert.equal(textHash(path.join(root, 'specs', file)), expected, `Thomas helper changed: ${file}`);
// Shared helpers of the HipLab media-fix r2 revisions (PR #121); their importers are hashed above.
for (const [file, expected] of Object.entries({
  'specs/_9090-feet.mjs': '3e9d1a0bc673d7b1e35e37a3e45d1aac5b7e2c910152b61bdf443358ef88af12',
  'lib/foot-orient.mjs': 'eb7b0452b75ef7701a2baf359908272bd3139a04ef56eacfffc4084b732ce431',
})) assert.equal(textHash(path.join(root, file)), expected, `HipLab media-fix helper changed: ${file}`);
const model = JSON.parse(fs.readFileSync(path.join(root, 'models/training-human-v2.json'), 'utf8'));
assert.equal(model.id, 'training-human-v2');
assert.equal(model.defaultForNewDrills, true);
for (const [file, expected] of Object.entries(model.sourceSha256)) {
  const absolute = path.join(repo, file);
  assert.equal(file.endsWith('.glb') ? hash(fs.readFileSync(absolute)) : textHash(absolute), expected, `Training human source changed: ${file}`);
}
const result = [];
for (const file of files) {
  const absolute = path.join(root, 'specs', file);
  const bytes = fs.readFileSync(absolute);
  // Git may check out CRLF on Windows; compare source text in Git's LF form.
  const canonical = b => b.toString('utf8').replace(/\r\n/g,'\n');
  if (baseline.includes(file)) {
    const original = spawnSync('git', ['show', `${source}:drill-anim/specs/${file}`], {cwd:repo,windowsHide:true});
    assert.equal(original.status, 0, `Source missing ${file}`);
    assert.equal(canonical(bytes), canonical(original.stdout), `Original action spec changed: ${file}`);
  } else {
    assert.ok(additions[file], `Unreviewed action spec: ${file}`);
    assert.equal(hash(Buffer.from(canonical(bytes))), additions[file].sha256, `Reviewed PR #${additions[file].pr} spec changed: ${file}`);
  }
  const {default: spec} = await import(pathToFileURL(absolute).href);
  assert.equal(spec.id, file.slice(0,-3));
  assert.ok(Number.isFinite(spec.timeline.duration) && spec.timeline.duration > 0, `Invalid duration: ${file}`);
  assert.ok(spec.timeline.tracks && typeof spec.timeline.tracks === 'object');
  for (const [track, keys] of Object.entries(additions[file] ? spec.timeline.tracks : {})) {
    assert.ok(Array.isArray(keys) && keys.length > 0, `Empty track ${file}:${track}`);
    let previous = -Infinity;
    for (const key of keys) {
      assert.ok(Array.isArray(key) && Number.isFinite(key[0]) && Number.isFinite(key[1]), `Invalid key ${file}:${track}`);
      assert.ok(key[0] >= 0 && key[0] < spec.timeline.duration && key[0] > previous, `Invalid key time ${file}:${track}`);
      previous = key[0];
    }
  }
  result.push({id:spec.id,duration:spec.timeline.duration,sha256:hash(Buffer.from(canonical(bytes)))});
}
for (const id of ids) assert.ok(result.some(s => s.id === id), `Missing App drill spec ${id}`);
function checkTree(directory) {
  for (const item of fs.readdirSync(directory,{withFileTypes:true})) {
    if (item.name === 'node_modules' || item.name === 'out' || item.name === '__pycache__') continue;
    const file=path.join(directory,item.name);
    if(item.isDirectory()) checkTree(file);
    else if(item.name === 'handframe-probe.js' || item.name === 'propclear.js') {
      // These are function bodies passed to tools/probe.mjs, not modules.
      new Function('spec',fs.readFileSync(file,'utf8'));
    } else if(/\.(mjs|js)$/.test(item.name)) {
      const check=spawnSync(process.execPath,['--check',file],{encoding:'utf8',windowsHide:true});
      assert.equal(check.status,0,check.stderr);
    } else if(item.name.endsWith('.json')) JSON.parse(fs.readFileSync(file,'utf8'));
  }
}
checkTree(root);
console.log(JSON.stringify({ok:true,source,legacySource,appDrills:ids.length,specs:result.length,defaultSpecs:result.filter(s=>!s.id.startsWith('t-')).length,thomasPreviewSpecs:result.filter(s=>s.id.startsWith('t-')).length,stoppedThomasSpecs:1,modelProfile:model.id,modelSources:Object.keys(model.sourceSha256).length,stretchSpecs:result.filter(s=>s.id.startsWith('s-')).length,reviewedHomeSpecs:result.filter(s=>s.id.startsWith('h-')).length,reviewedOfficeSpecs:result.filter(s=>s.id.startsWith('o-')).length,reviewedSittingSpecs:result.filter(s=>s.id.startsWith('w-')).length,originalSpecHashesPreserved:true},null,2));
