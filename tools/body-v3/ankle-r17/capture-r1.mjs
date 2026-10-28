// Capture standalone ankle r17 rest/squat/plank/fold to a new output directory.
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL,fileURLToPath} from 'node:url';const R=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../drill-anim')+path.sep;const imp=f=>import(pathToFileURL(R+f).href);
const out=process.argv[2];if(!out||fs.existsSync(out))throw new Error('provide a NEW output directory');fs.mkdirSync(out,{recursive:true});const SZ=360;
const {loadTheme}=await imp('lib/config.mjs');const L3=await imp('models/body-v3-ankle-r17/loader.mjs');
const VP={outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'};
const spec0=f=>import(pathToFileURL(R+'specs/'+f).href).then(m=>{const s={...structuredClone(m.default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'}};s.v2plus={...VP,...(s.v2plus||{})};return s;});
const V2=!!process.env.V2;const BT=V2?await imp('lib/boot.mjs'):L3;const {b,p}=await BT.boot({size:SZ,pr:1,theme:loadTheme()});
const timed=async(label,fn,ms=90000)=>{let id;try{return await Promise.race([fn(),new Promise((_,reject)=>{id=setTimeout(()=>reject(Error('phase timeout: '+label)),ms);})]);}finally{clearTimeout(id);}};
const png=(n,u)=>fs.writeFileSync(path.join(out,n+'.png'),Buffer.from(u.split(',')[1],'base64'));
const H=`window.__shot=(pos,look,fov)=>{const T=__toonT,v=flareInspector.viewer,R=v.renderer;R.setClearColor(0x101318,1);const c=new T.PerspectiveCamera(fov,1,0.02,20);c.position.set(...pos);c.lookAt(...look);c.updateProjectionMatrix();R.render(v.scene,c);return R.domElement.toDataURL('image/png');};
window.__bp=n=>flareInspector.viewer.coach.getObjectByName(n).getWorldPosition(new __toonT.Vector3()).toArray();
window.__views=(js,d)=>{const o={};const v=flareInspector.viewer,T=__toonT;v.coach.updateMatrixWorld(true);
 const fw=new T.Vector3(0,0,1).applyQuaternion(v.coach.getObjectByName('pelvis').getWorldQuaternion(new T.Quaternion()));fw.y=0;fw.normalize();const sd=new T.Vector3().crossVectors(new T.Vector3(0,1,0),fw);
 for(const [k,bn] of js){const c=new T.Vector3(...__bp(bn));for(const [vn,dir] of [['front',fw],['back',fw.clone().negate()],['L',sd],['R',sd.clone().negate()]]){const pos=c.clone().addScaledVector(dir,d).add(new T.Vector3(0,0.04,0));o[k+'_'+vn]=__shot(pos.toArray(),c.toArray(),22);}}return o;};
window.__dump=()=>{const v=flareInspector.viewer,T=__toonT,o={meshes:{},bones:{}};v.coach.updateMatrixWorld(true);const q=new T.Vector3(),q2=new T.Vector3();
 for(const n of ['pelvis','torso','spineUpper','neck','head','leftUpperArm','leftForearm','leftHand','leftThigh','leftShin','leftFoot','rightFoot','rightShin'])o.bones[n]=__bp(n);
 v.coach.traverse(m=>{if(!m.isSkinnedMesh||!m.visible)return;const g=m.geometry,P=g.attributes.position,N=g.attributes.normal,n=P.count;const A=new Float32Array(n*6);
  for(let i=0;i<n;i++){q.fromBufferAttribute(P,i);m.applyBoneTransform(i,q);q.applyMatrix4(m.matrixWorld);A.set([q.x,q.y,q.z],i*6);
   if(N){q2.fromBufferAttribute(P,i).addScaledVector(new T.Vector3().fromBufferAttribute(N,i),0.002);m.applyBoneTransform(i,q2);q2.applyMatrix4(m.matrixWorld);q2.sub(q).normalize();A.set([q2.x,q2.y,q2.z],i*6+3);}}
  const idx=g.index?Array.from(g.index.array):null;let k=m.name||m.uuid;while(o.meshes[k])k+='_';o.meshes[k]={A:btoa(String.fromCharCode(...new Uint8Array(A.buffer)).slice(0)),idx};});return o;};`;
const b64big=`window.__b64=u8=>{let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);};`;
try{
 const stand=await spec0('h-squat.js');
 if(V2){const {applyNativeOpen}=await imp('models/native-open-r1/loader.mjs');await applyNativeOpen(p,stand);}else await timed('applyV3',()=>L3.applyV3(p,stand,{}));await p.addScriptTag({content:H.replace("btoa(String.fromCharCode(...new Uint8Array(A.buffer)).slice(0))","__b64(new Uint8Array(A.buffer))")+b64big});
 await p.addScriptTag({content:fs.readFileSync(R+'tools/v2/browser-layers.js','utf8')});
 const J=[['ankle','leftFoot'],['ankle_right','rightFoot']];
 const save=async(state,js,d)=>{const o=await timed(state+' views',()=>p.evaluate(([js,d])=>__views(js,d),[js,d]));for(const k in o)png(state+'_'+k,o[k]);
  const g=await timed(state+' geometry dump',()=>p.evaluate(()=>__dump()));fs.writeFileSync(path.join(out,state+'.json'),JSON.stringify(g));};
 await p.evaluate(s=>__drill.selectModelProfile(s),stand);
 await p.evaluate(()=>{flareInspector.viewer.motion.reset();for(const s of['left','right'])__v2p.setHandPose(s,'relaxed');});
 if(!process.env.NECKONLY)await save('rest',J,0.42);
 if(!process.env.NECKONLY&&!V2)for(const [nm,f,js] of [['squat','a-deep-squat-r3.js',[['ankle','leftFoot'],['ankle_right','rightFoot']]],['plank','h-bear-plank.js',[['ankle','leftFoot'],['ankle_right','rightFoot']]],['fold','a-seated-fold.js',[['ankle','leftFoot'],['ankle_right','rightFoot']]]]){
  const s=await spec0(f);await p.evaluate(([s,z])=>{__setHighlight(s.highlight);__drill.setupCamera(s,z);},[s,SZ]);await p.evaluate(s=>__drill.selectModelProfile(s),s);
  // Use the frame selected by the matching r1 baseline audit: all three were frame 0.
  let best=0,by=0;
  await timed(nm+' capture',()=>p.evaluate(([s,fr])=>{__v2Layers.capture(s,fr/15,fr,null,['body']);return null;},[s,best]));console.log(nm,'baseline-matched frame',best);await save(nm,js,0.42);}
 console.log('ok');
}finally{await b.close();}
