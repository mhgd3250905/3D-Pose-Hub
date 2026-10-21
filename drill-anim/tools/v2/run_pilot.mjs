import fs from 'node:fs';import path from 'node:path';import{spawn}from'node:child_process';
import{sourceFingerprint}from'./source-fingerprint.mjs';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf(k);return i<0?d:args[i+1];};
if(!opt('--root'))throw new Error('Pass an explicit --root on the approved media drive');
const root=path.resolve(opt('--root')),preview=args.includes('--preview');
if(!preview&&!args.includes('--reviewed'))throw new Error('Pass --preview first; complete production requires explicit --reviewed');
const jobs=[['w-dead-bug','w-dead-bug-r2',56],['h-chair-step-up','h-chair-step-up-r2',66],['h-db-curl','h-db-curl-r2',60],
  ['glute-max-A','glute-max-A-r2',63],['s-frog','s-frog-r3',114],['h-catcow-quad','h-catcow-quad-r2',39]];
const recipe={format:'pose-hub-pilot-queue@2',mode:preview?'preview':'reviewed-production',root,created:new Date().toISOString(),
  actions:jobs.map(([id,spec])=>({actionId:id,...sourceFingerprint(process.cwd(),path.resolve(`drill-anim/specs/${spec}.js`))}))};
fs.mkdirSync(path.join(root,'manifests'),{recursive:true});fs.mkdirSync(path.join(root,'logs'),{recursive:true});
fs.writeFileSync(path.join(root,'manifests',`pilot-${preview?'preview':'production'}-source.json`),JSON.stringify(recipe,null,2)+'\n');
let completed=0;
for(const[id,spec,peak]of jobs){
  const log=fs.createWriteStream(path.join(root,'logs',`${id}-${preview?'preview-final':'production'}.log`),{flags:'a'});
  const cmd=['drill-anim/tools/v2/render_layers.mjs','--spec',`drill-anim/specs/${spec}.js`,'--action',id,'--skins','all','--root',root,
    ...(preview?['--frames',[0,peak,239,240].join(',')]:['--reviewed'])];
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,cmd,{stdio:['ignore','pipe','pipe'],windowsHide:true});
    for(const[name,stream]of[['stdout',process.stdout],['stderr',process.stderr]])child[name].on('data',b=>{log.write(b);stream.write(b);});
    child.on('error',reject);child.on('exit',c=>{log.end();c===0?resolve():reject(new Error(`${id} exited ${c}`));});});
  completed++;console.log(JSON.stringify({event:'action-complete',mode:preview?'preview':'production',actionId:id,completed,total:jobs.length,skins:completed*5,
    timelineFrames:preview?completed*4:completed*240,bodyImages:preview?completed*20:completed*1200}));
}
