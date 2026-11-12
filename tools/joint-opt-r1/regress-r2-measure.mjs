// Stage-A shoulder metrics, ported 1:1 from the stage-A analysis (analyze.py / pool.py / classify.py) and the
// shoulder census (measure2.py, elev.py) so the local machine needs no Python. Pure functions, no I/O.
// Per frame and side: inverted | fold | collapse triangles of the body meshes assigned to the shoulder ROI
// (nearest joint within its stage-A radius), visible in the production camera (1024 px point z-buffer, 3x3 min
// dilation, eps 6 mm), counts and posed areas; issue = visible >= roiIssueMinVisible AND area >= roiIssueMinVisibleAreaMm2.
// Supplementary (not part of the stage-A issue rule): shadeDev = visible shoulder-ROI faces whose mean shading
// normal deviates > 45 deg from the face normal (rest-consistent faces only); this is what the toon shading turns into
// dark/light specks. Thresholds come from the caller (fixed stage-A values in regress-r2.plan.json; never tuned here).

export const JOINTS=[['wrist','Hand',.065],['elbow','Forearm',.075],['shoulder','UpperArm',.10],['hip','Thigh',.12],['knee','Shin',.09],['ankle','Foot',.08],['neck','neck',.085]];
export const SKIN=new Set(['Coach_Body','V2P_Base_Limbs','V3_Head_Neck_Torso_Shared_R26','V2P_Base_Hands','WebXR_Clipped_Hand_left','WebXR_Clipped_Hand_right','WebXR_Wrist_Bridge_left','WebXR_Wrist_Bridge_right']);
export const EXCLUDED=new Set(['Coach_Shoe_Details','Coach_Sneakers','Coach_Soles','Coach_Training_Shorts','Mesh005_1']);

function drawnTris(m){
  const idx=m.index??Array.from({length:m.n},(_,i)=>i);
  const s=m.drawRange[0];let c=m.drawRange[1];if(c===null||c===undefined||!Number.isFinite(c))c=idx.length-s;
  const tri=idx.slice(s,s+c);const nt=Math.floor(tri.length/3);return Int32Array.from(tri.slice(0,nt*3));
}
function faceNormals(P,tri){ // -> unit normals (n/max(2A,1e-30)) and areas
  const nt=tri.length/3,fn=new Float64Array(nt*3),A=new Float64Array(nt);
  for(let f=0;f<nt;f++){const a=tri[f*3]*3,b=tri[f*3+1]*3,c=tri[f*3+2]*3;
    const ux=P[b]-P[a],uy=P[b+1]-P[a+1],uz=P[b+2]-P[a+2],vx=P[c]-P[a],vy=P[c+1]-P[a+1],vz=P[c+2]-P[a+2];
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz),area=.5*l,d=Math.max(2*area,1e-30);
    fn[f*3]=nx/d;fn[f*3+1]=ny/d;fn[f*3+2]=nz/d;A[f]=area;}
  return {fn,A};
}
function edgePairs(tri){ // faces sharing an (index) edge: sort keys, pair consecutive equal keys (as numpy stable sort)
  const nt=tri.length/3,keys=new Array(nt*3);
  for(let k=0;k<3;k++)for(let f=0;f<nt;f++){const p=tri[f*3+k],q=tri[f*3+(k+1)%3],a=Math.min(p,q),b=Math.max(p,q);keys[k*nt+f]=[a*10000000+b,f,k*nt+f];}
  keys.sort((x,y)=>x[0]-y[0]||x[2]-y[2]);
  const out=[];for(let i=1;i<keys.length;i++)if(keys[i][0]===keys[i-1][0])out.push(keys[i-1][1],keys[i][1]);
  return Int32Array.from(out);
}
function vfn(N,tri){const nt=tri.length/3,o=new Float64Array(nt*3);
  for(let f=0;f<nt;f++){let x=0,y=0,z=0;for(let k=0;k<3;k++){const v=tri[f*3+k]*3;x+=N[v];y+=N[v+1];z+=N[v+2];}const l=Math.max(Math.hypot(x,y,z),1e-30);o[f*3]=x/l;o[f*3+1]=y/l;o[f*3+2]=z/l;}return o;}
const dot3=(a,i,b,j)=>a[i*3]*b[j*3]+a[i*3+1]*b[j*3+1]+a[i*3+2]*b[j*3+2];

/** topo: page topology (role/name/index/drawRange/domBone/n); rest: {name:{pos:Float32Array,nor:Float32Array}}; restJoints: meta.rest.pos */
export function prepare(topo,rest,restJoints){
  const meshes=topo.filter(m=>m.role==='body');
  const M=meshes.map(m=>{
    const tri=drawnTris(m),used=new Uint8Array(m.n);for(const v of tri)used[v]=1;
    const P=Float64Array.from(rest[m.name].pos),N=Float64Array.from(rest[m.name].nor);
    const {fn,A}=faceNormals(P,tri),edges=edgePairs(tri),nt=tri.length/3;
    const restDih=new Float64Array(edges.length/2);for(let e=0;e<restDih.length;e++)restDih[e]=dot3(fn,edges[e*2],fn,edges[e*2+1]);
    const vf=vfn(N,tri),restInv=new Float64Array(nt);for(let f=0;f<nt;f++)restInv[f]=dot3(fn,f,vf,f);
    return {name:m.name,tri,used,restA:A,edges,restDih,restInv,restP:P,dom:m.domBone};
  });
  // shoulder section sets (analyze.joint_sets, family 'shoulder' only)
  const sections={};
  for(const side of ['left','right']){const bn=side+'UpperArm';if(!restJoints[bn])continue;const allow=new Set([side+'UpperArm',side+'Scapula']),c=restJoints[bn],sel=[];
    for(const m of M){if(!SKIN.has(m.name)||!m.dom)continue;const u=[];
      for(let v=0;v<m.used.length;v++){if(!m.used[v]||!allow.has(m.dom[v]))continue;if(Math.hypot(m.restP[v*3]-c[0],m.restP[v*3+1]-c[1],m.restP[v*3+2]-c[2])<.10)u.push(v);}
      sel.push([m,Int32Array.from(u)]);}
    sections[side]={bn,sel};}
  return {M,sections,restJoints};
}

function invert4(m){ // column-major 4x4 inverse
  const a=m,inv=new Float64Array(16);
  inv[0]=a[5]*a[10]*a[15]-a[5]*a[11]*a[14]-a[9]*a[6]*a[15]+a[9]*a[7]*a[14]+a[13]*a[6]*a[11]-a[13]*a[7]*a[10];
  inv[4]=-a[4]*a[10]*a[15]+a[4]*a[11]*a[14]+a[8]*a[6]*a[15]-a[8]*a[7]*a[14]-a[12]*a[6]*a[11]+a[12]*a[7]*a[10];
  inv[8]=a[4]*a[9]*a[15]-a[4]*a[11]*a[13]-a[8]*a[5]*a[15]+a[8]*a[7]*a[13]+a[12]*a[5]*a[11]-a[12]*a[7]*a[9];
  inv[12]=-a[4]*a[9]*a[14]+a[4]*a[10]*a[13]+a[8]*a[5]*a[14]-a[8]*a[6]*a[13]-a[12]*a[5]*a[10]+a[12]*a[6]*a[9];
  inv[1]=-a[1]*a[10]*a[15]+a[1]*a[11]*a[14]+a[9]*a[2]*a[15]-a[9]*a[3]*a[14]-a[13]*a[2]*a[11]+a[13]*a[3]*a[10];
  inv[5]=a[0]*a[10]*a[15]-a[0]*a[11]*a[14]-a[8]*a[2]*a[15]+a[8]*a[3]*a[14]+a[12]*a[2]*a[11]-a[12]*a[3]*a[10];
  inv[9]=-a[0]*a[9]*a[15]+a[0]*a[11]*a[13]+a[8]*a[1]*a[15]-a[8]*a[3]*a[13]-a[12]*a[1]*a[11]+a[12]*a[3]*a[9];
  inv[13]=a[0]*a[9]*a[14]-a[0]*a[10]*a[13]-a[8]*a[1]*a[14]+a[8]*a[2]*a[13]+a[12]*a[1]*a[10]-a[12]*a[2]*a[9];
  inv[2]=a[1]*a[6]*a[15]-a[1]*a[7]*a[14]-a[5]*a[2]*a[15]+a[5]*a[3]*a[14]+a[13]*a[2]*a[7]-a[13]*a[3]*a[6];
  inv[6]=-a[0]*a[6]*a[15]+a[0]*a[7]*a[14]+a[4]*a[2]*a[15]-a[4]*a[3]*a[14]-a[12]*a[2]*a[7]+a[12]*a[3]*a[6];
  inv[10]=a[0]*a[5]*a[15]-a[0]*a[7]*a[13]-a[4]*a[1]*a[15]+a[4]*a[3]*a[13]+a[12]*a[1]*a[7]-a[12]*a[3]*a[5];
  inv[14]=-a[0]*a[5]*a[14]+a[0]*a[6]*a[13]+a[4]*a[1]*a[14]-a[4]*a[2]*a[13]-a[12]*a[1]*a[6]+a[12]*a[2]*a[5];
  inv[3]=-a[1]*a[6]*a[11]+a[1]*a[7]*a[10]+a[5]*a[2]*a[11]-a[5]*a[3]*a[10]-a[9]*a[2]*a[7]+a[9]*a[3]*a[6];
  inv[7]=a[0]*a[6]*a[11]-a[0]*a[7]*a[10]-a[4]*a[2]*a[11]+a[4]*a[3]*a[10]+a[8]*a[2]*a[7]-a[8]*a[3]*a[6];
  inv[11]=-a[0]*a[5]*a[11]+a[0]*a[7]*a[9]+a[4]*a[1]*a[11]-a[4]*a[3]*a[9]-a[8]*a[1]*a[7]+a[8]*a[3]*a[5];
  inv[15]=a[0]*a[5]*a[10]-a[0]*a[6]*a[9]-a[4]*a[1]*a[10]+a[4]*a[2]*a[9]+a[8]*a[1]*a[6]-a[8]*a[2]*a[5];
  const det=a[0]*inv[0]+a[1]*inv[4]+a[2]*inv[8]+a[3]*inv[12];for(let i=0;i<16;i++)inv[i]/=det;return inv;
}
function mulCM(a,b){const o=new Float64Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++){let s=0;for(let k=0;k<4;k++)s+=a[k*4+r]*b[c*4+k];o[c*4+r]=s;}return o;}
// classify.project: px=int((ndc_x+1)/2*res) (truncation toward zero, like numpy astype(int)), depth=-z_cam
function projector(camW,proj,res){const V=invert4(camW),PV=mulCM(proj,V);
  return (x,y,z)=>{const hw=PV[3]*x+PV[7]*y+PV[11]*z+PV[15],nx=(PV[0]*x+PV[4]*y+PV[8]*z+PV[12])/hw,ny=(PV[1]*x+PV[5]*y+PV[9]*z+PV[13])/hw;
    const cz=V[2]*x+V[6]*y+V[10]*z+V[14];return [Math.trunc((nx+1)/2*res),Math.trunc((1-ny)/2*res),-cz];};}
function visibility(allPts,nAll,query,nQ,camW,proj,res=1024,eps=.006){
  const pr=projector(camW,proj,res),zb=new Float64Array(res*res).fill(Infinity);
  for(let i=0;i<nAll;i++){const [px,py,z]=pr(allPts[i*3],allPts[i*3+1],allPts[i*3+2]);if(px>=0&&px<res&&py>=0&&py<res&&z>0){const k=py*res+px;if(z<zb[k])zb[k]=z;}}
  const zm=new Float64Array(res*res);
  for(let y=0;y<res;y++)for(let x=0;x<res;x++){let m=Infinity;for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=res)continue;for(let dx=-1;dx<=1;dx++){const xx=x+dx;if(xx<0||xx>=res)continue;const z=zb[yy*res+xx];if(z<m)m=z;}}zm[y*res+x]=m;}
  const vis=new Uint8Array(nQ);
  for(let i=0;i<nQ;i++){const [qx,qy,qz]=pr(query[i*3],query[i*3+1],query[i*3+2]);if(qx>=0&&qx<res&&qy>=0&&qy<res&&qz>0)vis[i]=qz<=zm[qy*res+qx]+eps?1:0;}
  return vis;
}
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dt=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],nrm=a=>Math.hypot(a[0],a[1],a[2]);
export function elev(p,side){ // elev.py
  let down=sub(p.pelvis,p.neck);down=down.map(x=>x/nrm(down));
  let lat=sub(p.leftUpperArm,p.rightUpperArm);const k=dt(lat,down);lat=lat.map((x,i)=>x-down[i]*k);lat=lat.map(x=>x/nrm(lat));
  const fwd=[down[1]*lat[2]-down[2]*lat[1],down[2]*lat[0]-down[0]*lat[2],down[0]*lat[1]-down[1]*lat[0]];
  let u=sub(p[side+'Forearm'],p[side+'UpperArm']);u=u.map(x=>x/nrm(u));
  const e=Math.acos(Math.min(1,Math.max(-1,dt(u,down))))*180/Math.PI,s=side==='left'?1:-1,az=Math.atan2(s*dt(u,lat),dt(u,fwd))*180/Math.PI;return [e,az];
}
function segDist(p,a,b){const ab=sub(b,a),t=Math.min(1,Math.max(0,dt(sub(p,a),ab)/Math.max(dt(ab,ab),1e-12)));const q=[a[0]+t*ab[0],a[1]+t*ab[1],a[2]+t*ab[2]];return [nrm(sub(p,q)),t];}
function minSection(S,frameP,jp){ // analyze.py thickness, family shoulder
  if(!S)return null;const side=S.bn.replace('UpperArm',''),rj=S.restJoints;
  const poly=J=>[J[side+'Scapula'],J[S.bn],J[side+'Forearm']];
  const radial=(p,J)=>{const pts=poly(J),[d1,t1]=segDist(p,pts[0],pts[1]),[d2,t2]=segDist(p,pts[1],pts[2]);
    return [Math.min(d1,d2),d1<d2?-(1-t1)*nrm(sub(pts[1],pts[0])):t2*nrm(sub(pts[2],pts[1]))];};
  const bins=new Map();
  for(const [m,u] of S.sel){const P=frameP[m.name];for(const v of u){const [r0,ax]=radial([m.restP[v*3],m.restP[v*3+1],m.restP[v*3+2]],rj);if(!(r0>.008))continue;
    const [r1]=radial([P[v*3],P[v*3+1],P[v*3+2]],jp);const b=Math.floor(ax/.01);const e=bins.get(b)||[0,0,0];e[0]+=r1;e[1]+=r0;e[2]++;bins.set(b,e);}}
  let best=null;for(const b of [...bins.keys()].sort((x,y)=>x-y)){const [s1,s0,n]=bins.get(b);if(n<20)continue;const r=(s1/n)/(s0/n);if(best===null||r<best)best=r;}
  return best;
}

/** frame: {name:{pos,nor}} posed; jp: joint world positions; camW: camera matrixWorld (16, column-major); proj: projection (16). */
export function measureFrame(st,frame,jp,camW,proj,T){
  const keys=[],jc=[];for(const [fam,bone,R] of JOINTS)for(const side of (fam==='neck'?['mid']:['left','right'])){const bn=fam==='neck'?'neck':side+bone;if(!jp[bn])continue;keys.push(fam+':'+side);jc.push([jp[bn],R]);}
  const sides={};for(const side of ['left','right'])sides[side]={inv:0,fold:0,collapse:0,flag:0,flagVisible:0,flagVisibleAreaMm2:0,invFoldVisible:0,invFoldVisibleAreaMm2:0,tris:0,meshes:{},loc:[0,0,0,0],shadeDevVisible:0,shadeDevVisibleAreaMm2:0};
  const ki={left:keys.indexOf('shoulder:left'),right:keys.indexOf('shoulder:right')};
  // posed per-mesh metrics
  const recs=[];let nAll=0;for(const m of st.M)nAll+=frame[m.name].pos.length/3;
  for(const m of st.M){if(EXCLUDED.has(m.name))continue;
    const P=Float64Array.from(frame[m.name].pos),N=Float64Array.from(frame[m.name].nor),{fn,A}=faceNormals(P,m.tri),nt=m.tri.length/3,vf=vfn(N,m.tri);
    const fold=new Uint8Array(nt);for(let e=0;e<m.edges.length/2;e++){const a=m.edges[e*2],b=m.edges[e*2+1];if(m.restDih[e]>.7&&dot3(fn,a,fn,b)<-.3){fold[a]=1;fold[b]=1;}}
    const ids=[];for(let f=0;f<nt;f++)if(m.restA[f]>1e-9)ids.push(f);
    const cen=new Float64Array(ids.length*3),joint=new Int8Array(ids.length),ratio=new Float64Array(ids.length),area=new Float64Array(ids.length),inv=new Uint8Array(ids.length),fl=new Uint8Array(ids.length),sd=new Uint8Array(ids.length);
    ids.forEach((f,i)=>{let x=0,y=0,z=0;for(let k=0;k<3;k++){const v=m.tri[f*3+k]*3;x+=P[v];y+=P[v+1];z+=P[v+2];}x/=3;y/=3;z/=3;cen[i*3]=x;cen[i*3+1]=y;cen[i*3+2]=z;
      let best=-1,bd=Infinity;for(let j=0;j<jc.length;j++){const [c,R]=jc[j];const d=Math.hypot(x-c[0],y-c[1],z-c[2])/R;if(d<1&&d<bd){best=j;bd=d;}}joint[i]=best;
      ratio[i]=A[f]/Math.max(m.restA[f],1e-14);area[i]=ratio[i]*m.restA[f];const dd=dot3(fn,f,vf,f);inv[i]=(m.restInv[f]>.5&&dd<0)?1:0;sd[i]=(m.restInv[f]>.5&&dd<Math.SQRT1_2)?1:0;fl[i]=fold[f];});
    recs.push({m,cen,joint,ratio,area,inv,fl,sd,n:ids.length});}
  let nQ=0;for(const r of recs)nQ+=r.n;
  const allPts=new Float64Array((nAll+nQ)*3);let o=0;for(const m of st.M){allPts.set(frame[m.name].pos,o);o+=frame[m.name].pos.length;}
  const q=allPts.subarray(o);let qo=0;for(const r of recs){q.set(r.cen,qo);qo+=r.cen.length;}
  const vis=visibility(allPts,nAll+nQ,q,nQ,camW,proj);
  let vo=0;
  for(const r of recs){for(let i=0;i<r.n;i++){const j=r.joint[i];if(j<0)continue;
      for(const side of ['left','right']){if(j!==ki[side])continue;const s=sides[side],col=r.ratio[i]<T.collapse,iff=r.inv[i]||r.fl[i],flag=iff||col,v=vis[vo+i];
        s.inv+=r.inv[i];s.fold+=r.fl[i];s.collapse+=col?1:0;s.flag+=flag?1:0;s.tris++;
        if(flag){s.meshes[r.m.name]=(s.meshes[r.m.name]||0)+1;}
        if(flag&&v){s.flagVisible++;s.flagVisibleAreaMm2+=r.area[i]*1e6;s.loc[0]+=r.cen[i*3];s.loc[1]+=r.cen[i*3+1];s.loc[2]+=r.cen[i*3+2];s.loc[3]++;}
        if(r.sd[i]&&v){s.shadeDevVisible++;s.shadeDevVisibleAreaMm2+=r.area[i]*1e6;}
        if(iff&&v){s.invFoldVisible++;s.invFoldVisibleAreaMm2+=r.area[i]*1e6;}}}
    vo+=r.n;}
  const fp={};for(const m of st.M)fp[m.name]=frame[m.name].pos;
  for(const side of ['left','right']){const s=sides[side];
    s.loc=s.loc[3]?[0,1,2].map(k=>+(s.loc[k]/s.loc[3]).toFixed(4)):null;
    const S=st.sections[side]?{...st.sections[side],restJoints:st.restJoints}:null;s.minSection=minSection(S,fp,jp);
    const [e,pl]=elev(jp,side);s.elevDeg=+e.toFixed(2);s.planeDeg=+pl.toFixed(2);
    s.issue=s.flagVisible>=T.roiIssueMinVisible&&s.flagVisibleAreaMm2>=T.roiIssueMinVisibleAreaMm2;
    s.issueInvFold=s.invFoldVisible>=T.roiIssueMinVisible&&s.invFoldVisibleAreaMm2>=T.roiIssueMinVisibleAreaMm2;
    s.sectionLow=s.minSection!==null&&s.minSection<T.sectionShoulder;
    s.flagVisibleAreaMm2=+s.flagVisibleAreaMm2.toFixed(2);s.invFoldVisibleAreaMm2=+s.invFoldVisibleAreaMm2.toFixed(2);s.shadeDevVisibleAreaMm2=+s.shadeDevVisibleAreaMm2.toFixed(2);}
  return sides;
}
