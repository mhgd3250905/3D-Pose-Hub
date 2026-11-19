// Thomas supplement r1 (2026-11-19): sandbox self-check + low-res V5 preview stills for one recipe. Not a production renderer.
//   node tools/thomas-sup/check.mjs --recipe <recipe.json> [--stride 3] [--render 0,60,120] [--size 360] [--png-dir <dir>] [--out <json>]
// One browser: the hub recipe scene (stageAt: applyAt + props + fixed recipe camera, as tools/v5/render-masters-v5.mjs) with the
// V5 model installed exactly as render-masters-v5.mjs does (same modules, same pose transfer). Every <stride>-th frame is solved and
// measured on the V5 body that the render machine will draw:
//   - elbow / knee angles (V5 bones, degrees);
//   - contact drift: world position of each V5 hand / foot bone over the time windows the action's check plan says are planted (mm);
//   - floor: lowest skinned V5 vertex per region (hand, forearm, foot, shin, knee, pelvis/torso, head) relative to the floor the body
//     stands on (mat top when the recipe has a mat, else y=0), in mm (< -2 mm = through the floor, drill-anim/lib/qa.py FLOOR_TOL);
//   - props: lowest signed distance of V5 body vertices (hands excluded) to the props' QA capsules (dip bars) / the pull-up bar tube;
//   - self-clip: capsule hulls on the V5 joints with drill-anim/lib/qa.py radii (adjacent and allowed pairs skipped), overlap in mm.
// Stills in --render are rendered at --size (<= 480) into --png-dir as <frame>.png. Nothing here writes into the repository.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipe,openScene,stageAt,fail,freeGiB} from '../action-package-v3/recipe-scene.mjs';
import {loadTheme} from '../../drill-anim/lib/config.mjs';

const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),REPO=path.resolve(HERE,'../..');
const RT=path.join(REPO,'tools/v5/runtime');
const MODULES=['vendor/meshopt_decoder.module.js','wristfix-r2.js','toon-r6.js','v5-hub.js'];
const MODEL='model/coach-v3r3-wristfix.glb';
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d;};
const recipeFile=path.resolve(opt('--recipe')),stride=+opt('--stride',3),size=+opt('--size',360);
fail(size>=128&&size<=480,'preview size must be 128..480');
const renderFrames=(opt('--render','')||'').split(',').filter(Boolean).map(Number);
const pngDir=opt('--png-dir');const outFile=opt('--out');
const PLAN=JSON.parse(fs.readFileSync(path.join(HERE,'actions.json'),'utf8'));

const loaded=await loadRecipe(recipeFile);
const {prepared,source}=loaded,id=prepared.recipe.id,fps=30,N=Math.round(source.timeline.duration*fps);
const plan=PLAN.actions.find(a=>a.id===id)??{checks:{}};
const report={pageErrors:[]};
const scene=await openScene(loaded,{size,theme:loadTheme(),report});const page=scene.page;
const res={id,recipe:path.relative(REPO,recipeFile),spec:prepared.recipe.spec,frames:N,stride,size,samples:[]};
try{
  const mods=Object.fromEntries(MODULES.map(m=>[m,fs.readFileSync(path.join(RT,m),'utf8')]));
  const glb=fs.readFileSync(path.join(RT,MODEL)).toString('base64');
  await page.evaluate(async ({mods,glb})=>{
    const src=await (await fetch('/src/viewer.js')).text(),v=src.match(/three\.js\?v=(\w+)/)[1],O=location.origin;
    const map={'three':O+'/node_modules/.vite/deps/three.js?v='+v,'three/addons/loaders/GLTFLoader.js':O+'/node_modules/.vite/deps/three_addons_loaders_GLTFLoader__js.js?v='+v,
      'three/addons/GLTFLoader.js':O+'/node_modules/.vite/deps/three_addons_loaders_GLTFLoader__js.js?v='+v};
    const url={};
    for(const [name,code] of Object.entries(mods)){
      const fixed=code.replace(/(from\s*|import\s*\(\s*)(['"])([^'"]+)\2/g,(m,pre,q,spec)=>{if(map[spec])return pre+q+map[spec]+q;const rel=spec.replace(/^\.\//,'');if(url[rel])return pre+q+url[rel]+q;throw Error('unknown import '+spec);});
      url[name]=URL.createObjectURL(new Blob([fixed],{type:'text/javascript'}));
    }
    const bin=Uint8Array.from(atob(glb),c=>c.charCodeAt(0)).buffer;
    const m=await import(url['v5-hub.js']);return await m.installV5({glb:bin});
  },{mods,glb});
  // in-page measurement on the V5 body
  await page.evaluate(()=>{
    const T=window.__toonT,V=window.__v5,v=flareInspector.viewer;
    const region=b=>{if(!b)return 'other';if(/Hand|WristBend/.test(b))return /^left/.test(b)?'handL':'handR';if(/Forearm/.test(b))return /^left/.test(b)?'forearmL':'forearmR';
      if(/UpperArm/.test(b))return /^left/.test(b)?'upperArmL':'upperArmR';if(/Foot/.test(b))return /^left/.test(b)?'footL':'footR';if(/Shin|Patella/.test(b))return /^left/.test(b)?'shinL':'shinR';
      if(/Thigh/.test(b))return /^left/.test(b)?'thighL':'thighR';if(/head|neck/.test(b))return 'head';return 'torso';};
    const meshes=[];V.root.traverse(o=>{if(o.isSkinnedMesh&&o.visible!==false&&!o.userData.__outline&&!o.userData.__eye)meshes.push(o);});
    const per=meshes.map(o=>{const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,n=g.attributes.position.count,reg=new Array(n);
      for(let i=0;i<n;i++){let bw=-1,bi=0;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;bi=si.getComponent(i,k);}}reg[i]=region(o.skeleton.bones[bi]?.name);}return {o,reg,n};});
    const _v=new T.Vector3();
    window.__tsMeasure=(floorY,caps)=>{
      const minY={},prop={};
      for(const {o,reg,n} of per){o.skeleton.update();
        for(let i=0;i<n;i++){o.getVertexPosition(i,_v);_v.applyMatrix4(o.matrixWorld);const r=reg[i];
          if(minY[r]===undefined||_v.y<minY[r])minY[r]=_v.y;
          if(caps.length&&!/^hand/.test(r)){for(const c of caps){const a=c.a,b=c.b,ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],ap=[_v.x-a[0],_v.y-a[1],_v.z-a[2]];
            const L=ab[0]**2+ab[1]**2+ab[2]**2;let t=(ab[0]*ap[0]+ab[1]*ap[1]+ab[2]*ap[2])/L;t=Math.max(0,Math.min(1,t));
            const d=Math.hypot(ap[0]-ab[0]*t,ap[1]-ab[1]*t,ap[2]-ab[2]*t)-c.r;if(prop[r]===undefined||d<prop[r])prop[r]=d;}}}}
      const B=V.bones,wp=n=>B[n].getWorldPosition(new T.Vector3()).toArray();
      const J={};for(const n of ['pelvis','torso','neck','head','leftUpperArm','leftForearm','leftHand','rightUpperArm','rightForearm','rightHand','leftThigh','leftShin','leftFoot','rightThigh','rightShin','rightFoot'])J[n]=wp(n);
      for(const k in minY)minY[k]=+((minY[k]-floorY)*1000).toFixed(1);for(const k in prop)prop[k]=+(prop[k]*1000).toFixed(1);
      return {minY,prop,J};
    };
  });
  const props=source.props??[];
  const matTop=props.some(p=>p.type==='mat')?Math.max(...props.filter(p=>p.type==='mat').map(p=>(p.at?.[1]??0)+(p.size?.[2]??0.006))):0;
  const caps=await page.evaluate(()=>{const out=[];try{const q=__props.qaPrims?.()??[];for(const c of q)if(c.a&&c.b&&c.r)out.push({a:c.a,b:c.b,r:c.r});}catch{}return out;});
  for(const p of props)if(p.type==='pullupBar'&&p.capsule)caps.push(p.capsule);
  res.floorY=matTop;res.propCapsules=caps.length;
  const want=new Set(renderFrames);let warm=null;
  const frames=[];for(let f=0;f<N;f+=stride)frames.push(f);for(const f of renderFrames)if(!frames.includes(f))frames.push(f);frames.sort((a,b)=>a-b);
  if(pngDir)fs.mkdirSync(pngDir,{recursive:true});
  for(const f of frames){
    fail(freeGiB()>=.5,'Low free memory');
    const st=await stageAt(page,source,f/fps,warm);warm=st.x;
    const r=await page.evaluate(([fl,caps,render])=>{const d=window.__v5.pose();const m=window.__tsMeasure(fl,caps);const url=render?window.__v5.render():null;return {d,m,url};},[matTop,caps,want.has(f)]);
    if(r.url&&pngDir)fs.writeFileSync(path.join(pngDir,`${String(f).padStart(4,'0')}.png`),Buffer.from(r.url.split(',')[1],'base64'));
    res.samples.push({f,t:+(f/fps).toFixed(3),warn:st.warn?.length??0,warnText:(st.warn??[]).slice(0,3).map(w=>typeof w==='string'?w:JSON.stringify(w)).join(' | ').slice(0,300),ang:r.d.angV5,angHub:r.d.angHub,posErr:r.d.posErr,posErrBone:r.d.posErrBone,H:Object.fromEntries(['leftPalm','rightPalm','leftWrist','rightWrist','leftToe','rightToe','leftAnkle','rightAnkle','leftKnee','rightKnee','leftShoulder','rightShoulder','leftElbow','rightElbow','pelvis','head','leftHip','rightHip'].map(n=>[n,st.joints[n]])),minY:r.m.minY,prop:r.m.prop,J:r.m.J});
  }
  res.pageErrors=report.pageErrors;
}finally{await scene.browser.close();}
// ---- summary
const S=res.samples,inWin=(t,w)=>w.some(([a,b])=>t>=a-1e-6&&t<=b+1e-6);
const sum={};
const c=plan.checks??{};
const elb=S.filter(s=>!c.lockElbows||inWin(s.t,c.lockElbows));
sum.elbowMin={left:+Math.min(...elb.map(s=>s.ang.leftElbow)).toFixed(1),right:+Math.min(...elb.map(s=>s.ang.rightElbow)).toFixed(1),window:c.lockElbows??'all'};
sum.elbowMax={left:+Math.max(...S.map(s=>s.ang.leftElbow)).toFixed(1),right:+Math.max(...S.map(s=>s.ang.rightElbow)).toFixed(1)};
sum.kneeMin={left:+Math.min(...S.map(s=>s.ang.leftKnee)).toFixed(1),right:+Math.min(...S.map(s=>s.ang.rightKnee)).toFixed(1)};
sum.kneeMax={left:+Math.max(...S.map(s=>s.ang.leftKnee)).toFixed(1),right:+Math.max(...S.map(s=>s.ang.rightKnee)).toFixed(1)};
sum.pins={};
for(const p of c.pins??[]){const act=S.filter(s=>inWin(s.t,p.when));if(!act.length)continue;
  const P=act.map(s=>s.J[p.bone]),mean=[0,1,2].map(i=>P.reduce((a,x)=>a+x[i],0)/P.length);
  sum.pins[p.bone+(p.label?':'+p.label:'')]={frames:act.length,driftMm:+(Math.max(...P.map(x=>Math.hypot(x[0]-mean[0],x[1]-mean[1],x[2]-mean[2])))*1000).toFixed(1)};}
sum.hubPins={};
for(const p of c.pins??[]){const hb=p.hub;if(!hb)continue;const act=S.filter(s=>inWin(s.t,p.when));if(!act.length)continue;
  const P=act.map(s=>s.H[hb]),mean=[0,1,2].map(i=>P.reduce((a,x)=>a+x[i],0)/P.length);
  sum.hubPins[hb+(p.label?':'+p.label:'')]={frames:act.length,driftMm:+(Math.max(...P.map(x=>Math.hypot(x[0]-mean[0],x[1]-mean[1],x[2]-mean[2])))*1000).toFixed(1)};}
sum.hubElbowMin={left:+Math.min(...elb.map(s=>s.angHub.leftElbow)).toFixed(1),right:+Math.min(...elb.map(s=>s.angHub.rightElbow)).toFixed(1)};
{const w=S.reduce((a,s)=>s.posErr>a.posErr?s:a,S[0]);sum.posErrWorst={mm:+(w.posErr*1000).toFixed(1),bone:w.posErrBone,f:w.f};}
const regs=[...new Set(S.flatMap(s=>Object.keys(s.minY)))];
sum.floorMinMm=Object.fromEntries(regs.map(k=>[k,Math.min(...S.map(s=>s.minY[k]??1e9))]));
sum.floorWorst=Object.entries(sum.floorMinMm).sort((a,b)=>a[1]-b[1])[0];
const pr=[...new Set(S.flatMap(s=>Object.keys(s.prop)))];
if(pr.length)sum.propMinMm=Object.fromEntries(pr.map(k=>[k,Math.min(...S.map(s=>s.prop[k]??1e9))]));
// self-clip capsules (qa.py radii, mm)
const segs={torso:['pelvis','neck',115],upperArmL:['leftUpperArm','leftForearm',42],upperArmR:['rightUpperArm','rightForearm',42],forearmL:['leftForearm','leftHand',34],forearmR:['rightForearm','rightHand',34],
  thighL:['leftThigh','leftShin',68],thighR:['rightThigh','rightShin',68],shinL:['leftShin','leftFoot',48],shinR:['rightShin','rightFoot',48]};
const adj=new Set(['torso|upperArmL','torso|upperArmR','upperArmL|forearmL','upperArmR|forearmR','torso|thighL','torso|thighR','thighL|shinL','thighR|shinR','thighL|thighR'].map(x=>x.split('|').sort().join('|')));
const allow=new Set((c.allowContact??[]).map(x=>x.split('|').sort().join('|')));
function segDist(p1,q1,p2,q2){const d1=q1.map((v,i)=>v-p1[i]),d2=q2.map((v,i)=>v-p2[i]),r=p1.map((v,i)=>v-p2[i]);const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const a=dot(d1,d1),e=dot(d2,d2),f=dot(d2,r),cc=dot(d1,r),b=dot(d1,d2),den=a*e-b*b;let s=den>1e-12?Math.max(0,Math.min(1,(b*f-cc*e)/den)):0;let t=(b*s+f)/e;
  if(t<0){t=0;s=Math.max(0,Math.min(1,-cc/a));}else if(t>1){t=1;s=Math.max(0,Math.min(1,(b-cc)/a));}
  const c1=p1.map((v,i)=>v+d1[i]*s),c2=p2.map((v,i)=>v+d2[i]*t);return Math.hypot(c1[0]-c2[0],c1[1]-c2[1],c1[2]-c2[2]);}
let worst={mm:1e9};const names=Object.keys(segs);
for(const s of S)for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++){const k=[names[i],names[j]].sort().join('|');if(adj.has(k)||allow.has(k))continue;
  const A=segs[names[i]],B=segs[names[j]],d=segDist(s.J[A[0]],s.J[A[1]],s.J[B[0]],s.J[B[1]])*1000-A[2]-B[2];if(d<worst.mm)worst={mm:+d.toFixed(1),pair:k,f:s.f};}
sum.selfClipWorst=worst;
sum.maxPosErrMm=+(Math.max(...S.map(s=>s.posErr))*1000).toFixed(2);
sum.solverWarnFrames=S.filter(s=>s.warn>0).length;
sum.pageErrors=res.pageErrors.length;
res.summary=sum;
if(outFile){fs.mkdirSync(path.dirname(path.resolve(outFile)),{recursive:true});fs.writeFileSync(outFile,JSON.stringify(res));}
console.log(JSON.stringify({id,summary:sum}));
