import './style.css';
import './workspace.css';
import { createIcons, Orbit, Info, Camera, ArrowUpRight, PersonStanding, Rotate3d, Dumbbell, Search, Scan, UserRound, RotateCcw, PanelRight, PanelLeft, SlidersHorizontal, EyeOff, Maximize, Mouse, Play, Pause, Move3d, Shield, MoveUp, Hand, MoveHorizontal, Expand, MoveDiagonal2, ChevronRight, CornerUpLeft, ArrowLeft, X, Pencil } from 'lucide';
import { muscleGroups, groupById, phases, exercises, exerciseById } from './data.js';
import { BodyViewer } from './viewer.js';
import { createPosePanel } from './pose-panel.js';
import { createTransitionPanel } from './transition-panel.js';
import { createWorkspace } from './workspace.js';
import { createFlarePosePresets } from './pose-presets.js';
import { renderSources } from './research-ui.js';
import { resolveOfficialSequence, sequenceFromSavedSteps, saveOfficialSequence, previousOfficialSequence, restoreOfficialSequence, updateOfficialFrame } from './official-poses.js';
import { rebaseTransitionEdits, saveOfficialFrameEdits } from './transition-edits.js';

const icons={Orbit,Info,Camera,ArrowUpRight,PersonStanding,Rotate3d,Dumbbell,Search,Scan,UserRound,RotateCcw,PanelRight,PanelLeft,SlidersHorizontal,EyeOff,Maximize,Mouse,Play,Pause,Move3d,Shield,MoveUp,Hand,MoveHorizontal,Expand,MoveDiagonal2,ChevronRight,CornerUpLeft,ArrowLeft,X,Pencil};
const refreshIcons=()=>createIcons({icons,attrs:{'stroke-width':1.5}});
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let mode='anatomy',selectedGroup='shoulders',selectedExercise='supportShift',phaseIndex=0,selectedPart=null,viewer,posePanel,transitionPanel,workspaceUI,presets=[],demonstration=null,displayedStep=-1,ready=false;
let toastTimeout;
let motionModel='saved';
const periodicPhases={rear:'rear',right:'sideA',front:'front',left:'sideB'};

function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>{$('#toast').hidden=true;},4200);}
function persist(){try{localStorage.setItem('flare-studio-v1',JSON.stringify({group:selectedGroup,exercise:selectedExercise}));}catch{}}
try{const saved=JSON.parse(localStorage.getItem('flare-studio-v1')||'null');if(groupById[saved?.group])selectedGroup=saved.group;if(exerciseById[saved?.exercise])selectedExercise=saved.exercise;}catch{}

function renderMuscles(){
  const query=$('#muscle-search').value.trim().toLowerCase();
  const matches=muscleGroups.filter(g=>`${g.name} ${g.english} ${g.anatomy} ${g.id}`.toLowerCase().includes(query));
  const showingMuscle=viewer&&viewer.layer!=='skin'&&mode!=='motion';
  $('#muscle-list').innerHTML=matches.map(g=>`<button class="muscle-item ${g.id===selectedGroup&&showingMuscle?'active':''}" data-group="${g.id}" aria-pressed="${!!(g.id===selectedGroup&&showingMuscle)}"><span class="index">${String(muscleGroups.indexOf(g)+1).padStart(2,'0')}</span><span class="name">${g.name}</span><span class="category-dot"></span></button>`).join('')||'<p class="search-empty">没有匹配的关键肌群。<br>试试“肩”、hip 或 core。</p>';
  $('#muscle-list').querySelectorAll('[data-group]').forEach(button=>button.addEventListener('click',()=>selectGroup(button.dataset.group)));
  if(query&&ready){
    const parts=viewer.manifest.parts.filter(p=>p.name.toLowerCase().includes(query)).slice(0,12);
    if(parts.length){const list=document.createElement('div');list.className='source-search-results';list.innerHTML=`<span class="source-search-title">源模型结构</span>${parts.map(p=>`<button data-part="${p.id}" class="source-search-item">${escape(p.name)}</button>`).join('')}`;$('#muscle-list').append(list);list.querySelectorAll('[data-part]').forEach(button=>button.addEventListener('click',()=>onSelect(viewer.manifest.parts.find(p=>p.id===button.dataset.part))));}
  }
}
function phaseTime(index){
  const metrics=viewer?.motion?.getMetrics(),frame=metrics?.keyframes?.[phases[index].id];
  if(motionModel==='periodic')return({rear:0,sideA:.25,front:.5,sideB:.75}[phases[index].id]||0)*metrics.period;
  return Number.isFinite(frame)&&demonstration?.steps.length?frame*metrics.period/demonstration.steps.length:phases[index].time;
}
function renderPhases(){
  const ordered=phases.map((p,i)=>({p,i,time:phaseTime(i)})).sort((a,b)=>a.time-b.time);
  $('#phase-strip').innerHTML=ordered.map(({p,i},rank)=>`<button class="phase-card ${i===phaseIndex?'active':''}" data-phase="${i}" aria-label="查看${p.name}" aria-pressed="${i===phaseIndex}"><span class="phase-top"><span class="phase-number">0${rank+1}</span><span>${i===0?'BUILD':i===1?'TRANSFER':i===2?'SUPPORT':'CONNECT'}</span></span><h3>${p.name}</h3><p>${p.short}</p></button>`).join('');
  $('#phase-strip').querySelectorAll('[data-phase]').forEach(button=>button.addEventListener('click',()=>{const time=phaseTime(Number(button.dataset.phase));if(mode==='pose'){posePanel.usePhase(time);updatePhase(time);return;}setMode('motion');viewer.playing=false;viewer.setTime(time);updatePlayButton();renderDetail();}));
}
function updatePhase(time){
  const metrics=viewer?.motion?.getMetrics(),step=metrics?.periodic?.section??metrics?.demonstration?.index??0;
  const phase=metrics?.periodic?periodicPhases[metrics.periodic.section]:demonstration?.steps[step]?.phase;
  const next=Math.max(0,phases.findIndex(p=>p.id===phase));
  if(next!==phaseIndex){phaseIndex=next;$$('[data-phase]').forEach(button=>{const active=Number(button.dataset.phase)===next;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});}
  if(step!==displayedStep){displayedStep=step;if(!metrics?.periodic)posePanel?.syncDisplayStep();if(mode==='motion')renderDetail();}
}
function updateTime(time){
  if(mode==='transition')return;
  const period=viewer?.motion?.getMetrics().period||9;
  $('#timeline').max=period;$('#timeline').value=time;$('#time-label').textContent=`${time.toFixed(1)} / ${period.toFixed(1)} s`;updatePhase(time);
}

function localStore(){try{return localStorage;}catch{return null;}}
function setMotionModel(value,{render=true}={}){
  const next=value==='periodic'?'periodic':'saved';
  try{
    viewer.setSequence({...demonstration,...transitionPanel.options(),motionModel:next},{preserveView:true});
    motionModel=next;$('#motion-model').value=next;displayedStep=-1;
    if(render){updateMotionCaption();renderPhases();updateTime(viewer.time);updateLayerButtons();renderDetail();}
    return true;
  }catch(error){$('#motion-model').value=motionModel;toast(error.message);return false;}
}
function updateMotionCaption(){
  if(mode!=='motion')return;
  const periodic=motionModel==='periodic';
  $('#pose-presets').hidden=periodic;
  $('#stage-title').textContent=periodic?'托马斯 · 数学轨迹试验':'托马斯 · 9 步展示';
  $('#stage-footnote').textContent=periodic?'整圈连续生成。拖动时间轴检查摆腿与换手，切换“你的保存动画”即可对比。':'按照你保存的 9 步展示。点击步骤或拖动时间轴查看，暂停后可以继续编辑。';
}
function applyTransitionOptions(options){
  const previous=transitionPanel?.options();
  try{viewer.setSequence({...demonstration,...options,motionModel},{preserveView:true});}
  catch(error){if(previous)viewer.setSequence({...demonstration,...previous,motionModel},{preserveView:true});throw error;}
}
function replaceDemonstration(sequence,action='save'){
  const previous=demonstration;
  try{
    viewer.setSequence({...sequence,motionModel});
    if(action==='save')saveOfficialSequence(sequence,localStore());
    else if(action==='restore')restoreOfficialSequence(sequence,localStore());
  }catch(error){viewer.setSequence({...previous,...transitionPanel?.options(),motionModel});throw error;}
  demonstration=structuredClone(sequence);
  transitionPanel?.setSequence(sequence);
  presets.splice(0,presets.length,...createFlarePosePresets(viewer.motion,demonstration));
  renderPhases();displayedStep=-1;updateTime(viewer.time);posePanel.renderPresets();
  if(mode==='pose')posePanel.render();else renderDetail();
  updateLayerButtons();updatePlayButton();
}

function saveAnimationFrames(sequence, edits, { restore = false } = {}) {
  const saved = saveOfficialFrameEdits(sequence, edits, localStore(), { restore });
  demonstration = structuredClone(sequence);
  presets.splice(0,presets.length,...createFlarePosePresets(viewer.motion,demonstration));
  renderPhases();displayedStep=-1;posePanel.renderPresets();
  return { sequence: demonstration, document: saved };
}
function updateAnimationFrame(index, pose, edits) {
  const sequence = updateOfficialFrame(demonstration, index, pose);
  return saveAnimationFrames(sequence, rebaseTransitionEdits(edits, demonstration, sequence));
}
function undoAnimationFrames(snapshot) {
  const sequence = snapshot?.sequence || previousOfficialSequence(localStore());
  if (!sequence) throw new Error('没有可恢复的原姿态更新。');
  const edits = snapshot?.document || rebaseTransitionEdits(transitionPanel.getDocument(), demonstration, sequence);
  return saveAnimationFrames(sequence, edits, { restore: true });
}
function importAnimationFrames(sequence, edits) {
  // Importing a complete animation is explicit; unrelated node layouts stay isolated.
  rebaseTransitionEdits(edits, sequence, demonstration);
  const imported = structuredClone(sequence);
  if (imported.source?.origin !== 'browser-keyframe-edit') imported.source = { ...imported.source, origin: 'browser-animation-import' };
  return saveAnimationFrames(imported, edits);
}

function exerciseLink(id){const e=exerciseById[id];return`<button class="exercise-link" data-exercise="${e.id}"><span class="exercise-icon"><i data-lucide="${e.icon}"></i></span><span><span class="exercise-name">${e.name}</span><span class="exercise-sub">${e.type} · ${e.difficulty}</span></span><i data-lucide="chevron-right"></i></button>`;}

function renderDetail(){
  if(mode==='transition'){transitionPanel?.render();return;}
  if(mode==='pose'){posePanel?.render();return;}
  const g=groupById[selectedGroup],index=muscleGroups.indexOf(g)+1;const panel=$('#detail-panel');
  if(mode==='anatomy'&&(!viewer||viewer.layer==='skin')){
    panel.innerHTML=`<div class="detail-kicker"><span>BODY & MOVEMENT</span><span>01</span></div><h2 class="detail-title">先看身体，<br>再理解肌群。</h2><p class="detail-english">Meet your movement companion</p><span class="function-tag"><i data-lucide="person-standing"></i>运动人物 · 完整外观</span><p class="detail-copy">跟着运动人物观察支撑与摆腿。想知道某个部位怎样参与 Flare，点选左侧肌群，进入真实局部解剖视图。</p><div class="detail-section"><div class="detail-section-heading"><h3>Flare 的三类能力</h3><i data-lucide="move-3d"></i></div><div class="function-list"><div class="function-row">肩带、肘腕配合稳定支撑。</div><div class="function-row">躯干连接移重与身体旋回。</div><div class="function-row">髋部控制开腿、抬腿与回收。</div></div></div><div class="detail-section"><div class="detail-section-heading"><h3>从基础练习开始</h3><i data-lucide="arrow-up-right"></i></div>${exerciseLink('wristLoad')}${exerciseLink('scapPush')}</div><button class="focus-button" id="start-exploring"><i data-lucide="scan"></i>查看肩部参与的肌群</button><p class="evidence-note">运动人物改编自 Blender Studio 的 Snow Rig。局部解剖使用 BodyParts3D 的独立结构，保留真实名称与几何。</p>`;
    $('#viewer-overline').textContent='BODY & MOVEMENT';$('#viewer-label').textContent='一起动起来';$('#viewer-subtitle').textContent='观察姿态，探索肌群。';
    $('#start-exploring').addEventListener('click',()=>selectGroup('shoulders'));
  }else if(mode==='motion'&&motionModel==='periodic'){
    const metrics=viewer.motion.getMetrics(),p=phases.find(item=>item.id===periodicPhases[metrics.periodic.section]);
    const supports=metrics.supportHands.map(side=>side==='left'?'左手':'右手').join(' + ');
    panel.innerHTML=`<div class="detail-kicker"><span>PERIODIC FLARE</span><span>试验版</span></div><h2 class="detail-title">连续摆腿，<br>交替支撑。</h2><p class="detail-english">${p.english}</p><span class="function-tag"><i data-lucide="hand"></i>${supports}支撑</span><p class="detail-copy">统一摆腿幅度和髋部节奏，整圈连续生成。先看腿的扫动与抬起，再看身体是否顺畅地接回下一圈。</p><div class="detail-section"><div class="detail-section-heading"><h3>这一版的动作节奏</h3><i data-lucide="rotate-3d"></i></div><div class="function-list"><div class="function-row">一腿抬起过身，另一腿低位扫过。</div><div class="function-row">落地的手保持固定，换手前后短暂双手支撑。</div><div class="function-row">身体侧倾和髋部摆动接续下一圈。</div></div></div><button class="focus-button" id="compare-saved-animation"><i data-lucide="rotate-ccw"></i>对比你的保存动画</button><p class="evidence-note">这是一版数学轨迹试验。请重点观察腿的圆弧、换手和身体旋回是否自然。</p>`;
    $('#viewer-overline').textContent='PERIODIC FLARE';$('#viewer-label').textContent=p.name;$('#viewer-subtitle').textContent='数学轨迹 · 整圈连续生成';
    $('#compare-saved-animation').addEventListener('click',()=>setMotionModel('saved'));
  }else if(mode==='motion'){
    const stepIndex=viewer.motion.getMetrics().demonstration.index,item=presets[stepIndex],p=phases.find(phase=>phase.id===item.phase)||phases[0];
    const supports=item.supportHands.map(side=>side==='left'?'左手':'右手').join(' + ')||'移重过渡';
    panel.innerHTML=`<div class="detail-kicker"><span>MOVEMENT BREAKDOWN</span><span>${String(stepIndex+1).padStart(2,'0')} / ${String(presets.length).padStart(2,'0')}</span></div><h2 class="detail-title">${escape(item.name)}</h2><p class="detail-english">YOUR FLARE SEQUENCE</p><span class="function-tag"><i data-lucide="hand"></i>${escape(supports)}支撑</span><p class="detail-copy">${escape(item.technique.body)}</p><div class="detail-section"><div class="detail-section-heading"><h3>手脚朝向</h3><i data-lucide="move-3d"></i></div><div class="function-list"><div class="function-row">${escape(item.technique.hands)}</div><div class="function-row">${escape(item.technique.feet)}</div></div><p class="motion-cue">${escape(item.technique.cue)}</p><div class="phase-pills">${p.focus.map(id=>`<button class="phase-pill" data-related-group="${id}">${groupById[id].name}</button>`).join('')}</div></div><div class="detail-section"><div class="detail-section-heading"><h3>对应的辅助训练</h3><i data-lucide="arrow-up-right"></i></div>${item.technique.exercises.slice(0,2).map(exerciseLink).join('')}</div><button class="focus-button" id="return-anatomy"><i data-lucide="person-standing"></i>返回完整人物</button><p class="evidence-note">正式展示采用你保存并微调的 9 个关键姿势。点击左侧步骤可逐个查看，暂停后可继续编辑。</p>`;
    $('#viewer-overline').textContent='YOUR FLARE SEQUENCE';$('#viewer-label').textContent=item.name;$('#viewer-subtitle').textContent=`第 ${stepIndex+1} / ${presets.length} 步${item.sourceStepNumber?` · 原第 ${String(item.sourceStepNumber).padStart(2,'0')} 步`:''} · ${item.summary}`;
    $('#return-anatomy').addEventListener('click',()=>setMode('anatomy'));
    const edit=document.createElement('button');edit.className='focus-button pose-edit-current';edit.id='edit-current-pose';edit.innerHTML='<i data-lucide="pencil"></i>编辑这个姿势';panel.querySelector('#return-anatomy').before(edit);edit.addEventListener('click',()=>setMode('pose',{fromCurrent:true}));
    const transition=document.createElement('button');transition.className='focus-button';transition.id='edit-current-transition';transition.innerHTML='<i data-lucide="sliders-horizontal"></i>编辑动画 · K帧';edit.before(transition);transition.addEventListener('click',()=>{setMode('transition');workspaceUI.revealDetails();});
  }else if(mode==='training'){
    const e=exerciseById[selectedExercise];
    panel.innerHTML=`<div class="detail-kicker"><span>TRAINING LIBRARY</span><span>${String(exercises.indexOf(e)+1).padStart(2,'0')} / 08</span></div><h2 class="detail-title">${e.name}</h2><p class="detail-english">${e.english}</p><span class="function-tag"><i data-lucide="${e.icon}"></i>${e.type} · ${e.difficulty}</span><p class="detail-copy">${e.description}</p><div class="detail-section"><div class="detail-section-heading"><h3>怎么做</h3><i data-lucide="move-3d"></i></div><ol class="training-detail-steps">${e.steps.map(step=>`<li>${step}</li>`).join('')}</ol></div><div class="detail-section"><div class="detail-section-heading"><h3>什么时候进阶</h3><i data-lucide="arrow-up-right"></i></div><p class="detail-copy">${e.progression}</p><p class="motion-cue">${e.cue}</p><div class="phase-pills">${e.groups.map(id=>`<button class="phase-pill" data-related-group="${id}">${groupById[id].name}</button>`).join('')}</div></div><button class="training-return" id="return-anatomy"><i data-lucide="arrow-left"></i>返回肌群探索</button><p class="evidence-note">根据肌肉功能与动作需求编排的教学建议。训练量由当前能力决定；掌根、肩或腹股沟出现疼痛时，停止并调整练习。</p>`;
    $('#return-anatomy').addEventListener('click',()=>setMode('anatomy'));
    $('#viewer-overline').textContent=viewer?.layer==='skin'?'TRAINING COMPANION':g.english.toUpperCase();$('#viewer-label').textContent=viewer?.layer==='skin'?'一起练习':g.name;$('#viewer-subtitle').textContent=viewer?.layer==='skin'?'从受控的基础动作开始。':'与当前练习关联的真实肌群。';
  }else if(selectedPart&&!selectedPart.hotspot){
    const p=selectedPart,sourceGroup=viewer.manifest.groups.find(s=>s.elements.includes(p.id));
    panel.innerHTML=`<div class="detail-kicker"><span>STRUCTURE INSPECTOR</span><span>${p.system==='skeletal'?'BONE':'MUSCLE'}</span></div><h2 class="detail-title structure-title">${escape(sourceGroup?.label||'骨骼结构')}</h2><p class="detail-english">${escape(p.name)}</p><span class="function-tag"><i data-lucide="scan"></i>直接选中的解剖结构</span><p class="detail-copy">这是源模型中保留独立名称与几何的结构。${p.system==='skeletal'?'骨骼与关节为身体提供结构，并与肌肉共同构成运动系统。':'本结构可在模型中单独识别。八个热点是 Flare 的功能分组，未列入热点并不代表不参与运动。'}</p><div class="detail-section"><div class="detail-section-heading"><h3>结构信息</h3><i data-lucide="info"></i></div><div class="function-list"><div class="function-row">${escape(p.name)}</div><div class="function-row">BodyParts3D · ${escape(p.id)}</div><div class="function-row">${p.side==='left'?'人体左侧':p.side==='right'?'人体右侧':'中线或未标侧别'}</div></div></div><button class="focus-button" id="clear-part"><i data-lucide="arrow-left"></i>返回关键肌群</button><p class="evidence-note">单块结构名称来自 BodyParts3D 元数据，保留英文以便核对。可从左侧选择一个肌群，查看动作中的功能关联。</p>`;
    $('#clear-part').addEventListener('click',()=>selectGroup(selectedGroup));
    $('#viewer-overline').textContent=p.system==='skeletal'?'SKELETAL STRUCTURE':'MUSCLE STRUCTURE';$('#viewer-label').textContent=sourceGroup?.label||'骨骼结构';$('#viewer-subtitle').textContent=p.name;
  }else{
    panel.innerHTML=`<div class="detail-kicker"><span>MUSCLE INSIGHT</span><span>${String(index).padStart(2,'0')} / 08</span></div><h2 class="detail-title">${g.name}</h2><p class="detail-english">${g.english}<br>${g.anatomy}</p><span class="function-tag"><i data-lucide="${g.icon}"></i>${g.category}</span><p class="detail-copy">${g.description}</p><div class="detail-section"><div class="detail-section-heading"><h3>Flare 中的作用</h3><i data-lucide="move-3d"></i></div><div class="function-list">${g.roles.map(role=>`<div class="function-row">${role}</div>`).join('')}</div><div class="phase-pills">${g.phases.map(i=>`<button class="phase-pill" data-jump-phase="${i}">${phases[i].name}</button>`).join('')}</div></div><div class="detail-section"><div class="detail-section-heading"><h3>对应的辅助训练</h3><i data-lucide="arrow-up-right"></i></div>${g.exercises.map(exerciseLink).join('')}</div><button class="focus-button" id="focus-button"><i data-lucide="person-standing"></i>返回完整人物</button>${selectedPart?`<p class="selected-structure">已选中 <strong>${escape(selectedPart.name)}</strong><br>${escape(selectedPart.id)} · ${escape(selectedPart.conceptId||'BodyParts3D')}</p>`:''}<p class="evidence-note">${g.note}<br>局部结构来自 BodyParts3D；作用说明为功能推断，高亮不表示实测激活强度。</p>`;
    $('#focus-button').addEventListener('click',()=>{if(!ready)return;selectedPart=null;viewer.setLayer('skin');updateLayerButtons();renderMuscles();renderDetail();});
    $('#viewer-overline').textContent=g.english.toUpperCase();$('#viewer-label').textContent=g.name;$('#viewer-subtitle').textContent=g.short;
  }
  const research=mode==='training'?exerciseById[selectedExercise]:(mode==='anatomy'&&viewer?.layer!=='skin'&&(!selectedPart||selectedPart.hotspot)?g:null);
  if(research){
    if(research.addresses){
      const problem=document.createElement('div');problem.className='training-address';
      problem.innerHTML=`<strong>${mode==='training'?'针对哪个动作问题':'对应的动作需求'}</strong>${escape(research.addresses)}`;
      panel.querySelector('.detail-section')?.before(problem);
    }
    const sources=renderSources(research.sources);
    if(sources)panel.querySelector('.evidence-note')?.insertAdjacentHTML('beforebegin',sources);
  }
  panel.querySelectorAll('[data-exercise]').forEach(button=>button.addEventListener('click',()=>openExercise(button.dataset.exercise)));
  panel.querySelectorAll('[data-jump-phase]').forEach(button=>button.addEventListener('click',()=>{setMode('motion');viewer.playing=false;viewer.setTime(phaseTime(Number(button.dataset.jumpPhase)));updatePlayButton();renderDetail();}));
  panel.querySelectorAll('[data-related-group]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.relatedGroup;selectGroup(id);toast(`正在查看${groupById[id].name}的真实局部结构。`);}));
  refreshIcons();
}

function renderTraining(){
  const relevant=exercises.filter(e=>e.groups.includes(selectedGroup));
  const others=exercises.filter(e=>!e.groups.includes(selectedGroup));
  $('#training-panel').innerHTML=`<div class="training-panel-header"><h3>从基础，到动作连接。</h3><span>优先显示 ${groupById[selectedGroup].name} 关联练习</span></div><div class="training-cards">${[...relevant,...others].map(e=>`<button class="training-card ${e.id===selectedExercise?'active':''}" data-training="${e.id}" aria-pressed="${e.id===selectedExercise}"><span class="training-card-top"><span>${e.type} / ${e.difficulty}</span><i data-lucide="${e.icon}"></i></span><h4>${e.name}</h4><p>${escape(e.addresses||e.description)}</p></button>`).join('')}</div>`;
  $('#training-panel').querySelectorAll('[data-training]').forEach(button=>button.addEventListener('click',()=>openExercise(button.dataset.training,false)));
  refreshIcons();
}
function selectGroup(id){if(!groupById[id])return;if(mode==='motion'||mode==='pose'||mode==='transition')setMode('anatomy');selectedGroup=id;selectedPart=null;viewer?.selectGroup(id);updateLayerButtons();if(mode==='training'){const g=groupById[id];if(!exerciseById[selectedExercise].groups.includes(id))selectedExercise=g.exercises[0];renderTraining();}renderMuscles();renderDetail();workspaceUI?.revealDetails();persist();}
function onSelect(part){if(!part||!ready)return;if(mode==='motion')setMode('anatomy');selectedPart=part;if(part.hotspot){selectedGroup=part.hotspot;viewer.selectGroup(selectedGroup);}viewer.selectPart(part);updateLayerButtons();renderMuscles();renderDetail();persist();}
function openExercise(id){selectedExercise=id;const e=exerciseById[id];if(!e.groups.includes(selectedGroup))selectedGroup=e.groups[0];setMode('training');viewer?.selectGroup(selectedGroup);updateLayerButtons();renderMuscles();renderTraining();renderDetail();workspaceUI?.revealDetails();persist();}
function updatePlayButton(){const playing=viewer?.playing;$('#play-button').innerHTML=`<i data-lucide="${playing?'pause':'play'}"></i>`;$('#play-button').setAttribute('aria-label',playing?'暂停动作':'播放动作');refreshIcons();}
function updateLayerButtons(){
  $$('[data-layer]').forEach(button=>{const active=button.dataset.layer===viewer?.layer;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  const motion=mode==='motion',local=!!viewer&&!motion&&viewer.layer!=='skin';
  $('#view-caption').textContent=mode==='transition'?'逐段修正过渡':mode==='pose'?'自由摆放姿势':motion?(motionModel==='periodic'?'托马斯 · 数学轨迹试验':'你的托马斯 · 正式展示'):local?'真实局部肌群':'友善运动人物';
  $('#model-kind').textContent=local?'BODYPARTS3D / 4.0':'SNOW / BLENDER STUDIO';
  if(ready)$('#part-count').textContent=mode==='pose'||mode==='transition'?`${viewer.motion.getEditableHandles().length} 个控制点`:motion?(motionModel==='periodic'?'连续周期轨迹':`${presets.length} 个关键姿势`):local?`${selectedPart&&!selectedPart.hotspot?1:viewer.groupIds[selectedGroup]?.size||0} 个真实结构`:'完整人物';
  $('#legend').hidden=!local;const legend=$$('#legend>span');if(legend.length===3){legend[0].hidden=false;legend[1].hidden=true;legend[2].hidden=true;}
}
function setMode(next,{fromCurrent=false}={}){
  if(!ready&&next!=='anatomy'){toast('模型正在载入，请稍等。');return;}
  if(next!=='motion'&&motionModel==='periodic'&&!setMotionModel('saved',{render:false}))return;
  const previous=mode;if(previous==='transition'&&next!=='transition')transitionPanel?.leave();if(previous==='pose'&&next!=='pose')posePanel?.leave();mode=next;selectedPart=null;viewer?.setMode(next==='transition'?'pose':next);$$('button[data-mode]').forEach(button=>{const active=button.dataset.mode===next;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  const transition=next==='transition',motion=next==='motion',training=next==='training',editing=next==='pose'||transition;document.body.dataset.mode=next;
  $('#anatomy-toolbar').hidden=motion||editing;$('#motion-toolbar').hidden=!motion;$('#training-panel').hidden=!training;$('#pose-shelf').hidden=!editing;$('#pose-presets').hidden=!(editing||motion);$('#pose-view-toolbar').hidden=!editing;$('#phase-strip').hidden=training||editing;$('#legend').hidden=motion||editing;$('#hover-tooltip').hidden=true;
  $('#transition-shelf').hidden=!transition;if(transition){$('#pose-shelf').hidden=true;$('#pose-presets').hidden=true;}
  $('#transition-transport').hidden=!transition;
  $$('.library-drawer .sidebar-section-head,.library-drawer .search,#muscle-list').forEach(element=>{element.hidden=motion||editing;});
  $('#stage-kicker').textContent=transition?'TRANSITION WORKSHOP':editing?'POSE WORKSHOP':motion?'MOVEMENT BREAKDOWN':training?'TRAINING CONNECTIONS':'ANATOMY EXPLORER';
  $('#stage-title').textContent=transition?'托马斯 · 动画编辑':editing?'托马斯 · 关键姿势':motion?'托马斯 · 9 步展示':training?'辅助练习':'身体与肌群';
  $('#stage-footnote').textContent=transition?'白色帧更新原姿态，蓝色帧修正过渡；按 K 保存，前后自动补帧。':editing?'这些姿势是可修改的起点。按你的动作标准调整，保存为自己的步骤。':motion?'按照你保存的 9 步展示。点击步骤或拖动时间轴查看，暂停后可以继续编辑。':training?'教学建议基于肌肉功能和动作需求；先掌握受控支撑，再连接专项动作。':'完整人物用于观察姿态；点选肌群，切换真实局部解剖视图。';
  workspaceUI?.setMode(next);
  if(transition)transitionPanel.enter();else if(editing){posePanel.enter(previous,{fromCurrent});}
  if(motion){posePanel?.renderPresets();updateMotionCaption();displayedStep=-1;renderPhases();updateTime(viewer.time);}
  if(training)renderTraining();updateLayerButtons();updatePlayButton();renderMuscles();if(!transition)renderDetail();
}

refreshIcons();renderMuscles();renderPhases();renderDetail();
$$('button[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
$$('[data-layer]').forEach(button=>button.addEventListener('click',()=>{if(!ready)return;selectedPart=null;viewer.setLayer(button.dataset.layer);updateLayerButtons();renderMuscles();renderDetail();}));
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>{viewer?.setView(button.dataset.view);$$('[data-view]').forEach(b=>b.classList.toggle('active',b===button));}));
$$('[data-pose-view]').forEach(button=>button.addEventListener('click',()=>viewer?.setView(button.dataset.poseView)));
$$('[data-pose-operation]').forEach(button=>button.addEventListener('click',()=>{viewer?.poseEditor.setTransformMode(button.dataset.poseOperation);if(mode==='transition')transitionPanel?.refresh();else posePanel?.refresh();}));
$('#reset-view').addEventListener('click',()=>{viewer?.resetView();$$('[data-view]').forEach(b=>b.classList.remove('active'));});
$('#muscle-search').addEventListener('input',renderMuscles);
$('#play-button').addEventListener('click',()=>{if(!ready)return;viewer.playing=!viewer.playing;if(viewer.playing&&viewer.time>=viewer.motion.getMetrics().period)viewer.setTime(0);updatePlayButton();});
$('#timeline').addEventListener('input',event=>{viewer.playing=false;viewer.setTime(Number(event.target.value));updatePlayButton();});
$('#speed').addEventListener('change',event=>{if(viewer)viewer.speed=Number(event.target.value);});
$('#motion-model').addEventListener('change',event=>{if(ready)setMotionModel(event.target.value);});
$('#about-button').addEventListener('click',()=>$('#about-dialog').showModal());
$('#close-about').addEventListener('click',()=>$('#about-dialog').close());
$('#about-dialog').addEventListener('click',event=>{if(event.target===$('#about-dialog')){const rect=event.target.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)event.target.close();}});
$('#capture-button').addEventListener('click',async()=>{if(!ready)return;const button=$('#capture-button');button.disabled=true;try{const blob=await viewer.capture();if(!blob)throw new Error('无法保存图像');const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`flare-${mode}-${selectedGroup}-${Date.now()}.png`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('当前三维视图已保存为 PNG。');}catch(error){toast(error.message);}finally{button.disabled=false;}});
document.addEventListener('keydown',event=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);if(event.key==='/'&&!typing&&mode!=='pose'&&mode!=='transition'){event.preventDefault();workspaceUI.setOpen('library',true);$('#muscle-search').focus();}if(event.code==='Space'&&!typing&&mode==='motion'&&!$('#about-dialog').open){event.preventDefault();viewer.playing=!viewer.playing;updatePlayButton();}});
document.addEventListener('keydown',event=>{
  const focused=document.activeElement,typing=focused.isContentEditable||/TEXTAREA|SELECT/.test(focused.tagName)||(focused.tagName==='INPUT'&&!['range','checkbox','radio','button'].includes(focused.type));
  if(mode!=='transition'||typing||$('#about-dialog').open||viewer.poseEditor.getState().dragging)return;
  if(event.code==='Space'){event.preventDefault();transitionPanel?.togglePreview();}
  else if(event.key==='Escape'){transitionPanel?.cancelCurveEdit();}
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();transitionPanel?.undoPose();}
  if(event.key.toLowerCase()==='k'&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();transitionPanel?.savePoint();}
  if(['ArrowLeft','ArrowRight'].includes(event.key)&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();transitionPanel?.stepFrame(event.key==='ArrowLeft'?-1:1);}
  if(['g','r'].includes(event.key.toLowerCase())&&viewer.poseEditor.getState().enabled){viewer.poseEditor.setTransformMode(event.key.toLowerCase()==='g'?'translate':'rotate');transitionPanel?.refresh();}
});

async function initialize(){
  try{
    viewer=new BodyViewer($('#scene'),{
      onProgress:(percent,message)=>{$('#loading-progress').style.width=`${percent}%`;$('#loading-status').textContent=message;},
      onSelect,
      onHover:(part,event)=>{const tooltip=$('#hover-tooltip');tooltip.hidden=!part;if(part){tooltip.innerHTML=`${escape(part.name)}<small>${escape(part.id)} · ${part.side==='left'?'人体左侧':part.side==='right'?'人体右侧':'中线结构'}</small>`;const rect=$('#viewport').getBoundingClientRect();tooltip.style.left=`${Math.max(10,Math.min(rect.width-220,event.clientX-rect.left+14))}px`;tooltip.style.top=`${Math.min(rect.height-70,event.clientY-rect.top+12)}px`;}},
      onTime:updateTime,
      onPoseChange:event=>{if(mode==='pose')posePanel?.onChange(event);else if(mode==='transition')transitionPanel?.onChange(event);},
      onPoseSelection:()=>{if(mode==='pose')posePanel?.refresh();else if(mode==='transition')transitionPanel?.refresh();}
    });
    workspaceUI.sync();viewer.selectGroup(selectedGroup);const manifest=await viewer.load();ready=true;$('#loading').hidden=true;
    demonstration=resolveOfficialSequence(localStore());viewer.setSequence(demonstration);
    presets=createFlarePosePresets(viewer.motion,demonstration);
    posePanel=createPosePanel({viewer,panel:$('#detail-panel'),shelf:$('#pose-shelf'),presetPanel:$('#pose-presets'),presets,notify:toast,refreshIcons,onTraining:id=>openExercise(id),onDisplayStep:()=>updatePlayButton(),onUseDemonstration:steps=>{replaceDemonstration(sequenceFromSavedSteps(steps));toast('已将这 9 步用于正式展示，个人步骤保留。');},onUndoDemonstration:()=>{const previous=previousOfficialSequence(localStore());if(previous){replaceDemonstration(previous,'restore');toast('已恢复此前的正式展示，个人步骤保留。');}},hasPreviousDemonstration:()=>!!previousOfficialSequence(localStore()),onPresetLoad:()=>workspaceUI.afterPreset()});
    transitionPanel=createTransitionPanel({viewer,panel:$('#detail-panel'),shelf:$('#transition-shelf'),sequence:demonstration,storage:localStore,notify:toast,refreshIcons,onApply:applyTransitionOptions,onUpdateFrame:updateAnimationFrame,onRestoreFrames:undoAnimationFrames,onImportFrames:importAnimationFrames,hasPreviousFrameUpdate:()=>['browser-keyframe-edit','browser-animation-import'].includes(demonstration?.source?.origin)&&!!previousOfficialSequence(localStore()),onExit:()=>{setMode('motion');workspaceUI.revealDetails();}});
    viewer.setSequence({...demonstration,...transitionPanel.options()},{preserveView:true});
    renderPhases();$('#part-count').textContent='完整人物';
    const boneCount=manifest.parts.filter(p=>p.system==='skeletal').length,muscleCount=manifest.parts.length-boneCount;
    $('#asset-summary').innerHTML=`<div class="asset-statistics"><div><strong>${muscleCount}</strong><span>肌肉结构</span></div><div><strong>${boneCount}</strong><span>骨骼结构</span></div><div><strong>08</strong><span>Flare 功能热点</span></div></div>`;
    setMode('motion');workspaceUI.sync();$('#capture-button').disabled=false;
    // Diagnostics are available only on the explicit local verification page.
    if(new URLSearchParams(location.search).has('inspect'))window.flareInspector={status:()=>({...viewer.getStatus(),editor:viewer.poseEditor.getState(),workspace:workspaceUI.getState()}),projectPart:id=>viewer.projectPart(id),projectCoach:()=>viewer.projectCoach(),projectHandle:id=>viewer.projectHandle(id),setTime:t=>viewer.setTime(t),capturePose:()=>viewer.motion.capturePose(),poseLibrary:()=>posePanel.getLibrary(),presetLibrary:()=>JSON.parse(JSON.stringify(presets)),demonstration:()=>structuredClone(demonstration),transitions:()=>({document:transitionPanel.getDocument(),state:transitionPanel.getState()}),parts:()=>manifest.parts.map(p=>({id:p.id,name:p.name,hotspot:p.hotspot,system:p.system,side:p.side})),rigMetrics:()=>viewer.motion.getMetrics(),boneRotations:()=>Object.fromEntries(['left','right'].flatMap(side=>['UpperArm','Forearm','Thigh','Shin'].map(suffix=>{const name=side+suffix,bone=viewer.motion.group.getObjectByName(name);return[name,bone.getWorldQuaternion(bone.quaternion.clone()).toArray()];})))};
    if(window.flareInspector)window.flareInspector.trajectory=()=>({...viewer.trajectoryGuide.getStatus(),...transitionPanel.getTrajectoryState(),data:viewer.getTrajectoryData()});
    if(window.flareInspector)window.flareInspector.projectTrajectoryPoint=(joint,time)=>viewer.projectTrajectoryPoint(joint,time);
    document.documentElement.dataset.ready='true';
  }catch(error){
    console.error(error);$('#loading').hidden=false;$('#loading').classList.add('error');$('#loading').querySelector('strong').textContent='模型暂时未能载入';$('#loading-status').textContent=error.message.includes('WebGL')?'请在支持 WebGL 的浏览器中打开本地页面。':`${error.message}。请用 start.cmd 启动本地服务。`;
    const retry=document.createElement('button');retry.className='retry-button';retry.textContent='重新载入';retry.addEventListener('click',()=>location.reload());$('#loading').append(retry);
  }
}
$('#capture-button').disabled=true;
workspaceUI=createWorkspace({viewer:()=>viewer,refreshIcons,onNotice:toast});
initialize();
