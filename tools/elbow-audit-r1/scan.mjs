// Elbow / forearm axial-twist audit r1 (diagnostic only, never acceptance).
// Same install chain as production (tools/action-package-v3/recipe-scene.mjs), 64px renders only to fire the
// per-render wrist-twist runtime (hands-native r5: forearm takes twistShare x hand roll). Per side, per sample:
//  solvedTwist  = forearm local roll about its long axis (+Y) vs rest, from the pose solve
//  effTwist     = same, read inside onBeforeRender (what is actually skinned, incl. twistShare transfer)
//  handTheta    = hand roll vs forearm (what the wrist-twist runtime splits), phi = part moved into the forearm
//  meshElbow / meshWrist = mean skinned-vertex angular displacement about the elbow->wrist axis, measured in the
//               upper arm frame carried by the elbow *swing only* (pure hinge/swing => 0), for forearm verts at
//               t in [0.05,0.3] (elbow end) and [0.7,0.95] (wrist end). Swing (big arm circles) does not count.
//  hingeDev     = angle between this sample's elbow swing axis and the median swing axis (flex > 20 deg only)
// Usage: node scan.mjs --out <dir> [--hz 10] [--share <0..1>] recipe.json ...   (one fresh browser per recipe)
import fs from 'node:fs';
import path from 'node:path';
import {loadRecipe,openScene,stageAt,freeGiB} from '../action-package-v3/recipe-scene.mjs';

const args=process.argv.slice(2);let out=null,hz=10,share=null;const files=[];
for(let i=0;i<args.length;i++){if(args[i]==='--out')out=args[++i];else if(args[i]==='--hz')hz=Number(args[++i]);else if(args[i]==='--share')share=Number(args[++i]);else files.push(args[i]);}
if(!out)throw Error('--out required');fs.mkdirSync(out,{recursive:true});
const {loadTheme}=await import('../../drill-anim/lib/config.mjs');const theme=loadTheme();

for(const file of files){
  const id=path.basename(file,'.json');const dest=path.join(out,id+'.json');
  if(fs.existsSync(dest)){continue;}
  if(freeGiB()<1.25){console.error('low memory, stop');break;}
  const t0=Date.now();let browser;
  try{
    const loaded=await loadRecipe(path.resolve(file));
    if(share!==null){loaded.source.nativeHands={...(loaded.source.nativeHands||{}),twistShare:share};}
    const report={pageErrors:[]};
    const scene=await openScene(loaded,{size:64,theme,report});browser=scene.browser;const page=scene.page;
    const setup=await page.evaluate(()=>{
      const v=flareInspector.viewer,T=__toonT;v.motion.reset();v.coach.updateMatrixWorld(true);
      const W=o=>o.getWorldQuaternion(new T.Quaternion()),P=o=>o.getWorldPosition(new T.Vector3());
      const st={sides:{},cap:null};
      const meshes=[];v.scene.traverse(o=>{if(o.isSkinnedMesh&&o.visible)meshes.push(o);});
      for(const s of ['left','right']){
        const ua=v.coach.getObjectByName(s+'UpperArm'),fa=v.coach.getObjectByName(s+'Forearm'),h=v.coach.getObjectByName(s+'Hand');
        if(!ua||!fa||!h){st.sides[s]=null;continue;}
        const e=P(fa),wq=P(h),L=wq.distanceTo(e),ax=wq.clone().sub(e).normalize();
        const restLocal=fa.quaternion.clone();const Fr=W(ua).multiply(restLocal);const Fri=Fr.clone().invert();
        const aL=ax.clone().applyQuaternion(W(fa).invert()).normalize();const ref=Math.abs(aL.x)<0.9?new T.Vector3(1,0,0):new T.Vector3(0,0,1);
        const b1=new T.Vector3().crossVectors(aL,ref).normalize(),b2=new T.Vector3().crossVectors(aL,b1);
        // pick the skinned mesh with most forearm-dominant verts
        let best=null;
        for(const m of meshes){const g=m.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;if(!si)continue;
          const bi=m.skeleton.bones.indexOf(fa);if(bi<0)continue;const idx=[];
          for(let i=0;i<si.count;i++){let w=0;for(let k=0;k<4;k++)if(si.getComponent(i,k)===bi)w+=sw.getComponent(i,k);if(w>=0.35)idx.push(i);}
          if(!best||idx.length>best.idx.length)best={m,idx};}
        const verts=[];
        if(best){const p=new T.Vector3();const step=Math.max(1,Math.floor(best.idx.length/600));
          for(let j=0;j<best.idx.length;j+=step){const i=best.idx[j];best.m.getVertexPosition(i,p);p.applyMatrix4(best.m.matrixWorld);
            const d=p.clone().sub(e),t=d.dot(ax)/L;if(t<0.05||t>0.95)continue;const r=d.clone().sub(ax.clone().multiplyScalar(d.dot(ax)));if(r.length()<0.008)continue;
            const lp=d.clone().applyQuaternion(Fri);verts.push({i,t,a0:Math.atan2(lp.dot(b2),lp.dot(b1))});}}
        st.sides[s]={ua,fa,h,restLocal,mesh:best?.m,verts,L,aL,b1,b2,axisDevDeg:aL.angleTo(new T.Vector3(0,1,0))*180/Math.PI};
      }
      const yAxis=new T.Vector3(0,1,0);
      const twistOf=(q,a)=>{let p=q.x*a.x+q.y*a.y+q.z*a.z,w=q.w;if(w<0){w=-w;p=-p;}return 2*Math.atan2(p,w)*180/Math.PI;};
      const decomp=(s,q)=>{const rel=s.restLocal.clone().invert().multiply(q);const a=s.aL,p=rel.x*a.x+rel.y*a.y+rel.z*a.z;const tw=new T.Quaternion(a.x*p,a.y*p,a.z*p,rel.w).normalize();const sw=rel.clone().multiply(tw.clone().invert());return {rel,tw,sw};};
      window.__elbowAudit={
        pre(){const o={};for(const [s,x] of Object.entries(st.sides)){if(!x){o[s]=null;continue;}o[s]={solved:twistOf(decomp(x,x.fa.quaternion).rel,x.aL)};}return o;},
        arm(){st.cap=null;},
        get(){return st.cap;},
      };
      const capture=()=>{if(st.cap)return;const o={};const p=new T.Vector3();
        for(const [s,x] of Object.entries(st.sides)){if(!x){o[s]=null;continue;}
          const {rel,sw}=decomp(x,x.fa.quaternion);const eff=twistOf(rel,x.aL);
          const swAng=2*Math.acos(Math.min(1,Math.abs(sw.w)))*180/Math.PI;const sa=new T.Vector3(sw.x,sw.y,sw.z);if(sw.w<0)sa.negate();const len=sa.length();
          const swingAxis=len>1e-6?sa.multiplyScalar(1/len).toArray():null;
          let me=[0,0],mw=[0,0],mx=0;
          if(x.mesh&&x.verts.length){x.ua.updateWorldMatrix(true,false);const F=W(x.ua).multiply(x.restLocal).multiply(sw);const Fi=F.invert();const e=P(x.fa);
            for(const vv of x.verts){x.mesh.getVertexPosition(vv.i,p);p.applyMatrix4(x.mesh.matrixWorld);const lp=p.sub(e).applyQuaternion(Fi);
              let d=(Math.atan2(lp.dot(x.b2),lp.dot(x.b1))-vv.a0)*180/Math.PI;while(d>180)d-=360;while(d<-180)d+=360;
              if(vv.t<=0.3){me[0]+=d;me[1]++;}else if(vv.t>=0.7){mw[0]+=d;mw[1]++;}}}
          o[s]={eff,swing:swAng,swingAxis,meshElbow:me[1]?me[0]/me[1]:null,meshWrist:mw[1]?mw[0]/mw[1]:null,nE:me[1],nW:mw[1]};}
        const ws=window.__wristTwistStats;o.applied=ws?{...ws.applied}:null;st.cap=o;};
      const ms=new Set(Object.values(st.sides).filter(Boolean).map(x=>x.mesh).filter(Boolean));
      for(const m of ms){const prev=m.onBeforeRender;m.onBeforeRender=function(...a){capture();return prev.apply(this,a);};}
      return {sides:Object.fromEntries(Object.entries(st.sides).map(([s,x])=>[s,x?{mesh:x.mesh?.name,verts:x.verts.length,L:x.L,axisDevDeg:x.axisDevDeg}:null])),
        share:window.__wristTwistShare??null,twistRuntime:!!window.__drill.__wristTwistR5};
    });
    const tBoot=(Date.now()-t0)/1000;const dur=loaded.source.timeline.duration,n=Math.max(8,Math.round(dur*hz));
    const rows=[];let warm=null;
    for(let i=0;i<=n;i++){const t=+(i*dur/n).toFixed(4);const r=await stageAt(page,loaded.source,t,warm);warm=r.x;
      const {pre,cap}=await page.evaluate(()=>{const pre=__elbowAudit.pre();__elbowAudit.arm();const v=flareInspector.viewer;v.renderer.render(v.scene,v.camera);return {pre,cap:__elbowAudit.get()};});
      rows.push({t,pre,cap});}
    const tSolve=(Date.now()-t0)/1000;
    const res={id,file:path.relative(process.cwd(),path.resolve(file)),hands:loaded.prepared.handSetup?.modes??null,handAdapter:loaded.prepared.handSetup?.adapter??null,
      twistShare:setup.share,twistRuntime:setup.twistRuntime,setup:setup.sides,
      nativeWristCorrective:!!loaded.prepared.recipe.nativeWristCorrective,fixedCorrectionStack:!!loaded.prepared.recipe.fixedCorrectionStack,
      corrective:loaded.corrective?.id??null,specFile:loaded.prepared.recipe.spec,duration:dur,hz,rows,pageErrors:report.pageErrors,sec:(Date.now()-t0)/1000,tBoot,tSolve};
    fs.writeFileSync(dest,JSON.stringify(res));
    console.log(id,'ok',res.sec.toFixed(1)+'s boot',tBoot.toFixed(1),JSON.stringify(setup.sides));
  }catch(e){console.log(id,'FAIL',String(e.stack||e).slice(0,400));fs.writeFileSync(path.join(out,id+'.fail.txt'),String(e.stack||e));}
  finally{try{await browser?.close();}catch{}}
}
