import fs from 'node:fs';
export async function calibrateSupport(page,{rig,sourceId,sourcePins=[]}={}){
 if(!sourceId||!rig?.fingers||!rig?.palmar)throw Error('support: supply actual symmetric hand rig and sourceId');
 const minimalRig={fingers:rig.fingers,palmar:rig.palmar};
 await page.addScriptTag({content:fs.readFileSync(new URL('./support-calibrate-runtime.js',import.meta.url),'utf8')});
 return page.evaluate(opts=>window.__calibrateFixedSupport(opts),{rig:minimalRig,sourceId,sourcePins,handScale:1});
}
