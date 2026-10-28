// Read r17 runtime metadata without rendering frames or altering source files.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath,pathToFileURL} from 'node:url';
const [out,ref]=process.argv.slice(2);if(!out||!ref||fs.existsSync(out))throw Error('provide NEW output and snapshot directory');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../../drill-anim'),imp=f=>import(pathToFileURL(path.join(root,f)).href);
const loader=await imp('models/body-v3-ankle-r17/loader.mjs'),{loadTheme}=await imp('lib/config.mjs');
const spec0=async f=>{const s={...structuredClone((await imp('specs/'+f)).default),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'}};s.v2plus={outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic',...(s.v2plus||{})};return s;};
const states=[['rest',null],['squat','a-deep-squat-r3.js'],['plank','h-bear-plank.js'],['fold','a-seated-fold.js']];
const {b,p}=await loader.boot({size:360,pr:1,theme:loadTheme()});
const timed=async(label,fn,ms=90000)=>{let id;try{return await Promise.race([fn(),new Promise((_,reject)=>{id=setTimeout(()=>reject(Error('phase timeout: '+label)),ms);})]);}finally{clearTimeout(id);}};
try{
 const stand=await spec0('h-squat.js');await timed('apply',()=>loader.applyV3(p,stand,{}));const result={states:{}};
 for(const [state,file] of states){const s=file?await spec0(file):stand;
  const data=await timed(state,()=>p.evaluate(([s,isRest])=>{const v=flareInspector.viewer,T=__toonT;__setHighlight(s.highlight||{groups:[]});__drill.setupCamera(s,360);__drill.selectModelProfile(s);
   if(isRest){v.motion.reset();for(const side of ['left','right'])__v2p.setHandPose(side,'relaxed');}else __drill.applyAt(s,0,null);
   v.coach.updateMatrixWorld(true);const out={};
   for(const n of ['Coach_Body','V2P_Base_Limbs','Coach_Sneakers']){const m=v.coach.getObjectByName(n),g=m.geometry,q=new T.Vector3(),A=new Float32Array(g.attributes.position.count*3);m.skeleton.update();
    for(let i=0;i<g.attributes.position.count;i++){q.fromBufferAttribute(g.attributes.position,i);m.applyBoneTransform(i,q);q.applyMatrix4(m.matrixWorld);A.set([q.x,q.y,q.z],i*3);}
    let str='';const u=new Uint8Array(A.buffer);for(let i=0;i<u.length;i+=0x8000)str+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));
    let effective=true;for(let o=m;o;o=o.parent)effective&&=o.visible;
    out[n]={visible:m.visible,effectiveVisible:effective,indexCount:g.index.count,drawRange:{start:g.drawRange.start,count:Number.isFinite(g.drawRange.count)?g.drawRange.count:null},groups:g.groups,morphTargetInfluences:m.morphTargetInfluences||null,positions:btoa(str)};
   }return out;},[s,!file]));
  const reference=JSON.parse(fs.readFileSync(path.join(ref,state+'.json')));for(const [name,m] of Object.entries(data)){const raw=Buffer.from(reference.meshes[name].A,'base64'),arr=Buffer.alloc(raw.length/2);for(let i=0;i<raw.length/24;i++)raw.copy(arr,i*12,i*24,i*24+12);const current=Buffer.from(m.positions,'base64');m.snapshotPositionsIdentical=current.equals(arr);m.positionsSha256=crypto.createHash('sha256').update(current).digest('hex');delete m.positions;}
  result.states[state]=data;console.log(state,JSON.stringify(data));
 }
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
}finally{await b.close();}
