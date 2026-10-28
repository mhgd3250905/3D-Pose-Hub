import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const REPO=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
export const SOURCE='hands-native-c1r2-symmetric-r1';
export const imp=rel=>import(pathToFileURL(path.join(REPO,rel)).href);
export const readJson=rel=>JSON.parse(fs.readFileSync(path.join(REPO,rel),'utf8'));
export const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
export function pinnedRuntime(file){
 const r=JSON.parse(fs.readFileSync(file,'utf8'));
 if(r.format!=='pose-hub-render-runtime@1')throw Error('Pinned runtime required');
 for(const ref of [r.playwrightModule,r.browserExecutable]){const raw=fs.readFileSync(ref.path);if(raw.length!==ref.bytes||sha(raw)!==ref.sha256)throw Error('Runtime identity changed');}
 process.env.PLAYWRIGHT_MODULE=r.playwrightModule.path;process.env.CHROMIUM_ARGS=r.chromiumArgs.join(' ');
 const browsersPath=r.playwrightBrowsersPath||r.defaultConfig?.playwrightBrowsersPath;if(browsersPath)process.env.PLAYWRIGHT_BROWSERS_PATH=browsersPath;
 if(r.chromiumChannel)process.env.CHROMIUM_CHANNEL=r.chromiumChannel;return r;
}
export async function verifyRuntimeSelection(r){
 const {config}=await imp('drill-anim/lib/config.mjs'),c=config(),same=(a,b)=>typeof a==='string'&&typeof b==='string'&&path.resolve(a).toLowerCase()===path.resolve(b).toLowerCase();
 const browsersPath=r.playwrightBrowsersPath||r.defaultConfig?.playwrightBrowsersPath;
 if((c.chromium_channel||null)!==(r.chromiumChannel||null)||!same(c.playwright_module,r.playwrightModule.path)||!same(c.playwright_browsers_path,browsersPath))throw Error('Effective runtime config differs from pinned runtime');
 const {chromium}=await import(pathToFileURL(r.playwrightModule.path).href);
 if(r.chromiumChannel||!same(chromium.executablePath(),r.browserExecutable.path))throw Error('Resolved browser executable differs from pinned runtime');
 return {resolvedExecutable:chromium.executablePath(),sha256:r.browserExecutable.sha256};
}
export function sourcePins(){return ['hands-base.json','hands-rig.json','manifest.json'].map(name=>{const rel='drill-anim/models/'+SOURCE+'/'+name,raw=fs.readFileSync(path.join(REPO,rel));return {path:rel,bytes:raw.length,sha256:sha(raw)};});}
export function saveJson(file,data){fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n',{flag:'wx'});}
export function saveImage(file,uri){fs.writeFileSync(file,Buffer.from(uri.split(',')[1],'base64'),{flag:'wx'});}
export async function measureHands(page){return page.evaluate(({handSeam,limbSeam})=>{
 const T=__toonT,v=flareInspector.viewer,H=__v2p.hands.mesh,g=H.geometry,sk=H.skeleton;
 v.coach.updateMatrixWorld(true);H.updateMatrixWorld(true);sk.update();
 const positions=[],q=new T.Vector3();for(let i=0;i<g.attributes.position.count;i++){H.getVertexPosition(i,q).applyMatrix4(H.matrixWorld);positions.push(...q.toArray());}
 const sides={};for(const side of ['left','right']){
  const hb=v.coach.getObjectByName(side+'Hand'),inv=hb.matrixWorld.clone().invert(),ids=[],local=[];
  const prefix='v2p_'+side[0].toUpperCase()+'_';
  for(let i=0;i<g.attributes.position.count;i++){let w=-1,n='';for(let k=0;k<4;k++)if(g.attributes.skinWeight.getComponent(i,k)>w){w=g.attributes.skinWeight.getComponent(i,k);n=sk.bones[g.attributes.skinIndex.getComponent(i,k)].name;}if(n===side+'Hand'||n.startsWith(prefix)){ids.push(i);local.push(...q.fromArray(positions,3*i).applyMatrix4(inv).toArray());}}
  const bs=['UpperArm','Forearm','Hand'].map(x=>v.coach.getObjectByName(side+x).getWorldPosition(new T.Vector3()));
  sides[side]={ids,local,handMatrix:hb.matrixWorld.toArray(),upperArmMm:bs[0].distanceTo(bs[1])*1000,forearmMm:bs[1].distanceTo(bs[2])*1000,pose:__v2p.cur[side]};
 }
 const limb=__v2p.limbs.mesh;limb.updateMatrixWorld(true);limb.skeleton.update();const seamDistances=[];
 for(let i=0;i<handSeam.vid.length;i++){
  const j=limbSeam.vid.findIndex((id,k)=>id===handSeam.vid[i]&&limbSeam.mesh[k]===handSeam.mesh[i]);
  if(j<0)throw Error('Missing corresponding wrist seam');
  const a=new T.Vector3().fromArray(positions,(handSeam.first+i)*3),z=limb.getVertexPosition(limbSeam.first+j,new T.Vector3()).applyMatrix4(limb.matrixWorld);
  seamDistances.push(a.distanceTo(z)*1000);
 }
 return {positions,index:Array.from(g.index.array),sides,wristSeam:{vertices:seamDistances.length,maxGapMm:Math.max(...seamDistances),rmsGapMm:Math.sqrt(seamDistances.reduce((a,x)=>a+x*x,0)/seamDistances.length)}};
},{handSeam:readJson('drill-anim/models/'+SOURCE+'/hands-base.json').seam,limbSeam:readJson('drill-anim/models/training-human-v2plus-limbs-base.json').seam});}
export async function handPictures(page,{pose,side,prop=false}){return page.evaluate(({pose,side,prop})=>{
 const T=__toonT,v=flareInspector.viewer,H=__v2p.hands.mesh,b=v.coach.getObjectByName(side+'Hand'),sign=side==='left'?1:-1;
 const center=new T.Vector3(sign*.082,-.006,0).applyMatrix4(b.matrixWorld),q=b.getWorldQuaternion(new T.Quaternion()),out={};
 // Isolate shape close-ups; full-body views and measured seam pairs inspect integration.
 const visible=[];v.scene.traverse(o=>{if(!o.isMesh)return;visible.push([o,o.visible]);let root=o,held=false;while(root){if(prop&&__props.list.includes(root)&&root.userData.spec?.attach===side+'Hand'){held=true;break;}root=root.parent;}o.visible=Boolean(o.visible&&(o===H||held||o.userData.qaHandSurface));});
 const originalGeometry=H.geometry,isolated=originalGeometry.clone(),indices=[];
 for(let i=0;i<originalGeometry.index.count;i+=3){const ids=[0,1,2].map(k=>originalGeometry.index.getX(i+k));if(ids.every(id=>originalGeometry.attributes.position.getX(id)*sign>0))indices.push(...ids);}
 isolated.setIndex(indices);H.geometry=isolated;
 try{for(const [view,d]of [['palm',[0,-1,.35]],['back',[0,1,.35]],['edge',[0,-.1,1]]]){
  const camera=new T.OrthographicCamera(-.145,.145,.145,-.145,.01,5);
  camera.position.copy(center).add(new T.Vector3(...d).applyQuaternion(q));camera.up.set(sign,0,0).applyQuaternion(q);camera.lookAt(center);camera.updateMatrixWorld();v.renderer.clear(true,true,true);v.renderer.render(v.scene,camera);out[view]=v.renderer.domElement.toDataURL('image/png');
 }}finally{H.geometry=originalGeometry;isolated.dispose();for(const [o,on]of visible)o.visible=on;}
 return out;
},{pose,side,prop});}
export async function initView(page){await page.evaluate(()=>{
 const v=flareInspector.viewer;v.animate=()=>{};v.playing=false;__setHighlight({groups:[],side:'both'});__glowU.value=0;__rimU.value=1;__toonUni.uBreath.value=0;__toonUni.uPulse.value=0;
 for(const o of [v.shadowCatcher,v.stageFloor,v.stageGrid,v.stageRing])if(o)o.visible=false;
 v.scene.background=null;v.renderer.setClearColor(0xf0f2f4,1);
});}
