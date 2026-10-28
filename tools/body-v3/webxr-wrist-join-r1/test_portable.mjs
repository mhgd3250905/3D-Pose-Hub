// CPU relocation/integrity regression; optional archived baseline comparison.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {verify, defaultRecipePath} from './loader.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const packageDir=path.dirname(defaultRecipePath);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const args=process.argv.slice(2);
assert.ok(args.length===0||(args.length===2&&args[0]==='--legacy-recipe'),'Usage: node test_portable.mjs [--legacy-recipe PATH]');
const original=verify();
const geometry=data=>({meshes:data.recipe.meshes,bridge:data.recipe.bridge,neutralFrames:data.recipe.neutralFrames,
 design:data.recipe.design,checks:data.recipe.checks,hands:data.hands,neutralLimbWorld:data.neutralLimbWorld,
 sourceLimbIndex:data.sourceLimbIndex,props:Object.fromEntries(Object.entries(data.props).map(([side,p])=>[side,{sha256:p.sha256,primitives:p.primitives}]))});
if(args.length){
 const legacy=verify({recipePath:args[1]});
 assert.deepStrictEqual(geometry(original),geometry(legacy),'Portable payload must preserve every geometry/source/prop value');
 const a=structuredClone(original.recipe),b=structuredClone(legacy.recipe);
 delete a.templateDir;delete a.packageManifest;
 for(const d of [a,b])for(const record of [d.sources.limbReference,d.sources.neutral,...Object.values(d.sources.hands)])delete record.file;
 assert.deepStrictEqual(a,b,'Only source paths and explicit package locations may change');
}
const manifest=JSON.parse(fs.readFileSync(path.join(packageDir,'manifest.json')));
assert.equal(sha(fs.readFileSync(path.join(here,'runtime.js'))),manifest.runtime.sha256,'Accepted runtime must remain unchanged');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'posehub-wrist-relocation-'));
try{
 const root=path.join(temporary,'unrelated-checkout'),copy=path.join(root,'drill-anim/models/webxr-dumbbell-wrist-r1');
 fs.cpSync(packageDir,copy,{recursive:true});
 const relocatedTools=path.join(root,'tools/body-v3/webxr-wrist-join-r1');
 fs.mkdirSync(relocatedTools,{recursive:true});
 for(const file of ['loader.mjs','runtime.js'])fs.copyFileSync(path.join(here,file),path.join(relocatedTools,file));
 const relocated=await import(pathToFileURL(path.join(relocatedTools,'loader.mjs')).href);
 const originalRead=fs.readFileSync;
 const previousCwd=process.cwd();
 process.chdir(os.tmpdir());
 fs.readFileSync=function(file,...options){
  const resolved=path.resolve(file instanceof URL?fileURLToPath(file):String(file));
  assert.ok(resolved.startsWith(temporary+path.sep),'Relocated verify attempted an external read: '+resolved);
  return originalRead.call(this,file,...options);
 };
 try{
  assert.deepStrictEqual(geometry(relocated.verify()),geometry(original));
  assert.deepStrictEqual(geometry(relocated.verify({recipePath:path.join(copy,'recipe.json')})),geometry(original));
  const runtimeFile=path.join(relocatedTools,'runtime.js'),runtimeBytes=fs.readFileSync(runtimeFile);
  fs.appendFileSync(runtimeFile,' ');
  assert.throws(()=>relocated.verify(),/runtime hash mismatch/,'A changed runtime must not keep the accepted package identity');
  fs.writeFileSync(runtimeFile,runtimeBytes);
  // The explicit legacy template override must also enforce its own GLB pins,
  // independently of the portable package's full-file verification.
  const override=path.join(temporary,'template-override');
  fs.cpSync(path.join(copy,'template-package'),override,{recursive:true});
  const overrideProp=path.join(override,'left-hand-with-dumbbell.glb');
  const overriddenBytes=fs.readFileSync(overrideProp);overriddenBytes[overriddenBytes.length-1]^=1;
  fs.writeFileSync(overrideProp,overriddenBytes);
  assert.throws(()=>relocated.verify({templateDir:override}),/prop hash mismatch/,'An explicit template override must enforce manifest GLB pins');
  const propFile=path.join(copy,'template-package/left-hand-with-dumbbell.glb');
  const propBytes=fs.readFileSync(propFile),corrupt=Buffer.from(propBytes);corrupt[corrupt.length-1]^=1;
  fs.writeFileSync(propFile,corrupt);
  assert.throws(()=>relocated.verify(),/hash mismatch/,'Prop tampering must fail before use');
  fs.writeFileSync(propFile,propBytes);
  const sourceFile=path.join(copy,'sources/left-grasp.json'),sourceBytes=fs.readFileSync(sourceFile);
  fs.appendFileSync(sourceFile,' ');
  assert.throws(()=>relocated.verify(),/hash mismatch/,'Source byte drift must fail even when parsed JSON is equivalent');
  fs.writeFileSync(sourceFile,sourceBytes);
  const manifestFile=path.join(copy,'template-package/manifest.json'),savedManifest=fs.readFileSync(manifestFile);
  const templateManifest=JSON.parse(savedManifest);templateManifest.files=templateManifest.files.filter(r=>r.file!=='left-hand-with-dumbbell.glb');
  fs.writeFileSync(manifestFile,JSON.stringify(templateManifest));
  assert.throws(()=>relocated.verify(),/hash mismatch/,'Removing template pins must fail package verification');
  fs.writeFileSync(manifestFile,savedManifest);
  assert.deepStrictEqual(geometry(relocated.verify()),geometry(original));
 }finally{fs.readFileSync=originalRead;process.chdir(previousCwd);}
 console.log(JSON.stringify({relocation:'passed',externalReadsBlocked:true,geometrySourceIndicesAndTransformsExact:true,
  legacyComparison:args.length?'passed':'not-requested',propAndSourceTamperingRejected:true,
  runtimeSha256:manifest.runtime.sha256,packageFiles:manifest.files.length+1}));
}finally{
 const target=path.resolve(temporary),parent=path.resolve(os.tmpdir());
 if(path.dirname(target)!==parent||!path.basename(target).startsWith('posehub-wrist-relocation-'))throw Error('Refusing to remove an unexpected temporary path');
 fs.rmSync(target,{recursive:true,force:true});
}
