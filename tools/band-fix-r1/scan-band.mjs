// Band-vs-body penetration screen (read-only). For each recipe: openScene (same install chain as the render runner),
// stageAt keytimes + n samples, render once per frame and, in onAfterRender, CPU-skin every visible coach mesh
// (vertex + area-weighted normal + region by dominant bone, as self-collision-audit), then sample each `band` prop's
// tube centreline (same quadratic Bezier as props.js place) at 49 points and measure, against the nearest body vertex,
//   pen = r - dot(p - v, n)   (mm the tube surface sinks below the skin; >0 = penetration)
// with the self-collision sideways guard. Output per frame per band: worst region, pen, u along the band.
//   cd <worktree> && node tools/band-fix-r1/scan-band.mjs --out o.json --list ids.txt [--n 10] [--recipe r.json]
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const W=process.cwd();
const {loadRecipe,openScene,stageAt}=await import(pathToFileURL(W+'/tools/action-package-v3/recipe-scene.mjs'));
const {allRecipes}=await import(pathToFileURL(W+'/tools/ground-audit-r1/ground-penetration-audit.mjs'));
const {keyTimes}=await import(pathToFileURL(W+'/tools/self-collision-r1/self-collision-audit.mjs'));
const {loadTheme}=await import(pathToFileURL(W+'/drill-anim/lib/config.mjs'));
const args=process.argv.slice(2),o={n:10};for(let i=0;i<args.length;i+=2)o[args[i].slice(2)]=args[i+1];
const done=fs.existsSync(o.out)?JSON.parse(fs.readFileSync(o.out,'utf8')):{};
const all=allRecipes();
const ids=o.recipe?[path.basename(o.recipe,'.json')]:fs.readFileSync(o.list,'utf8').split('\n').filter(Boolean);
const bandFn=function(){
  const T=__toonT,v=flareInspector.viewer;v.coach.updateWorldMatrix(true,true);
  const REG=['leftHand','rightHand','leftForearm','rightForearm','leftUpperArm','rightUpperArm','leftThigh','rightThigh','leftShin','rightShin','leftFoot','rightFoot','torso','head'];
  const RID=Object.fromEntries(REG.map((r,i)=>[r,i]));
  const region=bone=>{if(!bone)return -1;if(/^v2p_L_/.test(bone))return RID.leftHand;if(/^v2p_R_/.test(bone))return RID.rightHand;
    const m=bone.match(/^(left|right)(.+)$/);if(!m)return /head|neck/i.test(bone)?RID.head:RID.torso;const [_,s,p]=m;
    if(/Patella|Thigh/.test(p))return RID[s+'Thigh'];if(/Shin|Calf/.test(p))return RID[s+'Shin'];if(/Foot|Toe|Heel/.test(p))return RID[s+'Foot'];
    if(/Forearm/.test(p))return RID[s+'Forearm'];if(/UpperArm/.test(p))return RID[s+'UpperArm'];if(/Hand|Finger|Thumb|Palm/.test(p))return RID[s+'Hand'];return RID.torso;};
  const vis=m=>m&&m.visible!==false&&m.colorWrite!==false&&!(m.transparent&&m.opacity<=0);
  const P=[],NN=[],R=[],q=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  v.coach.traverse(mesh=>{if(!mesh.isMesh)return;for(let x=mesh;x;x=x.parent)if(!x.visible)return;
    if(v.camera&&!mesh.layers.test(v.camera.layers))return;const g=mesh.geometry,pos=g?.attributes?.position;if(!pos)return;
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(!mats.some(vis))return;
    const count=g.index?.count??pos.count,start=Math.max(0,g.drawRange.start),end=Math.min(count,start+g.drawRange.count);
    const ranges=Array.isArray(mesh.material)?g.groups.filter(x=>vis(mats[x.materialIndex])):[{start:0,count}];
    const tri=[];for(const r of ranges)for(let k=Math.max(start,r.start);k+2<Math.min(end,r.start+r.count);k+=3)tri.push(g.index?g.index.getX(k):k,g.index?g.index.getX(k+1):k+1,g.index?g.index.getX(k+2):k+2);
    if(!tri.length)return;mesh.skeleton?.update();const si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bones=mesh.skeleton?.bones;
    const used=new Map();for(const id of tri)if(!used.has(id))used.set(id,-1);const base=P.length/3;let k0=0;
    for(const id of used.keys()){if(mesh.getVertexPosition)mesh.getVertexPosition(id,q);else q.fromBufferAttribute(pos,id);q.applyMatrix4(mesh.matrixWorld);
      let bone=null;if(si&&sw&&bones){let bw=-1;for(let k=0;k<sw.itemSize;k++){const w=sw.getComponent(id,k);if(w>bw){bw=w;bone=bones[si.getComponent(id,k)]?.name;}}}
      let r=region(bone);if(r<0&&/hand/i.test(mesh.name))r=/left|_L/i.test(mesh.name)?RID.leftHand:RID.rightHand;
      used.set(id,base+k0);k0++;P.push(q.x,q.y,q.z);NN.push(0,0,0);R.push(r);}
    for(let k=0;k<tri.length;k+=3){const i0=used.get(tri[k]),i1=used.get(tri[k+1]),i2=used.get(tri[k+2]);
      a.set(P[i0*3],P[i0*3+1],P[i0*3+2]);b.set(P[i1*3],P[i1*3+1],P[i1*3+2]);c.set(P[i2*3],P[i2*3+1],P[i2*3+2]);
      b.sub(a);c.sub(a);b.cross(c);for(const i of [i0,i1,i2]){NN[i*3]+=b.x;NN[i*3+1]+=b.y;NN[i*3+2]+=b.z;}}});
  const n=R.length;for(let i=0;i<n;i++){const l=Math.hypot(NN[i*3],NN[i*3+1],NN[i*3+2])||1;NN[i*3]/=l;NN[i*3+1]/=l;NN[i*3+2]/=l;}
  const CELL=0.03,G=new Map(),kk=(x,y,z)=>(x+512)*1048576+(y+512)*1024+(z+512);
  for(let i=0;i<n;i++){if(R[i]<0)continue;const k=kk(Math.floor(P[i*3]/CELL),Math.floor(P[i*3+1]/CELL),Math.floor(P[i*3+2]/CELL));let L=G.get(k);if(!L)G.set(k,L=[]);L.push(i);}
  const out=[];let bi=-1;
  for(const ob of __props.list){const s=ob.userData.spec;if(!ob.userData.band)continue;bi++;
    const A=__props.pt(s.from),B=__props.pt(s.to),M=A.clone().lerp(B,.5);M.y-=s.sag||0;const cv=new T.QuadraticBezierCurve3(A,M,B),r=s.r||0.008;
    const reg={},sm=[];
    for(let j=0;j<=48;j++){const u=j/48,p=cv.getPoint(u);const cx=Math.floor(p.x/CELL),cy=Math.floor(p.y/CELL),cz=Math.floor(p.z/CELL);
      let best=-1,bd=Infinity;for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)for(let dz=-2;dz<=2;dz++){const L=G.get(kk(cx+dx,cy+dy,cz+dz));if(!L)continue;
        for(const i of L){const d=(P[i*3]-p.x)**2+(P[i*3+1]-p.y)**2+(P[i*3+2]-p.z)**2;if(d<bd){bd=d;best=i;}}}
      if(best<0){sm.push(-1);continue;}const d=(p.x-P[best*3])*NN[best*3]+(p.y-P[best*3+1])*NN[best*3+1]+(p.z-P[best*3+2])*NN[best*3+2];
      const pen=r-d;const dist=Math.sqrt(bd);if(pen<=0.0005||dist>Math.abs(d)*1.6+0.012){sm.push(-1);continue;}sm.push(/Hand$/.test(REG[R[best]])?-1:+(pen*1000).toFixed(1));
      const rn=REG[R[best]];const e=reg[rn];if(!e||pen>e.pen)reg[rn]={pen:+(pen*1000).toFixed(1),u:+u.toFixed(2),at:[p.x,p.y,p.z].map(x=>+x.toFixed(3))};}
    const ept=[];for(const [w,e] of [['from',s.from],['to',s.to]]){if(!e||typeof e!=='object'||Array.isArray(e)||/Hand$/.test(e.bone))continue;
      const p=w==='from'?A:B;const cx=Math.floor(p.x/CELL),cy=Math.floor(p.y/CELL),cz=Math.floor(p.z/CELL);let best=-1,bd=Infinity;
      for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)for(let dz=-2;dz<=2;dz++){const L=G.get(kk(cx+dx,cy+dy,cz+dz));if(!L)continue;for(const i of L){const d=(P[i*3]-p.x)**2+(P[i*3+1]-p.y)**2+(P[i*3+2]-p.z)**2;if(d<bd){bd=d;best=i;}}}
      if(best<0)continue;const nW=new T.Vector3(NN[best*3],NN[best*3+1],NN[best*3+2]);const d=p.clone().sub(new T.Vector3(P[best*3],P[best*3+1],P[best*3+2])).dot(nW);
      const bq=v.coach.getObjectByName(e.bone).getWorldQuaternion(new T.Quaternion());const nL=nW.clone().applyQuaternion(bq.invert());
      ept.push({w,bone:e.bone,off:e.offset,d:+(d*1000).toFixed(1),nL:nL.toArray().map(x=>+x.toFixed(3)),reg:REG[R[best]]});}
    out.push({i:bi,ept,sm,from:typeof s.from==='object'&&!Array.isArray(s.from)?s.from.bone:Array.isArray(s.from)?'W':s.from,to:typeof s.to==='object'&&!Array.isArray(s.to)?s.to.bone:Array.isArray(s.to)?'W':s.to,r:+(r*1000).toFixed(1),reg});}
  return out;};
const theme=loadTheme();
// shared boot (one Chromium for the whole list, to save time/quota): openScene on the first recipe, then per recipe swap the
// props (__props.list cleared + re-added) and solve with that recipe's spec. Later recipes' hand/joint correctives are not
// reinstalled; band ends on hands are excluded from the fix and from the verdict (grip).
const swap=async(page,s)=>page.evaluate(([s,th])=>{const v=flareInspector.viewer;for(const o of __props.list)v.scene.remove(o);__props.list.length=0;
  for(const p of s.props||[])__props.add(th,p);v.motion.reset();},[s,theme]);
const timesOf=s=>{const D=s.timeline.duration,kt=keyTimes(s);const ex=Array.from({length:Number(o.n)},(_,i)=>({tag:'s'+i,t:+((i+0.5)*D/Number(o.n)).toFixed(2)}));
  const seen=new Set(kt.map(k=>k.t.toFixed(2)));return [...kt,...ex.filter(e=>!seen.has(e.t.toFixed(2)))].sort((a,b)=>a.t-b.t);};
const measure=async(page,s,times)=>{let warm=null;const frames=[];for(const {tag,t} of times){const st=await stageAt(page,s,t,warm);warm=st.x;
  const m=await page.evaluate(()=>{const v=flareInspector.viewer,sc=v.scene,prev=sc.onAfterRender;let val=null;
    sc.onAfterRender=function(...a){prev?.apply(this,a);val=__bandM();};try{v.renderer.render(sc,v.camera);}finally{sc.onAfterRender=prev;}return val;});
  frames.push({tag,t,bands:m});}return frames;};
const worst=frames=>{const w={};for(const fr of frames)for(const b of fr.bands)for(const [k,e] of Object.entries(b.reg)){const key=b.i+':'+b.from+'>'+b.to+'|'+k;if(!w[key]||e.pen>w[key].pen)w[key]={...e,t:fr.t};}return w;};
const maxPen=w=>Math.max(0,...Object.entries(w).filter(([k])=>!/Hand$/.test(k)).map(([,e])=>e.pen));
const kof=e=>e.bone+'@'+e.off.map(x=>x.toFixed(4)).join(',');
const recs=ids.map(id=>[id,o.recipe?path.resolve(o.recipe):all.find(x=>path.basename(x,'.json')===id)]).filter(([id])=>!done[id]);
if(!recs.length){console.log('ALLDONE');process.exit(0);}
const t0=Date.now();const first=await loadRecipe(recs[0][1]);const report={pageErrors:[]};const {browser,page}=await openScene(first,{size:64,theme,report});
try{await page.evaluate(src=>{window.__bandM=eval('('+src+')');},bandFn.toString());console.log('boot',((Date.now()-t0)/1000).toFixed(0)+'s');
 for(const [id,f] of recs){const t1=Date.now();
  try{const l=await loadRecipe(f),s=l.source,times=timesOf(s);await swap(page,s);
   const before=await measure(page,s,times);const wb=worst(before);const res={id,spec:l.prepared.recipe.spec,nameZh:l.prepared.recipe.nameZh,before:wb,beforeMax:maxPen(wb)};
   if(Number(o.trim)&&res.beforeMax>2){ // move each bone-attached (non-hand) band end back along its own strand to where the strand leaves the skin
    let fr=before,hist=[];
    for(let it=0;it<5;it++){const cut={};
     for(const x of fr)for(const b of x.bands){const ends=b.ept.map(e=>e.w);
      for(const w of ends){const sm=w==='to'?b.sm:[...b.sm].reverse();let k=-1;for(let j=Math.floor(sm.length*0.45);j<sm.length;j++)if(sm[j]>0.5){k=j;break;}
       if(k<0)continue;const uc=Math.max(0.05,(k-1.5)/48);const key=b.i+':'+w;if(!cut[key]||uc<cut[key].uc)cut[key]={i:b.i,w,uc,t:x.t};}}
     if(!Object.keys(cut).length)break;hist.push(Object.values(cut));
     for(const c of Object.values(cut)){await stageAt(page,s,c.t,null);await page.evaluate(([cuts])=>{const T=__toonT,v=flareInspector.viewer;const bl=__props.list.filter(o=>o.userData.band);
      for(const c of cuts){const sp=bl[c.i].userData.spec;const A=__props.pt(sp.from),B=__props.pt(sp.to),M=A.clone().lerp(B,.5);M.y-=sp.sag||0;
       const cv=new T.QuadraticBezierCurve3(A,M,B);const p=cv.getPoint(c.w==='to'?c.uc:1-c.uc);const e=sp[c.w];const bn=v.coach.getObjectByName(e.bone);
       const q=bn.getWorldQuaternion(new T.Quaternion()).invert();e.offset=p.sub(bn.getWorldPosition(new T.Vector3())).applyQuaternion(q).toArray().map(x=>+x.toFixed(4));}},[[c]]);}
     s.props=await page.evaluate(()=>__props.list.map(o=>o.userData.spec));
     // the trim is posed at the frames' last solve; re-measure every frame
     fr=await measure(page,s,times);}
    const wa=worst(fr);res.after=wa;res.afterMax=maxPen(wa);res.trims=hist;res.bands=s.props.filter(p=>p.type==='band');}
   if(Number(o.fix)&&res.beforeMax>2){ // push every bone-attached (non-hand) band end out along its skin normal until it clears r + 2 mm on every frame
    const moves={};let fr=before;
    for(let it=0;it<4;it++){const need={};
     for(const x of fr)for(const b of x.bands)for(const e of b.ept){const push=(b.r+2.0)-e.d;if(push>0.3){const k=kof(e);if(!need[k]||push>need[k].push)need[k]={push,nL:e.nL,bone:e.bone,off:e.off};}}
     if(!Object.keys(need).length)break;
     const upd=Object.fromEntries(Object.entries(need).map(([k,e])=>[k,e.off.map((x,i)=>+(x+e.nL[i]*e.push/1000).toFixed(4))]));
     for(const [k,nv] of Object.entries(upd)){const orig=Object.keys(moves).find(q=>moves[q].cur===k)||k;moves[orig]={cur:kof({bone:need[k].bone,off:nv}),off:nv,bone:need[k].bone};}
     await page.evaluate(([upd])=>{const kf=e=>e.bone+'@'+e.offset.map(x=>x.toFixed(4)).join(',');for(const ob of __props.list){const sp=ob.userData.spec;if(!ob.userData.band)continue;
       for(const w of ['from','to']){const e=sp[w];if(e&&typeof e==='object'&&!Array.isArray(e)&&e.offset&&upd[kf(e)])e.offset=upd[kf(e)];}}},[upd]);
     s.props=await page.evaluate(()=>__props.list.map(o=>o.userData.spec));
     fr=await measure(page,s,times);}
    const wa=worst(fr);res.after=wa;res.afterMax=maxPen(wa);res.moves=moves;res.bands=s.props.filter(p=>p.type==='band');}
   done[id]=res;}catch(e){done[id]={id,error:String(e).slice(0,300)};}
  fs.writeFileSync(o.out,JSON.stringify(done));const d=done[id];
  console.log(id,d.error||('before '+d.beforeMax+' after '+(d.afterMax??'-')+' '+JSON.stringify(d.before)),((Date.now()-t1)/1000).toFixed(0)+'s');}
}finally{await browser.close();}
