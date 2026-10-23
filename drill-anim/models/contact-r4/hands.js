// Isolated opt-in extension. No changes to the published v2plus rig, mesh or weights.
(function(){
'use strict';
const E=window.__drill,V=window.__v2p,T=window.__toonT;
if(!E||!V?.loaded)throw new Error('contact-r4 requires the verified v2plus base loader');
if(window.__contactR4)throw new Error('contact-r4 already installed');
const C=window.__contactR4={profile:'training-human-v2plus-contact',version:'1.0.0-r4.1',families:null,last:null};
C.load=function(data){if(data.version!==C.version)throw new Error('contact-r4 family version mismatch');C.families=data.families;};
const select0=E.selectModelProfile.bind(E);
E.selectModelProfile=function(spec){return select0(spec.modelProfile===C.profile?Object.assign({},spec,{modelProfile:'training-human-v2plus'}):spec);};
const pose0=E.pose.bind(E);
E.pose=function(spec,params,warm){
 if(C.restore){for(const [name,q]of Object.entries(C.restore))V.bones[name].quaternion.fromArray(q);C.restore=null;}
 const result=pose0(spec,params,warm);C.last=null;
 if(spec.modelProfile!==C.profile)return result;
 if(spec.contact?.version!==C.version)throw new Error('contact-r4 explicit version required');
 if(spec.v2plus?.skin!=='realistic')throw new Error('contact-r4 only realistic');
 const D=E.currentDescriptor;
 const applied={};C.restore={};
 for(const side of ['left','right']){
  const conf=D?.hands?.[side]?.fingerContact;if(!conf)continue;
  const family=C.families?.[conf.family];if(!family)throw new Error('unknown contact family '+conf.family);
  applied[side]={family:conf.family,joints:{}};
  for(const finger of ['index','middle','ring','pinky']){
   const w=conf[finger];const ks=Array.isArray(w)?w:[w,w,w];
   if(ks.length!==3||ks.some(x=>!Number.isFinite(x)||x<0||x>1))throw new Error('contact joint weights must be three finite values in [0,1]');
   for(let i=0;i<3;i++){
    const name='v2p_'+side[0].toUpperCase()+'_'+finger+(i+1),bone=V.bones[name],q=family.targets[finger+(i+1)];
    if(!bone||!q||q.length!==4||q.some(x=>!Number.isFinite(x)))throw new Error('invalid contact endpoint '+name);
    C.restore[name]=bone.quaternion.toArray();
    const target=new T.Quaternion(q[0],side==='right'?-q[1]:q[1],side==='right'?-q[2]:q[2],q[3]);
    if(Math.abs(target.length()-1)>1e-6)throw new Error('contact endpoint quaternion is not unit length');
    const src=family.sources[finger+(i+1)];if(!src||src.length!==4)throw new Error('missing contact source');const source=new T.Quaternion(src[0],side==='right'?-src[1]:src[1],side==='right'?-src[2]:src[2],src[3]);if(Math.abs(source.length()-1)>1e-6)throw new Error('nonunit source');bone.quaternion.copy(source).slerp(target,ks[i]);applied[side].joints[name]=bone.quaternion.toArray();
   }
  }
 }
 flareInspector.viewer.coach.updateMatrixWorld(true);
 flareInspector.viewer.coach.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.update();});
 C.last=applied;return result;
};
})();
