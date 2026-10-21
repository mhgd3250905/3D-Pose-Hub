import {spawn} from 'node:child_process';
const ri=process.argv.indexOf('--root');if(ri<0)throw new Error('Pass an explicit --root for this diagnostic');
const root=process.argv[ri+1];
for(const[id,spec,peak]of[['glute-max-A','glute-max-A-r2',63],['h-catcow-quad','h-catcow-quad-r2',39],['s-frog','s-frog-r3',114]]){
  await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['drill-anim/tools/v2/render_layers.mjs','--spec',`drill-anim/specs/${spec}.js`,'--action',id,
    '--skin','realistic','--root',root,'--frames',[0,peak,120,239,240].join(','),'--canonical-contact-check'],{stdio:'inherit',windowsHide:true});
    p.on('error',reject);p.on('exit',c=>c===0?resolve():reject(new Error(`Contact diagnostic ${id} exited ${c}`)));});
}
