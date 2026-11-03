// M3（s-pigeon 方案 A + C 类小穿透）：给各动作写 -gc1/-gc2 修订 spec（JSON 字面量），原 spec 不动。
//   node tools/ground-contact-r1/m3-fix.mjs <actionId> [<actionId>...]
// 已有 -gcN 的动作写 -gc(N+1)，其他写 -gc1。参数都由 probe.mjs 标定（见 README M3 一节）。
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const R='catalog/production/remaining219-r1/recipes';
const r6=x=>+x.toFixed(6);
// 跪地后脚（free world 踝 y、跖屈 rot[x]）：踝抬 dy、跖屈改 dp°
const freeFoot=(sides,dy,dp)=>s=>{for(const k of sides){const f=s.pose.base.feet[k];f.ankle[1]=r6(f.ankle[1]+dy);f.rot[0][1]=r6(f.rot[0][1]+dp);}};
const midY=(limbs,dy)=>s=>{for(const c of s.pose.base.constraints)if(c.type==='mid'&&limbs.includes(c.limb))c.at[1]=r6(c.at[1]+dy);};
// 臀下垫块：z 后移 3 cm、顶面 65→58 mm（probe-profile：足迹内身体最低 60.1 mm，不再压右大腿）
const PIGEON_SEAT={at:[-0.085,0.058,-0.08],size:[0.21,0.26,0.058]};
export const FIX={
  // 跪姿腕部摇摆：双膝 mid 约束 y 0.0407 → 0.0437（probe：膝 −5.0…+4.4 → −2.7…+6.6；摇摆中膝高本就起伏 9 mm，无法同时 ≤3 mm 且峰值 ≤5 mm）
  'forearms-A':{d:midY(['leftLeg','rightLeg'],0.003),note:'双膝 mid 约束 y +3 mm'},
  // 前臂侧平板：左肘 mid 约束 y 0.042 → 0.052（probe：肘 −7.1→+0.2、前臂 −6.8→−1.2，手 −1.8 原样）
  'hip-abductors-A':{d:midY(['leftArm'],0.010),note:'左肘 mid 约束 y +10 mm'},
  // 双脚 free world 踝 y 0.0370、跖屈 161.8°：小腿/脚背 −10.8/−8.6（probe：+11 mm/−3° → 小腿 −1.0、脚背 +2.4；膝 22→23 本不着地）
  'h-kneeling-instep-stretch':{d:freeFoot(['left','right'],0.011,-3),note:'双脚踝 +11 mm、跖屈 −3°'},
  // 方案 A：双手+立砖外移到两髋外侧（左 x 0.33/z −0.02 避开前脚尖，右 x −0.35/z −0.04 避开前腿膝/小腿，见 probe-profile），手高不变（砖面 +1 mm）；
  // 骨盆 +45 mm（前膝 −17.9→−2.8）；后脚 floor→free world（踝 [0.12,0.0505,−0.80]、跖屈 154.8°，同 n-half-split 的跪地后脚做法）；臀下垫块见 PIGEON_SEAT
  's-pigeon':{d:s=>{const b=s.pose.base,H=b.hands;b.pelvis[1]=r6(b.pelvis[1]+0.045);
      H.left.palmAt[0]=0.33;H.left.palmAt[2]=-0.02;H.right.palmAt[0]=-0.35;H.right.palmAt[2]=-0.04;H.left.pole=[0.75,0.3,-0.4];H.right.pole=[-0.75,0.3,-0.4];
      const o=b.feet.left;b.feet.left={mode:'free',frame:'world',ankle:[0.12,0.0505,-0.80],rot:[[[1,0,0],154.8]],pole:o.pole,thighTwist:o.thighTwist};
      s.props[1].at=[0.33,0.255,-0.02];s.props[2].at=[-0.35,0.255,-0.04];if(PIGEON_SEAT)Object.assign(s.props[3],PIGEON_SEAT);},
    note:'方案 A：双手+立砖外移到两髋外侧（左 x 0.33/z −0.02、右 x −0.35/z −0.04）；骨盆 +45 mm；后脚改 free（踝 y 0.0505、z −0.80、跖屈 154.8°）；臀下垫块重排'},
  // 后脚与 n-half-split 原值完全相同（踝 y 0.0405、跖屈 157.8°、同一膝 mid 约束），用 M2 同一改法
  's-kneel-hipflex':{d:freeFoot(['left'],0.011,-3),note:'后脚踝 +11 mm、跖屈 −3°（同 n-half-split-gc1）'},
};
export async function build(id){
  const rp=path.join(R,id+'.json'),rec=JSON.parse(fs.readFileSync(rp,'utf8'));
  const src=rec.spec,m=src.match(/-gc(\d)\.js$/),nid=path.basename(src,'.js').replace(/-gc\d$/,'')+'-gc'+(m?+m[1]+1:1);
  const spec=structuredClone((await import(pathToFileURL(path.resolve(src))+'?'+Date.now())).default);
  const f=FIX[id];f.d(spec);spec.id=nid;
  const dst=path.join(path.dirname(src),nid+'.js');
  fs.writeFileSync(dst,`// ${nid}: ground-contact fix r1·M3 (2026-11-04) of ${path.basename(src)}. ${f.note}\nexport default ${JSON.stringify(spec,null,2)};\n`);
  return {id,src,dst,note:f.note};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname))
  for(const id of process.argv.slice(2))console.log(JSON.stringify(await build(id)));
