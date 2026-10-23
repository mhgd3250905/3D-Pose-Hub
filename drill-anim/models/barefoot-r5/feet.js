// Independent complete barefoot R5. All source/default geometry remains preserved.
(function(){'use strict';const T=()=>window.__toonT,E=window.__drill,F=window.__barefootR4;const unb64=(s,C)=>{const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return new C(a.buffer)};
function buildPiece(data, meshName, torsoPaint) {
  const t = T(), v = flareInspector.viewer, get = nm => { const o = v.coach.getObjectByName(nm); if (!o) throw new Error('v2plus ' + meshName + ': no mesh ' + nm); return o; };
  // skinned like (bound to the skeleton of) the tee by default; the hands piece names Coach_Body (the finger bones live only there)
  const tee = get(data.skin || 'Mesh005'), n = data.n, skinPaint = !!data.paint.skin;
  // the profile always runs training-collar: read seam weights in that state
  const collar0 = window.__trainingCollarReport?.enabled === true; if (window.__setTrainingCollar && !collar0) window.__setTrainingCollar(true);
  v.motion.reset(); v.coach.updateMatrixWorld(true); v.coach.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
  const Pq = unb64(data.pos.f32, Float32Array), N8 = unb64(data.nrm.f32, Float32Array), I16 = unb64(data.index.u16, Uint16Array), J8 = unb64(data.joints.u8, Uint8Array), W8 = unb64(data.weights.f32, Float32Array);
  const names = tee.skeleton.bones.map(b => b.name), bi = Object.fromEntries(names.map((nm, i) => [nm, i]));
  const world = new Float32Array(n * 3), nw = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { for (let c = 0; c < 3; c++) { world[i * 3 + c] = Pq[i * 3 + c]; nw[i * 3 + c] = N8[i * 3 + c]; }
    for (let k = 0; k < 4; k++) { const nm = data.bones[J8[i * 4 + k]], j = bi[nm]; if (j === undefined) throw new Error('v2plus torso: bone ' + nm); si[i * 4 + k] = j; sw[i * 4 + k] = W8[i * 4 + k]; } }
  // seams: exact live rest position, weights and normal of the welded vertex (tee collar band / Coach_Body arm + leg skin)
  const q = new t.Vector3(), nn = new t.Vector3(); let seamN = 0;
  data.seam.vid.forEach((vid, s) => { const o = get(data.seam.mesh[s]), g = o.geometry, i = data.seam.first + s, ob = o.skeleton.bones;
    o.getVertexPosition(vid, q); q.applyMatrix4(o.matrixWorld); world.set([q.x, q.y, q.z], i * 3);
    // rest normal = the authored normal through the welded vertex's own skinning at reset (Coach_Body's arms are bound in another pose)
    const S0 = new t.Matrix4(), B0 = new t.Matrix4(), e0 = S0.elements.fill(0), bm0 = o.skeleton.boneMatrices;
    for (let k = 0; k < 4; k++) { const w = g.attributes.skinWeight.getComponent(vid, k); if (!w) continue; B0.fromArray(bm0, g.attributes.skinIndex.getComponent(vid, k) * 16); for (let c = 0; c < 16; c++) e0[c] += w * B0.elements[c]; }
    S0.premultiply(o.bindMatrixInverse).premultiply(o.matrixWorld).multiply(o.bindMatrix);
    // (data.seam.ownNormals: the file carries a rest normal shared by both welded pieces — the hands' wrist weld, M8)
    if (!data.seam.ownNormals) { nn.fromBufferAttribute(g.attributes.normal, vid).applyMatrix3(new t.Matrix3().getNormalMatrix(S0)).normalize(); nw.set([nn.x, nn.y, nn.z], i * 3); }
    for (let k = 0; k < 4; k++) { const j = bi[ob[g.attributes.skinIndex.getComponent(vid, k)].name]; si[i * 4 + k] = j ?? 0; sw[i * 4 + k] = g.attributes.skinWeight.getComponent(vid, k); } seamN++; });
  // bind space: p' = (tee skinning matrix at reset)^-1 * rest world (same solve as the compression outfit)
  const bm = tee.skeleton.boneMatrices, S = new t.Matrix4(), B = new t.Matrix4(), Mx = new t.Matrix4(), Mi = new t.Matrix4(), N3 = new t.Matrix3();
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const e = S.elements.fill(0);
    for (let k = 0; k < 4; k++) { const w = sw[i * 4 + k]; if (!w) continue; B.fromArray(bm, si[i * 4 + k] * 16); for (let c = 0; c < 16; c++) e[c] += w * B.elements[c]; }
    Mx.copy(tee.matrixWorld).multiply(tee.bindMatrixInverse).multiply(S).multiply(tee.bindMatrix); Mi.copy(Mx).invert();
    q.set(world[i * 3], world[i * 3 + 1], world[i * 3 + 2]).applyMatrix4(Mi); pos.set([q.x, q.y, q.z], i * 3);
    N3.setFromMatrix4(Mx).transpose(); nn.set(nw[i * 3], nw[i * 3 + 1], nw[i * 3 + 2]).applyMatrix3(N3).normalize(); nor.set([nn.x, nn.y, nn.z], i * 3); }
  if (window.__setTrainingCollar && !collar0) window.__setTrainingCollar(false);
  const geo = new t.BufferGeometry(); geo.setAttribute('position', new t.BufferAttribute(pos, 3)); geo.setAttribute('normal', new t.BufferAttribute(nor, 3));
  geo.setAttribute('skinIndex', new t.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new t.BufferAttribute(sw, 4)); geo.setIndex(new t.BufferAttribute(I16, 1));
  // per-vertex textures read by gl_VertexID (tone weights, rest position, muscle-map/sink, v2plus rest + arm weight)
  const H = Math.ceil(n / 1024), tex = () => new Float32Array(1024 * H * 4), vt = tex(), vr = tex(), mm = tex(), rp = tex(), wy = data.paint.waistY;
  for (let i = 0; i < n; i++) { const x = world[i * 3], y = world[i * 3 + 1], z = world[i * 3 + 2]; let arm = 0;
    for (let k = 0; k < 4; k++) if (/UpperArm|Forearm|Hand|^v2p_/.test(names[si[i * 4 + k]])) arm += sw[i * 4 + k];
    vt.set(skinPaint ? [1, 0, 0, 0] : !torsoPaint ? (y > wy ? [1, 0, 0, 0] : [0, 0, 1, 0]) : y > wy ? [0, 1, 0, 0] : [0, 0, 1, 0], i * 4); vr.set([x, y, z, 1], i * 4); rp.set([x, y, z, arm], i * 4); }
  const dt = a => { const d = new t.DataTexture(a, 1024, H, t.RGBAFormat, t.FloatType); d.magFilter = d.minFilter = t.NearestFilter; d.needsUpdate = true; return d; };
  const TX = { uVT: dt(vt), uVR: dt(vr), uMMT: dt(mm), uV2pT: dt(rp) };
  const base = tee.material, mat = base.clone(), ob = base.onBeforeCompile;
  mat.onBeforeCompile = function(sh, r) { ob.call(this, sh, r); for (const k in TX) sh.uniforms[k] = { value: TX[k] }; sh.uniforms.uV2pTorso = { value: torsoPaint ? 1 : 0 }; sh.uniforms.uV2pLimb = { value: meshName === 'V2P_Base_Limbs' ? 1 : 0 }; };
  mat.customProgramCacheKey = base.customProgramCacheKey; mat.side = t.FrontSide;
  const mesh = new t.SkinnedMesh(geo, mat); mesh.name = meshName; mesh.frustumCulled = false; mesh.castShadow = mesh.receiveShadow = false;
  tee.parent.add(mesh); mesh.position.copy(tee.position); mesh.quaternion.copy(tee.quaternion); mesh.scale.copy(tee.scale); mesh.updateMatrixWorld(true);
  mesh.bind(tee.skeleton, tee.bindMatrix); mesh.visible = false;
  // what torso mode hides: filtered index buffers (tee below the collar band, Coach_Body arm faces above the weld ring), draw range 0 for trim + shorts
  const filt = (o, keep) => { const a = o.geometry.index.array, out = []; keep.forEach(f => out.push(a[f * 3], a[f * 3 + 1], a[f * 3 + 2])); return new t.BufferAttribute(new (o.geometry.index.array.constructor)(out), 1); };
  const swaps = [];
  for (const nm in data.keepFaces) { const o = get(nm); swaps.push({ g: o.geometry, idx0: o.geometry.index, idx1: filt(o, data.keepFaces[nm]) }); }
  for (const nm in data.hideFaces) { const o = get(nm), nf = o.geometry.index.count / 3, h = new Set(data.hideFaces[nm]), keep = []; for (let f = 0; f < nf; f++) if (!h.has(f)) keep.push(f);
    swaps.push({ g: o.geometry, idx0: o.geometry.index, idx1: filt(o, keep) }); }
  const hidden = data.hideMeshes.map(nm => { const g = get(nm).geometry; return { g, dr: { start: g.drawRange.start, count: g.drawRange.count } }; });
  return { mesh, swaps, hidden, seamN, world, on: false, report: { verts: n, faces: I16.length / 3, seam: seamN, hidden: data.hideMeshes, keep: Object.fromEntries(Object.entries(data.keepFaces).map(([k, f]) => [k, f.length])), hide: Object.fromEntries(Object.entries(data.hideFaces).map(([k, f]) => [k, f.length])) } };
}
const C=window.__barefootR5={profile:'training-human-v2plus-barefoot-bridge',version:'1.0.0-r5.2',on:false,last:null};const base=s=>({...s,modelProfile:F.profile,barefoot:{...s.barefoot,version:F.version}});const select0=E.selectModelProfile.bind(E),pose0=E.pose.bind(E);
function matrices(mesh,i){const t=T(),g=mesh.geometry,S=new t.Matrix4();S.elements.fill(0);for(let k=0;k<4;k++){const w=g.attributes.skinWeight.getComponent(i,k),j=g.attributes.skinIndex.getComponent(i,k);if(!w)continue;for(let c=0;c<16;c++)S.elements[c]+=w*mesh.skeleton.boneMatrices[j*16+c];}const K=mesh.bindMatrixInverse.clone().multiply(S).multiply(mesh.bindMatrix),M=mesh.matrixWorld.clone().multiply(K),G=new t.Matrix3().getNormalMatrix(mesh.matrixWorld).multiply(new t.Matrix3().setFromMatrix4(K));if(Math.abs(M.determinant())<1e-10||Math.abs(G.determinant())<1e-10)throw Error('Singular barefoot map');return{M,Mi:M.clone().invert(),Gi:G.invert()};}
C.load=function(data,recipe,delta,limbmeta){const t=T(),v=flareInspector.viewer;C.recipe=recipe;C.data=data;C.source=F.piece.mesh;C.sourceOriginal=C.source.geometry;C.sourceClone=C.sourceOriginal.clone();C.source.geometry=C.sourceClone;C.piece=buildPiece(data,'V2P_Barefoot_R5',false);v.motion.reset();v.coach.updateMatrixWorld(true);C.source.skeleton.update();C.bones=Object.fromEntries(C.source.skeleton.bones.map(b=>[b.name,b]));C.rest={};for(const side of ['left','right'])C.rest[side]={foot:C.bones[side+'Foot'].getWorldQuaternion(new t.Quaternion()),shin:C.bones[side+'Shin'].getWorldQuaternion(new t.Quaternion())};const DP=unb64(delta.deltaF32,Float32Array);for(let i=0;i<delta.sourceVertices;i++){const d=new t.Vector3().fromArray(DP,i*3);if(!d.lengthSq())continue;const K=matrices(C.source,i),x=new t.Vector3().fromBufferAttribute(C.sourceClone.attributes.position,i).applyMatrix4(K.M).add(d).applyMatrix4(K.Mi);C.sourceClone.attributes.position.setXYZ(i,x.x,x.y,x.z);}C.sourceClone.attributes.position.needsUpdate=true;
 C.limb=__v2p.limbs.mesh;C.limbN0=C.limb.geometry.attributes.normal.array.slice();C.seams=[];const keys=new Map();limbmeta.seam.vid.forEach((v,i)=>keys.set(limbmeta.seam.mesh[i]+':'+v,limbmeta.seam.first+i));data.seam.vid.forEach((v,i)=>{const l=keys.get(data.seam.mesh[i]+':'+v);if(l===undefined)throw Error('Missing live ankle owner');C.seams.push([data.seam.first+i,l]);});
 C.cloud={left:[],right:[]};const ng=C.piece.mesh.geometry;for(let i=0;i<data.n;i++){let side=null,total=0;for(let k=0;k<4;k++){const w=ng.attributes.skinWeight.getComponent(i,k);if(!w)continue;const name=C.piece.mesh.skeleton.bones[ng.attributes.skinIndex.getComponent(i,k)].name;if(name==='leftFoot'||name==='rightFoot'){side=name.slice(0,-4);total+=w;}}if(total>1-1e-6&&side)C.cloud[side].push(new t.Vector3().fromArray(C.piece.world,i*3).sub(new t.Vector3(...E.R[side+'Ankle'])));}C.source.geometry=C.sourceOriginal;return{vertices:data.n,faces:ng.index.count/3,sourceCloned:true,seams:C.seams.length};};
function off(){if(!C.piece)return;C.piece.mesh.visible=false;C.source.geometry=C.sourceOriginal;if(C.on){const na=C.limb.geometry.attributes.normal;C.seams.forEach(([i,j],k)=>na.setXYZ(j,...C.limbRestore[k]));na.needsUpdate=true;}C.on=false;C.last=null;}
function on(){const na=C.limb.geometry.attributes.normal;C.limbRestore=C.seams.map(([i,j])=>[na.getX(j),na.getY(j),na.getZ(j)]);C.source.geometry=C.sourceClone;C.source.visible=false;C.piece.mesh.visible=true;E.footPts=C.cloud;C.on=true;}
E.selectModelProfile=function(s){off();const active=s.modelProfile===C.profile;const r=select0(active?base(s):s);if(active){if(s.barefoot?.version!==C.version||s.v2plus?.skin!=='realistic')throw Error('Explicit isolated barefoot R5 required');on();}return r;};
function update(){const t=T(),v=flareInspector.viewer,mesh=C.piece.mesh,g=mesh.geometry;v.coach.updateMatrixWorld(true);C.source.skeleton.update();mesh.skeleton.update();const src=Array.from({length:C.source.geometry.attributes.position.count},(_,i)=>{const p=new t.Vector3();C.source.getVertexPosition(i,p);return p.applyMatrix4(C.source.matrixWorld);});const modes={};for(const side of ['left','right']){const df=C.bones[side+'Foot'].getWorldQuaternion(new t.Quaternion()).multiply(C.rest[side].foot.clone().invert()),ds=C.bones[side+'Shin'].getWorldQuaternion(new t.Quaternion()).multiply(C.rest[side].shin.clone().invert()),rel=ds.clone().invert().multiply(df),ang=2*Math.acos(Math.min(1,Math.abs(rel.w))),alpha=Math.min(1,Math.max(0,ang/C.recipe.referenceAngles[side]));modes[side]={alpha,posterior:new t.Vector3(0,0,-1).applyQuaternion(df)};}
 const cache=new Map(),maps=[],world=[];for(let i=0;i<C.data.n;i++){const rec=C.recipe.records[i],p=new t.Vector3();for(const[j,w]of rec.recipe)p.addScaledVector(src[j],w);p.addScaledVector(modes[rec.side].posterior,rec.bumpM*(1-modes[rec.side].alpha));world.push(p);let key='';for(let k=0;k<4;k++)key+=g.attributes.skinIndex.getComponent(i,k)+':'+g.attributes.skinWeight.getComponent(i,k)+';';if(!cache.has(key))cache.set(key,matrices(mesh,i));const K=cache.get(key);maps.push(K);const q=p.clone().applyMatrix4(K.Mi);g.attributes.position.setXYZ(i,q.x,q.y,q.z);}
 const normals=world.map(()=>new t.Vector3()),ix=g.index.array;for(let k=0;k<ix.length;k+=3){const[a,b,c]=[ix[k],ix[k+1],ix[k+2]],n=world[b].clone().sub(world[a]).cross(world[c].clone().sub(world[a]));normals[a].add(n);normals[b].add(n);normals[c].add(n);}
 const lg=C.limb.geometry,li=lg.index.array,needed=new Set(C.seams.map(x=>x[1])),lw=new Map(),ln=new Map();const lp=i=>{if(!lw.has(i)){const p=new t.Vector3();C.limb.getVertexPosition(i,p);lw.set(i,p.applyMatrix4(C.limb.matrixWorld));}return lw.get(i)};for(let k=0;k<li.length;k+=3){const ids=[li[k],li[k+1],li[k+2]];if(!ids.some(i=>needed.has(i)))continue;const n=lp(ids[1]).clone().sub(lp(ids[0])).cross(lp(ids[2]).clone().sub(lp(ids[0])));for(const i of ids)if(needed.has(i)){if(!ln.has(i))ln.set(i,new t.Vector3());ln.get(i).add(n);}}
 let seamGap=0;for(const[i,j]of C.seams){seamGap=Math.max(seamGap,world[i].distanceTo(lp(j)));const n=normals[i].clone().add(ln.get(j)||new t.Vector3()).normalize();normals[i].copy(n);const bind=n.clone().applyMatrix3(matrices(C.limb,j).Gi).normalize();lg.attributes.normal.setXYZ(j,bind.x,bind.y,bind.z);}
 let zeroNormal=0;for(let i=0;i<C.data.n;i++){if(normals[i].lengthSq()<1e-24)zeroNormal++;const n=normals[i].normalize().applyMatrix3(maps[i].Gi).normalize();g.attributes.normal.setXYZ(i,n.x,n.y,n.z);}g.attributes.position.needsUpdate=true;g.attributes.normal.needsUpdate=true;lg.attributes.normal.needsUpdate=true;g.computeBoundingSphere();C.last={alpha:Object.fromEntries(Object.entries(modes).map(([s,m])=>[s,m.alpha])),seamGapMm:seamGap*1000,zeroNormal,vertices:C.data.n,sourceCloned:true};}
E.pose=function(s,p,w){off();const active=s.modelProfile===C.profile;const r=pose0(active?base(s):s,p,w);if(active){on();update();}return r;};C.restore=off;
})();
