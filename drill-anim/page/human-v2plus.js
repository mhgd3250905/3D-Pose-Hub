// training-human-v2plus (prototype, opt-in): the accepted training-human-v2 body EXACTLY (same GLB, head, neck fix, tee,
// shorts, shoes, solver, collar profile) plus
//   1. finger bones (3 per finger + thumb) grafted under each hand bone of Coach_Body; only the hand-bone share of hand
//      vertices is re-split among the fingers (drill-anim/models/training-human-v2plus-hands.json, tools/human-v2plus/build_hand.py).
//      Finger bones have identity rest rotation and an inverse bind copied from the hand, so at rest the skinning matrices are
//      the hand's: the rest mesh is the v2 mesh. Named hand poses: open, relaxed, palm-floor, grip-bar, band-grip.
//      In this profile the v7 relax morph and the P.bakeGrip vertex bake are not used (their data is still computed so props
//      land where they always did); fingers do the shaping instead.
//   2. designed muscle-group regions: each group is a hand-drawn shape (rounded polygons / bands) in a smooth chart on the
//      REST surface (torso cylinder, upper arm, forearm, thigh, shin), evaluated PER PIXEL from the interpolated rest position,
//      so borders are clean anti-aliased curves independent of mesh density, identical across skin, tee and shorts, and
//      mirrored left/right. BodyParts3D was only a placement reference.
// Nothing here edits a frozen v2 source: it wraps __drill.selectModelProfile / __drill.pose / __setRelax / __setHighlight /
// __props.bakeGrip at runtime and patches the toon materials' shader strings. Specs opt in with modelProfile:'training-human-v2plus';
// every other spec is passed through untouched (and the patch is idle: uV2pOn = 0 falls back to the v2 mask).
(function(){
const V2P = window.__v2p = { on: false, loaded: false, poses: {}, cur: { left: null, right: null } };
const T = () => window.__toonT;
const FN = ['thumb', 'index', 'middle', 'ring', 'pinky'];
const bname = (side, b) => 'v2p_' + side[0].toUpperCase() + '_' + b;

// ---------------- 1. finger rig ----------------
function graftFingers(meta) {
  const t = T(), v = flareInspector.viewer, m = v.motion; m.reset(); v.coach.updateMatrixWorld(true);
  const o = v.coach.getObjectByName('Coach_Body'); const g = o.geometry; const sk0 = o.skeleton;
  if (g.attributes.position.count !== meta.vertexCount) throw new Error('v2plus: Coach_Body vertex count ' + g.attributes.position.count + ' != ' + meta.vertexCount);
  const bones = sk0.bones.slice(), inv = sk0.boneInverses.map(x => x.clone()); const byName = {}; bones.forEach((b, i) => byName[b.name] = i);
  V2P.bones = {};
  for (const side of ['left', 'right']) {
    const hand = v.coach.getObjectByName(side + 'Hand'); const hi = byName[side + 'Hand'];
    const hp = hand.getWorldPosition(new t.Vector3()), hq = hand.getWorldQuaternion(new t.Quaternion());
    const skinM = new t.Matrix4().multiplyMatrices(hand.matrixWorld, inv[hi]);       // hand skinning matrix at reset
    const mir = side === 'right' ? -1 : 1;
    for (const f of FN) {
      const J = meta.fingers[f].joints; let parent = hand;
      for (let j = 0; j < 3; j++) {
        const nb = new t.Bone(); nb.name = bname(side, f + (j + 1));
        const wp = new t.Vector3(J[j][0] * mir, J[j][1], J[j][2]).applyQuaternion(hq).add(hp);
        parent.add(nb); parent.updateMatrixWorld(true); nb.position.copy(parent.worldToLocal(wp.clone()));
        // identity rotation relative to the hand frame (parents are identity too)
        nb.quaternion.identity(); nb.updateMatrixWorld(true);
        byName[nb.name] = bones.length; bones.push(nb);
        inv.push(new t.Matrix4().copy(nb.matrixWorld).invert().multiply(skinM));
        V2P.bones[nb.name] = nb; parent = nb;
      }
    }
  }
  const sk = new t.Skeleton(bones, inv); o.bind(sk, o.bindMatrix);
  // weights: only the listed hand vertices change; keep the originals to restore when the profile is off
  const si = g.attributes.skinIndex, sw = g.attributes.skinWeight; V2P.orig = { idx: [], si: [], sw: [] }; V2P.next = { si: [], sw: [] };
  for (const side of ['left', 'right']) { const W = meta.weights[side];
    W.idx.forEach((i, r) => { const os = [], ow = [], ns = [], nw = [];
      for (let k = 0; k < 4; k++) { os.push(si.getComponent(i, k)); ow.push(sw.getComponent(i, k)); }
      for (let k = 0; k < 4; k++) { const b = W.bones[r][k]; if (b === undefined) { ns.push(0); nw.push(0); continue; }
        const nm = b.startsWith(side[0] + '_') ? bname(side, b.slice(2)) : b; const bi = byName[nm]; if (bi === undefined) throw new Error('v2plus: bone ' + nm);
        ns.push(bi); nw.push(W.w[r][k] / 255); }
      V2P.orig.idx.push(i); V2P.orig.si.push(os); V2P.orig.sw.push(ow); V2P.next.si.push(ns); V2P.next.sw.push(nw); }); }
  V2P.mesh = o; V2P.poses = meta.poses;
  return { bones: bones.length, weighted: V2P.orig.idx.length };
}
function writeWeights(on) {
  const g = V2P.mesh.geometry, si = g.attributes.skinIndex, sw = g.attributes.skinWeight, src = on ? V2P.next : V2P.orig;
  V2P.orig.idx.forEach((i, r) => { for (let k = 0; k < 4; k++) { si.setComponent(i, k, src.si[r][k]); sw.setComponent(i, k, src.sw[r][k]); } });
  si.needsUpdate = true; sw.needsUpdate = true; if (si.isInterleavedBufferAttribute) si.data.needsUpdate = true; if (sw.isInterleavedBufferAttribute) sw.data.needsUpdate = true;
}
V2P.setHandPose = function(side, name, k = 1) {
  const P = V2P.poses[name] || V2P.poses.relaxed; const t = T(); const id = new t.Quaternion();
  for (const f of FN) for (let j = 1; j <= 3; j++) { const b = V2P.bones[bname(side, f + j)]; const q = P[f + j] || [0, 0, 0, 1];
    const qq = side === 'right' ? new t.Quaternion(q[0], -q[1], -q[2], q[3]) : new t.Quaternion(...q);
    b.quaternion.copy(id).slerp(qq, k); }
  V2P.cur[side] = name;
};
V2P.restHands = function() { for (const b of Object.values(V2P.bones || {})) b.quaternion.identity(); V2P.cur = { left: null, right: null }; };
V2P.pickHandPose = function(spec, side) {
  const o = spec.v2plus?.handPose?.[side]; if (o) return o;
  const D = window.__drill?.currentDescriptor; const H = D?.hands?.[side] || {}; const pl = H.plant || H; const w = H.w || 0;
  if (pl.mode === 'floor' && w < 0.5) return 'palm-floor';
  if ((spec.props || []).some(p => (p.type === 'gripHand' || p.type === 'grip') && (p.side || 'right') === side)) return 'grip-bar';
  if ((spec.props || []).some(p => /dHandle|landmine/.test(p.type) && (p.side || 'right') === side)) return 'grip-bar';
  if ((spec.props || []).some(p => /band/i.test(p.type))) return 'band-grip';
  return 'relaxed';
};

// ---------------- 2. designed muscle regions (GLSL) ----------------
// charts (rest pose, metres, x mirrored to |x|):
//   torso : s = 0.13 * atan(|x|, z - zc(y))  (0 front midline .. 0.408 back midline), y
//   uarm  : t along shoulder->elbow, a = 0.045 * angle (0 lateral, + front, - back, medial seam)
//   farm  : t along elbow->wrist,  a = 0.035 * angle (0 lateral, + front, - back)
//   thigh : t along hip->knee,     a = 0.075 * angle (0 medial, + front, - back, lateral seam = ITB)
//   shin  : t along knee->ankle,   a = 0.045 * angle (0 lateral, + front, - back)
// region SDF: < 0 inside (metres). Regions are drawn shapes, not anatomy-exact.
const GLSL = `
uniform float uV2pOn; uniform float uV2pSel[24]; uniform float uV2pSide; uniform float uV2pDeep; uniform float uV2pSleeve; uniform vec4 uV2pCuffL; uniform vec4 uV2pCuffR;
varying vec4 vV2p;
float v2sm(float a,float b,float k){ float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0); return mix(b,a,h)-k*h*(1.0-h); }   // smooth min
float v2sx(float a,float b,float k){ return -v2sm(-a,-b,k); }                                                       // smooth max
float v2box(vec2 p, vec2 lo, vec2 hi, float r){ vec2 c=(lo+hi)*0.5, h=(hi-lo)*0.5-r; vec2 q=abs(p-c)-h; return length(max(q,0.0))+min(max(q.x,q.y),0.0)-r; }
float v2ell(vec2 p, vec2 c, vec2 r){ vec2 q=(p-c)/r; float k=length(q); return (k-1.0)*min(r.x,r.y); }
float v2seg(vec2 p, vec2 a, vec2 b){ vec2 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h); }
// convex/concave polygon (up to 8 points), rounded by r (vertices are the shape before rounding)
float v2poly(vec2 p, vec2 v[8], int n, float r){ float d=dot(p-v[0],p-v[0]); float s=1.0;
  for(int i=0,j=n-1;i<8;j=i,i++){ if(i>=n) break; vec2 e=v[j]-v[i]; vec2 w=p-v[i]; vec2 b=w-e*clamp(dot(w,e)/dot(e,e),0.0,1.0); d=min(d,dot(b,b));
    bvec3 c=bvec3(p.y>=v[i].y,p.y<v[j].y,e.x*w.y>e.y*w.x); if(all(c)||all(not(c))) s*=-1.0; }
  return s*sqrt(d)-r; }
float v2zc(float y){ return mix(mix(0.012,0.026,smoothstep(0.80,0.90,y)), mix(0.052,0.028,smoothstep(1.16,1.34,y)), smoothstep(0.92,1.06,y)); }
vec2 v2torso(vec3 p){ return vec2(0.13*atan(p.x, p.z-v2zc(p.y)), p.y); }
vec3 v2limb(vec3 p, vec3 A, vec3 B, vec3 ref0, vec3 ref90, float R){ vec3 u=normalize(B-A); float t=dot(p-A,u); vec3 r=p-A-u*t;
  vec3 e0=normalize(ref0-u*dot(ref0,u)); vec3 e1=normalize(cross(u,e0)); if(dot(e1,ref90)<0.0) e1=-e1;
  return vec3(t, R*atan(dot(r,e1),dot(r,e0)), length(r)); }
vec3 v2uarm(vec3 p){ return v2limb(p, vec3(0.188,1.370,-0.004), vec3(0.234,1.118,0.011), vec3(1.0,0.0,0.0), vec3(0.0,0.0,1.0), 0.045); }
vec3 v2farm(vec3 p){ return v2limb(p, vec3(0.234,1.118,0.011), vec3(0.253,0.892,0.030), vec3(1.0,0.0,0.0), vec3(0.0,0.0,1.0), 0.035); }
vec3 v2thigh(vec3 p){ return v2limb(p, vec3(0.082,0.852,0.006), vec3(0.082,0.499,0.007), vec3(-1.0,0.0,0.0), vec3(0.0,0.0,1.0), 0.075); }
vec3 v2shin(vec3 p){ return v2limb(p, vec3(0.082,0.499,0.007), vec3(0.083,0.090,-0.019), vec3(1.0,0.0,0.0), vec3(0.0,0.0,1.0), 0.045); }
float v2region(int i, vec3 p, float arm){
  vec2 q=v2torso(p); float notArm=(arm-0.5)*0.08; float isArm=(0.5-arm)*0.08; vec2 P[8];
  if(i==0){ // chest: pec plate, curved lower border rising toward the armpit
    P[0]=vec2(0.016,1.200); P[1]=vec2(0.070,1.180); P[2]=vec2(0.128,1.215); P[3]=vec2(0.150,1.290); P[4]=vec2(0.142,1.335); P[5]=vec2(0.016,1.345);
    return max(v2poly(q,P,6,0.012),notArm); }
  if(i==1){ // abs: rectus column with a midline gap and two tendon grooves (six-pack blocks)
    float f=v2box(q,vec2(0.0045,0.885),vec2(0.086,1.180),0.020);
    f=max(f,0.0028-abs(q.y-1.040)); f=max(f,0.0028-abs(q.y-1.110));
    return max(f,notArm); }
  if(i==2){ // obliques: flank band, upper edge slanting down toward the back
    P[0]=vec2(0.112,0.900); P[1]=vec2(0.228,0.925); P[2]=vec2(0.232,1.040); P[3]=vec2(0.175,1.120); P[4]=vec2(0.112,1.165);
    return max(v2poly(q,P,5,0.012),notArm); }
  if(i==3){ // serratus: fingers on the side ribs under the armpit
    P[0]=vec2(0.150,1.165); P[1]=vec2(0.200,1.175); P[2]=vec2(0.200,1.255); P[3]=vec2(0.158,1.240);
    return max(v2poly(q,P,4,0.010),notArm); }
  if(i==4){ // lats: V wing from the low back to the armpit
    float b=0.408-q.x; vec2 r=vec2(b,q.y);
    P[0]=vec2(0.030,0.975); P[1]=vec2(0.110,1.010); P[2]=vec2(0.190,1.140); P[3]=vec2(0.205,1.255); P[4]=vec2(0.150,1.250); P[5]=vec2(0.070,1.165); P[6]=vec2(0.030,1.110);
    return max(v2poly(r,P,7,0.016),notArm); }
  if(i==5){ // scapular: mid/lower trapezius + rhomboids, a kite on the upper back
    float b=0.408-q.x; vec2 r=vec2(b,q.y);
    P[0]=vec2(0.006,1.085); P[1]=vec2(0.050,1.180); P[2]=vec2(0.105,1.300); P[3]=vec2(0.090,1.350); P[4]=vec2(0.006,1.360);
    return max(v2poly(r,P,5,0.012),notArm); }
  if(i==6){ // rotator cuff (infraspinatus): oval over the shoulder blade
    float b=0.408-q.x; return max(v2ell(vec2(b,q.y),vec2(0.128,1.270),vec2(0.042,0.038)),notArm); }
  if(i==7){ // erectors: two columns beside the spine
    float b=0.408-q.x; return max(v2box(vec2(b,q.y),vec2(0.010,0.860),vec2(0.048,1.150),0.016),notArm); }
  if(i==8){ // upper trapezius: neck-to-shoulder slope, back side
    float b=0.408-q.x; P[0]=vec2(0.006,1.360); P[1]=vec2(0.095,1.355); P[2]=vec2(0.175,1.390); P[3]=vec2(0.150,1.420); P[4]=vec2(0.040,1.450); P[5]=vec2(0.006,1.455);
    vec2 r=vec2(b,q.y); float f=v2poly(r,P,6,0.010); return max(f,notArm); }
  if(i==9){ // deltoid: cap over the shoulder, V to the arm
    vec3 a=v2uarm(p); vec2 r=vec2(a.y,a.x);
    P[0]=vec2(-0.105,-0.020); P[1]=vec2(-0.080,0.085); P[2]=vec2(0.000,0.145); P[3]=vec2(0.080,0.085); P[4]=vec2(0.105,-0.020); P[5]=vec2(0.000,-0.050);
    return max(max(v2poly(r,P,6,0.012), a.z-0.085), 0.115-p.x); }
  if(i==10){ // triceps: back of the upper arm
    vec3 a=v2uarm(p); return max(max(v2box(vec2(a.y,a.x),vec2(-0.118,0.095),vec2(-0.030,0.235),0.016), isArm), a.z-0.064); }
  if(i==11){ // biceps: front of the upper arm
    vec3 a=v2uarm(p); return max(max(v2box(vec2(a.y,a.x),vec2(0.030,0.110),vec2(0.112,0.230),0.016), isArm), a.z-0.064); }
  if(i==12){ // forearms: upper two thirds of the forearm, all round except the medial seam
    vec3 a=v2farm(p); return max(max(v2box(vec2(a.y,a.x),vec2(-0.090,0.020),vec2(0.090,0.150),0.016), isArm), a.z-0.055); }
  if(i==13){ // glute max: one rounded cushion per side
    float b=0.408-q.x; return max(v2box(vec2(b,q.y),vec2(0.008,0.705),vec2(0.128,0.895),0.045), 0.70-p.y); }
  if(i==14){ // glute med / hip abductors: upper outer hip, above the glute
    float b=0.408-q.x; return max(v2ell(vec2(b,q.y),vec2(0.190,0.900),vec2(0.060,0.050)), notArm); }
  if(i==15){ // hip flexors: a slanted oval along each hip crease (front of the hip)
    vec2 d=q-vec2(0.108,0.845); float c=cos(0.62), sn=sin(0.62); d=vec2(c*d.x+sn*d.y,-sn*d.x+c*d.y);
    return max(v2ell(d,vec2(0.0),vec2(0.027,0.070)), notArm); }
  if(i==16){ // quadriceps: front of the thigh, tapering to the knee (teardrop)
    vec3 a=v2thigh(p); vec2 r=vec2(a.y,a.x);
    P[0]=vec2(0.032,0.110); P[1]=vec2(0.150,0.065); P[2]=vec2(0.150,0.235); P[3]=vec2(0.110,0.318); P[4]=vec2(0.050,0.318); P[5]=vec2(0.024,0.220);
    return max(v2poly(r,P,6,0.016), a.z-0.105); }
  if(i==17){ // hamstrings: back of the thigh, tapering to the knee
    vec3 a=v2thigh(p); vec2 r=vec2(a.y,a.x);
    P[0]=vec2(-0.160,0.090); P[1]=vec2(-0.045,0.100); P[2]=vec2(-0.040,0.230); P[3]=vec2(-0.075,0.305); P[4]=vec2(-0.140,0.305); P[5]=vec2(-0.165,0.220);
    return max(v2poly(r,P,6,0.016), a.z-0.105); }
  if(i==18){ // adductors: inner thigh, a narrow wedge
    vec3 a=v2thigh(p); vec2 r=vec2(a.y,a.x);
    P[0]=vec2(-0.028,0.050); P[1]=vec2(0.016,0.050); P[2]=vec2(0.010,0.200); P[3]=vec2(-0.012,0.235);
    return max(v2poly(r,P,4,0.012), a.z-0.105); }
  if(i==19){ // calves: back of the shin, upper half
    vec3 a=v2shin(p); return v2box(vec2(a.y,a.x),vec2(-0.120,0.050),vec2(-0.015,0.240),0.018); }
  if(i==20){ // tibialis: front-outer shin
    vec3 a=v2shin(p); return v2box(vec2(a.y,a.x),vec2(0.010,0.050),vec2(0.065,0.300),0.012); }
  if(i==21){ // neck (front side strap)
    return max(v2box(q,vec2(0.012,1.380),vec2(0.060,1.470),0.014), notArm); }
  return 9.0; }
float v2pMask(out float core){
  vec3 p=vec3(abs(vV2p.x),vV2p.y,vV2p.z); float arm=vV2p.w; float f=9.0;
  for(int i=0;i<22;i++){ if(uV2pSel[i]<0.5) continue; f=min(f,v2region(i,p,arm)); }
  if(abs(uV2pSide)>0.5) f=max(f,-vV2p.x*uV2pSide);
  float a=max(fwidth(f),1e-5)*0.75; core=clamp(-f/0.035,0.0,1.0);
  return (1.0-smoothstep(-a,a,f))*mix(1.0,0.82,uV2pDeep); }
`;
V2P.REGIONS = ['chest', 'abs', 'obliques', 'serratus', 'lats', 'scapular', 'rotator-cuff', 'erectors', 'traps-upper', 'deltoids', 'triceps', 'biceps', 'forearms', 'glute-max', 'glute-med', 'hip-flexors', 'quadriceps', 'hamstrings', 'adductors', 'calves', 'tibialis', 'neck'];
// spec group id -> regions (the 20+ ids the specs and muscle-map use)
V2P.GROUPS = { chest: ['chest'], pectorals: ['chest'], abs: ['abs'], obliques: ['obliques'], serratus: ['serratus'], lats: ['lats'], scapular: ['scapular'],
  'rotator-cuff': ['rotator-cuff'], erectors: ['erectors'], traps: ['traps-upper', 'scapular'], deltoids: ['deltoids'], triceps: ['triceps'], biceps: ['biceps'],
  forearms: ['forearms'], 'glute-max': ['glute-max'], glutes: ['glute-max', 'glute-med'], 'hip-abductors': ['glute-med'], 'hip-rotators': ['glute-max'],
  'hip-flexors': ['hip-flexors'], quadriceps: ['quadriceps'], hamstrings: ['hamstrings'], adductors: ['adductors'], calves: ['calves'], tibialis: ['tibialis'], neck: ['neck'] };
V2P.DEEP = new Set(['rotator-cuff', 'hip-flexors', 'hip-rotators']);
V2P.uni = { uV2pOn: { value: 0 }, uV2pSel: { value: new Array(24).fill(0) }, uV2pSide: { value: 0 }, uV2pDeep: { value: 0 },
  uV2pSleeve: { value: 0 }, uV2pCuffL: { value: [0, -1, 0, -9] }, uV2pCuffR: { value: [0, -1, 0, -9] } };
function restTextures() {
  // CPU-skinned reset-pose world positions (one continuous canvas for skin, tee and shorts) + arm weight
  const t = T(), v = flareInspector.viewer; v.motion.reset(); v.coach.updateMatrixWorld(true); const q = new t.Vector3(); const out = {};
  v.coach.traverse(o => { if (!o.isSkinnedMesh) return; const g = o.geometry, n = g.attributes.position.count, H = Math.ceil(n / 1024); const buf = new Float32Array(1024 * H * 4);
    const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, bones = o.skeleton.bones;
    for (let i = 0; i < n; i++) { o.getVertexPosition(i, q); q.applyMatrix4(o.matrixWorld); let arm = 0;
      for (let k = 0; k < 4; k++) { const nm = bones[si.getComponent(i, k)]?.name || ''; if (/UpperArm|Forearm|Hand|^v2p_/.test(nm)) arm += sw.getComponent(i, k); }
      buf.set([q.x, q.y, q.z, arm], i * 4); }
    const tex = new t.DataTexture(buf, 1024, H, t.RGBAFormat, t.FloatType); tex.magFilter = tex.minFilter = t.NearestFilter; tex.needsUpdate = true; out[o.uuid] = tex; });
  return out;
}
function patchMaterials() {
  const tex = V2P.restTex = restTextures(); let n = 0; const v = flareInspector.viewer;
  v.coach.traverse(o => { if (!o.isSkinnedMesh || !o.material || o.material.customProgramCacheKey?.() !== 'toon-drill1') return; const mat = o.material, ob = mat.onBeforeCompile, tx = tex[o.uuid], isBody = o.name === 'Coach_Body';
    mat.onBeforeCompile = (sh, r) => { ob(sh, r); Object.assign(sh.uniforms, V2P.uni); sh.uniforms.uV2pT = { value: tx };
      sh.vertexShader = 'uniform sampler2D uV2pT;varying vec4 vV2p;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vV2p=texelFetch(uV2pT,ivec2(gl_VertexID%1024,gl_VertexID/1024),0);');
      const fs = sh.fragmentShader; if (!/hlMask\(c2\)/.test(fs)) throw new Error('v2plus: toon fragment shader has no hlMask(c2) call');
      if (isBody && fs.indexOf('vec3 alb=vec3(0.0)') < 0) throw new Error('v2plus: toon fragment shader has no albedo block');
      // compression outfit, short sleeve: the arm skin below the (shrink-wrapped) sleeve cuff shows the grey skin instead of
      // the painted v2 sleeve. Cut = the cuff ring's plane in the rest pose, 6 mm up under the cuff, anti-aliased.
      sh.fragmentShader = GLSL + fs.replace(/hlMask\(c2\)/, '(uV2pOn>0.5?v2pMask(c2):hlMask(c2))').replace('vec3 alb=vec3(0.0)', isBody ?
        'if(uV2pOn>0.5&&uV2pSleeve>0.5&&vV2p.w>0.3){ vec4 pl=vV2p.x>0.0?uV2pCuffL:uV2pCuffR; float fc=dot(vV2p.xyz,pl.xyz)-pl.w+0.006; float ac=max(fwidth(fc),1e-5)*0.9; W4=mix(W4,vec4(1.0,0.0,0.0,0.0),smoothstep(-ac,ac,fc)); }\n vec3 alb=vec3(0.0)' : 'vec3 alb=vec3(0.0)'); };
    mat.customProgramCacheKey = () => 'toon-drill1-v2p'; mat.needsUpdate = true; n++; });
  return n;
}
V2P.setHighlight = function(h) { const sel = new Array(24).fill(0); let n = 0, deep = 0;
  for (const gid of (h?.lobes ? [] : h?.groups || [])) { for (const r of V2P.GROUPS[gid] || []) { const i = V2P.REGIONS.indexOf(r); if (i >= 0) { sel[i] = 1; n++; } } if (V2P.DEEP.has(gid)) deep = 1; }
  V2P.uni.uV2pSel.value = sel; V2P.uni.uV2pSide.value = h?.side === 'left' ? 1 : h?.side === 'right' ? -1 : 0; V2P.uni.uV2pDeep.value = deep;
  // the toon shader only calls the mask when uSelN > 0
  if (V2P.on && window.__mmUni?.uSelN) window.__mmUni.uSelN.value = n ? 1 : 0; return n; };

// ---------------- 3. compression outfit (opt-in: spec.v2plus.outfit = 'compression') ----------------
// drill-anim/models/training-human-v2plus-outfit.json (tools/human-v2plus/build_outfit.py): the v2 tee, sleeve trim and shorts
// shrink-wrapped by smooth fields (no skin exists under them): rest-world displacements + normals per moved vertex, tee-hem skin
// weights copied from the shorts, sleeve-cuff planes. Applied in bind space: p' = (skinning matrix at reset)^-1 (rest world + d),
// so the reset pose shows exactly the built shape and every pose skins it with the v2 bones. Off = the original buffers, untouched.
const OUTFIT_MESHES = ['Mesh005', 'Mesh005_1', 'Coach_Training_Shorts'];
function prepOutfit(data) {
  const t = T(), v = flareInspector.viewer; v.motion.reset(); v.coach.updateMatrixWorld(true); const O = { meshes: [], data };
  v.coach.traverse(o => { if (!o.isSkinnedMesh || !OUTFIT_MESHES.includes(o.name)) return; const D = data.meshes[o.name]; if (!D) return;
    o.skeleton.update(); const g = o.geometry, pa = g.attributes.position, na = g.attributes.normal, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
    const names = o.skeleton.bones.map(b => b.name), bi = Object.fromEntries(names.map((n, i) => [n, i])), bm = o.skeleton.boneMatrices;
    const rec = { o, idx: D.idx, p0: [], n0: [], p1: [], n1: [], w: null, rest: [] };
    // new weights first (the bind-space solve must use the weights the vertex will be skinned with)
    const W = data.weights?.[o.name]; const wmap = new Map();
    if (W) { rec.w = { idx: W.idx, j0: [], w0: [], j1: [], w1: [] };
      W.idx.forEach((i, r) => { const j0 = [], w0 = [], j1 = [], w1 = [];
        for (let k = 0; k < 4; k++) { j0.push(si.getComponent(i, k)); w0.push(sw.getComponent(i, k)); }
        for (let k = 0; k < 4; k++) { const nm = W.bones[r][k]; if (nm === undefined) { j1.push(0); w1.push(0); continue; } if (bi[nm] === undefined) throw new Error('v2plus outfit: bone ' + nm);
          j1.push(bi[nm]); w1.push(W.w[r][k] / 255); }
        rec.w.j0.push(j0); rec.w.w0.push(w0); rec.w.j1.push(j1); rec.w.w1.push(w1); wmap.set(i, [j1, w1]); }); }
    const M = new t.Matrix4(), S = new t.Matrix4(), B = new t.Matrix4(), Minv = new t.Matrix4(), N3 = new t.Matrix3(), q = new t.Vector3(), n = new t.Vector3();
    const skinM = (i, jw) => { const e = S.elements.fill(0); for (let k = 0; k < 4; k++) { const j = jw ? jw[0][k] : si.getComponent(i, k), w = jw ? jw[1][k] : sw.getComponent(i, k);
        if (!w) continue; B.fromArray(bm, j * 16); for (let c = 0; c < 16; c++) e[c] += w * B.elements[c]; }
      return M.copy(o.matrixWorld).multiply(o.bindMatrixInverse).multiply(S).multiply(o.bindMatrix); };
    D.idx.forEach((i, r) => {
      rec.p0.push(pa.getX(i), pa.getY(i), pa.getZ(i)); rec.n0.push(na.getX(i), na.getY(i), na.getZ(i));
      o.getVertexPosition(i, q); q.applyMatrix4(o.matrixWorld); rec.rest.push(q.x, q.y, q.z);                  // rest world with the current weights
      q.x += D.d[r * 3] * 1e-5; q.y += D.d[r * 3 + 1] * 1e-5; q.z += D.d[r * 3 + 2] * 1e-5;
      skinM(i, wmap.get(i)); Minv.copy(M).invert(); q.applyMatrix4(Minv); rec.p1.push(q.x, q.y, q.z);
      // world normal -> bind: n_local ~ A^T n_world (A = linear part of M)
      N3.setFromMatrix4(M).transpose(); n.set(D.n[r * 3], D.n[r * 3 + 1], D.n[r * 3 + 2]).multiplyScalar(1e-4).applyMatrix3(N3).normalize(); rec.n1.push(n.x, n.y, n.z); });
    O.meshes.push(rec); });
  if (O.meshes.length !== OUTFIT_MESHES.length) throw new Error('v2plus outfit: found ' + O.meshes.length + ' of ' + OUTFIT_MESHES.length + ' garment meshes');
  return O;
}
function writeOutfit(on) {
  for (const R of V2P.outfit.meshes) { const g = R.o.geometry, pa = g.attributes.position, na = g.attributes.normal, P = on ? R.p1 : R.p0, Nn = on ? R.n1 : R.n0;
    R.idx.forEach((i, r) => { pa.setXYZ(i, P[r * 3], P[r * 3 + 1], P[r * 3 + 2]); na.setXYZ(i, Nn[r * 3], Nn[r * 3 + 1], Nn[r * 3 + 2]); });
    for (const a of [pa, na]) { a.needsUpdate = true; if (a.isInterleavedBufferAttribute) a.data.needsUpdate = true; }
    if (R.w) { const si = g.attributes.skinIndex, sw = g.attributes.skinWeight, J = on ? R.w.j1 : R.w.j0, W = on ? R.w.w1 : R.w.w0;
      R.w.idx.forEach((i, r) => { for (let k = 0; k < 4; k++) { si.setComponent(i, k, J[r][k]); sw.setComponent(i, k, W[r][k]); } });
      for (const a of [si, sw]) { a.needsUpdate = true; if (a.isInterleavedBufferAttribute) a.data.needsUpdate = true; } }
    g.computeBoundingSphere?.(); g.boundingBox = null;
    // the designed muscle regions read the rest position: give the moved vertices their new rest position
    const tx = V2P.restTex?.[R.o.uuid]; if (tx) { const a = tx.image.data, D = V2P.outfit.data.meshes[R.o.name];
      R.idx.forEach((i, r) => { for (let c = 0; c < 3; c++) a[i * 4 + c] = R.rest[r * 3 + c] + (on ? D.d[r * 3 + c] * 1e-5 : 0); }); tx.needsUpdate = true; } }
}
V2P.setOutfit = function(name, opts = {}) {
  const on = name === 'compression'; if (on && !V2P.outfit) throw new Error('v2plus: outfit data not loaded');
  // selectModelProfile runs every frame: write only on a change, or when training-collar has toggled (it rewrites all tee weights)
  const tag = window.__trainingCollarReport || null;
  if (V2P.outfit && (on !== !!V2P.outfitOn || (on && tag !== V2P.collarTag))) writeOutfit(on);
  V2P.collarTag = tag;
  V2P.outfitOn = on; const sleeve = on ? (opts.sleeve || 'short') : null; V2P.outfitState = on ? { outfit: name, sleeve } : null;
  V2P.uni.uV2pSleeve.value = sleeve === 'short' ? 1 : 0;
  if (V2P.outfit) { V2P.uni.uV2pCuffL.value = V2P.outfit.data.cuffPlanes.left; V2P.uni.uV2pCuffR.value = V2P.outfit.data.cuffPlanes.right; }
  return V2P.outfitState;
};

// ---------------- profile switch + hooks ----------------
// hand vertex buffers: v2 keeps its own (relax morph / baked grips); v2plus always shows the pristine authored hand + bones
function bufs() { const g = V2P.mesh.geometry; return [g.attributes.position, g.attributes.normal]; }
// NB: Snow's attributes are interleaved + quantized (position, normal, skinIndex, skinWeight share one buffer): copy xyz only
function snap() { return bufs().map(a => { const o = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) { o[i * 3] = a.getX(i); o[i * 3 + 1] = a.getY(i); o[i * 3 + 2] = a.getZ(i); } return o; }); }
function put(s) { bufs().forEach((a, k) => { const v = s[k]; for (let i = 0; i < a.count; i++) if (a.getX(i) !== v[i * 3] || a.getY(i) !== v[i * 3 + 1] || a.getZ(i) !== v[i * 3 + 2]) a.setXYZ(i, v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
  a.needsUpdate = true; if (a.isInterleavedBufferAttribute) a.data.needsUpdate = true; }); }
V2P.enable = function(on) { if (!V2P.loaded) throw new Error('v2plus not loaded'); if (V2P.on === on) return; V2P.on = on; writeWeights(on); V2P.uni.uV2pOn.value = on ? 1 : 0;
  if (on) { V2P.v2buf = snap(); put(V2P.pristine); window.__setRelax0?.(0, 0); } else { V2P.restHands(); if (V2P.v2buf) put(V2P.v2buf); }
  if (V2P.lastHL) { window.__setHighlight0(V2P.lastHL); if (on) V2P.setHighlight(V2P.lastHL); } };
V2P.load = function(meta, outfit) {
  if (V2P.loaded) return { already: true };
  const E = window.__drill; const rig = graftFingers(meta); const patched = patchMaterials(); V2P.pristine = snap();
  if (outfit) V2P.outfit = prepOutfit(outfit);
  const sel0 = E.selectModelProfile.bind(E);
  E.selectModelProfile = function(spec) { if (spec.modelProfile === 'training-human-v2plus') { sel0(Object.assign({}, spec, { modelProfile: 'training-human-v2' })); V2P.enable(true);
      V2P.setOutfit(spec.v2plus?.outfit || null, { sleeve: spec.v2plus?.sleeve }); }
    else { if (V2P.on) { V2P.setOutfit(null); V2P.enable(false); } sel0(spec); } };
  const pose0 = E.pose.bind(E);
  E.pose = function(spec, params, warm) { const r = pose0(spec, params, warm);
    if (V2P.on) { for (const s of ['left', 'right']) { const nm = V2P.pickHandPose(spec, s);
        // like v2: a free hand's curl follows the engine's relax weight (0 = authored open hand, 1 = the v2 relaxed hand the pose is fitted to)
        const k = nm === 'relaxed' && !spec.v2plus?.handPose?.[s] ? Math.max(0, Math.min(1, V2P.relaxReq?.[s] ?? 1)) : 1; V2P.setHandPose(s, nm, k); }
      flareInspector.viewer.coach.updateMatrixWorld(true); }
    return r; };
  window.__setRelax0 = window.__setRelax; window.__setRelax = (l, r) => { V2P.relaxReq = { left: l, right: r }; return window.__setRelax0(V2P.on ? 0 : l, V2P.on ? 0 : r); };
  window.__setHighlight0 = window.__setHighlight; window.__setHighlight = h => { V2P.lastHL = h; const n = window.__setHighlight0(h); if (V2P.on) V2P.setHighlight(h); return n; };
  // gripping hands: compute the same grip data (prop placement), but put the hand vertices back - fingers grip instead
  // gripping hands: v2plus keeps the grip data (prop placement) but bakes the fist into the v2 buffers only; fingers grip instead
  const P = window.__props; if (P && P.bakeGrip) { const bg0 = P.bakeGrip;
    P.bakeGrip = function(side) { if (!V2P.on || P.gripData[side]) return bg0(side);
      put(V2P.v2buf); const r = bg0(side); V2P.v2buf = snap(); put(V2P.pristine); return r; }; }
  V2P.loaded = true; return { ...rig, patched, outfit: V2P.outfit ? V2P.outfit.meshes.map(R => R.o.name + ':' + R.idx.length) : null };
};
})();
