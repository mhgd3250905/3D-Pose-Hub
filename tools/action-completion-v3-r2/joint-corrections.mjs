// Explicit versioned shared components; frozen base models are preserved.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {REPO,MODEL,sha,repoFile,readJson} from './recipe.mjs';
const allowed=new Set(['ankle-join-r1','ankle-join-r2','ankle-join-r4','ankle-join-r5','elbow-dqs-r1','upper-arm-contour-r1','upper-arm-contour-r2','upper-arm-contour-r3']);
export function resolveCorrections(recipe){
  const values=recipe.jointCorrections??[];
  if(!Array.isArray(values))throw Error('jointCorrections must be an array');
  const seen=new Set();
  return values.map(value=>{
    const family=value?.profile?.startsWith('ankle-join-')?'ankle':value?.profile?.startsWith('upper-arm-contour-')?'upper-arm':value?.profile;
    if(!allowed.has(value?.profile)||seen.has(family))throw Error('Unknown or duplicate shared joint correction');
    seen.add(family);
    const manifestFile=repoFile('drill-anim/models/'+value.profile+'/manifest.json'),manifest=readJson(manifestFile);
    if(value.version!==manifest.version||manifest.profile!==value.profile||manifest.base.profile!==MODEL.profile||manifest.base.version!==MODEL.version)throw Error('Joint correction identity or base mismatch');
    for(const [relative,want]of Object.entries(manifest.sha256Lf)){
      const file=repoFile(relative),actual=sha(Buffer.from(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')));
      if(actual!==want)throw Error('Shared correction source changed: '+relative);
    }
    if(!Object.hasOwn(manifest.sha256Lf,manifest.module))throw Error('Unpinned joint correction entry');
    return {manifest,manifestFile,files:Object.keys(manifest.sha256Lf).map(repoFile)};
  });
}
export async function installCorrections(page,recipe){
  const results=[];
  for(const {manifest}of resolveCorrections(recipe)){
    const module=await import(pathToFileURL(path.join(REPO,manifest.module)).href);
    results.push({profile:manifest.profile,version:manifest.version,setup:await module.install(page)});
  }
  return results;
}
