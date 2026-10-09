// v4 mannequin head: the real head + short neck stub of our muscle-viewer model
// (public/anatomy/mannequin-reference.glb, design/mannequin-v2; head bit-identical to fitness-reference.glb),
// cut on a horizontal ring below the jaw (h4/extract.py -> window.__srcHead), scaled/placed on Snow's head bone in
// the rest pose and skinned 100% to the head bone. Snow's hair/eyes/mouth are hidden; Snow's old head + upper neck
// skin (Mesh001) is reshaped: just below the joint it flares to the stub's ring, above it it is tucked inside.
window.__head4Params = {
  smoothBins:30,
  y0:1.438, sTop:[-0.7,0.15], sBot:[-4,0], inset:0.0004, cavCut:0.008,
  s:1.05,            // source -> coach scale
  yJ:1.479,          // coach rest height of the cut ring (joint)
  zC:0.006,          // coach z of the ring centre
  rotX:0,            // extra pitch (deg, + = nod down) about the ring centre
  band:0.045, full:0.01, hold:0.025, nband:0.015, lap:0, gate:[1.25,1.7],        // Snow neck morph band below the joint
  tuck:0.90,         // Snow skin above the joint is pushed to this fraction of the stub radius
  under:1.006, lip:0.005, lipK:0, smoothN:false,       // Snow ring at the joint = this fraction of the stub ring (stub edge sits just proud)
  topClamp:1.69,     // Snow skin never above this
  cavK:0.22, cav0:1.2e-4, cav1:6e-4,   // crisp detail lines: darken concave creases
};
window.__mannequinHead4 = function(over){
  const T=window.__toonT,v=flareInspector.viewer;const P=Object.assign({},window.__head4Params,over||{});const H=window.__srcHead;
  const sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x);};
  const m=v.motion;m.reset();v.coach.updateMatrixWorld(true);
  const report={P};let host=null;
  // --- source -> coach rest transform
  const SP=H.pos,ns=SP.length/3;let cx=0,cz=0;for(const i of H.bnd){cx+=SP[i*3];cz+=SP[i*3+2];}cx/=H.bnd.length;cz/=H.bnd.length;
  const piv=new T.Vector3(0,H.cut,cz);const tgt=new T.Vector3(0,P.yJ,P.zC);
  const R=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),P.rotX*Math.PI/180);
  const xf=(x,y,z,o)=>o.set(x,y,z).sub(piv).multiplyScalar(P.s).applyQuaternion(R).add(tgt);
  // stub ring radius by angle (coach space, about (0,zC))
  const NB=180,rStub=new Float32Array(NB),cntB=new Float32Array(NB);const w=new T.Vector3();
  for(const i of H.bnd){xf(SP[i*3],SP[i*3+1],SP[i*3+2],w);const a=Math.atan2(w.z-P.zC,w.x),r=Math.hypot(w.x,w.z-P.zC);
    const k=((Math.round((a+Math.PI)/(2*Math.PI)*NB))%NB+NB)%NB;rStub[k]=Math.max(rStub[k],r);cntB[k]++;}
  for(let it=0;it<NB;it++)for(let k=0;k<NB;k++)if(!cntB[k]){const a=rStub[(k+NB-1)%NB],b=rStub[(k+1)%NB];if(a&&b){rStub[k]=(a+b)/2;cntB[k]=.5;}else if(a||b){rStub[k]=a||b;cntB[k]=.5;}}
  const rAt=a=>{const f=(a+Math.PI)/(2*Math.PI)*NB;const k0=Math.floor(f),t=f-k0;return rStub[((k0%NB)+NB)%NB]*(1-t)+rStub[((k0+1)%NB+NB)%NB]*t;};
  const nB=[];for(let k=0;k<NB;k++)nB.push(new T.Vector3());
  for(const i of H.bnd){xf(SP[i*3],SP[i*3+1],SP[i*3+2],w);const a=Math.atan2(w.z-P.zC,w.x);const k=((Math.round((a+Math.PI)/(2*Math.PI)*NB))%NB+NB)%NB;
    nB[k].add(new T.Vector3(H.nor[i*3],H.nor[i*3+1],H.nor[i*3+2]).applyQuaternion(R));}
  for(let it=0;it<NB;it++)for(let k=0;k<NB;k++)if(nB[k].lengthSq()<1e-9)nB[k].copy(nB[(k+1)%NB]).add(nB[(k+NB-1)%NB]);
  for(const x of nB)x.normalize();
  const nAt=a=>{const f=(a+Math.PI)/(2*Math.PI)*NB;const k0=Math.floor(f),t=f-k0;return nB[((k0%NB)+NB)%NB].clone().lerp(nB[((k0+1)%NB+NB)%NB],t).normalize();};
  const YB=0.003,NA=72;let yTop=-9;for(let i=0;i<ns;i++){xf(SP[i*3],SP[i*3+1],SP[i*3+2],w);yTop=Math.max(yTop,w.y);}
  const NY=Math.ceil((yTop-P.yJ)/YB)+1,rin=new Float32Array(NY*NA).fill(9);
  for(let i=0;i<ns;i++){xf(SP[i*3],SP[i*3+1],SP[i*3+2],w);const yi=Math.max(0,Math.min(NY-1,Math.floor((w.y-P.yJ)/YB)));const a=Math.atan2(w.z-P.zC,w.x),r=Math.hypot(w.x,w.z-P.zC);
    const ai=((Math.floor((a+Math.PI)/(2*Math.PI)*NA))%NA+NA)%NA;rin[yi*NA+ai]=Math.min(rin[yi*NA+ai],r);}
  // fill empty bins (top cap / sparse) from neighbours, then take min over a 3x3 neighbourhood (conservative)
  for(let it=0;it<40;it++)for(let yi=0;yi<NY;yi++)for(let ai=0;ai<NA;ai++){if(rin[yi*NA+ai]<9)continue;let b=9;for(const [dy,da] of [[0,1],[0,-1],[1,0],[-1,0]]){const y2=yi+dy;if(y2<0||y2>=NY)continue;b=Math.min(b,rin[y2*NA+((ai+da+NA)%NA)]);}if(b<9)rin[yi*NA+ai]=b;}
  const rin2=rin.slice();for(let yi=0;yi<NY;yi++)for(let ai=0;ai<NA;ai++){let b=9;for(let dy=-1;dy<=1;dy++)for(let da=-1;da<=1;da++){const y2=yi+dy;if(y2<0||y2>=NY)continue;b=Math.min(b,rin[y2*NA+((ai+da+NA)%NA)]);}rin2[yi*NA+ai]=b;}
  const rIn=(y,a)=>{const yi=Math.max(0,Math.min(NY-1,Math.floor((y-P.yJ)/YB)));const ai=((Math.floor((a+Math.PI)/(2*Math.PI)*NA))%NA+NA)%NA;return rin2[yi*NA+ai];};
  const inTop=yTop-0.03;
  report.ring={xHalf:+(rAt(0)).toFixed(4),zFront:+(P.zC+rAt(Math.PI/2)).toFixed(4),zBack:+(P.zC-rAt(-Math.PI/2)).toFixed(4)};
  // --- hide Snow's face parts
  const hide=/^(Mesh004|Coach_Eye_Glints|Coach_Brows|Coach_Hair|Coach_.*(Teeth|Gums)|Coach_Tongue)/;
  const skinA=(o,i,A,SK,BM)=>{SK.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;
    for(let k=0;k<4;k++){const ww=sw.getComponent(i,k);if(!ww)continue;const bi=si.getComponent(i,k);BM.multiplyMatrices(o.skeleton.bones[bi].matrixWorld,o.skeleton.boneInverses[bi]);for(let e=0;e<16;e++)SK.elements[e]+=ww*BM.elements[e];}
    return A.copy(o.matrixWorld).multiply(o.bindMatrixInverse).multiply(SK).multiply(o.bindMatrix);};
  const domHead=(o,i)=>{const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;let bi=-1,bw=-1;for(let k=0;k<4;k++)if(sw.getComponent(i,k)>bw){bw=sw.getComponent(i,k);bi=si.getComponent(i,k);}return o.skeleton.bones[bi].name==='head';};
  const metas=[];v.coach.traverse(o=>metas.push(o));const q=new T.Vector3(),n=new T.Vector3(),tmp=new T.Vector3();
  for(const o of metas){if(!o.isSkinnedMesh)continue;if(hide.test(o.name)){o.visible=false;continue;}
    if(!/^Mesh001/.test(o.name))continue;if(o.name==='Mesh001')host=o;
    if(o.name!=='Mesh001'){o.visible=false;continue;}
    const g=o.geometry,Pp=g.attributes.position,N=g.attributes.normal,cnt=Pp.count;
    const SK=new T.Matrix4(),BM=new T.Matrix4(),A=new T.Matrix4(),Ai=new T.Matrix4(),An=new T.Matrix3(),Ani=new T.Matrix3();let moved=0,tucked=0;const bw=new Float32Array(cnt);
    const y0=P.y0,yF=P.yJ;
    // pre-pass: Snow's original neck radius (inner/min = neck, not trapezius) at y0 and y0-12mm, per angle
    const NA2=72,rb0=new Float32Array(NA2).fill(9),rb1=new Float32Array(NA2).fill(9);const bin=a=>((Math.floor((a+Math.PI)/(2*Math.PI)*NA2))%NA2+NA2)%NA2;
    for(let i=0;i<cnt;i++){skinA(o,i,A,SK,BM);q.fromBufferAttribute(Pp,i).applyMatrix4(A);const a=Math.atan2(q.z-P.zC,q.x),r=Math.hypot(q.x,q.z-P.zC);
      if(Math.abs(q.y-y0)<0.003)rb0[bin(a)]=Math.min(rb0[bin(a)],r);if(Math.abs(q.y-(y0-0.012))<0.003)rb1[bin(a)]=Math.min(rb1[bin(a)],r);}
    const fillS=arr=>{for(let it=0;it<NA2;it++)for(let k=0;k<NA2;k++)if(arr[k]>=9){const a=arr[(k+NA2-1)%NA2],b=arr[(k+1)%NA2];if(a<9||b<9)arr[k]=Math.min(a,b);}
      for(let it=0;it<P.smoothBins;it++){const c=arr.slice();for(let k=0;k<NA2;k++)arr[k]=(c[(k+NA2-1)%NA2]+2*c[k]+c[(k+1)%NA2])/4;}};fillS(rb0);fillS(rb1);
    const bAt=(arr,a)=>{const f=(a+Math.PI)/(2*Math.PI)*NA2-0.5;const k0=Math.floor(f),t=f-k0;return arr[((k0%NA2)+NA2)%NA2]*(1-t)+arr[(((k0+1)%NA2)+NA2)%NA2]*t;};
    // stub slope just above the cut
    const r6=new Float32Array(NA2).fill(0);for(let j=0;j<ns;j++){xf(SP[j*3],SP[j*3+1],SP[j*3+2],w);if(w.y<P.yJ+0.004||w.y>P.yJ+0.008)continue;const a=Math.atan2(w.z-P.zC,w.x),r=Math.hypot(w.x,w.z-P.zC);r6[bin(a)]=Math.max(r6[bin(a)],r);}
    for(let it=0;it<NA2;it++)for(let k=0;k<NA2;k++)if(!r6[k]){const a=r6[(k+NA2-1)%NA2],b=r6[(k+1)%NA2];if(a||b)r6[k]=Math.max(a,b);}
    for(let it=0;it<P.smoothBins;it++){const c=r6.slice();for(let k=0;k<NA2;k++)r6[k]=(c[(k+NA2-1)%NA2]+2*c[k]+c[(k+1)%NA2])/4;}
    const cl=(x,a,b)=>Math.min(b,Math.max(a,x));
    const loft=(y,a)=>{const h=P.yJ-y0,t=cl((y-y0)/h,0,1);const r0=bAt(rb0,a),s0=cl((bAt(rb0,a)-bAt(rb1,a))/0.012,P.sBot[0],P.sBot[1]);
      const r1=rAt(a)-P.inset,s1=cl((bAt(r6,a)-rAt(a))/0.006,P.sTop[0],P.sTop[1]);
      const t2=t*t,t3=t2*t;const R=(2*t3-3*t2+1)*r0+(t3-2*t2+t)*h*s0+(-2*t3+3*t2)*r1+(t3-t2)*h*s1;
      const dR=((6*t2-6*t)*r0+(3*t2-4*t+1)*h*s0+(-6*t2+6*t)*r1+(3*t2-2*t)*h*s1)/h;return [R,dR];};
    report.loft={r0f:+bAt(rb0,Math.PI/2).toFixed(4),r0s:+bAt(rb0,0).toFixed(4),r0b:+bAt(rb0,-Math.PI/2).toFixed(4),r1f:+rAt(Math.PI/2).toFixed(4),r1b:+rAt(-Math.PI/2).toFixed(4)};
    const nL=(y,a)=>{const [R,dR]=loft(y,a);const e=1e-3;const dRa=(loft(y,a+e)[0]-loft(y,a-e)[0])/(2*e);
      const rad=new T.Vector3(Math.cos(a),0,Math.sin(a)),tan=new T.Vector3(-Math.sin(a),0,Math.cos(a));
      return rad.clone().addScaledVector(T&&new T.Vector3(0,1,0),-dR).addScaledVector(tan,-dRa/Math.max(R,1e-3)).normalize();};
    for(let i=0;i<cnt;i++){skinA(o,i,A,SK,BM);q.fromBufferAttribute(Pp,i).applyMatrix4(A);if(q.y>1.395&&q.y<=y0&&Math.hypot(q.x,q.z-P.zC)<0.13)bw[i]=sm(1.395,1.42,q.y);if(q.y<=y0)continue;
      const dx=q.x,dz=q.z-P.zC,a=Math.atan2(dz,dx),r=Math.hypot(dx,dz),rs=rAt(a);
      let rn=r,yn=q.y,nm=0;
      if(q.y<=P.yJ){ // morph band: Snow neck ring -> stub ring (prism); jaw / anything wider is clamped onto it
        const [RL]=loft(q.y,a);const gate=1-sm(P.gate[0]*RL,P.gate[1]*RL,r)*(1-sm(y0,P.yJ-0.02,q.y));
        if(domHead(o,i)&&r>RL){rn=RL*0.985;nm=1;} // Snow's jaw / chin: squash just inside the neck
        else {rn=r+(RL-r)*gate;nm=gate*sm(y0,y0+0.006,q.y);}
        if(nm>0){Ai.copy(A).invert();An.getNormalMatrix(A);Ani.copy(An).invert();
          tmp.fromBufferAttribute(N,i).applyMatrix3(An).normalize().lerp(nL(q.y,a),nm).normalize();const tb=sm(P.yJ-0.006,P.yJ,q.y);tmp.lerp(nAt(a),tb).normalize().applyMatrix3(Ani).normalize();N.setXYZ(i,tmp.x,tmp.y,tmp.z);nm=0;}
      }else{ // above the joint: tuck inside the new neck/head (per-height inner radius of the new head)
        yn=Math.min(q.y,inTop);const rI=yn<=P.yJ+P.lap?rs*P.under:Math.min(rs*0.97,rIn(yn,a)*(0.99+(P.tuck-0.99)*sm(P.yJ+P.lap,P.yJ+P.hold,yn)));rn=yn<=P.yJ+P.lap?rI:Math.min(r,rI);nm=r>rI?1-0.5*(1-sm(P.yJ,P.yJ+P.hold,yn)):0;tucked++;}
      bw[i]=q.y<=P.yJ?1:1-sm(P.yJ+0.004,P.yJ+0.012,q.y);
      if(nm>0){Ai.copy(A).invert();An.getNormalMatrix(A);Ani.copy(An).invert();
        tmp.fromBufferAttribute(N,i).applyMatrix3(An).normalize().lerp(nAt(a),nm).normalize().applyMatrix3(Ani).normalize();N.setXYZ(i,tmp.x,tmp.y,tmp.z);}
      if(Math.abs(rn-r)<1e-6&&yn===q.y)continue;
      const k=r>1e-6?rn/r:0;q.set(dx*k,yn,P.zC+dz*k);
      Ai.copy(A).invert();Pp.setXYZ(i,...q.applyMatrix4(Ai).toArray());
      moved++;}
    if(P.smoothN){ // smooth normals of the reshaped skin (welded by position so UV seams do not split them), blended in over the band
      const I=g.index,key=new Map(),wid=new Int32Array(cnt);for(let i=0;i<cnt;i++){const k=Math.round(Pp.getX(i)*1e5)+','+Math.round(Pp.getY(i)*1e5)+','+Math.round(Pp.getZ(i)*1e5);let id=key.get(k);if(id===undefined){id=key.size;key.set(k,id);}wid[i]=id;}
      const acc=new Float32Array(key.size*3);const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),e1=new T.Vector3(),e2=new T.Vector3();
      for(let t=0;t<I.count;t+=3){const i0=I.getX(t),i1=I.getX(t+1),i2=I.getX(t+2);if(!(bw[i0]||bw[i1]||bw[i2]))continue;a.fromBufferAttribute(Pp,i0);b.fromBufferAttribute(Pp,i1);c.fromBufferAttribute(Pp,i2);
        e1.subVectors(b,a);e2.subVectors(c,a);e1.cross(e2);for(const ii of [i0,i1,i2]){acc[wid[ii]*3]+=e1.x;acc[wid[ii]*3+1]+=e1.y;acc[wid[ii]*3+2]+=e1.z;}}
      for(let i=0;i<cnt;i++){if(!bw[i])continue;a.set(acc[wid[i]*3],acc[wid[i]*3+1],acc[wid[i]*3+2]);if(a.lengthSq()<1e-20)continue;a.normalize();
        b.fromBufferAttribute(N,i).lerp(a,bw[i]).normalize();N.setXYZ(i,b.x,b.y,b.z);}
    }
    Pp.needsUpdate=true;N.needsUpdate=true;g.computeBoundingSphere();g.computeBoundingBox();report[o.name]={moved,tucked,cnt};}
  {const o=v.coach.getObjectByName('Coach_Body');const g=o.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,I=g.index;const hd=new Set();
   for(let i=0;i<g.attributes.position.count;i++){let bi=-1,bw=-1;for(let k=0;k<4;k++)if(sw.getComponent(i,k)>bw){bw=sw.getComponent(i,k);bi=si.getComponent(i,k);}if(o.skeleton.bones[bi].name==='head')hd.add(i);}
   let dropped=0;for(let t=0;t<I.count;t+=3){const a=I.getX(t),b=I.getX(t+1),c=I.getX(t+2);if(hd.has(a)||hd.has(b)||hd.has(c)){I.setX(t+1,a);I.setX(t+2,a);dropped++;}}
   I.needsUpdate=true;report.Coach_Body={headVerts:hd.size,trisDropped:dropped};}
  // --- build the new head, bind-space positions, 100% head bone
  const hb=host.skeleton.bones.findIndex(b=>b.name==='head');
  const A=new T.Matrix4().copy(host.matrixWorld).multiply(host.bindMatrixInverse).multiply(new T.Matrix4().multiplyMatrices(host.skeleton.bones[hb].matrixWorld,host.skeleton.boneInverses[hb])).multiply(host.bindMatrix);
  const Ai=A.clone().invert(),Ani=new T.Matrix3().getNormalMatrix(A).invert();
  const pos=new Float32Array(ns*3),nor=new Float32Array(ns*3);let ymin=9,ymax=-9,zmax=-9,xmax=0;
  const tone=new T.Color(window.__toonCfg?.light||'#7b7e85'),cc=new T.Color();
  const Hh=Math.ceil(ns/1024),buf=new Float32Array(1024*Hh*4);
  for(let i=0;i<ns;i++){xf(SP[i*3],SP[i*3+1],SP[i*3+2],q);ymin=Math.min(ymin,q.y);ymax=Math.max(ymax,q.y);zmax=Math.max(zmax,q.z);xmax=Math.max(xmax,Math.abs(q.x));
    {const l=1-sm(0,P.lip,q.y-P.yJ);if(l>0){const k=1-P.lipK*l;q.x*=k;q.z=P.zC+(q.z-P.zC)*k;}}
    n.set(H.nor[i*3],H.nor[i*3+1],H.nor[i*3+2]).applyQuaternion(R);
    const c=P.cavK*sm(P.cav0,P.cav1,H.cav[i])*sm(P.yJ+P.cavCut*0.5,P.yJ+P.cavCut,q.y);buf[i*4]=1;buf[i*4+1]=-c;buf[i*4+2]=0;/* drill-anim: skin weight + cavity (colour from theme) */buf[i*4+3]=-sm(-0.15,-0.55,n.y)*(1-sm(P.yJ+0.07,P.yJ+0.10,q.y));
    q.applyMatrix4(Ai);pos.set([q.x,q.y,q.z],i*3);n.applyMatrix3(Ani).normalize();nor.set([n.x,n.y,n.z],i*3);}
  const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(pos,3));sg.setAttribute('normal',new T.BufferAttribute(nor,3));
  sg.setIndex(new T.BufferAttribute(new Uint32Array(H.idx),1));
  const skI=new Uint16Array(ns*4),skW=new Float32Array(ns*4);for(let i=0;i<ns;i++){skI[i*4]=hb;skW[i*4]=1;}
  sg.setAttribute('skinIndex',new T.BufferAttribute(skI,4));sg.setAttribute('skinWeight',new T.BufferAttribute(skW,4));
  const vt=new T.DataTexture(buf,1024,Hh,T.RGBAFormat,T.FloatType);vt.needsUpdate=true;vt.magFilter=vt.minFilter=T.NearestFilter;
  const mat=host.material.clone();const ob=host.material.onBeforeCompile;mat.onBeforeCompile=sh=>{ob(sh);sh.uniforms.uVT={value:vt};sh.uniforms.uFieldOn={value:0};sh.uniforms.uCollar={value:0};sh.uniforms.uMapGate={value:0};};mat.customProgramCacheKey=host.material.customProgramCacheKey;
  mat.side=T.FrontSide;
  const hm=new T.SkinnedMesh(sg,mat);hm.name='Toon_Mannequin_Head_v5';hm.frustumCulled=false;
  host.parent.add(hm);hm.position.copy(host.position);hm.quaternion.copy(host.quaternion);hm.scale.copy(host.scale);hm.updateMatrixWorld(true);
  hm.bind(host.skeleton,host.bindMatrix);
  report.head={verts:ns,tris:H.idx.length/3,headBone:hb,ymin:+ymin.toFixed(4),ymax:+ymax.toFixed(4),height:+(ymax-ymin).toFixed(4),zmax:+zmax.toFixed(4),xHalf:+xmax.toFixed(4)};
  return report;};
