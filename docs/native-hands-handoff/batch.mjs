// Native-hand r3 batch: generate revision specs for free-hand actions, analytic (no-render) checks, design notes.
// usage: node batch.mjs <repo> <list.txt: "CAT spec.js" per line> <out.json>   (writes specs + registry; run verify separately)
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
const [repo,listF,outF]=process.argv.slice(2);const da=path.join(repo,'drill-anim'),specs=path.join(da,'specs');
const {REST}=await import(pathToFileURL(path.join(da,'lib/ss-geo.mjs')).href);
const {checkSpec}=await import(pathToFileURL(path.join(da,'models/native-open-r1/loader.mjs')).href);
const cat=Object.fromEntries(JSON.parse(fs.readFileSync(path.join(repo,'catalog/catalog.json'),'utf8')).drills.map(d=>[d.id,d]));
const ease={cos:u=>(1-Math.cos(Math.PI*Math.min(1,Math.max(0,u))))/2,linear:u=>Math.min(1,Math.max(0,u)),hold:()=>0,smooth:u=>{u=Math.min(1,Math.max(0,u));return u*u*u*(u*(u*6-15)+10)}};
const sample=(tl,t)=>{const o={};for(const[k,ks]of Object.entries(tl.tracks||{})){let v=ks[0][1];for(let i=0;i<ks.length;i++){const[ta,va]=ks[i],nx=ks[i+1]||[tl.duration,ks[0][1]],[tb,vb]=nx;if(t>=ta&&t<tb){const e=ease[nx[2]||ks[i][2]||'cos']||ease.cos;v=va+(vb-va)*e((t-ta)/Math.max(tb-ta,1e-6));break}if(t>=tb)v=vb}o[k]=v}return o};
const blend=(base,deltas,params)=>{const walk=(b,ds)=>{if(typeof b==='number'){let v=b;for(const[d,p]of ds)if(typeof d==='number')v+=p*(d-b);return v}if(Array.isArray(b))return b.map((x,i)=>walk(x,ds.map(([d,p])=>[Array.isArray(d)?d[i]:undefined,p]).filter(z=>z[0]!==undefined)));if(b&&typeof b==='object'){const o={};for(const k of Object.keys(b))o[k]=walk(b[k],ds.filter(([d])=>d&&typeof d==='object'&&k in d).map(([d,p])=>[d[k],p]));return o}return b};return walk(base,Object.entries(deltas||{}).filter(([k])=>params[k]).map(([k,d])=>[d,params[k]]))};
const sub=(a,b)=>a.map((x,i)=>x-b[i]),nrm=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l)},ang=(a,b)=>Math.acos(Math.max(-1,Math.min(1,nrm(a).reduce((s,x,i)=>s+x*nrm(b)[i],0))))*180/Math.PI;
const OLD=0.2226,NEW=0.1618;
const torsoGap=p=>{const dx=Math.max(0,Math.abs(p[0])-0.17),dy=Math.max(0,0.85-p[1],p[1]-1.5),dz=Math.max(0,Math.abs(p[2])-0.12);return Math.hypot(dx,dy,dz)};
const files=new Set(fs.readdirSync(specs));
const nextName=f=>{const b=f.replace(/\.js$/,''),m=b.match(/^(.*)-(rr?)(\d+)$/);const root=m?m[1]:b,kind=m?m[2]:'r';let n=m?+m[3]+1:2;while(files.has(`${root}-${kind}${n}.js`))n++;return `${root}-${kind}${n}`};
const reg=path.join(da,'data/home-pr-candidates.json'),R=JSON.parse(fs.readFileSync(reg,'utf8'));
const out=[];
for(const line of fs.readFileSync(listF,'utf8').trim().split('\n')){const[c,f]=line.trim().split(/\s+/);const s=(await import(pathToFileURL(path.join(specs,f)).href)).default;
 const r={src:f,id:s.id,cat:c,flags:[],design:[]};const base=s.pose?.base;
 const action=f.replace(/\.js$/,'').replace(/-(rr?)\d+$/,'');
 // exclusions
 const hs=JSON.stringify(base?.hands||{});
 if(/native/.test(s.modelProfile||''))r.exclude='已是新手 profile';
 else if(!base?.hands)r.exclude='无可解析手部描述';
 else if(/"mode":"(floor|fingertips)"|"plant"|"palmAt"|"touch"/.test(hs))r.exclude='手接触/支撑描述';
 else if(/"frame":"world"/.test(hs))r.exclude='手用 world 坐标定位（多为扶器械/地面/身体固定点），无法解析确认不接触';
 else if((s.qa?.allowContact||[]).some(x=>/hand/i.test(x)))r.exclude='QA 允许手接触：'+(s.qa.allowContact.filter(x=>/hand/i.test(x)).join(','));
 else if(Object.values(s.v2plus?.handPose||{}).some(v=>v!=='relaxed'&&v!=='open'))r.exclude='显式接触手型 '+JSON.stringify(s.v2plus.handPose);
 else if((s.props||[]).some(p=>p.attach&&/Hand/.test(p.attach)))r.exclude='手持道具';
 // analytic check (rest-frame coords; chest/hips frames)
 const dur=s.timeline.duration,N=24;let maxBend=0,minGapOld=9,minGapNew=9;
 if(!r.exclude)for(let i=0;i<N;i++){const t=dur*i/N,D=blend(base,s.pose.deltas,sample(s.timeline,t));
  for(const side of['left','right']){const H=D.hands[side];if(!H?.wrist||!H.finger)continue;const S=REST.shoulder(side);
   const arm=sub(H.wrist,S);if(Math.hypot(...arm)>0.45)maxBend=Math.max(maxBend,ang(arm,H.finger));
   const fd=nrm(H.finger),tip=L=>H.wrist.map((x,k)=>x+fd[k]*L);
   if(H.frame!=='hips'){minGapOld=Math.min(minGapOld,torsoGap(tip(OLD)));minGapNew=Math.min(minGapNew,torsoGap(tip(NEW)))}}}
 r.maxWristBendDeg=+maxBend.toFixed(1);r.minTorsoGapOld_mm=Math.round(minGapOld*1000);r.minTorsoGapNew_mm=Math.round(minGapNew*1000);r.tipShift_mm=61;
 if(!r.exclude){if(maxBend>30)r.flags.push(`直臂时手指与前臂夹角最大 ${r.maxWristBendDeg}°（>30°，可能折腕，需近景；未自动改手指）`);
  if(minGapOld<0.03)r.flags.push(`旧手指尖距躯干近似 ${r.minTorsoGapOld_mm}mm，新手缩短后 ${r.minTorsoGapNew_mm}mm（原设计可能有贴身意图）`);
  if(/a-/.test(action.slice(0,2)))r.flags.push('a-* 自测静图集');}
 // design notes (record only)
 for(const side of['left','right']){const F=base?.feet?.[side];if(F?.mode==='floor'&&F.poleLow&&typeof F.heading==='number'){const pa=Math.atan2(F.poleLow[0],F.poleLow[2])*180/Math.PI;const d=Math.abs(Math.abs(pa)-Math.abs(F.heading));if(d>10)r.design.push(`${side} 膝提示外展 ${Math.abs(pa).toFixed(0)}° vs 脚尖 ${Math.abs(F.heading)}°（差 ${d.toFixed(0)}°，膝脚可能不同向）`)}}
 const cd=cat[action];const rh=cd?.rhythm;
 if(rh?.phases){const per=rh.phases.reduce((a,p)=>a+p.seconds,0);r.rhythm=`catalog ${rh.kind} 每次 ${per.toFixed(2)}s（${rh.phases.map(p=>p.id+p.seconds).join('/')}）；spec 循环 ${dur}s`;const k=dur/per;if(Math.abs(k-Math.round(k))>0.15)r.design.push(`节奏：spec ${dur}s 不是 catalog 每次 ${per.toFixed(2)}s 的整数倍（${k.toFixed(2)}）`);}
 else if(!cd)r.design.push('不在 catalog 0.3.0，无教学语义可对照');else r.design.push('catalog 无 rhythm');
 if(s.qa?.straight)for(const q of s.qa.straight)if(q.min<150)r.design.push(`QA 直臂/直腿阈值偏低 ${q.j}≥${q.min}`);
 // generate
 if(!r.exclude){const nn=nextName(f);files.add(nn+'.js');const src=`// ${nn}: ${s.id} on the native hand r3 model via native-open-r1 (free hands, no contact).\n// Generated by docs/native-hands-handoff/batch.mjs. Motion, hand targets, feet, timing, highlight and camera unchanged; only the explicit hand model changes.\n// Candidate: not rendered, not reviewed, not release-eligible.\nimport previous from './${f}';\nconst s = structuredClone(previous);\ns.id = '${nn}';\ns.modelProfile = 'training-human-v2plus-hands-native';\ns.nativeHands = { version: '1.0.0-r3' };\nexport default s;\n`;
  fs.writeFileSync(path.join(specs,nn+'.js'),src);const chk=(await import(pathToFileURL(path.join(specs,nn+'.js')).href)).default;checkSpec(chk);
  R.specs[nn+'.js']={sourceCommit:null,sha256:crypto.createHash('sha256').update(src).digest('hex'),review:`Native hand r3 batch1 candidate from ${f} via native-open-r1. Only modelProfile/nativeHands change; motion and free-hand targets identical. Analytic no-render check: max straight-arm finger/forearm angle ${r.maxWristBendDeg} deg, min fingertip-torso proxy gap ${r.minTorsoGapNew_mm} mm. Not rendered; user visual acceptance pending; release not approved.`,baselineCommit:'1fdd117d8e29bb0efcc8c57cb23dc1d9dc7422dd'};const tt=Object.entries(chk.timeline.tracks||{}).filter(([k,ks])=>ks.at(-1)[0]===chk.timeline.duration).map(([k])=>k);if(tt.length)R.specs[nn+'.js'].terminalTracks=tt;r.out=nn+'.js'}
 out.push(r)}
fs.writeFileSync(reg,JSON.stringify(R,null,2)+'\n');fs.writeFileSync(outF,JSON.stringify(out,null,1));
console.log('generated',out.filter(r=>r.out).length,'excluded',out.filter(r=>r.exclude).length);
