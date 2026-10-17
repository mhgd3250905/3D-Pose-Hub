// Add the verified one-action shoe correction to a new complete94-item archive.
// The original package and all its original media/evidence remain untouched.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.join(repo,'output/training-human-v2-library-portable-20261013'),fix=path.join(repo,'output/training-human-v2-erectors-B-footfix-20261013'),out=path.join(repo,'output/training-human-v2-library-footfix-20261013');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const write=(p,j)=>fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');
assert(!fs.existsSync(out),'New archive required; previous packages are never overwritten');
assert(read(fix+'/status.json').complete);const result=read(fix+'/result.json'),proof=read(fix+'/footfix-preservation.json');
assert(result.qa.pass&&result.qa.solver_warning_frames===0&&proof.pass&&proof.frames===240&&proof.checkedIncludingStill===241&&proof.nonFootBoneDeltaMax===0&&proof.bodyJointMmMax===0);
for(const c of proof.checks)for(const v of Object.values(c.feet))assert(v.wallGapMm>=0&&v.wallGapMm<2&&v.minY>=-1e-6&&v.minY<1e-5&&v.toeDirectionX>0);
assert.equal(hash(base+'/evidence/jobs/erectors-B/frames/met-cycle.json'),result.sourceHashes['frames/met-cycle.json']);
const decode={};
for(const [kind,size]of[['master',1080],['mobile',720]]){
 const file=fix+'/'+result.media[kind].path;assert.equal(hash(file),result.media[kind].sha256);
 const q=spawnSync('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=codec_name,width,height,pix_fmt,nb_read_frames:format=duration','-of','json',file],{encoding:'utf8',windowsHide:true});assert.equal(q.status,0);const probe=JSON.parse(q.stdout),s=probe.streams[0];assert.equal(s.width,size);assert.equal(s.height,size);assert.equal(s.codec_name,'h264');assert.equal(s.pix_fmt,'yuv420p');assert.equal(Number(s.nb_read_frames),240);assert.equal(Number(probe.format.duration),8);
 const d=spawnSync('ffmpeg',['-v','error','-xerror','-err_detect','explode','-threads','1','-i',file,'-progress','pipe:1','-nostats','-f','null','-'],{encoding:'utf8',windowsHide:true});assert.equal(d.status,0,d.stderr);const counts=[...d.stdout.matchAll(/^frame=(\d+)$/gm)].map(m=>Number(m[1]));assert.equal(counts.at(-1),240);decode[kind]={independent:true,complete:true,pass:true,decodedFrames:240,mediaSha256:hash(file),probe};
}
fs.cpSync(base,out,{recursive:true});fs.writeFileSync(out+'/.selection-incomplete','creating curated selection\n');
fs.mkdirSync(out+'/evidence/previous-package',{recursive:true});
for(const n of['manifest.json','portable-catalog.json','package-manifest.json','directory-manifest.json','SHA256SUMS.txt','README.md'])fs.copyFileSync(base+'/'+n,out+'/evidence/previous-package/'+n);
fs.mkdirSync(out+'/evidence/footfix',{recursive:true});
for(const n of['source.json','spec.json','model.json','qa.json','result.json','footfix-preservation.json','renderer.json'])fs.copyFileSync(fix+'/'+n,out+'/evidence/footfix/'+n);
fs.copyFileSync(path.join(repo,'drill-anim/render-footfix.mjs'),out+'/evidence/footfix/render-footfix.mjs');
fs.mkdirSync(out+'/evidence/footfix/frames');fs.copyFileSync(fix+'/frames/met-cycle.json',out+'/evidence/footfix/frames/met-cycle.json');
fs.copyFileSync(fix+'/composite/place.json',out+'/evidence/footfix/place.json');
const media={};for(const kind of['master','mobile']){
 const target=`media/${kind}/erectors-B-footfix.mp4`;fs.copyFileSync(fix+'/'+result.media[kind].path,out+'/'+target);assert.equal(hash(out+'/'+target),result.media[kind].sha256);
 media[kind]={...result.media[kind],path:target,sha256MatchesProducer:true,headerPass:true,decode:decode[kind]};
}
const poster={path:'media/posters/erectors-B-footfix.jpg',sha256:result.poster.sha256,dimensions:[540,540],timeSeconds:2};assert.equal(hash(fix+'/'+result.poster.path),poster.sha256);fs.copyFileSync(fix+'/'+result.poster.path,out+'/'+poster.path);
const manifest=read(base+'/manifest.json'),previous=manifest.jobs.find(j=>j.id==='erectors-B');
const corrected={id:'erectors-B',name:'瑞士球背伸',category:previous.category,plannedFrames:240,plannedDuration:8,modelId:'training-human-v2',modelVersion:'2.0.1',producerPhase:'complete',status:'ready',issues:[],qa:result.qa,media,poster,
 motionInvarianceScope:'footfix_full_cycle',motionCorrection:{intentional:'Foot heading -90 to90; wall face -0.5256 to-0.545584',referenceSourceHashes:result.sourceHashes,preservation:{path:'evidence/footfix/footfix-preservation.json',sha256:hash(out+'/evidence/footfix/footfix-preservation.json')},bodyTargetsReplay:true,bodyJointMmMax:0,nonFootBoneDeltaMax:0,checkedIncludingStill:241},
 bodyQaAttribution:{category:'intentional_foot_direction_correction',newBodyFlags:[],inheritedBodyFlags:[]},knownLimitations:['This correction replays frozen body targets. Standalone spec alone is not the complete rendering recipe; source met-cycle and replay tool are preserved.'],
 links:{master:media.master.path,mobile:media.mobile.path,poster:poster.path,result:'evidence/footfix/result.json',evidence:['evidence/footfix/qa.json','evidence/footfix/footfix-preservation.json','evidence/footfix/source.json']}};
manifest.jobs[manifest.jobs.findIndex(j=>j.id==='erectors-B')]=corrected;
manifest.schemaVersion=3;manifest.kind='curated_media_selection';manifest.selection={revision:'erectors-B-footfix-20261013',sourcePackageManifestSha256:hash(base+'/package-manifest.json'),preserveOriginalMedia:true,changedIds:['erectors-B'],unchangedSelectedVariants:93};
manifest.summary.motionScopes={fullCycle:93,footCorrectionFullCycle:1,keyPhase:0,failedFullCycle:0};manifest.summary.independentDecode=true;
write(out+'/manifest.json',manifest);
const catalog=read(base+'/portable-catalog.json'),job=catalog.jobs.find(j=>j.id==='erectors-B');job.mediaRevision='footfix-20261013';job.packageLinks.media={master:corrected.links.master,mobile:corrected.links.mobile,poster:corrected.links.poster};
job.packageLinks.evidence={...Object.fromEntries(['source.json','spec.json','qa.json','result.json','footfix-preservation.json','frames/met-cycle.json'].map(n=>[n,'evidence/footfix/'+n]))};job.packageLinks.authoredSpec='evidence/footfix/spec.json';job.sourceReplayTargets='evidence/jobs/erectors-B/frames/met-cycle.json';job.auditStatus='ready';job.producerStatus='ready';job.knownLimitations=corrected.knownLimitations;job.motionCorrection=corrected.motionCorrection;
catalog.kind='curated_media_selection';catalog.selection=manifest.selection;write(out+'/portable-catalog.json',catalog);
let html=fs.readFileSync(base+'/index.html','utf8');const tag='<script id="audit-data" type="application/json">',start=html.indexOf(tag)+tag.length,end=html.indexOf('</script>',start);assert(start>=tag.length&&end>start);html=html.slice(0,start)+JSON.stringify({summary:manifest.summary,jobs:manifest.jobs}).replace(/</g,'\\u003c')+html.slice(end);
const oldScope="const scope=j.motionInvarianceScope==='full_cycle'?";assert(html.includes(oldScope));html=html.replace(oldScope,"const scope=j.motionInvarianceScope==='footfix_full_cycle'?'整圈原身体与脚踝保持；鞋尖方向按反馈修正，落地与墙面间距逐帧核对。':j.motionInvarianceScope==='full_cycle'?");
html=html.replace('<main','<p>瑞士球背伸已更新鞋尖方向；其它93项沿用此前媒体。原版与检查证据保留。</p><main');fs.writeFileSync(out+'/index.html',html);
write(out+'/package-manifest.json',{schemaVersion:3,kind:'curated_media_selection',createdAt:new Date().toISOString(),planned:94,ready:56,reviewRequired:38,selectedMasterVideos:94,selectedMobileVideos:94,selectedPosters:94,selection:manifest.selection,footCorrection:{qaPass:true,independentDecode:decode,preservation:corrected.motionCorrection},originalPackage:'evidence/previous-package/package-manifest.json',phoneAppMediaReplaced:false});
fs.writeFileSync(out+'/README.md','# Flare训练素材库 · 瑞士球背伸鞋向修正版\n\n选用94项：1080母版、720手机视频、540封面。瑞士球背伸按用户反馈调整双鞋方向和墙面支持位置，原身体/脚踝与8秒节奏逐帧保持；其它93项保持前次成片。\n\n打开[index.html](index.html)搜索瑞士球背伸，当前链接选用footfix。原版媒体仍保留原文件名，不覆盖原94项包。完整选用文件见[便携目录](portable-catalog.json)、[选版证明](manifest.json)与[文件SHA](SHA256SUMS.txt)。56项满足检查条件、38项原提示保留，仍不宣称所有动作QA全部通过。\n\n修正版不是单独spec重求解：它复用原met-cycle里的solver x和腕部目标，保留[原目标表](evidence/jobs/erectors-B/frames/met-cycle.json)、[专用工具](evidence/footfix/render-footfix.mjs)、[新规格](evidence/footfix/spec.json)和[逐帧证明](evidence/footfix/footfix-preservation.json)。240周期帧加2秒静帧共241次检查；3个真实原接触求解与重放的非脚骨矩阵差为0。没有附全3D资产/运行时依赖，不能宣称异机直接运行。\n\n当前App仍L43/v41与原51视频；包仅独立素材。署名、来源、原审计与其它94项证据全部保留。主机绝对路径是溯源记录，使用本目录相对链接搬移播放。\n');
fs.unlinkSync(out+'/.selection-incomplete');
// Preserve every original file except the deliberately regenerated root selection metadata.
const changed=new Set(['index.html','manifest.json','portable-catalog.json','package-manifest.json','directory-manifest.json','SHA256SUMS.txt','README.md']);
let unchanged=0;for(const line of fs.readFileSync(base+'/SHA256SUMS.txt','utf8').trim().split('\n')){const [,sha,rel]=/^([a-f0-9]{64})  (.+)$/.exec(line);if(changed.has(rel))continue;assert.equal(hash(out+'/'+rel),sha,rel);unchanged++;}
const files=[];function walk(dir){for(const d of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,d.name),rel=path.relative(out,p).replaceAll('\\','/');if(d.isDirectory())walk(p);else if(!['directory-manifest.json','SHA256SUMS.txt'].includes(rel))files.push({path:rel,bytes:fs.statSync(p).size,sha256:hash(p)})}}walk(out);files.sort((a,b)=>a.path.localeCompare(b.path));write(out+'/directory-manifest.json',{schemaVersion:1,complete:true,generatedAt:new Date().toISOString(),files});
const sums=[...files,{path:'directory-manifest.json',sha256:hash(out+'/directory-manifest.json')}].map(f=>f.sha256+'  '+f.path).join('\n')+'\n';fs.writeFileSync(out+'/SHA256SUMS.txt',sums);
console.log(JSON.stringify({out,complete:true,selectedVariants:94,changed:['erectors-B'],originalFilesVerified:unchanged,files:files.length+2,packageManifestSha256:hash(out+'/package-manifest.json')}));
