const P=window.__props, v=flareInspector.viewer; const C=P.bakeGrip('right').c.constructor;
const out={};
for(const side of ['right','left']){const G=P.bakeGrip(side);v.motion.reset();v.coach.updateMatrixWorld(true);const b=v.coach.getObjectByName(side+'Hand');
 const p=new C();b.getWorldPosition(p); const q=b.quaternion.clone(); b.getWorldQuaternion(q);
 const fa=v.coach.getObjectByName(side+'Forearm'); const fp=new C(); fa.getWorldPosition(fp);
 out[side]={c:G.c.toArray(),a:G.a.toArray(),r:G.r,pal:G.pal.toArray(),bonePos:p.toArray(),boneQuat:[q.x,q.y,q.z,q.w],elbow:fp.toArray()};}
return out;
