import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
export const PROFILE='training-human-v3-armfix',VERSION='0.1.0-r1';
export async function verify(){
  const m=JSON.parse(fs.readFileSync(path.join(here,'manifest.json'),'utf8'));
  if(m.profile!==PROFILE||m.version!==VERSION||m.hashPolicy!=='utf8-crlf-to-lf-text; binary-raw')throw Error('armfix-r1 manifest identity');
  for(const[rel,expected]of Object.entries(m.sha256)){
    const file=path.resolve(repo,rel);if(!file.startsWith(repo+path.sep))throw Error('armfix-r1 source outside repository');
    const raw=fs.readFileSync(file),data=rel.endsWith('.glb')?raw:Buffer.from(raw.toString('utf8').replaceAll('\r\n','\n'));
    if(crypto.createHash('sha256').update(data).digest('hex')!==expected)throw Error('armfix-r1 SHA '+rel);
  }
  const old=JSON.parse(fs.readFileSync(path.join(repo,'runtime/public/coach/coach-rig.json'),'utf8'));
  const prior=JSON.parse(fs.readFileSync(path.join(repo,'runtime/public/coach-v3/coach-rig-v3.json'),'utf8'));
  const rig=JSON.parse(fs.readFileSync(path.join(repo,'runtime/public/coach-v3-armfix-r1/coach-rig.json'),'utf8'));
  if(rig.v3.segmentScale.upperArm!==1||rig.v3.segmentScale.forearm!==1||rig.v3.armfix.handScale!==1)throw Error('armfix-r1 arm/hand recipe');
  for(const side of['left','right'])for(const joint of['Shoulder','Elbow','Wrist'])if(JSON.stringify(rig.landmarks[side+joint])!==JSON.stringify(old.landmarks[side+joint]))throw Error('armfix-r1 original arm landmark');
  for(const key of['pelvis','torso','neck','head','leftHip','rightHip','leftKnee','rightKnee','leftAnkle','rightAnkle'])if(JSON.stringify(rig.landmarks[key])!==JSON.stringify(prior.landmarks[key]))throw Error('armfix-r1 changed unrelated lower body/head');
  return {profile:PROFILE,version:VERSION,status:'proportion-candidate-only',files:Object.keys(m.sha256).length};
}
