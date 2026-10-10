// prop clearance probe: node tools/probe.mjs specs/<id>.js tools/propclear.js [--js=ts.js with window.__TS=[t,...]]
// for each t (default [0,1,2,3]) applies the spec pose and reports, per body region (handL/handR/bone), the min signed distance (mm)
// of skinned vertices to the props' QA primitives (__props.qaPrims(): capsules / tori), plus elbow/knee angles and the lowest vertex.
const T=__toonT;const v=flareInspector.viewer;const out=[];const TS=window.__TS||[0,1,2,3];
const segD=(p,a,b)=>{const ab=b.clone().sub(a);const u=Math.max(0,Math.min(1,p.clone().sub(a).dot(ab)/ab.lengthSq()));return p.distanceTo(a.clone().addScaledVector(ab,u));};
const boxD=(p,c,ax,h)=>{const d=p.clone().sub(c);let o=0,i=-9;const q=[0,0,0];for(let k=0;k<3;k++){q[k]=Math.abs(d.dot(ax[k]))-h[k];}const mx=Math.max(...q);if(mx<0)return mx;return Math.hypot(...q.map(x=>Math.max(x,0)));};
const torD=(p,c,n,R)=>{const d=p.clone().sub(c);const h=d.dot(n);const q=d.clone().addScaledVector(n,-h);const rr=q.length();return Math.hypot(rr-R,h);};
for(const t of TS){__drill.applyAt(spec,t,null);v.coach.updateMatrixWorld(true);__props.update();
const prims=__props.qaPrims().map(q=>q.a?{a:new T.Vector3(...q.a),b:new T.Vector3(...q.b),r:q.r}:q.ax?{c:new T.Vector3(...q.c),ax:q.ax.map(a=>new T.Vector3(...a).normalize()),h:q.h}:{c:new T.Vector3(...q.c),n:new T.Vector3(...q.n).normalize(),R:q.R,r:q.r});
const p=new T.Vector3();const best={};let minY=9;
v.coach.traverse(o=>{if(!o.isSkinnedMesh||!o.visible)return;const g=o.geometry,n=g.attributes.position.count,si=g.attributes.skinIndex,sw=g.attributes.skinWeight,bs=o.skeleton.bones;
for(let i=0;i<n;i++){o.getVertexPosition(i,p);p.applyMatrix4(o.matrixWorld);if(p.y<minY)minY=p.y;let dm=9;
 for(const q of prims){const d=q.a?segD(p,q.a,q.b)-q.r:q.ax?boxD(p,q.c,q.ax,q.h):torD(p,q.c,q.n,q.R)-q.r;if(d<dm)dm=d;}
 if(dm>0.08)continue;let bi=-1,bw=-1;for(let k=0;k<4;k++)if(sw.getComponent(i,k)>bw){bw=sw.getComponent(i,k);bi=si.getComponent(i,k);}
 const bn=bs[bi].name.replace(/mixamorig:?/,'');const key=/Hand|Thumb|Index|Middle|Ring|Pinky/.test(bn)?(bn.startsWith('Left')||bn.startsWith('left')?'handL':'handR'):bn;
 if(!best[key]||dm<best[key][0])best[key]=[dm,o.name];}});
const M=v.motion.getMetrics(),J=Object.assign({},M.joints,__drill._jo||{});const V=a=>new T.Vector3(...a);const ang=(a,b,c)=>V(J[a]).sub(V(J[b])).angleTo(V(J[c]).sub(V(J[b])))*180/Math.PI;
const r={t,minY:+(minY*1000).toFixed(1),el:[+ang('rightShoulder','rightElbow','rightWrist').toFixed(1),+ang('leftShoulder','leftElbow','leftWrist').toFixed(1)],
 kn:[+ang('rightHip','rightKnee','rightAnkle').toFixed(1),+ang('leftHip','leftKnee','leftAnkle').toFixed(1)],
 sh:J.shoulderCenter.map(x=>+x.toFixed(3)),pel:J.pelvis.map(x=>+x.toFixed(3)),wR:J.rightWrist.map(x=>+x.toFixed(3)),warn:(M.warnings||[]).length,clr:{}};
for(const [k,[d,o]] of Object.entries(best))r.clr[k]=+(d*1000).toFixed(1);
if(window.__EXTRA)Object.assign(r,window.__EXTRA(J));out.push(r);}
return out;
