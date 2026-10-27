// Exercise the versioned v3 wrapper across real configuration switches and
// the three joint-audit extreme poses. No P2 paired candidate is installed.
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
if(process.argv.length!==3)throw Error('Usage: node verify-v3-wrapper-r1.mjs <new-output-directory>');
const out=path.resolve(process.argv[2]);fs.mkdirSync(out);
const imp=f=>import(pathToFileURL(path.join(repo,f)).href);
const {loadTheme}=await imp('drill-anim/lib/config.mjs');
const wrapper=await imp('drill-anim/models/training-human-v3-head-neck-r2/loader.mjs');
const {default:source}=await imp('drill-anim/specs/a-deep-squat-r3.js');
const spec={...structuredClone(source),modelProfile:'training-human-v2plus-hands-native',nativeHands:{version:'1.0.0-r3'},v2plus:{outfit:'compression',torso:'base',limbs:'base',hands:'base',skin:'realistic'}};
const {b,p}=await wrapper.boot({size:480,pr:1,theme:loadTheme()});
try {
 const result=await wrapper.applyV3(p,spec,{}),report={result,switches:[],extremes:[]};
 const cases=[['base',spec],['sleeveless',{...spec,v2plus:{...spec.v2plus,sleeve:'none'}}],['no-torso',{...spec,v2plus:{outfit:'compression'}}],['no-outfit',{...spec,v2plus:{}}],['base-restored',spec]];
 for(const [name,s] of cases){
  const state=await p.evaluate(([s,name])=>{__drill.selectModelProfile(s);__drill.applyAt(s,1,null);const v=flareInspector.viewer,q=window.__v3HeadNeckFragment;v.coach.updateMatrixWorld(true);
   const objects=[];v.coach.traverse(o=>{if(o.isSkinnedMesh&&o.name==='V3_Head_Neck_Restored_R1')objects.push(o);});
   const body=v.coach.getObjectByName('Coach_Body');const sameBones=q.fragment.mesh.skeleton.bones.every(x=>body.skeleton.bones.includes(x));
   const info={name,originalNeckVisible:q.neck.visible,originalHeadVisible:q.head.visible,fragmentVisible:q.fragment.mesh.visible,fragmentAttached:q.fragment.mesh.parent!==null,fragmentCopies:objects.length,sameBones,materials:q.fragment.mesh.material.length};
   if(info.originalNeckVisible||info.originalHeadVisible||!info.fragmentVisible||!info.fragmentAttached||info.fragmentCopies!==1||!sameBones||info.materials!==2)throw Error(JSON.stringify(info));
   const T=__toonT,c=v.coach.getObjectByName('neck').getWorldPosition(new T.Vector3()),cam=new T.PerspectiveCamera(35,1,.02,20);cam.position.copy(c).add(new T.Vector3(.8,.1,0));cam.lookAt(c.clone().add(new T.Vector3(0,.1,0)));v.renderer.setClearColor(0x101318,1);v.renderer.render(v.scene,cam);return {...info,picture:v.renderer.domElement.toDataURL('image/png')};},[s,name]);
  fs.writeFileSync(path.join(out,`${name}.png`),Buffer.from(state.picture.split(',')[1],'base64'),{flag:'wx'});delete state.picture;report.switches.push(state);console.log(JSON.stringify(state));
 }
 for(const [name,ax,deg] of [['neckflex',[1,0,0],40],['neckext',[1,0,0],-35],['neckrot',[0,1,0],65]]){
  const state=await p.evaluate(([name,ax,deg])=>{const T=__toonT,v=flareInspector.viewer;v.motion.reset();const nk=v.coach.getObjectByName('neck'),pv=nk.getWorldPosition(new T.Vector3()),axw=new T.Vector3(...ax).applyQuaternion(v.coach.getObjectByName('torso').getWorldQuaternion(new T.Quaternion()));for(const [n,f] of [['neck',.5],['head',1]]){const bn=v.coach.getObjectByName(n),q=new T.Quaternion().setFromAxisAngle(axw,deg*f*Math.PI/180),wp=bn.getWorldPosition(new T.Vector3()).sub(pv).applyQuaternion(n==='head'?new T.Quaternion().setFromAxisAngle(axw,deg*.5*Math.PI/180):q).add(pv),wq=q.clone().multiply(bn.getWorldQuaternion(new T.Quaternion())),pq=bn.parent.getWorldQuaternion(new T.Quaternion()).invert();bn.position.copy(bn.parent.worldToLocal(wp));bn.quaternion.copy(pq.multiply(wq));bn.updateMatrixWorld(true);}
   v.coach.updateMatrixWorld(true);const m=window.__v3HeadNeckFragment.fragment.mesh,g=m.geometry,groups=g.groups,index=g.index.array,sets=groups.map(x=>new Set(index.slice(x.start,x.start+x.count))),common=[...sets[0]].filter(i=>sets[1].has(i));if(common.length!==162)throw Error('seam mismatch');const pictures={};const c=nk.getWorldPosition(new T.Vector3());for(const [side,d] of [['side',[1,0,0]],['back',[0,0,-1]]]){const cam=new T.PerspectiveCamera(35,1,.02,20),target=c.clone().add(new T.Vector3(0,.10,0));cam.position.copy(target).add(new T.Vector3(...d).multiplyScalar(.8));cam.lookAt(target);v.renderer.render(v.scene,cam);pictures[side]=v.renderer.domElement.toDataURL('image/png');}return {name,commonSeamVertices:common.length,visible:m.visible,pictures};},[name,ax,deg]);
  for(const [side,data] of Object.entries(state.pictures))fs.writeFileSync(path.join(out,`${name}-${side}.png`),Buffer.from(data.split(',')[1],'base64'),{flag:'wx'});delete state.pictures;report.extremes.push(state);console.log(JSON.stringify(state));
 }
 report.detached=await wrapper.detach(p);report.detachedState=await p.evaluate(()=>({installed:!!window.__v3HeadNeckFragment,neck:flareInspector.viewer.coach.getObjectByName('Mesh001').visible,head:flareInspector.viewer.coach.getObjectByName('Toon_Mannequin_Head_v5').visible}));
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2),{flag:'wx'});
}finally{await b.close();}