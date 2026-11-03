// M5（M4 新发现的 3 个穿地）：给各动作写 -gc1 修订 spec（JSON 字面量），原 spec 不动。
//   node tools/ground-contact-r1/m5-fix.mjs <actionId> [<actionId>...]
// 参数都由 probe.mjs 标定（/workspace/work/posehub-ground/m5/v/*.json，见 README M5 一节）。
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const R='catalog/production/remaining219-r1/recipes';
const r6=x=>+(+x).toFixed(6),D=Math.PI/180;
// 扶椅劈叉后腿：armfix-r2 实测大腿 0.410 / 小腿 0.417 m（spec 写的是 0.353/0.410，所以后膝被 IK 压到地下）。
// 骨盆 y 整段 +DP；后膝关节中心目标 y = KY0+KY1·p（皮肤在关节下 43→52 mm，随屈膝程度变）；后脚踝 y 0.0515、跖屈 154.8°（同 n-half-split-gc1），
// 后脚踝 z 按真实骨长逐帧重算：膝 z = 髋 z − √(LT²−dx²−(髋y−膝y)²)，踝 z = 膝 z − √(LS²−(膝y−踝y)²)。前脚/右手/左手轨迹不动。
const chairSplit=({DP,KY0,KY1})=>s=>{const LT=.410,LS=.417,AY=.0515,DX=.0095,t=s.timeline.tracks;s.pose.base.feet.left.rot[0][1]=154.8;
  t.k1.forEach(x=>{x[1]=r6(+x[1]+DP);});t.k11.forEach(x=>{x[1]=AY;});
  t.k12.forEach((x,i)=>{const p=+t.split[i][1],a=(25-15*p)*D,hy=Math.cos(a)*-.0475906-Math.sin(a)*-.0045322,hz=Math.sin(a)*-.0475906+Math.cos(a)*-.0045322;
    const Hy=+t.k1[i][1]+hy,Hz=.075+hz,Ky=KY0+KY1*p,Kz=Hz-Math.sqrt(Math.max(LT*LT-DX*DX-(Hy-Ky)**2,0));x[1]=r6(Kz-Math.sqrt(LS*LS-(Ky-AY)**2));});};
const feetBase=(i,d)=>s=>{for(const k of['left','right'])s.pose.base.feet[k].ankle[i]=r6(s.pose.base.feet[k].ankle[i]+d);};
export const FIX={
  'h-chair-progressive-front-split-native':{d:chairSplit({DP:0.053,KY0:0.044,KY1:0.009}),note:'骨盆 +53 mm；后脚踝 y 0.0515、跖屈 154.8°；后脚踝 z 按 armfix-r2 骨长逐帧重算（后膝中心 y 44→53 mm）'},
  't-seated-straddle-lift-1leg':{d:feetBase(1,0.046),note:'双脚 hips 系踝 y 基值 +46 mm（伸直平放腿绕髋上抬约 3°，抬腿段相对幅度不变）'},
  'scapular-A':{d:feetBase(2,-0.024),note:'双脚 hips 系踝 z 基值 −24 mm（俯卧时即世界 y +23 mm，脚背/脚尖与小腿前侧贴地）'},
};
export async function build(id){
  const rp=path.join(R,id+'.json'),rec=JSON.parse(fs.readFileSync(rp,'utf8'));
  const src=rec.spec,m=src.match(/-gc(\d)\.js$/),nid=path.basename(src,'.js').replace(/-gc\d$/,'')+'-gc'+(m?+m[1]+1:1);
  const spec=structuredClone((await import(pathToFileURL(path.resolve(src))+'?'+Date.now())).default);
  const f=FIX[id];f.d(spec);spec.id=nid;
  const dst=path.join(path.dirname(src),nid+'.js');
  fs.writeFileSync(dst,`// ${nid}: ground-contact fix r1·M5 (2026-11-04) of ${path.basename(src)}. ${f.note}\nexport default ${JSON.stringify(spec,null,2)};\n`);
  return {id,src,dst,note:f.note};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))
  for(const id of process.argv.slice(2))console.log(JSON.stringify(await build(id)));
