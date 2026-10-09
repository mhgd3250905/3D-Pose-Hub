import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { muscleGroups, groupById } from './data.js';
import { createCoachMotion } from './coach-motion.js';
import { createPoseEditor } from './pose-editor.js';
import { createTrajectoryGuide } from './trajectory-guide.js';
import { createMovementGuide } from './movement-guide.js';

const material = (color, options={}) => new THREE.MeshStandardMaterial({color,roughness:.77,metalness:0,...options});
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
const STANDARD_VIEW = new THREE.Vector3(.18, .38, 1);
const movementView = mode => mode === 'motion' || mode === 'pose';

export class BodyViewer {
  constructor(container, callbacks) {
    this.container=container;this.callbacks=callbacks;this.mode='anatomy';this.layer='skin';this.selectedGroup='shoulders';this.focused=false;this.parts=[];this.batches=[];this.dirty=true;this.time=0;this.playing=false;this.speed=.5;
    this.scene=new THREE.Scene();this.playbackRange=null;
    this.trajectoryGuide=createTrajectoryGuide({scene:this.scene});this.trajectoryData=null;
    this.camera=new THREE.PerspectiveCamera(32,1,.02,40);
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    this.renderer.setClearColor(0x08080a,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.15;
    container.append(this.renderer.domElement);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true;this.controls.dampingFactor=.13;this.controls.enablePan=true;this.controls.minDistance=.45;this.controls.maxDistance=7;this.controls.minPolarAngle=.12;this.controls.maxPolarAngle=Math.PI*.90;
    this.controls.addEventListener('change',()=>{this.dirty=true;this.callbacks.onCameraChange?.();});
    this.scene.add(new THREE.HemisphereLight(0xf6f2ea,0x3c3a3e,2)); // neutral graphite bounce (was navy)
    const key=new THREE.DirectionalLight(0xffead2,3.7);key.position.set(-2.5,4,4);this.scene.add(key);
    // Real contact shadows: hands, feet and the body now cast onto the floor.
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.bias=-.0004;key.shadow.normalBias=.02;key.shadow.radius=6;
    Object.assign(key.shadow.camera,{left:-1.9,right:1.9,top:1.9,bottom:-1.9,near:1,far:12});key.shadow.camera.updateProjectionMatrix();
    const shadowCatcher=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.ShadowMaterial({color:0x000000,opacity:.5}));shadowCatcher.rotation.x=-Math.PI/2;shadowCatcher.position.y=-.006;shadowCatcher.receiveShadow=true;this.scene.add(shadowCatcher);this.shadowCatcher=shadowCatcher;
    // Soft studio reflections so skin, cotton and rubber read as different materials.
    const pmrem=new THREE.PMREMGenerator(this.renderer);this.scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;this.scene.environmentIntensity=.32;pmrem.dispose();
    const rim=new THREE.DirectionalLight(0xf0f2ff,2.2);rim.position.set(2,2,-3);this.scene.add(rim);
    const fill=new THREE.DirectionalLight(0xe2e2ea,.8);fill.position.set(4,.7,2);this.scene.add(fill);
    this.anatomy=new THREE.Group();this.scene.add(this.anatomy);
    this.muscleMaterial=material(0x9c7766);this.boneMaterial=material(0xd4c9ab,{roughness:.65});
    this.activeMaterial=material(0x79b8ff,{roughness:.7,emissive:0x123154,emissiveIntensity:.13});
    this.selectionMaterial=material(0xbfddff,{roughness:.6,emissive:0x16365a,emissiveIntensity:.18,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    this.hoverMaterial=material(0xb6d6ff,{roughness:.65,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    this.selectedMesh=new THREE.Mesh(new THREE.BufferGeometry(),this.selectionMaterial);this.selectedMesh.visible=false;this.scene.add(this.selectedMesh);
    this.hoverMesh=new THREE.Mesh(new THREE.BufferGeometry(),this.hoverMaterial);this.hoverMesh.visible=false;this.scene.add(this.hoverMesh);
    // Floor grid that dissolves toward the edges instead of ending in a hard square.
    const gridCanvas=document.createElement('canvas');gridCanvas.width=gridCanvas.height=1024;
    const gridContext=gridCanvas.getContext('2d');gridContext.strokeStyle='rgba(220,220,228,1)';
    for(let i=0;i<=40;i++){const p=Math.round(i*1024/40)+.5;gridContext.globalAlpha=i%5===0?.55:.22;gridContext.lineWidth=i%5===0?1.4:1;gridContext.beginPath();gridContext.moveTo(p,0);gridContext.lineTo(p,1024);gridContext.moveTo(0,p);gridContext.lineTo(1024,p);gridContext.stroke();}
    gridContext.globalAlpha=1;gridContext.globalCompositeOperation='destination-in';
    const gridFade=gridContext.createRadialGradient(512,512,40,512,512,512);gridFade.addColorStop(0,'rgba(0,0,0,1)');gridFade.addColorStop(.55,'rgba(0,0,0,.55)');gridFade.addColorStop(1,'rgba(0,0,0,0)');
    gridContext.fillStyle=gridFade;gridContext.fillRect(0,0,1024,1024);
    const gridTexture=new THREE.CanvasTexture(gridCanvas);gridTexture.anisotropy=8;gridTexture.colorSpace=THREE.SRGBColorSpace;
    const grid=new THREE.Mesh(new THREE.PlaneGeometry(4,4),new THREE.MeshBasicMaterial({map:gridTexture,transparent:true,opacity:.18,depthWrite:false}));grid.rotation.x=-Math.PI/2;grid.position.y=-.013;this.scene.add(grid);this.stageGrid=grid;
    const circle=new THREE.Mesh(new THREE.RingGeometry(.38,.382,96),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.08,side:THREE.DoubleSide}));circle.rotation.x=-Math.PI/2;circle.position.y=-.01;this.scene.add(circle);this.stageRing=circle;
    // Soft lit floor: a pool of light under the athlete that fades into the graphite stage.
    const floorCanvas=document.createElement('canvas');floorCanvas.width=floorCanvas.height=256;const floorContext=floorCanvas.getContext('2d');const floorGradient=floorContext.createRadialGradient(128,128,0,128,128,128);floorGradient.addColorStop(0,'rgba(255,255,255,.16)');floorGradient.addColorStop(.45,'rgba(255,255,255,.06)');floorGradient.addColorStop(1,'rgba(255,255,255,0)');floorContext.fillStyle=floorGradient;floorContext.fillRect(0,0,256,256);
    const floorTexture=new THREE.CanvasTexture(floorCanvas);floorTexture.colorSpace=THREE.SRGBColorSpace;
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(4.2,4.2),new THREE.MeshBasicMaterial({map:floorTexture,transparent:true,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.position.y=-.014;floor.renderOrder=-1;this.scene.add(floor);this.stageFloor=floor;
    const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;
    const context=shadowCanvas.getContext('2d');const gradient=context.createRadialGradient(64,64,3,64,64,61);gradient.addColorStop(0,'rgba(0,0,0,.48)');gradient.addColorStop(.4,'rgba(0,0,0,.23)');gradient.addColorStop(1,'rgba(0,0,0,0)');context.fillStyle=gradient;context.fillRect(0,0,128,128);
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.25,.9),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.008;this.scene.add(shadow);
    // Snow displays the user's saved sequence; atlas geometry is shown
    // separately when inspecting a muscle group.
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.pointerDown=null;this.lastPick=0;
    this.renderer.domElement.addEventListener('pointerdown',event=>{this.pointerDown={x:event.clientX,y:event.clientY};});
    this.renderer.domElement.addEventListener('pointerup',event=>{if(!event.trajectoryHandled&&this.pointerDown&&Math.hypot(event.clientX-this.pointerDown.x,event.clientY-this.pointerDown.y)<6&&this.mode!=='motion'){const hit=this.pick(event);if(hit)this.callbacks.onSelect?.(hit.userData.part);}this.pointerDown=null;});
    this.renderer.domElement.addEventListener('pointermove',event=>{if(event.buttons||this.mode==='motion'||this.mode==='pose'||performance.now()-this.lastPick<55)return;this.lastPick=performance.now();const hit=this.pick(event);this.hoverMesh.visible=!!hit;if(hit){this.hoverMesh.geometry=hit.geometry;this.renderer.domElement.style.cursor='pointer';}else this.renderer.domElement.style.cursor='grab';this.callbacks.onHover?.(hit?.userData.part,event);this.dirty=true;});
    this.renderer.domElement.addEventListener('pointerleave',()=>{this.hoverMesh.visible=false;this.callbacks.onHover?.(null);this.dirty=true;});
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.resetView();this.resize();
    this.previous=performance.now();this.animate=this.animate.bind(this);requestAnimationFrame(this.animate);
  }
  async load() {
    this.callbacks.onProgress?.(6,'载入解剖结构索引…');
    const response=await fetch('/anatomy/manifest.json');if(!response.ok)throw new Error('无法读取模型索引');this.manifest=await response.json();
    let completed=0;
    const buffers=await Promise.all(this.manifest.chunks.map(async chunk=>{
      const response=await fetch(typeof DecompressionStream!=='undefined'?chunk.gzip:chunk.url);if(!response.ok)throw new Error('无法读取解剖几何');
      const payload=await response.arrayBuffer();const signature=new Uint8Array(payload,0,Math.min(2,payload.byteLength));
      const buffer=signature[0]===0x1f&&signature[1]===0x8b?await new Response(new Blob([payload]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():payload;
      if(buffer.byteLength!==chunk.bytes)throw new Error('模型文件不完整');completed++;this.callbacks.onProgress?.(10+completed*25,'正在展开肌肉与骨骼…');return buffer;
    }));
    const sourceGroups=Object.fromEntries(this.manifest.groups.map(g=>[g.id,new Set(g.elements)]));
    this.groupIds=Object.fromEntries(muscleGroups.map(g=>[g.id,new Set(this.manifest.parts.filter(p=>p.system==='muscular'&&(g.assetGroups.some(id=>sourceGroups[id]?.has(p.id))||g.extraMatch?.test(p.name))).map(p=>p.id))]));
    const batchParts=new Map();
    for(let i=0;i<this.manifest.parts.length;i++){
      const p=this.manifest.parts[i];const b=buffers[p.chunk];const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(b,p.positions,p.vertexCount*3),3));
      geometry.setAttribute('normal',new THREE.BufferAttribute(new Int16Array(b,p.normals,p.vertexCount*3),3,true));
      geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(b,p.indices,p.indexCount),1));
      geometry.boundingBox=new THREE.Box3(new THREE.Vector3().fromArray(p.bounds[0]),new THREE.Vector3().fromArray(p.bounds[1]));geometry.computeBoundingSphere();
      p.hotspot=muscleGroups.find(g=>this.groupIds[g.id].has(p.id))?.id||null;
      const mesh=new THREE.Mesh(geometry,this.muscleMaterial);mesh.userData.part=p;mesh.updateMatrixWorld();this.parts.push(mesh);
      const key=p.system==='skeletal'?'bones':p.hotspot||'other-muscles';
      if(!batchParts.has(key))batchParts.set(key,[]);batchParts.get(key).push(geometry);
      if(i%100===0){this.callbacks.onProgress?.(60+i/this.manifest.parts.length*25,'拼合真实解剖结构…');await nextFrame();}
    }
    for(const [key,geometries] of batchParts){const mesh=new THREE.Mesh(mergeGeometries(geometries,false),key==='bones'?this.boneMaterial:this.muscleMaterial);mesh.userData.batch=key;this.batches.push(mesh);this.anatomy.add(mesh);}
    this.callbacks.onProgress?.(88,'载入运动人物与骨骼…');await nextFrame();
    const [gltf,rigResponse]=await Promise.all([new GLTFLoader().loadAsync('/coach/flare-coach.glb'),fetch('/coach/coach-rig.json')]);
    if(!rigResponse.ok)throw new Error('无法读取运动人物骨骼');
    this.coach=gltf.scene;this.coach.name='Snow · Flare coach';this.coach.traverse(object=>{if(object.isMesh){object.castShadow=true;}});
    this.rigData=await rigResponse.json();
    this.motion=createCoachMotion({model:this.coach,rigData:this.rigData});
    this.motion.reset();this.scene.add(this.coach);
    this.coach.updateMatrixWorld(true);this.coachRestBounds=new THREE.Box3().setFromObject(this.coach);
    const height=this.coachRestBounds.getSize(new THREE.Vector3()).y;
    // Fit one stable envelope for the entire cycle instead of moving the camera
    // while the athlete's legs sweep around the fixed hands.
    this.motionBounds=new THREE.Box3();
    for(let i=0;i<18;i++){
      this.motion.update(i*this.motion.getMetrics().period/18);const bounds=this.motion.getMetrics().bounds;
      if(bounds?.min?.length===3&&bounds?.max?.length===3&&[...bounds.min,...bounds.max].every(Number.isFinite))this.motionBounds.union(new THREE.Box3(new THREE.Vector3().fromArray(bounds.min),new THREE.Vector3().fromArray(bounds.max)));
    }
    this.motion.reset();
    if(this.motionBounds.isEmpty())this.motionBounds.set(new THREE.Vector3(-height*.72,0,-height*.72),new THREE.Vector3(height*.72,height*.96,height*.72));
    else this.motionBounds.expandByScalar(height*.045);
    this.movementBounds=this.motionBounds.clone();
    this.poseEditor=createPoseEditor({scene:this.scene,camera:this.camera,renderer:this.renderer,orbit:this.controls,motion:this.motion,
      onChange:event=>{this.dirty=true;this.callbacks.onPoseChange?.(event);},onSelection:state=>{this.dirty=true;this.callbacks.onPoseSelection?.(state);}});
    this.poseEditor.setEnabled(false);
    this.movementGuide=createMovementGuide({scene:this.scene,model:this.coach});
    this.applyAppearance();this.resetView();this.callbacks.onProgress?.(100,'人物与肌群已就绪');this.dirty=true;
    return this.manifest;
  }
  // Even pacing: the authored keys sit at equal times but cover very different
  // distances (and the loop's repeated end key adds a still second), so playback
  // speed is modulated to keep hands, feet and pelvis travelling at a steady rate.
  // Only the clock rate changes; poses, K frames and sequence times are untouched.
  // Add ?pacing=raw to the URL to compare with the original timing.
  pacingRate(time){
    // Editor previews also replace motion sequences directly.
    const revision=this.motion?.getSequenceRevision?.();
    if(this.pacingRevision!==revision){this.pacingRevision=revision;this.pacing=null;}
    // K frames, routes and explicit linear timing retain their original clock.
    if(!this.motion?.isSmoothLoopActive?.())return 1;
    if(this.pacingDisabled??=new URLSearchParams(location.search).get('pacing')==='raw')return 1;
    if(!this.pacing)this.pacing=this.computePacing();
    const table=this.pacing;if(!table)return 1;
    const bins=table.length,period=this.motion.getMetrics().period;
    const x=((time%period+period)%period)/period*bins,i=Math.floor(x)%bins,f=x-Math.floor(x);
    const scale=this.motion.getLoopTimeScale?.(time)??1;
    return (table[i]*(1-f)+table[(i+1)%bins]*f)*scale;
  }
  // integrate the paced clock in small sub-steps, so a frame that crosses a rate
  // change (the smooth loop's seam) neither stalls nor jumps
  paceStep(delta){
    const sub=8,step=delta*this.speed/sub;let advance=0;
    for(let i=0;i<sub;i++)advance+=step*this.pacingRate(this.time+advance);
    return advance;
  }
  computePacing(){
    const motion=this.motion;if(!motion||!this.coach)return null;
    const names=['pelvis','leftHand','rightHand','leftFoot','rightFoot'],nodes=names.map(name=>this.coach.getObjectByName(name)).filter(Boolean);
    if(nodes.length<3)return null;
    const period=motion.getMetrics().period,bins=240,saved=this.time,points=[],v=new THREE.Vector3();
    for(let i=0;i<=bins;i++){motion.update(i*period/bins);this.coach.updateMatrixWorld(true);points.push(nodes.map(node=>node.getWorldPosition(v).clone()));}
    motion.update(saved);this.coach.updateMatrixWorld(true);
    // speeds per unit of pose progress (the smooth loop's closing transition runs
    // at half clock speed and is scaled back up in pacingRate)
    const scaleAt=t=>motion.getLoopTimeScale?.(t)??1;
    const speed=[];for(let i=0;i<bins;i++){let d=0;for(let j=0;j<nodes.length;j++)d+=points[i][j].distanceTo(points[i+1][j]);speed.push(d*scaleAt((i+.5)*period/bins));}
    // light smoothing so the rate never jitters
    const smooth=speed.map((_,i)=>{let sum=0,w=0;for(let k=-4;k<=4;k++){const wt=5-Math.abs(k);sum+=speed[(i+k+bins)%bins]*wt;w+=wt;}return sum/w;});
    const mean=smooth.reduce((a,b)=>a+b,0)/bins;if(!(mean>0))return null;
    const raw=smooth.map(value=>value<mean*.02?25:Math.min(25,Math.max(.35,Math.pow(mean/value,.8))));
    // keep the overall cycle duration equal to the authored period
    const cycle=raw.reduce((a,r,i)=>a+1/(r*scaleAt((i+.5)*period/bins)),0)/bins,table=raw.map(r=>r*cycle);
    if(new URLSearchParams(location.search).get('pacing')==='debug')console.log('pacing',JSON.stringify(Array.from({length:9},(_,k)=>{let t=0;for(let i=Math.floor(k*bins/9);i<Math.floor((k+1)*bins/9);i++)t+=period/bins/table[i];return +t.toFixed(2);})));
    return table;
  }
  animate(now){
    const delta=Math.min((now-this.previous)/1000,.06);this.previous=now;
    const previewFrame = this.callbacks.onAnimationFrame?.(delta) === true;
    if(!previewFrame&&this.playing&&this.mode==='motion'&&this.motion){
      const range=this.playbackRange;
      if(range){const duration=range.endTime-range.startTime,elapsed=this.time-range.startTime+this.paceStep(delta);this.time=range.startTime+(elapsed%duration+duration)%duration;}
      else this.time=(this.time+this.paceStep(delta))%this.motion.getMetrics().period;
      this.motion.update(this.time);this.callbacks.onTime?.(this.time);this.dirty=true;
    }
    const moved=this.poseEditor?.getState().dragging?false:this.controls.update();
    if(this.dirty||moved||this.callbacks.needsRender?.()){if(this.mode==='motion')this.movementGuide?.update(this.time,this.motion.getMetrics());this.callbacks.onRender?.();this.renderer.render(this.scene,this.camera);this.dirty=false;}
    requestAnimationFrame(this.animate);
  }
  resize(force=false){
    const {width,height}=this.container.getBoundingClientRect();if(!width||!height)return;
    const aspect=width/height,changed=force||Math.abs(this.camera.aspect-aspect)>.02;
    this.camera.aspect=aspect;
    const inset=this.framingInsets||{left:0,right:0,top:0,bottom:0};
    this.camera.setViewOffset(width,height,(inset.right-inset.left)/2,(inset.bottom-inset.top)/2,width,height);
    this.camera.updateProjectionMatrix();this.renderer.setSize(width,height);this.trajectoryGuide.resize(width,height);
    if(changed&&this.frame&&!this.poseEditor?.getState().dragging){const direction=this.camera.position.clone().sub(this.controls.target);this.fitBounds(this.frame.box,direction,this.frame.padding);}
    this.dirty=true;
  }
  setFramingInsets(insets){
    const prior=this.framingInsets;this.framingInsets={...insets};
    if(!prior||Object.keys(insets).some(key=>Math.abs(prior[key]-insets[key])>1))this.resize(true);
  }
  pick(event){
    if(!this.parts.length||this.layer==='skin'||this.mode==='motion')return null;const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);
    const candidates=this.parts.filter(mesh=>{const p=mesh.userData.part;if(this.selectedPart&&!this.selectedPart.hotspot&&this.layer==='reveal')return p.id===this.selectedPart.id;if(this.layer==='bones')return p.system==='skeletal';if(this.layer==='muscles'&&p.system==='skeletal')return false;if(this.focused||this.layer==='reveal')return this.groupIds[this.selectedGroup]?.has(p.id);return true;});
    return this.raycaster.intersectObjects(candidates,false)[0]?.object||null;
  }
  applyAppearance(){
    const highlight=this.groupIds?.[this.selectedGroup],local=this.mode!=='motion'&&this.mode!=='pose'&&this.layer!=='skin';
    this.anatomy.visible=local;if(this.coach)this.coach.visible=!local;
    this.container.closest('.viewport')?.setAttribute('data-model',local?'anatomy':'coach');
    for(const mesh of this.batches){const batch=mesh.userData.batch;const bones=batch==='bones';mesh.visible=bones?this.layer!=='muscles':this.layer!=='bones';
      if(this.layer==='skin')mesh.visible=false;
      if(bones){mesh.material=this.boneMaterial;if(this.layer==='reveal')mesh.visible=false;}
      else{const active=batch===this.selectedGroup;mesh.material=active?this.activeMaterial:this.muscleMaterial;if((this.focused||this.layer==='reveal')&&!active)mesh.visible=false;}
      if(this.selectedPart&&!this.selectedPart.hotspot&&this.layer==='reveal')mesh.visible=false;}
    // Some structures belong to two functional regions; show them without relabeling.
    if(this.extraHighlights){this.extraHighlights.forEach(mesh=>this.anatomy.remove(mesh));this.extraHighlights=[];}
    if(local&&highlight&&this.layer!=='bones'&&(!this.selectedPart||this.selectedPart.hotspot)){this.extraHighlights=this.parts.filter(mesh=>highlight.has(mesh.userData.part.id)&&mesh.userData.part.hotspot!==this.selectedGroup).map(mesh=>{const clone=new THREE.Mesh(mesh.geometry,this.activeMaterial);this.anatomy.add(clone);return clone;});}
    this.selectedMesh.visible=local&&!!this.selectedPart&&(this.layer==='bones'?this.selectedPart.system==='skeletal':this.layer==='muscles'?this.selectedPart.system==='muscular':true);
    this.motion?.setHighlight(this.selectedGroup);this.motion?.setLayer(this.layer);this.hoverMesh.visible=false;this.dirty=true;
  }
  selectGroup(id){this.selectedGroup=id;this.selectedPart=null;this.selectedMesh.visible=false;if(this.parts.length){this.layer='reveal';this.focused=true;}this.applyAppearance();if(this.focused&&this.mode!=='motion')this.fitGroup();}
  selectPart(part){this.selectedPart=part;const mesh=this.parts.find(m=>m.userData.part.id===part.id);if(mesh)this.selectedMesh.geometry=mesh.geometry;this.layer='reveal';this.focused=true;this.applyAppearance();if(mesh&&!part.hotspot)this.fitBounds(mesh.geometry.boundingBox,new THREE.Vector3(.32,.08,1),1.35);}
  setLayer(layer){this.layer=layer;this.focused=layer==='reveal';this.selectedPart=null;this.applyAppearance();if(this.focused)this.fitGroup();else this.resetView();}
  setFocus(focused){this.setLayer(focused?'reveal':'skin');}
  fitGroup(){
    const box=new THREE.Box3();this.parts.filter(m=>this.groupIds[this.selectedGroup]?.has(m.userData.part.id)).forEach(m=>box.union(m.geometry.boundingBox));if(box.isEmpty())return;
    const view=groupById[this.selectedGroup]?.view;this.fitBounds(box,new THREE.Vector3(.32,.05,view==='back'?-1:1),1.3);
  }
  fitBounds(box,direction=new THREE.Vector3(.58,.04,1),padding=1.2){
    if(!box||box.isEmpty())return;direction=direction.clone().normalize();const center=box.getCenter(new THREE.Vector3());
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
    const {width,height}=this.container.getBoundingClientRect(),inset=this.framingInsets||{left:0,right:0,top:0,bottom:0};
    const tangent=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2)),vertical=tangent*Math.max(.2,(height-inset.top-inset.bottom)/height),horizontal=tangent*Math.max(.2,(width-inset.left-inset.right)/height);let distance=.6;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const offset=new THREE.Vector3(x,y,z).sub(center),depth=offset.dot(direction);distance=Math.max(distance,depth+Math.abs(offset.dot(up))/vertical,depth+Math.abs(offset.dot(right))/horizontal);}
    this.frame={box:box.clone(),padding};this.controls.maxDistance=Math.max(7,distance*padding*1.3);
    const damping=this.controls.enableDamping;this.controls.enableDamping=false;this.controls.update();
    this.controls.target.copy(center);this.camera.position.copy(center).addScaledVector(direction,distance*padding);this.controls.update();this.controls.enableDamping=damping;this.dirty=true;
  }
  fitPose(direction,padding=1.16){
    if(!this.coach)return;
    direction=direction.clone().normalize();if(direction.lengthSq()<1e-8)direction.set(.58,.04,1).normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize(),up=new THREE.Vector3().crossVectors(direction,right).normalize();
    const meshes=[];let count=0;this.coach.updateMatrixWorld(true);
    this.coach.traverse(mesh=>{if(mesh.isMesh&&mesh.geometry.attributes.position){meshes.push(mesh);count+=mesh.geometry.attributes.position.count;}});
    const points=new Float32Array(count*3),point=new THREE.Vector3(),box=new THREE.Box3();
    const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];let cursor=0;
    for(const mesh of meshes){
      mesh.skeleton?.update();
      for(let i=0;i<mesh.geometry.attributes.position.count;i++){
        mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);box.expandByPoint(point);
        const projected=[point.dot(right),point.dot(up),point.dot(direction)];
        for(let axis=0;axis<3;axis++){points[cursor++]=projected[axis];min[axis]=Math.min(min[axis],projected[axis]);max[axis]=Math.max(max[axis],projected[axis]);}
      }
    }
    if(box.isEmpty())return;
    const middle=min.map((v,i)=>(v+max[i])/2),center=new THREE.Vector3().addScaledVector(right,middle[0]).addScaledVector(up,middle[1]).addScaledVector(direction,middle[2]);
    const {width,height}=this.container.getBoundingClientRect(),inset=this.framingInsets||{left:0,right:0,top:0,bottom:0},tangent=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
    const vertical=tangent*Math.max(.2,(height-inset.top-inset.bottom)/height),horizontal=tangent*Math.max(.2,(width-inset.left-inset.right)/height);let distance=.6;
    for(let i=0;i<points.length;i+=3){const depth=points[i+2]-middle[2];distance=Math.max(distance,depth+Math.abs(points[i+1]-middle[1])/vertical,depth+Math.abs(points[i]-middle[0])/horizontal);}
    this.frame={box,padding};this.controls.maxDistance=Math.max(7,distance*padding*1.3);this.controls.target.copy(center);this.camera.position.copy(center).addScaledVector(direction,distance*padding);this.controls.update();this.dirty=true;
  }
  setView(view){
    const direction=view==='back'?new THREE.Vector3(-.08,.04,-1):view==='side'?new THREE.Vector3(1,.04,.03):new THREE.Vector3(.08,.04,1);
    this.fitBounds(movementView(this.mode)?this.movementBounds:this.frame?.box||this.coachRestBounds,direction,movementView(this.mode)?1.12:1.2);
  }
  resetView(){
    // One envelope and target for every saved step and playback frame.
    // The envelope is a 3D box, whose projected corners overshoot the real silhouette by ~40-90 %
    // (measured over the whole loop: phone 247/366 px wide, desktop 403/780 px). These paddings keep
    // every frame inside the free canvas while letting the athlete fill the stage.
    if(movementView(this.mode))this.fitBounds(this.movementBounds,STANDARD_VIEW,this.container.clientWidth<=600?.74:.7);
    else if(this.layer==='reveal'){if(this.selectedPart&&!this.selectedPart.hotspot){const mesh=this.parts.find(m=>m.userData.part.id===this.selectedPart.id);if(mesh)this.fitBounds(mesh.geometry.boundingBox);}else this.fitGroup();}
    else if(this.coachRestBounds)this.fitBounds(this.coachRestBounds,new THREE.Vector3(.58,.04,1),1.18);
    else{this.controls.target.set(0,.85,0);this.camera.position.set(2,.95,3.6);this.controls.update();this.dirty=true;}
  }
  setMode(mode){
    const prior=this.mode;this.mode=mode;this.selectedPart=null;this.selectedMesh.visible=false;this.hoverMesh.visible=false;
    this.stageGrid.material.opacity=mode==='motion' ? 0 : .22;this.stageGrid.visible=mode!=='motion';if(this.stageRing)this.stageRing.visible=mode!=='motion';
    this.poseEditor?.setEnabled(mode==='pose');
    if(mode==='motion'){this.trajectoryGuide?.setVisible(false);this.movementGuide?.setVisible({enabled:false});}
    this.pacing=null;
    if(mode==='motion')this.motion?.update(this.time);
    else if(mode==='pose'){this.playing=false;this.layer='skin';this.focused=false;this.motion?.enterManualMode();this.poseEditor?.refresh();}
    else{this.playing=false;this.motion?.reset();if(prior==='motion'||prior==='pose'){this.layer='skin';this.focused=false;}}
    this.applyAppearance();if(prior!==mode&&!(movementView(prior)&&movementView(mode)))this.resetView();this.dirty=true;
  }
  setSequence(sequence,{preserveView=false}={}){
    if(!this.motion)return;
    const current=this.motion.capturePose(),currentMode=this.motion.getMetrics().mode;
    this.motion.setSequence(sequence.steps,{period:sequence.period,corrections:sequence.corrections||[],legPath:sequence.legPath,interpolation:sequence.interpolation,motionModel:sequence.motionModel,skippedSteps:sequence.skippedSteps||[],footCurves:sequence.footCurves||[],segmentGuides:sequence.segmentGuides||[]});
    this.pacing=null;
    const bounds=new THREE.Box3();
    try{
      const samples=sequence.motionModel==='periodic'?96:sequence.steps.length*2;
      for(let i=0;i<samples;i++){
        this.motion.update(i*sequence.period/samples);
        const frame=this.motion.getMetrics().bounds;
        bounds.union(new THREE.Box3(new THREE.Vector3().fromArray(frame.min),new THREE.Vector3().fromArray(frame.max)));
      }
      for(const point of sequence.corrections||[]){
        this.motion.update((point.segment+point.at)*sequence.period/sequence.steps.length);
        const frame=this.motion.getMetrics().bounds;
        bounds.union(new THREE.Box3(new THREE.Vector3().fromArray(frame.min),new THREE.Vector3().fromArray(frame.max)));
      }
    }finally{
      if(currentMode==='standing')this.motion.reset();
      else if(this.mode==='motion')this.motion.update(this.time);
      else this.motion.applyPose(current);
    }
    this.motionBounds=bounds.expandByScalar(this.rigData.height*.045);
    this.movementBounds=this.motionBounds.clone();
    this.poseEditor?.refresh();this.dirty=true;
    if(movementView(this.mode)&&!preserveView)this.resetView();
  }
  setTime(time){
    const value=Number(time);if(!Number.isFinite(value))return;
    this.time=Math.max(0,Math.min(this.motion?.getMetrics().period||9,value));
    if(this.mode==='motion'){
      this.motion?.update(this.time);
    }
    this.callbacks.onTime?.(this.time);this.dirty=true;
  }
  setPlaybackRange(range){
    if(range&&(!Number.isFinite(range.startTime)||!Number.isFinite(range.endTime)||range.startTime<0||range.endTime<=range.startTime||range.endTime>this.motion.getMetrics().period))throw new Error('讲解区间需要位于当前保存动画内。');
    this.playbackRange=range?{startTime:range.startTime,endTime:range.endTime}:null;
  }
  projectMovementPoint(position){
    if(!position)return null;const p=this.coach.localToWorld(new THREE.Vector3().fromArray(position)).project(this.camera);
    return{x:(p.x+1)/2*this.container.clientWidth,y:(1-p.y)/2*this.container.clientHeight,visible:p.z>=-1&&p.z<=1};
  }
  async capture(){
    this.controls.update();const editing=this.mode==='pose',editorEnabled=this.poseEditor.getState().enabled,insets={...this.framingInsets},position=this.camera.position.clone(),target=this.controls.target.clone();
    try{
      if(editing)this.poseEditor.setEnabled(false);
      this.setFramingInsets({left:30,right:30,top:30,bottom:30});
      this.renderer.setClearAlpha(1);this.renderer.render(this.scene,this.camera);
      return await new Promise(resolve=>this.renderer.domElement.toBlob(resolve,'image/png'));
    }finally{
      this.setFramingInsets(insets);this.camera.position.copy(position);this.controls.target.copy(target);this.controls.update();
      this.renderer.setClearAlpha(0);if(editing)this.poseEditor.setEnabled(editorEnabled);this.dirty=true;
    }
  }
  setTrajectoryData(data){this.trajectoryGuide.setData(data);this.trajectoryData=data?structuredClone(data):null;this.dirty=true;}
  setTrajectoryVisible(options){this.trajectoryGuide.setVisible(options);this.dirty=true;}
  setTrajectoryProgress(time,joints){this.trajectoryGuide.setProgress(time,joints);this.dirty=true;}
  clearTrajectory(){this.trajectoryGuide.clear();this.trajectoryData=null;this.dirty=true;}
  getTrajectoryData(){return this.trajectoryData?structuredClone(this.trajectoryData):null;}
  pickTrajectoryPoint(event,options={}){const rect=this.renderer.domElement.getBoundingClientRect();return this.trajectoryGuide.pickSample({camera:this.camera,x:event.clientX-rect.left,y:event.clientY-rect.top,width:rect.width,height:rect.height,...options});}
  projectTrajectoryPoint(joint,time){const frames=this.trajectoryData?.frames;if(!frames?.length)return null;const frame=frames.reduce((nearest,value)=>Math.abs(value.time-time)<Math.abs(nearest.time-time)?value:nearest);if(!frame.joints[joint])return null;const p=new THREE.Vector3().fromArray(frame.joints[joint]).project(this.camera);return{x:(p.x+1)/2*this.container.clientWidth,y:(1-p.y)/2*this.container.clientHeight,time:frame.time,joint};}
  getStatus(){return{ready:!!this.motion,mode:this.mode,layer:this.layer,selectedGroup:this.selectedGroup,selectedPart:this.selectedPart?.id||null,focused:this.focused,time:this.time,playing:this.playing,character:'Snow Rig',coachVisible:!!this.coach?.visible,anatomyVisible:this.anatomy.visible,parts:this.parts.length,triangles:this.manifest?.triangles,drawCalls:this.renderer.info.render.calls,camera:this.camera.position.toArray(),target:this.controls.target.toArray(),framingInsets:{...this.framingInsets},groupCounts:Object.fromEntries(Object.entries(this.groupIds||{}).map(([id,ids])=>[id,ids.size])),trajectory:this.trajectoryGuide.getStatus(),motion:this.motion?.getMetrics()};}
  projectPart(id){const mesh=this.parts.find(m=>m.userData.part.id===id);if(!mesh)return null;const center=mesh.geometry.boundingBox.getCenter(new THREE.Vector3()).project(this.camera);return{x:(center.x+1)/2*this.container.clientWidth,y:(1-center.y)/2*this.container.clientHeight,name:mesh.userData.part.name,hotspot:mesh.userData.part.hotspot};}
  coachBounds(){
    const box=new THREE.Box3();if(!this.coach)return box;
    this.coach.updateMatrixWorld(true);
    this.coach.traverse(mesh=>{if(!mesh.isMesh)return;if(mesh.isSkinnedMesh){mesh.skeleton.update();mesh.computeBoundingBox();box.union(mesh.boundingBox.clone().applyMatrix4(mesh.matrixWorld));}else{mesh.geometry.computeBoundingBox();box.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));}});
    return box;
  }
  projectCoach(){
    if(!this.coach)return null;
    const box=new THREE.Box3(),point=new THREE.Vector3(),projected=new THREE.Vector3(),min=[Infinity,Infinity],max=[-Infinity,-Infinity];this.coach.updateMatrixWorld(true);this.camera.updateMatrixWorld();
    this.coach.traverse(mesh=>{if(!mesh.isMesh||!mesh.geometry.attributes.position)return;mesh.skeleton?.update();for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);box.expandByPoint(point);projected.copy(point).project(this.camera);min[0]=Math.min(min[0],projected.x);min[1]=Math.min(min[1],projected.y);max[0]=Math.max(max[0],projected.x);max[1]=Math.max(max[1],projected.y);}});
    return box.isEmpty()?null:{min,max,bounds:[box.min.toArray(),box.max.toArray()]};
  }
  projectHandle(id){const state=this.poseEditor?.getState();const handle=(state?.enabled?state.handles:this.motion?.getEditableHandles())?.find(h=>h.id===id);if(!handle)return null;const p=this.motion.group.localToWorld(new THREE.Vector3().fromArray(handle.position)).project(this.camera);return{x:(p.x+1)/2*this.container.clientWidth,y:(1-p.y)/2*this.container.clientHeight};}
}
