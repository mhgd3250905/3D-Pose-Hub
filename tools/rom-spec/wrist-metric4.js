function(){
// Wrist metric (elbow-twist r2, 2026-11-09 20:xx). metric2's wr only sees verts with UA+FA weight>=0.5 at 3/5 cm before the
// wrist, so it is blind to the forearm<->hand blend zone. Here: verts with FA+Hand weight>=0.5 (limb mesh), caliper min width
// on slices along the forearm axis at d = -0.03,-0.02,-0.01,0,+0.01 m from the wrist joint (neg = toward elbow), vs rest.
// Also wR5: 5th-pct per-vertex radius ratio (to current elbow->wrist axis vs rest) for verts within 3 cm before the wrist.
const T=window.__toonT,v=flareInspector.viewer;
const P=o=>o.getWorldPosition(new T.Vector3());
const MS=[];v.coach.traverse(o=>{if(o.isSkinnedMesh&&o.visible)MS.push(o);});const q=new T.Vector3();const D=[-0.03,-0.02,-0.01,0,0.01];
if(!window.__EW4){const S={};
  for(const s of ['left','right']){const fa=v.coach.getObjectByName(s+'Forearm'),h=v.coach.getObjectByName(s+'Hand');const idx=[];
    for(const m of MS){const g=m.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;const bi=[fa,h].map(b=>m.skeleton.bones.indexOf(b));if(bi[0]<0&&bi[1]<0)continue;
      for(let i=0;i<si.count;i++){let w=0;for(let k=0;k<4;k++)if(bi.includes(si.getComponent(i,k)))w+=sw.getComponent(i,k);if(w>=0.5)idx.push([m,i]);}}
    S[s]={fa,h,idx,meshes:MS.filter(m=>m.skeleton.bones.includes(h)).map(m=>m.name)};}
  window.__EW4={S,first:true};}
const X=__EW4,S=X.S;
const pts=x=>x.idx.map(([m,i])=>{m.getVertexPosition(i,q);return q.clone().applyMatrix4(m.matrixWorld);});
function meas(pE,pW,ps){const f=pW.clone().sub(pE).normalize();
  const b1=new T.Vector3().crossVectors(f,Math.abs(f.x)<0.9?new T.Vector3(1,0,0):new T.Vector3(0,0,1)).normalize(),b2=new T.Vector3().crossVectors(f,b1);
  const out=[];for(const d of D){const c=pW.clone().add(f.clone().multiplyScalar(d));const pr=[];
    for(const p of ps){const e=p.clone().sub(c);if(Math.abs(e.dot(f))>0.004)continue;const x=e.dot(b1),y=e.dot(b2);if(x*x+y*y>0.06*0.06)continue;pr.push([x,y]);}
    if(pr.length<8){out.push(null);continue;}
    let mn=9;for(let j=0;j<36;j++){const a=j*Math.PI/36,ca=Math.cos(a),sa=Math.sin(a);let lo=9,hi=-9;for(const [x,y] of pr){const t=x*ca+y*sa;if(t<lo)lo=t;if(t>hi)hi=t;}if(hi-lo<mn)mn=hi-lo;}
    out.push(+(mn*1000).toFixed(1));}
  const rad=ps.map(p=>{const e=p.clone().sub(pW);const h=e.dot(f);if(h>0||h<-0.03)return null;return e.sub(f.clone().multiplyScalar(h)).length();});
  return {w:out,rad};}
if(X.first){X.first=false;
  const bones=[];v.coach.traverse(o=>{if(o.isBone)bones.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]);});
  v.motion.reset();v.coach.updateMatrixWorld(true);MS.forEach(m=>m.skeleton.update());
  for(const x of Object.values(S)){const m=meas(P(x.fa),P(x.h),pts(x));x.ref=m.w;x.rad=m.rad;}
  for(const [o,a,b,c] of bones){o.position.copy(a);o.quaternion.copy(b);o.scale.copy(c);}v.coach.updateMatrixWorld(true);MS.forEach(m=>m.skeleton.update());}
const res={};
for(const [s,x] of Object.entries(S)){const m=meas(P(x.fa),P(x.h),pts(x));
  const r=m.w.map((z,i)=>z&&x.ref[i]?z/x.ref[i]:null);const rr=r.filter(z=>z!==null);
  const rv=[];m.rad.forEach((z,i)=>{if(z!==null&&x.rad[i]&&x.rad[i]>0.004)rv.push(z/x.rad[i]);});rv.sort((a,b)=>a-b);
  res[s]={wr4:rr.length?+Math.min(...rr).toFixed(3):null,wr4s:r.map(z=>z===null?null:+z.toFixed(3)),nPts:x.idx.length,mesh:x.meshes.join('|'),wR5:rv.length?+rv[Math.floor(rv.length*0.05)].toFixed(3):null};}
return res;}
