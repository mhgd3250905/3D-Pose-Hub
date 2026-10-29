import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const [out,runtimeFile]=process.argv.slice(2);if(!out||!runtimeFile||fs.existsSync(out))throw Error('New output directory and pinned runtime required');fs.mkdirSync(out,{recursive:true});
const runtime=JSON.parse(fs.readFileSync(runtimeFile,'utf8'));process.env.PLAYWRIGHT_MODULE=runtime.playwrightModule.path;process.env.CHROMIUM_ARGS=runtime.chromiumArgs.join(' ');
const {loadTheme}=await import(pathToFileURL(path.join(repo,'drill-anim/lib/config.mjs')));
const model=await import(pathToFileURL(path.join(repo,'drill-anim/models/training-human-v3-armfix-r1/loader.mjs')));
const {exportGripInput}=await import('./grip-export.mjs');
const source=(await import(pathToFileURL(path.join(repo,'drill-anim/specs/h-db-reverse-curl-r2.js')))).default;
const {installGrip,prepareGripSpec}=await import('./grip-install.mjs');const spec=prepareGripSpec(source);
const {b,p}=await model.boot({size:640,pr:1,theme:loadTheme()});
try{
 await model.applyV3(p,spec);await installGrip(p);
 await p.evaluate(([s,th])=>{__drill.selectModelProfile(s);for(const prop of s.props)__props.add(th,prop);__drill.applyAt(s,0,null);__props.update();},[spec,loadTheme()]);
 for(const time of [0,1.8,3.6,8]){await p.evaluate(([s,t])=>{__drill.applyAt(s,t,null);__props.update();},[spec,time]);
 const data=await exportGripInput(p,spec,{frame:Math.round(time*30)});fs.writeFileSync(path.join(out,'input-'+time+'.json'),JSON.stringify(data));
 const images=await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer,b=v.coach.getObjectByName('leftHand'),c=new T.Vector3(...__armfixGrip.fit.center).applyMatrix4(b.matrixWorld),out={};__setHighlight({groups:[],side:'both'});__glowU.value=0;v.renderer.setClearColor(0xf0f2f4,1);for(const [name,dir]of [['front',[0,0,1]],['side',[1,0,0]],['palm',[0,-1,0]]]){const camera=new T.OrthographicCamera(-.19,.19,.19,-.19,.01,5);camera.position.copy(c).add(new T.Vector3(...dir));camera.lookAt(c);camera.updateMatrixWorld();v.renderer.render(v.scene,camera);out[name]=v.renderer.domElement.toDataURL('image/png');}return out;});for(const [view,uri]of Object.entries(images))fs.writeFileSync(path.join(out,view+'-'+time+'.png'),Buffer.from(uri.split(',')[1],'base64'));
console.log(JSON.stringify({bones:data.mesh.bones.length,vertices:data.mesh.positions.length/3,targets:data.targets.map(t=>({side:t.side,kind:t.kind,radius:t.radius}))}));
}
}finally{await b.close();}
