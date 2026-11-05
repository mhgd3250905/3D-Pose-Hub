// Small diagnostic close-ups (not production renders) of self-collision frames, one boot per recipe.
//   node tools/self-collision-r1/render-closeup.mjs --shots shots.json
// shots.json: [{id?, recipe?, t, at:[x,y,z], out, size?:320, dist?:0.55, dir?:[x,y,z] camera direction, mark?:bool}]  (grouped by recipe)
// Camera: production camera direction, moved to look at `at` from `dist` metres; white background;
// a small red ring (depthTest off) marks the deepest penetrating vertex.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipe,openScene,stageAt} from '../action-package-v3/recipe-scene.mjs';
import {allRecipes} from '../ground-audit-r1/ground-penetration-audit.mjs';
const SELF=fileURLToPath(import.meta.url);
async function main(){
  const a=process.argv.slice(2),o={};for(let i=0;i<a.length;i+=2)o[a[i].slice(2)]=a[i+1];
  const shots=JSON.parse(fs.readFileSync(o.shots,'utf8')),all=allRecipes();
  const groups=new Map();for(const s of shots){const f=s.recipe?path.resolve(s.recipe):all.find(f=>path.basename(f,'.json')===s.id);if(!f)throw Error('no recipe '+s.id);if(!groups.has(f))groups.set(f,[]);groups.get(f).push(s);}
  const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
  for(const [file,list] of groups){
    if(list.every(s=>fs.existsSync(s.out))&&!o.force)continue;
    const loaded=await loadRecipe(file),size=Number(list[0].size??320),report={pageErrors:[]};
    const {browser,page}=await openScene(loaded,{size,theme:loadTheme(),report});
    try{
      let warm=null;
      for(const s of list.sort((u,w)=>u.t-w.t)){
        const st=await stageAt(page,loaded.source,s.t,warm);warm=st.x;
        const png=await page.evaluate(([at,dist,mark,camDir])=>{
          const v=flareInspector.viewer,T=__toonT,cam=v.camera,P=new T.Vector3().fromArray(at);
          const keep={pos:cam.position.clone(),q:cam.quaternion.clone(),fov:cam.fov,bg:v.scene.background};
          const dir=camDir?new T.Vector3().fromArray(camDir).normalize():cam.position.clone().sub(P).normalize();
          cam.fov=30;cam.updateProjectionMatrix();cam.position.copy(P.clone().add(dir.multiplyScalar(dist)));cam.lookAt(P);cam.updateMatrixWorld();
          let ring=null;if(mark){ring=new T.Mesh(new T.RingGeometry(0.012,0.016,24),new T.MeshBasicMaterial({color:0xe02020,depthTest:false,transparent:true,opacity:.9}));ring.renderOrder=999;ring.position.copy(P);ring.quaternion.copy(cam.quaternion);v.scene.add(ring);}
          v.scene.background=new T.Color(0xffffff);v.renderer.render(v.scene,cam);const url=v.renderer.domElement.toDataURL('image/png');
          if(ring)v.scene.remove(ring);cam.position.copy(keep.pos);cam.quaternion.copy(keep.q);cam.fov=keep.fov;cam.updateProjectionMatrix();v.scene.background=keep.bg;return url;
        },[s.at,Number(s.dist??0.55),s.mark!==false,s.dir??null]);
        fs.mkdirSync(path.dirname(s.out),{recursive:true});fs.writeFileSync(s.out,Buffer.from(png.split(',')[1],'base64'));
        console.log(JSON.stringify({event:'png',id:loaded.prepared.recipe.id,t:s.t,out:s.out}));
      }
    }finally{await browser.close();}
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)main().catch(e=>{console.error(e);process.exitCode=1;});
