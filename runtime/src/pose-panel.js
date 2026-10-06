import { Euler, Quaternion, MathUtils } from 'three';
import { exerciseById } from './data.js';
import { renderSources, poseSources } from './research-ui.js';
import { mirrorContinuationSources, mirroredStep, mirroredTemplate } from './pose-mirror.js';
import { applySavedMirrorUpdate } from './saved-mirror-update.js';

const KEY='flare-pose-library-v1';
const MIRROR_COMPLETION='five-step-half-v1';
const clone=value=>JSON.parse(JSON.stringify(value));
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const handleHint=(id,current)=>{
  if(id==='pelvis')return '髋部独立移动与旋转。移动时上身不再整体平移，腰部配合弯曲；旋转保留上身方向。整体移动或转身请选择躯干。';
  if(id==='torso')return '整体移动或转向，带动髋部和上身。单独摆髋请选择髋部；弯腰、扭腰和侧弯请选择腰部。';
  if(id==='waist')return '以腰部为轴，独立调整上身的弯腰、扭腰和侧弯。';
  if(id?.endsWith('Knee'))return '移动膝部调整弯曲方向；旋转以膝关节为轴，带动小腿和脚掌。';
  if(id?.endsWith('Elbow')){
    const side=id.startsWith('left')?'left':'right',label=side==='left'?'左':'右';
    return '移动肘部调整弯曲方向；旋转以肘关节为轴，带动前臂和手掌。'+(current?.limbs?.[side]?.handLocked?`当前${label}手固定，请先取消「${label}手固定」再旋转。`:'');
  }
  if(id?.endsWith('Ankle'))return '移动脚踝带动整条腿；旋转脚踝调整脚掌和鞋尖朝向。';
  if(id?.endsWith('Wrist'))return '移动手腕带动整条手臂；旋转手腕调整掌面和手指朝向。';
  return '选择身体上的圆点，查看这个部位的调整方式。';
};
const angleLabels=id=>id==='waist'?['弯腰 X','扭腰 Y','侧弯 Z']:['俯仰 X','转向 Y','侧倾 Z'];

export function createPosePanel({viewer,panel,shelf,presetPanel,presets=[],notify,refreshIcons,onPresetLoad,onTraining,onDisplayStep,onUseDemonstration,onUndoDemonstration,hasPreviousDemonstration}){
  let library={version:1,steps:[],draft:null,removed:[]},active=null,title='',history=[],dragStart=null,saveTimer;
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved?.version===1&&Array.isArray(saved.steps)){library={...library,...saved,removed:saved.removed||[]};title=String(saved.title||'');}}catch{}
  let mirrorUpdateNotice=null;
  try{
    const update=applySavedMirrorUpdate(localStorage);
    if(update.applied){
      library={...library,...update.library};title=String(library.title||'');
      if(update.addedCount)mirrorUpdateNotice=`已自动补齐 ${update.addedCount} 个右侧镜像步骤，原来的 13 步与草稿保留。`;
    }
  }catch{}
  const $=selector=>panel.querySelector(selector);
  const pose=()=>viewer.motion.capturePose();
  const remember=()=>{library.draft=pose();library.title=title;const step=library.steps.find(item=>item.id===active);if(selectedPreset){library.draftSourcePreset=selectedPreset;library.draftMirrored=false;}else if(step){library.draftSourcePreset=step.sourcePreset||null;library.draftMirrored=!!step.mirrored;}try{localStorage.setItem(KEY,JSON.stringify(library));}catch{notify('本地保存暂时不可用，可用「导出 JSON」保存步骤。');}};
  const checkpoint=previous=>{history.push(clone(previous||pose()));if(history.length>50)history.shift();};
  const id=()=>crypto.randomUUID();
  const changed=()=>{remember();refresh(true);};
  const applyEdit=edit=>{checkpoint();try{edit();changed();}catch(error){history.pop();notify(error.message);refresh(true);}};
  let selectedPreset=presets.some(item=>item.id===library.presetId)?library.presetId:null;

  function updateCaption(){
    const step=library.steps.find(item=>item.id===active);
    const sourceTemplate=presets.find(item=>item.id===(selectedPreset||step?.sourcePreset||library.draftSourcePreset));
    const template=!selectedPreset&&(step?.mirrored??library.draftMirrored)?mirroredTemplate(sourceTemplate):sourceTemplate;
    const name=(selectedPreset?template?.name:title)||step?.name||'自定义姿势';
    document.querySelector('#viewer-overline').textContent=template?'FLARE KEY POSE':'YOUR POSE';
    document.querySelector('#viewer-label').textContent=name;
    document.querySelector('#viewer-subtitle').textContent=template?.summary||'点身体圆点，再拖动彩色轴。';
    if($('#pose-current-title'))$('#pose-current-title').textContent=name;
    if($('#pose-current-description'))$('#pose-current-description').textContent=template?.summary||'手腕和脚踝带动四肢，肘和膝可绕关节旋转；腰部控制上身弯曲。';
    const guidance=$('#pose-technique');
    if(guidance){
      const technique=template?.technique;
      const open=guidance.open;
      const cycleCopy=presets[0]?.sourceStepNumber===9&&presets.at(-1)?.sourceStepNumber===9?'循环顺序：后双撑 → 左侧三个变化 → 前双撑 → 右侧三个变化 → 后双撑。':'循环顺序：前撑 → 右手侧撑 → 后撑 → 左手侧撑 → 前撑。';
      guidance.innerHTML=`<summary>手脚朝向与动作要点</summary>${technique?`<div class="pose-technique-content"><p><strong>手掌 / 手指</strong>${escape(technique.hands)}</p><p><strong>脚背 / 脚尖</strong>${escape(technique.feet)}</p><p><strong>身体 / 节奏</strong>${escape(technique.body)}</p><div class="pose-cue">${escape(technique.cue)}</div><div class="pose-related-training">${(technique.exercises||[]).filter(id=>exerciseById[id]).map(id=>`<button data-pose-training="${id}">${escape(exerciseById[id].name)} ↗</button>`).join('')}</div><p class="pose-note">${cycleCopy}姿势保留当前保存值，可继续编辑。</p>${renderSources(poseSources(technique.sourceUrls),'对照教练示范')}</div>`:'<p class="pose-note">选择左侧关键姿势可查看对应要点。旋转手腕调整掌面与手指方向，旋转脚踝调整鞋尖；身体左右以人物本人为准。</p>'}`;
      guidance.open=open;
      guidance.querySelectorAll('[data-pose-training]').forEach(button=>button.addEventListener('click',()=>onTraining?.(button.dataset.poseTraining)));
    }
  }

  function syncDisplayStep(){
    const activeId=viewer.mode==='motion'?presets[viewer.motion.getMetrics().demonstration.index]?.id:selectedPreset;
    presetPanel?.querySelectorAll('[data-preset]').forEach(button=>{
      const current=button.dataset.preset===activeId;
      button.classList.toggle('active',current);button.setAttribute('aria-pressed',String(current));
    });
  }

  function renderPresets(){
    if(!presetPanel)return;
    const savedLoop=presets[0]?.sourceStepNumber===9&&presets.at(-1)?.sourceStepNumber===9;
    const copy=savedLoop?'原第 09–16 步，再接回 09。点选查看，在姿势编辑中继续调整。':'你保存并微调的托马斯步骤。点选查看，在姿势编辑中继续调整。';
    presetPanel.innerHTML=`<div class="presets-heading"><h3>正式展示姿势</h3><span>${String(presets.length).padStart(2,'0')} POSES</span></div><p class="presets-copy">${copy}</p><div class="preset-list">${presets.map((item,i)=>`<button class="preset-button" data-preset="${escape(item.id)}" aria-pressed="false"><span class="preset-number">${String(savedLoop?item.sourceStepNumber:i+1).padStart(2,'0')}</span><span class="preset-text"><strong>${escape(item.name)}</strong><span>${escape(item.summary)}</span></span></button>`).join('')}</div>`;
    presetPanel.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>usePreset(button.dataset.preset)));
    syncDisplayStep();
  }

  function usePreset(id){
    const template=presets.find(item=>item.id===id);if(!template)return;
    if(viewer.mode==='motion'){
      viewer.playing=false;
      viewer.setTime(presets.indexOf(template)*viewer.motion.getMetrics().period/presets.length);
      syncDisplayStep();onDisplayStep?.();onPresetLoad?.(template);return;
    }
    checkpoint();viewer.motion.applyPose(clone(template.pose));viewer.poseEditor.refresh();selectedPreset=id;library.presetId=id;active=null;title=template.name;
    if($('#pose-name'))$('#pose-name').value=title;
    changed();renderPresets();renderShelf();updateCaption();onPresetLoad?.(template);
  }

  function enter(previousMode,{fromCurrent=false}={}){
    const restoreDraft=!!library.draft&&!fromCurrent;
    if(restoreDraft){
      try{viewer.motion.applyPose(library.draft);}catch{library.draft=null;}
    }else if(previousMode==='motion'){
      selectedPreset=null;library.presetId=null;library.draftSourcePreset=null;library.draftMirrored=false;active=null;title='当前阶段姿势';
    }else if(presets.length){
      const template=presets[0];viewer.motion.applyPose(clone(template.pose));selectedPreset=template.id;library.presetId=template.id;title=template.name;
    }
    viewer.poseEditor.refresh();
    render();if(!restoreDraft)remember();
    // Apply the user's requested completion once, in whichever browser holds
    // their five edited saves. Unrelated libraries and an explicit undo stay intact.
    if(library.steps.length===5&&library.mirrorCompletion!==MIRROR_COMPLETION&&library.steps.every((step,index)=>step.sourcePreset===presets[index]?.id))completeMirrors();
    if(mirrorUpdateNotice){notify(mirrorUpdateNotice);mirrorUpdateNotice=null;}
  }

  function render(){
    panel.innerHTML=`<div class="detail-kicker"><span>POSE WORKSHOP</span><span>EDIT</span></div>
      <h2 id="pose-current-title" class="detail-title">当前姿势</h2>
      <p id="pose-current-description" class="detail-copy pose-intro">点选身体上的圆点，再拖动彩色轴。</p>
      <details id="pose-technique" class="pose-technique"><summary>手脚朝向与动作要点</summary></details>
      <div class="pose-field"><label for="pose-handle-select">调整部位</label><select id="pose-handle-select" aria-label="调整部位"></select></div>
      <div class="pose-transform-buttons"><button data-pose-transform="translate">移动 <kbd>G</kbd></button><button data-pose-transform="rotate">旋转 <kbd>R</kbd></button></div>
      <p id="pose-handle-note" class="pose-note" aria-live="polite"></p>
      <fieldset class="pose-values"><legend>位置 <span>厘米</span></legend>${['左右 X','高度 Y','前后 Z'].map((label,i)=>`<label>${label}<input type="number" step="1" id="pose-pos-${i}" data-pose-position="${i}" aria-label="${label}位置，厘米" /></label>`).join('')}</fieldset>
      <fieldset class="pose-values pose-rotation"><legend id="pose-rotation-legend">角度 <span>度</span></legend>${angleLabels().map((label,i)=>`<label><span data-pose-angle-label="${i}">${label}</span><input type="number" step="5" id="pose-rot-${i}" data-pose-rotation="${i}" aria-label="${label}角度，度" /></label>`).join('')}</fieldset>
      <div class="pose-locks"><label><input id="pose-left-lock" type="checkbox"/>左手固定</label><label><input id="pose-right-lock" type="checkbox"/>右手固定</label><label><input id="pose-ground-lock" type="checkbox"/>脚不穿地</label></div>
      <div class="pose-tools"><button id="pose-undo">撤销调整</button><button id="pose-fit">看全身</button><button id="pose-standing">从站姿开始</button></div>
      <p id="pose-constraint-note" class="pose-note">四肢长度保持不变；圆点对应人物本人的左右。</p>
      <div class="detail-section pose-save"><h3>保存为中间步骤</h3><label class="pose-field" for="pose-name"><span>步骤名称</span><input id="pose-name" maxlength="80" placeholder="例如：右手支撑，左腿扫过" aria-label="步骤名称" value="${escape(title)}"/></label><div class="pose-save-actions"><button id="pose-save">保存新步骤</button><button id="pose-update">更新此步骤</button></div><p class="pose-note">步骤与当前草稿保存在这个浏览器中。</p></div>
      <div class="pose-file-actions"><button id="pose-export">导出 JSON</button><button id="pose-import">导入 JSON</button><input id="pose-import-file" type="file" accept=".json,application/json" hidden/></div>`;
    const state=viewer.poseEditor.getState();
    $('#pose-handle-select').innerHTML=(state.handles||viewer.motion.getEditableHandles()).map(h=>`<option value="${escape(h.id)}">${escape(h.label)}</option>`).join('');
    $('#pose-handle-select').addEventListener('change',event=>viewer.poseEditor.select(event.target.value));
    panel.querySelectorAll('[data-pose-transform]').forEach(button=>button.addEventListener('click',()=>{viewer.poseEditor.setTransformMode(button.dataset.poseTransform);refresh();}));
    panel.querySelectorAll('[data-pose-position]').forEach(input=>input.addEventListener('change',()=>{
      const position=[0,1,2].map(i=>Number($('#pose-pos-'+i).value)/100);
      if(!position.every(finite))return;
      applyEdit(()=>viewer.poseEditor.setValue({position}));
    }));
    panel.querySelectorAll('[data-pose-rotation]').forEach(input=>input.addEventListener('change',()=>{
      const angles=[0,1,2].map(i=>MathUtils.degToRad(Number($('#pose-rot-'+i).value)));
      if(!angles.every(finite))return;
      const quaternion=new Quaternion().setFromEuler(new Euler(...angles,'YXZ')).toArray();
      applyEdit(()=>viewer.poseEditor.setValue({quaternion}));
    }));
    for(const [selector,side] of [['#pose-left-lock','left'],['#pose-right-lock','right']])$(selector).addEventListener('change',event=>{
      checkpoint();const next=pose();next.limbs[side].handLocked=event.target.checked;viewer.motion.applyPose(next);viewer.poseEditor.refresh();changed();
    });
    $('#pose-ground-lock').addEventListener('change',event=>{checkpoint();const next=pose();next.groundLock=event.target.checked;viewer.motion.applyPose(next);viewer.poseEditor.refresh();changed();});
    $('#pose-name').addEventListener('input',event=>{title=event.target.value;remember();});
    $('#pose-save').addEventListener('click',save);
    $('#pose-update').addEventListener('click',update);
    $('#pose-undo').addEventListener('click',undo);
    $('#pose-fit').addEventListener('click',()=>viewer.resetView());
    $('#pose-standing').addEventListener('click',()=>{checkpoint();viewer.motion.reset();viewer.poseEditor.refresh();active=null;selectedPreset=null;library.presetId=null;library.draftSourcePreset=null;library.draftMirrored=false;title='站姿';$('#pose-name').value=title;changed();renderPresets();updateCaption();});
    $('#pose-export').addEventListener('click',exportFile);
    $('#pose-import').addEventListener('click',()=>$('#pose-import-file').click());
    $('#pose-import-file').addEventListener('change',async event=>{const file=event.target.files[0];if(file){try{await importFile(file);}catch(error){notify(error.message);}event.target.value='';}});
    renderPresets();renderShelf();refresh();updateCaption();refreshIcons();
  }

  function refresh(force=false){
    if(!$('#pose-handle-select'))return;
    const state=viewer.poseEditor.getState(),current=pose();
    $('#pose-handle-select').value=state.selected||'pelvis';
    $('#pose-handle-note').textContent=handleHint(state.selected,current);
    $('#pose-rotation-legend').firstChild.textContent=state.selected==='waist'?'腰部角度 ':state.selected==='pelvis'?'髋部角度 ':'角度 ';
    const labels=angleLabels(state.selected);
    const position=state.position||[0,0,0],quaternion=state.quaternion||[0,0,0,1];
    const rotation=new Euler().setFromQuaternion(new Quaternion().fromArray(quaternion),'YXZ');
    [0,1,2].forEach(i=>{
      const pos=$('#pose-pos-'+i),rot=$('#pose-rot-'+i);
      $(`[data-pose-angle-label="${i}"]`).textContent=labels[i];
      rot.setAttribute('aria-label',`${labels[i]}角度，度`);
      if(force||document.activeElement!==pos)pos.value=(position[i]*100).toFixed(1);
      if(force||document.activeElement!==rot)rot.value=MathUtils.radToDeg([rotation.x,rotation.y,rotation.z][i]).toFixed(1);
      rot.disabled=!state.canRotate;
    });
    panel.querySelectorAll('[data-pose-transform]').forEach(button=>{const rotate=button.dataset.poseTransform==='rotate';button.disabled=rotate&&!state.canRotate;button.classList.toggle('active',state.mode===button.dataset.poseTransform);});
    document.querySelectorAll('[data-pose-operation]').forEach(button=>{button.classList.toggle('active',button.dataset.poseOperation===state.mode);button.disabled=button.dataset.poseOperation==='rotate'&&!state.canRotate;});
    $('#pose-left-lock').checked=!!current.limbs.left.handLocked;
    $('#pose-right-lock').checked=!!current.limbs.right.handLocked;
    $('#pose-ground-lock').checked=current.groundLock!==false;
    $('#pose-undo').disabled=!history.length;
    $('#pose-update').disabled=!library.steps.some(step=>step.id===active);
    const warnings=viewer.motion.getMetrics().warnings||[];
    $('#pose-constraint-note').textContent=state.error||warnings[0]||'四肢长度保持不变；圆点对应人物本人的左右。';
    viewer.dirty=true;
  }

  function onChange(event={}){
    if(event.error&&$('#pose-constraint-note'))$('#pose-constraint-note').textContent=event.error;
    if(event.phase==='start'){dragStart=clone(pose());return;}
    if(event.phase==='end'&&dragStart){checkpoint(dragStart);dragStart=null;}
    clearTimeout(saveTimer);
    if(event.phase==='end'||event.phase==='commit')remember();
    else saveTimer=setTimeout(remember,350);
    refresh();
  }

  function usePhase(time){checkpoint();viewer.setTime(time);viewer.motion.update(time);viewer.motion.applyPose(viewer.motion.capturePose());viewer.poseEditor.refresh();active=null;selectedPreset=null;library.presetId=null;library.draftSourcePreset=null;library.draftMirrored=false;changed();renderPresets();updateCaption();notify('已用这一阶段作为起点，可以继续调整。');}

  function save(){
    if(library.steps.length>=200){notify('已保存 200 个步骤，请先导出或整理。');return;}
    const name=title.trim()||`中间步骤 ${library.steps.length+1}`;
    const previous=library.steps.find(item=>item.id===active);
    const step={id:id(),name,pose:clone(pose()),sourcePreset:selectedPreset||previous?.sourcePreset||library.draftSourcePreset||null,mirrored:selectedPreset?false:(previous?.mirrored??library.draftMirrored??false),createdAt:new Date().toISOString()};
    library.steps.push(step);active=step.id;title=name;$('#pose-name').value=name;remember();renderShelf();refresh();notify(`已保存「${name}」。`);
  }

  function update(){const step=library.steps.find(s=>s.id===active);if(!step)return;step.name=title.trim()||step.name;step.pose=clone(pose());step.updatedAt=new Date().toISOString();remember();renderShelf();notify('这个步骤已更新。');}

  function loadStep(id){const step=library.steps.find(s=>s.id===id);if(!step)return;checkpoint();viewer.motion.applyPose(step.pose);viewer.poseEditor.refresh();active=id;selectedPreset=null;library.presetId=null;title=step.name;$('#pose-name').value=title;changed();renderPresets();renderShelf();updateCaption();const template=presets.find(item=>item.id===step.sourcePreset);onPresetLoad?.((step.mirrored?mirroredTemplate(template):template)||step);}

  function undo(){const previous=history.pop();if(!previous)return;viewer.motion.applyPose(previous);viewer.poseEditor.refresh();changed();}

  function completeMirrors(){
    const sources=mirrorContinuationSources(library.steps).filter(({step})=>!library.steps.some(item=>item.mirrorOf===step.id));
    if(!sources.length){notify('这一半的镜像步骤已经补齐。');return;}
    if(library.steps.length+sources.length>200){notify('步骤总数需在 200 以内，请先导出或整理。');return;}
    const previous=pose(),additions=[];
    try{
      for(const {step,number} of sources){
        const mirrored=mirroredStep(step,{id:id(),createdAt:new Date().toISOString(),number});
        viewer.motion.applyPose(mirrored.pose); // Validate the whole batch before saving.
        additions.push(mirrored);
      }
    }catch(error){notify(error.message);return;}
    finally{viewer.motion.applyPose(previous);viewer.poseEditor.refresh();viewer.dirty=true;}
    try{localStorage.setItem('flare-pose-mirror-backup-v1',JSON.stringify(library));}catch{notify('无法保存镜像前备份，请先导出 JSON。');return;}
    library.steps.push(...additions);library.mirrorBatch=additions.map(item=>item.id);library.mirrorCompletion=MIRROR_COMPLETION;remember();renderShelf();refresh();
    notify(`已补齐 ${additions.length} 个镜像步骤，原来的前五步保留。`);
  }

  function undoMirrors(){
    const ids=new Set(library.mirrorBatch||[]);
    for(let index=library.steps.length-1;index>=0;index--){
      if(!ids.has(library.steps[index].id))continue;
      const [step]=library.steps.splice(index,1);library.removed.push({index,step});
      if(active===step.id)active=null;
    }
    library.removed=library.removed.slice(-20);library.mirrorBatch=[];remember();renderShelf();refresh();notify('已撤销这次补齐，移除的步骤也可逐个恢复。');
  }

  function renderShelf(){
    shelf.innerHTML=`<div class="pose-shelf-heading"><div><h3>我的托马斯步骤</h3><p>按顺序点击，比较每一个中间姿势。</p></div><span>${String(library.steps.length).padStart(2,'0')} STEPS</span></div>`+(library.steps.length?`<ol class="pose-step-list">${library.steps.map((step,i)=>`<li class="pose-step ${step.id===active?'active':''}"><button data-pose-load="${step.id}"><span>${String(i+1).padStart(2,'0')}</span><strong>${escape(step.name)}</strong></button><div class="pose-step-actions"><button data-pose-up="${step.id}" aria-label="第${i+1}步上移" ${i===0?'disabled':''}>↑</button><button data-pose-down="${step.id}" aria-label="第${i+1}步下移" ${i===library.steps.length-1?'disabled':''}>↓</button><button data-pose-delete="${step.id}" aria-label="移除第${i+1}步">×</button></div></li>`).join('')}</ol>`:'<p class="pose-empty">调整好姿势后，输入名称并点「保存新步骤」。</p>')+(library.removed.length?'<button id="pose-restore" class="pose-restore">撤销移除步骤</button>':'');
    const missingMirrors=mirrorContinuationSources(library.steps).filter(({step})=>!library.steps.some(item=>item.mirrorOf===step.id));
    if(library.steps.length>=5)shelf.insertAdjacentHTML('beforeend',`<div class="pose-mirror-completion"><button id="pose-complete-mirrors" ${missingMirrors.length?'':'disabled'}>${missingMirrors.length?'补齐另一侧':'另一侧已补齐'}</button>${library.mirrorBatch?.some(id=>library.steps.some(item=>item.id===id))?'<button id="pose-undo-mirrors">撤销补齐</button>':''}<p>前五步从前撑到后撑时，按第 4 → 3 → 2 → 1 步的镜像接回前撑。左右手脚、朝向与支撑状态一起交换。</p></div>`);
    const canUseDemonstration=library.steps.length===9||library.steps.length>=16;
    const displayCopy=library.steps.length>=16?'按第 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 9 步组成正式循环，其余个人步骤保留。':'完整保存 16 步后，按第 9–16 步接回第 9 步；已有独立九步也可直接用于展示。';
    shelf.insertAdjacentHTML('beforeend',`<div class="pose-mirror-completion"><button id="pose-use-demonstration" ${canUseDemonstration?'':'disabled'}>用于正式展示</button>${hasPreviousDemonstration?.()?'<button id="pose-undo-demonstration">撤销展示替换</button>':''}<p>${displayCopy}继续微调并更新步骤后，可再次替换展示。</p></div>`);
    shelf.querySelector('#pose-use-demonstration')?.addEventListener('click',()=>{try{onUseDemonstration?.(clone(library.steps));renderShelf();}catch(error){notify(error.message);}});
    shelf.querySelector('#pose-undo-demonstration')?.addEventListener('click',()=>{try{onUndoDemonstration?.();renderShelf();}catch(error){notify(error.message);}});
    shelf.querySelector('#pose-complete-mirrors')?.addEventListener('click',completeMirrors);
    shelf.querySelector('#pose-undo-mirrors')?.addEventListener('click',undoMirrors);
    shelf.querySelectorAll('[data-pose-load]').forEach(button=>button.addEventListener('click',()=>loadStep(button.dataset.poseLoad)));
    for(const [attribute,offset] of [['poseUp',-1],['poseDown',1]])shelf.querySelectorAll(`[data-${attribute==='poseUp'?'pose-up':'pose-down'}]`).forEach(button=>button.addEventListener('click',()=>{
      const index=library.steps.findIndex(step=>step.id===button.dataset[attribute]);
      if(index<0||index+offset<0||index+offset>=library.steps.length)return;
      [library.steps[index],library.steps[index+offset]]=[library.steps[index+offset],library.steps[index]];remember();renderShelf();
    }));
    shelf.querySelectorAll('[data-pose-delete]').forEach(button=>button.addEventListener('click',()=>{const index=library.steps.findIndex(s=>s.id===button.dataset.poseDelete);if(index<0)return;const [step]=library.steps.splice(index,1);library.removed.push({index,step});if(library.removed.length>20)library.removed.shift();if(active===step.id)active=null;remember();renderShelf();refresh();}));
    shelf.querySelector('#pose-restore')?.addEventListener('click',()=>{const removed=library.removed.pop();library.steps.splice(Math.min(removed.index,library.steps.length),0,removed.step);remember();renderShelf();});
  }

  function exportFile(){
    const steps=library.steps.length?library.steps:[{id:id(),name:title.trim()||'当前姿势',pose:pose()}];
    const data={format:'flare-pose-library',version:1,character:'Snow Flare Coach',exportedAt:new Date().toISOString(),steps};
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download='flare-my-steps.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('步骤已导出为 JSON。');
  }

  async function importFile(file){
    if(file.size>2*1024*1024)throw new Error('请选择 2 MB 以内的姿势 JSON 文件。');
    let data;try{data=JSON.parse(await file.text());}catch{throw new Error('文件不是有效的 JSON。');}
    if(data.format!=='flare-pose-library'||data.version!==1||!Array.isArray(data.steps)||!data.steps.length||data.steps.length+library.steps.length>200)throw new Error('请选择这个项目导出的步骤文件，总步骤数需在 200 以内。');
    const previous=pose(),valid=[];
    const importedIds=new Map(data.steps.filter(step=>typeof step.id==='string').map(step=>[step.id,id()]));
    try{
      for(const step of data.steps){
        if(typeof step.name!=='string'||!step.pose)throw new Error('步骤文件缺少名称或姿势。');
        const normalized=viewer.motion.applyPose(step.pose);
        valid.push({id:importedIds.get(step.id)||id(),name:step.name.slice(0,80),pose:clone(normalized),sourcePreset:presets.some(item=>item.id===step.sourcePreset)?step.sourcePreset:null,mirrored:step.mirrored===true,...(importedIds.has(step.mirrorOf)?{mirrorOf:importedIds.get(step.mirrorOf),mirrorSourceNumber:step.mirrorSourceNumber}:{}),createdAt:new Date().toISOString()});
      }
    }finally{viewer.motion.applyPose(previous);viewer.poseEditor.refresh();viewer.dirty=true;}
    library.steps.push(...valid);remember();renderShelf();notify(`已导入 ${valid.length} 个步骤。`);
  }

  function keydown(event){
    if(document.body.dataset.mode!=='pose'||viewer.mode!=='pose'||viewer.poseEditor.getState().dragging||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();undo();}
    else if(event.key.toLowerCase()==='g'){viewer.poseEditor.setTransformMode('translate');refresh();}
    else if(event.key.toLowerCase()==='r'){viewer.poseEditor.setTransformMode('rotate');refresh();}
  }
  document.addEventListener('keydown',keydown);
  return {enter,leave(){if(saveTimer){clearTimeout(saveTimer);saveTimer=null;remember();}},render,refresh,renderPresets,syncDisplayStep,onChange,usePhase,usePreset,undo,getLibrary:()=>clone(library),dispose:()=>{document.removeEventListener('keydown',keydown);clearTimeout(saveTimer);}};
}
