// Compare selected PR19 timing revisions with their source poses on frozen r7.
// Output is sampled regression evidence; it does not approve media or all contacts.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
import * as model from '../../../drill-anim/models/training-human-v3-completed-r7/loader.mjs';
import {sourceTimeAt} from '../../../drill-anim/specs/_draft-native8-r1.mjs';
import {loadTheme} from '../../../drill-anim/lib/config.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const [out] = process.argv.slice(2);
if (!out || process.argv.length !== 3 || fs.existsSync(out)) throw Error('Usage: node preview-timing-r3.mjs <NEW output directory>');
fs.mkdirSync(out);
const selections = [
  ['chest-B-r2', 'chest-B', [0,.6,2,2.1,2.775,3.3,4,4.6,6,6.1,6.775,7.3,239/30]],
  ['serratus-A-r2', 'serratus-A', [0,.3,1.3,2.3,2.45,2.8,3,4,4.3,5.3,6.3,6.45,6.8,7,239/30]],
  ['triceps-A-r2', 'triceps-A', [0,.7,2,2.1,2.675,3.15,3.3,4,4.7,6,6.1,6.675,7.15,7.3,239/30]],
  ['quadriceps-C-r2', 'quadriceps-C', [0,.4,1.6,2.6,3.6,4.3,5,239/30]],
];
const load = async id => structuredClone((await import(pathToFileURL(path.join(repo,'drill-anim/specs',id+'.js')).href)).default);
const onR7 = s => ({...s, breath:0, modelProfile:'training-human-v2plus-hands-native', nativeHands:{version:'1.0.0-r3'}, v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'}});
const errors=[];let modelReady=false;
let timer;
async function stage(label, run) {
  const minimumGiB=modelReady?2:3.5;
  if(os.freemem()<minimumGiB*1024**3)throw Error('Insufficient available memory before '+label);
  console.log(label);
  try { return await Promise.race([run(), new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Timed out: '+label)),120000);})]); }
  finally { clearTimeout(timer); }
}
const theme=loadTheme();
const {b,p}=await stage('boot r7',()=>model.boot({size:480,pr:1,theme}));
p.on('pageerror',e=>errors.push(String(e)));
try {
  const identity=await stage('initialize r7 once',async()=>model.applyV3(p,onR7(await load(selections[0][0]))));
  modelReady=true;
  await p.evaluate(()=>{const v=flareInspector.viewer;v.animate=()=>{};v.playing=false;__toonUni.uBreath.value=0;});
  const report={profile:identity.profile,version:identity.version,scope:'PR19 selected-frame retiming regression; unchanged sources and frozen r7; no release acceptance',cases:[],pageErrors:errors};
  for(const [id,sourceId,requested] of selections) {
    const candidate=onR7(await load(id)), source=onR7(await load(sourceId));
    const times=[...new Set([...requested,...candidate.keyFrames,candidate.stillAt].map(t=>Math.min(239,Math.max(0,Math.round(t*30)))))] .sort((a,b)=>a-b).map(f=>f/30);
    const setup=await stage('camera '+id,()=>p.evaluate(([s,th])=>{
      for(const o of __props.list.slice())o.parent?.remove(o);__props.list.length=0;
      for(const pr of s.props||[])__props.add(th,pr);
      const v=flareInspector.viewer,T=__toonT,box=new T.Box3(),point=new T.Vector3();
      v.framingInsets={left:0,right:0,top:0,bottom:0};v.camera.clearViewOffset();
      for(const time of [0,s.stillAt,239/30]){
        __drill.applyAt(s,time,null);__props.update();v.coach.updateMatrixWorld(true);
        v.scene.traverse(o=>{
          let shown=o.visible;for(let a=o.parent;a&&shown;a=a.parent)shown=a.visible;
          if(!shown||!o.isSkinnedMesh)return;o.skeleton.update();
          for(let i=0;i<o.geometry.attributes.position.count;i+=8){o.getVertexPosition(i,point);box.expandByPoint(point.clone().applyMatrix4(o.matrixWorld));}
        });
        for(const o of __props.list)box.union(new T.Box3().setFromObject(o));
      }
      if(box.isEmpty())throw Error('No visible geometry for camera');
      box.expandByScalar(.10);const center=box.getCenter(new T.Vector3()),radius=box.getSize(new T.Vector3()).length()/2;
      v.camera.fov=35;v.camera.aspect=1;v.camera.near=.02;v.camera.far=50;
      const direction=new T.Vector3(...s.camera.dir).normalize();
      v.camera.position.copy(center).addScaledVector(direction,radius/Math.sin(35*Math.PI/360)*1.10);
      v.camera.up.set(0,1,0);v.camera.lookAt(center);v.camera.updateProjectionMatrix();v.camera.updateMatrixWorld();v.controls.target.copy(center);
      v.renderer.setViewport(0,0,480,480);v.renderer.setScissorTest(false);v.renderer.setClearColor(0x101318,1);
      return {camera:v.camera.position.toArray(),target:v.controls.target.toArray()};
    },[candidate,theme]));
    const caseReport={id,sourceId,camera:setup,frames:[],maxBonePositionDeltaMm:0,maxBoneAngleDeltaDeg:0};
    for(const t of times) {
      const sourceTime=sourceTimeAt(candidate.draftNative8.sourceSlices,t);
      const item=await stage(id+' '+t,()=>p.evaluate(([s,base,t,sourceTime])=>{
        const v=flareInspector.viewer,T=__toonT;
        function draw(spec,time,highlight){
          __setHighlight(highlight?spec.highlight:{groups:[],side:'both'});
          const pose=__drill.applyAt(spec,time,null);__toonUni.uBreath.value=0;
          __toonUni.uPulse.value=__drill.pulseAt(spec.highlight,spec.timeline,time);
          __props.update();__glowU.value=0;__rimU.value=1;
          v.coach.updateMatrixWorld(true);v.scene.updateMatrixWorld(true);
          const bones={};v.coach.traverse(o=>{if(o.isBone)bones[o.name]={position:o.getWorldPosition(new T.Vector3()).toArray(),quaternion:o.getWorldQuaternion(new T.Quaternion()).toArray()};});
          v.renderer.render(v.scene,v.camera);
          return {image:v.renderer.domElement.toDataURL('image/png'),bones,warnings:pose.warn,params:pose.params};
        }
        const before=draw(base,sourceTime,false),after=draw(s,t,false);
        let pos=0,angle=0;
        if(Object.keys(before.bones).join('|')!==Object.keys(after.bones).join('|'))throw Error('bone set changed');
        for(const name of Object.keys(before.bones)){
          const a=before.bones[name],b=after.bones[name];
          pos=Math.max(pos,Math.hypot(...a.position.map((v,i)=>v-b.position[i]))*1000);
          const dot=Math.min(1,Math.abs(a.quaternion.reduce((n,x,i)=>n+x*b.quaternion[i],0)));
          angle=Math.max(angle,2*Math.acos(dot)*180/Math.PI);
        }
        const highlighted=draw(s,t,true);
        return {before:before.image,after:after.image,highlight:highlighted.image,bones:Object.keys(before.bones).length,maxBonePositionDeltaMm:pos,maxBoneAngleDeltaDeg:angle,sourceWarnings:before.warnings,candidateWarnings:after.warnings};
      },[candidate,source,t,sourceTime]));
      const stem=id+'-f'+Math.round(t*30);
      for(const channel of ['before','after','highlight']){
        fs.writeFileSync(path.join(out,stem+'-'+channel+'.png'),Buffer.from(item[channel].split(',')[1],'base64'),{flag:'wx'});
        delete item[channel];
      }
      caseReport.maxBonePositionDeltaMm=Math.max(caseReport.maxBonePositionDeltaMm,item.maxBonePositionDeltaMm);
      caseReport.maxBoneAngleDeltaDeg=Math.max(caseReport.maxBoneAngleDeltaDeg,item.maxBoneAngleDeltaDeg);
      caseReport.frames.push({time:t,frame:Math.round(t*30),sourceTime,stem,...item});
    }
    report.cases.push(caseReport);
    fs.writeFileSync(path.join(out,'report-progress.json'),JSON.stringify(report,null,2)+'\n');
  }
  if(errors.length)throw Error('Page errors: '+JSON.stringify(errors));
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(report.cases.map(x=>({id:x.id,frames:x.frames.length,maxBonePositionDeltaMm:x.maxBonePositionDeltaMm,maxBoneAngleDeltaDeg:x.maxBoneAngleDeltaDeg}))));
} finally {await b.close();}
