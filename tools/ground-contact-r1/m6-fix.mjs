// M6（M5 扫查新发现的 2 个穿地）：给各动作写 -gc1 修订 spec（JSON 字面量），原 spec 不动。
//   node tools/ground-contact-r1/m6-fix.mjs <actionId> [<actionId>...]
// 参数由 probe.mjs 标定（/workspace/work/posehub-ground/m6/probe-*.json，见 README M6 一节）。
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const R='catalog/production/remaining219-r1/recipes';
const r6=x=>+(+x).toFixed(6);
// 扶椅后踢腿：右（踢）脚 hips 系踝目标按旧腿长写，armfix-r2 腿更长，静止/回位段脚掌压地。
// 踝 y（hips 系，上）加 D·(1−p^E)，p = kick 进度：静止段抬 D，踢到顶（p=1）不变，故踢腿高度/节奏不变。
const kickLift=(D,E)=>s=>{const t=s.timeline.tracks;t.k1.forEach((x,i)=>{x[1]=r6(+x[1]+D*(1-(+t.kick[i][1])**E));});};
export const FIX={
  'h-chair-kickback':{d:kickLift(0.075,3),note:'右（踢）脚 hips 系踝 y + 75 mm·(1−p³)（静止段抬 75 mm，踢到顶不变）'},
  'o-supported-hip-hitch':{d:s=>{s.pose.base.feet.right.rot[0][1]=33;},note:'右（抬起）脚跖屈 57°→33°（屈膝 60°、踝位置、提髋 6° 不变），脚尖离地 ~1 cm'},
};
export async function build(id){
  const rp=path.join(R,id+'.json'),rec=JSON.parse(fs.readFileSync(rp,'utf8'));
  const src=rec.spec,m=src.match(/-gc(\d)\.js$/),nid=path.basename(src,'.js').replace(/-gc\d$/,'')+'-gc'+(m?+m[1]+1:1);
  const spec=structuredClone((await import(pathToFileURL(path.resolve(src))+'?'+Date.now())).default);
  const f=FIX[id];f.d(spec);spec.id=nid;
  const dst=path.join(path.dirname(src),nid+'.js');
  fs.writeFileSync(dst,`// ${nid}: ground-contact fix r1·M6 (2026-11-04) of ${path.basename(src)}. ${f.note}\nexport default ${JSON.stringify(spec,null,2)};\n`);
  return {id,src,dst,note:f.note};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))
  for(const id of process.argv.slice(2))console.log(JSON.stringify(await build(id)));
