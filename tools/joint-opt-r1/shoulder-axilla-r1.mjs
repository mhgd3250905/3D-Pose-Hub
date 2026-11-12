// Shoulder axilla weight-overlay prototype (joint-opt r1, stage B step 1). Default OFF, opt-in only.
//
// Diagnosis (see shoulder-axilla-r1.md): the shared torso mesh V3_Head_Neck_Torso_Shared_R26 carries a
// rest-only stitch strip in the axilla (edges 3-8 mm long at motion.reset(), 50-70 mm in the T-pose bind)
// with an UpperArm weight cliff (|dw| up to 0.87 across one edge). Raising the arm past ~120 deg pulls the
// two sides of the strip back to their bind separation: stretched slivers that fold/invert (anterior axilla).
//
// Correction: local weight overlay restricted to that strip.
//   install time: pick edges near each UpperArm joint (rest distance <= radius) that are either a weight
//   cliff (max |dw| over bones > cliff) or a stitch (bind length > stitchRatio * rest length), with UpperArm
//   weight > uaMin; grow `rings` rings (inside radius); diffuse the full bone-weight vectors there
//   (`iters` Jacobi steps, lambda, region boundary fixed); re-solve each region vertex's bind position and
//   normal so the overlay reproduces the reset pose exactly (rest geometry unchanged).
//   per frame (scene.onBeforeRender, only when enabled): blend the original LBS and the overlay LBS by a
//   continuous elevation gate smoothstep(elevStartDeg, elevFullDeg, elevation) per side, write the region's
//   bind-space position/normal so the GPU (original skin weights) draws the blended target, and restore the
//   original attribute values after the outermost renderer.render.
// No bone, weight attribute, index, material, hand, manifest or asset change. Vertices outside the region are
// never written. With enabled=false the hooks return before touching anything.
//
// Usage (Node, after openScene):
//   import {install} from './tools/joint-opt-r1/shoulder-axilla-r1.mjs';
//   await install(page,{enabled:true});          // or enabled:false, then window.__shoulderAxillaR1.enabled=true
//   page.evaluate(()=>__shoulderAxillaR1.detach()) // full rollback
export const VERSION='0.1.0-r1';
export const DEFAULTS=Object.freeze({mesh:'V3_Head_Neck_Torso_Shared_R26',radius:0.12,cliff:0.3,stitchRatio:3,uaMin:0.05,rings:5,iters:60,lambda:0.5,elevStartDeg:90,elevFullDeg:120,weldMm:0.001});

export function pageInstall(o){
  const v=flareInspector.viewer;
  if(window.__shoulderAxillaR1)throw Error('shoulder-axilla-r1 already installed');
  let mesh=null;v.scene.traverse(x=>{if(x.isSkinnedMesh&&x.name===o.mesh&&!mesh)mesh=x;});
  if(!mesh)throw Error('shoulder-axilla-r1: mesh '+o.mesh+' not found');
  const g=mesh.geometry,A=g.attributes,pos=A.position,nor=A.normal,si=A.skinIndex,sw=A.skinWeight,nv=pos.count;
  if(!g.index)throw Error('shoulder-axilla-r1: indexed geometry required');
  const bones=mesh.skeleton.bones,nb=bones.length,boneIdx=n=>{const i=bones.findIndex(b=>b.name===n);if(i<0)throw Error('missing bone '+n);return i;};
  const named=n=>{let r=null;v.coach.traverse(x=>{if(x.isBone&&x.name===n&&!r)r=x;});if(!r)throw Error('missing bone '+n);return r;};
  const J={neck:named('neck'),pelvis:named('pelvis'),left:[named('leftUpperArm'),named('leftForearm')],right:[named('rightUpperArm'),named('rightForearm')]};
  // ---- 4x4 helpers (column-major like three) ----
  const bind=mesh.bindMatrix.elements.slice(),bindInv=mesh.bindMatrixInverse.elements.slice();
  const mul=(a,b,out=new Float64Array(16))=>{for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];out[c*4+r]=s;}return out;};
  const boneLocal=()=>{mesh.skeleton.update();const bm=mesh.skeleton.boneMatrices,out=new Float64Array(nb*16),t=new Float64Array(16);
    for(let b=0;b<nb;b++){mul(bindInv,mul(bm.subarray(b*16,b*16+16),bind,t),out.subarray(b*16,b*16+16));}return out;};
  const xf=(M,o_,x,y,z,w)=>[M[o_]*x+M[o_+4]*y+M[o_+8]*z+M[o_+12]*w,M[o_+1]*x+M[o_+5]*y+M[o_+9]*z+M[o_+13]*w,M[o_+2]*x+M[o_+6]*y+M[o_+10]*z+M[o_+14]*w];
  const inv3=(M)=>{const a=M[0],b=M[4],c=M[8],d=M[1],e=M[5],f=M[9],gg=M[2],h=M[6],i=M[10];const A0=e*i-f*h,B0=-(d*i-f*gg),C0=d*h-e*gg,det=a*A0+b*B0+c*C0;
    if(!(Math.abs(det)>1e-14))throw Error('shoulder-axilla-r1: singular skin matrix');const s=1/det;
    return [A0*s,-(b*i-c*h)*s,(b*f-c*e)*s,B0*s,(a*i-c*gg)*s,-(a*f-c*d)*s,C0*s,-(a*h-b*gg)*s,(a*e-b*d)*s];}; // inverse of the upper 3x3, row-major
  const blend=(BL,ws,out)=>{out.fill(0);for(const [b,w] of ws){const o_=b*16;for(let k=0;k<16;k++)out[k]+=w*BL[o_+k];}return out;};
  const origWeights=i=>{const r=[];for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>0)r.push([si.getComponent(i,k),w]);}return r;};
  // ---- rest (motion.reset) reference, pose restored afterwards ----
  const pose=v.motion.capturePose(),saved=[];v.coach.traverse(b=>{if(b.isBone)saved.push([b,b.position.clone(),b.quaternion.clone(),b.scale.clone()]);});
  let B0,restP,restN,restJ;
  try{
    v.motion.reset();v.coach.updateMatrixWorld(true);mesh.updateMatrixWorld(true);B0=boneLocal();
    restP=new Float64Array(nv*3);restN=new Float64Array(nv*3);const M=new Float64Array(16);
    for(let i=0;i<nv;i++){blend(B0,origWeights(i),M);const p=xf(M,0,pos.getX(i),pos.getY(i),pos.getZ(i),1),n=xf(M,0,nor.getX(i),nor.getY(i),nor.getZ(i),0);
      restP.set(p,i*3);const l=Math.hypot(...n)||1;restN.set([n[0]/l,n[1]/l,n[2]/l],i*3);}
    const wp=b=>{const e=b.matrixWorld.elements;return [e[12],e[13],e[14]];};
    restJ={left:wp(J.left[0]),right:wp(J.right[0])};
    // UpperArm joint in mesh-local coordinates (mesh world is identity in this rig, but do it properly)
    const mi=mesh.matrixWorld.clone().invert().elements;for(const s of ['left','right'])restJ[s]=xf(mi,0,...restJ[s],1);
  }finally{v.motion.applyPose(pose);for(const [b,p,q,s]of saved){b.position.copy(p);b.quaternion.copy(q);b.scale.copy(s);}v.coach.updateMatrixWorld(true);}
  // bind-space length scale (uniform bone scale of this rig)
  const sc=Math.cbrt(Math.abs((()=>{const M=B0.subarray(boneIdx('torso')*16);return M[0]*(M[5]*M[10]-M[9]*M[6])-M[4]*(M[1]*M[10]-M[9]*M[2])+M[8]*(M[1]*M[6]-M[5]*M[2]);})()));
  // ---- weld by rest position ----
  const q=1/(o.weldMm*1e-3),key=new Map(),wk=new Int32Array(nv),rep=[];
  for(let i=0;i<nv;i++){const k=Math.round(restP[i*3]*q)+','+Math.round(restP[i*3+1]*q)+','+Math.round(restP[i*3+2]*q);let id=key.get(k);if(id===undefined){id=rep.length;key.set(k,id);rep.push(i);}wk[i]=id;}
  const nw=rep.length;
  // ---- welded edges over drawn triangles ----
  const idx=g.index.array,start=g.drawRange.start,count=Math.min(idx.length-start,Number.isFinite(g.drawRange.count)?g.drawRange.count:Infinity),es=new Set(),E=[];
  for(let t=start;t+2<start+count;t+=3)for(const [a,b]of [[idx[t],idx[t+1]],[idx[t+1],idx[t+2]],[idx[t+2],idx[t]]]){let x=wk[a],y=wk[b];if(x===y)continue;if(x>y)[x,y]=[y,x];const k=x*nw+y;if(!es.has(k)){es.add(k);E.push([x,y]);}}
  const nbr=Array.from({length:nw},()=>[]);for(const [a,b]of E){nbr[a].push(b);nbr[b].push(a);}
  const W=i=>{const m=new Map();for(const [b,w]of origWeights(rep[i]))m.set(b,(m.get(b)??0)+w);return m;};
  const sides={};
  for(const side of ['left','right']){
    const ua=boneIdx(side+'UpperArm'),c=restJ[side],near=new Uint8Array(nw),Wm=new Array(nw);
    for(let i=0;i<nw;i++){const r=rep[i];near[i]=Math.hypot(restP[r*3]-c[0],restP[r*3+1]-c[1],restP[r*3+2]-c[2])<=o.radius?1:0;}
    const wOf=i=>Wm[i]??(Wm[i]=W(i));
    let reg=new Uint8Array(nw),seeds=0;
    for(const [a,b]of E){if(!near[a]||!near[b])continue;const wa=wOf(a),wb=wOf(b);
      if(Math.max(wa.get(ua)??0,wb.get(ua)??0)<=o.uaMin)continue;
      let dW=0;for(const k of new Set([...wa.keys(),...wb.keys()]))dW=Math.max(dW,Math.abs((wa.get(k)??0)-(wb.get(k)??0)));
      const ra=rep[a],rb=rep[b],lr=Math.hypot(restP[ra*3]-restP[rb*3],restP[ra*3+1]-restP[rb*3+1],restP[ra*3+2]-restP[rb*3+2]);
      const lb=sc*Math.hypot(pos.getX(ra)-pos.getX(rb),pos.getY(ra)-pos.getY(rb),pos.getZ(ra)-pos.getZ(rb));
      if(dW>o.cliff||lb>o.stitchRatio*Math.max(lr,1e-9)){reg[a]=reg[b]=1;seeds++;}}
    for(let k=0;k<o.rings;k++){const nx=reg.slice();for(const [a,b]of E){if(reg[a])nx[b]=1;if(reg[b])nx[a]=1;}reg=nx;}
    for(let i=0;i<nw;i++)if(!near[i])reg[i]=0;
    const ids=[];for(let i=0;i<nw;i++)if(reg[i])ids.push(i);
    // Jacobi diffusion of sparse weight vectors on region (boundary fixed)
    let cur=new Map();for(const i of ids)cur.set(i,wOf(i));const get=i=>cur.get(i)??wOf(i);
    for(let it=0;it<o.iters;it++){const nx=new Map();
      for(const i of ids){const wi=get(i),acc=new Map(),ns=nbr[i];for(const j of ns)for(const [b,w]of get(j))acc.set(b,(acc.get(b)??0)+w);
        const out=new Map();for(const b of new Set([...wi.keys(),...acc.keys()])){const x=wi.get(b)??0,a=ns.length?(acc.get(b)??0)/ns.length:x;out.set(b,x+o.lambda*(a-x));}nx.set(i,out);}
      cur=nx;}
    // normalise, drop tiny, re-solve bind position/normal against the reset pose
    const verts=[],M=new Float64Array(16);
    for(const i of ids){let w=[...cur.get(i)].filter(([,x])=>x>=1e-6);const s=w.reduce((t,[,x])=>t+x,0);w=w.map(([b,x])=>[b,x/s]);
      blend(B0,w,M);verts.push({wid:i,w,R:inv3(M),t:[M[12],M[13],M[14]]});}
    // map welded ids back to every vertex copy
    const members=new Map();for(let r=0;r<nv;r++)if(reg[wk[r]]){if(!members.has(wk[r]))members.set(wk[r],[]);members.get(wk[r]).push(r);}
    const list=[];
    for(const {wid,w,R,t}of verts){for(const r of members.get(wid)){const p=[restP[r*3]-t[0],restP[r*3+1]-t[1],restP[r*3+2]-t[2]],n=[restN[r*3],restN[r*3+1],restN[r*3+2]];
      const ap=v3=>[R[0]*v3[0]+R[1]*v3[1]+R[2]*v3[2],R[3]*v3[0]+R[4]*v3[1]+R[5]*v3[2],R[6]*v3[0]+R[7]*v3[1]+R[8]*v3[2]];
      const rb=ap(p),nn=ap(n),l=Math.hypot(...nn)||1;list.push({i:r,w,rb,nb:[nn[0]/l,nn[1]/l,nn[2]/l],orig:origWeights(r)});}}
    sides[side]={ua,seedEdges:seeds,welded:ids.length,list};
  }
  // ---- rest self-check: overlay at reset pose reproduces rest positions ----
  let restErrMm=0;{const M=new Float64Array(16);for(const s of Object.values(sides))for(const e of s.list){blend(B0,e.w,M);const p=xf(M,0,...e.rb,1);restErrMm=Math.max(restErrMm,1e3*Math.hypot(p[0]-restP[e.i*3],p[1]-restP[e.i*3+1],p[2]-restP[e.i*3+2]));}}
  if(restErrMm>1e-3)throw Error('shoulder-axilla-r1: rest reproduction error '+restErrMm+' mm');
  // ---- runtime ----
  const ss=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
  const wpos=b=>{const e=b.matrixWorld.elements;return [e[12],e[13],e[14]];};
  function elevation(side){const n=wpos(J.neck),p=wpos(J.pelvis),u0=wpos(J[side][0]),u1=wpos(J[side][1]);const d=[p[0]-n[0],p[1]-n[1],p[2]-n[2]],u=[u1[0]-u0[0],u1[1]-u0[1],u1[2]-u0[2]];
    const c=(d[0]*u[0]+d[1]*u[1]+d[2]*u[2])/(Math.hypot(...d)*Math.hypot(...u));return Math.acos(Math.min(1,Math.max(-1,c)))*180/Math.PI;}
  const previousBefore=v.scene.onBeforeRender,previousRender=v.renderer.render;let changed=null,depth=0;
  function restore(){if(!changed)return;for(const [i,px,py,pz,nx,ny,nz]of changed){pos.setXYZ(i,px,py,pz);nor.setXYZ(i,nx,ny,nz);}pos.needsUpdate=nor.needsUpdate=true;changed=null;}
  function update(){
    if(changed)throw Error('shoulder-axilla-r1 still applied');
    v.coach.updateMatrixWorld(true);const gate={},diag={sides:{},written:0,maxMoveMm:0};
    for(const s of ['left','right']){const e=elevation(s);gate[s]=ss((e-o.elevStartDeg)/(o.elevFullDeg-o.elevStartDeg));diag.sides[s]={elevationDeg:e,gate:gate[s]};}
    if(!(gate.left>0||gate.right>0)){api.last=diag;return;}
    mesh.updateMatrixWorld(true);const BL=boneLocal(),Mo=new Float64Array(16),Mn=new Float64Array(16);changed=[];
    for(const s of ['left','right']){const gt=gate[s];if(!(gt>0))continue;
      for(const e of sides[s].list){const i=e.i,px=pos.getX(i),py=pos.getY(i),pz=pos.getZ(i),nx=nor.getX(i),ny=nor.getY(i),nz=nor.getZ(i);
        blend(BL,e.orig,Mo);blend(BL,e.w,Mn);
        const po=xf(Mo,0,px,py,pz,1),pn=xf(Mn,0,...e.rb,1),t=[po[0]+gt*(pn[0]-po[0]),po[1]+gt*(pn[1]-po[1]),po[2]+gt*(pn[2]-po[2])];
        const no=xf(Mo,0,nx,ny,nz,0),nn=xf(Mn,0,...e.nb,0),lo=Math.hypot(...no)||1,ln=Math.hypot(...nn)||1;
        const nt=[no[0]/lo+gt*(nn[0]/ln-no[0]/lo),no[1]/lo+gt*(nn[1]/ln-no[1]/lo),no[2]/lo+gt*(nn[2]/ln-no[2]/lo)];
        const R=inv3(Mo),d=[t[0]-Mo[12],t[1]-Mo[13],t[2]-Mo[14]];
        const ap=v3=>[R[0]*v3[0]+R[1]*v3[1]+R[2]*v3[2],R[3]*v3[0]+R[4]*v3[1]+R[5]*v3[2],R[6]*v3[0]+R[7]*v3[1]+R[8]*v3[2]];
        const lp=ap(d),ln2=ap(nt),l2=Math.hypot(...ln2)||1;
        changed.push([i,px,py,pz,nx,ny,nz]);pos.setXYZ(i,lp[0],lp[1],lp[2]);nor.setXYZ(i,ln2[0]/l2,ln2[1]/l2,ln2[2]/l2);
        diag.maxMoveMm=Math.max(diag.maxMoveMm,1e3*Math.hypot(t[0]-po[0],t[1]-po[1],t[2]-po[2]));diag.written++;}}
    pos.needsUpdate=nor.needsUpdate=true;api.last=diag;
  }
  function before(...args){previousBefore?.apply(this,args);if(api.enabled)update();}
  function render(...args){const outer=depth++===0;try{return previousRender.apply(this,args);}finally{depth--;if(outer)restore();}}
  const api=window.__shoulderAxillaR1={version:o.version,enabled:!!o.enabled,last:null,
    config:{...o,mesh:mesh.name,restReproductionErrorMm:restErrMm,bindScale:sc,sides:Object.fromEntries(Object.entries(sides).map(([s,x])=>[s,{seedEdges:x.seedEdges,weldedVertices:x.welded,vertices:x.list.length}])),
      bonesChanged:false,weightsAttributeChanged:false,indexChanged:false,reviewed:false},
    vertexIds(){return Object.fromEntries(Object.entries(sides).map(([s,x])=>[s,x.list.map(e=>e.i)]));},
    detach(){if(depth)throw Error('Cannot detach during render');if(v.scene.onBeforeRender!==before||v.renderer.render!==render)throw Error('Detach later hooks first');restore();v.scene.onBeforeRender=previousBefore;v.renderer.render=previousRender;delete window.__shoulderAxillaR1;}};
  v.scene.onBeforeRender=before;v.renderer.render=render;
  return api.config;
}

export async function install(page,options={}){
  const o={...DEFAULTS,...options,version:VERSION};
  return page.evaluate(([src,opts])=>{(0,eval)('window.__shoulderAxillaR1Install='+src);try{return window.__shoulderAxillaR1Install(opts);}finally{delete window.__shoulderAxillaR1Install;}},[pageInstall.toString(),o]);
}
