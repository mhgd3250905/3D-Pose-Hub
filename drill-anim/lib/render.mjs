// node lib/render.mjs <spec.js> <outdir> <f0> <f1> [--theme t.json] [--frames 0,10,20] [--still] [--mask] [--pr 2]
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {boot} from './boot.mjs';import {loadTheme} from './config.mjs';
const A=process.argv.slice(2);const opt=k=>{const i=A.indexOf(k);return i>=0?A[i+1]:null;};const flag=k=>A.includes(k);
const pos=A.filter((a,i)=>!a.startsWith('--')&&!(i>0&&A[i-1].startsWith('--')&&!['--still','--mask','--with-still'].includes(A[i-1])));
const [specP,out,f0s,f1s]=pos;fs.mkdirSync(out,{recursive:true});
const spec=(await import(pathToFileURL(path.resolve(specP)).href)).default;const theme=loadTheme(opt('--theme'));
const SZ=spec.size||1080,PR=+(opt('--pr')||2),FPS=spec.fps||30,N=Math.round(spec.timeline.duration*FPS);
const t0=Date.now();const {b,p,info}=await boot({size:SZ,pr:PR,theme,bakeHands:spec.bakeHands||[]});console.log('boot',((Date.now()-t0)/1000).toFixed(1)+'s',JSON.stringify(info));
await p.evaluate(([spec,th,SZ])=>{__setHighlight(spec.highlight);__toonUni.uSinkK.value=spec.clothSink??1;for(const pr of spec.props||[])__props.add(th,pr);__drill.setupCamera(spec,SZ);},[spec,theme,SZ]);
// warm-up: the first render after boot can still show stale geometry (app render loop); render + settle twice, discard
for(let k=0;k<3;k++){await p.evaluate(([s,SZ])=>{__drill.frame(s,0,0,null,{size:SZ,full:false});return 1;},[spec,SZ]);await p.waitForTimeout(400);}
let frames=opt('--frames')?opt('--frames').split(',').map(Number):flag('--still')?[-1]:Array.from({length:(+f1s||N)-(+f0s||0)},(_,i)=>(+f0s||0)+i);
if(flag('--with-still'))frames=[-1,...frames];
const met=[];let warm=null;
// warm start: solve the frame before the chunk so the LM starts close
if(frames.find(f=>f>=0)>0&&!opt('--frames')){warm=await p.evaluate(([s,t])=>__drill.applyAt(s,t,null).x,[spec,(frames.find(f=>f>=0)-1)/FPS]);}
for(const f of frames){const t=f<0?(spec.stillAt??0):f/FPS;const full=f<0||f%4===0;
  if(f<0)warm=null;const r=await p.evaluate(([s,t,f,w,o])=>__drill.frame(s,t,f,w,o),[spec,t,f,warm,{full,size:SZ,mask:flag('--mask')}]);warm=r.M.x;
  const nm=f<0?'still':String(f).padStart(4,'0');
  if(r.mask)fs.writeFileSync(`${out}/k-${nm}.png`,Buffer.from(r.mask.split(',')[1],'base64'));
  else{fs.writeFileSync(`${out}/m-${nm}.png`,Buffer.from(r.main.split(',')[1],'base64'));fs.writeFileSync(`${out}/g-${nm}.png`,Buffer.from(r.glow.split(',')[1],'base64'));}
  met.push({f,t,...r.M});if(f%20===0||f<0)console.log('frame',f,JSON.stringify(r.M.elbow),JSON.stringify(r.M.knee),'minY',r.M.minY.toFixed(4));}
fs.writeFileSync(`${out}/met-${frames[0]}-${frames[frames.length-1]}.json`,JSON.stringify(met));
console.log('done',frames.length,'frames',((Date.now()-t0)/1000).toFixed(1)+'s');await b.close();
