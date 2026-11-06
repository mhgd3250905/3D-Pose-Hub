// 道具贴合探针：一个动作整循环抽帧，统计落在某矩形 x/z 范围内的蒙皮顶点，按 x/z 每 2 cm 网格的最低 y（键 region:xi:zi，xi=floor(x*50)）（分 head / body）。只读。
//   node tools/ground-contact-r1/probe-profile.mjs --id <recipeId> --x0 0 --x1 0.6 --z0 -0.17 --z1 0.17 --out f.json [--stride 16]
import fs from 'node:fs';import path from 'node:path';
import {loadRecipe,openScene,stageAt,freeGiB} from '../action-package-v3/recipe-scene.mjs';
import {allRecipes} from '../ground-audit-r1/ground-penetration-audit.mjs';
const a=process.argv.slice(2),o={stride:16,size:96};for(let i=0;i<a.length;i+=2)o[a[i].replace(/^--/,'')]=a[i+1];for(const k of['stride','size','x0','x1','z0','z1'])o[k]=+o[k];
const file=allRecipes().find(f=>path.basename(f,'.json')===o.id);const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
const loaded=await loadRecipe(file),src=loaded.source,N=Math.round(src.timeline.duration*30);
const {browser,page}=await openScene(loaded,{size:o.size,theme:loadTheme(),report:{pageErrors:[]}});
function prof(B){const T=window.__toonT,v=flareInspector.viewer;v.coach.updateWorldMatrix(true,true);const q=new T.Vector3(),out={};
  v.coach.traverse(mesh=>{if(!mesh.isMesh||!mesh.geometry?.attributes?.position)return;for(let a=mesh;a;a=a.parent)if(!a.visible)return;
    const g=mesh.geometry,pos=g.attributes.position,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bones=mesh.skeleton?.bones;mesh.skeleton?.update();
    for(let id=0;id<pos.count;id++){mesh.getVertexPosition?mesh.getVertexPosition(id,q):q.fromBufferAttribute(pos,id);q.applyMatrix4(mesh.matrixWorld);
      if(q.x<B.x0||q.x>B.x1||q.z<B.z0||q.z>B.z1)continue;let bone='';if(si&&bones){let bw=-1;for(let k=0;k<4;k++){const w=sw.getComponent(id,k);if(w>bw){bw=w;bone=bones[si.getComponent(id,k)]?.name||'';}}}
      const reg=/head|neck/i.test(bone)&&!/^(left|right)/.test(bone)?'head':'body',k=reg+':'+Math.floor(q.x*50)+':'+Math.floor(q.z*50);if(!(k in out)||q.y<out[k])out[k]=+q.y.toFixed(4);}});return out;}
const acc={};let warm=null;
try{await page.evaluate(s=>{window.__prof=eval('('+s+')');},prof.toString());
for(let f=0;f<N;f+=o.stride){if(freeGiB()<.6)throw Error('low mem');const st=await stageAt(page,src,f/30,warm);warm=st.x;
  const m=await page.evaluate(B=>{const v=flareInspector.viewer,sc=v.scene,prev=sc.onAfterRender;let val=null;sc.onAfterRender=function(...a){prev?.apply(this,a);val=__prof(B);};try{v.renderer.render(sc,v.camera);}finally{sc.onAfterRender=prev;}return val;},{x0:o.x0,x1:o.x1,z0:o.z0,z1:o.z1});
  acc[f]=m;}}finally{await browser.close();}
fs.writeFileSync(o.out,JSON.stringify(acc));console.log('ok',o.out);
