// drill-anim toon material (generalised from toon-test lib7.js / v7).
// Per-vertex tone texture now carries garment WEIGHTS instead of colours: r=skin, g=top, b=bottom, shoe=1-r-g-b
// (head graft: g<0 = cavity darkening). Colours / shade / finish / rim tint / pattern per garment come from the theme
// (window.__theme, see theme.json). Highlight: legacy deltoid lobes (v7) and/or the muscle-map panels (muscle-map.js scoring).
window.__toon = async function(theme){
  const ver=(await (await fetch('/src/viewer.js')).text()).match(/three\.js\?v=(\w+)/)[1];
  const T=await import('/node_modules/.vite/deps/three.js?v='+ver);
  const MM=await import('/src/muscle-map.js');window.__MM=MM;__buildMM(MM,T);
  const v=flareInspector.viewer;v.playing=false;const m=v.motion;
  await __posedMuscle({hide:n=>/Teeth|Gums|Tongue|Brows|Hair|Glints/.test(n)});
  window.__toonT=T;__themeUniforms(theme);
  const tee=[];{const q=new T.Vector3(),nn=new T.Vector3();for(const nm of ['Mesh005']){const o=v.coach.getObjectByName(nm);const g=o.geometry,n=g.attributes.position.count;const nm3=new T.Matrix3().getNormalMatrix(o.matrixWorld);
    for(let i=0;i<n;i++){o.getVertexPosition(i,q);q.applyMatrix4(o.matrixWorld);nn.fromBufferAttribute(g.attributes.normal,i).applyMatrix3(nm3).normalize();tee.push([q.x,q.y,q.z,nn.x,nn.y,nn.z]);}}}
  const cuff=[];{const q=new T.Vector3();const o=v.coach.getObjectByName('Mesh005_1');for(let i=0;i<o.geometry.attributes.position.count;i+=2){o.getVertexPosition(i,q);q.applyMatrix4(o.matrixWorld);cuff.push([q.x,q.y,q.z]);}}
  const grid=new Map(),G=0.03,key=(x,y,z)=>Math.floor(x/G)+','+Math.floor(y/G)+','+Math.floor(z/G);tee.forEach((t,i)=>{const k=key(t[0],t[1],t[2]);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(i);});
  const near=(x,y,z)=>{let bd=9,bi=-1;const cx=Math.floor(x/G),cy=Math.floor(y/G),cz=Math.floor(z/G);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const L=grid.get((cx+a)+','+(cy+b)+','+(cz+c));if(!L)continue;for(const i of L){const t=tee[i];const d=(t[0]-x)**2+(t[1]-y)**2+(t[2]-z)**2;if(d<bd){bd=d;bi=i;}}}return [Math.sqrt(bd),bi];};
  window.__sinkStats={};
  const W_SKIN=[1,0,0],W_TOP=[0,1,0],W_BOT=[0,0,1],W_SHOE=[0,0,0];
  v.coach.traverse(o=>{if(!o.isSkinnedMesh||!o.visible)return;const g=o.geometry,n=g.attributes.position.count;
    const si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bones=o.skeleton.bones;
    const col=new Float32Array(n*3),del=new Float32Array(n);const isBody=o.name==='Coach_Body';const HH=Math.ceil(n/1024),rp=new Float32Array(1024*HH*4);const wp=new T.Vector3();
    const isEye=/^Mesh004/.test(o.name);const isShoe=/Shoe|Sneakers|Soles/.test(o.name);const isTee=/^Mesh005/.test(o.name),isShorts=/Shorts/.test(o.name);
    for(let i=0;i<n;i++){
      let best=-1,bn='';for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>best){best=w;bn=bones[si.getComponent(i,k)]?.name||'';}}
      o.getVertexPosition(i,wp);wp.applyMatrix4(o.matrixWorld);
      // garment: tee meshes + upper body/arms = top; shorts + legs = bottom (v7 painted all of them one suit colour)
      let c=/Thigh|Shin|Foot|Patella|pelvis/.test(bn)?W_BOT:W_TOP;if(isTee)c=W_TOP;if(isShorts)c=W_BOT;
      if(/head|neck/.test(bn)&&wp.y>1.43&&!isTee)c=W_SKIN;
      if(/Hand/.test(bn)&&!isBody)c=W_SKIN;
      if(isBody&&/Hand|Forearm/.test(bn)){del[i]=1;}
      if(isShoe)c=W_SHOE;if(isEye)c=W_SKIN;
      col.set(c,i*3);
      rp[i*4]=wp.x;rp[i*4+1]=wp.y;rp[i*4+2]=wp.z;rp[i*4+3]=(!isShoe&&!isShorts&&!/Hand|Forearm/.test(bn))?1:0;
    }
    const sink=new Float32Array(n);if(o.name==='Coach_Body'||o.name==='Mesh001'){let cnt=0;
      for(let i=0;i<n;i++){o.getVertexPosition(i,wp);wp.applyMatrix4(o.matrixWorld);if(wp.y<0.85||wp.y>1.46)continue;const [d,ti]=near(wp.x,wp.y,wp.z);if(d>0.03)continue;const t=tee[ti];
        const sd=(wp.x-t[0])*t[3]+(wp.y-t[1])*t[4]+(wp.z-t[2])*t[5];if(sd>0.006)continue;
        let dc=9;for(const c of cuff)dc=Math.min(dc,Math.hypot(c[0]-wp.x,c[1]-wp.y,c[2]-wp.z));
        let w=Math.min(1,Math.max(0,(dc-0.012)/0.02));if(o.name==='Mesh001')w*=Math.min(1,Math.max(0,(1.405-wp.y)/0.02));
        if(w>0){sink[i]=(window.__sinkMM||4)*0.001*w;cnt++;}}
      window.__sinkStats[o.name]={sunk:cnt};}
    g.setAttribute('aSink',new T.BufferAttribute(sink,1));
    if(!g.attributes.aHandD){g.setAttribute('aHandD',new T.BufferAttribute(new Float32Array(n*3),3));g.setAttribute('aHandN',new T.BufferAttribute(new Float32Array(n*3),3));}
    if(!g.attributes.mmRest)g.setAttribute('mmRest',new T.BufferAttribute(new Float32Array(n*3),3));
    const hcut=s=>{const F=v.coach.getObjectByName(s+'Forearm').getWorldPosition(new T.Vector3()),H=v.coach.getObjectByName(s+'Hand').getWorldPosition(new T.Vector3());return [H,H.clone().sub(F).normalize()];};const [HLp,HLa]=hcut('left'),[HRp,HRa]=hcut('right');
    const H=Math.ceil(n/1024),buf=new Float32Array(1024*H*4);for(let i=0;i<n;i++){buf[i*4]=col[i*3];buf[i*4+1]=col[i*3+1];buf[i*4+2]=col[i*3+2];buf[i*4+3]=del[i];}
    const vtex=new T.DataTexture(buf,1024,H,T.RGBAFormat,T.FloatType);vtex.needsUpdate=true;vtex.magFilter=vtex.minFilter=T.NearestFilter;
    // muscle-map rest coords (posedlib mmRest) + cloth sink, fetched by gl_VertexID (custom vertex attributes do not reach this shader here)
    const mmA=g.attributes.mmRest;const mb=new Float32Array(1024*HH*4);for(let i=0;i<n;i++){if(mmA){mb[i*4]=mmA.getX(i);mb[i*4+1]=mmA.getY(i);mb[i*4+2]=mmA.getZ(i);}mb[i*4+3]=sink[i];}
    const mtex=new T.DataTexture(mb,1024,HH,T.RGBAFormat,T.FloatType);mtex.needsUpdate=true;mtex.magFilter=mtex.minFilter=T.NearestFilter;
    const rtex=new T.DataTexture(rp,1024,HH,T.RGBAFormat,T.FloatType);rtex.needsUpdate=true;rtex.magFilter=rtex.minFilter=T.NearestFilter;const isSkin=o.name==='Mesh001';
    const mat=new T.MeshToonMaterial({});mat.toneMapped=false;
    mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,window.__toonUni,window.__mmUni);sh.uniforms.uShoe={value:isShoe?1:0};sh.uniforms.uVT={value:vtex};sh.uniforms.uVR={value:rtex};sh.uniforms.uMMT={value:mtex};sh.uniforms.uFieldOn={value:1};sh.uniforms.uCollar={value:isSkin?1:0};sh.uniforms.uCut={value:isBody?1:0};sh.uniforms.uHLp={value:HLp};sh.uniforms.uHLa={value:HLa};sh.uniforms.uHRp={value:HRp};sh.uniforms.uHRa={value:HRa};sh.uniforms.uDbgCol={value:new T.Color(/^Mesh005/.test(o.name)?0x00ff00:(o.name==='Coach_Body'||isSkin)?0xff0000:/Head/.test(o.name)?0xff00ff:0x0000ff)};
      sh.uniforms.uMapGate={value:isShoe?0:1};
      sh.vertexShader='attribute float aSink;attribute vec3 aHandD;attribute vec3 aHandN;attribute vec3 mmRest;uniform vec2 uRelax;varying vec3 vMm;varying float vArm;varying float vRimK;varying vec4 vTone;varying vec4 vRest;uniform sampler2D uVT;uniform sampler2D uVR;uniform sampler2D uMMT;uniform float uSinkK;uniform float uFieldOn;uniform float uBreath;\n'+sh.vertexShader
        .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
        { vec4 tr=uFieldOn>0.5?texelFetch(uVR,ivec2(gl_VertexID%1024,gl_VertexID/1024),0):vec4(0.0);}`)
        .replace('#include <begin_vertex>',`#include <begin_vertex>
        ivec2 vt=ivec2(gl_VertexID%1024,gl_VertexID/1024);vec4 tv=texelFetch(uVT,vt,0);
        vTone=tv;vArm=max(tv.a,0.0);vRimK=1.0-clamp(-tv.a,0.0,1.0);vec4 mmt=uFieldOn>0.5?texelFetch(uMMT,vt,0):vec4(0.0);vMm=mmt.xyz;
        vRest=uFieldOn>0.5?texelFetch(uVR,vt,0):vec4(0.0,9.0,0.0,0.0);
        
        { vec3 cp=(vRest.xyz-vec3(0.0,1.24,0.06))/vec3(0.16,0.12,0.10); float bm=exp(-dot(cp,cp)*1.6)*step(0.5,uFieldOn);
          transformed+=objectNormal*uBreath*bm; }`).replace('#include <skinning_vertex>','#include <skinning_vertex>\n transformed-=normalize(objectNormal)*texelFetch(uMMT,ivec2(gl_VertexID%1024,gl_VertexID/1024),0).w*step(0.5,uFieldOn)*uSinkK;');
      sh.fragmentShader=`uniform vec3 uDbgCol;uniform float uGlow;uniform float uRim;uniform float uCollar;uniform float uPulse;uniform float uMapGate;
        uniform vec3 uLc[2];uniform mat3 uLm[2];uniform float uLt[2];uniform float uLobeOn;
        uniform vec3 uBase[4];uniform vec3 uShadeC[4];uniform vec3 uRimC[4];uniform vec4 uFin[4];uniform vec4 uPat[4];uniform vec3 uPatC[4];
        uniform vec3 uHiC;uniform float uHiShade[3];
        uniform sampler2D uTex0;uniform sampler2D uTex1;uniform sampler2D uTex2;uniform sampler2D uTex3;uniform vec4 uTexOn;uniform vec4 uTexS;
        varying float vRimK;varying vec4 vTone;varying vec4 vRest;varying float vArm;varying vec3 vMm;uniform float uCut;uniform vec3 uHLp;uniform vec3 uHLa;uniform vec3 uHRp;uniform vec3 uHRa;
        float lobeE(int i,vec3 p){vec3 q=uLm[i]*(p-uLc[i]);float w=1.0-uLt[i]*clamp(q.x,0.0,1.0);return length(vec3(q.x,q.yz/max(w,0.08)));}
        `+window.__mmGLSL+`
        float patF(vec4 P,vec3 p){ if(P.x<0.5) return 0.0; float s=P.y; float f;
          if(P.x<1.5){ f=sin(p.y*6.2831/s); float a=fwidth(f)*0.8+1e-4; return smoothstep(-a,a,f)*P.z; }           // horizontal stripes
          if(P.x<2.5){ f=sin(p.x*6.2831/s)*sin(p.y*6.2831/s); float a=fwidth(f)*0.8+1e-4; return smoothstep(-a,a,f)*P.z; } // check
          vec2 q=fract(vec2(p.x+p.z,p.y)/s)-0.5; f=0.28-length(q); float a=fwidth(f)*0.8+1e-4; return smoothstep(-a,a,f)*P.z; } // dots
        `+sh.fragmentShader.replace('#include <opaque_fragment>',`
        vec3 Nn=normalize(normal);vec3 V=normalize(vViewPosition);
        vec3 Ld=normalize(vec3(-0.45,0.75,0.55));
        float nl=dot(Nn,Ld);
        float b=smoothstep(-0.05,0.08,nl)*0.5+smoothstep(0.45,0.6,nl)*0.5;
        vec3 gw=max(vTone.rgb,vec3(0.0));float cav=max(-vTone.g,0.0);
        vec4 W4=vec4(gw,clamp(1.0-gw.r-gw.g-gw.b,0.0,1.0));vec3 dbg7=vec3(0.0);
        if(uCut>0.5){ float fa=0.17-vRest.y;float aA=max(fwidth(fa),1e-5)*0.9;float wA=smoothstep(-aA,aA,fa);
          bool L=vRest.x>0.0;float fh=dot(vRest.xyz-(L?uHLp:uHRp),L?uHLa:uHRa)-0.001;float aH=max(fwidth(fh),1e-5)*0.9;float wH=smoothstep(-aH,aH,fh)*step(0.5,vArm);
          W4=mix(W4,vec4(1.0,0.0,0.0,0.0),max(wA,wH));dbg7=vec3(step(0.5,vArm),clamp(fh*20.0+0.5,0.0,1.0),wA); }
        if(uCollar>0.5){ vec2 hz=vec2(vRest.x,vRest.z-0.006);float rr=length(hz);float fz=max(0.0,hz.y/max(rr,1e-4));
          float fy=vRest.y-(1.452-0.030*fz*fz-0.006*max(0.0,-hz.y/max(rr,1e-4)));float f=max(min(fy,0.5*(0.125-rr)),vRest.y-1.47);float aa=max(fwidth(f),1e-5)*0.9;
          W4=mix(vec4(0.0,1.0,0.0,0.0),vec4(1.0,0.0,0.0,0.0),smoothstep(-aa,aa,f)); }
        vec3 alb=vec3(0.0),shc=vec3(0.0),rimc=vec3(0.0);vec4 fin=vec4(0.0);vec3 pp=vRest.y<8.0?vRest.xyz:vMm;
        for(int i=0;i<4;i++){ float w=W4[i]; if(w<=0.0) continue;
          vec3 bc=uBase[i],sc=uShadeC[i];
          float pf=patF(uPat[i],pp); bc=mix(bc,uPatC[i],pf); sc=mix(sc,uPatC[i]*(uShadeC[i]/max(uBase[i],vec3(1e-3))),pf);
          if(uTexOn[i]>0.5){ vec2 uv=vec2(pp.x+pp.z,pp.y)/uTexS[i]; vec3 tc=i==0?texture2D(uTex0,uv).rgb:i==1?texture2D(uTex1,uv).rgb:i==2?texture2D(uTex2,uv).rgb:texture2D(uTex3,uv).rgb; bc*=tc; sc*=tc; }
          alb+=w*bc; shc+=w*sc; rimc+=w*uRimC[i]; fin+=w*uFin[i]; }
        alb*=1.0-cav; shc*=1.0-cav;
        vec3 lit=mix(shc,alb,b);
        // finish: fin.x = sheen strength, fin.y = gloss exponent (matte = 0 strength)
        if(fin.x>0.0){ vec3 Hh=normalize(Ld+V); float sp=pow(max(dot(Nn,Hh),0.0),max(fin.y,1.0)); float aS=fwidth(sp)+1e-3; lit+=alb*fin.x*smoothstep(0.5-aS,0.5+aS,sp)*0.6 + vec3(fin.x*0.10)*sp; }
        float fr=pow(1.0-clamp(dot(Nn,V),0.0,1.0),2.6);
        float d=0.0,core=0.0;
        if(vRest.w>0.5 && uLobeOn>0.5){ float e1=lobeE(0,vRest.xyz),e2=lobeE(1,vRest.xyz);
          float a1=max(fwidth(e1),0.004)*1.2,a2=max(fwidth(e2),0.004)*1.2;
          float i1=1.0-smoothstep(1.0-a1-0.03,1.0+a1,e1),i2=1.0-smoothstep(1.0-a2-0.03,1.0+a2,e2);
          float seam=(1.0-smoothstep(0.0,0.07+fwidth(e1-e2)*1.5,abs(e1-e2)))*min(i1,i2);
          d=max(i1,i2)*(1.0-0.9*seam);core=clamp(1.0-min(e1,e2),0.0,1.0); }
        if(uMapGate>0.5 && uSelN>0.5){ float c2; float d2=hlMask(c2); if(d2>d){d=d2;core=c2;} }
        vec3 cy=uHiC;
        vec3 cyl=cy*(uHiShade[0]+uHiShade[1]*b+uHiShade[2]*core)*(0.92+0.16*uPulse);
        lit=mix(lit,cyl,d*0.94);
        lit+=rimc*smoothstep(0.55,0.9,fr)*uRim*(1.0-d)*vRimK;
        outgoingLight = uGlow>7.5 ? vec3(uSelN,uMapGate,uSel[18]) : uGlow>6.5 ? fract(abs(vMm)*4.0) : uGlow>5.5 ? vec3(d) : uGlow>4.5 ? dbg7 : uGlow>3.5 ? uDbgCol : uGlow>2.5 ? vec3(d) : uGlow>1.5 ? alb*2.0 : uGlow>0.5 ? cy*d*(0.55+0.45*core)*(0.8+0.4*uPulse) : lit;
        #include <opaque_fragment>`);};
    if(isSkin){mat.polygonOffset=true;mat.polygonOffsetFactor=1;mat.polygonOffsetUnits=4;}mat.customProgramCacheKey=()=>'toon-drill1';o.material=mat;o.castShadow=false;o.receiveShadow=false;});
  window.__setLobes(window.__lobeP||{});return true;
};
// ---- theme -> uniforms (garment order: 0 skin, 1 top, 2 bottom, 3 shoe)
window.__themeUniforms=function(th){const T=window.__toonT;const U=window.__toonUni;const C=c=>Array.isArray(c)?new T.Color().setRGB(c[0],c[1],c[2]):new T.Color(c);
  const G=['skin','top','bottom','shoes'];const FIN={matte:[0,1],satin:[0.35,24],sheen:[0.6,48]};const PAT={none:0,stripes:1,check:2,dots:3};
  U.uBase.value=[];U.uShadeC.value=[];U.uRimC.value=[];U.uFin.value=[];U.uPat.value=[];U.uPatC.value=[];const ton=[0,0,0,0],ts=[1,1,1,1];
  G.forEach((k,i)=>{const g=th[k];const b=C(g.base);U.uBase.value.push(b);U.uShadeC.value.push(g.shade?C(g.shade):b.clone().multiplyScalar(g.shadeK??0.52));
    U.uRimC.value.push(C(g.rim||th.rim.body));const f=typeof g.finish==='string'?FIN[g.finish]:[g.finish?.sheen||0,g.finish?.gloss||16];U.uFin.value.push(new T.Vector4(f[0],f[1],0,0));
    const p=g.pattern||{};U.uPat.value.push(new T.Vector4(PAT[p.type||'none']||0,p.scale||0.04,p.strength??1,0));U.uPatC.value.push(C(p.colour||g.base));
    U['uTex'+i].value=window.__texCache?.[i]||window.__whiteTex;if(g.texture&&window.__texCache?.[i]){ton[i]=1;ts[i]=g.texture.scale||0.25;}});
  U.uTexOn.value=new T.Vector4(...ton);U.uTexS.value=new T.Vector4(...ts);
  U.uHiC.value=C(th.highlight.colour);U.uHiShade.value=th.highlight.shade||[0.62,0.30,0.22];return true;};
window.__mmUni={};
// muscle-map panel scoring (same anisotropic-ellipsoid Voronoi as wt-muscle-sync src/muscle-map.js mmEval), reduced to
// "selected panels vs everything else": f = best selected score - best other score; AA'd with fwidth -> crisp mask.
window.__buildMM=function(MM,T){const u=MM.createMuscleUniforms();const N=MM.MUSCLES.length,NE=u.mmC.value.length,ABS=MM.MUSCLE_BY_ID.abs.index;
  Object.assign(window.__mmUni,{mmC:u.mmC,mmR:u.mmR,mmT:u.mmT,uSel:{value:new Array(N).fill(0)},uSelN:{value:0},uSide:{value:0},uMapInset:{value:0.03}});
  window.__mmGLSL=`
  #define MM_N ${N}
  #define MM_NE ${NE}
  #define MM_ABS ${ABS}
  uniform vec4 mmC[MM_NE]; uniform vec3 mmR[MM_NE]; uniform vec4 mmT[MM_NE]; uniform float uSel[MM_N]; uniform float uSelN; uniform float uSide; uniform float uMapInset;
  float mmAbsIn(vec3 p){ float t=clamp((1.03-p.y)/0.20,0.0,1.0); float w=0.090-0.064*pow(t,1.6)-0.014*smoothstep(1.08,1.22,p.y);
    float a=w-p.x,b=p.y-0.832,h=max(0.012-abs(a-b),0.0)/0.012; return min(min(a,b)-h*h*0.003,p.z-0.04); }
  float hlMask(out float core){
    vec3 p=vec3(abs(vMm.x),vMm.y,vMm.z); float bs=-9.0,bo=-9.0,sAbs=-9.0;
    for(int i=0;i<MM_NE;i++){ int k=int(mmC[i].w+0.5); vec3 d=p-mmC[i].xyz; vec4 t=mmT[i];
      d.xy=vec2(d.x*t.x+d.y*t.y,d.y*t.x-d.x*t.y); d.yz=vec2(d.y*t.z+d.z*t.w,d.z*t.z-d.y*t.w);
      float s=1.0-length(d/mmR[i]); if(k==MM_ABS){sAbs=s;continue;}
      if(uSel[k]>0.5) bs=max(bs,s); else bo=max(bo,s); }
    { float b1=max(bs,bo); float top=(sAbs-b1)*0.1+smoothstep(1.13,1.08,p.y); float sa=max(b1,0.0)+14.0*min(mmAbsIn(p),top);
      if(uSel[MM_ABS]>0.5) bs=max(bs,sa); else bo=max(bo,sa); }
    float f=min(bs-max(bo,0.0),bs);
    if(abs(uSide)>0.5) f=min(f,vMm.x*uSide*14.0);
    float a=max(fwidth(f),1e-4)*1.2; core=clamp(bs*1.6,0.0,1.0);
    return smoothstep(-a,a+uMapInset,f); }`;
  if(!window.__whiteTex){window.__whiteTex=new T.DataTexture(new Uint8Array([255,255,255,255]),1,1,T.RGBAFormat);window.__whiteTex.needsUpdate=true;}
};
// select highlight: {groups:[groupId...], side:'both'|'left'|'right', lobes:bool (v7 deltoid lobes)}
window.__setHighlight=function(h){const MM=window.__MM,U=window.__mmUni;const sel=new Array(MM.MUSCLES.length).fill(0);let n=0;
  for(const gid of (h.lobes?[]:h.groups||[])){const g=MM.resolveGroup(gid);if(!g)continue;for(const id of g.muscles){sel[MM.MUSCLE_BY_ID[id].index]=1;n++;}}
  for(const id of h.panels||[]){sel[MM.MUSCLE_BY_ID[id].index]=1;n++;}
  U.uSel.value=sel;U.uSelN.value=n?1:0;U.uSide.value=h.side==='left'?1:h.side==='right'?-1:0;window.__toonUni.uLobeOn.value=h.lobes?1:0;if(h.inset!==undefined)U.uMapInset.value=h.inset;return n;};
window.__lobeP={};
window.__setLobes=function(o){const T=window.__toonT,v=flareInspector.viewer,m=v.motion;m.reset();v.coach.updateMatrixWorld(true);const J=m.getMetrics().joints;
  const P=Object.assign({front:{u:0.035,f:0.052,l:0.026,ru:0.085,rf:0.060,rl:0.034,t:0.6},side:{u:0.03,f:0.006,l:0.056,ru:0.088,rf:0.034,rl:0.060,t:0.6}},o);
  const S=new T.Vector3(...J.rightShoulder),E=new T.Vector3(...J.rightElbow);const u=E.clone().sub(S).normalize();
  const l=new T.Vector3(-1,0,0);l.addScaledVector(u,-l.dot(u)).normalize();const f=u.clone().cross(l).normalize();if(f.z<0)f.negate();
  const U=window.__toonUni;U.uLc.value=[];U.uLm.value=[];U.uLt.value=[];
  for(const k of ['front','side']){const p=P[k];U.uLc.value.push(S.clone().addScaledVector(u,p.u).addScaledVector(f,p.f).addScaledVector(l,p.l));
    // rows: u/ru, f/rf, l/rl  (mat3 is column-major: set via set() row-major)
    const M=new T.Matrix3().set(u.x/p.ru,u.y/p.ru,u.z/p.ru, f.x/p.rf,f.y/p.rf,f.z/p.rf, l.x/p.rl,l.y/p.rl,l.z/p.rl);U.uLm.value.push(M);U.uLt.value.push(p.t);}
  return {S:S.toArray(),u:u.toArray(),f:f.toArray(),l:l.toArray()};};
window.__glowU={value:0};window.__rimU={value:1};
window.__toonUni={uGlow:window.__glowU,uRim:window.__rimU,uPulse:{value:0},uBreath:{value:0},uLc:{value:[]},uLm:{value:[]},uLt:{value:[0.5,0.5]},uLobeOn:{value:0},uRelax:{value:[0,0]},uSinkK:{value:1},
  uBase:{value:[]},uShadeC:{value:[]},uRimC:{value:[]},uFin:{value:[]},uPat:{value:[]},uPatC:{value:[]},uHiC:{value:null},uHiShade:{value:[0.62,0.30,0.22]},uTex0:{value:null},uTex1:{value:null},uTex2:{value:null},uTex3:{value:null},uTexOn:{value:null},uTexS:{value:null}};
window.__project=function(names){const v=flareInspector.viewer,T=window.__toonT;const c=v.renderer.domElement.getBoundingClientRect();const o={};
  for(const [k,a] of Object.entries(names)){const V=new T.Vector3(...a).project(v.camera);o[k]=[(V.x+1)/2*c.width+c.left,(1-V.y)/2*c.height+c.top];}return o;};
// v6: weld skin data across split (UV/normal seam) vertices so seams cannot open under skinning
window.__weldSkin=function(names){const T=window.__toonT,v=flareInspector.viewer,m=v.motion;m.reset();v.coach.updateMatrixWorld(true);const rep={};const q=new T.Vector3();
  for(const nm of names){const o=v.coach.getObjectByName(nm);if(!o)continue;const g=o.geometry,n=g.attributes.position.count,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
    const map=new Map();let diff=0,grp=0;
    for(let i=0;i<n;i++){const pa=new T.Vector3().fromBufferAttribute(g.attributes.position,i);const k=Math.round(pa.x*1e4)+','+Math.round(pa.y*1e4)+','+Math.round(pa.z*1e4);if(!map.has(k))map.set(k,[]);map.get(k).push(i);}
    for(const ids of map.values()){if(ids.length<2)continue;grp++;
      const acc=new Map();for(const i of ids)for(let c=0;c<4;c++){const w=sw.getComponent(i,c);if(w<=0)continue;const b=si.getComponent(i,c);acc.set(b,(acc.get(b)||0)+w/ids.length);}
      const top=[...acc.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4);const s=top.reduce((a,b)=>a+b[1],0);
      let d=false;for(const i of ids)for(let c=0;c<4;c++){const b=top[c]?top[c][0]:0,w=top[c]?top[c][1]/s:0;if(Math.abs(sw.getComponent(i,c)-w)>1e-4||(w>0&&si.getComponent(i,c)!==b))d=true;si.setComponent(i,c,b);sw.setComponent(i,c,w);}
      if(d)diff++;}
    si.needsUpdate=true;sw.needsUpdate=true;rep[nm]={groups:grp,changed:diff};}
  return rep;};
// v6: apply precomputed left-hand finger deltas (world deltas measured with the hand in bind orientation) -> bind-space positions/normals
// relaxed hand (fingers together + soft curl) as a per-vertex morph instead of a baked edit (v7 baked it into the left hand).
// H = assets/handdef.json (world deltas measured with the LEFT hand in bind orientation, side-plank base pose).
// The deltas are produced by running the exact v7 bake (bakeHand below) and recording what it changed, then restoring the mesh;
// the right hand gets the mirror image. Weights: __toonUni.uRelax.value=[left,right] (0 = authored flat hand, 1 = relaxed).
function bakeHand(cfg,H,side){const T=window.__toonT,v=flareInspector.viewer,m=v.motion;__poseAnim(cfg,0);const pose=m.capturePose();pose.limbs[side].handQuaternion=[0,0,0,1];m.applyPose(pose,{playback:false});v.coach.updateMatrixWorld(true);
  const o=v.coach.getObjectByName('Coach_Body');const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,sk=o.skeleton;sk.update();
  const pos=g.attributes.position,nor=g.attributes.normal;const ax=new T.Vector3(...H.axis);let n=0;
  const BM=sk.bones.map((b,k)=>new T.Matrix4().multiplyMatrices(b.matrixWorld,sk.boneInverses[k]));
  for(let j=0;j<H.idx.length;j++){const i=H.idx[j];const M=new T.Matrix4().set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w<=0)continue;const e=BM[si.getComponent(i,k)].elements;for(let q=0;q<16;q++)M.elements[q]+=w*e[q];}
    const A=new T.Matrix4().multiplyMatrices(o.bindMatrixInverse,M).multiply(o.bindMatrix);const lin=new T.Matrix3().setFromMatrix4(A);const inv=lin.clone().invert();
    const dl=new T.Vector3(...H.d[j]).applyMatrix3(inv);pos.setXYZ(i,pos.getX(i)+dl.x,pos.getY(i)+dl.y,pos.getZ(i)+dl.z);
    if(H.ang[j]){const nw=new T.Vector3().fromBufferAttribute(nor,i).applyMatrix3(lin).normalize().applyAxisAngle(ax,H.ang[j]);const nl=nw.applyMatrix3(inv).normalize();nor.setXYZ(i,nl.x,nl.y,nl.z);}n++;}
  return n;}
window.__buildHandRelax=function(cfg,H){const T=window.__toonT,v=flareInspector.viewer,m=v.motion;
  const o=v.coach.getObjectByName('Coach_Body');const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bs=o.skeleton.bones;
  const P=g.attributes.position,Nr=g.attributes.normal,D=g.attributes.aHandD,NN=g.attributes.aHandN;
  // mirror map left->right at rest (world rest positions, x mirrored)
  m.reset();v.coach.updateMatrixWorld(true);const q=new T.Vector3();const rest=i=>{o.getVertexPosition(i,q);return q.clone().applyMatrix4(o.matrixWorld);};const R=[];
  for(let i=0;i<P.count;i++){let w=0;for(let k=0;k<4;k++){const nm=bs[si.getComponent(i,k)].name;if(nm==='rightHand'||nm==='rightForearm')w+=sw.getComponent(i,k);}if(w>0.01)R.push([i,rest(i)]);}
  const HR={idx:[],d:[],ang:[],axis:[-H.axis[0],H.axis[1],H.axis[2]]};let maxMir=0;
  // every right-hand vertex (incl. split seam duplicates) takes the delta of its mirrored left twin
  const LP=H.idx.map(i=>{const p=rest(i);p.x=-p.x;return p;});
  for(const [k,r] of R){let bd=9,bj=-1;for(let j=0;j<LP.length;j++){const d=LP[j].distanceToSquared(r);if(d<bd){bd=d;bj=j;}}
    if(bj>=0&&Math.sqrt(bd)<0.0015){maxMir=Math.max(maxMir,Math.sqrt(bd));HR.idx.push(k);HR.d.push([-H.d[bj][0],H.d[bj][1],H.d[bj][2]]);HR.ang.push(-H.ang[bj]);}}
  // NB: Snow's position/normal attributes are quantized (normalized ints): always go through getX/setXYZ, never .array
  const snap=A=>{const o=new Float32Array(A.count*3);for(let i=0;i<A.count;i++){o[i*3]=A.getX(i);o[i*3+1]=A.getY(i);o[i*3+2]=A.getZ(i);}return o;};
  const P0=snap(P),N0=snap(Nr),PR=P.array.slice(),NR=Nr.array.slice();
  const rec=ids=>{for(const i of ids){D.setXYZ(i,P.getX(i)-P0[i*3],P.getY(i)-P0[i*3+1],P.getZ(i)-P0[i*3+2]);NN.setXYZ(i,Nr.getX(i)-N0[i*3],Nr.getY(i)-N0[i*3+1],Nr.getZ(i)-N0[i*3+2]);}
    P.array.set(PR);Nr.array.set(NR);};
  const nl=bakeHand(cfg,H,'left');rec(H.idx);const nr=bakeHand(cfg,HR,'right');rec(HR.idx);
  P.needsUpdate=true;Nr.needsUpdate=true;D.needsUpdate=true;NN.needsUpdate=true;m.reset();
  // CPU morph (the shader-side aHandD path did not show on screen; writing the quantized position/normal buffer does, as v7's bake)
  window.__relaxState={P0,N0,ids:{left:H.idx.slice(),right:HR.idx.slice()},cur:{left:0,right:0}};
  return {left:nl,right:nr,maxMirrorDistMm:+(maxMir*1000).toFixed(2)};};
window.__setRelax=function(l,r){const S=window.__relaxState;if(!S)return;const o=flareInspector.viewer.coach.getObjectByName('Coach_Body').geometry;const P=o.attributes.position,Nr=o.attributes.normal,D=o.attributes.aHandD,NN=o.attributes.aHandN;let ch=false;
  for(const [side,w] of [['left',l],['right',r]]){if(Math.abs(S.cur[side]-w)<1e-4)continue;S.cur[side]=w;ch=true;
    for(const i of S.ids[side]){P.setXYZ(i,S.P0[i*3]+w*D.getX(i),S.P0[i*3+1]+w*D.getY(i),S.P0[i*3+2]+w*D.getZ(i));
      let nx=S.N0[i*3]+w*NN.getX(i),ny=S.N0[i*3+1]+w*NN.getY(i),nz=S.N0[i*3+2]+w*NN.getZ(i);const L=Math.hypot(nx,ny,nz)||1;Nr.setXYZ(i,nx/L,ny/L,nz/L);}}
  if(ch){P.needsUpdate=true;Nr.needsUpdate=true;}return ch;};
