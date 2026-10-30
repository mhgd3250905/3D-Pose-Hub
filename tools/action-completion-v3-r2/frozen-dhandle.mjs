// Frozen-fist D-handle (2026-10-30). Long-standing rule: every bar/handle is held by the user-accepted frozen
// webxr-dumbbell-wrist-r1 fist, never by the native grasp-32mm bake. A dHandle tagged fixedDHandleGrasp:'webxr-dumbbell-fist'
// is built on that fist's 32 mm shaft axis (same constants as kettlebell-grip / fixed-bar-grip): P.bakeGrip is bypassed, so the
// hand mesh is never re-posed; the grip cylinder is 32 mm, its length = the fist's measured wrap span + 6 mm each side, centred on it.
// The loop / band apex logic of the stock dHandle placement is unchanged (it reads G.c, G.a, G.pal).
export async function installFrozenDHandle(page){return page.evaluate(`(${inPage.toString()})()`);}
function inPage(){
  const P=window.__props,T=window.__toonT,v=flareInspector.viewer;
  if(!P||!T||!window.__webxrWristJoin||window.__frozenDHandle)throw Error('Frozen dHandle requires a fresh webxr dumbbell wrist fist');
  const FROZEN={left:{c:[0.076111,-0.043131,0.000018],a:[0.330218,0.01962,0.943701]},right:{c:[-0.076111,-0.043131,0.000018],a:[-0.330218,0.01962,0.943701]}};
  const span=(side,C,X,rad=.034,q=.02)=>{const bone=v.coach.getObjectByName(side+'Hand');let mesh=null;
    v.scene.traverse(o=>{if(!mesh&&o.isMesh&&/^WebXR_(Fixed|Clipped)_Hand_/.test(o.name)&&o.name.includes(side))mesh=o;});
    if(!mesh||!bone)throw Error('frozen fist mesh missing '+side);v.scene.updateMatrixWorld(true);
    const inv=bone.matrixWorld.clone().invert(),pos=mesh.geometry.attributes.position,p=new T.Vector3(),t=[];
    for(let i=0;i<pos.count;i++){p.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld).applyMatrix4(inv).sub(C);const al=p.dot(X);if(p.addScaledVector(X,-al).length()<rad)t.push(al);}
    if(t.length<20)throw Error('frozen fist span unmeasurable '+side);t.sort((a,b)=>a-b);return[t[Math.floor(t.length*q)],t[Math.ceil(t.length*(1-q))-1]];};
  const out={};
  const G=side=>{const c=new T.Vector3(...FROZEN[side].c),a=new T.Vector3(...FROZEN[side].a).normalize();
    // palmar direction: from the shaft toward the palm = the hand-bone origin side, orthogonal to the shaft axis
    const pal=c.clone().negate();pal.addScaledVector(a,-pal.dot(a)).normalize();
    const [lo,hi]=span(side,c,a);out[side]={fistSpanM:[+lo.toFixed(4),+hi.toFixed(4)],gripLenM:+(hi-lo+.012).toFixed(4)};
    return {r:.016,c:c.add(a.clone().multiplyScalar((lo+hi)/2)),a,pal,len:hi-lo+.012};};
  const add0=P.add,bake0=P.bakeGrip;
  P.add=function(theme,s){
    if(s.fixedDHandleGrasp===undefined)return add0.call(this,theme,s);
    if(s.fixedDHandleGrasp!=='webxr-dumbbell-fist'||s.type!=='dHandle'||!['left','right'].includes(s.side||'right')||s.shift!==undefined)throw Error('Unsupported frozen dHandle');
    const g=G(s.side||'right');P.bakeGrip=()=>g;
    try{return add0.call(this,theme,{...s,len:g.len});}finally{P.bakeGrip=bake0;}};
  return window.__frozenDHandle={adapter:'frozen-dhandle-r1',source:'webxr-dumbbell-wrist-r1',diameterM:.032,sides:out,reviewed:false,releaseEligible:false};
}
