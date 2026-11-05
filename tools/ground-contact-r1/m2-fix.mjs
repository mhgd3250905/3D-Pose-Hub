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
// 跪地后腿（free world 踝 y 0.0405、跖屈 157.8°）脚背/小腿 −5.6/−10.3：踝 +11 mm、跖屈 −3°（probe：小腿 −0.4、脚背 +1.1、膝 +3.3）
const backFoot=s=>{const f=s.pose.base.feet.left;f.ankle[1]=r6(f.ankle[1]+0.011);f.rot[0][1]=r6(f.rot[0][1]-3);};
const palmY=(d,sides=['left','right'])=>s=>{for(const k of sides){const h=s.pose.base.hands[k];h.palmAt[1]=r6(h.palmAt[1]+d);}};
// 'floor' 模式的落点高度由共享运行时 getGroundHandPose 决定（只改 spec 无法抬高），改成同 x/z、掌心朝下的
// 'fingertips' 模式（r2 系列 catcow/glute-max-A 已用此做法），clear 由 probe 标定到手掌最低皮肤 ≈ +1 mm。
const floor2tips=(side,c)=>s=>{const h=s.pose.base.hands[side];s.pose.base.hands[side]={mode:'fingertips',floor:0,clear:c,at:h.at,finger:[h.finger[0],0,h.finger[1]],normal:[0,-1,0],poleUp:h.poleUp,relax:0};};
export const FIX={
  'deltoids-B':{d:floor2tips('left',0.0253),note:'左支撑手 floor→fingertips（同 x/z），clear 25.3 mm：手 −18.3→≈+1 mm，左肘随之离开地面下'},
  'adductors-B':{d:floor2tips('left',0.0253),note:'左支撑手 floor→fingertips（同 x/z），clear 25.3 mm：手 −18.3→≈+1 mm'},
  // 静止段：同 h-quadruped-open-gc2 的四足基座（骨盆 0.4388、髋俯仰 7.778°）；穿针段：胸 body 俯仰峰值 2.965°→−21.035°（−24°，
  // 与腰扭 55° 同步、同 smooth 关键帧），让左肩随转体下沉、不再超出锁定左手的臂长，引擎不再把躯干/骨盆压低 ~6 cm。
  'h-kneeling-thread-needle':{d:s=>{fingertips(0.0084)(s);const b=s.pose.base;b.pelvis[1]=0.4388;b.hips.rot[0][1]=7.778;
    const k=2.96474;s.timeline.tracks.k0=[[0,k,'smooth'],[1,k,'smooth'],[3,r6(k-24),'smooth'],[5,r6(k-24),'smooth'],[7,k,'smooth'],[8,k,'smooth']];},
    note:'双手 clear +8.4 mm；四足基座骨盆 0.3842→0.4388、髋俯仰 12.778→7.778°；穿针段胸俯仰峰值 −24°（时间点不变）'},
  'h-quadruped-rockback':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  'h-kneeling-pushup':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  // 抬手后引擎把整个身体顶高 8.4 mm（膝悬空 7.4），骨盆同步 −8.4 mm 抵消
  'h-quadruped-open':{d:s=>{fingertips(0.0084)(s);s.pose.base.pelvis[1]=r6(s.pose.base.pelvis[1]-0.0084);},note:'双手 clear +8.4 mm，骨盆 −8.4 mm（抵消整体被顶高）'},
  'h-supine-bilateral-leg-raise':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  'h-supine-heel-slide':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  'h-catcow-quad':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  'glute-max-A':{d:fingertips(0.0084),note:'双手 clear +8.4 mm'},
  's-frog':{d:palmY(0.0138),note:'双手 palmAt y +13.8 mm'},
  'n-half-split':{d:s=>{palmY(0.0266)(s);backFoot(s);},note:'双手 palmAt y +26.6 mm（砖面）；后脚踝 +11 mm、跖屈 −3°'},
  'n-straddle-fold':{d:palmY(0.0259),note:'双手 palmAt y +25.9 mm（砖面）'},
  's-lizard':{d:s=>{palmY(0.0247)(s);backFoot(s);},note:'双手 palmAt y +24.7 mm（砖面）；后脚踝 +11 mm、跖屈 −3°'},
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
