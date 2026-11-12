import json
M={'left':-27,'right':113}
def var(name,L,R,bump=None):
    bl=''
    if bump:
        A,tc,hw=bump
        bl=f"""const D=s.timeline.duration;const tr=[];for(let i=0;i<=D*60;i++){{const t=i/60;const u=Math.abs(t-{tc})/{hw};tr.push([+t.toFixed(4),+(u<1?{A}*(1+Math.cos(Math.PI*u))/2:0).toFixed(4),'linear']);}}
s.timeline.tracks.r5L=tr;const hb=s.pose.base.hands.left;s.pose.deltas.r5L={{hands:{{left:{{elbowTwist:hb.elbowTwist+1}}}}}};"""
    src=f"""import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/forearms-A-r4.js';
const s=structuredClone(b);
function f3(s,side,{{a=0,b=0,c=0,k=1,m=0}}){{const h=s.pose.base.hands[side];const d=s.pose.deltas['ht1_'+side].hands[side];
  const U=h.upperArmTwist,E=h.elbowTwist;const dU=d.upperArmTwist-U,dE=d.elbowTwist-E;
  h.upperArmTwist=U+a-c*m;h.elbowTwist=E+b+m*(1-k);d.upperArmTwist=h.upperArmTwist+dU+c;d.elbowTwist=h.elbowTwist+k*dE;}}
f3(s,'left',{json.dumps(dict(L,m=M['left']))});f3(s,'right',{json.dumps(dict(R,m=M['right']))});
{bl}
export default s;
"""
    open(f'var5/{name}.mjs','w').write(src)
    return {'name':name,'file':f'/workspace/work/elbow-fix/sh/var5/{name}.mjs'}
L=dict(c=.2,k=.3,a=-12)
V=[var('c1',L,dict(c=.2,k=.3,a=0)),var('c2',L,dict(c=.2,k=.3,a=5),(-22,2.52,0.2)),var('c3',L,dict(c=.2,k=.3,a=10),(-30,2.52,0.2))]
T=[0.1,0.2,0.3,0.4,0.6,0.7,2.1,2.2,2.3,2.35,2.4,2.45,2.55,2.6,2.65,2.7,2.8,4.1,4.2,4.3,4.4,4.6,4.7,6.1,6.2,6.3,6.4,6.6,6.7]
json.dump([{'id':'forearms-A','t':T,'variants':V}],open('jobs-r5c.json','w'))
