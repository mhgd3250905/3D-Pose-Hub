// node fix.mjs --out res.jsonl id ...   (ids from flagged.json). One browser per action; baseline + probes + model-guided candidates.
import fs from 'node:fs';import path from 'node:path';
const R='/workspace/work/elbow-scan-wt/',H='/workspace/work/elbow-fix/';
const {loadRecipe,openScene,stageAt}=await import(R+'tools/action-package-v3/recipe-scene.mjs');
const RP=JSON.parse(fs.readFileSync('/workspace/work/elbow-fix/recipes.json','utf8'));
const {loadTheme}=await import(R+'drill-anim/lib/config.mjs');
const EV=fs.readFileSync(H+'metric2.js','utf8');
const FL=Object.fromEntries(JSON.parse(fs.readFileSync(H+'flagged.json')).map(o=>[o.id,o]));
const a=process.argv.slice(2);let out;const ids=[];for(let i=0;i<a.length;i++){if(a[i]==='--out')out=a[++i];else ids.push(a[i]);}
const done=new Set(fs.existsSync(out)?fs.readFileSync(out,'utf8').trim().split('\n').filter(Boolean).map(l=>JSON.parse(l).id):[]);
const wrap=x=>{x=((x+180)%360+360)%360-180;return x;};
const SIDES=['left','right'];
// the transform written into the spec files (keep identical to makespec.mjs)
function fixSide(s,side,A,B,C){const h=s.pose.base.hands[side];const U0=h.upperArmTwist??0,E0=h.elbowTwist??0;
  for(const d of Object.values(s.pose.deltas||{})){const x=d.hands?.[side];if(!x)continue;
    if(x.elbowTwist!==undefined){const ev=x.elbowTwist-E0;x.elbowTwist+=B;x.upperArmTwist=(x.upperArmTwist??U0)+A+C*ev;}
    else if(x.upperArmTwist!==undefined)x.upperArmTwist+=A;}
  h.upperArmTwist=U0+A;h.elbowTwist=E0+B;}
function variant(S0,p){const S=structuredClone(S0);for(const side of SIDES){const q=p[side];if(q&&(q.a||q.b||q.c))fixSide(S,side,q.a||0,q.b||0,q.c||0);}return S;}
const hasDelta=(S,side)=>Object.values(S.pose.deltas||{}).some(d=>d.hands?.[side]?.elbowTwist!==undefined);
for(const id of ids){
  if(done.has(id))continue;const f=FL[id];const t0=Date.now();const rec={id,spec:f.spec};let browser;
  try{
    const loaded=await loadRecipe(RP[id]);const S0=loaded.source;
    rec.specLoaded=path.relative(R,loaded.prepared.specFile);
    const D=S0.timeline.duration;const ts=new Set(Array.from({length:8},(_,i)=>+(i*D/8).toFixed(3)));
    for(const k of S0.keyFrames||[])ts.add(+(+k).toFixed(3));for(const x of Object.values(f.sides))ts.add(+x.t);
    const times=[...ts].filter(t=>t>=0&&t<=D).sort((x,y)=>x-y);rec.times=times;
    const report={pageErrors:[]};const o=await openScene(loaded,{size:96,theme:loadTheme(),report});browser=o.browser;const page=o.page;
    await page.evaluate(x=>{window.__xm2=eval('('+x+')');},EV);
    const measure=async S=>{const rows=[];let warm=null;for(const t of times){const st=await stageAt(page,S,t,warm);warm=st.x;
      const m=await page.evaluate(()=>{const v=flareInspector.viewer,sc=v.scene,prev=sc.onAfterRender;let val;sc.onAfterRender=function(...a){prev?.apply(this,a);val=__xm2();};try{v.renderer.render(sc,v.camera);}finally{sc.onAfterRender=prev;}return val;});
      if(m.restInfo){rec.restInfo=m.restInfo;delete m.restInfo;}rows.push({t,warn:st.warn?.length||0,joints:st.joints,...m});}return rows;};
    const flaggedSides=SIDES.filter(s=>f.sides[s]&&f.sides[s].ratio<0.85);rec.sides=flaggedSides;
    const base=await measure(S0);
    const P=k=>Object.fromEntries(flaggedSides.map(s=>[s,{a:k==='a'?30:0,b:k==='b'?30:0,c:k==='c'&&hasDelta(S0,s)?0.5:0}]));
    const pr={a:await measure(variant(S0,P('a'))),b:await measure(variant(S0,P('b')))};
    if(!process.env.NOC&&flaggedSides.some(s=>hasDelta(S0,s)))pr.c=await measure(variant(S0,P('c')));
    const S_U=s=>null;const summ=rows=>Object.fromEntries(SIDES.map(s=>[s,{ratio:Math.min(...rows.map(r=>r[s].ratio??1)),sh:Math.min(...rows.map(r=>r[s].sh??1)),wr:Math.min(...rows.map(r=>r[s].wr??1)),
      twMax:Math.max(...rows.map(r=>Math.abs(r[s].tw))),twMin:Math.min(...rows.map(r=>r[s].tw)),twHi:Math.max(...rows.map(r=>r[s].tw)),htwMax:Math.max(...rows.map(r=>Math.abs(r[s].htw))),
      near:Math.max(...rows.map(r=>r[s].near)),minY:Math.min(...rows.map(r=>r[s].minY)),warn:rows.reduce((z,r)=>z+r.warn,0),
      pitMax:Math.max(0,...rows.filter(r=>r[s].elbow>=15&&r[s].pitAng!=null).map(r=>Math.abs(r[s].pitAng))),pitT:rows.reduce((b,r)=>(r[s].ratio??1)<(b[s].ratio??1)?r:b,rows[0])[s].pitT,uaTw:S_U(s),worstT:rows.reduce((b,r)=>(r[s].ratio??1)<(b[s].ratio??1)?r:b,rows[0]).t,elbowAtWorst:rows.reduce((b,r)=>(r[s].ratio??1)<(b[s].ratio??1)?r:b,rows[0])[s].elbow}]));
    rec.base=summ(base);
    // linear model per side per frame
    const FR={},cands={};
    for(const s of flaggedSides){
      FR[s]=base.map((r,i)=>({tw:r[s].tw,htw:r[s].htw,pit:r[s].pitAng,elb:r[s].elbow,
        kA:wrap(pr.a[i][s].tw-r[s].tw)/30,kB:wrap(pr.b[i][s].tw-r[s].tw)/30,hB:wrap(pr.b[i][s].htw-r[s].htw)/30,hA:wrap(pr.a[i][s].htw-r[s].htw)/30,
        pA:(r[s].pitAng!=null&&pr.a[i][s].pitAng!=null)?wrap(pr.a[i][s].pitAng-r[s].pitAng)/30:0,
        kC:pr.c?wrap(pr.c[i][s].tw-r[s].tw)/0.5:0,hC:pr.c?wrap(pr.c[i][s].htw-r[s].htw)/0.5:0,pC:(pr.c&&r[s].pitAng!=null&&pr.c[i][s].pitAng!=null)?wrap(pr.c[i][s].pitAng-r[s].pitAng)/0.5:0}));}
    const h0s=Object.fromEntries(flaggedSides.map(s=>[s,Math.max(...FR[s].map(x=>Math.abs(x.htw)))]));
    // anchor: {p:{a,b,c}, rows} -> model = anchor measurement + K (p - p_anchor)
    function optimize(s,anchor,step,range){const U0=S0.pose.base.hands[s].upperArmTwist??0;const dl=process.env.NOC?false:hasDelta(S0,s);const fr=FR[s];const h0=h0s[s];const hardH=Math.max(h0,45)+5;
      const ap=anchor?anchor.p:{a:0,b:0,c:0};const list=[];
      const As=[],Bs=[],Cs=dl?[0,0.25,0.5,0.75,1,1.25]:[0];for(let A=ap.a-range;A<=ap.a+range;A+=step)As.push(A);for(let B=ap.b-range;B<=ap.b+range;B+=Math.max(step,15)/(anchor?1.5:1))Bs.push(Math.round(B));
      for(const A of As)for(const B of Bs)for(const C of Cs){
        if(Math.abs(U0+A)>135||Math.abs(A)>180||Math.abs(B)>180)continue;let tmax=0,hmax=0,pen=0,pmax=0;
        fr.forEach((x,i)=>{const m=anchor?anchor.rows[i][s]:x;const dA=A-ap.a,dB=B-ap.b,dC=C-ap.c;
          const t=wrap(m.tw+x.kA*dA+x.kB*dB+x.kC*dC),h=wrap(m.htw+x.hA*dA+x.hB*dB+x.hC*dC);tmax=Math.max(tmax,Math.abs(t));hmax=Math.max(hmax,Math.abs(h));
          const mp=anchor?m.pitAng:x.pit;if(x.elb>=15&&mp!=null&&x.pit!=null){const p=wrap(mp+x.pA*dA+x.pC*dC);pmax=Math.max(pmax,Math.abs(p));pen=Math.max(pen,Math.abs(p)-Math.max(30,Math.abs(x.pit)+5));}});
        if(hmax>hardH)continue;
        const J=tmax+Math.max(0,hmax-Math.max(30,h0))+0.1*Math.max(0,Math.abs(U0+A)-60)+2*Math.max(0,pen)+0.3*Math.max(0,pmax-30)+0.02*Math.abs(B);
        list.push({a:A,b:B,c:C,J:+J.toFixed(1),tPred:+tmax.toFixed(0),hPred:+hmax.toFixed(0),pen:+pen.toFixed(0),pPred:+pmax.toFixed(0)});}
      list.sort((x,y)=>x.J-y.J);return list;}
    const diverse=(list,n)=>{const pick=[];for(const c of list){if(pick.every(p=>Math.abs(p.a-c.a)>=20||Math.abs(p.b-c.b)>=30||p.c!==c.c))pick.push(c);if(pick.length>=n)break;}return pick;};
    for(const s of flaggedSides){const base0={p:{a:0,b:0,c:0},rows:base.map(r=>({[s]:{tw:r[s].tw,htw:r[s].htw,pitAng:r[s].pitAng}}))};
      cands[s]=diverse(optimize(s,null,5,180),3);}
    rec.cands=cands;
    const ver=[],vrows=[];const jd=(r0,r1)=>{let m=0;for(const k of Object.keys(r0.joints)){const p=r0.joints[k],q=r1.joints[k];if(Array.isArray(p)&&Array.isArray(q))m=Math.max(m,Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]));}return m*1000;};
    for(let k=0;k<2;k++){const p={};for(const s of flaggedSides)if(cands[s][k])p[s]=cands[s][k];if(!Object.keys(p).length)break;
      const rows=await measure(variant(S0,p));const sm=summ(rows);const drift=Math.max(...rows.map((r,i)=>jd(base[i],r)));
      ver.push({p,sm,drift:+drift.toFixed(2)});vrows.push(rows);}
    // refinement: re-anchor model on the best measured candidate per side, verify 2 more
    for(let it=0;it<1;it++){const p={};
      for(const s of flaggedSides){let bi=-1,bs=-9;ver.forEach((v,i)=>{if(!v.p[s])return;const m=v.sm[s];const sc=m.ratio-0.002*m.twMax-0.004*Math.max(0,m.htwMax-Math.max(30,rec.base[s].htwMax));if(sc>bs){bs=sc;bi=i;}});
        if(bi<0)continue;const m=ver[bi].sm[s];if(m.ratio>=0.95&&m.twMax<=30)continue;
        const L=optimize(s,{p:ver[bi].p[s],rows:vrows[bi]},5,45).filter(c=>!ver.some(v=>v.p[s]&&v.p[s].a===c.a&&v.p[s].b===c.b&&v.p[s].c===c.c));if(L[0])p[s]={...L[0],refined:it+1};}
      if(!Object.keys(p).length)break;
      const rows=await measure(variant(S0,p));const sm=summ(rows);const drift=Math.max(...rows.map((r,i)=>jd(base[i],r)));ver.push({p,sm,drift:+drift.toFixed(2)});vrows.push(rows);}
    rec.ver=ver;
    // choose per side
    rec.choice={};
    for(const s of flaggedSides){const b=rec.base[s];let best=null;
      for(const v of ver){if(!v.p[s])continue;const m=v.sm[s];
        const ok=m.pitMax<=Math.max(30,b.pitMax+5)+10&&v.drift<=0.5&&m.sh>=Math.min(b.sh,0.85)-0.03&&m.wr>=Math.min(b.wr,0.85)-0.03&&m.near<=b.near+15&&(m.minY>=b.minY-3||m.minY>=10)&&m.htwMax<=Math.max(b.htwMax,45)+10;
        const sc=m.ratio-0.002*m.twMax-0.003*Math.max(0,m.htwMax-Math.max(30,b.htwMax));if(ok&&(!best||sc>best.sc))best={sc,p:v.p[s],m,drift:v.drift};}
      rec.choice[s]=best;}
    rec.warnBase=rec.base.left.warn;rec.warnVer=ver.map(v=>v.sm.left.warn);
  }catch(e){rec.error=String(e.stack||e).slice(0,500);}
  finally{if(browser){try{browser.process()?.kill('SIGKILL');}catch{}await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,3000))]);}}
  rec.sec=+((Date.now()-t0)/1000).toFixed(1);fs.appendFileSync(out,JSON.stringify(rec)+'\n');console.log(id,rec.error?'ERR '+rec.error.slice(0,200):'ok',rec.sec);
}
console.log('BATCH DONE');
