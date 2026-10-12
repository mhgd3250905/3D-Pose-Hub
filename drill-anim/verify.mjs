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
// Reviewed additions are optional while PRs land one by one. An unknown file
// fails closed; a reviewed source remains immutable, like the original 59.
const additions = {
  'o-seated-fig4.js': '7c537dfda1f757f9076a5ae1457460778862be27',
  'o-seated-twist.js': '407da515443a618dbcb492e429c0080d7989d17a',
  'o-seated-ham.js': '7bb7b1a771aa40f062cd502dafdf945be0fc77d5',
  'o-stand-lunge.js': 'bff173f302dc9570c6d0af844ba44576e566a8ec',
  'o-stand-quad.js': 'e46569d0e60db567ee4b6b991f68cb4121e6b1c9',
  'o-stand-crossreach.js': '80d79a6c53f76896d62251e757f93176498288a9',
  'o-stand-sidebend.js': '699b4a7fa54c6f12148b571cff633c03b13f48f2',
  'o-seated-catcow.js': '0aceae2aacbd1c5698a6a3ba70b17ea93b01cc89',
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
  const sourceCommit = baseline.includes(file) ? source : additions[file];
  assert.ok(sourceCommit, `Unreviewed action spec: ${file}`);
  const original = spawnSync('git', ['show', `${sourceCommit}:tools/drill-anim/specs/${file}`], {cwd:repo,windowsHide:true});
  assert.equal(original.status, 0, `Source missing ${file}`);
  // Git may check out CRLF on Windows; compare source text in Git's LF form.
  const canonical = b => b.toString('utf8').replace(/\r\n/g,'\n');
  assert.equal(canonical(bytes), canonical(original.stdout), `Original action spec changed: ${file}`);
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
