import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {sourceFingerprint} from './source-fingerprint.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../../..');
const args=process.argv.slice(2),opt=(k,d)=>{const i=args.indexOf(k);return i<0?d:args[i+1];};
const required=k=>{const v=opt(k);if(!v)throw new Error(`Missing ${k}`);return v;};
if(!args.includes('--draft')||args.includes('--reviewed'))throw new Error('Independent draft renderer requires --draft and forbids review claims');
const root=path.resolve(required('--root')),specPath=path.resolve(required('--spec'));
const skins=['realistic','tech-white','neon-night','neon-night-b','hologram'];
const chosenSkins=opt('--skins')==='all'?skins:opt('--skins',opt('--skin','realistic')).split(',');
if(chosenSkins.some(s=>!skins.includes(s)))throw new Error('Unknown canonical production skin');
const layers=opt('--layers','body,highlight,shadow').split(',');
if(layers.some(l=>!['body','highlight','shadow'].includes(l)))throw new Error('Invalid layers');
const frames=opt('--frames')?.split(',').map(Number)||Array.from({length:240},(_,i)=>i);
if(frames.some(f=>!Number.isInteger(f)||f<0||f>240))throw new Error('Frames must be 0..240; 240 is a QA endpoint only');
const complete=frames.length===240&&frames.every((f,i)=>f===i);
const captureFrames=complete?[...frames,240]:frames;
const lockedProbe=args.includes('--locked-contact-probe');
const contactCheck=args.includes('--canonical-contact-check')||lockedProbe;
if(contactCheck&&(complete||chosenSkins.length!==1||chosenSkins[0]!=='realistic'))throw new Error('Contact diagnostic is partial-preview/canonical-only');
let share=chosenSkins.length>1&&chosenSkins.includes('realistic')&&!args.includes('--no-share-layers');
const tmp=path.join(root,'work','browser-temp');fs.mkdirSync(tmp,{recursive:true});
process.env.TEMP=tmp;process.env.TMP=tmp;process.env.TMPDIR=tmp;
const [{boot},{loadTheme},{applyHumanV2plus},{resolveModelSpec,productionModel}]=await Promise.all([
  import('../../lib/boot.mjs'),import('../../lib/config.mjs'),import('../../lib/human-v2plus.mjs'),import('../../lib/model-profile.mjs')]);
const source=(await import(pathToFileURL(specPath))).default;
const spec=resolveModelSpec({...source,fps:30,size:1080},{profile:'current',skin:'realistic'});
if(lockedProbe)spec.v2plus.handPose={left:'palm-floor',right:'palm-floor'};
if(spec.timeline.duration!==8)throw new Error('Draft requires a native eight-second timeline; non-eight-second sources must be separately adapted, never stretched');
const id=opt('--action',spec.id);if(!/^[\w-]+$/.test(id))throw new Error('Invalid action ID');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ref=f=>{const b=fs.readFileSync(f);return{root:'media',path:path.relative(root,f).replaceAll('\\','/'),sha256:sha(b),bytes:b.length};};
const frozenSources=sourceFingerprint(repo,specPath),started=new Date().toISOString(),startTime=Date.now();
const state=new Map(chosenSkins.map(skin=>{
  const out=path.join(root,complete?'masters':'qa/preview',skin,id);fs.mkdirSync(out,{recursive:true});
  const sourceFile=path.join(out,'source-manifest.json');
  if(complete&&fs.existsSync(sourceFile)&&JSON.parse(fs.readFileSync(sourceFile)).sha256!==frozenSources.sha256)
    throw new Error('Existing masters use a different frozen recipe; choose a new output root/revision');
  fs.writeFileSync(sourceFile,JSON.stringify(frozenSources,null,2)+'\n');
  return[skin,{out,indexes:Object.fromEntries(layers.map(l=>[l,[]])),metrics:[],sequences:{},endpoints:{}}];
}));
const theme=loadTheme();console.log(JSON.stringify({event:'start',id,skins:chosenSkins,frames,share,temp:tmp}));
const {b,p,info}=await boot({size:1080,pr:1,theme,bakeHands:spec.bakeHands||[]});
const bootMs=Date.now()-startTime;console.log(JSON.stringify({event:'booted',bootMs}));
const shaderErrors=[];p.on('console',m=>{if(m.type()==='error'&&/Shader Error|not compiled|VALIDATE_STATUS/.test(m.text()))shaderErrors.push(m.text());});
const ensureShaders=()=>{if(shaderErrors.length)throw new Error(`Layer shader failed: ${shaderErrors[0]}`);};
const specFor=skin=>({...spec,v2plus:{...spec.v2plus,skin}});
const saveLayer=(skin,layer,f,url)=>{
  const s=state.get(skin),folder=complete&&f===240?path.join(root,'qa','endpoints',skin,id,layer):path.join(s.out,layer);fs.mkdirSync(folder,{recursive:true});
  const dest=path.join(folder,`${{body:'m',highlight:'k',shadow:'s'}[layer]}-${String(f).padStart(4,'0')}.png`);
  fs.writeFileSync(dest,Buffer.from(url.split(',')[1],'base64'));const record={frame:f,...ref(dest)};
  if(complete&&f===240)s.endpoints[layer]=record;else s.indexes[layer].push(record);
};
async function pixelDifference(files){
  const urls=files.map(f=>'data:image/png;base64,'+fs.readFileSync(f).toString('base64'));
  return p.evaluate(async urls=>{const arrays=[];for(const u of urls){const im=await createImageBitmap(await(await fetch(u)).blob());
    const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);
    arrays.push(ctx.getImageData(0,0,im.width,im.height).data);im.close();}
    let sum=0,max=0,changed=0;for(let i=0;i<arrays[0].length;i++){const d=Math.abs(arrays[0][i]-arrays[1][i]);sum+=d;max=Math.max(max,d);if(d)changed++;}
    return{meanAbsoluteRgba:sum/arrays[0].length,maxChannelDelta:max,changedChannelFraction:changed/arrays[0].length};},urls);
}
try{
  await applyHumanV2plus(p,contactCheck?spec:{...spec,v2plus:{...spec.v2plus,skin:'tech-white'}});
  let contactDiagnostic;
  if(lockedProbe){const prepared=await p.evaluate(s=>{
    __drill.selectModelProfile(s);const rows={};for(const side of ['left','right']){
      const h=s.pose.base.hands[side];if(h.mode!=='floor')throw new Error('Locked contact probe expects an original floor hand descriptor');
      const finger=[h.finger[0],0,h.finger[1]],q=__drill.handQ(side,new __toonT.Vector3(...finger),new __toonT.Vector3(0,-1,0));
      const mn=Math.min(...__drill.handPts[side].map(p=>p.clone().applyQuaternion(q).y));
      const ground=flareInspector.viewer.motion.getGroundHandPose(side,finger,[h.at[0],0,h.at[1]]),targetY=ground.wrist[1]+.0165;
      s.pose.base.hands[side]={...h,mode:'fingertips',finger,normal:[0,-1,0],floor:.006,clear:targetY+mn-.006,relax:0};
      rows[side]={oldWrist:ground.wrist,desiredWristY:targetY,mn,clear:targetY+mn-.006,descriptor:s.pose.base.hands[side]};
    }return{spec:s,rows};},spec);Object.assign(spec,prepared.spec);contactDiagnostic=prepared.rows;}
  await p.evaluate(([s,th])=>{__setHighlight(s.highlight);__toonUni.uSinkK.value=s.clothSink??1;
    for(const pr of s.props||[])__props.add(th,pr);__drill.setupCamera(s,1080);},[spec,theme]);
  await p.addScriptTag({content:fs.readFileSync(path.join(here,'../v2/browser-layers.js'),'utf8')});
  for(let i=0;i<3;i++){await p.evaluate(s=>__v2Layers.capture(s,0,0,null,[]),spec);await p.waitForTimeout(100);}
  const audit=[];for(const skin of contactCheck?['realistic']:skins){await p.evaluate(s=>__drill.selectModelProfile(s),specFor(skin));
    audit.push({skin,...await p.evaluate(()=>__v2Layers.geometry())});}
  if(share&&new Set(audit.filter(x=>chosenSkins.includes(x.skin)).map(x=>x.sha256)).size!==1)
    {share=false;console.log(JSON.stringify({event:'geometry-independent-layers',reason:'Measured geometry differs; render all layers per skin without sharing'}));}
  await p.evaluate(s=>__v2Layers.capture(s,0,0,null,[]),spec);
  const occlusion=await p.evaluate(()=>__v2Layers.geometry('scene'));
  const occlusionSha256=sha(JSON.stringify({sceneSha256:occlusion.sha256,spec:sha(fs.readFileSync(specPath)),mask:'canonical-v2plus-designed-analytic'}));
  const setupMs=Date.now()-startTime-bootMs,renderStart=Date.now(),frameDurationsMs=[];let warm=null;
  for(const f of captureFrames){
    const frameStart=Date.now();
    if(share){
      const r=await p.evaluate(([s,f,w,ls])=>__v2Layers.capture(s,f/30,f,w,ls),[spec,f,warm,layers]);warm=r.metrics.x;ensureShaders();
      for(const l of layers)saveLayer('realistic',l,f,r[l]);state.get('realistic').metrics.push({frame:f,time:f/30,...r.metrics});
      for(const skin of chosenSkins.filter(s=>s!=='realistic')){
        if(layers.includes('body')){const png=await p.evaluate(s=>__v2Layers.materialBody(s),specFor(skin));ensureShaders();saveLayer(skin,'body',f,png);}
        state.get(skin).metrics.push({frame:f,time:f/30,...r.metrics});
      }
      console.log(JSON.stringify({event:'frame',id,skins:chosenSkins,frame:f,minY:r.metrics.minY}));
    }else{
      for(const skin of chosenSkins){const r=await p.evaluate(([s,f,w,ls])=>__v2Layers.capture(s,f/30,f,w,ls),[specFor(skin),f,warm,layers]);warm=r.metrics.x;ensureShaders();
        for(const l of layers)saveLayer(skin,l,f,r[l]);state.get(skin).metrics.push({frame:f,time:f/30,...r.metrics});
        console.log(JSON.stringify({event:'frame',id,skin,frame:f,minY:r.metrics.minY}));}
    }
    frameDurationsMs.push(Date.now()-frameStart);
  }
  const steadyMeanMs=frameDurationsMs.length>1?frameDurationsMs.slice(1).reduce((x,y)=>x+y,0)/(frameDurationsMs.length-1):null;
  const renderMs=Date.now()-renderStart,timing={bootMs,setupMs,renderMs,frames:frames.length,qaEndpointFrames:complete?1:0,skinCount:chosenSkins.length,
    millisecondsPerTimelineFrame:renderMs/captureFrames.length,estimated240FrameRenderSeconds:steadyMeanMs==null?null:(frameDurationsMs[0]+steadyMeanMs*239)/1000,
    poseQaPasses:captureFrames.length*(share?1:chosenSkins.length),materialOnlyReuse:share,frameDurationsMs,
    steadyMeanMs:frameDurationsMs.length>1?frameDurationsMs.slice(1).reduce((x,y)=>x+y,0)/(frameDurationsMs.length-1):null};
  fs.mkdirSync(path.join(root,'qa'),{recursive:true});fs.writeFileSync(path.join(root,'qa',`benchmark-${id}.json`),JSON.stringify(timing,null,2)+'\n');
  for(const[skin,s]of state){for(const l of layers){if(share&&skin!=='realistic'&&l!=='body')continue;
    const dest=path.join(s.out,l,'index.json');fs.writeFileSync(dest,JSON.stringify({format:'pose-hub-frame-sequence@2',width:1080,height:1080,fps:30,
      durationSeconds:8,frameCount:s.indexes[l].length,alpha:true,alphaMode:'straight',frames:s.indexes[l]},null,2)+'\n');s.sequences[l]=ref(dest);}}
  if(share)for(const[skin,s]of state)if(skin!=='realistic')for(const l of layers)if(l!=='body')s.sequences[l]=state.get('realistic').sequences[l];
  const shadowAudit=await p.evaluate(()=>__v2Layers.shadowAudit());
  if(args.includes('--shadow-probe')){
    await p.evaluate(s=>__v2Layers.capture(s,2,60,null,[]),spec);
    const probe=await p.evaluate(()=>__v2Layers.shadowProbe());ensureShaders();const folder=path.join(root,'qa','shadow-probe',id);fs.mkdirSync(folder,{recursive:true});
    for(const n of ['zero','displaced','translated'])fs.writeFileSync(path.join(folder,`${n}.png`),Buffer.from(probe[n].split(',')[1],'base64'));
    const difference=await pixelDifference(['zero','displaced'].map(n=>path.join(folder,`${n}.png`)));
    const transformDifference=await pixelDifference(['zero','translated'].map(n=>path.join(folder,`${n}.png`)));
    fs.writeFileSync(path.join(folder,'probe.json'),JSON.stringify({parameters:probe.parameters,foregroundDepthOcclusion:false,
      uniformDifference:difference,uniformStatus:difference.changedChannelFraction?'visible-response':'no-visible-response',transformDifference,shadowAudit},null,2)+'\n');
    if(transformDifference.changedChannelFraction===0)throw new Error('Known caster world transform had no shadow pixel response');
  }
  if(sourceFingerprint(repo,specPath).sha256!==frozenSources.sha256)throw new Error('Render inputs changed during execution; output cannot be accepted');
  const modelFile=path.join(repo,'drill-anim/models/training-human-v2plus.json'),production=productionModel();
  for(const[skin,s]of state){const seam={status:'pending-user-review',capturedQaEndpoint:captureFrames.includes(240),automaticQaPass:false};
    const geometry=audit.find(x=>x.skin===skin);
    const manifest={format:'pose-hub-layer-render@2',actionId:id,skin,complete,diagnosticOnly:contactCheck,started,finished:new Date().toISOString(),sourceSha256:frozenSources.sha256,
      model:{...production,id:production.modelProfile,version:production.modelVersion,manifestSha256:sha(fs.readFileSync(modelFile))},
      spec:{path:path.relative(repo,specPath).replaceAll('\\','/'),sha256:sha(fs.readFileSync(specPath,'utf8').replaceAll('\r\n','\n'))},
      width:1080,height:1080,fps:30,durationSeconds:8,frameCount:frames.length,alphaMode:'straight',geometrySha256:geometry.sha256,occlusionSha256,
      sequences:s.sequences,status:'draft-unreviewed',reviewed:false,releaseEligible:false,qaStatus:'pending-user-review',
      ...(complete?{qaEndpoint:Object.fromEntries(layers.map(l=>[l,(share&&skin!=='realistic'&&l!=='body'?state.get('realistic'):s).endpoints[l]]))}:{}),
      ...(share&&skin!=='realistic'?{sharedFrom:Object.fromEntries(layers.filter(l=>l!=='body').map(l=>[l,'realistic'])),
        layers:Object.fromEntries(layers.filter(l=>l!=='body').map(l=>[l==='highlight'?'highlightMask':'shadow',{sharedFrom:'realistic'}])),poseMetricsFrom:'realistic'}:{}),
      highlight:{selection:'canonical-v2plus-designed-analytic',encoding:'grayscale RGB coverage, alpha is foreground silhouette',materialIndependent:true,depthTest:true},
      shadow:{method:'directional-light-shadow-map',depth:'active material vertex shader copied to custom MeshDepthMaterial; standard packed-depth fragment',vertexEquivalent:true,audit:shadowAudit},
      ...(contactDiagnostic?{contactDiagnostic}:{}),timing,boot:info};
    for(const[name,data]of[['layer-manifest',manifest],['geometry-audit',{format:'pose-hub-skin-geometry-audit@2',aliases:{default:'realistic','tech-white-b':'tech-white'},skins:audit}],
      ['occlusion-audit',{format:'pose-hub-canonical-occlusion-audit@2',referenceTime:0,...occlusion}],['metrics',s.metrics],['seam-qa',seam],['timing',timing]])
      fs.writeFileSync(path.join(s.out,`${name}.json`),JSON.stringify(data,null,2)+'\n');
    console.log(JSON.stringify({event:'done',manifest:path.join(s.out,'layer-manifest.json'),geometry:geometry.sha256,timing}));
  }
}finally{await b.close();}
