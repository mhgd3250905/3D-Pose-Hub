// soft-highlight (highlight v2 "soft", 2026-10-18): a round, feathered muscle glow that replaces the crisp
// muscle-map Voronoi mask of toon.js, without editing any frozen training-human-v2 source.
// Opt-in only: lib/soft-highlight.mjs injects this file and calls __softHighlight(theme.highlight.soft) when the theme
// carries highlight.soft (themes/glow-soft.json). Themes without it never load this file, so old renders are unchanged.
//
// Why the old mask breaks up (h-quad-cars glute, hip flexors, ...):
//  1. posedlib mmRest blends RIGID per-bone retargets by skin weight from the coach's reset pose. Where the reset pose's
//     limb is rotated far from the mannequin frame, vertices weighted to pelvis + thigh (the shorts, the hip crease) land
//     between two very different transforms -> the shorts' thigh vertices sit ~0.25 m off in muscle-map space, and skin vs
//     shorts disagree at every garment edge. The mask jumps from triangle to triangle = shards with hard edges.
//  2. the mask itself is a Voronoi "selected minus best other" with a 1-2 px fwidth edge -> crisp polygonal borders and
//     seams along panel grooves; every small coordinate error shows as a sharp step.
// Fix: (a) a new muscle-map coordinate per vertex from proper linear-blend skinning: pose the coach skeleton so each limb
//     segment points like the mannequin's, skin every mesh with the same bones, then a smooth per-segment scale -> one
//     continuous field across skin, tee and shorts; (b) the mask is the union of the selected ellipsoids only, with a wide
//     smoothstep falloff (no "others" competition, no fwidth edge); (c) soft lambert + fresnel glow in the highlight colour.
// Nothing adds geometry, so nothing can intersect the clothes. Motion, camera and solver are untouched.
window.__softHighlight = function(opts={}){
  const T=window.__toonT,v=flareInspector.viewer,MM=window.__MM;
  // soft-v1 parameters (tuned 2026-10-18 on h-quad-cars, w-clamshell, glute-max-A, s-frog-r2, h-butterfly-active, hip-flexors-A):
  //  e0/e1   falloff in ellipsoid units (1 = inflated muscle-map panel edge): full glow inside e0, gone at e1
  //  size    scales every selected ellipsoid; depth widens them across the limb/body (less sensitive to sculpted surface bumps)
  //  compete/margin  a non-selected panel closer by more than margin fades the glow over 'compete' (keeps it on the right muscle)
  //  gain    how much the glow replaces the garment colour; ambient/lambert/core shade the glow; fresnel*rim adds an edge sheen
  //  midline half-width (m) of the soft left/right fade for one-sided highlights; debug 1 coords, 2 mask, 3 lambert
  const P={on:1,e0:0.35,e1:1.1,size:1.0,depth:1.4,compete:0.4,margin:0.22,gain:0.95,ambient:0.68,lambert:0.14,core:0.22,fresnel:0.22,rim:0.6,midline:0.035,debug:0,...opts};
  // ---- 1. skeleton -> mannequin-aligned standing pose (same keypoints as posedlib.js)
  const Q={shoulder:[.19,1.36,-.005],elbow:[.29,1.085,-.005],wrist:[.365,.875,.02],palm:[.39,.80,.04],hip:[.09,.86,0],knee:[.12,.47,0],ankle:[.15,.08,-.02],toe:[.17,.03,.13]};
  const q=(k,side)=>{const a=Q[k];return new T.Vector3(side==='left'?a[0]:-a[0],a[1],a[2]);};
  const SEG=[['Thigh','Hip','Knee','hip','knee'],['Shin','Knee','Ankle','knee','ankle'],['Foot','Ankle','Toe','ankle','toe'],
    ['UpperArm','Shoulder','Elbow','shoulder','elbow'],['Forearm','Elbow','Wrist','elbow','wrist'],['Hand','Wrist','Palm','wrist','palm']];
  const bones=[];v.coach.traverse(o=>{if(o.isBone)bones.push([o,o.quaternion.clone(),o.position.clone()]);});
  v.motion.reset();v.coach.updateMatrixWorld(true);
  const J=()=>v.motion.getMetrics().joints,V=a=>new T.Vector3(...a);
  for(const side of ['left','right'])for(const [b,a0,a1,k0,k1] of SEG){const bone=v.coach.getObjectByName(side+b);if(!bone)continue;
    const j=J();const d=V(j[side+a1]).sub(V(j[side+a0])).normalize(),t=q(k1,side).sub(q(k0,side)).normalize();
    const r=new T.Quaternion().setFromUnitVectors(d,t);const wq=bone.getWorldQuaternion(new T.Quaternion()),pq=bone.parent.getWorldQuaternion(new T.Quaternion());
    bone.quaternion.copy(pq.clone().invert().multiply(r).multiply(wq));v.coach.updateMatrixWorld(true);}
  const js=J();
  // per-segment similarity (no rotation left after alignment): x -> (x - P0)*s + Q0, blended by skin weight
  const X={};for(const side of ['left','right'])for(const [b,a0,a1,k0,k1] of SEG){const P0=V(js[side+a0]),P1=V(js[side+a1]),Q0=q(k0,side),Q1=q(k1,side);
    X[side+b]={P0,Q0,s:Q1.distanceTo(Q0)/Math.max(P1.distanceTo(P0),1e-4)};}
  const rep={};const wp=new T.Vector3(),t2=new T.Vector3(),acc=new T.Vector3();
  v.coach.traverse(o=>{if(!o.isSkinnedMesh||!o.material||o.material.customProgramCacheKey?.()!=='toon-drill1')return;
    const g=o.geometry,n=g.attributes.position.count,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bs=o.skeleton.bones;o.skeleton.update();
    const HH=Math.ceil(n/1024),buf=new Float32Array(1024*HH*4);
    for(let i=0;i<n;i++){o.getVertexPosition(i,wp);wp.applyMatrix4(o.matrixWorld);acc.set(0,0,0);let tot=0;
      for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w<=0)continue;const x=X[bs[si.getComponent(i,k)]?.name];
        if(x)t2.copy(wp).sub(x.P0).multiplyScalar(x.s).add(x.Q0);else t2.copy(wp);acc.addScaledVector(t2,w);tot+=w;}
      acc.multiplyScalar(1/(tot||1));buf[i*4]=acc.x;buf[i*4+1]=acc.y;buf[i*4+2]=acc.z;buf[i*4+3]=1;}
    const tex=new T.DataTexture(buf,1024,HH,T.RGBAFormat,T.FloatType);tex.needsUpdate=true;tex.magFilter=tex.minFilter=T.NearestFilter;
    o.userData.softMmTex=tex;rep[o.name]=n;});
  for(const [o,qq,pp] of bones){o.quaternion.copy(qq);o.position.copy(pp);}v.motion.reset();v.coach.updateMatrixWorld(true);
  // ---- 2. shader patch (wraps toon.js's onBeforeCompile; the old path stays intact behind uSoftOn=0)
  const U=window.__softUni||(window.__softUni={uSoftOn:{value:1},uSoftE:{value:new T.Vector4()},uSoftK:{value:new T.Vector4()},uSoftR:{value:new T.Vector4()}});
  U.uSoftOn.value=P.on?1:0;U.uSoftE.value.set(P.e0,P.e1,P.size,P.midline);U.uSoftK.value.set(P.gain,P.core,P.lambert,P.ambient);U.uSoftR.value.set(P.fresnel,P.rim,P.debug,P.compete);
  const GL=`
  #define SOFT_K 10.0
  #define SOFT_M ${(+P.margin).toFixed(4)}
  #define SOFT_D ${(+P.depth).toFixed(4)}
  uniform float uSoftOn; uniform vec4 uSoftE; uniform vec4 uSoftK; uniform vec4 uSoftR; varying vec3 vSm;
  float softMask(out float core){
    vec3 p=vec3(abs(vSm.x),vSm.y,vSm.z); float e=9.0,eo=9.0,es=0.0;
    for(int i=0;i<MM_NE;i++){ int k=int(mmC[i].w+0.5); if(k==MM_ABS && uSel[k]<0.5) continue; vec3 d=p-mmC[i].xyz; vec4 t=mmT[i];
      d.xy=vec2(d.x*t.x+d.y*t.y,d.y*t.x-d.x*t.y); d.yz=vec2(d.y*t.z+d.z*t.w,d.z*t.z-d.y*t.w);
      float ei=length(d/(mmR[i]*uSoftE.z*vec3(SOFT_D,1.0,SOFT_D))); if(uSel[k]>0.5) es+=exp(-SOFT_K*ei); else eo=min(eo,ei); }
    e=-log(max(es,1e-12))/SOFT_K;  // smooth union: no crease where two selected ellipsoids meet
    float h=1.0-smoothstep(uSoftE.x,uSoftE.y,e);
    // soft competition: a non-selected panel that is clearly closer fades the glow out over a wide band (no hard border)
    if(uSoftR.w>0.0) h*=1.0-smoothstep(0.0,uSoftR.w,e-eo-SOFT_M);
    if(abs(uSide)>0.5) h*=smoothstep(-uSoftE.w,uSoftE.w,vSm.x*uSide);
    core=1.0-smoothstep(0.15,1.0,e); return h; }
  `;
  let patched=0;
  v.coach.traverse(o=>{if(!o.userData.softMmTex)return;const m=o.material;if(m.userData.softPatched)return;const ob=m.onBeforeCompile;const tex=o.userData.softMmTex;
    m.onBeforeCompile=sh=>{ob(sh);Object.assign(sh.uniforms,U);sh.uniforms.uSMT={value:tex};
      const rep=(s,a,b,what)=>{if(!s.includes(a))throw new Error('soft-highlight: toon shader anchor missing: '+what);return s.replace(a,b);};
      sh.vertexShader=rep(sh.vertexShader,'varying vec3 vMm;','varying vec3 vMm;varying vec3 vSm;uniform sampler2D uSMT;','vMm decl');
      sh.vertexShader=rep(sh.vertexShader,'vMm=mmt.xyz;','vMm=mmt.xyz;vSm=texelFetch(uSMT,vt,0).xyz;','vMm assign');
      sh.fragmentShader=rep(sh.fragmentShader,'float patF(vec4 P,vec3 p)',GL+'float patF(vec4 P,vec3 p)','patF');
      sh.fragmentShader=rep(sh.fragmentShader,'if(uMapGate>0.5 && uSelN>0.5){ float c2; float d2=hlMask(c2); if(d2>d){d=d2;core=c2;} }',
        'if(uMapGate>0.5 && uSelN>0.5){ float c2; float d2=uSoftOn>0.5?softMask(c2):hlMask(c2); if(d2>d){d=d2;core=c2;} }','mask');
      sh.fragmentShader=rep(sh.fragmentShader,'lit=mix(lit,cyl,d*0.94);',
        `if(uSoftOn>0.5){ float lam=clamp(0.5+0.5*nl,0.0,1.0); float pul=0.90+0.20*uPulse;
           vec3 gl=cy*(uSoftK.w+uSoftK.z*lam+uSoftK.y*core)*pul;
           lit=mix(lit,gl,d*uSoftK.x); lit+=cy*d*pul*uSoftR.x*pow(1.0-clamp(dot(Nn,V),0.0,1.0),1.8)*uSoftR.y; if(uSoftR.z>0.5) lit=uSoftR.z>2.5?vec3(lam):uSoftR.z>1.5?vec3(d):fract(abs(vSm)*8.0); }
         else { lit=mix(lit,cyl,d*0.94); }`,'mix');
    };
    const key='toon-drill1-soft-'+(+P.margin).toFixed(4)+'-'+(+P.depth).toFixed(4);m.customProgramCacheKey=()=>key;m.userData.softPatched=true;m.needsUpdate=true;patched++;});
  return {meshes:rep,patched,params:P};
};
