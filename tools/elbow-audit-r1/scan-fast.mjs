// Fast elbow/forearm axial-twist screen r1: ONE page (armfix-r2 booted once), every recipe's prepared spec solved
// sequentially with __drill.applyAt. Forearm long axis = forearm->hand direction in forearm-local (the rig's bones do
// NOT point down +Y here: measured 93 deg off), the same axis the hands-native r5 wrist-twist runtime uses.
// The runtime's per-render transfer (forearm += twistShare * hand roll, hand compensates) is replicated with each
// spec's own twistShare, then forearm skin vertices (V2P_Base_Limbs, forearm weight >= 0.35) are CPU-skinned.
// Limits: per-recipe action correctives / fixed-hand adapters / joint correctives are not installed (bone solve is the
// spec's own); shader correctives are not in CPU skinning. Top suspects are re-checked with the full chain (scan.mjs).
// Usage: node scan-fast.mjs --out file.json [--hz 6] [--share x] recipe.json ...
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadRecipe} from '../action-package-v3/recipe-scene.mjs';
import {REPO} from '../action-completion-v3-r2/render-finalization-r8.mjs';

const args=process.argv.slice(2);let out=null,hz=6,share=null;const files=[];
for(let i=0;i<args.length;i++){if(args[i]==='--out')out=args[++i];else if(args[i]==='--hz')hz=Number(args[++i]);else if(args[i]==='--share')share=Number(args[++i]);else files.push(args[i]);}
const done=fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')):{};
const todo=files.filter(f=>!done[path.basename(f,'.json')]);
if(!todo.length){console.log('nothing to do');process.exit(0);}
const loadedAll=[];for(const f of todo){try{loadedAll.push({f,l:await loadRecipe(path.resolve(f))});}catch(e){done[path.basename(f,'.json')]={error:String(e).slice(0,300)};}}
const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
const first=loadedAll[0].l;
const model=await import(pathToFileURL(path.join(REPO,first.adapter.loader)));await model.verify();
const opened=await model.boot({size:64,pr:1,theme:loadTheme()});const browser=opened.b,page=opened.p;
const t0=Date.now();
try{
  const base=JSON.parse(JSON.stringify(first.source));delete base.nativeHands;
  await model.applyV3(page,base);
  const rig=await page.evaluate(()=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};v.motion.reset();
    const T=__toonT;v.coach.updateMatrixWorld(true);
    const W=o=>o.getWorldQuaternion(new T.Quaternion()),P=o=>o.getWorldPosition(new T.Vector3());
    const mesh=v.coach.getObjectByName('V2P_Base_Limbs')||(()=>{let m;v.scene.traverse(o=>{if(!m&&o.isSkinnedMesh&&o.name.includes('Limb'))m=o;});return m;})();
    const S={};
    for(const s of ['left','right']){
      const ua=v.coach.getObjectByName(s+'UpperArm'),fa=v.coach.getObjectByName(s+'Forearm'),h=v.coach.getObjectByName(s+'Hand');
      const e=P(fa),wq=P(h),L=wq.distanceTo(e),ax=wq.clone().sub(e).normalize();
      const restLocal=fa.quaternion.clone(),restHand=W(fa).invert().multiply(W(h));
      const aL=ax.clone().applyQuaternion(W(fa).invert()).normalize();const ref=Math.abs(aL.x)<0.9?new T.Vector3(1,0,0):new T.Vector3(0,0,1);
      const b1=new T.Vector3().crossVectors(aL,ref).normalize(),b2=new T.Vector3().crossVectors(aL,b1);
      const Fri=W(ua).multiply(restLocal).invert();
      const g=mesh.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bi=mesh.skeleton.bones.indexOf(fa);const idx=[];
      for(let i=0;i<si.count;i++){let w=0;for(let k=0;k<4;k++)if(si.getComponent(i,k)===bi)w+=sw.getComponent(i,k);if(w>=0.35)idx.push(i);}
      const verts=[],p=new T.Vector3();const step=Math.max(1,Math.floor(idx.length/240));
      for(let j=0;j<idx.length;j+=step){const i=idx[j];mesh.getVertexPosition(i,p);p.applyMatrix4(mesh.matrixWorld);const d=p.clone().sub(e),t=d.dot(ax)/L;
        if(t<0.03||t>0.97)continue;const r=d.clone().sub(ax.clone().multiplyScalar(d.dot(ax)));if(r.length()<0.008)continue;const lp=d.applyQuaternion(Fri);verts.push({i,t,a0:Math.atan2(lp.dot(b2),lp.dot(b1))});}
      S[s]={ua,fa,h,restLocal,restHand,aL,b1,b2,verts};
    }
    const tw=(q,a)=>{let p=q.x*a.x+q.y*a.y+q.z*a.z,w=q.w;if(w<0){w=-w;p=-p;}return 2*Math.atan2(p,w);};
    window.__EA={S,mesh,tw,W,P};
    return Object.fromEntries(Object.entries(S).map(([k,x])=>[k,{aL:x.aL.toArray(),verts:x.verts.length}]));
  });
  for(const {f,l} of loadedAll){
    const id=path.basename(f,'.json');const s=l.source;const sh=share??(s.nativeHands?.twistShare??0.5);const wtr=l.prepared.recipe.wristTwistRuntime;const cap=wtr?.version==='r6'?(wtr.capDeg??40):null;
    const dur=s.timeline.duration,n=Math.max(8,Math.round(dur*hz));const times=Array.from({length:n+1},(_,i)=>+(i*dur/n).toFixed(4));
    try{
      const rows=await page.evaluate(([s,times,sh,cap])=>{const last={};
        const v=flareInspector.viewer,E=__drill,T=__toonT,{S,mesh,tw,W,P}=__EA;
        E.selectModelProfile?.(s);v.motion.reset();let warm=null;const rows=[];const p=new T.Vector3();
        for(const t of times){const r=E.applyAt(s,t,warm);warm=r.x;v.coach.updateMatrixWorld(true);const o={t};
          const saved=[];
          for(const [side,x] of Object.entries(S)){
            const relS=x.restLocal.clone().invert().multiply(x.fa.quaternion);const solved=tw(relS,x.aL);
            const qf=W(x.fa),qh=W(x.h),d=x.restHand.clone().invert().multiply(qf.clone().invert().multiply(qh));
            let th=2*Math.atan2(d.x*x.aL.x+d.y*x.aL.y+d.z*x.aL.z,d.w);if(th>Math.PI)th-=2*Math.PI;if(th<-Math.PI)th+=2*Math.PI;
            if(cap!==null){if(last[side]!==undefined){while(th-last[side]>Math.PI)th-=2*Math.PI;while(th-last[side]<-Math.PI)th+=2*Math.PI;}last[side]=th;}
            const phi=cap===null?sh*th:Math.max(-cap*Math.PI/180,Math.min(cap*Math.PI/180,sh*th));saved.push([x.fa,x.fa.quaternion.clone()],[x.h,x.h.quaternion.clone()]);
            x.fa.quaternion.multiply(new T.Quaternion().setFromAxisAngle(x.aL,phi));x.fa.updateMatrixWorld(true);
            const qp=W(x.h.parent);x.h.quaternion.copy(qp.invert().multiply(qh));x.h.updateMatrixWorld(true);
            const rel=x.restLocal.clone().invert().multiply(x.fa.quaternion);const eff=tw(rel,x.aL);
            const a=x.aL,pp=rel.x*a.x+rel.y*a.y+rel.z*a.z;const twq=new T.Quaternion(a.x*pp,a.y*pp,a.z*pp,rel.w).normalize();const swq=rel.clone().multiply(twq.clone().invert());
            const flex=2*Math.acos(Math.min(1,Math.abs(swq.w)));const sa=new T.Vector3(swq.x,swq.y,swq.z);if(swq.w<0)sa.negate();
            const ua0=P(x.ua),fa0=P(x.fa),h0=P(x.h);const elbowDeg=fa0.clone().sub(ua0).angleTo(h0.clone().sub(fa0))*57.2958;
            o[side]={elbowDeg,q:x.fa.quaternion.toArray().map(z=>+z.toFixed(6)),solved:solved*57.2958,theta:th*57.2958,eff:eff*57.2958,flex:flex*57.2958,swingAxis:sa.length()>1e-6?sa.normalize().toArray().map(z=>+z.toFixed(4)):null,_x:x,_sw:swq};
          }
          v.coach.updateMatrixWorld(true);mesh.skeleton.update();
          for(const side of Object.keys(S)){const x=S[side],F=W(x.ua).multiply(x.restLocal).multiply(o[side]._sw).invert(),e=P(x.fa);
            const bins=[[0,0],[0,0],[0,0]];// elbow t<=.3, mid, wrist t>=.7
            for(const vv of x.verts){mesh.getVertexPosition(vv.i,p);p.applyMatrix4(mesh.matrixWorld);const lp=p.sub(e).applyQuaternion(F);
              let d=(Math.atan2(lp.dot(x.b2),lp.dot(x.b1))-vv.a0)*57.2958;while(d>180)d-=360;while(d<-180)d+=360;const b=vv.t<=0.3?0:vv.t>=0.7?2:1;bins[b][0]+=d;bins[b][1]++;}
            o[side].meshElbow=bins[0][1]?bins[0][0]/bins[0][1]:null;o[side].meshMid=bins[1][1]?bins[1][0]/bins[1][1]:null;o[side].meshWrist=bins[2][1]?bins[2][0]/bins[2][1]:null;
            delete o[side]._x;delete o[side]._sw;}
          for(const [b,q] of saved)b.quaternion.copy(q);v.coach.updateMatrixWorld(true);
          rows.push(o);}
        return rows;},[s,times,sh,cap]);
      done[id]={id,rig,wristTwist:cap===null?'r5':'r6',capDeg:cap,file:path.relative(REPO,path.resolve(f)),spec:l.prepared.recipe.spec,share:sh,hands:l.prepared.handSetup?.modes??null,handAdapter:l.prepared.handSetup?.adapter??null,
        corrective:l.corrective?.id??null,nativeWristCorrective:!!l.prepared.recipe.nativeWristCorrective,fixedCorrectionStack:!!l.prepared.recipe.fixedCorrectionStack,duration:dur,hz,rows};
    }catch(e){done[id]={id,error:String(e).slice(0,300)};}
    fs.writeFileSync(out,JSON.stringify(done));
    console.log(id,done[id].error?'FAIL '+done[id].error:'ok',((Date.now()-t0)/1000).toFixed(0)+'s');
    if(process.env.EA_BUDGET&&(Date.now()-t0)/1000>Number(process.env.EA_BUDGET))break;
  }
}finally{await browser.close();}
