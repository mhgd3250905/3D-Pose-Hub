// Remote weak-server twist screen r1. No images, no video: one browser, one action, sequential
// warm-started solve over the cycle, reading the solved skeleton's local bone quaternions.
// It flags axial twist (swing-twist about each child bone's long axis) of forearm|upper arm,
// hand|forearm and foot|shin, unwrapped across samples so a 180/360 degree path with matching
// endpoints is visible. Diagnostic only: sampledOnly, not a 30Hz QA capture, never acceptance.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {prepareRecipe,MODEL} from './recipe.mjs';
import {validateSetup} from './remote-keyframes-r1.mjs';
import * as nativeActionHand from './native-action-hand-pose-r1.mjs';
import * as nativeActionHandR2 from './native-action-hand-pose-r2.mjs';
const nativeModules={'native-action-hand-pose-r1':nativeActionHand,'native-action-hand-pose-r2':nativeActionHandR2};
const fail=(ok,message)=>{if(!ok)throw Error(message);};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const SELF=fileURLToPath(import.meta.url);
export const THRESHOLDS=Object.freeze({twistRangeDeg:120,stepDeg:25,netTurnDeg:150});

// Signed twist (deg) of unit quaternion q=[x,y,z,w] about unit axis a.
export function twistDeg(q,a){
  const d=q[0]*a[0]+q[1]*a[1]+q[2]*a[2];let w=q[3],p=d;
  if(Math.hypot(w,p)<1e-9)return 180;
  if(w<0){w=-w;p=-p;}
  return 2*Math.atan2(p,w)*180/Math.PI;
}
// Unwrap a degree series so adjacent steps stay within (-180,180].
export function unwrap(series){
  const out=[];let off=0;
  for(let i=0;i<series.length;i++){
    if(i){let d=series[i]+off-out[i-1];while(d>180){off-=360;d-=360;}while(d<-180){off+=360;d+=360;}}
    out.push(series[i]+off);
  }
  return out;
}
export function analyzeTwist(times,series){
  const u=unwrap(series);let step=0,stepAt=null;
  for(let i=1;i<u.length;i++){const s=Math.abs(u[i]-u[i-1]);if(s>step){step=s;stepAt=times[i];}}
  const max=Math.max(...u),min=Math.min(...u);
  const range=max-min,net=u.at(-1)-u[0];
  const flags=[];
  if(range>THRESHOLDS.twistRangeDeg)flags.push('twist-range');
  if(step>THRESHOLDS.stepDeg)flags.push('twist-step');
  if(Math.abs(net)>THRESHOLDS.netTurnDeg)flags.push('net-turn');
  return {rangeDeg:range,maxDeg:max,maxAt:times[u.indexOf(max)],minDeg:min,minAt:times[u.indexOf(min)],maxStepDeg:step,maxStepAt:stepAt,netDeg:net,flags};
}

function parseArgs(args){
  const o={hz:15};const flags={'--recipe':'recipeFile','--out':'out','--hz':'hz'};
  for(let i=0;i<args.length;i+=2){fail(flags[args[i]]&&args[i+1],'Unknown or missing argument: '+args[i]);o[flags[args[i]]]=args[i+1];}
  fail(o.recipeFile&&o.out,'--recipe and --out are required');o.hz=Number(o.hz);fail([10,15].includes(o.hz),'hz must be 10 or 15');
  return o;
}

export async function run({recipeFile,out,hz=15}){
  const prepared=await prepareRecipe(recipeFile);
  const corrective=validateSetup(prepared);
  if(nativeModules[corrective?.id])prepared.spec=nativeModules[corrective.id].prepare(prepared.spec);
  const spec=prepared.spec;const file=path.resolve(out);fail(!fs.existsSync(file),'Output exists');
  fail(os.freemem()/1024**3>=1.25,'Low available memory at start');
  const model=await import('../../drill-anim/models/training-human-v3-armfix-r2/loader.mjs');
  const {config,loadTheme}=await import('../../drill-anim/lib/config.mjs');
  const cfg=config();const lock=path.join(cfg.work_dir,'remote-keyframes-r1.lock');
  for(const name of ['completion-render.lock','completion-render-lane2.lock','remote-keyframes-r1.lock'])fail(!fs.existsSync(path.join(cfg.work_dir,name)),'Active render lock: '+name);
  await model.verify();model.checkSpec(spec);
  fs.mkdirSync(path.dirname(lock),{recursive:true});fs.writeFileSync(lock,JSON.stringify({pid:process.pid,out:file,tool:'remote-rotation-r1'}),{flag:'wx'});
  let browser;
  try{
    const theme=loadTheme();const opened=await model.boot({size:64,pr:1,theme});browser=opened.b;const page=opened.p;
    const errors=[];page.on('pageerror',e=>errors.push(String(e)));
    const setup=await model.applyV3(page,spec);fail(setup.profile===MODEL.profile&&setup.version===MODEL.version,'Wrong installed model');
    await page.evaluate(([s,th])=>{const v=flareInspector.viewer;v.playing=false;v.animate=()=>{};for(const prop of s.props||[])__props.add(th,prop);v.motion.reset();},[spec,theme]);
    const duration=spec.timeline.duration,n=Math.round(duration*hz);
    const times=Array.from({length:n+1},(_,i)=>+(i*duration/n).toFixed(4));
    const result=await page.evaluate(([s,times])=>{
      const v=flareInspector.viewer,E=__drill;
      const bones={};v.coach.traverse(b=>{if(b.isBone)bones[b.name]=b;});
      const find=re=>Object.keys(bones).filter(k=>re.test(k));
      const pairs=[];
      for(const side of ['left','right']){
        const pick=(re)=>find(re).find(k=>k.toLowerCase().startsWith(side));
        const ua=pick(/^(left|right)UpperArm$/i),fa=pick(/^(left|right)(Fore|Lower)Arm$/i),ha=pick(/^(left|right)Hand$/i);
        const sh=pick(/^(left|right)(Shin|LowerLeg)$/i),ft=pick(/^(left|right)Foot$/i);
        if(fa)pairs.push({key:side+'.forearm|upperArm',bone:fa});
        if(ha)pairs.push({key:side+'.hand|forearm',bone:ha});
        if(ft)pairs.push({key:side+'.foot|shin',bone:ft});
        if(!fa||!ha||!ft)pairs.push({key:side+'.missing',bone:null,names:{ua,fa,ha,sh,ft}});
      }
      // Rig bones point down local +Y (forearm/foot children verified); the hand's first child is a finger, so +Y is used for all.
      const axisOf=()=>[0,1,0];
      const axes={};for(const p of pairs)if(p.bone)axes[p.key]=axisOf(bones[p.bone]);
      const rows=[];let warm=null;
      for(const t of times){const r=E.applyAt(s,t,warm);warm=r.x;v.coach.updateMatrixWorld(true);
        const q={};for(const p of pairs)if(p.bone)q[p.key]=bones[p.bone].quaternion.toArray();rows.push({t,q,warn:(Array.isArray(r.warn)?r.warn.length:r.warn)?r.warn:null});}
      return {pairs:pairs.map(p=>({key:p.key,bone:p.bone,names:p.names})),axes,rows};
    },[spec,times]);
    fail(!errors.length,'Browser errors: '+errors.join(' | '));
    const channels={};
    for(const key of Object.keys(result.axes))channels[key]={bone:result.pairs.find(p=>p.key===key).bone,axis:result.axes[key],
      ...analyzeTwist(times,result.rows.map(r=>twistDeg(r.q[key],result.axes[key])))};
    const flagged=Object.entries(channels).filter(([,c])=>c.flags.length).map(([k,c])=>({channel:k,flags:c.flags,rangeDeg:+c.rangeDeg.toFixed(1),maxStepDeg:+c.maxStepDeg.toFixed(1),netDeg:+c.netDeg.toFixed(1),worstAt:c.maxStepAt}));
    const report={format:'pose-hub-remote-rotation@1',sampledOnly:true,fullCycleValidated:false,userAccepted:false,releaseEligible:false,
      recipeSha256:prepared.recipeSha256,runnerSha256:sha(fs.readFileSync(SELF)),model:MODEL,hz,sampleCount:times.length,thresholds:THRESHOLDS,
      solverWarnings:result.rows.filter(r=>r.warn).length,missing:result.pairs.filter(p=>p.key.endsWith('.missing')),channels,flagged,
      limits:['Bone axial twist from the sequential solve only; skin deformation, corrective hooks and contact are not measured.','15Hz screen, not the local 30Hz QA capture.']};
    fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify({event:'remote-rotation',flagged,missing:report.missing.length}));
    return report;
  }finally{try{await browser?.close();}finally{fs.unlinkSync(lock);}}
}
if(process.argv[1]&&path.resolve(process.argv[1])===SELF)run(parseArgs(process.argv.slice(2))).catch(e=>{console.error(e);process.exitCode=1;});
