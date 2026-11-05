// Motion-amplitude + contact-position fast screen (read-only). Same single-page fast solve as self-collision-r1/scan-fast
// (armfix-r2 booted once, base install, every recipe's prepared spec solved with __drill.applyAt).
// Per recipe: joints (getMetrics) at 24 uniform samples over one loop; at keytimes, CPU-skinned vertices by region and,
// for each effector (hands, feet): min surface distance to every other region + nearest points, min height, and an
// occlusion count along the recipe camera dir. Limits: props/fixed-hand adapters/correctives not installed.
//   node tools/motion-contact-r1/scan-fast.mjs --out file.json --list order.txt [--budget 80]
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadRecipe} from '../action-package-v3/recipe-scene.mjs';
import {REPO} from '../action-completion-v3-r2/render-finalization-r8.mjs';
import {allRecipes} from '../ground-audit-r1/ground-penetration-audit.mjs';
import {keyTimes} from '../self-collision-r1/self-collision-audit.mjs';

export function measureContactInPage(camDir){
  const T=window.__toonT,v=flareInspector.viewer;v.coach.updateWorldMatrix(true,true);
  const REG=['leftHand','rightHand','leftForearm','rightForearm','leftUpperArm','rightUpperArm','leftThigh','rightThigh','leftShin','rightShin','leftFoot','rightFoot','torso','head'];
  const RID=Object.fromEntries(REG.map((r,i)=>[r,i]));
  const region=bone=>{
    if(!bone)return -1;if(/^v2p_L_/.test(bone))return RID.leftHand;if(/^v2p_R_/.test(bone))return RID.rightHand;
    const m=bone.match(/^(left|right)(.+)$/);if(!m)return /head|neck/i.test(bone)?RID.head:RID.torso;const [_,s,p]=m;
    if(/Patella|Thigh/.test(p))return RID[s+'Thigh'];if(/Shin|Calf/.test(p))return RID[s+'Shin'];if(/Foot|Toe|Heel/.test(p))return RID[s+'Foot'];
    if(/Forearm/.test(p))return RID[s+'Forearm'];if(/UpperArm/.test(p))return RID[s+'UpperArm'];if(/Hand|Finger|Thumb|Palm/.test(p))return RID[s+'Hand'];
    if(/Scapula|Clavicle|Shoulder|Hip|Pelvis/.test(p))return RID.torso;return -1;};
  const vis=m=>m&&m.visible!==false&&m.colorWrite!==false&&!(m.transparent&&m.opacity<=0);
  const P=[],R=[],q=new T.Vector3();
  v.coach.traverse(mesh=>{
    if(!mesh.isMesh)return;for(let o=mesh;o;o=o.parent)if(!o.visible)return;
    const g=mesh.geometry,pos=g?.attributes?.position;if(!pos)return;const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(!mats.some(vis))return;
    mesh.skeleton?.update();const si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bones=mesh.skeleton?.bones;
    const step=pos.count>15000?2:1;
    for(let id=0;id<pos.count;id+=step){
      if(mesh.getVertexPosition)mesh.getVertexPosition(id,q);else q.fromBufferAttribute(pos,id);q.applyMatrix4(mesh.matrixWorld);
      let bone=null;if(si&&sw&&bones){let bw=-1;for(let k=0;k<sw.itemSize;k++){const w=sw.getComponent(id,k);if(w>bw){bw=w;bone=bones[si.getComponent(id,k)]?.name;}}}
      let r=region(bone);if(r<0&&/hand/i.test(mesh.name))r=/left|_L/i.test(mesh.name)?RID.leftHand:RID.rightHand;if(r<0)continue;
      P.push(q.x,q.y,q.z);R.push(r);}
  });
  const n=R.length,CELL=0.03,key=(x,y,z)=>((Math.floor(x/CELL)+512)*1048576+(Math.floor(y/CELL)+512)*1024+(Math.floor(z/CELL)+512));
  const grids=REG.map(()=>new Map()),byR=REG.map(()=>[]);
  for(let i=0;i<n;i++){const r=R[i];byR[r].push(i);const kk=key(P[i*3],P[i*3+1],P[i*3+2]),G=grids[r];let L=G.get(kk);if(!L)G.set(kk,L=[]);L.push(i);}
  const EFF=['leftHand','rightHand','leftFoot','rightFoot'];const skipN={leftHand:['leftForearm'],rightHand:['rightForearm'],leftFoot:['leftShin'],rightFoot:['rightShin']};
  const cd=new T.Vector3().fromArray(camDir).normalize();const out={};const MAXR=4;
  for(const E of EFF){const e=RID[E],idx=byR[e];if(!idx.length)continue;
    let cx=0,cy=0,cz=0,minY=Infinity;for(const i of idx){cx+=P[i*3];cy+=P[i*3+1];cz+=P[i*3+2];if(P[i*3+1]<minY)minY=P[i*3+1];}
    cx/=idx.length;cy/=idx.length;cz/=idx.length;
    const dist={};
    const D2=(i,j)=>(P[j*3]-P[i*3])**2+(P[j*3+1]-P[i*3+1])**2+(P[j*3+2]-P[i*3+2])**2;
    for(let B=0;B<REG.length;B++){if(B===e||skipN[E].includes(REG[B]))continue;const L2=byR[B];if(!L2.length)continue;
      // coarse brute force on subsamples, then full-res refine around the coarse closest pair
      let bd=Infinity,bi=-1,bj=-1;const se=Math.max(1,Math.floor(idx.length/300)),sb=Math.max(1,Math.floor(L2.length/600));
      for(let k=0;k<idx.length;k+=se){const i=idx[k];for(let m=0;m<L2.length;m+=sb){const j=L2[m];const d=D2(i,j);if(d<bd){bd=d;bi=i;bj=j;}}}
      if(bi<0)continue;
      if(Math.sqrt(bd)<0.25){const R2=0.05*0.05;const sub=(a,n)=>{const k=Math.max(1,Math.ceil(a.length/n));return a.filter((_,q)=>q%k===0);};const ei=sub(idx.filter(i=>D2(i,bi)<R2),400),tj=sub(L2.filter(j=>D2(j,bj)<R2),1500);
        for(const i of ei)for(const j of tj){const d=D2(i,j);if(d<bd){bd=d;bi=i;bj=j;}}}
      dist[REG[B]]=[+(Math.sqrt(bd)*1000).toFixed(1),[P[bi*3],P[bi*3+1],P[bi*3+2]].map(u=>+u.toFixed(3)),[P[bj*3],P[bj*3+1],P[bj*3+2]].map(u=>+u.toFixed(3))];}
    // occlusion: other-region vertices between effector centroid and camera, within 2.5 cm of the ray
    let occ=0;const occBy={};for(let i=0;i<n;i++){const r=R[i];if(r===e||skipN[E].includes(REG[r]))continue;const dx=P[i*3]-cx,dy=P[i*3+1]-cy,dz=P[i*3+2]-cz;
      const a=dx*cd.x+dy*cd.y+dz*cd.z;if(a<0.03)continue;const pp=dx*dx+dy*dy+dz*dz-a*a;if(pp<0.025*0.025){occ++;occBy[REG[r]]=(occBy[REG[r]]||0)+1;}}
    out[E]={c:[cx,cy,cz].map(u=>+u.toFixed(3)),minY:+minY.toFixed(3),dist,occ,occBy};}
  return out;
}

const args=process.argv.slice(2),o={budget:80};for(let i=0;i<args.length;i+=2)o[args[i].slice(2)]=args[i+1];
const done=fs.existsSync(o.out)?JSON.parse(fs.readFileSync(o.out,'utf8')):{};
const all=allRecipes();const CIDS=o.contact&&fs.existsSync(o.contact)?new Set(fs.readFileSync(o.contact,'utf8').split('\n').filter(Boolean)):null;const ids=fs.readFileSync(o.list,'utf8').split('\n').filter(Boolean);
const todo=ids.filter(id=>!done[id]).map(id=>all.find(f=>path.basename(f,'.json')===id)).filter(Boolean);
if(!todo.length){console.log('ALLDONE');process.exit(0);}
const t0=Date.now();
const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
const first=await loadRecipe(todo[0]);
const model=await import(pathToFileURL(path.join(REPO,first.adapter.loader)));await model.verify();
const opened=await model.boot({size:64,pr:1,theme:loadTheme()});const browser=opened.b,page=opened.p;
try{
  const base=JSON.parse(JSON.stringify(first.source));delete base.nativeHands;
  await model.applyV3(page,base);
  await page.evaluate(src=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.motion.reset();window.__cm=eval('('+src+')');},measureContactInPage.toString());
  console.log('boot',((Date.now()-t0)/1000).toFixed(0)+'s');
  for(const f of todo){
    if((Date.now()-t0)/1000>Number(o.budget))break;
    const id=path.basename(f,'.json');
    try{
      const l=await loadRecipe(f),s=l.source,kt=keyTimes(s),D=s.timeline.duration,N=Number(o.n||12);
      const uni=Array.from({length:N},(_,i)=>+(i*D/N).toFixed(4));
      const cam=l.prepared.recipe.camera?.dir??[0,0.2,1];const kt2=(!CIDS||CIDS.has(id))?kt:[];
      const res=await page.evaluate(([s,uni,kt,cam])=>{
        const v=flareInspector.viewer,E=__drill;E.selectModelProfile?.(s);v.motion.reset();let warm=null;const J=[],C=[];
        const jr=()=>{const j=v.motion.getMetrics().joints;const o={};for(const k in j)o[k]=j[k].map(u=>+u.toFixed(4));return o;};
        for(const t of uni){const r=E.applyAt(s,t,warm);warm=r.x;v.coach.updateMatrixWorld(true);J.push({t,j:jr()});}
        v.motion.reset();warm=null;
        for(const {tag,t} of kt){const r=E.applyAt(s,t,warm);warm=r.x;v.coach.updateMatrixWorld(true);C.push({tag,t,j:jr(),c:__cm(cam)});}
        return {J,C};},[s,uni,kt2,cam]);
      done[id]={id,spec:l.prepared.recipe.spec,hands:l.prepared.handSetup?.modes??null,props:(s.props||[]).map(p=>p.type||p.kind||p.name||'prop'),camDir:cam,duration:D,...res};
    }catch(e){done[id]={id,error:String(e).slice(0,300)};}
    fs.writeFileSync(o.out,JSON.stringify(done));
    console.log(id,done[id].error?'FAIL '+done[id].error:'ok',((Date.now()-t0)/1000).toFixed(0)+'s');
  }
}finally{await browser.close();}
