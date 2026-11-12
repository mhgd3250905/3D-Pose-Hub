import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/forearms-A-r4.js';
const s=structuredClone(b);
function f3(s,side,{a=0,b=0,c=0,k=1,m=0}){const h=s.pose.base.hands[side];const d=s.pose.deltas['ht1_'+side].hands[side];
  const U=h.upperArmTwist,E=h.elbowTwist;const dU=d.upperArmTwist-U,dE=d.elbowTwist-E;
  h.upperArmTwist=U+a-c*m;h.elbowTwist=E+b+m*(1-k);d.upperArmTwist=h.upperArmTwist+dU+c;d.elbowTwist=h.elbowTwist+k*dE;}
f3(s,'left',{"c": 0.2, "k": 0.3, "a": -12, "m": -27});f3(s,'right',{"c": 0.2, "k": 0.3, "a": -5, "m": 113});
const D=s.timeline.duration;let nb=0;
{const tr=[];for(let i=0;i<=D*60;i++){const t=i/60;const u=Math.abs(t-2.45)/0.25;tr.push([+t.toFixed(4),+(u<1?-30*(1+Math.cos(Math.PI*u))/2:0).toFixed(4),'linear']);}
const k='r5'+'l'+(nb++);s.timeline.tracks[k]=tr;s.pose.deltas[k]={hands:{left:{elbowTwist:s.pose.base.hands.left.elbowTwist+1}}};}
{const tr=[];for(let i=0;i<=D*60;i++){const t=i/60;const u=Math.abs(t-0.5)/0.2;tr.push([+t.toFixed(4),+(u<1?-12*(1+Math.cos(Math.PI*u))/2:0).toFixed(4),'linear']);}
const k='r5'+'l'+(nb++);s.timeline.tracks[k]=tr;s.pose.deltas[k]={hands:{left:{elbowTwist:s.pose.base.hands.left.elbowTwist+1}}};}
{const tr=[];for(let i=0;i<=D*60;i++){const t=i/60;const u=Math.abs(t-2.1)/0.15;tr.push([+t.toFixed(4),+(u<1?18*(1+Math.cos(Math.PI*u))/2:0).toFixed(4),'linear']);}
const k='r5'+'r'+(nb++);s.timeline.tracks[k]=tr;s.pose.deltas[k]={hands:{right:{elbowTwist:s.pose.base.hands.right.elbowTwist+1}}};}
{const tr=[];for(let i=0;i<=D*60;i++){const t=i/60;const u=Math.abs(t-0.3)/0.12;tr.push([+t.toFixed(4),+(u<1?18*(1+Math.cos(Math.PI*u))/2:0).toFixed(4),'linear']);}
const k='r5'+'r'+(nb++);s.timeline.tracks[k]=tr;s.pose.deltas[k]={hands:{right:{elbowTwist:s.pose.base.hands.right.elbowTwist+1}}};}
{const tr=[];for(let i=0;i<=D*60;i++){const t=i/60;const u=Math.abs(t-6.3)/0.12;tr.push([+t.toFixed(4),+(u<1?18*(1+Math.cos(Math.PI*u))/2:0).toFixed(4),'linear']);}
const k='r5'+'r'+(nb++);s.timeline.tracks[k]=tr;s.pose.deltas[k]={hands:{right:{elbowTwist:s.pose.base.hands.right.elbowTwist+1}}};}
export default s;
