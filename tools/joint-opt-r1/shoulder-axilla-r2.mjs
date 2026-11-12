// Shoulder axilla overlay r2 (joint-opt r1 line, stage B step 2). Default OFF, opt-in only. Does not modify r1.
//
// r2 = r1 positions (identical region, weight diffusion, rest-preserving bind re-solve and elevation gate)
//      + shading-normal repair inside the same region.
// Why (diagnosis-r2): after r1 the axilla geometry is smooth, but the region keeps the mesh's authored shading
// normals (r1 blends the original skinned normal with the overlay normal re-solved from the rest normal). In the
// stitch strip those normals deviate from the surface by ~40-60 deg (median, posed; whole mesh median ~1 deg), so the
// toon shading threshold breaks into jagged dark specks (lit side) / light streaks (shaded side): the residual
// "black fragments" under the armpit seen in the product-look A/B.
// r2: per frame, per side, the region's surface normal is recomputed from the blended (posed) target positions
// (area-weighted welded face normals, `normalSmooth` Jacobi passes inside the region) and mixed in with
// weight gate * fade, where fade ramps 0 -> 1 over `normalFadeRings` rings from the region boundary, so vertices at the
// border keep r1's normal and nothing outside the region is ever written.
// Gate 0 (arm below elevStartDeg, incl. rest) => r2 writes nothing => identical to OFF / not installed.
//
// Usage (Node, after openScene):
//   import {install} from './tools/joint-opt-r1/shoulder-axilla-r2.mjs';
//   await install(page,{enabled:false});  window.__shoulderAxillaR2.enabled=true/false;  __shoulderAxillaR2.detach()
export const VERSION='0.2.0-r2';
export const DEFAULTS=Object.freeze({mesh:'V3_Head_Neck_Torso_Shared_R26',radius:0.12,cliff:0.3,stitchRatio:3,uaMin:0.05,rings:5,iters:60,lambda:0.5,elevStartDeg:90,elevFullDeg:120,weldMm:0.001,normalRepair:true,normalSmooth:2,normalFadeRings:2,globalName:'__shoulderAxillaR2'});

export function pageInstall(o){
  const v=flareInspector.viewer;
  const GN=o.globalName;if(window[GN])throw Error('shoulder-axilla-r2 already installed');
  let mesh=null;v.scene.traverse(x=>{if(x.isSkinnedMesh&&x.name===o.mesh&&!mesh)mesh=x;});
  if(!mesh)throw Error('shoulder-axilla-r2: mesh '+o.mesh+' not found');
  const g=mesh.geometry,A=g.attributes,pos=A.position,nor=A.normal,si=A.skinIndex,sw=A.skinWeight,nv=pos.count;
  if(!g.index)throw Error('shoulder-axilla-r2: indexed geometry required');
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
    if(!(Math.abs(det)>1e-14))throw Error('shoulder-axilla-r2: singular skin matrix');const s=1/det;
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
    // ---- r2 normal-repair topology: faces touching the region, ring distance from the region boundary ----
    const dist=new Int32Array(nw).fill(0);let front=[];
    for(const i of ids){if(nbr[i].some(j=>!reg[j])){dist[i]=1;front.push(i);}}
    for(let d=2;front.length;d++){const nx=[];for(const i of front)for(const j of nbr[i])if(reg[j]&&!dist[j]){dist[j]=d;nx.push(j);}front=nx;}
    const fade=new Map();for(const i of ids)fade.set(i,dist[i]?Math.min(1,(dist[i]-1)/Math.max(1,o.normalFadeRings)):1);
    const faces=[];for(let t=start;t+2<start+count;t+=3){const a=idx[t],b=idx[t+1],c=idx[t+2];if(reg[wk[a]]||reg[wk[b]]||reg[wk[c]])faces.push(a,b,c);}
    const outsideRaw=[...new Set(faces.filter(r=>!reg[wk[r]]))];
    const rnbr=new Map();for(const i of ids)rnbr.set(i,nbr[i].filter(j=>reg[j]));
    sides[side]={ua,seedEdges:seeds,welded:ids.length,list,reg,normal:{faces:Int32Array.from(faces),outsideRaw,fade,rnbr,ids,maxRing:Math.max(0,...ids.map(i=>dist[i]))}};
  }
  // ---- rest self-check: overlay at reset pose reproduces rest positions ----
  let restErrMm=0;{const M=new Float64Array(16);for(const s of Object.values(sides))for(const e of s.list){blend(B0,e.w,M);const p=xf(M,0,...e.rb,1);restErrMm=Math.max(restErrMm,1e3*Math.hypot(p[0]-restP[e.i*3],p[1]-restP[e.i*3+1],p[2]-restP[e.i*3+2]));}}
  if(restErrMm>1e-3)throw Error('shoulder-axilla-r2: rest reproduction error '+restErrMm+' mm');
  // ---- install-time diagnostics (read-only): rest shading-normal vs rest surface normal; left/right region symmetry ----
  function restNormalDeviation(){const Gs=new Map();for(let t=start;t+2<start+count;t+=3){const a=idx[t],b=idx[t+1],c=idx[t+2];
      const A=[restP[a*3],restP[a*3+1],restP[a*3+2]],B=[restP[b*3],restP[b*3+1],restP[b*3+2]],C=[restP[c*3],restP[c*3+1],restP[c*3+2]];
      const u=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],w=[C[0]-A[0],C[1]-A[1],C[2]-A[2]],n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
      for(const r of [a,b,c]){const k=wk[r];const g=Gs.get(k)||[0,0,0];g[0]+=n[0];g[1]+=n[1];g[2]+=n[2];Gs.set(k,g);}}
    const dev=r=>{const g=Gs.get(wk[r]);if(!g)return null;const l=Math.hypot(...g)||1;const d=(g[0]*restN[r*3]+g[1]*restN[r*3+1]+g[2]*restN[r*3+2])/l;return Math.acos(Math.min(1,Math.max(-1,d)))*180/Math.PI;};
    const q=(arr)=>{arr=arr.filter(x=>x!==null).sort((x,y)=>x-y);const p=f=>+arr[Math.min(arr.length-1,Math.floor(f*arr.length))].toFixed(1);return arr.length?{p50:p(.5),p90:p(.9),n:arr.length}:null;};
    const all=[];for(let r=0;r<nv;r+=7)all.push(dev(r));
    return {wholeMeshSample:q(all),left:q(sides.left.list.map(e=>dev(e.i))),right:q(sides.right.list.map(e=>dev(e.i)))};}
  function symmetry(){ // mirror x of each right-region vertex onto the left region (rest, mesh-local)
    const L=sides.left.list.map(e=>e.i),Rr=sides.right.list.map(e=>e.i);let hit=0;const Ls=new Set();
    const key=(x,y,z)=>Math.round(x*1e3)+','+Math.round(y*1e3)+','+Math.round(z*1e3);for(const r of L)Ls.add(key(restP[r*3],restP[r*3+1],restP[r*3+2]));
    const cx=(restJ.left[0]+restJ.right[0])/2;
    for(const r of Rr){const x=2*cx-restP[r*3],y=restP[r*3+1],z=restP[r*3+2];let ok=false;for(let dx=-1;dx<=1&&!ok;dx++)for(let dy=-1;dy<=1&&!ok;dy++)for(let dz=-1;dz<=1&&!ok;dz++)ok=Ls.has(key(x+dx*1e-3,y+dy*1e-3,z+dz*1e-3));if(ok)hit++;}
    return {rightVertices:Rr.length,leftVertices:L.length,rightMirroredOntoLeftWithin1mm:hit,seedEdges:{left:sides.left.seedEdges,right:sides.right.seedEdges}};}
  // ---- runtime ----
  const ss=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x);};
  const wpos=b=>{const e=b.matrixWorld.elements;return [e[12],e[13],e[14]];};
  function elevation(side){const n=wpos(J.neck),p=wpos(J.pelvis),u0=wpos(J[side][0]),u1=wpos(J[side][1]);const d=[p[0]-n[0],p[1]-n[1],p[2]-n[2]],u=[u1[0]-u0[0],u1[1]-u0[1],u1[2]-u0[2]];
    const c=(d[0]*u[0]+d[1]*u[1]+d[2]*u[2])/(Math.hypot(...d)*Math.hypot(...u));return Math.acos(Math.min(1,Math.max(-1,c)))*180/Math.PI;}
  const previousBefore=v.scene.onBeforeRender,previousRender=v.renderer.render;let changed=null,depth=0;
  function restore(){if(!changed)return;for(const [i,px,py,pz,nx,ny,nz]of changed){pos.setXYZ(i,px,py,pz);nor.setXYZ(i,nx,ny,nz);}pos.needsUpdate=nor.needsUpdate=true;changed=null;}
  function update(){
    if(changed)throw Error('shoulder-axilla-r2 still applied');
    v.coach.updateMatrixWorld(true);const gate={},diag={sides:{},written:0,maxMoveMm:0,normalRepair:!!o.normalRepair,maxNormalChangeDeg:0};
    for(const s of ['left','right']){const e=elevation(s);gate[s]=ss((e-o.elevStartDeg)/(o.elevFullDeg-o.elevStartDeg));diag.sides[s]={elevationDeg:e,gate:gate[s]};}
    if(!(gate.left>0||gate.right>0)){api.last=diag;return;}
    mesh.updateMatrixWorld(true);const BL=boneLocal(),Mo=new Float64Array(16),Mn=new Float64Array(16);changed=[];
    const ap=(R,v3)=>[R[0]*v3[0]+R[1]*v3[1]+R[2]*v3[2],R[3]*v3[0]+R[4]*v3[1]+R[5]*v3[2],R[6]*v3[0]+R[7]*v3[1]+R[8]*v3[2]];
    const nrm=x=>{const l=Math.hypot(x[0],x[1],x[2])||1;return [x[0]/l,x[1]/l,x[2]/l];};
    for(const s of ['left','right']){const gt=gate[s];if(!(gt>0))continue;
      const S=sides[s],tgt=new Map(),work=[];
      // pass 1: r1 target position and r1 normal (identical arithmetic to r1)
      for(const e of S.list){const i=e.i,px=pos.getX(i),py=pos.getY(i),pz=pos.getZ(i),nx=nor.getX(i),ny=nor.getY(i),nz=nor.getZ(i);
        blend(BL,e.orig,Mo);blend(BL,e.w,Mn);
        const po=xf(Mo,0,px,py,pz,1),pn=xf(Mn,0,...e.rb,1),t=[po[0]+gt*(pn[0]-po[0]),po[1]+gt*(pn[1]-po[1]),po[2]+gt*(pn[2]-po[2])];
        const no=xf(Mo,0,nx,ny,nz,0),nn=xf(Mn,0,...e.nb,0),lo=Math.hypot(...no)||1,ln=Math.hypot(...nn)||1;
        const nt=[no[0]/lo+gt*(nn[0]/ln-no[0]/lo),no[1]/lo+gt*(nn[1]/ln-no[1]/lo),no[2]/lo+gt*(nn[2]/ln-no[2]/lo)];
        const R=inv3(Mo);work.push({e,px,py,pz,nx,ny,nz,t,nt,R,M12:[Mo[12],Mo[13],Mo[14]]});tgt.set(i,t);
        diag.maxMoveMm=Math.max(diag.maxMoveMm,1e3*Math.hypot(t[0]-po[0],t[1]-po[1],t[2]-po[2]));}
      // pass 2 (r2): surface normal of the blended target surface, smoothed inside the region
      let G=null;
      if(o.normalRepair){const N=S.normal,P=new Map(tgt);
        for(const r of N.outsideRaw){const w=origWeights(r);blend(BL,w,Mo);P.set(r,xf(Mo,0,pos.getX(r),pos.getY(r),pos.getZ(r),1));}
        G=new Map();for(const i of N.ids)G.set(i,[0,0,0]);
        const F=N.faces;for(let k=0;k<F.length;k+=3){const A=P.get(F[k]),B=P.get(F[k+1]),C=P.get(F[k+2]);
          const u=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],w=[C[0]-A[0],C[1]-A[1],C[2]-A[2]],n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]];
          for(let c=0;c<3;c++){const g=G.get(wk[F[k+c]]);if(g){g[0]+=n[0];g[1]+=n[1];g[2]+=n[2];}}}
        for(const [i,g] of G)G.set(i,nrm(g));
        for(let it=0;it<o.normalSmooth;it++){const nx=new Map();for(const [i,g] of G){const ns=N.rnbr.get(i);const acc=[g[0],g[1],g[2]];for(const j of ns){const h=G.get(j);acc[0]+=h[0];acc[1]+=h[1];acc[2]+=h[2];}nx.set(i,nrm(acc));}G=nx;}}
      // write
      for(const x of work){const {e}=x;let n=nrm(x.nt);
        if(G){const f=gt*S.normal.fade.get(wk[e.i]),g=G.get(wk[e.i]);const m=nrm([(1-f)*n[0]+f*g[0],(1-f)*n[1]+f*g[1],(1-f)*n[2]+f*g[2]]);
          diag.maxNormalChangeDeg=Math.max(diag.maxNormalChangeDeg,Math.acos(Math.min(1,Math.max(-1,m[0]*n[0]+m[1]*n[1]+m[2]*n[2])))*180/Math.PI);n=m;}
        const d=[x.t[0]-x.M12[0],x.t[1]-x.M12[1],x.t[2]-x.M12[2]],lp=ap(x.R,d),ln2=nrm(ap(x.R,n));
        changed.push([e.i,x.px,x.py,x.pz,x.nx,x.ny,x.nz]);pos.setXYZ(e.i,lp[0],lp[1],lp[2]);nor.setXYZ(e.i,ln2[0],ln2[1],ln2[2]);diag.written++;}}
    pos.needsUpdate=nor.needsUpdate=true;api.last=diag;
  }
  function before(...args){previousBefore?.apply(this,args);if(api.enabled)update();}
  function render(...args){const outer=depth++===0;try{return previousRender.apply(this,args);}finally{depth--;if(outer)restore();}}
  const api=window[GN]={version:o.version,enabled:!!o.enabled,last:null,
    config:{...o,mesh:mesh.name,restReproductionErrorMm:restErrMm,bindScale:sc,sides:Object.fromEntries(Object.entries(sides).map(([s,x])=>[s,{seedEdges:x.seedEdges,weldedVertices:x.welded,vertices:x.list.length,normalFaces:x.normal.faces.length/3,normalOutsideVertices:x.normal.outsideRaw.length,maxRing:x.normal.maxRing}])),restNormalDeviation:restNormalDeviation(),symmetry:symmetry(),
      bonesChanged:false,weightsAttributeChanged:false,indexChanged:false,reviewed:false},
    vertexIds(){return Object.fromEntries(Object.entries(sides).map(([s,x])=>[s,x.list.map(e=>e.i)]));},
    detach(){if(depth)throw Error('Cannot detach during render');if(v.scene.onBeforeRender!==before||v.renderer.render!==render)throw Error('Detach later hooks first');restore();v.scene.onBeforeRender=previousBefore;v.renderer.render=previousRender;delete window[GN];}};
  v.scene.onBeforeRender=before;v.renderer.render=render;
  return api.config;
}

export async function install(page,options={}){
  const o={...DEFAULTS,...options,version:VERSION};
  return page.evaluate(([src,opts])=>{(0,eval)('window.__shoulderAxillaR2Install='+src);try{return window.__shoulderAxillaR2Install(opts);}finally{delete window.__shoulderAxillaR2Install;}},[pageInstall.toString(),o]);
}
