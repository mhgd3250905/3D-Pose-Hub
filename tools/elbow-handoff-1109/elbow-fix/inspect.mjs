import fs from 'node:fs';import {pathToFileURL} from 'node:url';
const R='/workspace/work/elbow-scan-wt/';
const sum=JSON.parse(fs.readFileSync('/workspace/work/elbow-scan/summary.json'));
const rows=fs.readFileSync('/workspace/work/elbow-scan/results.csv','utf8').trim().split('\n').slice(1).map(l=>l.split(','));
const flagged={};for(const r of rows){if(+r[3]<0.85){(flagged[r[0]]??={spec:r[1],sides:{}}).sides[r[2]]={ratio:+r[3],t:+r[4],twmin:+r[5],twmax:+r[6],elb:+r[7],tw:+r[9]};}}
const out=[];
for(const [id,f] of Object.entries(flagged)){
  let info={id,spec:f.spec,sides:f.sides};
  try{const s=(await import(pathToFileURL(R+f.spec).href)).default;
    for(const side of ['left','right']){const h=s.pose.base.hands[side];info[side]={E:h.elbowTwist,U:h.upperArmTwist,
      dE:Object.entries(s.pose.deltas||{}).filter(([k,d])=>d.hands?.[side]?.elbowTwist!==undefined).map(([k,d])=>k+':'+d.hands[side].elbowTwist),
      dU:Object.entries(s.pose.deltas||{}).filter(([k,d])=>d.hands?.[side]?.upperArmTwist!==undefined).map(([k,d])=>k+':'+d.hands[side].upperArmTwist)};}
  }catch(e){info.err=String(e).slice(0,200);}
  out.push(info);
}
out.sort((a,b)=>Math.min(...Object.values(a.sides).map(x=>x.ratio))-Math.min(...Object.values(b.sides).map(x=>x.ratio)));
fs.writeFileSync('flagged.json',JSON.stringify(out,null,1));
for(const o of out){console.log(o.id.padEnd(34),Object.entries(o.sides).map(([s,x])=>`${s[0]}${x.ratio} tw[${x.twmin},${x.twmax}] e${x.elb}`).join(' | '),'| L',o.left?.E,o.left?.U,o.left?.dE.join(';'),'R',o.right?.E,o.right?.U,o.right?.dE.join(';'),o.err||'');}
console.log(out.length);
