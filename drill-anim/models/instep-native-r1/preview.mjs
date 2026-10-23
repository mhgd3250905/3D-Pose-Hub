import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {boot} from '../../lib/boot.mjs';
import {loadTheme} from '../../lib/config.mjs';
import {applyInstepNative,verifyInstepNative} from './loader.mjs';
import {applyHumanBarefootBridge} from '../barefoot-r5/loader.mjs';
import previous from '../../specs/h-kneeling-instep-stretch-rr5.js';
import spec from '../../specs/h-kneeling-instep-stretch-rr6.js';
const here=path.dirname(fileURLToPath(import.meta.url)),out=process.argv[2];
if(!out||fs.existsSync(out))throw Error('Provide a fresh output directory');
fs.mkdirSync(out,{recursive:true});
const frames=[0,30,60,120,150,180,239,240],geometryFrames=[0,30,60,150],baseline=new Map();
const theme=loadTheme(),summary={frames,reviewed:false,releaseEligible:false,comparisons:[]};
const save=(name,url)=>fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
for(const [label,s,load]of [['baseline',previous,applyHumanBarefootBridge],['native',spec,applyInstepNative]]) {
 const {b,p}=await boot({size:1080,pr:1,theme});
 try {
  await load(p,s);
  await p.evaluate(([s,t])=>{__setHighlight(s.highlight);for(const prop of s.props||[])__props.add(t,prop);__drill.setupCamera(s,1080);},[s,theme]);
  await p.addScriptTag({content:fs.readFileSync(path.join(here,'../../tools/v2/browser-layers.js'),'utf8')});
  for(const frame of frames) {
   const capture=await p.evaluate(([s,f])=>__v2Layers.capture(s,f/30,f,null,['body']),[s,frame]);
   save(label+'-full-'+frame,capture.body);
   const geo=await p.evaluate(captureHands=>{
    const T=__toonT,v=flareInspector.viewer;v.coach.updateMatrixWorld(true);
    const mesh=o=>{
     o.skeleton.update();const g=o.geometry,pos=[],q=new T.Vector3();
     for(let i=0;i<g.attributes.position.count;i++){o.getVertexPosition(i,q).applyMatrix4(o.matrixWorld);pos.push(q.x,q.y,q.z);}
     return {pos,index:Array.from(g.index.array),bones:o.skeleton.bones.map(b=>b.name),joints:Array.from(g.attributes.skinIndex.array),weights:Array.from(g.attributes.skinWeight.array)};
    };
    const feet=mesh(__barefootR5.piece.mesh);
    const result={feet:{pos:feet.pos,index:feet.index,normals:Array.from(__barefootR5.piece.mesh.geometry.attributes.normal.array)},bridge:__barefootR5.last};
    if(captureHands)result.hands={hands:mesh(__v2p.hands.mesh),limbs:mesh(__v2p.limbs.mesh)};
    return result;
   },label==='native'&&geometryFrames.includes(frame));
   if(label==='baseline')baseline.set(frame,{feet:geo.feet,metrics:capture.metrics});
   else {
    const old=baseline.get(frame),max=(a,b)=>a.reduce((m,v,i)=>Math.max(m,Math.abs(v-b[i])),0);
    const row={frame,feetVertices:geo.feet.pos.length/3,footMaxWorldDeltaMm:max(old.feet.pos,geo.feet.pos)*1000,footMaxNormalDelta:max(old.feet.normals,geo.feet.normals),footIndicesEqual:JSON.stringify(old.feet.index)===JSON.stringify(geo.feet.index),bridge:geo.bridge,metrics:capture.metrics};
    row.jointMaxDeltaMm=Math.max(...Object.keys(old.metrics.J).map(k=>max(old.metrics.J[k],capture.metrics.J[k])*1000));
    summary.comparisons.push(row);
    if(geo.hands)fs.writeFileSync(path.join(out,`geometry-${frame}.json`),JSON.stringify({poses:{['frame-'+frame]:geo.hands}}));
   }
   if([0,60,150].includes(frame))for(const side of ['left','right']) {
    const url=await p.evaluate(side=>{
     const T=__toonT,v=flareInspector.viewer,h=v.coach.getObjectByName(side+'Hand'),q=h.getWorldQuaternion(new T.Quaternion());
     const center=new T.Vector3(side==='left'?.085:-.085,0,0).applyMatrix4(h.matrixWorld),dir=new T.Vector3(0,1,.25).applyQuaternion(q).normalize();
     const camera=new T.OrthographicCamera(-.15,.15,.15,-.15,.001,3);camera.up.set(side==='left'?1:-1,0,0).applyQuaternion(q);camera.position.copy(center).addScaledVector(dir,.55);camera.lookAt(center);camera.updateMatrixWorld();
     v.renderer.render(v.scene,camera);return v.renderer.domElement.toDataURL('image/png');
    },side);save(`${label}-${side}-${frame}`,url);
   }
   console.log(label,frame);
  }
 }finally{await b.close();}
}
verifyInstepNative();
fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(summary,null,2)+'\n');
if(summary.comparisons.some(r=>r.footMaxWorldDeltaMm>1e-5||r.footMaxNormalDelta>1e-6||!r.footIndicesEqual||r.jointMaxDeltaMm>1e-5))throw Error('Foot bridge or original trajectory changed');
