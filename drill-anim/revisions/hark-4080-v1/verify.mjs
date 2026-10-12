// Integrity checks for an immutable delivery; no rendering or App changes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest=read(path.join(root,'SHA256SUMS.json'));
const actual=[];
function collect(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);assert.ok(!e.isSymbolicLink(),`Unexpected symlink ${p}`);if(e.isDirectory())collect(p);else actual.push(path.relative(root,p).replaceAll('\\','/'));}}
collect(root);
assert.deepEqual(actual.filter(x=>x!=='SHA256SUMS.json').sort(),manifest.files.map(x=>x.path).sort(),'File set changed');
for(const f of manifest.files){const p=path.resolve(root,f.path);assert.ok(p.startsWith(root+path.sep));assert.equal(fs.statSync(p).size,f.bytes,f.path);assert.equal(sha(p),f.sha256,f.path);}
const catalog=read(path.join(root,'catalog.json'));
assert.equal(catalog.actions.length,5);
assert.equal(new Set(catalog.actions.map(a=>a.id)).size,5);
for(const a of catalog.actions){
  const spec=(await import(pathToFileURL(path.join(root,a.spec)).href)).default;
  assert.deepEqual(spec,read(path.join(root,a.serialized_spec)),a.id+' serialized spec');
  assert.equal(spec.id,a.id);
  assert.equal(spec.timeline.duration,a.duration_s);
  const qa=read(path.join(root,a.qa));
  assert.equal(qa.id,a.id);assert.equal(qa.pass,a.engine_pass);
  assert.equal(qa.frames,a.frames);assert.equal(qa.fps,a.fps);
  assert.equal(Math.round(a.duration_s*a.fps),a.frames);
  assert.equal(qa.solver_warning_frames,a.solver_warning_frames);
  const theme=read(path.join(root,a.theme));assert.ok(theme&&typeof theme==='object');
  for(const k of ['mp4','gif','poster','frames_image','media_validation'])assert.ok(fs.statSync(path.join(root,a[k])).isFile());
  const media=read(path.join(root,a.media_validation));assert.equal(media.engine_pass,a.engine_pass);assert.equal(media.gif_decode_pass,true);
  if(a.id==='hip-abductors-B')assert.equal(a.solver_warning_frames,240);
}
console.log(JSON.stringify({ok:true,files:manifest.files.length,actions:5,full_rerender:false,original_qa_retained:true},null,2));
