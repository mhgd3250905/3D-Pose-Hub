import fs from 'node:fs';import {pathToFileURL} from 'node:url';const R='/workspace/ph/drill-anim/';
const {boot}=await import(pathToFileURL(R+'lib/boot.mjs').href);const {loadTheme}=await import(pathToFileURL(R+'lib/config.mjs').href);
const {b,p}=await boot({size:200,pr:1,theme:loadTheme()});
try{const J=await p.evaluate(()=>{const T=__toonT,v=flareInspector.viewer;v.motion.reset();v.coach.updateMatrixWorld(true);const P=n=>v.coach.getObjectByName(n).getWorldPosition(new T.Vector3()).toArray().map(x=>+x.toFixed(6));
 const o={pelvis:P('pelvis'),torso:P('torso'),neck:P('neck'),head:P('head')};for(const s of['left','right']){o[s+'Shoulder']=P(s+'UpperArm');o[s+'Elbow']=P(s+'Forearm');o[s+'Wrist']=P(s+'Hand');o[s+'Hip']=P(s+'Thigh');o[s+'Knee']=P(s+'Shin');o[s+'Ankle']=P(s+'Foot');}return o;});
 fs.writeFileSync(process.argv[2],JSON.stringify(J,null,1));console.log(JSON.stringify(J).slice(0,300));}finally{await b.close();}
