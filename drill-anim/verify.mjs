// Source contracts only. This does not render, import media or edit the App.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(root, '../..');
const source = '68043f71651056c57c72a3b8813cbb354979346f';
// Reviewed candidates are optional while PRs land one by one. These canonical
// text hashes identify the reviewed parameter revision without requiring an
// unmerged audit-worktree Git object on a fresh clone. This is source integrity,
// not acceptance of a full rendered movie or the App's existing 51 videos.
const additions = {
  'o-seated-fig4.js': {pr:97, sha256:'66a147a7da04a444f705bcd3e2fd23788a1349c533847bba9f1a36ae32a0ac48'},
  'o-seated-twist.js': {pr:98, sha256:'e4f0c990b184f7999dcfa73c6d505a6486048bcea10fabb81810e5038cdebd6b'},
  'o-seated-ham.js': {pr:99, sha256:'871ccbd2022c8a9d2ce561750d1d75b7a45b2853ff357ca76c133a49db5a6527'},
  'o-stand-lunge.js': {pr:100, sha256:'c2f3984febb97819713bbbbea85196498fa6f95c8cb1a5e869cc89e580b4beaa'},
  'o-stand-quad.js': {pr:101, sha256:'95a4eead342c558dabcac458a0e14cb64dd64a7fc872d552a91b87eaf507ab49'},
  'o-stand-crossreach.js': {pr:102, sha256:'9c79a2e76a8b7f87134ccec346740dc0a7122305579dd839a422056cdb464b3b'},
  'o-stand-sidebend.js': {pr:103, sha256:'971b40526a08ecf039b675f9d3c156b45aad3e3bd332b203fbe866fb0861413e'},
  'o-seated-catcow.js': {pr:104, sha256:'732e8a213f1a4c851b48b9a157b537e79d5ec016f7fe3ee7ae15b7e293ade42a'},
};
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/drills.json'), 'utf8'));
const ids = Object.values(catalog.drills).flatMap(tiers => Object.values(tiers).map(d => d.id));
assert.equal(ids.length, 51);
assert.equal(new Set(ids).size, 51);
const files = fs.readdirSync(path.join(root, 'specs')).filter(f => f.endsWith('.js')).sort();
const listing = spawnSync('git', ['ls-tree', '--name-only', source, 'tools/drill-anim/specs/'], {cwd:repo,encoding:'utf8',windowsHide:true});
assert.equal(listing.status, 0, 'Original spec inventory unavailable');
const baseline = listing.stdout.trim().split(/\r?\n/).map(f => path.basename(f));
assert.equal(baseline.length, 59, 'Original spec inventory changed');
for (const file of baseline) assert.ok(files.includes(file), `Original action spec missing: ${file}`);
const hash = b => createHash('sha256').update(b).digest('hex');
const result = [];
for (const file of files) {
  const absolute = path.join(root, 'specs', file);
  const bytes = fs.readFileSync(absolute);
  // Git may check out CRLF on Windows; compare source text in Git's LF form.
  const canonical = b => b.toString('utf8').replace(/\r\n/g,'\n');
  if (baseline.includes(file)) {
    const original = spawnSync('git', ['show', `${source}:tools/drill-anim/specs/${file}`], {cwd:repo,windowsHide:true});
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
console.log(JSON.stringify({ok:true,source,appDrills:ids.length,specs:result.length,stretchSpecs:result.filter(s=>s.id.startsWith('s-')).length,reviewedOfficeSpecs:result.filter(s=>s.id.startsWith('o-')).length,originalSpecHashesPreserved:true},null,2));
