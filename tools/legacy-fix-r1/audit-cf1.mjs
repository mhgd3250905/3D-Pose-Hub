// [legacy-fix-r1 b2] Copy of tools/legacy-audit-r1/audit.mjs + one opt-in switch: --crotchfix on applies the V5 crotch weight patch
// (tools/v5/runtime/crotchfix-v5-r1.js + model/crotchfix-v5-r1.weights.json) right after installV5. Without --crotchfix (or with off) it
// measures exactly like audit.mjs. Result JSON gains crotchfix:{...} when on.
// Legacy action accuracy audit r1 (2026-11-21, sandbox only). Measures one recipe on the V5 body exactly as tools/v5/render-masters-v5.mjs
// installs it (same modules / model / pose transfer as tools/flare2-moves-r3/check.mjs, from which the install block is copied), and dumps
// per sampled frame what tools/legacy-audit-r1/analyze.py needs. Writes nothing into the repository.
//   node tools/legacy-audit-r1/audit.mjs --recipe <recipe.json> --out <json> [--stride 8] [--frames 0,60] [--render 0,60 --png-dir d --size 300]
// Per sample: V5 bone world positions J + world quaternions Q (bind world rotations are identity, so Q is the rotation from bind),
// hub joints H, per-region lowest vertex (mm above the standing floor = mat top at mat.at.y, see check.mjs r3 note), floor contact cells
// (2 cm grid of body vertices within 15 mm of the floor), foot sole heel/fore lowest heights, crotch/groin mesh metrics, elbow twist.
// Views: --views as check.mjs ('front:0,0.15,1;side:1,0.15,0;top:0,1,0.001:0,0,-1'), camera aimed at the body centre.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipe,openScene,stageAt,fail,freeGiB} from '../action-package-v3/recipe-scene.mjs';
import {loadTheme} from '../../drill-anim/lib/config.mjs';
const SELF=fileURLToPath(import.meta.url),HERE=path.dirname(SELF),REPO=path.resolve(HERE,'../..');
const RT=path.join(REPO,'tools/v5/runtime');
const MODULES=['vendor/meshopt_decoder.module.js','wristfix-r2.js','toon-r6.js','v5-hub.js'];
const MODEL='model/coach-v3r3-wristfix.glb';
const EXT=path.join(REPO,'tools/flare2-moves-r3/v5/v5r2-ext.js');
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d;};
const recipeFile=path.resolve(opt('--recipe')),stride=+opt('--stride',8),size=+opt('--size',300),outFile=opt('--out');
const CF=(opt('--crotchfix','off')==='on');const CF_PATCH=path.join(RT,'model/crotchfix-v5-r1.weights.json');
let renderFrames=(opt('--render','')||'').split(',').filter(Boolean).map(Number);const pngDir=opt('--png-dir'),renderFrac=(opt('--render-frac','')||'').split(',').filter(Boolean).map(Number);
// view = name:dir[:up[:bone,radiusM,dyM]] (4th part = close-up on that V5 bone, e.g. crotch 'cr:0,-0.3,1:0,1,0:pelvis,0.22,-0.08')
const views=(opt('--views','')||'').split(';').filter(Boolean).map(v=>{const [name,d,u,f]=v.split(':');const fo=f?f.split(','):null;return {name,dir:d.split(',').map(Number),up:u?u.split(',').map(Number):[0,1,0],focus:fo?{bone:fo[0],r:+fo[1],dy:+(fo[2]??0)}:null,pelvisFrame:/^p/.test(name)};});
const v5r2=s=>{const x=s.v5r2;if(x===undefined||x===null)return null;return {head:x.head??null,hands:x.hands??null,fps:30};};
const loaded=await loadRecipe(recipeFile);
const {prepared,source}=loaded,id=prepared.recipe.id,fps=30,N=Math.round(source.timeline.duration*fps);
if(renderFrac.length)renderFrames=[...new Set([...renderFrames,...renderFrac.map(x=>Math.min(N-1,Math.round(x*N/2)*2))])];
const report={pageErrors:[]};
const t0=Date.now();
const scene=await openScene(loaded,{size,theme:loadTheme(),report});const page=scene.page;const tl=m=>process.stderr.write(`[t+${((Date.now()-t0)/1000).toFixed(1)}s] ${m}\n`);tl('scene');
const res={id,recipe:path.relative(REPO,recipeFile),spec:prepared.recipe.spec,frames:N,duration:source.timeline.duration,stride,samples:[]};
try{
  const mods=Object.fromEntries(MODULES.map(m=>[m,fs.readFileSync(path.join(RT,m),'utf8')]));
  const r2opt=v5r2(source);if(r2opt)mods['v5r2-ext.js']=fs.readFileSync(EXT,'utf8');
  if(CF)mods['crotchfix-v5-r1.js']=fs.readFileSync(path.join(RT,'crotchfix-v5-r1.js'),'utf8');const cfPatch=CF?JSON.parse(fs.readFileSync(CF_PATCH,'utf8')):null;
  const glb=fs.readFileSync(path.join(RT,MODEL)).toString('base64');
  const s=source,o={scapulaShift:s.v5?.scapulaShift===true,headFlexDeg:s.v5?.headFlexDeg||0,noShadow:s.v5?.groundShadow===false,grip:s.v5?.grip??null,hubGrasp:s.v5?.hubGraspHands??null};
  res.crotchfix=await page.evaluate(async ({mods,glb,o,r2opt,cfPatch})=>{
    const src=await (await fetch('/src/viewer.js')).text(),O=location.origin;
    // each optimized dep with its own ?v= hash as viewer.js imports it (check.mjs assumes one hash for all)
    const vOf=f=>{const m=src.match(new RegExp(f.replace(/\./g,'\\.')+'\\?v=(\\w+)'));return m?m[1]:src.match(/three\.js\?v=(\w+)/)[1];};
    const dep=f=>O+'/node_modules/.vite/deps/'+f+'?v='+vOf(f);
    const map={'three':dep('three.js'),'three/addons/loaders/GLTFLoader.js':dep('three_addons_loaders_GLTFLoader__js.js'),'three/addons/GLTFLoader.js':dep('three_addons_loaders_GLTFLoader__js.js')};
    const url={};
    for(const [name,code] of Object.entries(mods)){
      const fixed=code.replace(/(from\s*|import\s*\(\s*)(['"])([^'"]+)\2/g,(m,pre,q,spec)=>{if(map[spec])return pre+q+map[spec]+q;const rel=spec.replace(/^\.\//,'');if(url[rel])return pre+q+url[rel]+q;throw Error('unknown import '+spec);});
      url[name]=URL.createObjectURL(new Blob([fixed],{type:'text/javascript'}));
    }
    const bin=Uint8Array.from(atob(glb),c=>c.charCodeAt(0)).buffer;
    const m=await import(url['v5-hub.js']);
    await m.installV5({glb:bin,...(o.scapulaShift?{scapulaShift:true}:{}),...(o.headFlexDeg?{headFlexDeg:o.headFlexDeg}:{}),...(o.noShadow?{groundShadow:false}:{}),...(o.grip?{grip:o.grip}:{}),...(o.hubGrasp?{hubGraspHands:o.hubGrasp}:{})});
    if(r2opt){const x=await import(url['v5r2-ext.js']);x.installR2(r2opt);}
    if(cfPatch){const c=await import(url['crotchfix-v5-r1.js']);return c.applyCrotchFixV5({root:window.__v5.root,patch:cfPatch});}
    return null;
  },{mods,glb,o,r2opt,cfPatch});tl('crotchfix '+JSON.stringify(res.crotchfix));
  tl('v5 installed');
  res.meshInfo=await page.evaluate(()=>{
    const T=window.__toonT,V=window.__v5;
    const region=b=>{if(!b)return 'other';if(/Hand|WristBend/.test(b))return /^left/.test(b)?'handL':'handR';if(/Forearm/.test(b))return /^left/.test(b)?'forearmL':'forearmR';
      if(/UpperArm/.test(b))return /^left/.test(b)?'upperArmL':'upperArmR';if(/Foot/.test(b))return /^left/.test(b)?'footL':'footR';if(/Shin|Patella/.test(b))return /^left/.test(b)?'shinL':'shinR';
      if(/Thigh/.test(b))return /^left/.test(b)?'thighL':'thighR';if(/head|neck/.test(b))return 'head';if(/pelvis/.test(b))return 'pelvis';return 'torso';};
    const meshes=[];V.root.traverse(o=>{if(o.isSkinnedMesh&&o.visible!==false&&!o.userData.__outline&&!o.userData.__eye)meshes.push(o);});
    const _v=new T.Vector3();
    const per=meshes.map(o=>{const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,n=g.attributes.position.count,reg=new Array(n);
      for(let i=0;i<n;i++){let bw=-1,bi=0;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;bi=si.getComponent(i,k);}}reg[i]=region(o.skeleton.bones[bi]?.name);}return {o,reg,n};});
    // bind-pose world positions (bindMatrix) + bind normals
    const B=V.bones,pelvis0=new T.Vector3();
    // pelvis bind world position: from boneInverses
    {const o=per[0].o,sk=o.skeleton,i=sk.bones.indexOf(B.pelvis);pelvis0.setFromMatrixPosition(sk.boneInverses[i].clone().invert());}
    const hipY=(()=>{const o=per[0].o,sk=o.skeleton;const y=n=>new T.Vector3().setFromMatrixPosition(sk.boneInverses[sk.bones.indexOf(B[n])].clone().invert());return {L:y('leftThigh'),R:y('rightThigh')};})();
    const hy=(hipY.L.y+hipY.R.y)/2,hx=Math.abs(hipY.L.x-hipY.R.x)/2;
    // crotch / groin set: below hip-joint height by 0..14 cm (+3 cm above), |x| within 0.8 hip half-width of the midline
    const CR=[];
    for(const p of per){const g=p.o.geometry,P=g.attributes.position,Nn=g.attributes.normal,idx=g.index;
      const sel=new Map();
      for(let i=0;i<p.n;i++){_v.fromBufferAttribute(P,i).applyMatrix4(p.o.bindMatrix);
        if(_v.y<hy+0.03&&_v.y>hy-0.14&&Math.abs(_v.x-pelvis0.x)<0.8*hx){const nb=Nn?new T.Vector3().fromBufferAttribute(Nn,i).transformDirection(p.o.bindMatrix):new T.Vector3();
          sel.set(i,{i,b:_v.clone().sub(pelvis0),n:nb,nbr:new Set()});}}
      if(idx){const a=idx.array;for(let t=0;t<a.length;t+=3){const q=[a[t],a[t+1],a[t+2]];for(let u=0;u<3;u++){const s=sel.get(q[u]);if(s){s.nbr.add(q[(u+1)%3]);s.nbr.add(q[(u+2)%3]);}}}}
      CR.push({p,sel:[...sel.values()].map(s=>({...s,nbr:[...s.nbr]}))});}
    // regional bump (r2 of the crotch measure): global list of groin vertices + neighbours within 4 cm (bind); bump = displacement of a
    // vertex along its bind normal minus the mean displacement of its 4 cm neighbourhood (thigh-driven motion is smooth over 4 cm, a lump is not)
    const GV=[];for(const c of CR)for(const s of c.sel)GV.push({p:c.p,i:s.i,b:s.b,n:s.n});
    {const cell=new Map(),key=(x,y,z)=>Math.floor(x/0.04)+','+Math.floor(y/0.04)+','+Math.floor(z/0.04);
      GV.forEach((g,k)=>{const q=key(g.b.x,g.b.y,g.b.z);(cell.get(q)||cell.set(q,[]).get(q)).push(k);});
      for(const g of GV){const nb=[];const cx=Math.floor(g.b.x/0.04),cy=Math.floor(g.b.y/0.04),cz=Math.floor(g.b.z/0.04);
        for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const L=cell.get((cx+a)+','+(cy+b)+','+(cz+c));if(L)for(const k of L){const h=GV[k];if(h!==g&&h.b.distanceToSquared(g.b)<0.0016)nb.push(k);}}
        g.nb=nb.length>24?nb.filter((_,j)=>j%Math.ceil(nb.length/24)===0):nb;}}
    // foot soles in bind: lowest 8 mm of each foot region; heel = back third along z, fore = front third
    const SOLE={};
    for(const side of ['footL','footR']){const L=[];for(const p of per){const P=p.o.geometry.attributes.position;for(let i=0;i<p.n;i++)if(p.reg[i]===side){_v.fromBufferAttribute(P,i).applyMatrix4(p.o.bindMatrix);L.push({p,i,y:_v.y,z:_v.z});}}
      const ymin=Math.min(...L.map(q=>q.y)),sole=L.filter(q=>q.y<ymin+0.008),z0=Math.min(...sole.map(q=>q.z)),z1=Math.max(...sole.map(q=>q.z)),dz=z1-z0;
      SOLE[side]={heel:sole.filter(q=>q.z<z0+dz/3),fore:sole.filter(q=>q.z>z1-dz/3),lenMm:+(dz*1000).toFixed(0)};}
    window.__la={per,CR,SOLE,region,GV};
    return {meshes:meshes.map(o=>({name:o.name,verts:o.geometry.attributes.position.count})),crotchVerts:CR.reduce((a,c)=>a+c.sel.length,0),hipY:hy,hipHalfW:hx,
      soleLenMm:{L:SOLE.footL.lenMm,R:SOLE.footR.lenMm},soleN:{heelL:SOLE.footL.heel.length,foreL:SOLE.footL.fore.length}};
  });
  await page.evaluate(()=>{
    const T=window.__toonT,V=window.__v5,{per,CR,SOLE,GV}=window.__la,_v=new T.Vector3();
    window.__laMeasure=(floorY)=>{
      const minY={},cells=new Map();
      for(const {o,reg,n} of per){o.skeleton.update();for(let i=0;i<n;i++){o.getVertexPosition(i,_v);_v.applyMatrix4(o.matrixWorld);const r=reg[i];
        if(minY[r]===undefined||_v.y<minY[r])minY[r]=_v.y;
        if(_v.y<floorY+0.015){const k=Math.round(_v.x/0.02)+','+Math.round(_v.z/0.02);const c=cells.get(k);if(!c||_v.y<c[1])cells.set(k,[+_v.x.toFixed(3),_v.y,+_v.z.toFixed(3),r]);}}}
      for(const k in minY)minY[k]=+((minY[k]-floorY)*1000).toFixed(1);
      const contact=[...cells.values()].map(c=>[c[0],c[2],+((c[1]-floorY)*1000).toFixed(1),c[3]]);
      const sole={};for(const side in SOLE)for(const part of ['heel','fore']){let mn=1e9;for(const q of SOLE[side][part]){q.p.o.getVertexPosition(q.i,_v);_v.applyMatrix4(q.p.o.matrixWorld);mn=Math.min(mn,_v.y);}sole[side+'_'+part]=+((mn-floorY)*1000).toFixed(1);}
      // crotch: displacement of each groin vertex in the pelvis frame vs its bind position; outward = along bind normal; spike =
      // |disp - mean neighbour disp| (local bump, mm)
      const Pw=V.bones.pelvis.matrixWorld,inv=Pw.clone().invert();let out={maxOut:-1e9,maxSpike:0,maxDisp:0,atOut:null,atSpike:null};
      for(const {p,sel} of CR){const D=new Map();for(const s of sel){p.o.getVertexPosition(s.i,_v);_v.applyMatrix4(p.o.matrixWorld).applyMatrix4(inv);D.set(s.i,_v.clone().sub(s.b));}
        for(const s of sel){const d=D.get(s.i),o2=d.dot(s.n);const dm=d.length();if(dm>out.maxDisp)out.maxDisp=dm;
          if(o2>out.maxOut){out.maxOut=o2;out.atOut=s.b.toArray().map(x=>+x.toFixed(3));}
          const nb=s.nbr.filter(j=>D.has(j));if(nb.length>=3){const m=new T.Vector3();for(const j of nb)m.add(D.get(j));m.multiplyScalar(1/nb.length);const sp=d.clone().sub(m).length();if(sp>out.maxSpike){out.maxSpike=sp;out.atSpike=s.b.toArray().map(x=>+x.toFixed(3));}}}}
      // midline crotch (bind |x| < 2 cm): front (bind z > 0) forward / downward displacement in the pelvis frame, back likewise (mm)
      let mf={fwd:-1e9,down:-1e9,lat:0,atF:null},mb={back:-1e9,down:-1e9};
      for(const {p,sel} of CR)for(const s of sel){if(Math.abs(s.b.x)>0.02)continue;p.o.getVertexPosition(s.i,_v);_v.applyMatrix4(p.o.matrixWorld).applyMatrix4(inv);const d=_v.clone().sub(s.b);
        if(s.b.z>0){if(d.z>mf.fwd){mf.fwd=d.z;mf.atF=s.b.toArray().map(x=>+x.toFixed(3));}mf.down=Math.max(mf.down,-d.y);mf.lat=Math.max(mf.lat,Math.abs(d.x));}
        else{mb.back=Math.max(mb.back,-d.z);mb.down=Math.max(mb.down,-d.y);}}
      out.mid={fwdMm:+(mf.fwd*1000).toFixed(1),downMm:+(mf.down*1000).toFixed(1),latMm:+(mf.lat*1000).toFixed(1),atF:mf.atF,backMm:+(mb.back*1000).toFixed(1),backDownMm:+(mb.down*1000).toFixed(1)};
      let bump={mm:-1e9,at:null,n:null};{const D=GV.map(g=>{g.p.o.getVertexPosition(g.i,_v);_v.applyMatrix4(g.p.o.matrixWorld).applyMatrix4(inv);return _v.clone().sub(g.b);});
        GV.forEach((g,k)=>{if(g.nb.length<6)return;const m=new T.Vector3();for(const j of g.nb)m.add(D[j]);m.multiplyScalar(1/g.nb.length);const v=D[k].clone().sub(m).dot(g.n);
          if(v>bump.mm){bump.mm=v;bump.at=g.b.toArray().map(x=>+x.toFixed(3));bump.n=g.n.toArray().map(x=>+x.toFixed(2));}});}
      out.bump={mm:+(bump.mm*1000).toFixed(1),at:bump.at,n:bump.n};
      const crotch={bump:out.bump,mid:out.mid,outMm:+(out.maxOut*1000).toFixed(1),spikeMm:+(out.maxSpike*1000).toFixed(1),dispMm:+(out.maxDisp*1000).toFixed(1),atOut:out.atOut,atSpike:out.atSpike};
      const B=V.bones,J={},Q={};
      for(const n of ['pelvis','spineLower','spineUpper','torso','neck','head','leftScapula','rightScapula','leftUpperArm','leftForearm','leftHand','rightUpperArm','rightForearm','rightHand','leftThigh','leftShin','leftFoot','rightThigh','rightShin','rightFoot']){
        J[n]=B[n].getWorldPosition(new T.Vector3()).toArray().map(x=>+x.toFixed(4));Q[n]=B[n].getWorldQuaternion(new T.Quaternion()).toArray().map(x=>+x.toFixed(5));}
      return {minY,contact,sole,crotch,J,Q};
    };
  });
  tl('precompute done');
  const props=source.props??[];
  const floorMats=props.filter(p=>p.type==='mat'&&!p.block);
  const matTop=floorMats.length?Math.max(...floorMats.map(p=>(p.at?.[1]??0))):0;
  res.floorY=matTop;res.props=props.map(p=>p.type==='mat'&&p.block?'block':p.type);
  const want=new Set(renderFrames);let warm=null;
  const only=opt('--frames');const frames=[];if(only)frames.push(...only.split(',').map(Number));else for(let f=0;f<N;f+=stride)frames.push(f);for(const f of renderFrames)if(!frames.includes(f))frames.push(f);frames.sort((a,b)=>a-b);
  if(pngDir)fs.mkdirSync(pngDir,{recursive:true});
  for(const f of frames){
    fail(freeGiB()>=.5,'Low free memory');
    const st=await stageAt(page,source,f/fps,warm);warm=st.x;
    const r=await page.evaluate(([fl,t,render])=>{window.__camPos=flareInspector.viewer.camera.position.clone();if(window.__v5r2)window.__v5r2.setTime(t);const d=window.__v5.pose();const m=window.__laMeasure(fl);const url=render?window.__v5.render():null;m.cam=window.__camPos.toArray().map(x=>+x.toFixed(3));return {d:{posErr:d.posErr,ang:d.angV5},m,url};},[matTop,f/fps,want.has(f)]);
    if(r.url&&pngDir)fs.writeFileSync(path.join(pngDir,`${String(f).padStart(4,'0')}-cam.png`),Buffer.from(r.url.split(',')[1],'base64'));
    if(want.has(f)&&pngDir)for(const vw of views){
      const url=await page.evaluate(([d,up,fc,pf])=>{const T=window.__toonT,V=window.__v5,c=flareInspector.viewer.camera;const P=[];
        for(const n of ['pelvis','torso','head','leftHand','rightHand','leftFoot','rightFoot','leftShin','rightShin','leftForearm','rightForearm'])P.push(V.bones[n].getWorldPosition(new T.Vector3()));
        const box=new T.Box3().setFromPoints(P);let cen=box.getCenter(new T.Vector3()),rad=box.getSize(new T.Vector3()).length()/2+0.22;
        if(fc){cen=V.bones[fc.bone].getWorldPosition(new T.Vector3());cen.y+=fc.dy;rad=fc.r;}
        const dir=(d[0]||d[1]||d[2])?new T.Vector3(...d).normalize():new T.Vector3(0,0,1),dist=rad/Math.tan(c.fov*Math.PI/360);const uu=new T.Vector3(...up);
        if(pf){const q=V.bones.pelvis.getWorldQuaternion(new T.Quaternion());let fz=new T.Vector3(0,0,1).applyQuaternion(q);fz.y=0;if(fz.length()<0.3){fz=new T.Vector3(0,1,0).applyQuaternion(q);fz.y=0;}fz.normalize();const yaw=Math.atan2(fz.x,fz.z);dir.applyAxisAngle(new T.Vector3(0,1,0),yaw);}
        if(d[0]===0&&d[1]===0&&d[2]===0){dir.copy(window.__camPos).sub(cen).normalize();}
        c.up.copy(uu);c.position.copy(cen).addScaledVector(dir,dist);c.lookAt(cen);c.updateMatrixWorld();const u=V.render();c.up.set(0,1,0);return u;},[vw.dir,vw.up,vw.focus,vw.pelvisFrame]);
      fs.writeFileSync(path.join(pngDir,`${String(f).padStart(4,'0')}-${vw.name}.png`),Buffer.from(url.split(',')[1],'base64'));
    }
    const H={};for(const n of ['leftKnee','rightKnee','leftAnkle','rightAnkle','leftToe','rightToe','leftHip','rightHip','leftWrist','rightWrist','leftPalm','rightPalm','pelvis','head'])H[n]=st.joints[n];
    res.samples.push({f,t:+(f/fps).toFixed(3),warn:st.warn?.length??0,posErr:r.d.posErr,ang:r.d.ang,H,...r.m});
  }
  res.pageErrors=report.pageErrors;res.seconds=+((Date.now()-t0)/1000).toFixed(1);
}finally{await scene.browser.close();}
if(outFile){fs.mkdirSync(path.dirname(path.resolve(outFile)),{recursive:true});fs.writeFileSync(outFile,JSON.stringify(res));}
console.log(JSON.stringify({id,frames:res.samples.length,seconds:res.seconds,meshInfo:res.meshInfo}));
