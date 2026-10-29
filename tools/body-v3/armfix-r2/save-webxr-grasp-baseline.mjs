import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const [qaRoot,destination]=process.argv.slice(2);
if(!qaRoot||!destination||fs.existsSync(destination))throw Error('Expected QA root and NEW snapshot directory');
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const grasp=path.join(qaRoot,'webxr-grasp-r1');
fs.mkdirSync(destination,{recursive:true});
const records=[],hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
function copy(source,relative){
 if(fs.statSync(source).isDirectory()){for(const name of fs.readdirSync(source))copy(path.join(source,name),path.join(relative,name));return;}
 const raw=fs.readFileSync(source),target=path.join(destination,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,raw,{flag:'wx'});
 const reread=fs.readFileSync(target);if(hash(reread)!==hash(raw)||reread.length!==raw.length)throw Error('Copy mismatch: '+relative);
 records.push({file:relative.replaceAll('\\','/'),bytes:raw.length,sha256:hash(raw),original:source});
}
copy(path.join(grasp,'complete-grip-25mm-symmetric-r2'),'pose-data');
copy(path.join(grasp,'preview-grip25-symmetric-r2'),'exports-and-images');
for(const name of ['webxr-left.glb','webxr-assets-LICENSE.md','webxr-provenance.json'])copy(path.join(qaRoot,'official-model-previews-r1/source',name),path.join('original-source',name));
for(const name of ['webxr_static.py','author-parallel-fk-r3.py','author-thumb-fixed-r1.py','author-thumb-opposition-r2.py','mirror-thumb-grasp-r1.py'])copy(path.join(grasp,name),path.join('authoring-evidence',name));
for(const name of ['preview-webxr-grasp.mjs','webxr-grasp-server.mjs','smoke-webxr-grasp.mjs','hand-qa-runtime.mjs'])copy(path.join(repo,'tools/body-v3/armfix-r2',name),path.join('review-tools',name));
copy(path.join(repo,'tools/body-v3/webxr-grasp-qa-r1/check.py'),'review-tools/check.py');
copy(path.join(grasp,'viewer/index.html'),'viewer/index.html');
const note='# Saved WebXR 25 mm grip baseline, r2\n\nUser request on 2026-10-28: preserve the current version; the back of the hand looks perfect. Try a tighter front grip separately, and retain this version if the experiment is worse.\n\nThis snapshot is the exact saved fallback, not the new experiment. Preserve its bytes. Reopen the pose-data using the existing local review server, or load exports-and-images/*-hand-only.glb / *-grasp-with-separate-shaft.glb. The hand and shaft are independent meshes.\n\nThe user accepted the back appearance and this fallback version. This does not establish body/wrist integration, full finger contact, dynamic wrist acceptance or release eligibility. Current closest shaft clearances are about 0.2–1.7 mm; there is no measured hand self-intersection or shaft penetration.\n\nmanifest.json pins every copied file by SHA-256 and records its original path. It excludes itself to avoid a recursive hash. Original project files and the running baseline preview are preserved.\n';
fs.writeFileSync(path.join(destination,'README.md'),note,{flag:'wx'});records.push({file:'README.md',bytes:Buffer.byteLength(note),sha256:hash(note)});
const manifest={format:'pose-hub-preserved-grasp-baseline@1',name:'WebXR 25 mm symmetric grip r2',savedAt:new Date().toISOString(),userAcceptance:{backAppearance:true,currentVersionAsFallback:true,frontTightness:'experiment requested',bodyWristIntegration:false,releaseEligible:false},sourcePoseDirectory:path.join(grasp,'complete-grip-25mm-symmetric-r2'),files:records};
fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({destination,filesVerified:records.length,totalBytes:records.reduce((a,r)=>a+r.bytes,0)},null,2));
