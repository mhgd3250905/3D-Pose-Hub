// Actual browser rest capture, independent of historical inverse calibration.
import fs from 'node:fs';
import {boot} from '../../../drill-anim/lib/boot.mjs';
import {loadTheme} from '../../../drill-anim/lib/config.mjs';
import {applyHumanV2plus} from '../../../drill-anim/lib/human-v2plus.mjs';
const [out]=process.argv.slice(2);
if(!out||fs.existsSync(out))throw Error('Fresh output JSON path required');
const spec={modelProfile:'training-human-v2plus',v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'}};
const {b,p}=await boot({size:480,pr:1,theme:loadTheme()});
try{
 await applyHumanV2plus(p,spec);
 const data=await p.evaluate(spec=>{
  const v=flareInspector.viewer,T=__toonT;
  __drill.selectModelProfile(spec);__v2p.restHands();v.motion.reset();v.coach.updateMatrixWorld(true);
  const result={kind:'actual-browser-motion-reset',meshes:{}};
  for(const [name,obj] of [['Torso',__v2p.torso.mesh],['Limbs',__v2p.limbs.mesh],['Hands',__v2p.hands.mesh],['Mesh005',v.coach.getObjectByName('Mesh005')]]){
   if(!obj)throw Error('Missing '+name);
   obj.skeleton?.update();const q=new T.Vector3(),points=[];
   for(let i=0;i<obj.geometry.attributes.position.count;i++){obj.getVertexPosition(i,q).applyMatrix4(obj.matrixWorld);points.push(...q.toArray());}
   const g=obj.geometry,pre=obj.matrixWorld.clone().multiply(obj.bindMatrixInverse),BM=new T.Matrix4();
   const matrices=obj.skeleton.bones.map((_,i)=>pre.clone().multiply(BM.fromArray(obj.skeleton.boneMatrices,i*16)).multiply(obj.bindMatrix).elements.slice());
   const values=a=>Array.from({length:a.count},(_,i)=>Array.from({length:a.itemSize},(_,k)=>a.getComponent(i,k))).flat();
   result.meshes[name]={name:obj.name,points,index:Array.from(g.index.array),visible:obj.visible,
    bones:obj.skeleton.bones.map(b=>b.name),boneWorld:obj.skeleton.bones.map(b=>b.matrixWorld.elements.slice()),
    skinMatrices:matrices,pre:pre.elements.slice(),bindPositions:values(g.attributes.position),
    joints:values(g.attributes.skinIndex),weights:values(g.attributes.skinWeight)};
  }
  return result;
 },spec);
 fs.writeFileSync(out,JSON.stringify(data),{flag:'wx'});console.log(out);
}finally{await b.close();}
