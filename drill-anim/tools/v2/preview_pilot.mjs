import {spawn} from 'node:child_process';
const opt=(k,d)=>{const a=process.argv.slice(2),i=a.indexOf(k);return i<0?d:a[i+1];};
const root=opt('--root');if(!root)throw new Error('Pass an explicit --root on the approved media drive');
const actions=[['w-dead-bug','w-dead-bug-r2',56],['h-chair-step-up','h-chair-step-up-r2',66],['h-db-curl','h-db-curl-r2',60],['glute-max-A','glute-max-A-r2',63],['s-frog','s-frog-r3',114],['h-catcow-quad','h-catcow-quad-r2',39]];
for(const [id,spec,peak]of actions){
  await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['drill-anim/tools/v2/render_layers.mjs','--spec',`drill-anim/specs/${spec}.js`,'--action',id,'--skins','all','--root',root,'--frames',[0,peak,120,239,240].join(',')],{stdio:'inherit',windowsHide:true});child.on('error',reject);child.on('exit',c=>c===0?resolve():reject(new Error(`${id} preview exited ${c}`)));});
}
