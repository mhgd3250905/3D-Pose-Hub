// Side-view 256px diagnostic still of one frame (production install chain, debug camera + red floor line).
//   node tools/ground-audit-r1/render-worst.mjs --id <action> --frame <f> --out <png> [--size 256] [--zoom 1.1]
// Not a production render: camera is a horizontal side view near floor level, a 2 mm red slab marks y=0
// (the floor plane), white background. Everything below the red line is under the floor.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadRecipe,openScene,stageAt} from '../action-package-v3/recipe-scene.mjs';
import {allRecipes} from './ground-penetration-audit.mjs';
const SELF=fileURLToPath(import.meta.url);
async function main(){
  const a=process.argv.slice(2),o={size:256,zoom:1.1};for(let i=0;i<a.length;i+=2)o[a[i].slice(2)]=a[i+1];
  const file=allRecipes().find(f=>path.basename(f,'.json')===o.id);if(!file)throw Error('no recipe '+o.id);
  const {loadTheme}=await import('../../drill-anim/lib/config.mjs');
  const loaded=await loadRecipe(file),size=Number(o.size),report={pageErrors:[]};
  const {browser,page}=await openScene(loaded,{size,theme:loadTheme(),report});
  try{
    const f=Number(o.frame);let warm=null;
    // warm the solver along the cycle like the sequential production loop
    for(let k=0;k<f;k+=8){const s=await stageAt(page,loaded.source,k/30,warm);warm=s.x;}
    await stageAt(page,loaded.source,f/30,warm);
    const png=await page.evaluate(([zoom,side])=>{
      const v=flareInspector.viewer,T=__toonT,J=v.motion.getMetrics().joints,V=n=>new T.Vector3().fromArray(J[n]);
      const head=V('head'),pel=V('pelvis'),toe=V('leftToe').add(V('rightToe')).multiplyScalar(.5);
      const ax=head.clone().sub(toe);ax.y=0;if(ax.lengthSq()<1e-4)ax.set(1,0,0);ax.normalize();
      const sideDir=new T.Vector3(-ax.z,0,ax.x).multiplyScalar(side);
      const pts=['head','pelvis','leftToe','rightToe','leftKnee','rightKnee','leftElbow','rightElbow','leftPalm','rightPalm'].map(V);
      const box=new T.Box3().setFromPoints(pts);const c=box.getCenter(new T.Vector3());const span=Math.max(box.max.x-box.min.x,box.max.z-box.min.z,box.max.y)*zoom;
      const tgt=new T.Vector3(c.x,span*0.38,c.z);const cam=v.camera;cam.fov=30;cam.updateProjectionMatrix();
      const d=span/(2*Math.tan(15*Math.PI/180))+0.3;cam.position.copy(tgt.clone().add(sideDir.clone().multiplyScalar(d)));cam.position.y=0.02;cam.lookAt(tgt);cam.updateMatrixWorld();
      const line=new T.Mesh(new T.BoxGeometry(8,0.002,8),new T.MeshBasicMaterial({color:0xe02020}));line.position.y=-0.001;v.scene.add(line);
      v.scene.background=new T.Color(0xffffff);v.renderer.render(v.scene,cam);const url=v.renderer.domElement.toDataURL('image/png');v.scene.remove(line);return url;
    },[Number(o.zoom),Number(o.side??1)]);
    fs.writeFileSync(o.out,Buffer.from(png.split(',')[1],'base64'));console.log(JSON.stringify({event:'png',id:o.id,frame:f,out:o.out,pageErrors:report.pageErrors.length}));
  }finally{await browser.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)main().catch(e=>{console.error(e);process.exitCode=1;});
