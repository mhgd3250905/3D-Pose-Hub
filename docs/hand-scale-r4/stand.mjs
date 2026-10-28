// Bind-pose (arms down) front orthographic-ish view + fingertip/thigh heights. usage: node stand.mjs <ver> <out.png>
import fs from 'node:fs';import {pathToFileURL} from 'node:url';const R='/workspace/ph/drill-anim/';const imp=f=>import(pathToFileURL(R+f).href);
const {boot}=await imp('lib/boot.mjs');const {loadTheme}=await imp('lib/config.mjs');const {applyNativeOpen}=await imp('models/native-open-r1/loader.mjs');
const [ver,out]=process.argv.slice(2);const spec={...structuredClone((await import(pathToFileURL(R+'specs/h-squat.js').href)).default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:ver}};
const {b,p}=await boot({size:900,pr:1,theme:loadTheme()});
try{await applyNativeOpen(p,spec);await p.evaluate(s=>{__drill.setupCamera(s,900);},spec);await p.addScriptTag({content:fs.readFileSync(R+'tools/v2/browser-layers.js','utf8')});
 await p.evaluate(s=>__v2Layers.capture(s,0,0,null,['body']),spec);
 const r=await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer,c=v.camera;v.motion.reset();
  for(const s of['left','right'])if(window.__v2p?.setHandPose)try{__v2p.setHandPose(s,'relaxed');}catch(e){}
  v.coach.updateMatrixWorld(true);
  if(c.isOrthographicCamera){c.left=-0.95;c.right=0.95;c.top=1.85;c.bottom=-0.05;}else{c.fov=30;c.aspect=1;}
  c.position.set(0,0.9,c.isOrthographicCamera?5:3.6);c.up.set(0,1,0);c.lookAt(0,0.9,0);c.updateProjectionMatrix();
  v.renderer.setClearColor(0x000000,1);v.renderer.render(v.scene,c);const url=v.renderer.domElement.toDataURL('image/png');
  let tip=9;v.scene.traverse(m=>{if(m.isSkinnedMesh&&m.visible&&m.name==='Coach_Body'){const q=new T.Vector3(),pa=m.geometry.attributes.position;for(let i=0;i<pa.count;i++){m.getVertexPosition(i,q);m.localToWorld(q);if(Math.abs(q.x)>0.17&&q.y<tip&&q.y>0.4)tip=q.y;}}});
  const P=n=>v.coach.getObjectByName(n).getWorldPosition(new T.Vector3()).y;return {url,tip,thigh:P('leftThigh'),knee:P('leftShin'),wrist:P('leftHand')};});
 fs.writeFileSync(out,Buffer.from(r.url.split(',')[1],'base64'));delete r.url;console.log(ver,JSON.stringify(r));}finally{await b.close();}
