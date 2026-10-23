// Independent opt-in complete barefoot layer. Original production source untouched.
(function(){'use strict';const T=()=>window.__toonT,V2P=window.__v2p,E=window.__drill;
const unb64=(s,C)=>{const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return new C(a.buffer);};
const F=window.__barefootR4={profile:'training-human-v2plus-barefoot',version:'1.0.0-r4.1',on:false,piece:null};
function buildPiece(data, meshName, torsoPaint) {
  const t = T(), v = flareInspector.viewer, get = nm => { const o = v.coach.getObjectByName(nm); if (!o) throw new Error('v2plus ' + meshName + ': no mesh ' + nm); return o; };
  // skinned like (bound to the skeleton of) the tee by default; the hands piece names Coach_Body (the finger bones live only there)
  const tee = get(data.skin || 'Mesh005'), n = data.n, skinPaint = !!data.paint.skin;
  // the profile always runs training-collar: read seam weights in that state
  const collar0 = window.__trainingCollarReport?.enabled === true; if (window.__setTrainingCollar && !collar0) window.__setTrainingCollar(true);
  v.motion.reset(); v.coach.updateMatrixWorld(true); v.coach.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
  const Pq = unb64(data.pos.u16, Uint16Array), N8 = unb64(data.nrm.i8, Int8Array), I16 = unb64(data.index.u16, Uint16Array), J8 = unb64(data.joints.u8, Uint8Array), W8 = unb64(data.weights.u8, Uint8Array);
  const names = tee.skeleton.bones.map(b => b.name), bi = Object.fromEntries(names.map((nm, i) => [nm, i]));
  const world = new Float32Array(n * 3), nw = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { for (let c = 0; c < 3; c++) { world[i * 3 + c] = data.pos.lo[c] + Pq[i * 3 + c] * data.pos.scale[c]; nw[i * 3 + c] = N8[i * 3 + c] / 127; }
    for (let k = 0; k < 4; k++) { const nm = data.bones[J8[i * 4 + k]], j = bi[nm]; if (j === undefined) throw new Error('v2plus torso: bone ' + nm); si[i * 4 + k] = j; sw[i * 4 + k] = W8[i * 4 + k] / 255; } }
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

F.load=function(data){
 if(F.piece)throw Error('barefoot already loaded');if(data.version!==1)throw Error('barefoot asset version mismatch');
 F.data=data;F.piece=buildPiece(data,'V2P_Barefoot_R4',false);const v=flareInspector.viewer,t=T();E.init();
 // engine footPose uses a WORLD-rest delta quaternion, not the authored Foot quaternion. Match original E.footPts: loaded rest world point minus reset ankle.
 F.oldCloud=E.footPts;F.newCloud={left:[],right:[]};
 for(const side of ['left','right'])for(const i of data.footCloud[side].idx){const p=new t.Vector3().fromArray(F.piece.world,i*3).sub(new t.Vector3(...E.R[side+'Ankle']));F.newCloud[side].push(p);}
 F.hideKeys=new Set(data.hideFootFaces.Coach_Body);F.body=v.coach.getObjectByName('Coach_Body');
 F.shoes=['Coach_Sneakers','Coach_Soles','Coach_Shoe_Details'].map(n=>{const o=v.coach.getObjectByName(n);if(!o)throw Error('missing shoe '+n);return o;});
 // Convert shared rest-world ankle normals into the existing limbs mesh bind space.
 const L=V2P.limbs.mesh,g=L.geometry,N=unb64(data.limbsNrm.i8,Int8Array),idx=data.limbsNrm.idx,na=g.attributes.normal;
 v.motion.reset();v.coach.updateMatrixWorld(true);L.skeleton.update();const S=new t.Matrix4(),B=new t.Matrix4(),M=new t.Matrix4(),N3=new t.Matrix3(),nn=new t.Vector3();const a0=[],a1=[];
 idx.forEach((i,k)=>{const e=S.elements.fill(0);for(let c=0;c<4;c++){const w=g.attributes.skinWeight.getComponent(i,c);if(!w)continue;B.fromArray(L.skeleton.boneMatrices,g.attributes.skinIndex.getComponent(i,c)*16);for(let q=0;q<16;q++)e[q]+=w*B.elements[q];}M.copy(L.matrixWorld).multiply(L.bindMatrixInverse).multiply(S).multiply(L.bindMatrix);N3.setFromMatrix4(M).transpose();nn.set(N[k*3]/127,N[k*3+1]/127,N[k*3+2]/127).applyMatrix3(N3).normalize();a1.push(nn.x,nn.y,nn.z);a0.push(na.getX(i),na.getY(i),na.getZ(i));});F.normals={idx,na,a0,a1};return F.piece.report;
};
F.set=function(on){if(F.on===on)return;const t=T(),g=F.body.geometry,N=F.normals;if(on){
 if(g.drawRange.start!==0||g.drawRange.count<g.index.count)throw Error("barefoot requires full active index range");
 F.restore={index:g.index,drawRange:{...g.drawRange},shoes:F.shoes.map(o=>o.visible),cloud:E.footPts};const a=g.index.array,b=[];
 for(let i=0;i<a.length;i+=3){const key=[a[i],a[i+1],a[i+2]].sort((x,y)=>x-y).join(':');if(!F.hideKeys.has(key))b.push(a[i],a[i+1],a[i+2]);}
 g.setIndex(new t.BufferAttribute(new a.constructor(b),1));g.setDrawRange(0,b.length);F.shoes.forEach(o=>o.visible=false);E.footPts=F.newCloud;
 }else{g.setIndex(F.restore.index);g.setDrawRange(F.restore.drawRange.start,F.restore.drawRange.count);F.shoes.forEach((o,i)=>o.visible=F.restore.shoes[i]);E.footPts=F.restore.cloud;}
 const a=on?N.a1:N.a0;N.idx.forEach((i,k)=>N.na.setXYZ(i,a[k*3],a[k*3+1],a[k*3+2]));N.na.needsUpdate=true;F.piece.mesh.visible=on;F.on=on;
};
const select0=E.selectModelProfile.bind(E);E.selectModelProfile=function(spec){if(F.on)F.set(false);if(spec.modelProfile===F.profile){if(spec.barefoot?.version!==F.version||spec.v2plus?.skin!=='realistic'||spec.v2plus?.torso!=='base'||spec.v2plus?.limbs!=='base')throw Error('explicit barefoot version and realistic required');const r=select0({...spec,modelProfile:'training-human-v2plus'});F.set(true);return r;}return select0(spec);};
})();
