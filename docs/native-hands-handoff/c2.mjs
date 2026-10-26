import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const dir='./drill-anim/specs';const R=[];
const GRIP=/^(gripHand|grip|dHandle|landmine|kbBottomsUp|pullupBar|rings|parallettes|dipBars)$/;
for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.js')).sort()){const s=(await import(pathToFileURL(path.join(dir,f)).href)).default;
 const js=JSON.stringify(s,(k,v)=>typeof v==='function'?'fn':v);
 const hs=JSON.stringify([s.pose?.base?.hands,...Object.values(s.pose?.deltas||{}).map(d=>d?.hands)],(k,v)=>typeof v==='function'?'fn':v);
 const props=(s.props||[]);
 const grip=props.some(p=>GRIP.test(p.type)||(p.attach&&/Hand/.test(p.attach))),band=props.some(p=>/band|cable/i.test(p.type));
 const floor=/"mode":"floor"|"plant"/.test(hs);const contact=/"mode":"floor"|"plant"|"palmAt"|"touch"/.test(hs)||!!s.solverArgs?.touch||props.some(p=>p.type==='wall');
 const finger=!!s.v2plus?.handPose||!!s.bakeHands||/"relax":0[,}]/.test(hs);
 const nat=/native/.test(s.modelProfile||'')&&s.modelProfile!=='training-human-v2plus-contact-wrist';
 const cat=grip?'A握持器械':floor?"B1撑地/支撑(floor/plant)":contact?"B2掌心朝向/触碰身体或墙(palmAt/touch)":band?'C弹力带/拉索(自动band-grip)':finger?'D指定手型':'E无特殊手部';
 R.push({file:f.slice(0,-3),id:s.id,mp:s.modelProfile||'(未声明)',nat,cat,hp:s.v2plus?.handPose?1:0,props:[...new Set(props.map(p=>p.type))].join('+')});}
fs.writeFileSync('docs/native-hands-handoff/c2.json',JSON.stringify(R,null,0));
const g=(a,k)=>a.reduce((m,o)=>(m[o[k]]=(m[o[k]]||0)+1,m),{});
console.log('new',R.filter(o=>o.nat).map(o=>o.id+'|'+o.mp));
const old=R.filter(o=>!o.nat);console.log(old.length,g(old,'cat'),g(old,'mp'));
for(const c of Object.keys(g(old,'cat')).sort()){const a=old.filter(o=>o.cat===c);console.log('##',c,a.length);console.log(a.map(o=>o.id+(o.mp==='training-human-v2plus'?'*':'')).join(', '))}
console.log('handPose override',R.filter(o=>o.hp).map(o=>o.id).join(','));
