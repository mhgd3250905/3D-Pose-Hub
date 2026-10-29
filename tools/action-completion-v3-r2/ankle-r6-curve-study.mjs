export function makeAnkleCurveStudyMath(T){
  const Y=new T.Vector3(0,1,0),smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  function state(p0,p1,q0,q1,length){
    const a=Y.clone().applyQuaternion(q0),b=Y.clone().applyQuaternion(q1);
    const endFrame=new T.Quaternion().setFromUnitVectors(a,b).multiply(q0);
    const twist=endFrame.clone().invert().multiply(q1);if(twist.w<0)twist.set(-twist.x,-twist.y,-twist.z,-twist.w);
    let twistAngle=2*Math.atan2(twist.y,twist.w);if(twistAngle>Math.PI)twistAngle-=2*Math.PI;if(twistAngle< -Math.PI)twistAngle+=2*Math.PI;
    return {p0,p1,q0,q1,a,b,length,twistAngle,bendAngle:Math.acos(Math.max(-1,Math.min(1,a.dot(b))))};
  }
  function section(s,t){
    const L=s.length,d0=s.a.clone().multiplyScalar(L*(s.startScale??1)),d1=s.b.clone().multiplyScalar(L*(s.endScale??1));
    const A=s.p1.clone().sub(s.p0).sub(d0),B=d1.clone().sub(d0);
    const c3=A.clone().multiplyScalar(10).addScaledVector(B,-4),c4=A.clone().multiplyScalar(-15).addScaledVector(B,7),c5=A.clone().multiplyScalar(6).addScaledVector(B,-3);
    const center=s.p0.clone().addScaledVector(d0,t).addScaledVector(c3,t**3).addScaledVector(c4,t**4).addScaledVector(c5,t**5);
    const derivative=d0.clone().addScaledVector(c3,3*t*t).addScaledVector(c4,4*t**3).addScaledVector(c5,5*t**4);
    const second=c3.clone().multiplyScalar(6*t).addScaledVector(c4,12*t*t).addScaledVector(c5,20*t**3);
    if(derivative.length()<1e-7)throw Error('Collapsed ankle centerline');
    const curvature=derivative.clone().cross(second).length()/derivative.length()**3;
    const q=new T.Quaternion().setFromUnitVectors(s.a,derivative.clone().normalize()).multiply(s.q0).multiply(new T.Quaternion().setFromAxisAngle(Y,s.twistAngle*smooth(t)));
    return {center,q,curvature,tangent:derivative.normalize()};
  }
  function point(s,t,x,z){const f=section(s,t);return new T.Vector3(x,0,z).applyQuaternion(f.q).add(f.center);}
  return {state,section,point,smooth};
}

