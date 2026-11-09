import json,itertools
# fixSide3: shoulder takes c*(ht-m) centered; forearm roll scaled k about m (rest -> wrist); static a,b added on top of r4
M={'left':-27,'right':113}
def var(name,L,R):
    src=f"""import b from 'file:///workspace/work/elbow-scan-wt/drill-anim/specs/forearms-A-r4.js';
const s=structuredClone(b);
function f3(s,side,{{a=0,b=0,c=0,k=1,m=0}}){{const h=s.pose.base.hands[side];const d=s.pose.deltas['ht1_'+side].hands[side];
  const U=h.upperArmTwist,E=h.elbowTwist;const dU=d.upperArmTwist-U,dE=d.elbowTwist-E;
  h.upperArmTwist=U+a-c*m;h.elbowTwist=E+b+m*(1-k);d.upperArmTwist=h.upperArmTwist+dU+c;d.elbowTwist=h.elbowTwist+k*dE;}}
f3(s,'left',{json.dumps(dict(L,m=M['left']))});f3(s,'right',{json.dumps(dict(R,m=M['right']))});
export default s;
"""
    open(f'var5/{name}.mjs','w').write(src)
    return {'name':name,'file':f'/workspace/work/elbow-fix/sh/var5/{name}.mjs'}
V=[]
for c,k in [(0,0.6),(0.2,0.8),(0.2,0.6),(0.35,0.8),(0.35,0.6),(0,0.45),(0.2,0.45)]:
    V.append(var(f'c{c}_k{k}',dict(c=c,k=k,a=-12),dict(c=c,k=k,a=15)))
json.dump([{'id':'forearms-A','variants':V}],open('jobs-r5a.json','w'))
print(len(V))
