// dump V5 skinned mesh data once + bone world matrices per sampled frame (for offline LBS experiments)
import fs from 'node:fs';import path from 'node:path';
const REPO='/workspace/work/legacy-fix-wt';
const {loadRecipe,openScene,stageAt,fail,freeGiB}=await import(REPO+'/tools/action-package-v3/recipe-scene.mjs');
const {loadTheme}=await import(REPO+'/drill-anim/lib/config.mjs');
const RT=path.join(REPO,'tools/v5/runtime');
const MODULES=['vendor/meshopt_decoder.module.js','wristfix-r2.js','toon-r6.js','v5-hub.js'];
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf(k);return i>=0?args[i+1]:d;};
const recipeFile=path.resolve(opt('--recipe')),stride=+opt('--stride',10),outFile=opt('--out'),meshOut=opt('--mesh');
const MODEL=opt('--model','model/coach-v3r3-wristfix.glb');
const EXT=path.join(REPO,'tools/flare2-moves-r3/v5/v5r2-ext.js');
const v5r2=s=>{const x=s.v5r2;if(x===undefined||x===null)return null;return {head:x.head??null,hands:x.hands??null,fps:30};};
const loaded=await loadRecipe(recipeFile);const {prepared,source}=loaded,id=prepared.recipe.id,fps=30,N=Math.round(source.timeline.duration*fps);
const report={pageErrors:[]};
const scene=await openScene(loaded,{size:200,theme:loadTheme(),report});const page=scene.page;
const res={id,frames:N,samples:[]};
try{
  const mods=Object.fromEntries(MODULES.map(m=>[m,fs.readFileSync(path.join(RT,m),'utf8')]));
  const r2opt=v5r2(source);if(r2opt)mods['v5r2-ext.js']=fs.readFileSync(EXT,'utf8');
  const glb=fs.readFileSync(path.isAbsolute(MODEL)?MODEL:path.join(RT,MODEL)).toString('base64');
  const s=source,o={scapulaShift:s.v5?.scapulaShift===true,headFlexDeg:s.v5?.headFlexDeg||0,noShadow:s.v5?.groundShadow===false,grip:s.v5?.grip??null,hubGrasp:s.v5?.hubGraspHands??null};
  await page.evaluate(async ({mods,glb,o,r2opt})=>{
    const src=await (await fetch('/src/viewer.js')).text(),O=location.origin;
    const vOf=f=>{const m=src.match(new RegExp(f.replace(/\./g,'\\.')+'\\?v=(\\w+)'));return m?m[1]:src.match(/three\.js\?v=(\w+)/)[1];};
    const dep=f=>O+'/node_modules/.vite/deps/'+f+'?v='+vOf(f);
    const map={'three':dep('three.js'),'three/addons/loaders/GLTFLoader.js':dep('three_addons_loaders_GLTFLoader__js.js'),'three/addons/GLTFLoader.js':dep('three_addons_loaders_GLTFLoader__js.js')};
    const url={};
    for(const [name,code] of Object.entries(mods)){const fixed=code.replace(/(from\s*|import\s*\(\s*)(['"])([^'"]+)\2/g,(m,pre,q,spec)=>{if(map[spec])return pre+q+map[spec]+q;const rel=spec.replace(/^\.\//,'');if(url[rel])return pre+q+url[rel]+q;throw Error('unknown import '+spec);});
      url[name]=URL.createObjectURL(new Blob([fixed],{type:'text/javascript'}));}
    const bin=Uint8Array.from(atob(glb),c=>c.charCodeAt(0)).buffer;
    const m=await import(url['v5-hub.js']);
    await m.installV5({glb:bin,...(o.scapulaShift?{scapulaShift:true}:{}),...(o.headFlexDeg?{headFlexDeg:o.headFlexDeg}:{}),...(o.noShadow?{groundShadow:false}:{}),...(o.grip?{grip:o.grip}:{}),...(o.hubGrasp?{hubGraspHands:o.hubGrasp}:{})});
    if(r2opt){const x=await import(url['v5r2-ext.js']);x.installR2(r2opt);}
  },{mods,glb,o,r2opt});
  if(meshOut&&!fs.existsSync(meshOut)){
    const mi=await page.evaluate(()=>{const V=window.__v5;const ms=[];V.root.traverse(o=>{if(o.isSkinnedMesh&&o.visible!==false&&!o.userData.__outline&&!o.userData.__eye)ms.push(o);});
      const A=a=>a?Array.from(a.array):null;
      return ms.map(o=>{const g=o.geometry;const P=g.attributes.position;const pos=[];for(let i=0;i<P.count;i++)pos.push(P.getX(i),P.getY(i),P.getZ(i));const N=g.attributes.normal;const nor=[];if(N)for(let i=0;i<N.count;i++)nor.push(N.getX(i),N.getY(i),N.getZ(i));
        const SI=g.attributes.skinIndex,SW=g.attributes.skinWeight;const si=[],sw=[];for(let i=0;i<SI.count;i++)for(let k=0;k<4;k++){si.push(SI.getComponent(i,k));sw.push(SW.getComponent(i,k));}
        return {name:o.name,pos,nor,si,sw,index:A(g.index),bindMatrix:o.bindMatrix.elements.slice(),bones:o.skeleton.bones.map(b=>b.name),boneInverses:o.skeleton.boneInverses.map(m=>m.elements.slice()),attrs:Object.keys(g.attributes)};});});
    fs.writeFileSync(meshOut,JSON.stringify(mi));
  }
  const frames=[];const only=opt('--frames');if(only)frames.push(...only.split(',').map(Number));else for(let f=0;f<N;f+=stride)frames.push(f);
  let warm=null;
  for(const f of frames){fail(freeGiB()>=.5,'Low mem');const st=await stageAt(page,source,f/fps,warm);warm=st.x;
    const r=await page.evaluate((t)=>{if(window.__v5r2)window.__v5r2.setTime(t);window.__v5.pose();const V=window.__v5;let o0=null;V.root.traverse(o=>{if(!o0&&o.isSkinnedMesh&&!o.userData.__outline&&!o.userData.__eye)o0=o;});
      o0.skeleton.update();const B={};for(const b of o0.skeleton.bones)B[b.name]=b.matrixWorld.elements.slice();return {B,mw:o0.matrixWorld.elements.slice()};},f/fps);
    res.samples.push({f,...r});}
}finally{await scene.browser.close();}
fs.writeFileSync(outFile,JSON.stringify(res));console.log(JSON.stringify({id,n:res.samples.length}));
