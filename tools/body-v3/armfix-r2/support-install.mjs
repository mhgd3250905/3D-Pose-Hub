import fs from 'node:fs';
export const SUPPORT_POSE='support';
export async function installSupport(page,data,{sourceId=data?.sourceId}={}){
 await page.addScriptTag({content:fs.readFileSync(new URL('./support-runtime.js',import.meta.url),'utf8')});
 return page.evaluate(({data,sourceId})=>{const x=window.__installFixedSupport(data,{sourceId});return {pose:x.pose,sourceId:x.sourceId};},{data,sourceId});
}
