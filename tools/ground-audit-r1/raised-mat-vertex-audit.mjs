// Per-vertex clearance against RAISED mat props (yoga blocks / wedges / raised pads), read-only, numeric.
//
//   node tools/ground-audit-r1/raised-mat-vertex-audit.mjs --out <dir> [--stride 16] [--size 128] --only id1,id2
//
// Same production chain as ground-penetration-audit.mjs (recipe-scene.mjs loadRecipe/openScene/stageAt, one real
// render per sampled frame, CPU skinning inside scene.onAfterRender). For every spec prop {type:'mat'} whose top
// (at.y) is above the floor, each drawn coach vertex is transformed into that block's local frame
// (props.js: BoxGeometry L along x, W along z, H tall, top face at at.y, rotated by yaw about +Y).
// A vertex inside the block footprint gets clearance = y - top; < 0 and > -H means it sits inside the block volume.
// Per frame / block / region we keep the lowest such vertex and the count of vertices inside the volume.
// Output: <out>/raised-mat-results.jsonl, one line per action (resumable).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipe,openScene,stageAt,freeGiB} from '../action-package-v3/recipe-scene.mjs';
import {allRecipes} from './ground-penetration-audit.mjs';

const SELF=fileURLToPath(import.meta.url);

function measureBlocksInPage(blocks){
  const T=window.__toonT,v=flareInspector.viewer;v.coach.updateWorldMatrix(true,true);const q=new T.Vector3();
  const vis=m=>m&&m.visible!==false&&m.colorWrite!==false&&!(m.transparent&&m.opacity<=0);
  const region=(bone)=>{
    if(!bone)return 'other';if(/^v2p_L_/.test(bone))return 'leftHand';if(/^v2p_R_/.test(bone))return 'rightHand';
    const m=bone.match(/^(left|right)(.+)$/);if(!m)return /head|neck/.test(bone)?'head':'torso';const [_,s,p]=m;
    for(const k of ['Patella:Knee','Thigh','Shin','Foot','Forearm','UpperArm','Hand'])
      {const [re,nm]=k.split(':');if(new RegExp(re).test(p))return s+(nm??re);}
    return /Scapula/.test(p)?'torso':'other';
  };
  const B=blocks.map(b=>{const a=(b.yaw||0)*Math.PI/180;return {...b,c:Math.cos(a),s:Math.sin(a),R:{}};});
  v.coach.traverse(mesh=>{
    if(!mesh.isMesh)return;for(let a=mesh;a;a=a.parent)if(!a.visible)return;
    if(v.camera&&!mesh.layers.test(v.camera.layers))return;
    const g=mesh.geometry,pos=g?.attributes?.position;if(!pos)return;
    const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(!mats.some(vis))return;
    const count=g.index?.count??pos.count,start=Math.max(0,g.drawRange.start),end=Math.min(count,start+g.drawRange.count);
    const ranges=Array.isArray(mesh.material)?g.groups.filter(x=>vis(mats[x.materialIndex])):[{start:0,count}];
    const drawn=new Set();for(const r of ranges)for(let k=Math.max(start,r.start);k<Math.min(end,r.start+r.count);k++)drawn.add(g.index?g.index.getX(k):k);
    if(!drawn.size)return;mesh.skeleton?.update();
    const si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bones=mesh.skeleton?.bones;
    for(const id of drawn){
      if(mesh.getVertexPosition)mesh.getVertexPosition(id,q);else q.fromBufferAttribute(pos,id);q.applyMatrix4(mesh.matrixWorld);
      let reg=null;
      for(const b of B){
        const dx=q.x-b.at[0],dz=q.z-b.at[2],lx=dx*b.c-dz*b.s,lz=dx*b.s+dz*b.c;
        if(Math.abs(lx)>b.size[0]/2||Math.abs(lz)>b.size[1]/2)continue;
        if(reg===null){let bone=null;
          if(si&&sw&&bones){let bw=-1;for(let k=0;k<sw.itemSize;k++){const w=sw.getComponent(id,k);if(w>bw){bw=w;bone=bones[si.getComponent(id,k)]?.name;}}}
          else bone=/hand/i.test(mesh.name)?(/left|_L/i.test(mesh.name)?'leftHand':'rightHand'):null;reg=region(bone);}
        const c=q.y-b.at[1],r=b.R[reg]??(b.R[reg]={minClear:Infinity,inside:0,n:0});r.n++;
        if(c<0&&c>-b.size[2])r.inside++;
        if(c<r.minClear){r.minClear=c;r.at=[+q.x.toFixed(4),+q.y.toFixed(4),+q.z.toFixed(4)];r.mesh=mesh.name;}
      }
    }
  });
  return B.map(b=>({at:b.at,size:b.size,regions:Object.fromEntries(Object.entries(b.R).map(([k,r])=>[k,{...r,minClear:+r.minClear.toFixed(5)}]))}));
}

function parse(argv){const o={stride:16,size:128};for(let i=0;i<argv.length;i+=2)o[argv[i].replace(/^--/,'')]=argv[i+1];o.stride=+o.stride;o.size=+o.size;if(!o.out)throw Error('--out required');return o;}

async function main(){
  const o=parse(process.argv.slice(2));fs.mkdirSync(o.out,{recursive:true});
  const res=path.join(o.out,'raised-mat-results.jsonl');
  const done=new Set(fs.existsSync(res)?fs.readFileSync(res,'utf8').split('\n').filter(Boolean).map(l=>JSON.parse(l).id):[]);
  const ids=(o.only??'').split(',').filter(Boolean);
  const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
  for(const file of allRecipes().filter(f=>ids.includes(path.basename(f,'.json')))){
    const id=path.basename(file,'.json');if(done.has(id))continue;
    try{
      const loaded=await loadRecipe(file),{source}=loaded,fps=30,N=Math.round(source.timeline.duration*fps);
      const blocks=(source.props??[]).filter(p=>(p.type??p.kind)==='mat'&&(p.at?.[1]??0)>0.001).map(p=>({at:p.at,size:p.size??[1.83,0.61,0.006],yaw:p.yaw??0}));
      if(!blocks.length){console.log(JSON.stringify({event:'skip',id,reason:'no raised mat'}));continue;}
      const report={pageErrors:[]};const t0=Date.now();const {browser,page}=await openScene(loaded,{size:o.size,theme:loadTheme(),report});
      const out={id,loopFrames:N,stride:o.stride,blocks,frames:[]};
      try{
        await page.evaluate(src=>{window.__blockMeasure=eval('('+src+')');},measureBlocksInPage.toString());
        let warm=null;
        for(let f=0;f<N;f+=o.stride){
          if(freeGiB()<.6)throw Error('Low memory at frame '+f);
          const st=await stageAt(page,source,f/fps,warm);warm=st.x;
          const m=await page.evaluate(bl=>{const v=flareInspector.viewer,sc=v.scene,prev=sc.onAfterRender;let val=null;
            sc.onAfterRender=function(...a){prev?.apply(this,a);val=__blockMeasure(bl);};
            try{v.renderer.render(sc,v.camera);}finally{sc.onAfterRender=prev;}if(!val)throw Error('no onAfterRender');return val;},blocks);
          out.frames.push({f,blocks:m});
        }
        out.pageErrors=report.pageErrors;out.sec=(Date.now()-t0)/1000;
      }finally{await browser.close();}
      fs.appendFileSync(res,JSON.stringify(out)+'\n');console.log(JSON.stringify({event:'done',id,sec:out.sec}));
    }catch(e){fs.appendFileSync(path.join(o.out,'raised-mat-errors.jsonl'),JSON.stringify({id,error:String(e?.stack??e).slice(0,1500)})+'\n');console.log(JSON.stringify({event:'error',id,error:String(e).slice(0,300)}));}
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)main().catch(e=>{console.error(e);process.exitCode=1;});
