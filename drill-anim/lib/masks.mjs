// node lib/masks.mjs <outdir> [--theme t.json]: neutral standing pose, one render per muscle group (front or back view)
import fs from 'node:fs';import {boot} from './boot.mjs';import {loadTheme} from './config.mjs';
const out=process.argv[2];fs.mkdirSync(out,{recursive:true});const i=process.argv.indexOf('--theme');const theme=loadTheme(i>0?process.argv[i+1]:null);
const G=['deltoids','rotator-cuff','triceps','forearms','serratus','scapular','chest','lats','abs','obliques','erectors','hip-flexors','glute-max','hip-abductors','adductors','quadriceps','hamstrings'];
const BACK=new Set(['rotator-cuff','triceps','scapular','lats','erectors','glute-max','hip-abductors','hamstrings']);
const SIDE=new Set(['serratus','obliques','deltoids','hip-abductors','forearms']);
const {b,p}=await boot({size:720,pr:2,theme});
const r=await p.evaluate(([G,B0,S0])=>{const B=new Set(B0),S=new Set(S0);const v=flareInspector.viewer,T=__toonT,m=v.motion;m.reset();v.coach.updateMatrixWorld(true);__props.update();
  const J=m.getMetrics().joints;const box=new T.Box3();for(const k of ["head","leftToe","rightToe","leftPalm","rightPalm","leftAnkle"])box.expandByPoint(new T.Vector3(...J[k]));box.expandByScalar(0.12);const res={};
  for(const g of G){const n=__setHighlight({groups:[g]});__toonUni.uPulse.value=1;
    const dir=B.has(g)?(S.has(g)?[0.7,0.15,-0.7]:[0,0.12,-1]):(S.has(g)?[0.7,0.15,0.7]:[0,0.12,1]);v.fitBounds(box,new T.Vector3(...dir),0.74);v.camera.aspect=1;v.camera.updateProjectionMatrix();
    window.__glowU.value=0;v.renderer.render(v.scene,v.camera);const main=v.renderer.domElement.toDataURL('image/png');
    window.__glowU.value=6;v.renderer.render(v.scene,v.camera);const mask=v.renderer.domElement.toDataURL('image/png');window.__glowU.value=0;res[g]={n,main,mask,view:dir};}
  return res;},[G,[...BACK],[...SIDE]]);
for(const [g,x] of Object.entries(r)){fs.writeFileSync(`${out}/${g}.png`,Buffer.from(x.main.split(',')[1],'base64'));fs.writeFileSync(`${out}/${g}-mask.png`,Buffer.from(x.mask.split(',')[1],'base64'));}
fs.writeFileSync(`${out}/info.json`,JSON.stringify(Object.fromEntries(Object.entries(r).map(([g,x])=>[g,{panels:x.n,view:x.view}]))));await b.close();
