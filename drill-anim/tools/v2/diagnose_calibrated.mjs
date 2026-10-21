// Three contact candidates share one loaded canonical model and one compiled shader set.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL,fileURLToPath}from'node:url';
import{sourceFingerprint}from'./source-fingerprint.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const ri=process.argv.indexOf('--root');if(ri<0)throw new Error('Pass an explicit --root for this diagnostic');
const root=path.resolve(process.argv[ri+1]),temp=path.join(root,'work/browser-temp');fs.mkdirSync(temp,{recursive:true});
process.env.TEMP=temp;process.env.TMP=temp;process.env.TMPDIR=temp;
const[{boot},{loadTheme},{applyHumanV2plus},{resolveModelSpec}]=await Promise.all([import('../../lib/boot.mjs'),import('../../lib/config.mjs'),import('../../lib/human-v2plus.mjs'),import('../../lib/model-profile.mjs')]);
const jobs=[['glute-max-A','glute-max-A.js',63],['h-catcow-quad','h-catcow-quad.js',39],['s-frog','s-frog-r2.js',114]];
const prepared=[];for(const[id,name,peak]of jobs){const file=path.join(repo,'drill-anim/specs',name),source=(await import(pathToFileURL(file))).default;
  const spec=resolveModelSpec({...source,size:1080,fps:30},{profile:'current',skin:'realistic'});
  if(id!=='s-frog')spec.v2plus.handPose={left:'palm-floor',right:'palm-floor'};
  prepared.push({id,peak,spec,file,frozen:sourceFingerprint(repo,file)});}
const theme=loadTheme(),{b,p}=await boot({size:1080,pr:1,theme});let errors=[];
p.on('console',m=>{if(m.type()==='error'&&/Shader Error|not compiled|VALIDATE_STATUS/.test(m.text()))errors.push(m.text());});
const write=(folder,name,data)=>{fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,name),JSON.stringify(data,null,2)+'\n');};
async function capture(folder,spec,frames,layers){let warm=null;const rows=[];
  for(const f of frames){const r=await p.evaluate(([s,f,w,ls])=>__v2Layers.capture(s,f/30,f,w,ls),[spec,f,warm,layers]);warm=r.metrics.x;
    if(errors.length)throw new Error(errors[0]);for(const l of layers){const d=path.join(folder,l);fs.mkdirSync(d,{recursive:true});
      fs.writeFileSync(path.join(d,`${{body:'m',highlight:'k',shadow:'s'}[l]}-${String(f).padStart(4,'0')}.png`),Buffer.from(r[l].split(',')[1],'base64'));}
    rows.push({frame:f,time:f/30,...r.metrics});console.log(JSON.stringify({event:'candidate-frame',folder,frame:f,hands:r.metrics.visibleSurface.hands,elbow:r.metrics.elbow,locked:r.metrics.locked}));
  }write(folder,'metrics.json',rows);return rows;
}
try{
  await applyHumanV2plus(p,prepared[0].spec);await p.addScriptTag({content:fs.readFileSync(path.join(here,'browser-layers.js'),'utf8')});
  for(const job of prepared){const folder=path.join(root,'qa/preview/realistic',job.id),frames=[0,job.peak,120,239,240];
    await p.evaluate(([s,th])=>{for(const o of __props.list)o.parent?.remove(o);__props.list=[];
      __setHighlight(s.highlight);__toonUni.uSinkK.value=s.clothSink??1;for(const pr of s.props||[])__props.add(th,pr);__drill.setupCamera(s,1080);},[job.spec,theme]);
    const baseline=await capture(path.join(folder,'baseline'),job.spec,frames,['body']);
    const oldMin=Object.fromEntries(['left','right'].map(side=>[side,Math.min(...baseline.map(m=>m.visibleSurface.hands[side].minY))]));
    const result=await p.evaluate(([source,mins,id])=>{const s=structuredClone(source),report={planeY:0,epsilon:.0005,oldMin:mins,hands:{}};
      for(const side of ['left','right']){const h=s.pose.base.hands[side],raise=.0005-mins[side];
        if(id==='s-frog'){s.pose.base.hands[side]={...h,palmAt:[h.palmAt[0],h.palmAt[1]+raise,h.palmAt[2]]};report.hands[side]={raise,descriptor:s.pose.base.hands[side]};}
        else{const finger=[h.finger[0],0,h.finger[1]],q=__drill.handQ(side,new __toonT.Vector3(...finger),new __toonT.Vector3(0,-1,0));
          const mn=Math.min(...__drill.handPts[side].map(p=>p.clone().applyQuaternion(q).y));
          const old=flareInspector.viewer.motion.getGroundHandPose(side,finger,[h.at[0],0,h.at[1]]),desired=old.wrist[1]+raise;
          s.pose.base.hands[side]={...h,mode:'fingertips',finger,normal:[0,-1,0],floor:0,clear:desired+mn,relax:0};
          report.hands[side]={raise,mn,oldWrist:old.wrist,desiredWristY:desired,descriptor:s.pose.base.hands[side]};}
      }
      if(id==='h-catcow-quad'){const c=s.pose.base.constraints.find(c=>c.joint==='shoulderCenter'&&c.axis?.[1]===1),old=c.value;
        c.value+=(report.hands.left.raise+report.hands.right.raise)/2;report.shoulderY={old,value:c.value};}
      return{spec:s,report};},[job.spec,oldMin,job.id]);
    const candidate=await capture(path.join(folder,'candidate'),result.spec,frames,['body','highlight','shadow']);
    const changes=candidate.map((m,i)=>({frame:m.frame,joints:Object.fromEntries(Object.keys(m.J).filter(k=>Array.isArray(m.J[k])&&Array.isArray(baseline[i].J[k]))
      .map(k=>[k,{baseline:baseline[i].J[k],candidate:m.J[k],distanceMetres:Math.hypot(...m.J[k].map((x,j)=>x-baseline[i].J[k][j]))}]))}));
    if(sourceFingerprint(repo,job.file).sha256!==job.frozen.sha256)throw new Error('Contact experiment sources changed mid-run');
    write(folder,'source-manifest.json',job.frozen);write(folder,'resolved-candidate-spec.json',result.spec);write(folder,'calibration.json',result.report);write(folder,'joint-changes.json',changes);
    console.log(JSON.stringify({event:'candidate-done',id:job.id,folder,calibration:result.report}));
  }
}finally{await b.close();}
