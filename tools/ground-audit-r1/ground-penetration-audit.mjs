// Ground penetration audit (read-only, numeric, no images).
//
//   node tools/ground-audit-r1/ground-penetration-audit.mjs --out <dir> [--stride 4] [--size 96] [--only id1,id2] [--list file]
//
// For each production recipe (remaining219-r1/recipes + remaining32-r4/groups) it builds the exact production
// scene through tools/action-package-v3/recipe-scene.mjs (armfix-r2 model, hand setup, joint corrections, wrist
// corrective, action correctives, props, fixed camera), stages frames 0..N-1 every <stride> frames with stageAt
// (same per-frame call render-masters.mjs makes), triggers one tiny render so onBeforeRender/onAfterRender hooks
// (ankle join, DQS, wrist join) run exactly as in production, and inside scene.onAfterRender CPU-skins every
// drawn coach vertex (SkinnedMesh.getVertexPosition) and reports signed clearance to the floor plane y=0
// (engine.js: "floor y=0, up +Y"; stage floor/grid/ring are hidden; output.exerciseMat is a 2-D compositor layer,
// not 3-D geometry, so it adds no thickness). Props are NOT treated as ground.
// One JSON line per action is appended to <out>/results.jsonl (resumable: done ids are skipped).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipe,openScene,stageAt,freeGiB} from '../action-package-v3/recipe-scene.mjs';

const SELF=fileURLToPath(import.meta.url),REPO=path.resolve(path.dirname(SELF),'../..');
export function allRecipes(){
  const a=path.join(REPO,'catalog/production/remaining219-r1/recipes'),b=path.join(REPO,'catalog/production/remaining32-r4/groups');
  const out=fs.readdirSync(a).filter(f=>f.endsWith('.json')).sort().map(f=>path.join(a,f));
  for(const g of fs.readdirSync(b).sort())for(const f of fs.readdirSync(path.join(b,g)).filter(f=>f.endsWith('.json')).sort())out.push(path.join(b,g,f));
  return out;
}

// Runs in the page (inside scene.onAfterRender). Region = dominant skin bone, plus joint-radius tests for knee/elbow.
export function measureRegionsInPage(){
  const T=window.__toonT,v=flareInspector.viewer;v.coach.updateWorldMatrix(true,true);
  const J=v.motion.getMetrics().joints,q=new T.Vector3(),jv=n=>new T.Vector3().fromArray(J[n]);
  const knee={left:jv('leftKnee'),right:jv('rightKnee')},elbow={left:jv('leftElbow'),right:jv('rightElbow')};
  const R={},put=(name,y,id,mesh,p)=>{const r=R[name]??(R[name]={minY:Infinity,n:0,below:0});r.n++;if(y<0)r.below++;if(y<r.minY){r.minY=y;r.at=[+p.x.toFixed(4),+p.y.toFixed(4),+p.z.toFixed(4)];r.mesh=mesh;r.v=id;}};
  const vis=m=>m&&m.visible!==false&&m.colorWrite!==false&&!(m.transparent&&m.opacity<=0);
  const region=(bone)=>{
    if(!bone)return 'other';const m=bone.match(/^(left|right)(.+)$/);
    if(/^v2p_L_/.test(bone))return 'leftHand';if(/^v2p_R_/.test(bone))return 'rightHand';
    if(!m)return /head|neck/.test(bone)?'head':'torso';
    const [_,s,p]=m;
    if(/Patella/.test(p))return s+'Knee';if(/Thigh/.test(p))return s+'Thigh';if(/Shin/.test(p))return s+'Shin';if(/Foot/.test(p))return s+'Foot';
    if(/Forearm/.test(p))return s+'Forearm';if(/UpperArm/.test(p))return s+'UpperArm';if(/Hand/.test(p))return s+'Hand';if(/Scapula/.test(p))return 'torso';
    return 'other';
  };
  const meshes=[];
  v.coach.traverse(mesh=>{
    if(!mesh.isMesh)return;for(let a=mesh;a;a=a.parent)if(!a.visible)return;
    if(v.camera&&!mesh.layers.test(v.camera.layers))return;
    const g=mesh.geometry,pos=g?.attributes?.position;if(!pos)return;
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(!mats.some(vis))return;
    const count=g.index?.count??pos.count,start=Math.max(0,g.drawRange.start),end=Math.min(count,start+g.drawRange.count);
    const ranges=Array.isArray(mesh.material)?g.groups.filter(x=>vis(mats[x.materialIndex])):[{start:0,count}];
    const drawn=new Set();for(const r of ranges)for(let k=Math.max(start,r.start);k<Math.min(end,r.start+r.count);k++)drawn.add(g.index?g.index.getX(k):k);
    if(!drawn.size)return;mesh.skeleton?.update();meshes.push(mesh.name);
    const si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bones=mesh.skeleton?.bones;
    for(const id of drawn){
      if(mesh.getVertexPosition)mesh.getVertexPosition(id,q);else q.fromBufferAttribute(pos,id);q.applyMatrix4(mesh.matrixWorld);
      let bone=null;
      if(si&&sw&&bones){let bw=-1;for(let k=0;k<sw.itemSize;k++){const w=sw.getComponent(id,k);if(w>bw){bw=w;bone=bones[si.getComponent(id,k)]?.name;}}}
      else bone=/hand/i.test(mesh.name)?(/left|_L/i.test(mesh.name)?'leftHand':'rightHand'):null;
      let name=region(bone);
      for(const s of ['left','right']){
        if(/Thigh|Shin|Knee/.test(name)&&name.startsWith(s)&&q.distanceToSquared(knee[s])<0.11*0.11)name=s+'Knee';
        if(/Forearm|UpperArm/.test(name)&&name.startsWith(s)&&q.distanceToSquared(elbow[s])<0.09*0.09)name=s+'Elbow';
      }
      put(name,q.y,id,mesh.name||'(unnamed)',q);put('all',q.y,id,mesh.name||'(unnamed)',q);
    }
  });
  const joints={};for(const n of ['leftKnee','rightKnee','leftElbow','rightElbow','leftWrist','rightWrist','leftPalm','rightPalm','leftAnkle','rightAnkle','leftToe','rightToe','leftHeel','rightHeel','pelvis','head'])if(J[n])joints[n]=+J[n][1].toFixed(4);
  for(const r of Object.values(R))r.minY=+r.minY.toFixed(5);
  return {regions:R,joints,meshes};
}

function parse(argv){const o={stride:4,size:96};for(let i=0;i<argv.length;i+=2){const k=argv[i].replace(/^--/,'');o[k]=argv[i+1];}o.stride=Number(o.stride);o.size=Number(o.size);if(!o.out)throw Error('--out required');return o;}

async function auditOne(file,{stride,size}){
  const {config,loadTheme}=await import('../../drill-anim/lib/config.mjs');
  const loaded=await loadRecipe(file),{source,prepared}=loaded,fps=30,N=Math.round(source.timeline.duration*fps);
  const report={pageErrors:[]};const theme=loadTheme();
  const t0=Date.now();const {browser,page}=await openScene(loaded,{size,theme,report});
  const out={id:prepared.recipe.id,recipe:path.relative(REPO,file),spec:prepared.recipe.spec,loopFrames:N,stride,size,floorPlaneY:0,
    props:(source.props??[]).map(p=>p.type??p.kind??p.model??'prop'),shadowBlobJoints:(source.shadow?.blobs??[]).map(b=>b.j),
    hands:Object.fromEntries(['left','right'].map(s=>[s,prepared.handSetup.modes?.[s]??null])),frames:[],bootSec:(Date.now()-t0)/1000};
  try{
    await page.evaluate(src=>{window.__groundMeasure=eval('('+src+')');},measureRegionsInPage.toString());
    let warm=null;
    for(let f=0;f<N;f+=stride){
      if(freeGiB()<.6)throw Error('Low memory at frame '+f);
      const st=await stageAt(page,source,f/fps,warm);warm=st.x;
      const m=await page.evaluate(()=>{const v=flareInspector.viewer,sc=v.scene,prev=sc.onAfterRender;let val=null;
        sc.onAfterRender=function(...a){prev?.apply(this,a);val=__groundMeasure();};
        try{v.renderer.render(sc,v.camera);}finally{sc.onAfterRender=prev;}
        if(!val)throw Error('no onAfterRender');return val;});
      out.frames.push({f,...m});
    }
    out.pageErrors=report.pageErrors;out.sec=(Date.now()-t0)/1000;
  }finally{await browser.close();}
  return out;
}

async function main(){
  const o=parse(process.argv.slice(2));fs.mkdirSync(o.out,{recursive:true});
  const res=path.join(o.out,'results.jsonl');const done=new Set(fs.existsSync(res)?fs.readFileSync(res,'utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l).id):[]);
  let files=allRecipes();
  if(o.list)files=fs.readFileSync(o.list,'utf8').split('\n').filter(Boolean).map(id=>files.find(f=>path.basename(f,'.json')===id)).filter(Boolean);
  if(o.only){const ids=o.only.split(',');files=files.filter(f=>ids.includes(path.basename(f,'.json')));}
  for(const f of files){
    const id=path.basename(f,'.json');if(done.has(id))continue;
    try{const r=await auditOne(f,o);fs.appendFileSync(res,JSON.stringify(r)+'\n');console.log(JSON.stringify({event:'done',id,frames:r.frames.length,sec:r.sec}));}
    catch(e){fs.appendFileSync(path.join(o.out,'errors.jsonl'),JSON.stringify({id,error:String(e?.stack??e).slice(0,1500)})+'\n');console.log(JSON.stringify({event:'error',id,error:String(e).slice(0,300)}));}
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)main().catch(e=>{console.error(e);process.exitCode=1;});
