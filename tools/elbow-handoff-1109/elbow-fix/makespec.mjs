// node makespec.mjs id  -> writes new spec + updates recipe from res.jsonl choice (accepted sides only); prints commit message.
import fs from 'node:fs';import crypto from 'node:crypto';
const R='/workspace/work/elbow-scan-wt/',H='/workspace/work/elbow-fix/';
const id=process.argv[2];const acceptSides=(process.argv[3]||'').split(',').filter(Boolean);
const CH=JSON.parse(fs.readFileSync(H+'choice.json','utf8'))[id];const rec={choice:{},base:{}};for(const [s,y] of Object.entries(CH.sides))if(y.status==='full'||y.status==='partial'){rec.choice[s]=y.best;rec.base[s]=y.base;}
const meta=JSON.parse(fs.readFileSync(H+'meta.json','utf8'))[id]||{};
const rf=JSON.parse(fs.readFileSync(H+'recipes.json','utf8'))[id];const recipe=JSON.parse(fs.readFileSync(rf,'utf8'));
if(recipe.elbowTwistFix)throw Error('already fixed '+id);const from=recipe.spec;const bn=from.split('/').pop().replace(/\.js$/,'');
let n=Math.max(1,...[...bn.matchAll(/-r(\d+)/g)].map(m=>+m[1]))+1;while(fs.existsSync(R+`drill-anim/specs/${id}-r${n}.js`))n++;
const nid=`${id}-r${n}`;
const sides=acceptSides.length?acceptSides:Object.keys(rec.choice).filter(s=>rec.choice[s]);
const zh={left:'左',right:'右'};
const lines=sides.map(s=>{const c=rec.choice[s],b=rec.base[s],m=c.m;return {s,c,b,m};});
const {pathToFileURL}=await import('node:url');const BS=(await import(pathToFileURL(R+from).href)).default;
const lab=(v,side)=>{if(!v)return '';const [x,y,z]=v;const L=[[y,'朝头','朝脚'],[z,'朝前','朝后'],[side==='left'?x:-x,'朝外','朝内']].map(([c,p,n])=>[Math.abs(c),c>0?p:n]).sort((a,b)=>b[0]-a[0]);
  return '肘窝'+L[0][1]+(L[1][0]>0.35?'偏'+L[1][1].slice(1):'');};
const pitTxt=s=>{const c=rec.choice[s];const U=(BS.pose.base.hands[s].upperArmTwist??0)+c.p.a;const L0=(meta.pit?.[s]||lab(c.m.pitT,s));return (L0?L0+'，':'')+`上臂轴向总旋 ${U}°`;};
const hdr=[`// ${nid} (elbow-twist-r1, 2026-11-08, global elbow scan): the elbow skin pinched into a thin "candy-wrapper" neck because the`,
`// forearm was rolled against an unrotated upper arm. Fix: roll the humerus at the shoulder (upperArmTwist) so the elbow pit takes`,
`// an anatomical direction and the elbow stays a near-pure hinge; elbowTwist/twistShare keep the rest of the forearm/hand roll.`,
`// Change per side = upperArmTwist +a, elbowTwist +b, and a fraction c of any time-varying (delta-driven) elbowTwist moved to the shoulder.`,
...lines.map(({s,c,b,m})=>`// ${s}: a=${c.p.a} b=${c.p.b} c=${c.p.c}; elbow min width ratio ${b.ratio.toFixed(2)} -> ${m.ratio.toFixed(2)}, cross-elbow twist max ${b.twMax.toFixed(0)} -> ${m.twMax.toFixed(0)} deg, hand-vs-forearm max ${b.htwMax.toFixed(0)} -> ${m.htwMax.toFixed(0)} deg.`),
`// Measured with tools/pose-fix-1108/elbow-pinch-metric.js (+shoulder/wrist slices, pit, floor/contact proxy). Bone roll only: joint`,
`// positions (drift <= ${Math.max(...lines.map(l=>l.c.drift)).toFixed(2)} mm), palms, poles, timing, camera unchanged.`];
const code=`${hdr.join('\n')}
import base from './${bn}.js';
const s = structuredClone(base);
s.id = '${nid}';
function fixSide(side, a, b, c) {
  const h = s.pose.base.hands[side], U0 = h.upperArmTwist ?? 0, E0 = h.elbowTwist ?? 0;
  for (const d of Object.values(s.pose.deltas || {})) {
    const x = d.hands?.[side]; if (!x) continue;
    if (x.elbowTwist !== undefined) { const ev = x.elbowTwist - E0; x.elbowTwist += b; x.upperArmTwist = (x.upperArmTwist ?? U0) + a + c * ev; }
    else if (x.upperArmTwist !== undefined) x.upperArmTwist += a;
  }
  h.upperArmTwist = U0 + a; h.elbowTwist = E0 + b;
}
${lines.map(({s,c})=>`fixSide('${s}', ${c.p.a}, ${c.p.b}, ${c.p.c});`).join('\n')}
export default s;
`;
const sf=`drill-anim/specs/${nid}.js`;fs.writeFileSync(R+sf,code);
const sha=crypto.createHash('sha256').update(code.replace(/\r\n/g,'\n')).digest('hex');
const ratioTxt=lines.map(({s,b,m})=>`${zh[s]} ${b.ratio.toFixed(2)}→${m.ratio.toFixed(2)}`).join('/');
const twTxt=lines.map(({s,b,m})=>`${zh[s]} ${b.twMax.toFixed(0)}°→${m.twMax.toFixed(0)}°`).join('/');
const parTxt=lines.map(({s,c})=>`${zh[s]} upperArmTwist ${c.p.a>=0?'+':''}${c.p.a}、elbowTwist ${c.p.b>=0?'+':''}${c.p.b}${c.p.c?`、时变扭转 ${c.p.c*100}% 移到肩部`:''}${pitTxt(s)?`（${pitTxt(s)}）`:''}`).join('；');
const why=`2026-11-08 全局肘部扫描：前臂相对未转动的上臂滚转，肘部皮肤拧成糖纸状 -> 改在肩部转上臂（${parTxt}），肘保持近纯铰链；肘部最小截面比 ${ratioTxt}，跨肘扭转 ${twTxt}；关节位置漂移 ≤${Math.max(...lines.map(l=>l.c.drift)).toFixed(1)} mm，求解警告不增，地面/贴身接触代理指标不变差`;
const txt=fs.readFileSync(rf,'utf8');
let T=txt;const esc=x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
T=T.replace(new RegExp('"spec": "'+esc(from)+'"'),'"spec": "'+sf+'"');T=T.replace(new RegExp('"specSha256Lf": "'+recipe.specSha256Lf+'"'),'"specSha256Lf": "'+sha+'"');
if(recipe.source?.selectedSpec===from)T=T.replace(new RegExp('"selectedSpec": "'+esc(from)+'"'),'"selectedSpec": "'+sf+'"');
const ind=/\n( +)"/.exec(txt)[1];const blk={branch:'codex/elbow-twist-r1',date:'2026-11-08',from,to:sf,why,reviewed:false,qaStatus:'candidate-awaiting-gpu-and-user-review',elbowTwistFix:'r1'};
const body=JSON.stringify(blk,null,ind.length).split('\n').map((l,i)=>i?ind+l:l).join('\n');
const k=T.lastIndexOf('}');T=T.slice(0,k).replace(/\s*$/,'')+',\n'+ind+'"elbowTwistFix": '+body+'\n}'+T.slice(k+1);
const chk=JSON.parse(T);if(chk.spec!==sf||chk.specSha256Lf!==sha)throw Error('recipe edit failed');fs.writeFileSync(rf,T);
const msg=`fix(elbow-twist r1): ${nid} ${recipe.nameZh} — 肘部糖纸状收窄修复：${parTxt}；肘部最小截面比 ${ratioTxt}，跨肘扭转 ${twTxt}；关节漂移 ≤${Math.max(...lines.map(l=>l.c.drift)).toFixed(1)} mm，求解警告不增；配方指向 -r${n}，reviewed=false`;
fs.writeFileSync(H+'msg.txt',msg);console.log(sf);console.log(msg);
