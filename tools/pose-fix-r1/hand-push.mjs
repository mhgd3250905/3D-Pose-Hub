// Pose fix r1 — self-collision: push each hand target out of the body it sinks into, measured on the NEW model.
//   node tools/pose-fix-r1/hand-push.mjs --id <recipeId> --out <state.json> [--step 0.25] [--iters 3] [--margin 0.004] [--sides left,right]
// Full production scene (recipe-scene.mjs: armfix-r2, hands, corrections, correctives, props). Every <step> s the pose is
// staged and the self-collision measure of tools/self-collision-r1 runs in onAfterRender (CPU-skinned real surface of
// the solved knee/shin/thigh/torso, i.e. the new model's actual limbs, not the v2 ss-geo leg()). For every side, the
// hand/forearm vertices that sit inside another region give a push = mean container normal x (d10 + margin); the push
// is mapped into the hand target's own frame (finite-difference Jacobian of the palm joint w.r.t. an additive palmAt
// offset) and accumulated. Result: per-side offset table [t, dx, dy, dz] (frame units, m) that
// drill-anim/lib/palm-offset-sc1.mjs turns into additive palmAt tracks. Read-only on the repo; resumable per iteration.
import fs from 'node:fs';import path from 'node:path';
import {loadRecipe,openScene,stageAt,freeGiB} from '../action-package-v3/recipe-scene.mjs';
import {allRecipes,measureRegionsInPage} from '../ground-audit-r1/ground-penetration-audit.mjs';
import {measureSelfInPage} from '../self-collision-r1/self-collision-audit.mjs';
import {withPalmOffsets,handTargetKey} from '../../drill-anim/lib/palm-offset-sc1.mjs';

const a=process.argv.slice(2),o={step:0.25,iters:3,margin:0.004,size:64,sides:'left,right',maxStep:0.06,maxTotal:0.14};
for(let i=0;i<a.length;i+=2)o[a[i].replace(/^--/,'')]=a[i+1];
for(const k of ['step','iters','margin','size','maxStep','maxTotal'])o[k]=+o[k];
const sides=o.sides.split(',');
const file=o.recipe?path.resolve(o.recipe):allRecipes().find(f=>path.basename(f,'.json')===o.id);if(!file)throw Error('no recipe '+o.id);
const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
const loaded=await loadRecipe(file),base=loaded.source,D=base.timeline.duration;
const times=[];for(let t=0;t<D-1e-6;t+=o.step)times.push(+t.toFixed(3));
for(const s of sides)if(!handTargetKey(base.pose?.base?.hands?.[s]))throw Error('hand '+s+' has no palmAt/wrist in pose.base');
const state=fs.existsSync(o.out)?JSON.parse(fs.readFileSync(o.out,'utf8')):{id:o.id,times,iter:0,off:Object.fromEntries(sides.map(s=>[s,times.map(()=>[0,0,0])])),J:null,log:[]};
const table=()=>Object.fromEntries(sides.map(s=>[s,times.map((t,i)=>[t,...state.off[s][i]])]));
const specWith=(extra)=>withPalmOffsets(base,base.id,extra??table());
// measure: self pairs with container normals + ground minimum per region
const selfSrc=measureSelfInPage.toString().replace('e.top.push([dep,x,y,z])','e.top.push([dep,x,y,z,NN[best*3],NN[best*3+1],NN[best*3+2]])')
  .replace("pairs[kp]={d10:","const nm=e.top.reduce((s,u)=>[s[0]+u[4],s[1]+u[5],s[2]+u[6]],[0,0,0]);pairs[kp]={nrm:nm.map(u=>+(u/e.top.length).toFixed(4)),d10:");
if(!selfSrc.includes('NN[best*3+2]]')||!selfSrc.includes('nrm:'))throw Error('measure patch failed');
const report={pageErrors:[]};const {browser,page}=await openScene(loaded,{size:o.size,theme:loadTheme(),report});
const measure=async(spec,t,warm,ground)=>{const st=await stageAt(page,spec,t,warm);
  const m=await page.evaluate(g=>{const v=flareInspector.viewer,sc=v.scene,prev=sc.onAfterRender;let val=null;sc.onAfterRender=function(...a){prev?.apply(this,a);val={self:__selfM({}),ground:g?__groundM():null};};try{v.renderer.render(sc,v.camera);}finally{sc.onAfterRender=prev;}return val;},ground);
  return {st,m};};
const palm=(st,s)=>st.joints[s+'Palm']??st.joints[s+'Hand'];
const solve3=(M,b)=>{const d=M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1])-M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0])+M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);
  if(Math.abs(d)<1e-6)return null;const r=[];for(let c=0;c<3;c++){const X=M.map((row,i)=>row.map((x,j)=>j===c?b[i]:x));r.push((X[0][0]*(X[1][1]*X[2][2]-X[1][2]*X[2][1])-X[0][1]*(X[1][0]*X[2][2]-X[1][2]*X[2][0])+X[0][2]*(X[1][0]*X[2][1]-X[1][1]*X[2][0]))/d);}return r;};
const summary=frames=>{const worst={};for(const f of frames)for(const [k,p] of Object.entries(f.pairs)){if(p.n10<30&&p.d10<=10)continue;if(/UpperArm>torso/.test(k))continue;if(!worst[k]||p.d10>worst[k].d10)worst[k]={d10:p.d10,t:f.t,n10:p.n10};}return worst;};
try{
  await page.evaluate(([a,b])=>{window.__selfM=eval('('+a+')');window.__groundM=eval('('+b+')');},[selfSrc,measureRegionsInPage.toString()]);
  // Jacobian of palm world position w.r.t. the additive frame offset, per side and time (once)
  if(!state.J){state.J={};const h=0.02;
    for(const s of sides){state.J[s]=[];let warm=null;
      for(let i=0;i<times.length;i++){const t=times[i];const st0=await stageAt(page,specWith(),t,warm);warm=st0.x;const p0=palm(st0,s);const cols=[];
        for(let k=0;k<3;k++){const tb=table();tb[s]=tb[s].map(r=>r.slice());tb[s][i][1+k]+=h;for(const j of [i-1,i+1])if(tb[s][j])tb[s][j][1+k]+=h; // flat bump around t
          const st=await stageAt(page,withPalmOffsets(base,base.id,tb),t,warm);const p=palm(st,s);cols.push(p.map((x,q)=>(x-p0[q])/h));}
        state.J[s].push([[cols[0][0],cols[1][0],cols[2][0]],[cols[0][1],cols[1][1],cols[2][1]],[cols[0][2],cols[1][2],cols[2][2]]]);}}
    fs.writeFileSync(o.out,JSON.stringify(state));console.log(JSON.stringify({event:'jacobian',id:o.id}));}
  const pass=async(apply)=>{let warm=null;const frames=[],ground={};
    for(let i=0;i<times.length;i++){if(freeGiB()<.6)throw Error('low mem');const t=times[i];
      const {st,m}=await measure(specWith(),t,warm,true);warm=st.x;frames.push({t,pairs:m.self.pairs});
      for(const [k,r] of Object.entries(m.ground.regions)){const mm=+(r.minY*1000).toFixed(1);if(!(k in ground)||mm<ground[k])ground[k]=mm;}
      if(!apply)continue;
      for(const s of sides){const S=s==='left'?'left':'right';const per={};
        for(const [k,p] of Object.entries(m.self.pairs)){const [A,B]=k.split('>');if(A!==S+'Hand'&&A!==S+'Forearm')continue;if(p.d10<=3||/UpperArm$/.test(B)&&B.startsWith(S))continue;
          const L=Math.hypot(...p.nrm)||1,push=p.nrm.map(u=>u/L*(p.d10/1000+o.margin));const cur=per[B];if(!cur||Math.hypot(...push)>Math.hypot(...cur))per[B]=push;}
        let w=[0,0,0];for(const v of Object.values(per))w=w.map((x,q)=>x+v[q]);const n=Math.hypot(...w);if(n<1e-4)continue;if(n>o.maxStep)w=w.map(x=>x*o.maxStep/n);
        const d=solve3(state.J[s][i],w);if(!d)continue;const cur=state.off[s][i],nx=cur.map((x,q)=>x+d[q]),nn=Math.hypot(...nx);
        state.off[s][i]=(nn>o.maxTotal?nx.map(x=>x*o.maxTotal/nn):nx).map(x=>+x.toFixed(4));}
    }
    return {frames,worst:summary(frames),ground};};
  while(state.iter<o.iters){const r=await pass(true);state.iter++;state.log.push({iter:state.iter,before:r.worst,ground:r.ground});fs.writeFileSync(o.out,JSON.stringify(state));
    console.log(JSON.stringify({event:'iter',id:o.id,iter:state.iter,worstBefore:r.worst}));}
  const fin=await pass(false);state.final={worst:fin.worst,ground:fin.ground};
  if(!state.baseline){/* baseline = iteration 1 'before' numbers */state.baseline=state.log[0]?.before??null;state.baselineGround=state.log[0]?.ground??null;}
  state.table=table();fs.writeFileSync(o.out,JSON.stringify(state));console.log(JSON.stringify({event:'final',id:o.id,worst:fin.worst,ground:fin.ground,pageErrors:report.pageErrors.length}));
}finally{await browser.close();}
