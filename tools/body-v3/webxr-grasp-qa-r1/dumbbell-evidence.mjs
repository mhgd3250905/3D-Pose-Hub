// CPU-only execution of the actual local prop factory; no browser/GPU.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import * as T from 'three';
const output=process.argv[2];if(!output)throw Error('Exclusive output JSON path required');
const root=process.cwd(),propPath='drill-anim/page/props.js';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const pin=p=>({path:path.join(root,p),sha256:sha(fs.readFileSync(p))});
const scene=new T.Scene(),coach=new T.Group();scene.add(coach);
for(const side of ['left','right']){const bone=new T.Bone();bone.name=side+'Hand';coach.add(bone);}
const window={__toonT:T,__glowU:{value:0},__rimU:{value:1}};
const context={window,flareInspector:{viewer:{scene,coach}},console};vm.createContext(context);vm.runInContext(fs.readFileSync(propPath,'utf8'),context,{filename:propPath});
const theme={props:{base:'#555555',rim:'#aaaaaa'}};
const specs=['h-db-curl','h-db-hammer-curl','h-db-press','h-db-floor-press','h-db-row'];
const actualSpecs=[];
for(const id of specs){const file=`drill-anim/specs/${id}.js`,spec=(await import(pathToFileURL(path.join(root,file)))).default;actualSpecs.push({id,source:pin(file),dumbbells:spec.props.filter(p=>p.type==='dumbbell')});}
function capture(spec){const o=window.__props.add(theme,spec);scene.updateMatrixWorld(true);const nodes=[];o.traverse(n=>{if(!n.isMesh)return;const positions=Array.from(n.geometry.attributes.position.array),worldPositions=[];for(let i=0;i<positions.length;i+=3)worldPositions.push(...new T.Vector3(...positions.slice(i,i+3)).applyMatrix4(n.matrixWorld).toArray());const scale=new T.Vector3();n.getWorldScale(scale);nodes.push({parameters:n.geometry.parameters,scale:scale.toArray(),positions:worldPositions,indices:Array.from(n.geometry.index.array)});});const scale=new T.Vector3();o.getWorldScale(scale);return {propScale:scale.toArray(),sceneScale:scene.scale.toArray(),nodes};}
const canonical=capture({type:'dumbbell',length:.30,plate:.042,attach:'world'});
const attached=[];
for(const boneScale of [1,2]){const bone=coach.getObjectByName('rightHand');bone.scale.setScalar(boneScale);scene.updateMatrixWorld(true);const result=capture({type:'dumbbell',length:.30,plate:.042,attach:'rightHand'});attached.push({syntheticBoneScale:boneScale,propScale:result.propScale,meshWorldScales:result.nodes.map(n=>n.scale)});}
for(const trial of attached)for(const scale of [trial.propScale,...trial.meshWorldScales])if(scale.some(v=>Math.abs(v-1)>1e-12))throw Error('Prop inherited unexpected scale');
const report={format:'pose-hub-project-dumbbell-dimensions-evidence@1',method:'Actual props.js executed with installed Three.js in CPU VM. Actual common specs imported. Scene is identity; no rendering. Synthetic bone scales1/2 verify placement does not inherit bone scale.',sources:[pin(propPath),pin('runtime/src/viewer.js'),pin('runtime/src/viewer-v3.js'),pin('node_modules/three/src/geometries/CylinderGeometry.js'),pin('package.json')],codeEvidence:{factoryLines:[31,33],sceneAttachmentLines:[291,292],boneRigidPlacementLines:[300,307],scaleStatement:'Dumbbell factory never sets scale; scene is the direct parent. P.place sets position/quaternion only. setTube scale applies to other tube props, not dumbbell.'},dimensions:{units:'metres',lengthParameter:.30,handle:{radius:.016,diameter:.032,length:.165,halfLength:.0825,radialSegments:16},plates:{circumradius:.042,apothem:.042*Math.cos(Math.PI/6),thickness:.060,centerOffsets:[-.111,.111],innerFaces:[-.081,.081],outerFaces:[-.141,.141],radialSegments:6},clearAxialGap:.162,totalOuterLength:.282},commonSpecs:actualSpecs,geometry:canonical,scaleChecks:attached,scope:'Common.042 plate curl/press/hammer profile. Floor-press/row explicitly use.045 plates; default unspecified plate is.055. Do not generalize.042 to every spec.'};
fs.writeFileSync(output,JSON.stringify(report,null,2),{flag:'wx'});console.log(output);
