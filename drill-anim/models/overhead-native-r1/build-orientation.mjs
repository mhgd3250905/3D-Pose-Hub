// Derive neutral wrist orientation from the actual forearm bones. The body,
// wrist positions and elbow arc are never modified by this export.
import fs from 'node:fs';
import {boot} from '../../lib/boot.mjs';
import {loadTheme} from '../../lib/config.mjs';
import {applyOverheadNative} from './loader.mjs';
import candidate from '../../specs/h-db-overhead-triceps-extension-rr3.js';
import previous from '../../specs/h-db-overhead-triceps-extension-rr2.js';
const out=process.argv[2];if(!out||fs.existsSync(out))throw Error('Use a fresh orientation export path');
const {b,p}=await boot({size:480,pr:1,theme:loadTheme()});
try{
 await applyOverheadNative(p,candidate);
 const result=await p.evaluate(s=>{
  const T=__toonT,v=flareInspector.viewer;
  v.motion.reset();v.coach.updateMatrixWorld(true);
  const relatives={};for(const side of ['left','right'])relatives[side]=v.coach.getObjectByName(side+'Forearm').getWorldQuaternion(new T.Quaternion()).invert().multiply(v.coach.getObjectByName(side+'Hand').getWorldQuaternion(new T.Quaternion()));
  const rows=[];
  for(let f=0;f<=240;f++){
   __drill.applyAt(s,f/30,null);v.coach.updateMatrixWorld(true);
   const row={frame:f};for(const side of ['left','right']){
    const sign=side==='left'?1:-1,q=v.coach.getObjectByName(side+'Forearm').getWorldQuaternion(new T.Quaternion()).multiply(relatives[side]);
    row[side]={finger:new T.Vector3(sign*.98253144,.05483374,.17783482).applyQuaternion(q).toArray(),normal:new T.Vector3(sign*.06068526,-.99777448,-.02762938).applyQuaternion(q).toArray()};
   }rows.push(row);
  }
  return {sourceSpec:s.id,method:'handWorldQ = forearmWorldQ * inverse(restForearmWorldQ) * restHandWorldQ',restRelativeQ:Object.fromEntries(Object.entries(relatives).map(([k,q])=>[k,q.toArray()])),rows};
 },previous);
 fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(out);
}finally{await b.close();}
