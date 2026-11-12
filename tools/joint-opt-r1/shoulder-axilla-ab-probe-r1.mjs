// Stage-B A/B probe for shoulder-axilla-r1 (copied from the stage-A / shoulder-census probes; read-only on the repo).
// node tools/joint-opt-r1/shoulder-axilla-ab-probe-r1.mjs --out RAW --plan plan.json [--skin] [--module tools/joint-opt-r1/shoulder-axilla-r1.mjs]
// per t: base capture (module absent); with --module: installed-disabled ("off"), enabled ("on"), disabled again ("offb"); same staged pose.
// Stage A read-only geometry probe. Uses the production recipe-scene chain (loadRecipe/openScene/stageAt)
// in headless chromium (SwiftShader, 64px). Geometry is read at the outermost scene.onAfterRender, i.e. inside
// every renderer wrapper (r5/r6 wrist twist, webxr wrist join, ankle r5 ...) before they restore.
// Stage-B copy of shoulder census probe2.mjs (adds skin dump + opt-in module A/B): same page setup and capture; frames come from a plan file instead of auto selection.
// Usage: node probe2.mjs --out <rawdir> --plan plan.json   (plan: {recipeId:[t,...]})
import fs from 'node:fs';import path from 'node:path';
const HUB=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');process.chdir(HUB);
const {loadRecipe,openScene,stageAt,freeGiB}=await import(HUB+'/tools/action-package-v3/recipe-scene.mjs');
const {loadTheme}=await import(HUB+'/drill-anim/lib/config.mjs');
const args=process.argv.slice(2);let out=null,planF=null;
for(let i=0;i<args.length;i++){if(args[i]==='--out')out=args[++i];else if(args[i]==='--plan')planF=args[++i];}
const plan=JSON.parse(fs.readFileSync(planF,'utf8'));const files=Object.keys(plan).map(id=>path.join(HUB,'catalog/production/remaining219-r1/recipes',id+'.json'));
fs.mkdirSync(out,{recursive:true});const theme=loadTheme();

const PAGE_SETUP=()=>{
  const v=flareInspector.viewer,T=__toonT;
  const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
  const role=o=>{if(/^WebXR_(Clipped_Hand|Wrist_Bridge)_/.test(o.name))return 'body';let inCoach=false;for(let p=o;p;p=p.parent)if(p===v.coach)inCoach=true;return inCoach?'body':'prop';};
  const meshes=[];v.scene.traverse(o=>{if(o.isMesh&&o.geometry?.attributes?.position&&visible(o)&&!(o.material?.isShadowMaterial))meshes.push(o);});
  const bones=new Map();v.coach.traverse(o=>{if(o.isBone&&!bones.has(o.name))bones.set(o.name,o);});
  const W=o=>o.getWorldQuaternion(new T.Quaternion()),P=o=>o.getWorldPosition(new T.Vector3());
  const JN=['UpperArm','Forearm','Hand','UpperLeg','LowerLeg','Foot','Shoulder'];
  const joints=[];for(const [n,b] of bones){if(/^v2p_/.test(n))continue;if(b.parent&&b!==v.coach)joints.push(n);}
  v.motion.reset();v.coach.updateMatrixWorld(true);
  const restRel={};for(const n of joints){const b=bones.get(n);restRel[n]=W(b.parent).invert().multiply(W(b));}
  const childAxis={};for(const n of joints){const b=bones.get(n);const c=b.children.find(x=>x.isBone&&!/^v2p_/.test(x.name))||b.children.find(x=>x.isBone&&/middle1$/.test(x.name));childAxis[n]=c?c.position.clone().normalize():new T.Vector3(0,1,0);}
  const st={armed:null,result:null,meshes,bones};
  function skinNormalMat(m,i,M){const si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight,bm=m.skeleton.boneMatrices,e=M.elements;e.fill(0);
    for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(!w)continue;const o=si.getComponent(i,k)*16;for(let j=0;j<16;j++)e[j]+=w*bm[o+j];}}
  function angles(){const o={};for(const n of joints){const b=bones.get(n);const rel=W(b.parent).invert().multiply(W(b));const d=restRel[n].clone().invert().multiply(rel);if(d.w<0)d.set(-d.x,-d.y,-d.z,-d.w);
      const a=childAxis[n],p=d.x*a.x+d.y*a.y+d.z*a.z;let tw=2*Math.atan2(p,d.w)*180/Math.PI;const tot=2*Math.acos(Math.min(1,d.w))*180/Math.PI;
      const twq=new T.Quaternion(a.x*p,a.y*p,a.z*p,d.w).normalize(),sw=d.clone().multiply(twq.invert());const swing=2*Math.acos(Math.min(1,Math.abs(sw.w)))*180/Math.PI;
      o[n]=[+tot.toFixed(2),+swing.toFixed(2),+tw.toFixed(2)];}
    const jp={};for(const n of joints)jp[n]=P(bones.get(n)).toArray().map(x=>+x.toFixed(5));return {ang:o,pos:jp};}
  function b64(f){const u=new Uint8Array(f.buffer,f.byteOffset,f.byteLength);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);}
  function geomDump(){const res=[];const p=new T.Vector3(),n=new T.Vector3(),M=new T.Matrix4(),S=new T.Matrix4(),N3=new T.Matrix3();
    for(const m of meshes){const g=m.geometry,cnt=g.attributes.position.count,pos=new Float32Array(cnt*3),nor=new Float32Array(cnt*3),na=g.attributes.normal;m.updateMatrixWorld(true);
      const nm=new T.Matrix3().getNormalMatrix(m.matrixWorld);
      if(m.isSkinnedMesh){m.skeleton.update();for(let i=0;i<cnt;i++){m.getVertexPosition(i,p).applyMatrix4(m.matrixWorld);pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z;
          if(na){skinNormalMat(m,i,M);S.copy(m.bindMatrixInverse).multiply(M).multiply(m.bindMatrix);N3.setFromMatrix4(S);n.fromBufferAttribute(na,i).applyMatrix3(N3).applyMatrix3(nm).normalize();nor[i*3]=n.x;nor[i*3+1]=n.y;nor[i*3+2]=n.z;}}}
      else{for(let i=0;i<cnt;i++){p.fromBufferAttribute(g.attributes.position,i).applyMatrix4(m.matrixWorld);pos[i*3]=p.x;pos[i*3+1]=p.y;pos[i*3+2]=p.z;if(na){n.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();nor[i*3]=n.x;nor[i*3+1]=n.y;nor[i*3+2]=n.z;}}}
      res.push({name:m.name||m.uuid.slice(0,8),pos:b64(pos),nor:b64(nor)});}
    return res;}
  const prevAfter=v.scene.onAfterRender;
  v.scene.onAfterRender=function(...a){prevAfter?.apply(this,a);if(!st.armed)return;const mode=st.armed;st.armed=null;
    const r={phase:'scene.onAfterRender',...angles(),boneWorld:window.__stageA.boneWorld(),axilla:window.__shoulderAxillaR1?.last?JSON.parse(JSON.stringify(window.__shoulderAxillaR1.last)):null,twistStats:window.__wristTwistStats?JSON.parse(JSON.stringify(window.__wristTwistStats.applied)):null,webxr:window.__webxrWristJoin?.last?JSON.parse(JSON.stringify(window.__webxrWristJoin.last)):null};
    if(mode==='geom')r.geom=geomDump();st.result=r;};
  window.__stageA={st,capture(mode){st.result=null;st.armed=mode;v.renderer.render(v.scene,v.camera);if(!st.result)throw Error('onAfterRender not reached');
      const r=st.result;r.restore=window.__webxrWristJoin?.lastRestoreCheck?{p:window.__webxrWristJoin.lastRestoreCheck.positionsNormalsExact,b:window.__webxrWristJoin.lastRestoreCheck.boneTransformsExact,c:window.__webxrWristJoin.lastRestoreCheck.cacheExact}:null;return r;},
    topology(){return meshes.map(m=>{const g=m.geometry,idx=g.index?Array.from(g.index.array):null;let dom=null;
      if(m.isSkinnedMesh){const si=g.attributes.skinIndex,sw=g.attributes.skinWeight;dom=new Array(g.attributes.position.count);for(let i=0;i<dom.length;i++){let bw=-1,bi=0;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;bi=si.getComponent(i,k);}}dom[i]=m.skeleton.bones[bi].name;}}
      else if(/^WebXR_Clipped_Hand_(\w+)/.test(m.name))dom=null;
      return {name:m.name||m.uuid.slice(0,8),type:m.type,role:role(m),n:g.attributes.position.count,index:idx,drawRange:[g.drawRange.start,g.drawRange.count],groups:g.groups.map(x=>[x.start,x.count,x.materialIndex]),materials:(Array.isArray(m.material)?m.material:[m.material]).map(x=>x.name||x.type),domBone:dom,parent:m.parent?.name};});},
    skinDump(){const out=[];for(const m of meshes){if(!m.isSkinnedMesh)continue;const g=m.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
        out.push({name:m.name,bones:m.skeleton.bones.map(b=>b.name),si:b64(new Float32Array(si.array)),sw:b64(new Float32Array(sw.array)),bind:m.bindMatrix.elements.slice(),bindInv:m.bindMatrixInverse.elements.slice(),boneInv:m.skeleton.boneInverses.map(x=>x.elements.slice()),restPos:b64(new Float32Array(g.attributes.position.array))});}return out;},
    boneWorld(){const o={};for(const [n,b] of bones)o[n]=b.matrixWorld.elements.slice();return o;},
    joints,boneNames:[...bones.keys()],
    hooks:{r5:!!__drill.__wristTwistR5,r6:!!__drill.__wristTwistR6,webxr:!!window.__webxrWristJoin,ankleR5:!!window.__ankleJoinR5,contourR3:!!window.__upperArmContourR3,fixedR1:!!window.__fixedWristCorrectionsR1,elbowDqs:!!window.__elbowDqsR1,nativeWristCorrective:!!window.__wristCorrective?.active,share:window.__wristTwistShare??null}};
  return {joints,boneNames:[...bones.keys()],hooks:window.__stageA.hooks,meshes:meshes.map(m=>m.name)};
};


const decode=s=>Buffer.from(s,'base64');
// Usage: node probe3.mjs --out RAW --plan plan.json [--module file.mjs --opts '{}'] [--skin]
// Captures per t: base (module not installed). With --module: module installed disabled -> 'off', enabled -> 'on' (same staged pose).
const args2=process.argv.slice(2);let modF=null,opts={},skin=false;
for(let i=0;i<args2.length;i++){if(args2[i]==='--module')modF=args2[++i];else if(args2[i]==='--opts')opts=JSON.parse(args2[++i]);else if(args2[i]==='--skin')skin=true;}
for(const file of files){
  const id=path.basename(file,'.json'),dir=path.join(out,id);if(fs.existsSync(path.join(dir,'done.json'))){console.log('skip',id);continue;}
  if(freeGiB()<1.5){console.error('low memory, stop');break;}
  fs.mkdirSync(dir,{recursive:true});const t0=Date.now();let browser;
  try{
    const loaded=await loadRecipe(path.resolve(file));const report={pageErrors:[]};
    const sc=await openScene(loaded,{size:64,theme,report});browser=sc.browser;const page=sc.page;
    page.on('crash',()=>console.error('PAGE CRASH'));
    const setup=await page.evaluate(PAGE_SETUP);
    const topo=await page.evaluate(()=>__stageA.topology());fs.writeFileSync(path.join(dir,'topology.json'),JSON.stringify(topo));
    if(skin){const sd=await page.evaluate(()=>__stageA.skinDump());for(const m of sd){for(const k of ['si','sw','restPos']){fs.writeFileSync(path.join(dir,`skin__${m.name}.${k}`),decode(m[k]));delete m[k];}}fs.writeFileSync(path.join(dir,'skin.json'),JSON.stringify(sd));}
    const src=loaded.source,fps=loaded.prepared.recipe.output?.fps??30;
    const save=(tag,r)=>{const g=r.geom;delete r.geom;for(const m of g){fs.writeFileSync(path.join(dir,`${tag}__${m.name}.pos`),decode(m.pos));fs.writeFileSync(path.join(dir,`${tag}__${m.name}.nor`),decode(m.nor));}return r;};
    const capRest=()=>page.evaluate(()=>{const v=flareInspector.viewer;v.motion.reset();v.coach.updateMatrixWorld(true);return __stageA.capture('geom');});
    const restMeta=save('rest',await capRest());
    const times=[...plan[id]].sort((a,b)=>a-b);const frames=[];let warm=null;
    for(const t of times){const s=await stageAt(page,src,t,warm);warm=s.x;const r=save('t'+t.toFixed(4),await page.evaluate(()=>__stageA.capture('geom')));frames.push({t,frame:Math.round(t*fps),why:'stageB-plan',warn:s.warn,camera:s.camera,...r});}
    let modSetup=null;const variants={};
    if(modF){
      const mod=await import(path.resolve(modF));modSetup=await mod.install(page,{...opts,enabled:false});
      variants.restOff=save('restoff',await capRest());
      await page.evaluate(()=>{__shoulderAxillaR1.enabled=true;});variants.restOn=save('reston',await capRest());await page.evaluate(()=>{__shoulderAxillaR1.enabled=false;});
      warm=null;variants.frames=[];
      for(const t of times){const s=await stageAt(page,src,t,warm);warm=s.x;
        const off=save('off'+t.toFixed(4),await page.evaluate(()=>__stageA.capture('geom')));
        await page.evaluate(()=>{__shoulderAxillaR1.enabled=true;});
        const on=save('on'+t.toFixed(4),await page.evaluate(()=>__stageA.capture('geom')));
        await page.evaluate(()=>{__shoulderAxillaR1.enabled=false;});
        const off2=save('offb'+t.toFixed(4),await page.evaluate(()=>__stageA.capture('geom')));
        variants.frames.push({t,off:{restore:off.restore,axilla:off.axilla},on:{restore:on.restore,axilla:on.axilla,pos:on.pos},offAfter:{restore:off2.restore}});}
    }
    const cam=await page.evaluate(()=>{const c=flareInspector.viewer.camera;return {fov:c.fov,aspect:c.aspect,near:c.near,far:c.far,proj:c.projectionMatrix.elements.slice(),world:c.matrixWorld.elements.slice()};});
    const meta={id,file,spec:loaded.prepared.recipe.spec,specSha256Lf:loaded.prepared.recipe.specSha256Lf,model:loaded.adapter.profile+'@'+loaded.adapter.version,
      handSetup:loaded.prepared.handSetup,jointCorrections:loaded.prepared.recipe.jointCorrections,fixedCorrectionStack:loaded.prepared.recipe.fixedCorrectionStack??null,wristTwistRuntime:loaded.prepared.recipe.wristTwistRuntime??null,
      setup,fps,coarse:[],frames,rest:restMeta,camera:cam,pageErrors:report.pageErrors,actualRuntime:report.actualRuntime,modSetup,variants,sec:(Date.now()-t0)/1000};
    fs.writeFileSync(path.join(dir,'meta.json'),JSON.stringify(meta));fs.writeFileSync(path.join(dir,'done.json'),'{}');
    console.log('ok',id,meta.sec,'s',times.length,'frames');
  }catch(e){console.error('FAIL',id,e.message.slice(0,800));fs.writeFileSync(path.join(dir,'error.txt'),String(e.stack));}
  finally{if(browser)await browser.close().catch(()=>{});}
}
