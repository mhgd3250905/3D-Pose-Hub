// Completion-batch grip experiments. Frozen model data and global hand setters stay unchanged.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(SELF), '../..');
export const VERSION = 'completion-c1r2-power-grip/0.1.0-diagnostics';
export const GRIP_SCOPE = Object.freeze({
  'h-band-biceps-curl-r2': ['left', 'right'],
  'h-db-overhead-shrug-r2': ['left', 'right'],
  'h-db-reverse-curl-r2': ['left', 'right'],
  'h-db-zottman-curl-r2': ['left', 'right'],
  'h-kb-swing-r3': ['right'],
  'h-towel-behind-r3': ['left', 'right'],
  'h-towel-pass-r3': ['left', 'right'],
  'h-towel-pulldown-r3': ['left', 'right'],
});
const PINS = Object.freeze({
  'drill-anim/models/hands-native-c1r2/hands-rig.json': 'a1b488058c5c5a927ba6d86caa9870b919a6091db8a1106ff498ff4a4c92ae26',
  'drill-anim/models/hands-native-c1r2/manifest.json': 'a265d8e5d11e84443a4c79f228deb689a3f4385e710304bda178c7023f384ec5',
  'drill-anim/models/training-human-v3/human-v3.js': '73d75cd16b166338e1241cdc02545856d4517016085e8f926bdfb6eb8472aa08',
});
const sha = value => crypto.createHash('sha256').update(value).digest('hex');

export function gripSourceIdentity() {
  const sources = Object.entries(PINS).map(([name, expected]) => {
    const bytes = fs.readFileSync(path.join(REPO, name));
    const actual = sha(bytes.toString('utf8').replaceAll('\r\n', '\n'));
    if (actual !== expected) throw Error('c1r2 grip source changed: '+name);
    return {path:name, bytes:bytes.length, sha256:sha(bytes), sha256Lf:actual};
  });
  const bytes = fs.readFileSync(SELF);
  sources.push({path:path.relative(REPO,SELF).replaceAll('\\','/'),bytes:bytes.length,sha256:sha(bytes)});
  return {version:VERSION,sources};
}

export function gripSides(spec) {
  const sides = GRIP_SCOPE[spec?.id];
  if (!sides) throw Error('Grip adapter is not authorized for this completion spec');
  if (spec.runtimeModel?.profile !== 'training-human-v3-contact' || spec.runtimeModel.version !== '0.1.0-r5') throw Error('Fresh r7/contact-r5 runtime required');
  for (const side of sides) {
    if (!(spec.props||[]).some(p => p.type==='gripHand' && p.side===side)) throw Error('Explicit source gripHand semantic required: '+side);
  }
  return sides.slice();
}

// Call after the caller has applied the desired frame and updated props on a fresh r7/r5 page.
// This reads actual skinned surfaces and prop transforms; it never solves, poses, resets or renders.
export async function exportGripInput(page, spec, {frame=null, fps=30}={}) {
  const sides = gripSides(spec), identity = gripSourceIdentity();
  const rig = JSON.parse(fs.readFileSync(path.join(REPO,'drill-anim/models/hands-native-c1r2/hands-rig.json'),'utf8'));
  const descriptor = {id:spec.id,v2plus:spec.v2plus,props:spec.props,runtimeModel:spec.runtimeModel};
  const result = await page.evaluate(exportGripStateInPage, {descriptor,sides,rig,frame,fps});
  return {...result,sourceIdentity:identity,specDescriptorSha256:sha(JSON.stringify(descriptor))};
}

export function exportGripStateInPage({descriptor,sides,rig,frame,fps}) {
  const T = window.__toonT, v = flareInspector.viewer, V = window.__v2p, P = window.__props;
  if (!T || !V?.hands?.on || !V.hands.mesh.visible || !window.__v3ContactR5 || !window.__hipKneeExtensionR1) throw Error('Expected fresh visible c1r2 on full r7/contact-r5');
  const H = V.hands.mesh, g = H.geometry, sk = H.skeleton, bs = sk.bones;
  if (bs.length!==52 || bs.filter(b=>/^v2p_[LR]_(thumb|index|middle|ring|pinky)[123]$/.test(b.name)).length!==30) throw Error('Expected 52 bones and 30 native finger bones');
  v.coach.updateMatrixWorld(true); H.updateMatrixWorld(true); sk.update();
  const indexOf = new Map(bs.map((b,i)=>[b,i]));
  const vector = a => new T.Vector3(...a);
  const attr = name => {const a=g.attributes[name];if(!a)throw Error('Missing hand geometry '+name);const out=[];for(let i=0;i<a.count;i++)for(let k=0;k<a.itemSize;k++)out.push(a.getComponent(i,k));return out;};
  const positions=attr('position'),normals=attr('normal'),skinIndex=attr('skinIndex'),skinWeight=attr('skinWeight');
  const world=[],q=new T.Vector3();
  for(let i=0;i<g.attributes.position.count;i++){H.getVertexPosition(i,q).applyMatrix4(H.matrixWorld);world.push(...q.toArray());}
  const bones=bs.map((b,i)=>({name:b.name,parentIndex:indexOf.get(b.parent)??-1,parentWorldMatrix:indexOf.has(b.parent)?null:b.parent.matrixWorld.toArray(),position:b.position.toArray(),quaternion:b.quaternion.toArray(),scale:b.scale.toArray(),matrixWorld:b.matrixWorld.toArray(),inverseBind:sk.boneInverses[i].toArray()}));
  const summary={},targets=[];
  for(const side of sides){
    const s=side==='left'?'L':'R',hb=v.coach.getObjectByName(side+'Hand'),inverse=hb.matrixWorld.clone().invert();
    const fingerNames=['thumb','index','middle','ring','pinky'];
    const all=[],palm=[],distal=Object.fromEntries(fingerNames.map(f=>[f,[]]));
    for(let i=0;i<g.attributes.position.count;i++){
      let best=-1,bone=-1;for(let k=0;k<4;k++){const w=skinWeight[4*i+k];if(w>best){best=w;bone=skinIndex[4*i+k];}}
      const name=bs[bone]?.name;if(name!==side+'Hand'&&!name?.startsWith('v2p_'+s+'_'))continue;
      all.push(i);q.fromArray(world,3*i).applyMatrix4(inverse);const longitudinal=q.x*(side==='left'?1:-1);
      if(name===side+'Hand'&&longitudinal>.035)palm.push(i);
      for(const f of fingerNames)if(name==='v2p_'+s+'_'+f+'3'){
        const b=V.bones[name],tip=rig.fingers[f].joints,delta=tip[3].map((x,k)=>(x-tip[2][k])*1.18*(side==='right'&&k===0?-1:1));
        const a=b.getWorldPosition(new T.Vector3()),end=vector(delta).applyMatrix4(b.matrixWorld).sub(a),d=vector(world.slice(3*i,3*i+3)).sub(a);
        if(d.dot(end)/end.lengthSq()>.55)distal[f].push(i);
      }
    }
    const currentFingerQuaternions={},fingerAnglesDegrees={};
    for(const f of fingerNames)for(let j=1;j<=3;j++){
      const name='v2p_'+s+'_'+f+j,b=V.bones[name];if(!b||!indexOf.has(b))throw Error('Finger reference differs from active hand skeleton');
      const a=b.quaternion.toArray();currentFingerQuaternions[f+j]=a;fingerAnglesDegrees[f+j]=2*Math.acos(Math.min(1,Math.abs(a[3])))*180/Math.PI;
    }
    const grip=P.gripData[side];
    const legacyGrip=grip?{centerWorld:grip.c.clone().applyQuaternion(hb.getWorldQuaternion(new T.Quaternion())).add(hb.getWorldPosition(new T.Vector3())).toArray(),axisWorld:grip.a.clone().applyQuaternion(hb.getWorldQuaternion(new T.Quaternion())).normalize().toArray(),radius:grip.r}:null;
    summary[side]={handBone:side+'Hand',handMatrixWorld:hb.matrixWorld.toArray(),handInverseWorld:inverse.toArray(),currentPose:V.cur[side],selectedByRuntime:V.pickHandPose(descriptor,side),currentFingerQuaternions,fingerAnglesDegrees,vertexGroups:{all,palm,distal},legacyGrip};
  }
  for(const object of P.list){
    const s=object.userData.spec;if(!s)continue;
    if(s.type==='band')for(const endpoint of ['from','to']){
      const ref=s[endpoint];if(!ref||Array.isArray(ref))continue;const side=sides.find(k=>ref.bone===k+'Hand');if(!side)continue;
      const center=P.pt(ref),other=P.pt(s[endpoint==='from'?'to':'from']);
      targets.push({side,kind:'band-end',endpoint,source:s,centerWorld:center.toArray(),leadDirectionWorld:other.clone().sub(center).normalize().toArray(),radius:s.r||.008,intendedGripAxisWorld:summary[side].legacyGrip?.axisWorld||null});
    }
    if(s.type==='dumbbell'){
      const side=sides.find(k=>s.attach===k+'Hand');if(!side)continue;
      const rod=object.children[0];if(rod?.geometry?.type!=='CylinderGeometry')throw Error('Unexpected dumbbell rod');
      targets.push({side,kind:'rod-cylinder',source:s,centerWorld:rod.getWorldPosition(new T.Vector3()).toArray(),axisWorld:new T.Vector3(0,1,0).applyQuaternion(rod.getWorldQuaternion(new T.Quaternion())).normalize().toArray(),radius:rod.geometry.parameters.radiusTop,length:rod.geometry.parameters.height});
    }
    if(s.type==='kettlebell'){
      const side=sides.find(k=>s.attach===k+'Hand');if(!side)continue;const handle=object.children[1],points=[];
      if(!handle?.geometry?.attributes?.position)throw Error('Kettlebell handle geometry missing');
      for(let i=0;i<handle.geometry.attributes.position.count;i++)points.push(...new T.Vector3().fromBufferAttribute(handle.geometry.attributes.position,i).applyMatrix4(handle.matrixWorld).toArray());
      targets.push({side,kind:'kettlebell-handle-mesh',source:s,positionsWorld:points,index:Array.from(handle.geometry.index.array)});
    }
  }
  for(const side of sides)if(!targets.some(t=>t.side===side))throw Error('No actual held prop target for '+side);
  return {format:'pose-hub-c1r2-grip-input@1',specId:descriptor.id,frame,fps,model:{profile:'training-human-v3-contact',version:'0.1.0-r5',hand:'hands-native-c1r2',handScale:1.18},poseNames:Object.keys(V.poses),current:summary,targets,mesh:{name:H.name,positions,normals,index:Array.from(g.index.array),skinIndex,skinWeight,bones,bindMatrix:H.bindMatrix.toArray(),bindMatrixInverse:H.bindMatrixInverse.toArray(),matrixWorld:H.matrixWorld.toArray(),positionsWorld:world},rig:{palmar:rig.palmar,fingers:rig.fingers},limits:['World samples are actual CPU-skinned native hand surfaces; camera visibility and final shader displacement are not certified.','Palm and distal groups are index selections for fitting, not a claim of contact or collision pass.','Band end, actual rod and kettlebell handle use measured current prop transforms. A band end is not silently treated as a validated cylindrical handle.','No hand pose, bone, spec, prop or model source was changed by this export.']};
}
