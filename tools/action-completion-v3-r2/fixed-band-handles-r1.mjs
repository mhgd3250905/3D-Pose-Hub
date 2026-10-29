import fs from 'node:fs';
import crypto from 'node:crypto';
import {verify as verifyWrist} from '../body-v3/webxr-wrist-join-r1/loader.mjs';
const root=new URL('../../',import.meta.url),folder=new URL('../../drill-anim/models/fixed-band-handles-r1/',import.meta.url);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export function verify(){
  const manifest=read(new URL('manifest.json',folder));
  for(const [file,want]of Object.entries(manifest.sha256Lf)){
    const b=fs.readFileSync(new URL(file,root)),actual=crypto.createHash('sha256').update(/\.(js|mjs|json)$/.test(file)?Buffer.from(b.toString('utf8').replaceAll('\r\n','\n')):b).digest('hex');
    if(actual!==want)throw Error('Band-handle source changed: '+file);
  }
  return manifest;
}
export function payload({verifyManifest=true}={}){
  if(verifyManifest)verify();
  const frozen=verifyWrist(),config=read(new URL('config.json',folder));
  const sides={};
  for(const side of ['left','right']){
    const shaft=frozen.props[side].primitives.filter(p=>p.name==='shaft');
    if(shaft.length!==1)throw Error('Expected one exact frozen shaft');
    sides[side]={shaft:shaft[0],hand:frozen.hands[side],map:frozen.recipe.neutralFrames[side].webCanonicalToHandLocalRowMajor};
  }
  return {config,sides,sourcePins:frozen.sourcePins};
}

// Shared CPU/browser geometry checker; no model mutation and no approximated finger capsules.
export function contactMath(T){
  const V=a=>new T.Vector3(...a),clamp=x=>Math.max(0,Math.min(1,x));
  function edgeDistance(p1,q1,p2,q2){
    const d1=q1.clone().sub(p1),d2=q2.clone().sub(p2),r=p1.clone().sub(p2),a=d1.dot(d1),e=d2.dot(d2),f=d2.dot(r);let s=0,t=0;
    if(a<1e-18)t=clamp(f/e);else{const c=d1.dot(r);if(e<1e-18)s=clamp(-c/a);else{const b=d1.dot(d2),den=a*e-b*b;s=den!==0?clamp((b*f-c*e)/den):0;t=(b*s+f)/e;if(t<0){t=0;s=clamp(-c/a);}else if(t>1){t=1;s=clamp((b-c)/a);}}}
    return p1.clone().addScaledVector(d1,s).distanceTo(p2.clone().addScaledVector(d2,t));
  }
  function triangles(hand){
    const points=[];for(let i=0;i<hand.positions.length;i+=3)points.push(V(hand.positions.slice(i,i+3)));
    const out=[];for(let i=0;i<hand.indices.length;i+=3){const ids=hand.indices.slice(i,i+3);out.push(new T.Triangle(...ids.map(j=>points[j])));}return out;
  }
  function segmentDistance(A,B,faces){
    const direction=B.clone().sub(A),length=direction.length(),ray=new T.Ray(A,direction.normalize());let best=Infinity;
    for(const f of faces){
      const hit=ray.intersectTriangle(f.a,f.b,f.c,false,new T.Vector3());if(hit&&hit.distanceTo(A)<=length)return 0;
      best=Math.min(best,f.closestPointToPoint(A,new T.Vector3()).distanceTo(A),f.closestPointToPoint(B,new T.Vector3()).distanceTo(B),
        edgeDistance(A,B,f.a,f.b),edgeDistance(A,B,f.b,f.c),edgeDistance(A,B,f.c,f.a));
    }return best;
  }
  function yoke(hand,cfg){
    const center=V(hand.cylinder.center),axis=V(hand.cylinder.axis),back=V([0,0,-cfg.yokeBackOffsetM]);
    const end=s=>center.clone().addScaledVector(axis,s*cfg.gripHalfLengthM),outer=s=>center.clone().addScaledVector(axis,s*cfg.yokeHalfSpanM);
    return [[end(-1),outer(-1)],[end(1),outer(1)],[outer(-1),outer(-1).add(back)],[outer(1),outer(1).add(back)],
      [outer(-1).add(back),outer(1).add(back)]];
  }
  return {V,triangles,segmentDistance,yoke};
}

export function installInPage(data){
  const T=window.__toonT,v=flareInspector.viewer,state=window.__fixedWristCorrectionsR1;
  if(window.__fixedBandHandlesR1||!state||state.phase!=='ready'||!window.__webxrWristJoin?.active)throw Error('Band handles require fresh ready fixed-wrist composition');
  const cfg=data.config,math=window.__fixedBandContactMath(T),parts={},owned=[],materials=[];
  const steel=new T.MeshToonMaterial({color:0x4b5159}),socketMaterial=new T.MeshToonMaterial({color:0x373d45});materials.push(steel,socketMaterial);
  const tube=(a,b,r)=>{const g=new T.CylinderGeometry(r,r,a.distanceTo(b),16),mesh=new T.Mesh(g,steel);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());owned.push(g);return mesh;};
  for(const side of ['left','right']){
    const input=data.sides[side],hand=v.coach.getObjectByName(side+'Hand'),group=new T.Group();group.name='fixed_band_handle_'+side;
    group.matrixAutoUpdate=false;group.matrix.fromArray(input.map).transpose();hand.add(group);
    const p=input.shaft,transform=new T.Matrix4();for(const x of p.transforms)transform.multiply(x.matrix?new T.Matrix4().fromArray(x.matrix):new T.Matrix4().compose(math.V(x.translation||[0,0,0]),new T.Quaternion(...(x.rotation||[0,0,0,1])),math.V(x.scale||[1,1,1])));
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p.positions,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(p.normals,3));geometry.setIndex(p.indices);geometry.applyMatrix4(transform);owned.push(geometry);
    const material=new T.MeshToonMaterial({color:new T.Color().setRGB(...p.color)});materials.push(material);group.add(new T.Mesh(geometry,material));
    for(const [a,b]of math.yoke(input.hand,cfg))group.add(tube(a,b,cfg.yokeRadiusM));
    const sg=new T.SphereGeometry(cfg.socketRadiusM,16,12),socket=new T.Mesh(sg,socketMaterial);owned.push(sg);socket.position.fromArray(cfg.canonicalConnector);group.add(socket);
    group.traverse(o=>{o.frustumCulled=false;});parts[side]={group,hand,faces:math.triangles(input.hand),map:new T.Matrix4().fromArray(input.map).transpose()};
  }
  const prior=state.gate.target;
  const api={profile:cfg.profile,version:cfg.version,last:null,drawCount:0,renderPhase:'fixed-wrist gate.target: actual wrist geometry active'};
  const wrapped=function(...args){
    const saved=[],observed={};
    const record={profile:cfg.profile,version:cfg.version,drawId:++api.drawCount,completed:false,phase:api.renderPhase,sides:observed};api.last=record;
    try{
      v.coach.updateMatrixWorld(true);
      for(const side of ['left','right']){
        const p=parts[side];p.group.updateMatrixWorld(true);
        const props=__props.list.filter(o=>o.userData.spec?.type==='band'&&o.userData.spec.from?.bone===side+'Hand');
        if(props.length!==1)throw Error('Expected exactly one handled band per hand');
        const prop=props[0],s=prop.userData.spec,world=p.hand.matrixWorld.clone().multiply(p.map),inverse=world.clone().invert();
        const connector=math.V(cfg.canonicalConnector).applyMatrix4(world),authored=__props.pt(s.from),end=__props.pt(s.to);
        if(connector.distanceTo(authored)>1e-8||s.r!==cfg.bandRadiusM||s.sag!==0)throw Error('Handled-band spec/connector mismatch');
        const centerline=math.segmentDistance(connector.clone().applyMatrix4(inverse),end.clone().applyMatrix4(inverse),p.faces),gap=centerline-cfg.bandRadiusM;
        if(gap<cfg.minimumBandClearanceM)throw Error('Actual-render band/hand clearance failed: '+side+' '+gap);
        const curve=new T.QuadraticBezierCurve3(connector,connector.clone().lerp(end,.5),end),temporary=new T.TubeGeometry(curve,24,s.r,8);
        saved.push({mesh:prop,geometry:prop.geometry,temporary});prop.geometry=temporary;
        observed[side]={connectorWorld:connector.toArray(),footAnchorWorld:end.toArray(),connectorResidualMm:connector.distanceTo(authored)*1000,bandHandClearanceLowerBoundMm:gap*1000,handMatrixWorld:p.hand.matrixWorld.toArray()};
      }
      const result=prior.apply(this,args);record.completed=true;return result;
    }finally{for(const s of saved){s.mesh.geometry=s.geometry;s.temporary.dispose();}}
  };
  state.gate.target=wrapped;
  api.detach=()=>{if(state.gate.target!==wrapped)throw Error('Band-handle hook changed');state.gate.target=prior;for(const p of Object.values(parts))p.group.removeFromParent();for(const g of owned)g.dispose();for(const m of materials)m.dispose();delete window.__fixedBandHandlesR1;};
  window.__fixedBandHandlesR1=api;return {profile:cfg.profile,version:cfg.version,sourcePins:data.sourcePins,requiresActualRender:true};
}
export async function install(page,descriptor={}){
  const data=payload();if(descriptor.id&&descriptor.id!==data.config.profile||descriptor.version&&descriptor.version!==data.config.version)throw Error('Band-handle descriptor mismatch');
  await page.addScriptTag({content:'window.__fixedBandContactMath='+contactMath.toString()+';'});
  return page.evaluate(installInPage,data);
}
