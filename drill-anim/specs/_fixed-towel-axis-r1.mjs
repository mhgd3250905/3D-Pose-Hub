// Align the immutable 32 mm grip shaft with the actual inter-hand towel line.
// Only existing finger/normal tracks and explicit band anchor offsets change.
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,k)=>a.map(x=>x*k);
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/Math.hypot(...a));
const frame=(f,n)=>{f=unit(f);const z=unit(sub(n,mul(f,dot(n,f))));return [unit(cross(f,z)),f,z];};
const apply=(cols,v)=>[0,1,2].map(i=>cols.reduce((n,c,k)=>n+c[i]*v[k],0));
const reference=s=>frame([s*.98253144,.05483374,.17783482],[s*.06068526,-.99777448,-.02762938]);
const transform=(h,s,v)=>apply(frame(h.finger,h.normal),reference(s).map(c=>dot(c,v)));
const sample=(k,t,duration)=>{if(t>=duration)t=0;for(let i=0;i<k.length;i++){const a=k[i],b=k[i+1]||[duration,k[0][1],'linear'];if(t>=a[0]&&t<b[0])return a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]);}return k[0][1];};
function turn(v,a,b){const axis=cross(a,b),sn=Math.hypot(...axis),cs=Math.max(-1,Math.min(1,dot(a,b)));if(sn<1e-12)return v.slice();const k=mul(axis,1/sn);return add(add(mul(v,cs),mul(cross(k,v),sn)),mul(k,dot(k,v)*(1-cs)));}
export function alignTowel(source,id){
 const out=structuredClone(source),D=source.timeline.duration,keys={},offset={left:[.07612368052316226,-.042491777623657606,0],right:[-.07612368052316226,-.042491777623657606,0]};
 for(const side of ['left','right']){
  if(source.pose.base.hands[side].frame!=='world')throw Error('Fixed towel alignment requires world-frame hands');
  keys[side]={};for(const field of ['wrist','finger','normal']){keys[side][field]=[];for(let i=0;i<3;i++){
   const found=Object.keys(source.pose.deltas).filter(k=>source.pose.deltas[k]?.hands?.[side]?.[field]?.[i]===1);
   if(found.length!==1||source.pose.base.hands[side][field][i]!==0)throw Error('Expected one direct coordinate track');
   const k=found[0];if(source.timeline.tracks[k].some(row=>row[2]!=='linear'))throw Error('Expected linear coordinate tracks');keys[side][field][i]=k;
  }}
 }
 const times=source.timeline.tracks[keys.left.finger[0]].map(row=>row[0]),solutions=times.map(t=>{
  const hands={};for(const side of ['left','right'])hands[side]=Object.fromEntries(['wrist','finger','normal'].map(field=>[field,keys[side][field].map(k=>sample(source.timeline.tracks[k],t,D))]));
  for(let iteration=0;iteration<24;iteration++){
   const centers={};for(const side of ['left','right'])centers[side]=add(hands[side].wrist,transform(hands[side],side==='left'?1:-1,offset[side]));
   const direction=unit(sub(centers.right,centers.left));
   for(const side of ['left','right']){
    const s=side==='left'?1:-1,h=hands[side],axis=unit(transform(h,s,[-s*.33021816355948425,-.01961983360331667,-.9437007081616395])),target=dot(axis,direction)<0?mul(direction,-1):direction;
    h.finger=turn(h.finger,axis,target);h.normal=turn(h.normal,axis,target);
   }
  }return hands;
 });
 for(const side of ['left','right'])for(const field of ['finger','normal'])for(let i=0;i<3;i++)out.timeline.tracks[keys[side][field][i]]=times.map((t,j)=>[t,+solutions[j][side][field][i].toFixed(12),'linear']);
 for(const p of out.props)if(p.type==='band')for(const end of ['from','to']){const side=p[end].bone==='leftHand'?'left':p[end].bone==='rightHand'?'right':null;if(!side)throw Error('Expected hand-to-hand towel');p[end].offset=offset[side].slice();}
 out.id=id;out.revisionOf=source.id;out.fixedTowelGrip={profile:'fixed-towel-axis-r1',version:'0.1.0-r1',fixedHandUnchanged:true,wristElbowPathsUnchanged:true,clothDiameterMm:out.props.find(p=>p.type==='band').r*2000,status:'candidate-awaiting-gpu-and-user'};
 return out;
}
