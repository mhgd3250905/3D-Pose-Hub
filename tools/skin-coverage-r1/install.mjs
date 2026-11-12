import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readApproved} from '../preview-current-model.mjs';
import {loadSkin} from '../action-package-v3/profile.mjs';
import {installPumpHighlight} from '../action-package-v3/native-highlight.mjs';
import * as port from './port.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const skinIds=['realistic','tech-white','neon-night','neon-night-b','hologram'];
export async function install(page){
 readApproved();
 const skins=skinIds.map(loadSkin),src=port.portedSource(),table=port.regionTable();
 for(const s of skins.filter(s=>s.port))if(s.port.v2SourceSha256!==src.sourceSha256||s.port.regionTableSha256!==table.sha256)throw Error('Frozen skin design changed: '+s.id);
 const bake=await port.installV2Skins(page);
 await port.setV2Skin(page,'tech-white');await port.setV2Skin(page,null);
 const params=await port.v2SkinParams(page);
 for(const s of skins.filter(s=>s.v2Params))if(JSON.stringify(params[s.look.v2Skin])!==JSON.stringify(s.v2Params))throw Error('Skin palette changed: '+s.id);
 await port.applyV3Tunes(page,Object.fromEntries(skins.filter(s=>s.look.v3Tune).map(s=>[s.look.v2Skin,port.resolveTune(s.look.v3Tune)])));
 // User-requested appearance override; the frozen skin palettes stay intact.
 for(const s of skins)if(s.look.mode==='v2-port')s.look={...s.look,rim:{...s.look.rim,strength:0}};
 await page.evaluate(()=>{const V=__v2p,base=V.setSkin;V.setSkin=function(name){const r=base.call(this,name);if(name&&V.SKINS[name]?.lines)V.regions.uni.uV2pRHolo.value[2]=0;return r;};});
 const add=async rel=>page.addScriptTag({content:fs.readFileSync(path.join(root,rel),'utf8')});
 await add('tools/action-package-v3/browser-package-layers.js');await page.evaluate(()=>__pkgLayers.patch());await installPumpHighlight(page);
 await add('tools/human-polish-v3/runtime.js');await page.evaluate(()=>__bodyPolish.enable(true));
 await add('tools/head-surface-smooth-r1/runtime.js');await page.evaluate(()=>__headSurfaceSmooth.enable(true));
 await add('tools/eye-socket-soften-r1/runtime.js');await page.evaluate(()=>__eyeSocketSoften.enable(true));
 await add('tools/skin-coverage-r1/runtime.js');await page.evaluate(()=>__skinCoverage.enable(true));
 return {skins,bake,rimPolicy:{realistic:'unchanged',nonDefault:'off',hologramFresnelAlpha:0},port:{version:port.PORT_VERSION,sha256:src.portedSha256}};
}
