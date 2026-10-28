// Re-pin only this local candidate after source review; never changes frozen manifests.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const dir='drill-anim/models/training-human-v3-armfix-r2',hands='drill-anim/models/hands-native-c1r2-symmetric-r1';
const file=path.join(repo,dir,'manifest.json'),m=JSON.parse(fs.readFileSync(file,'utf8'));
const files=new Set([...Object.keys(m.sha256),...fs.readdirSync(path.join(repo,dir)).filter(f=>f.endsWith('.mjs')||f==='README.md').map(f=>dir+'/'+f),...fs.readdirSync(path.join(repo,hands)).filter(f=>['hands-base.json','hands-rig.json','manifest.json','loader.mjs'].includes(f)).map(f=>hands+'/'+f),'tools/body-v3/armfix-r2/model-pin.mjs']);
m.recipe={upperArmScale:1,forearmScale:1,handScale:1,handDir:'hands-native-c1r2-symmetric-r1',lowerBodyAndTorso:'unchanged-from-original-v3-rig'};
m.reviewed=false;m.releaseEligible=false;
m.retained=['P1 ankle','P2 head-neck','P3 shared collar and garment','L1 wrist gradient','L2 derived normals'];
m.notMigrated=['P4 hip/knee live normals','P5 shoulder corrective','r5 contact/neck calibration'];
m.sha256=Object.fromEntries([...files].sort().map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,f),'utf8').replaceAll('\r\n','\n')).digest('hex')]));
m.validation={cpuCommand:'node --test '+dir+'/armfix.test.mjs',scope:'CPU source/recipe/guard/geometry checks only; no visual acceptance inferred. GPU evidence held by parent task.'};
fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');console.log(JSON.stringify({files:files.size,manifest:file}));
