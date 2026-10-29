// Check the original straight-limb requirements, including timeline conditions.
// This is a scoped joint-angle audit, not the legacy capsule or skin-contact QA.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import crypto from 'node:crypto';
const root='F:/PoseHub-v2-production/template-finalization-20261029';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const window={};vm.runInNewContext(fs.readFileSync(new URL('../../drill-anim/page/engine.js',import.meta.url),'utf8'),{window});
const rows=[];
for(const action of read(path.join(root,'status.json')).actions){
 if(!action.capture)continue;
 const folder=path.dirname(action.capture),cap=read(action.capture),spec=read(path.join(folder,'effective-spec.snapshot.json'));
 if(cap.recipeSha256!==sha(cap.recipeFile))continue;
 const checks=[];
 for(const rule of spec.qa?.straight??[]){
  const values=[];
  for(const row of cap.metrics){
   if(rule.when&&rule.when!=='always'){
    const m=/^params\.(\w+)\s*([<>])\s*([\d.]+)$/.exec(rule.when);
    if(!m)throw Error('Unsupported condition '+rule.when);
    const p=window.__drill.sample(spec.timeline,row.time)[m[1]]??0;
    if(!(m[2]==='<'?p<+m[3]:p>+m[3]))continue;
   }
   const [kind,side]=rule.j.split('.');
   if(!['elbow','knee'].includes(kind))throw Error('Unsupported angle '+rule.j);
   const parts=kind==='elbow'?['Shoulder','Elbow','Wrist']:['Hip','Knee','Ankle'];
   const [a,b,c]=parts.map(k=>row.joints[side+k]),u=a.map((x,i)=>x-b[i]),v=c.map((x,i)=>x-b[i]);
   const cosine=u.reduce((s,x,i)=>s+x*v[i],0)/(Math.hypot(...u)*Math.hypot(...v));
   values.push({frame:row.frame,degrees:Math.acos(Math.max(-1,Math.min(1,cosine)))*180/Math.PI});
  }
  const worst=values.reduce((a,b)=>!a||b.degrees<a.degrees?b:a,null);
  checks.push({rule,frames:values.length,worst,pass:!!worst&&worst.degrees>=(rule.min??172)-1e-8});
 }
 rows.push({id:action.id,capture:action.capture,captureSha256:sha(action.capture),checks,pass:checks.every(c=>c.pass)});
}
const result={format:'pose-hub-original-straight-audit@1',scope:'Stored source joint angles with original timeline conditions and thresholds; not full legacy QA',rows,pass:rows.length===32&&rows.every(r=>r.pass)};
fs.writeFileSync(path.join(root,'qa/source-straight-current.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({captures:rows.length,checks:rows.reduce((s,r)=>s+r.checks.length,0),failures:rows.filter(r=>!r.pass),pass:result.pass}));
