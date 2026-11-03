// M2 (B 类手掌陷地/陷砖)：给各动作写 -gc1/-gc2 修订 spec（JSON 字面量），只改手的支撑高度（及个别道具/脚）。
//   node tools/ground-contact-r1/m2-fix.mjs <actionId> [<actionId>...]
// 已有 M1 -gc1 的动作写 -gc2（gc1 保留作历史），其他写 -gc1。原 spec 不动。
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const R='catalog/production/remaining219-r1/recipes';
const r6=x=>+x.toFixed(6);
// 每个 hand 对象（含 plant/free 内层）
function eachHand(spec,cb){const visit=h=>{if(!h||typeof h!=='object')return;cb(h);if(h.plant)visit(h.plant);};
  for(const s of ['left','right'])visit(spec.pose.base.hands[s]);}
const fingertips=d=>s=>eachHand(s,h=>{if(h.mode==='fingertips')h.clear=r6(h.clear+d);});
const palmY=(d,sides=['left','right'])=>s=>{for(const k of sides){const h=s.pose.base.hands[k];h.palmAt[1]=r6(h.palmAt[1]+d);}};
export const FIX={
  'h-kneeling-thread-needle':{d:fingertips(0.0084),note:'双手 fingertips clear +8.4 mm（手掌最低皮肤 −7.4→≈+1 mm）'},
  'h-quadruped-rockback':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  'h-kneeling-pushup':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  // 抬手后引擎把整个身体顶高 8.4 mm（膝悬空 7.4），骨盆同步 −8.4 mm 抵消
  'h-quadruped-open':{d:s=>{fingertips(0.0084)(s);s.pose.base.pelvis[1]=r6(s.pose.base.pelvis[1]-0.0084);},note:'双手 clear +8.4 mm，骨盆 −8.4 mm（抵消整体被顶高）'},
  'h-supine-bilateral-leg-raise':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  'h-supine-heel-slide':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  'h-catcow-quad':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  'glute-max-A':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  's-frog':{d:palmY(0.0138),note:'双手 palmAt y +13.8 mm'},
  'n-half-split':{d:palmY(0.0266),note:'双手 palmAt y +26.6 mm（砖面）'},
  'n-straddle-fold':{d:palmY(0.0259),note:'双手 palmAt y +25.9 mm（砖面）'},
  's-lizard':{d:palmY(0.0247),note:'双手 palmAt y +24.7 mm（砖面）'},
  's-pigeon':{d:palmY(0.0253),note:'双手 palmAt y +25.3 mm（砖面）'},
  // 手撑段：手腕 y 轨迹在 4.0–5.5 s 贴地平台 0.0425；按离平台高度渐隐地抬 7.8 mm（离地 5 cm 以上不变）
  'h-floor-nordic-hand-reset':{d:s=>{for(const k of ['k5','k8'])for(const p of s.timeline.tracks[k]){const w=Math.max(0,Math.min(1,1-(p[1]-0.0425)/0.05));p[1]=r6(p[1]+0.0078*w);}},note:'手撑段双手腕 y +7.8 mm（离地 5 cm 内渐隐）'},
};
export async function build(id,extra){
  const rp=path.join(R,id+'.json'),rec=JSON.parse(fs.readFileSync(rp,'utf8'));
  const src=rec.spec,m=src.match(/-gc(\d)\.js$/),nid=path.basename(src,'.js').replace(/-gc\d$/,'')+'-gc'+(m?+m[1]+1:1);
  const spec=structuredClone((await import(pathToFileURL(path.resolve(src))+'?'+Date.now())).default);
  const f=FIX[id];f.d(spec);if(extra)extra(spec);spec.id=nid;
  const dst=path.join(path.dirname(src),nid+'.js');
  fs.writeFileSync(dst,`// ${nid}: ground-contact fix r1·M2 (2026-11-04) of ${path.basename(src)}. ${f.note}\nexport default ${JSON.stringify(spec,null,2)};\n`);
  return {id,src,dst,note:f.note};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))
  for(const id of process.argv.slice(2))console.log(JSON.stringify(await build(id)));
