// Representative contact poses; captures inside the actual render transaction.
import fs from 'node:fs';import path from 'node:path';
import {imp,readJson,pinnedRuntime,verifyRuntimeSelection,saveJson,saveImage,initView} from './hand-qa-runtime.mjs';
const [out,runtimeFile]=process.argv.slice(2);if(!out||!runtimeFile||fs.existsSync(out))throw Error('Fresh output and pinned runtime required');
const rt=pinnedRuntime(runtimeFile);await verifyRuntimeSelection(rt);fs.mkdirSync(out,{recursive:true});
const body=await imp('drill-anim/models/training-human-v3-armfix-r2/loader.mjs'),presets=await imp('drill-anim/models/fixed-hand-presets-r1/loader.mjs'),fix=await imp('drill-anim/models/hand-wrist-corrective-r1/loader.mjs');
const {loadTheme}=await imp('drill-anim/lib/config.mjs'),theme=loadTheme();
const grasp=presets.select((await imp('drill-anim/specs/h-db-reverse-curl-r2.js')).default,{left:'grasp-32mm',right:'grasp-32mm'});
const support=presets.select((await imp('drill-anim/specs/h-bear-plank-r3.js')).default,{left:'support',right:'support'});
const hs=readJson('drill-anim/models/hands-native-c1r2-symmetric-r1/hands-base.json').seam,ls=readJson('drill-anim/models/training-human-v2plus-limbs-base.json').seam;
const pairs=hs.vid.map((id,i)=>[hs.first+i,ls.first+ls.vid.findIndex((x,k)=>x===id&&ls.mesh[k]===hs.mesh[i])]);
const {b,p}=await body.boot({size:640,pr:1,theme}),report={format:'pose-hub-corrective-contact-check@1',reviewed:false,releaseEligible:false,rows:[]};
try{
 await body.applyV3(p,grasp);await initView(p);report.presets=await presets.install(p);report.corrective=await fix.install(p);
 await p.evaluate(([s,th])=>{for(const prop of s.props)__props.add(th,prop);},[grasp,theme]);
 for(const [role,spec]of [['grasp',grasp],['support',support]])for(const time of [0,2,4,8]){
  const result=await p.evaluate(({spec,time,role,pairs})=>{
   const T=__toonT,v=flareInspector.viewer,C=__wristCorrective,H=__v2p.hands.mesh,L=__v2p.limbs.mesh;
   __drill.applyAt(spec,time,null);__props.update();for(const o of __props.list)o.visible=role==='grasp';
   const originals=[H,L].flatMap(m=>['position','normal'].map(k=>m.geometry.attributes[k].array.slice()));
   const protectedIds=[];for(let i=0;i<H.geometry.attributes.position.count;i++){
    let w=-1,name='';for(let k=0;k<4;k++)if(H.geometry.attributes.skinWeight.getComponent(i,k)>w){w=H.geometry.attributes.skinWeight.getComponent(i,k);name=H.skeleton.bones[H.geometry.attributes.skinIndex.getComponent(i,k)].name;}
    if(/^v2p_[LR]_(thumb|index|middle|ring|pinky)[23]$/.test(name))protectedIds.push(i);
   }
   function capture(){v.coach.updateMatrixWorld(true);H.skeleton.update();L.skeleton.update();const q=new T.Vector3(),positions=[];for(let i=0;i<H.geometry.attributes.position.count;i++){H.getVertexPosition(i,q).applyMatrix4(H.matrixWorld);positions.push(...q.toArray());}
    let seamMax=0;for(const [hi,li]of pairs)seamMax=Math.max(seamMax,q.fromArray(positions,hi*3).distanceTo(L.getVertexPosition(li,new T.Vector3()).applyMatrix4(L.matrixWorld)));
    return {positions,seamMaxMm:seamMax*1000};}
   C.setEnabled(false);const baseline=C.sample(capture);C.setEnabled(true);const candidate=C.sample(capture);
   let protectedMax=0;for(const i of protectedIds)protectedMax=Math.max(protectedMax,new T.Vector3().fromArray(baseline.positions,i*3).distanceTo(new T.Vector3().fromArray(candidate.positions,i*3)));
   let restored=true;[H,L].flatMap(m=>['position','normal'].map(k=>m.geometry.attributes[k].array)).forEach((a,j)=>{if(a.some((x,i)=>x!==originals[j][i]))restored=false;});
   const floorMinMm=role==='support'?Math.min(...candidate.positions.filter((_,i)=>i%3===1))*1000:null;
   const camera=new T.OrthographicCamera(-1.12,1.12,1.12,-1.12,.01,20),target=new T.Vector3(0,.85,0);camera.position.copy(target).add(new T.Vector3(2,.5,4));camera.lookAt(target);camera.updateMatrixWorld();v.renderer.clear(true,true,true);v.renderer.render(v.scene,camera);
   return {row:{role,time,protectedVertices:protectedIds.length,protectedDistalMaxMm:protectedMax*1000,seamMaxMm:candidate.seamMaxMm,floorMinMm,buffersRestoredExactly:restored,pass:protectedIds.length>1000&&protectedMax<.00005&&candidate.seamMaxMm<.1&&restored&&(floorMinMm===null||floorMinMm>=-.1)},image:v.renderer.domElement.toDataURL('image/png'),mesh:{positions:candidate.positions,index:Array.from(H.geometry.index.array)}};
  },{spec,time,role,pairs});
  report.rows.push(result.row);saveJson(path.join(out,role+'-'+time+'-mesh.json'),result.mesh);if([0,2].includes(time))saveImage(path.join(out,role+'-'+time+'-body.png'),result.image);
  console.log(JSON.stringify(result.row));
 }
 report.pass=report.rows.every(r=>r.pass);saveJson(path.join(out,'report.json'),report);if(!report.pass)process.exitCode=1;
}finally{await b.close();}
