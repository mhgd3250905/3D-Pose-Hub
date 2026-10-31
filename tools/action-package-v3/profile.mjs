// Production profile + skin loading. Profiles/skins are JSON under profiles/ and skins/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const fail=(ok,m)=>{if(!ok)throw Error(m);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const HEX=/^#[0-9a-f]{6}$/i;
function read(file){const bytes=fs.readFileSync(file);return {data:JSON.parse(bytes.toString('utf8')),sha256:sha(bytes)};}
const resolve=(dir,name)=>name.endsWith('.json')||name.includes('/')?path.resolve(name):path.join(HERE,dir,name+'.json');
export function loadProfile(name='default'){
  const {data,sha256}=read(resolve('profiles',name));
  fail(data.format==='pose-hub-package-profile@1','Bad profile format');
  fail(Array.isArray(data.skins)&&data.skins.length>0,'Profile needs skins');
  fail(data.masters?.fps===30&&Number.isInteger(data.masters.size),'Profile masters need fps 30 and an integer size');
  fail(Array.isArray(data.masters.layers)&&data.masters.layers.includes('body'),'Profile masters need a body layer');
  for(const s of data.skins)loadSkin(s);
  return {...data,sha256};
}
export function validateSkin(s){
  fail(s.format==='pose-hub-package-skin@1'&&/^[a-z0-9-]+$/.test(s.id??''),'Bad skin');
  fail(HEX.test(s.highlightColor??''),'Skin highlightColor must be #RRGGBB');
  const l=s.look;fail(l&&['native','luma-ramp'].includes(l.mode),'Skin look.mode must be native or luma-ramp');
  if(l.mode==='luma-ramp'){
    fail(HEX.test(l.dark)&&HEX.test(l.light),'luma-ramp needs dark/light colours');
    if(l.ramp)fail(l.ramp.length===2&&l.ramp[0]<l.ramp[1]&&l.ramp.every(x=>x>=0&&x<=1),'Bad ramp');
    if(l.rim)fail(HEX.test(l.rim.color)&&l.rim.strength>=0&&l.rim.strength<=2&&l.rim.power>0,'Bad rim');
    if(l.mix!==undefined)fail(l.mix>=0&&l.mix<=1,'Bad mix');
  }
  return s;
}
export function loadSkin(name){const {data,sha256}=read(resolve('skins',name));validateSkin(data);fail(name.endsWith('.json')||data.id===name,'Skin id must match its file name');return {...data,sha256};}
