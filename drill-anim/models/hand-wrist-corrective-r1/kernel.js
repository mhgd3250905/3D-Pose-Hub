// Bounded-curvature circular fillet wrist band; retains the original rig/endpoints.
(function(root){
 root.__createWristCorrectiveKernel=function(T){
  const X=new T.Vector3(1,0,0);
  const smooth=x=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u);};
  function target(p,q,low,high){
   // Equal tangent distances make a true circular fillet between the fixed
   // forearm ray and rotated hand ray. Quintic endpoint interpolation had a
   // curvature overshoot severe enough to reverse the inner wrist Jacobian.
   const a=Math.min(-low,high),x=p.x;
   if(x<=-a)return p.clone();
   if(x>=a)return p.clone().applyQuaternion(q);
   const u=(x+a)/(2*a),end=X.clone().applyQuaternion(q),angle=Math.acos(Math.max(-1,Math.min(1,end.x)));
   const axis=X.clone().cross(end);if(axis.lengthSq()>1e-20)axis.normalize();else axis.set(0,0,1);
   const swing=new T.Quaternion().setFromAxisAngle(axis,angle),twist=swing.clone().invert().multiply(q);
   let twistAngle=2*Math.atan2(twist.x,twist.w);if(twistAngle>Math.PI)twistAngle-=2*Math.PI;if(twistAngle< -Math.PI)twistAngle+=2*Math.PI;
   const rotation=new T.Quaternion().setFromAxisAngle(axis,angle*u).multiply(new T.Quaternion().setFromAxisAngle(X,twistAngle*smooth(u)));
   const centre=new T.Vector3(x,0,0);
   if(angle>1e-8){const radius=a/Math.tan(angle/2),direction=end.clone().addScaledVector(X,-end.x).normalize();centre.copy(direction).multiplyScalar(radius*(1-Math.cos(angle*u)));centre.x+=-a+radius*Math.sin(angle*u);}
   return new T.Vector3(0,p.y,p.z).applyQuaternion(rotation).add(centre);
  }
  return {target,smooth};
 };
})(typeof window!=='undefined'?window:globalThis);
