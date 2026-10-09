// Cloth-vs-skin audit over the flare loop (v41).
//   node tools/cloth/cloth-audit.mjs [--glb path] [--frames 36] [--json out.json] [--dump t]
// Pairs: every skin vertex (Coach_Body, Coach_Face) that is covered by cloth at rest (inside the
// cloth, nearest cloth vertex within COVER). Each frame (raw loop time 0..9, the default playback):
//   poke  = the skin vertex is now outside its nearest cloth surface by > POKE (skin shows through);
//   gap   = for cloth open-edge vertices (collar, cuffs, hems, shoe collars) the distance to the
//           nearest skin grew by > GAP vs rest (the opening lifts off and the inside shows).
import {loadCoach,posed,vertexNormals,boundary,Grid} from './cloth-lib.mjs';
import fs from 'node:fs';
const arg=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d;};
const COVER=.05,POKE=.001,GAP=+arg('gap',.01),FR=+arg('frames',36);
const {motion,meshes,seq}=await loadCoach(arg('glb'));
const SK=/^Coach_(Body|Face)$/,CL=/^Coach_(Training_Tee|Training_Shorts|Sneakers|Soles|Shoe_Details)$/;
const skin=meshes.filter(m=>SK.test(m.userData.coach)),cloth=meshes.filter(m=>CL.test(m.userData.coach));
const cat=(ms,f)=>{const parts=ms.map(f),n=parts.reduce((a,p)=>a+p.length,0),o=new Float32Array(n);let k=0;for(const p of parts){o.set(p,k);k+=p.length;}return o;};
const region=(name,y,edge)=>/Tee/.test(name)?(y>1.30?'collar/neck':y>1.0?'sleeve/shoulder':'tee hem'):/Shorts/.test(name)?(y>.85?'shorts waist':'shorts leg'):'shoe';
const clothName=[];for(const m of cloth)for(let i=0;i<m.geometry.attributes.position.count;i++)clothName.push(m.userData.coach);
const edgeMask=cat(cloth,m=>Float32Array.from(boundary(m,posed(m))));
const frame=()=>{const SP=cat(skin,m=>posed(m)),CP=cat(cloth,m=>posed(m));let k=0;const CN=new Float32Array(CP.length);for(const m of cloth){const n=m.geometry.attributes.position.count;CN.set(vertexNormals(m,CP.subarray(k*3,(k+n)*3)),k*3);k+=n;}return {SP,CP,CN};};
const side=(F,i,q)=>(F.SP[i*3]-F.CP[q*3])*F.CN[q*3]+(F.SP[i*3+1]-F.CP[q*3+1])*F.CN[q*3+1]+(F.SP[i*3+2]-F.CP[q*3+2])*F.CN[q*3+2];
motion.reset();const R0=frame();const cg=new Grid(R0.CP,.02),sg=new Grid(R0.SP,.02);
const pairs=[];for(let i=0;i<R0.SP.length/3;i++){const nn=cg.knn(R0.SP[i*3],R0.SP[i*3+1],R0.SP[i*3+2],1,3);if(!nn.length||nn[0][1]>COVER)continue;if(side(R0,i,nn[0][0])<0)pairs.push([i,nn[0][0]]);}
const edges=[];for(let q=0;q<edgeMask.length;q++)if(edgeMask[q]){const nn=sg.knn(R0.CP[q*3],R0.CP[q*3+1],R0.CP[q*3+2],1,2);if(nn.length&&nn[0][1]<.03)edges.push([q,nn[0][1]]);}
motion.setSequence(seq.steps,{period:9});
const stat={},worst=[],dump=[];
for(let f=0;f<FR;f++){const t=f*9/FR;motion.update(t);motion.group.updateMatrixWorld(true);const F=frame();const g=new Grid(F.CP,.02),gs=new Grid(F.SP,.02);
  for(const [i] of pairs){const nn=g.knn(F.SP[i*3],F.SP[i*3+1],F.SP[i*3+2],1,2);if(!nn.length)continue;const q=nn[0][0],h=side(F,i,q);
    if(h>POKE&&nn[0][1]<.02){const r=region(clothName[q],R0.CP[q*3+1]);const s=stat[r]??={poke:0,maxPoke:0,gap:0,maxGap:0,ft:new Set()};s.poke++;s.maxPoke=Math.max(s.maxPoke,h);s.ft.add(+t.toFixed(2));worst.push([h,'poke '+r,t]);if(arg('dump')&&Math.abs(t-+arg('dump'))<1e-6)dump.push([...R0.SP.slice(i*3,i*3+3),h*1000,clothName[q]]);}}
  for(const [q,d0] of edges){const nn=gs.knn(F.CP[q*3],F.CP[q*3+1],F.CP[q*3+2],1,3);const d=nn.length?nn[0][1]:.08;
    if(d-d0>GAP){const r=region(clothName[q],R0.CP[q*3+1]);const s=stat[r]??={poke:0,maxPoke:0,gap:0,maxGap:0,ft:new Set()};s.gap++;s.maxGap=Math.max(s.maxGap,d-d0);s.ft.add(+t.toFixed(2));worst.push([d-d0,'gap '+r,t]);}}}
const tab=Object.fromEntries(Object.entries(stat).map(([k,s])=>[k,{pokeVF:s.poke,maxPoke_mm:+(s.maxPoke*1000).toFixed(1),gapVF:s.gap,maxGap_mm:+(s.maxGap*1000).toFixed(1),frames:[...s.ft].sort((a,b)=>a-b).join(' ').slice(0,90)}]));
console.log(`pairs ${pairs.length} covered skin verts, ${edges.length} cloth edge verts on skin, ${FR} frames`);console.table(tab);
worst.sort((a,b)=>b[0]-a[0]);console.log('worst',worst.slice(0,8).map(w=>`${(w[0]*1000).toFixed(1)}mm ${w[1]} t${w[2].toFixed(2)}`).join(' | '));
if(arg('json'))fs.writeFileSync(arg('json'),JSON.stringify(tab,null,1));
if(dump.length)console.log('dump',JSON.stringify(dump.slice(0,30).map(p=>[...p].map(x=>typeof x==="number"?+x.toFixed(3):x))));
