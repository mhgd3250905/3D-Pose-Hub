// Explicit playback of the accepted baked Flare v41 clip on the current
// training human. No descriptor IK, pacing pass, pose approximation or rebake.
(function () {
  const E = window.__drill;
  if (!E) throw new Error('Flare v41 requires the normal drill engine first');
  const originalApplyAt = E.applyAt, originalSetupCamera = E.setupCamera, originalMetrics = E.metrics;
  let installed = null, active = false;
  const wrap = (time, period) => ((time % period) + period) % period;
  const boneNames = ['pelvis','torso','neck','head','leftScapula','leftUpperArm','leftForearm','leftHand','leftThigh','leftPatella','leftShin','leftFoot','rightScapula','rightUpperArm','rightForearm','rightHand','rightThigh','rightPatella','rightShin','rightFoot','spineLower','spineUpper'];
  const requireClip = spec => {
    if (!installed || installed.path !== spec.bakedClipPath || installed.clip.name !== spec.bakedClipName) throw new Error('Install the matching baked Flare v41 source before sampling');
    return installed;
  };
  const updateSkeletons = model => model.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
  const deactivate = () => {
    if (!active) return;
    for (const p of installed.pairs) { p.target.matrixAutoUpdate = p.auto; p.target.matrixWorldAutoUpdate = p.worldAuto; }
    active = false; E._jo = null; E.poseTargets = null;
    flareInspector.viewer.motion.reset();
  };

  window.__installFlareV41Demo = async function (spec) {
    if (!spec?.bakedClipPath || spec.bakedClipName !== 'flare_v41_loop') throw new Error('A fixed baked Flare v41 source is required');
    if (installed) { requireClip(spec); return installed.info; }
    const T = __toonT, viewer = flareInspector.viewer;
    E.init(); E.selectModelProfile(spec); viewer.motion.reset(); viewer.coach.updateMatrixWorld(true); updateSkeletons(viewer.coach);
    const response = await fetch(spec.bakedClipPath);
    if (!response.ok) throw new Error('Baked Flare source unavailable: ' + response.status);
    const bytes = await response.arrayBuffer();
    const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2,'0')).join('');
    if (digest !== spec.bakedClipSha256) throw new Error('Baked Flare source SHA changed');
    const { GLTFLoader } = await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().parseAsync(bytes, new URL('.', new URL(spec.bakedClipPath, location.href)).href);
    const model = gltf.scene, clip = gltf.animations.find(c => c.name === spec.bakedClipName);
    if (!clip || clip.tracks.length !== 44) throw new Error('Expected Flare v41 clip with44 tracks');
    model.updateMatrixWorld(true);
    const sources = new Map(), targets = new Map();
    model.traverse(o => { if (o.isBone) sources.set(o.name,o); });
    viewer.coach.traverse(o => { if (o.isBone) targets.set(o.name,o); });
    if (sources.size !== 22 || boneNames.some(n => !sources.has(n) || !targets.has(n))) throw new Error('Flare v41 requires the matching22 native/helper bones');
    // Both source and root character use the same identity armature and mature
    // source mesh. Copy WORLD matrices, including the two non-local spine
    // helper transforms; copying their .position would be incorrect.
    const identity = new T.Matrix4();
    for (const root of [model, model.getObjectByName('Coach_Rig'), viewer.coach, viewer.coach.getObjectByName('Coach_Rig')]) {
      if (!root || root.matrixWorld.elements.some((v,i) => Math.abs(v-identity.elements[i]) > 1e-10)) throw new Error('Flare adapter requires identity root/armature transforms');
    }
    const pairs = boneNames.map(name => ({name,source:sources.get(name),target:targets.get(name),auto:targets.get(name).matrixAutoUpdate,worldAuto:targets.get(name).matrixWorldAutoUpdate,neutralQ:targets.get(name).getWorldQuaternion(new T.Quaternion())}));
    const restJ = viewer.motion.getMetrics().joints, jointMap = {pelvis:'pelvis',waist:'torso',shoulderCenter:'torso',neck:'neck',head:'head'};
    for (const side of ['left','right']) for (const [suffix,bone] of Object.entries({Shoulder:'UpperArm',Elbow:'Forearm',Wrist:'Hand',Palm:'Hand',Hip:'Thigh',Knee:'Shin',Ankle:'Foot',Toe:'Foot'})) jointMap[side+suffix] = side+bone;
    const markers = Object.entries(jointMap).map(([name,bone]) => ({name,bone,local:new T.Vector3(...restJ[name]).applyMatrix4(targets.get(bone).matrixWorld.clone().invert())}));
    const mixer = new T.AnimationMixer(model), action = mixer.clipAction(clip);
    action.setLoop(T.LoopOnce,1); action.clampWhenFinished = true; action.play();
    let phases = null;
    if (spec.bakedPhasePath) {
      const r = await fetch(spec.bakedPhasePath);
      if (!r.ok) throw new Error('Flare phase source unavailable');
      const phaseBytes = await r.arrayBuffer();
      const phaseDigest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', phaseBytes))].map(v => v.toString(16).padStart(2,'0')).join('');
      if (!spec.bakedPhaseSha256 || phaseDigest !== spec.bakedPhaseSha256) throw new Error('Flare phase source SHA changed');
      phases = JSON.parse(new TextDecoder().decode(phaseBytes));
      if (phases.clip !== spec.bakedClipName || phases.frameCount !== 540 || phases.frames.length !== 540) throw new Error('Expected original Flare v41 phase metadata');
    }
    const info = {path:spec.bakedClipPath,sha256:digest,clipName:clip.name,clipDurationSeconds:clip.duration,originalPeriodSeconds:spec.originalPeriodSeconds,encodingDurationSeconds:spec.timeline.duration,frames30fps:Math.round(spec.timeline.duration*30),bones:22,tracks:44,worldMatrixTransfer:true,helperWorldTransformsPreserved:true,descriptorSolver:false,secondPacingPass:false,rebaked:false,markerSource:'Actual native bone origins; palm/toe offsets calibrated on the existing root motion neutral pose. Waist is an upper-torso-carried virtual QA marker, not a bone or a reconstruction of original saved waist controls.',cameraSource:spec.camera.source,sourcePhasePath:spec.bakedPhasePath||null};
    info.sourcePhaseSha256 = spec.bakedPhaseSha256 || null;
    installed = {path:spec.bakedClipPath,model,clip,mixer,action,pairs,targets,sources,markers,phases,info,currentSourceTime:0,currentPhase:null};
    // Kept outside the scene solely for independent numerical verification.
    window.__flareV41Reference = installed;
    window.__flareV41DemoInfo = info;
    return info;
  };

  E.applyAt = function (spec,time,warm) {
    if (!spec.bakedClipPath) { deactivate(); return originalApplyAt(spec,time,warm); }
    const s = requireClip(spec), T = __toonT, viewer = flareInspector.viewer;
    E.selectModelProfile(spec);
    // Frame f samples f/30 of the original paced clip. The MP4 rounds the
    // 8.991662288s source period to270 frames/9s; do not stretch the motion.
    const sourceTime = wrap(time,s.info.originalPeriodSeconds);
    s.action.enabled = true; s.action.paused = false;
    s.mixer.setTime(Math.min(sourceTime,s.clip.duration));
    s.model.updateMatrixWorld(true); updateSkeletons(s.model);
    for (const p of s.pairs) {
      p.target.matrixAutoUpdate = false; p.target.matrixWorldAutoUpdate = false;
      p.target.matrix.copy(p.target.parent.matrixWorld).invert().multiply(p.source.matrixWorld);
      p.target.matrix.decompose(p.target.position,p.target.quaternion,p.target.scale);
      p.target.matrixWorld.copy(p.source.matrixWorld);
    }
    active = true;
    viewer.coach.updateMatrixWorld(true); updateSkeletons(viewer.coach);
    E._jo = Object.fromEntries(s.markers.map(m => [m.name,m.local.clone().applyMatrix4(s.sources.get(m.bone).matrixWorld).toArray()]));
    // Bone-origin joints are exact, rather than rounded rig landmarks.
    for (const [j,bone] of Object.entries({pelvis:'pelvis',shoulderCenter:'torso',neck:'neck',head:'head'})) E._jo[j] = s.sources.get(bone).getWorldPosition(new T.Vector3()).toArray();
    for (const side of ['left','right']) for (const [j,bone] of Object.entries({Shoulder:'UpperArm',Elbow:'Forearm',Wrist:'Hand',Hip:'Thigh',Knee:'Shin',Ankle:'Foot'})) E._jo[side+j] = s.sources.get(side+bone).getWorldPosition(new T.Vector3()).toArray();
    let phase = null;
    if (s.phases) { let i=0; while(i+1<s.phases.frames.length && s.phases.frames[i+1].time<=sourceTime) i++; phase=s.phases.frames[i]; }
    const locked = {left:phase?.support==='both'||phase?.support==='left',right:phase?.support==='both'||phase?.support==='right'};
    E.currentDescriptor = {hands:Object.fromEntries(['left','right'].map(side => [side,{mode:locked[side]?'floor':'free'}]))};
    E.poseTargets = null;
    window.__setRelax(0,0); window.__toonUni.uRelax.value = [0,0];
    s.currentSourceTime = sourceTime;
    s.currentPhase = phase;
    return {params:{bakedTime:sourceTime,bakedPhaseIndex:phase?.keyIndex??-1},x:{},warn:[],touch:{},locked};
  };

  E.metrics = function(spec,full) {
    const result = originalMetrics(spec,full);
    if (!spec.bakedClipPath) return result;
    const s = requireClip(spec), T = __toonT;
    const delta = name => {const p=s.pairs.find(p=>p.name===name);return p.target.getWorldQuaternion(new T.Quaternion()).multiply(p.neutralQ.clone().invert());};
    const pelvis=delta('pelvis'),upper=delta('torso'),neck=delta('neck');
    const bend=pelvis.angleTo(upper)*180/Math.PI;
    Object.assign(result.limits,{waistBendDeg:+bend.toFixed(1),pelvisToChestDeg:+bend.toFixed(1),pelvisToUpperTorsoDeg:+bend.toFixed(1),neckDeg:+upper.angleTo(neck).toFixed(8)*180/Math.PI});
    result.warn = [];
    result.bakedClip = {sourceTime:s.currentSourceTime,sourcePeriodSeconds:s.info.originalPeriodSeconds,encodingDurationSeconds:s.info.encodingDurationSeconds,worldBoneSource:'Original baked AnimationMixer world matrices; no descriptor solver',solverNotRun:true,originalMotionWarningsNotAvailable:true,waistMetricMeaning:'Measured pelvis-to-upper-torso rotation; source runtime waist controls are not reconstructed.'};
    result.bakedClip.phaseId = s.currentPhase?.phaseId || null;
    result.bakedClip.phaseIndex = s.currentPhase?.keyIndex ?? -1;
    return result;
  };

  E.setupCamera = function(spec,size) {
    if (!spec.bakedClipPath) { deactivate(); return originalSetupCamera(spec,size); }
    const s=requireClip(spec),v=flareInspector.viewer,T=__toonT,c=spec.camera;
    E.applyAt(spec,0,null);
    if (c.type!=='orthographic'||!(c.span>0)) throw new Error('Flare v41 requires the measured full-cycle source camera');
    const camera=new T.OrthographicCamera(-c.span/2,c.span/2,c.span/2,-c.span/2,.01,30);
    camera.position.fromArray(c.position);camera.lookAt(new T.Vector3(...c.target));camera.updateProjectionMatrix();camera.updateMatrixWorld();
    v.camera=camera;v.controls.object=camera;v.controls.target.fromArray(c.target);
    E.cam0={pos:camera.position.clone(),tgt:new T.Vector3(...c.target)};v.playing=false;
    s.info.camera={type:'orthographic',fov:null,position:camera.position.toArray(),target:[...c.target],span:c.span,source:c.source};
    return true;
  };
})();
