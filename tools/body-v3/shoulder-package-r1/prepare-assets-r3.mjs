// Prepare candidate inputs only; this is not a completed or approved model.
// --check-only performs no writes. An output directory must not already exist.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const [leftPath,rightPath,gatePath,normalPath,restPath,mode,out]=process.argv.slice(2);
if(!restPath||!['--check-only','--output'].includes(mode)||(mode==='--output'&&!out)||(mode==='--check-only'&&out))
 throw Error('Usage: node prepare-assets.mjs <left.json> <right.json> <gate.json> <normal.json> <rest.json> --check-only | --output <new-directory>');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=p=>{const bytes=fs.readFileSync(p);return {bytes,data:JSON.parse(bytes.toString('utf8')),rawSha256:digest(bytes)};};
const inputs=Object.fromEntries(Object.entries({left:leftPath,right:rightPath,gate:gatePath,normal:normalPath,rest:restPath}).map(([k,p])=>[k,read(p)]));
const {left,right,gate,normal,rest}=Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,v.data]));
const torsoPath=path.join(repo,'drill-anim/models/training-human-v2plus-torso-base.json');
const clothPath=path.join(repo,'drill-anim/models/collar-garment-refine-r7/refinement.json');
const torsoRaw=digest(fs.readFileSync(torsoPath)),clothRaw=digest(fs.readFileSync(clothPath));
const cloth=JSON.parse(fs.readFileSync(clothPath,'utf8'));
if(left.sourceSha256!==right.sourceSha256||left.sourceSha256!==torsoRaw||left.count!==right.count||left.seamFirst!==right.seamFirst)
 throw Error('left/right source or torso mismatch');
const seen=new Set();for(const [name,d] of [['left',left],['right',right]]){
 if(!Array.isArray(d.vertexIds)||typeof d.bindOffsetsF32!=='string'||Buffer.from(d.bindOffsetsF32,'base64').length!==d.vertexIds.length*12)throw Error(name+' malformed offsets');
 for(const id of d.vertexIds){if(!Number.isInteger(id)||id<0||id>=d.seamFirst||seen.has(id))throw Error('invalid or overlapping position target '+id);seen.add(id);}
}
for(const key of ['left','right','gate','rest']){
 const recorded=normal.inputHashes?.[key==='gate'?'config':key];
 if(recorded!==inputs[key].rawSha256)throw Error('normal input hash mismatch: '+key);
}
if(normal.inputHashes?.cloth!==clothRaw||normal.sharedOffset!==14511||normal.sourceMesh!=='Mesh005'||rest.mesh!=='Mesh005'||!Array.isArray(rest.bones))throw Error('normal/garment/rest metadata mismatch');
const ring=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models/collar-weld-r26/candidate.json'),'utf8')).torsoRing;
if(ring.length!==96||ring.some(id=>seen.has(id)))throw Error('candidate touches collar seam');
if(!gate.centersXYZW||!Array.isArray(gate.innerDegrees)||!Array.isArray(gate.outerDegrees)||gate.innerDegrees.length!==2||gate.outerDegrees.length!==2||gate.innerDegrees.some((x,i)=>!Number.isFinite(x)||!(gate.outerDegrees[i]>x)))throw Error('invalid gate');
for(const side of ['left','right'])if(!Array.isArray(gate.centersXYZW[side])||gate.centersXYZW[side].length!==2||gate.centersXYZW[side].some(q=>!Array.isArray(q)||q.length!==4||q.some(x=>!Number.isFinite(x))||Math.hypot(...q)<1e-8))throw Error('invalid gate center '+side);
if(!Array.isArray(normal.torsoTargets)||!Array.isArray(normal.sourceTargets))throw Error('missing normal targets');
for(const [name,rows] of [['torso',normal.torsoTargets],['garment',normal.sourceTargets]]){
 const limit=name==='torso'?left.count:cloth.sourceVertexCount+cloth.additions.length;
 const ids=new Set();for(const row of rows){if(!Array.isArray(row)||row.length!==5||!Number.isInteger(row[0])||row[0]<0||row[0]>=limit||!['left','right'].includes(row[1])||!row.slice(2).every(Number.isFinite)||Math.abs(Math.hypot(...row.slice(2))-1)>1e-4||ids.has(row[0]))throw Error('invalid '+name+' normal row');ids.add(row[0]);}
}
const {trainingInputs,...runtimeGate}=gate;
if(!trainingInputs||typeof trainingInputs!=='object'||Object.values(trainingInputs).some(x=>typeof x!=='string'||!/^[0-9a-f]{64}$/i.test(x)))throw Error('missing or malformed gate provenance');
const runtimeNormal=structuredClone(normal),localTipInputs=runtimeNormal.localTip?.inputSha256;
if(localTipInputs){if(typeof localTipInputs!=='object'||Object.values(localTipInputs).some(x=>typeof x!=='string'||!/^[0-9a-f]{64}$/i.test(x)))throw Error('malformed local tip provenance');delete runtimeNormal.localTip.inputSha256;}
// Absolute source paths are intentionally excluded. Hashes document archived
// training evidence only and are not runtime dependencies.
const provenance={scope:'candidate evidence, not runtime dependencies',trainingInputSha256:Object.values(trainingInputs).sort(),normalInputSha256:normal.inputHashes,normalLocalTipInputSha256:Object.values(localTipInputs||{}).sort()};
function rejectPaths(value){if(typeof value==='string'&&/(?:[A-Za-z]:[\\/]|^\\\\|^\/)/.test(value))throw Error('absolute path in packaged candidate');if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){if(/(?:[A-Za-z]:[\\/]|^\\\\|^\/)/.test(k))throw Error('absolute path key in packaged candidate');rejectPaths(v);}}
for(const data of [left,right,runtimeGate,runtimeNormal,rest,provenance])rejectPaths(data);
const seamIds=new Set();for(const f of ['training-human-v2plus-torso-base.json','training-human-v2plus-limbs-base.json','hands-native-c1r2/hands-base.json']){
 const s=JSON.parse(fs.readFileSync(path.join(repo,'drill-anim/models',f),'utf8')).seam;
 s.vid.forEach((id,i)=>{if(s.mesh[i]==='Mesh005')seamIds.add(id);});
}
const targetIds=normal.sourceTargets.map(row=>row[0]),moveIds=new Set(cloth.sourceMoves.ids);
const summary={status:'unreviewed asset preparation only; no production loader or acceptance',positionVertices:seen.size,normalTorsoRows:normal.torsoTargets.length,normalGarmentRows:normal.sourceTargets.length,garmentSeamTargetRows:targetIds.filter(id=>seamIds.has(id)).length,garmentRefinedOnlyRows:targetIds.filter(id=>id>=cloth.sourceVertexCount).length,garmentMovedTargetRows:targetIds.filter(id=>moveIds.has(id)).length,sourceRawSha256:torsoRaw,clothRawSha256:clothRaw};
if(mode==='--check-only'){console.log(JSON.stringify(summary));process.exit(0);}
const directory=path.resolve(out);if(fs.existsSync(directory))throw Error('refusing to overwrite output directory');
fs.mkdirSync(directory,{recursive:false});
const entries={
 'left.json':left,'right.json':right,'gate.json':runtimeGate,'normals.json':runtimeNormal,'rest-meta.json':rest,'provenance.json':provenance,
};
const hashes={};for(const [name,data] of Object.entries(entries)){
 const bytes=Buffer.from(JSON.stringify(data)+'\n','utf8');fs.writeFileSync(path.join(directory,name),bytes,{flag:'wx'});hashes[name]=digest(bytes);
}
for(const [name,source] of Object.entries({
 'runtime-current-r1.js':path.join(repo,'tools/body-v3/shoulder-corrective-probe-r3/runtime-current-r1.js'),
 'lifecycle-r1.js':path.join(repo,'tools/body-v3/shoulder-package-r1/lifecycle-r1.js'),
 'loader.mjs':path.join(repo,'tools/body-v3/shoulder-package-r1/template-loader-r3.mjs'),
})){
 const bytes=Buffer.from(fs.readFileSync(source,'utf8').replace(/\r\n/g,'\n'),'utf8');fs.writeFileSync(path.join(directory,name),bytes,{flag:'wx'});hashes[name]=digest(bytes);
}
const baseManifest=fs.readFileSync(path.join(repo,'drill-anim/models/training-human-v3-completed-r6/manifest.json'),'utf8').replace(/\r\n/g,'\n');const baseManifestSha256=digest(Buffer.from(baseManifest,'utf8'));const manifest={version:'1.0.0-r3',status:'unreviewed-incomplete',hashPolicy:'UTF-8 CRLF normalized to LF',baseManifestSha256,files:hashes,...summary};
fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...summary,output:directory,assets:Object.keys(hashes).length}));
