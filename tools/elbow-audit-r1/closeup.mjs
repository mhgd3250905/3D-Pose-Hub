// Small elbow/forearm close-ups (diagnostic only, not production renders). One boot per (recipe, share).
//   node tools/elbow-audit-r1/closeup.mjs --shots shots.json
// shots.json: [{recipe, t, side:'left'|'right', out, size?:320, dist?:0.5, share?:number}]
// Camera: production camera direction made perpendicular to the forearm, aimed at 35% elbow->wrist; white background.
import fs from 'node:fs';
import path from 'node:path';
import {loadRecipe,openScene,stageAt} from '../action-package-v3/recipe-scene.mjs';
const a=process.argv.slice(2),o={};for(let i=0;i<a.length;i+=2)o[a[i].slice(2)]=a[i+1];
const shots=JSON.parse(fs.readFileSync(o.shots,'utf8'));
const groups=new Map();for(const s of shots){const k=s.recipe+'|'+(s.share??'');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(s);}
const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
for(const [k,list] of groups){
  if(list.every(s=>fs.existsSync(s.out)))continue;
  const loaded=await loadRecipe(path.resolve(list[0].recipe));
  if(list[0].share!==undefined)loaded.source.nativeHands={...(loaded.source.nativeHands||{}),twistShare:list[0].share};
  const report={pageErrors:[]};const {browser,page}=await openScene(loaded,{size:Number(list[0].size??320),theme:loadTheme(),report});
  try{
    let warm=null;
    for(const s of list.sort((u,w)=>u.t-w.t)){
      const st=await stageAt(page,loaded.source,s.t,warm);warm=st.x;
      const png=await page.evaluate(([side,dist])=>{
        const v=flareInspector.viewer,T=__toonT,cam=v.camera;v.coach.updateMatrixWorld(true);
        const P=o=>o.getWorldPosition(new T.Vector3());const e=P(v.coach.getObjectByName(side+'Forearm')),w=P(v.coach.getObjectByName(side+'Hand'));
        const ax=w.clone().sub(e).normalize(),at=e.clone().lerp(w,0.35);
        const keep={pos:cam.position.clone(),q:cam.quaternion.clone(),fov:cam.fov,bg:v.scene.background};
        let dir=cam.position.clone().sub(at);dir.sub(ax.clone().multiplyScalar(dir.dot(ax)));if(dir.length()<1e-3)dir.set(0,0,1);dir.normalize();
        cam.fov=32;cam.updateProjectionMatrix();cam.position.copy(at.clone().add(dir.multiplyScalar(dist)));cam.lookAt(at);cam.updateMatrixWorld();
        v.scene.background=new T.Color(0xffffff);v.renderer.render(v.scene,cam);const url=v.renderer.domElement.toDataURL('image/png');
        cam.position.copy(keep.pos);cam.quaternion.copy(keep.q);cam.fov=keep.fov;cam.updateProjectionMatrix();v.scene.background=keep.bg;return url;
      },[s.side,Number(s.dist??0.5)]);
      fs.mkdirSync(path.dirname(s.out),{recursive:true});fs.writeFileSync(s.out,Buffer.from(png.split(',')[1],'base64'));
      console.log('png',loaded.prepared.recipe.id,s.t,s.side,s.share??'',s.out);
    }
  }finally{await browser.close();}
}
