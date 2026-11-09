// Spec transforms for elbow-twist r2 (orientation-first). Pure functions on a cloned spec.
export function fixSide(s,side,a,b,c=0){const h=s.pose.base.hands[side];const U0=h.upperArmTwist??0,E0=h.elbowTwist??0;
  for(const d of Object.values(s.pose.deltas||{})){const x=d.hands?.[side];if(!x)continue;
    if(x.elbowTwist!==undefined){const ev=x.elbowTwist-E0;x.elbowTwist+=b;x.upperArmTwist=(x.upperArmTwist??U0)+a+c*ev;}
    else if(x.upperArmTwist!==undefined)x.upperArmTwist+=a;}
  h.upperArmTwist=U0+a;h.elbowTwist=E0+b;}
const rot=(v,k,th)=>{const c=Math.cos(th),s=Math.sin(th),d=k[0]*v[0]+k[1]*v[1]+k[2]*v[2];
  const x=[k[1]*v[2]-k[2]*v[1],k[2]*v[0]-k[0]*v[2],k[0]*v[1]-k[1]*v[0]];return v.map((z,i)=>z*c+x[i]*s+k[i]*d*(1-c));};
const unit=v=>{const n=Math.hypot(...v);return v.map(z=>z/n);};
// Roll a free hand's palm normal about its finger direction by deg (constant), rewriting the per-frame component tracks.
// Works for specs whose hands[side].finger / .normal are carried by one-component deltas ([1], [{},1], [{},{},1]) on dense tracks.
export function rollHand(s,side,deg,keep){const H=s.pose.base.hands[side];const th=deg*Math.PI/180;const tr=s.timeline.tracks;
  const comp={finger:[null,null,null],normal:[null,null,null],wrist:[null,null,null]};
  for(const [k,d] of Object.entries(s.pose.deltas||{})){const x=d.hands?.[side];if(!x)continue;
    for(const key of ['finger','normal','wrist'])if(Array.isArray(x[key])){const i=x[key].findIndex(z=>typeof z==='number');
      if(i>=0&&x[key].filter(z=>typeof z==='number').length===1&&x[key][i]===1&&Object.keys(x).length===1)comp[key][i]=k;}}
  for(const key of ['finger','normal'])for(const k of comp[key])if(!k||!tr[k])throw Error(`rollHand: ${side} ${key} not track-driven`);
  const n=tr[comp.normal[0]].length;for(const k of [...comp.finger,...comp.normal])if(tr[k].length!==n||tr[k].some((r,i)=>r[0]!==tr[comp.normal[0]][i][0]))throw Error('rollHand: track times differ');
  const bf=H.finger||[0,0,0],bn=H.normal||[0,0,0];
  // keep = {t, wrist:[..], palm:[..]} measured on the unrolled spec: the palm/grip point stays put (wrist moves around it)
  let co=null;const fr=(f,nv)=>{const F=unit(f);const d=F[0]*nv[0]+F[1]*nv[1]+F[2]*nv[2];const N=unit(nv.map((z,j)=>z-d*F[j]));return [F,N,[F[1]*N[2]-F[2]*N[1],F[2]*N[0]-F[0]*N[2],F[0]*N[1]-F[1]*N[0]]];};
  if(keep){const bw=H.wrist||[0,0,0];for(const k of comp.wrist)if(!k||!tr[k]||tr[k].length!==n)throw Error('rollHand keep: wrist not track-driven');
    const i=tr[comp.normal[0]].reduce((b,r,k)=>Math.abs(r[0]-keep.t)<Math.abs(tr[comp.normal[0]][b][0]-keep.t)?k:b,0);
    const [F,N,B]=fr(bf.map((z,j)=>z+tr[comp.finger[j]][i][1]),bn.map((z,j)=>z+tr[comp.normal[j]][i][1]));const d=keep.palm.map((z,j)=>z-keep.wrist[j]);
    co=[F,N,B].map(e=>e[0]*d[0]+e[1]*d[1]+e[2]*d[2]);}
  for(let i=0;i<n;i++){const f=unit(bf.map((z,j)=>z+tr[comp.finger[j]][i][1])),nv=bn.map((z,j)=>z+tr[comp.normal[j]][i][1]);
    const r=rot(nv,f,th);
    if(co){const [F,N,B]=fr(f,nv),[,N2,B2]=fr(f,r);const p0=[0,1,2].map(j=>co[0]*F[j]+co[1]*N[j]+co[2]*B[j]),p1=[0,1,2].map(j=>co[0]*F[j]+co[1]*N2[j]+co[2]*B2[j]);
      for(let j=0;j<3;j++)tr[comp.wrist[j]][i][1]=+(tr[comp.wrist[j]][i][1]+p0[j]-p1[j]).toFixed(5);}
    for(let j=0;j<3;j++)tr[comp.normal[j]][i][1]=+(r[j]-bn[j]).toFixed(5);}
  return s;}
// Re-aim a free hand to the forearm's natural (zero-roll) orientation: finger along the forearm (straight wrist), palm in the
// neutral position (thumb up / palm medial, the rig's zero forearm roll) optionally pronated by extraDeg about the forearm.
// J = [{t, joints}] dense joints of the same spec (elbow/wrist positions do not depend on the hand orientation).
export function setHandNatural(s,side,J,extraDeg=0){const H=s.pose.base.hands[side];const tr=s.timeline.tracks;
  const comp={finger:[null,null,null],normal:[null,null,null]};
  for(const [k,d] of Object.entries(s.pose.deltas||{})){const x=d.hands?.[side];if(!x)continue;
    for(const key of ['finger','normal'])if(Array.isArray(x[key])){const i=x[key].findIndex(z=>typeof z==='number');
      if(i>=0&&x[key].filter(z=>typeof z==='number').length===1&&x[key][i]===1&&Object.keys(x).length===1)comp[key][i]=k;}}
  for(const key of ['finger','normal'])for(const k of comp[key])if(!k||!tr[k])throw Error(`setHandNatural: ${side} ${key} not track-driven`);
  const bf=H.finger||[0,0,0],bn=H.normal||[0,0,0];const n=tr[comp.normal[0]].length;const C=side==='left'?'left':'right';
  const sub=(p,q)=>p.map((z,i)=>z-q[i]),dot=(p,q)=>p[0]*q[0]+p[1]*q[1]+p[2]*q[2],cr=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
  for(let i=0;i<n;i++){const t=tr[comp.normal[0]][i][0];const row=J.reduce((b,r)=>Math.abs(r.t-t)<Math.abs(b.t-t)?r:b,J[0]).joints;
    const S=row[C+'Shoulder'],E=row[C+'Elbow'],W=row[C+'Wrist'];const a=unit(sub(W,E));let sv=sub(S,E);sv=unit(sv.map((z,j)=>z-dot(sv,a)*a[j]));
    let palm=side==='left'?cr(a,sv):cr(sv,a);if(extraDeg)palm=rot(palm,a,(side==='left'?1:-1)*extraDeg*Math.PI/180);
    for(let j=0;j<3;j++){tr[comp.finger[j]][i][1]=+(a[j]-bf[j]).toFixed(5);tr[comp.normal[j]][i][1]=+(palm[j]-bn[j]).toFixed(5);}}
  return s;}
