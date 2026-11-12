import json
M={'left':-27,'right':113}
def var(name,L,R,bumps):
    bl='const D=s.timeline.duration;let nb=0;\n'
    for side,A,tc,hw in bumps:
        bl+=f"""{{const tr=[];for(let i=0;i<=D*60;i++){{const t=i/60;const u=Math.abs(t-{tc})/{hw};tr.push([+t.toFixed(4),+(u<1?{A}*(1+Math.cos(Math.PI*u))/2:0).toFixed(4),'linear']);}}
const k='r5'+'{side[0]}'+(nb++);s.timeline.tracks[k]=tr;s.pose.deltas[k]={{hands:{{{side}:{{elbowTwist:s.pose.base.hands.{side}.elbowTwist+1}}}}}};}}
"""
    src=f"""import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/forearms-A-r4.js';
const s=structuredClone(b);
function f3(s,side,{{a=0,b=0,c=0,k=1,m=0}}){{const h=s.pose.base.hands[side];const d=s.pose.deltas['ht1_'+side].hands[side];
  const U=h.upperArmTwist,E=h.elbowTwist;const dU=d.upperArmTwist-U,dE=d.elbowTwist-E;
  h.upperArmTwist=U+a-c*m;h.elbowTwist=E+b+m*(1-k);d.upperArmTwist=h.upperArmTwist+dU+c;d.elbowTwist=h.elbowTwist+k*dE;}}
f3(s,'left',{json.dumps(dict(L,m=M['left']))});f3(s,'right',{json.dumps(dict(R,m=M['right']))});
{bl}export default s;
"""
    open(f'var5/{name}.mjs','w').write(src)
    return {'name':name,'file':f'/workspace/work/elbow-fix/sh/var5/{name}.mjs'}
L=dict(c=.2,k=.3,a=-12);R=dict(c=.2,k=.3,a=-5)
V=[var('d1',L,R,[('left',-30,2.45,0.25),('left',-12,0.5,0.2),('right',18,2.1,0.15),('right',18,0.3,0.12),('right',18,6.3,0.12)]),
   var('d2',L,R,[('left',-38,2.43,0.28),('left',-18,0.5,0.22),('right',26,2.1,0.17),('right',26,0.3,0.14),('right',26,6.3,0.14)])]
T=sorted(set([round(0.05*i,2) for i in range(0,16)]+[round(2+0.05*i,2) for i in range(0,17)]+[round(4+0.05*i,2) for i in range(0,16)]+[round(6+0.05*i,2) for i in range(0,16)]))
json.dump([{'id':'forearms-A','t':T,'variants':V}],open('jobs-r5d.json','w'))
print(len(T))
L=dict(c=.15,k=.3,a=-4)
V=[var('e1',L,R,[('left',-34,2.43,0.28),('left',-15,0.5,0.22),('left',-12,0.65,0.1),('left',-14,6.65,0.12),('right',26,2.1,0.17),('right',26,0.3,0.14),('right',26,6.3,0.14)]),
   {'name':'r4','spec':'drill-anim/specs/forearms-A-r4.js'},{'name':'before','spec':'drill-anim/specs/forearms-A-r2-gc1-ht2.js'}]
json.dump([{'id':'forearms-A','t':T,'variants':V}],open('jobs-r5e.json','w'))
