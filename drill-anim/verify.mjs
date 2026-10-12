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
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/drills.json'), 'utf8'));
const ids = Object.values(catalog.drills).flatMap(tiers => Object.values(tiers).map(d => d.id));
assert.equal(ids.length, 51);
assert.equal(new Set(ids).size, 51);
const files = fs.readdirSync(path.join(root, 'specs')).filter(f => f.endsWith('.js')).sort();
const hash = b => createHash('sha256').update(b).digest('hex');
const result = [];
for (const file of files) {
  const absolute = path.join(root, 'specs', file);
  const bytes = fs.readFileSync(absolute);
  const original = spawnSync('git', ['show', `${source}:tools/drill-anim/specs/${file}`], {cwd:repo,windowsHide:true});
  assert.equal(original.status, 0, `Source missing ${file}`);
  // Git may check out CRLF on Windows; compare source text in Git's LF form.
  const canonical = b => b.toString('utf8').replace(/\r\n/g,'\n');
  assert.equal(canonical(bytes), canonical(original.stdout), `Original action spec changed: ${file}`);
  const {default: spec} = await import(pathToFileURL(absolute).href);
  assert.equal(spec.id, file.slice(0,-3));
  assert.ok(Number.isFinite(spec.timeline.duration) && spec.timeline.duration > 0, `Invalid duration: ${file}`);
  assert.ok(spec.timeline.tracks && typeof spec.timeline.tracks === 'object');
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
console.log(JSON.stringify({ok:true,source,appDrills:ids.length,specs:result.length,stretchSpecs:result.filter(s=>s.id.startsWith('s-')).length,originalSpecHashesPreserved:true},null,2));
