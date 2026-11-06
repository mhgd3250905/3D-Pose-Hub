// Body self-collision audit (read-only, numeric).
//   node tools/self-collision-r1/self-collision-audit.mjs --out <dir> [--size 64] [--only id1,id2] [--list file] [--recipe file.json]
// Same production scene as render-masters (recipe-scene.mjs: armfix-r2, hands, corrections, wrist, correctives).
// Frames: keytimes (rest / mid / peak / peak-hold, same rule as work/r219/keytimes.mjs) + 1/4 and 3/4 of the loop.
// In scene.onAfterRender every drawn coach vertex is CPU-skinned, given a region by dominant bone
// (hand, forearm, upperArm, thigh, shin, foot per side; torso; head), and skinned vertex normals are rebuilt from
// the skinned triangles. Penetration of a vertex of region A into region B = -(v - p)·n_p, p = nearest B vertex
// (only when v is inside B's bounding box). Normal contact of neighbours is skipped: same-side hand/forearm,
// forearm/upperArm, thigh/shin, shin/foot entirely; upperArm/torso within 14 cm of the shoulder, thigh/torso within
// 18 cm of the hip, head/torso within 12 cm of the neck, thigh/thigh within 16 cm of the pelvis.
// Per frame and region pair: d10 = 10th deepest vertex (robust max, mm), dmax, n10 = vertices deeper than 10 mm.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipe,openScene,stageAt,freeGiB} from '../action-package-v3/recipe-scene.mjs';
import {allRecipes} from '../ground-audit-r1/ground-penetration-audit.mjs';

const SELF=fileURLToPath(import.meta.url),REPO=path.resolve(path.dirname(SELF),'../..');

export function keyTimes(spec){
  const tr=spec.timeline.tracks,D=spec.timeline.duration;
  const name=spec.highlight?.pulseTrack&&tr[spec.highlight.pulseTrack]?spec.highlight.pulseTrack:Object.keys(tr)[0];
  const k=tr[name];
  const val=t=>{if(!k||(Array.isArray(k)&&!k.length))return 0;/* static hold (no tracks) */if(typeof k==='function')return k(t);let a=k[0];for(const b of k){if(b[0]>=t){if(b===a)return b[1];const u=(t-a[0])/(b[0]-a[0]||1);return a[1]+(b[1]-a[1])*u;}a=b;}return a[1];};
  const S=[];for(let t=0;t<=D*0.5+1e-9;t+=0.05)S.push([+t.toFixed(2),val(t)]);
  const lo=Math.min(...S.map(s=>s[1])),hi=Math.max(...S.map(s=>s[1]));
  const tLo=S.find(s=>s[1]<=lo+0.02*(hi-lo))[0];
  const pk=S.filter(s=>s[1]>=hi-0.02*(hi-lo)),tHi=pk[0][0],tHiEnd=pk[pk.length-1][0];
  const mid=S.find(s=>s[0]>tLo&&s[1]>=lo+0.5*(hi-lo))?.[0]??(tLo+tHi)/2;
  const named=[['rest',tLo],['mid',mid],['peak',tHi],['hold',tHiEnd>tHi+0.3?tHiEnd:+(tHi+(D*0.5-tHi)*0.6).toFixed(2)],['q1',+(D*0.25).toFixed(2)],['q3',+(D*0.75).toFixed(2)]];
  const seen=new Set(),out=[];for(const [n,t] of named){const key=t.toFixed(2);if(seen.has(key))continue;seen.add(key);out.push({tag:n,t});}
  return out;
}

export function measureSelfInPage(opts){
  const T=window.__toonT,v=flareInspector.viewer;v.coach.updateWorldMatrix(true,true);
  const J=v.motion.getMetrics().joints,jv=n=>J[n]?new T.Vector3().fromArray(J[n]):null;
  const first=(...ns)=>{for(const n of ns){const p=jv(n);if(p)return p;}return null;};
  const anchor={shoulderL:first('leftShoulder','leftUpperArm'),shoulderR:first('rightShoulder','rightUpperArm'),
    hipL:first('leftHip','leftThigh'),hipR:first('rightHip','rightThigh'),neck:first('neck','head'),pelvis:first('pelvis','waist')};
  const REG=['leftHand','rightHand','leftForearm','rightForearm','leftUpperArm','rightUpperArm','leftThigh','rightThigh','leftShin','rightShin','leftFoot','rightFoot','torso','head'];
  const RID=Object.fromEntries(REG.map((r,i)=>[r,i]));
  const region=bone=>{
    if(!bone)return -1;if(/^v2p_L_/.test(bone))return RID.leftHand;if(/^v2p_R_/.test(bone))return RID.rightHand;
    const m=bone.match(/^(left|right)(.+)$/);
    if(!m)return /head|neck/i.test(bone)?RID.head:RID.torso;
    const [_,s,p]=m;
    if(/Patella|Thigh/.test(p))return RID[s+'Thigh'];if(/Shin|Calf/.test(p))return RID[s+'Shin'];if(/Foot|Toe|Heel/.test(p))return RID[s+'Foot'];
    if(/Forearm/.test(p))return RID[s+'Forearm'];if(/UpperArm/.test(p))return RID[s+'UpperArm'];if(/Hand|Finger|Thumb|Palm/.test(p))return RID[s+'Hand'];
    if(/Scapula|Clavicle|Shoulder|Hip|Pelvis/.test(p))return RID.torso;
    return -1;
  };
  const vis=m=>m&&m.visible!==false&&m.colorWrite!==false&&!(m.transparent&&m.opacity<=0);
  const P=[],NN=[],R=[],meshes=[],q=new T.Vector3(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  v.coach.traverse(mesh=>{
    if(!mesh.isMesh)return;for(let o=mesh;o;o=o.parent)if(!o.visible)return;
    if(v.camera&&!mesh.layers.test(v.camera.layers))return;
    const g=mesh.geometry,pos=g?.attributes?.position;if(!pos)return;
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(!mats.some(vis))return;
    const count=g.index?.count??pos.count,start=Math.max(0,g.drawRange.start),end=Math.min(count,start+g.drawRange.count);
    const ranges=Array.isArray(mesh.material)?g.groups.filter(x=>vis(mats[x.materialIndex])):[{start:0,count}];
    const tri=[];for(const r of ranges)for(let k=Math.max(start,r.start);k+2<Math.min(end,r.start+r.count);k+=3)tri.push(g.index?g.index.getX(k):k,g.index?g.index.getX(k+1):k+1,g.index?g.index.getX(k+2):k+2);
    if(!tri.length)return;mesh.skeleton?.update();
    const si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bones=mesh.skeleton?.bones;
    const used=new Map();for(const id of tri)if(!used.has(id))used.set(id,-1);
    const base=P.length/3;let k0=0;
    for(const id of used.keys()){
      if(mesh.getVertexPosition)mesh.getVertexPosition(id,q);else q.fromBufferAttribute(pos,id);q.applyMatrix4(mesh.matrixWorld);
      let bone=null;
      if(si&&sw&&bones){let bw=-1;for(let k=0;k<sw.itemSize;k++){const w=sw.getComponent(id,k);if(w>bw){bw=w;bone=bones[si.getComponent(id,k)]?.name;}}}
      let r=region(bone);
      if(r<0&&/hand/i.test(mesh.name))r=/left|_L/i.test(mesh.name)?RID.leftHand:RID.rightHand;
      used.set(id,base+k0);k0++;P.push(q.x,q.y,q.z);NN.push(0,0,0);R.push(r);
    }
    for(let k=0;k<tri.length;k+=3){
      const i0=used.get(tri[k]),i1=used.get(tri[k+1]),i2=used.get(tri[k+2]);
      a.set(P[i0*3],P[i0*3+1],P[i0*3+2]);b.set(P[i1*3],P[i1*3+1],P[i1*3+2]);c.set(P[i2*3],P[i2*3+1],P[i2*3+2]);
      b.sub(a);c.sub(a);b.cross(c);for(const i of [i0,i1,i2]){NN[i*3]+=b.x;NN[i*3+1]+=b.y;NN[i*3+2]+=b.z;}
    }
    meshes.push(mesh.name||'(unnamed)');
  });
  const n=R.length;
  for(let i=0;i<n;i++){const l=Math.hypot(NN[i*3],NN[i*3+1],NN[i*3+2])||1;NN[i*3]/=l;NN[i*3+1]/=l;NN[i*3+2]/=l;}
  // per-region grids + boxes
  const CELL=0.03,key=(x,y,z)=>((Math.floor(x/CELL)+512)*1048576+(Math.floor(y/CELL)+512)*1024+(Math.floor(z/CELL)+512));
  const grids=REG.map(()=>new Map()),box=REG.map(()=>[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity]);
  for(let i=0;i<n;i++){const r=R[i];if(r<0)continue;const x=P[i*3],y=P[i*3+1],z=P[i*3+2],B=box[r];
    if(x<B[0])B[0]=x;if(y<B[1])B[1]=y;if(z<B[2])B[2]=z;if(x>B[3])B[3]=x;if(y>B[4])B[4]=y;if(z>B[5])B[5]=z;
    const kk=key(x,y,z),G=grids[r];let L=G.get(kk);if(!L)G.set(kk,L=[]);L.push(i);}
  const side=r=>REG[r].startsWith('left')?'L':REG[r].startsWith('right')?'R':'';
  const part=r=>REG[r].replace(/^(left|right)/,'');
  const near=(i,p,d)=>p&&Math.hypot(P[i*3]-p.x,P[i*3+1]-p.y,P[i*3+2]-p.z)<d;
  const skip=(i,A,B)=>{ // true = normal neighbour contact, not counted
    const pa=part(A),pb=part(B),sa=side(A),sb=side(B),pair=[pa,pb].sort().join('/');
    if(sa&&sa===sb&&(pair==='Forearm/Hand'||pair==='Forearm/UpperArm'||pair==='Shin/Thigh'||pair==='Foot/Shin'))return true;
    if(pair==='UpperArm/torso'){const s=sa||sb;return near(i,s==='L'?anchor.shoulderL:anchor.shoulderR,0.14);}
    if(pair==='Thigh/torso'){const s=sa||sb;return near(i,s==='L'?anchor.hipL:anchor.hipR,0.18);}
    if(pair==='head/torso')return near(i,anchor.neck,0.12);
    if(pa==='Thigh'&&pb==='Thigh')return near(i,anchor.pelvis,0.16);
    if(A===B)return true;
    return false;
  };
  const containers=REG.map((_,r)=>!/Hand$/.test(REG[r])); // hands are not used as containers (fingers too thin for nearest-normal)
  const res={};const MAXR=3; // search up to 3 cells (9 cm)
  for(let i=0;i<n;i++){
    const A=R[i];if(A<0)continue;const x=P[i*3],y=P[i*3+1],z=P[i*3+2];
    for(let B=0;B<REG.length;B++){
      if(B===A||!containers[B])continue;const bx=box[B];
      if(x<bx[0]||y<bx[1]||z<bx[2]||x>bx[3]||y>bx[4]||z>bx[5])continue;
      if(skip(i,A,B))continue;
      const G=grids[B],cx=Math.floor(x/CELL),cy=Math.floor(y/CELL),cz=Math.floor(z/CELL);
      let best=-1,bd=Infinity;
      for(let rr=0;rr<=MAXR&&best<0||rr<=MAXR&&rr<=1;rr++){ // rings until found (+1 ring for safety)
        for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++)for(let dz=-rr;dz<=rr;dz++){
          if(Math.max(Math.abs(dx),Math.abs(dy),Math.abs(dz))!==rr)continue;
          const L=G.get((cx+dx+512)*1048576+(cy+dy+512)*1024+(cz+dz+512));if(!L)continue;
          for(const j of L){const d=(P[j*3]-x)**2+(P[j*3+1]-y)**2+(P[j*3+2]-z)**2;if(d<bd){bd=d;best=j;}}
        }
        if(best>=0&&rr>=1)break;
      }
      if(best<0)continue;
      const dep=-((x-P[best*3])*NN[best*3]+(y-P[best*3+1])*NN[best*3+1]+(z-P[best*3+2])*NN[best*3+2]);
      if(dep<=0.002)continue;
      // a vertex deep "inside" but far from the nearest surface point sideways is a sign test artefact: require
      // the offset to be mostly along the normal
      if(Math.sqrt(bd)>dep*1.6+0.01)continue;
      const kp=REG[A]+'>'+REG[B];const e=res[kp]??(res[kp]={top:[],n10:0,nv:0});
      e.nv++;if(dep>0.01)e.n10++;
      if(e.top.length<10||dep>e.top[e.top.length-1][0]){e.top.push([dep,x,y,z]);e.top.sort((u,w)=>w[0]-u[0]);if(e.top.length>10)e.top.pop();}
    }
  }
  const pairs={};
  for(const [kp,e] of Object.entries(res)){const d10=e.top.length>=10?e.top[9][0]:0;
    pairs[kp]={d10:+(d10*1000).toFixed(1),dmax:+(e.top[0][0]*1000).toFixed(1),n10:e.n10,nv:e.nv,at:e.top[0].slice(1).map(u=>+u.toFixed(3))};}
  const out={pairs,nVerts:n};
  if(opts?.probe){out.jointKeys=Object.keys(J);out.meshes=meshes;out.anchors=Object.fromEntries(Object.entries(anchor).map(([k,p])=>[k,p?p.toArray().map(u=>+u.toFixed(3)):null]));
    const bn=new Set();v.coach.traverse(m=>{if(m.isSkinnedMesh)for(const bb of m.skeleton.bones)bn.add(bb.name);});out.bones=[...bn];
    const cnt={};for(const r of R){const nm=r<0?'none':REG[r];cnt[nm]=(cnt[nm]||0)+1;}out.regionCounts=cnt;}
  return out;
}

function parse(argv){const o={size:64};for(let i=0;i<argv.length;i+=2){const k=argv[i].replace(/^--/,'');o[k]=argv[i+1];}o.size=Number(o.size);if(!o.out)throw Error('--out required');return o;}

export async function auditOne(file,{size,probe}){
  const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
  const loaded=await loadRecipe(file),{source,prepared}=loaded;
  const times=keyTimes(source);
  const report={pageErrors:[]};const theme=loadTheme();
  const t0=Date.now();const {browser,page}=await openScene(loaded,{size,theme,report});
  const out={id:prepared.recipe.id,recipe:path.relative(REPO,file),spec:prepared.recipe.spec,size,times,frames:[],bootSec:(Date.now()-t0)/1000};
  try{
    await page.evaluate(src=>{window.__selfMeasure=eval('('+src+')');},measureSelfInPage.toString());
    let warm=null;
    for(const [idx,{tag,t}] of times.entries()){
      if(freeGiB()<.6)throw Error('Low memory at '+t);
      const st=await stageAt(page,source,t,warm);warm=st.x;
      const m=await page.evaluate(pr=>{const v=flareInspector.viewer,sc=v.scene,prev=sc.onAfterRender;let val=null;
        sc.onAfterRender=function(...a){prev?.apply(this,a);val=__selfMeasure({probe:pr});};
        try{v.renderer.render(sc,v.camera);}finally{sc.onAfterRender=prev;}
        if(!val)throw Error('no onAfterRender');return val;},!!probe&&idx===0);
      out.frames.push({tag,t,...m});
    }
    out.pageErrors=report.pageErrors;out.sec=(Date.now()-t0)/1000;
  }finally{await browser.close();}
  return out;
}

async function main(){
  const o=parse(process.argv.slice(2));fs.mkdirSync(o.out,{recursive:true});
  const res=path.join(o.out,'results.jsonl');const done=new Set(fs.existsSync(res)?fs.readFileSync(res,'utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l).id):[]);
  let files=o.recipe?[path.resolve(o.recipe)]:allRecipes();
  if(o.list)files=fs.readFileSync(o.list,'utf8').split('\n').filter(Boolean).map(id=>files.find(f=>path.basename(f,'.json')===id)).filter(Boolean);
  if(o.only){const ids=o.only.split(',');files=files.filter(f=>ids.includes(path.basename(f,'.json')));}
  if(o.limit)files=files.slice(0,Number(o.limit));
  for(const f of files){
    const id=path.basename(f,'.json');if(done.has(id)&&!o.recipe)continue;
    try{const r=await auditOne(f,o);fs.appendFileSync(res,JSON.stringify(r)+'\n');
      const worst=Math.max(0,...r.frames.flatMap(fr=>Object.values(fr.pairs).map(p=>p.d10)));
      console.log(JSON.stringify({event:'done',id,boot:r.bootSec,sec:r.sec,worst}));}
    catch(e){fs.appendFileSync(path.join(o.out,'errors.jsonl'),JSON.stringify({id,error:String(e?.stack??e).slice(0,1500)})+'\n');console.log(JSON.stringify({event:'error',id,error:String(e).slice(0,300)}));}
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)main().catch(e=>{console.error(e);process.exitCode=1;});
