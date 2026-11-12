// node render3.mjs --dir png --jobs jobs.json   jobs=[{id, shots:[{side,t}], vars:[{tag, spec?|file?}]}]
// One boot per action; for each var and shot: production camera + shoulder/elbow close-up. Resumable via <id>.done.
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const R='/workspace/work/elbow-scan-wt/',H='/workspace/work/elbow-fix/';
const {loadRecipe,openScene,stageAt}=await import(R+'tools/action-package-v3/recipe-scene.mjs');
const RP=JSON.parse(fs.readFileSync(H+'recipes.json','utf8'));
const {loadTheme}=await import(R+'drill-anim/lib/config.mjs');
const a=process.argv.slice(2),o={};for(let i=0;i<a.length;i+=2)o[a[i].replace(/^--/,'')]=a[i+1];
const jobs=JSON.parse(fs.readFileSync(o.jobs,'utf8'));fs.mkdirSync(o.dir,{recursive:true});
for(const j of jobs){
  if(fs.existsSync(`${o.dir}/${j.id}.done`))continue;let browser;const t0=Date.now();
  try{const loaded=await loadRecipe(RP[j.id]);const S0=loaded.source;
    const op=await openScene(loaded,{size:420,theme:loadTheme(),report:{pageErrors:[]}});browser=op.browser;const page=op.page;
    for(const v of j.vars){const m=v.file?(await import(pathToFileURL(v.file).href)).default:(await import(pathToFileURL(R+v.spec).href)).default;
      const S=structuredClone(S0);S.timeline=m.timeline;S.pose=m.pose;
      for(const {side,t} of j.shots){let warm=null;for(let k=0;k<4;k++){const st=await stageAt(page,S,t*k/4,warm);warm=st.x;}await stageAt(page,S,t,warm);
        const shots=await page.evaluate((side)=>{const v=flareInspector.viewer,T=__toonT,c=v.camera,out={};v.scene.background=new T.Color(0xffffff);
          v.renderer.render(v.scene,c);out.prod=v.renderer.domElement.toDataURL('image/png');
          const s=v.coach.getObjectByName(side+'UpperArm').getWorldPosition(new T.Vector3()),e=v.coach.getObjectByName(side+'Forearm').getWorldPosition(new T.Vector3());
          const mid=s.clone().lerp(e,0.5);const p0=c.position.clone(),q0=c.quaternion.clone(),f0=c.fov;const dir=p0.clone().sub(mid).normalize();
          c.fov=30;c.updateProjectionMatrix();c.position.copy(mid.clone().add(dir.multiplyScalar(1.0)));c.lookAt(mid);c.updateMatrixWorld();
          v.renderer.render(v.scene,c);out.close=v.renderer.domElement.toDataURL('image/png');
          c.fov=f0;c.updateProjectionMatrix();c.position.copy(p0);c.quaternion.copy(q0);c.updateMatrixWorld();return out;},side);
        for(const [k,u] of Object.entries(shots))fs.writeFileSync(`${o.dir}/${j.id}-${side}-${t}-${v.tag}-${k}.png`,Buffer.from(u.split(',')[1],'base64'));}}
    fs.writeFileSync(`${o.dir}/${j.id}.done`,'');console.log(j.id,'ok',(Date.now()-t0)/1000);
  }catch(e){console.log(j.id,'ERR',String(e.stack||e).slice(0,400));}
  finally{if(browser){try{browser.process?.()?.kill('SIGKILL');}catch{}await Promise.race([browser.close().catch(()=>{}),new Promise(r=>setTimeout(r,3000))]);}}
}
console.log('RENDER DONE');
