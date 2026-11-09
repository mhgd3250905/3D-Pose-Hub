import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/forearms-A-r4.js';
const s=structuredClone(b);
function f3(s,side,{a=0,b=0,c=0,k=1,m=0}){const h=s.pose.base.hands[side];const d=s.pose.deltas['ht1_'+side].hands[side];
  const U=h.upperArmTwist,E=h.elbowTwist;const dU=d.upperArmTwist-U,dE=d.elbowTwist-E;
  h.upperArmTwist=U+a-c*m;h.elbowTwist=E+b+m*(1-k);d.upperArmTwist=h.upperArmTwist+dU+c;d.elbowTwist=h.elbowTwist+k*dE;}
f3(s,'left',{"c": 0.3, "k": 0.45, "a": -12, "m": -27});f3(s,'right',{"c": 0.2, "k": 0.45, "a": 0, "b": 10, "m": 113});
export default s;
