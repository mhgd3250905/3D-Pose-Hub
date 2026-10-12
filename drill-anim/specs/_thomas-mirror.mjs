// Reflection of pose DATA, including rotation axes and anatomical side labels.
// Keeps joint solving and contact QA real; the rendered pixels are never flipped.
const sideName = s => typeof s === 'string' ? s.replace(/left|right|handL|handR|footL|footR/g, v => ({left:'right',right:'left',handL:'handR',handR:'handL',footL:'footR',footR:'footL'})[v]) : s;
const flipX = a => { if (Array.isArray(a) && typeof a[0] === 'number') a[0] *= -1; };
const rotations = list => { for (const r of list || []) if (Array.isArray(r?.[0])) { if (typeof r[0][1] === 'number') r[0][1] *= -1; if (typeof r[0][2] === 'number') r[0][2] *= -1; } };
const swap = o => { if (!o) return; const l=o.left,r=o.right;delete o.left;delete o.right;if(r!==undefined)o.left=r;if(l!==undefined)o.right=l; };
function limb(o) {
  if (!o) return;
  for (const k of ['at','ankle','wrist','palmAt','finger','normal','pole','poleUp','poleLow','poleRel','arcDir']) flipX(o[k]);
  rotations(o.rot);
  for (const k of ['heading','roll','thighTwist','kneeTwist']) if (typeof o[k]==='number') o[k]*=-1;
  limb(o.plant);limb(o.free);
}
function descriptor(o) {
  flipX(o.pelvis);if(o.hips){flipX(o.hips.up);flipX(o.hips.front);rotations(o.hips.rot);}
  if(o.chest){rotations(o.chest.body);rotations(o.chest.waist);}
  if(o.shoulders){swap(o.shoulders);for(const v of Object.values(o.shoulders))flipX(v);}
  for(const k of ['hands','feet'])if(o[k]){swap(o[k]);limb(o[k].left);limb(o[k].right);}
  for(const c of o.constraints||[]){if(!c)continue;if(c.limb)c.limb=sideName(c.limb);if(c.joint)c.joint=sideName(c.joint);flipX(c.axis);flipX(c.at);}
  return o;
}
export function mirrorSpec(original) {
  const s=structuredClone(original);s.id+='-left';s.name+='（左侧）';s.nameEn+=' (Left)';
  descriptor(s.pose.base);for(const d of Object.values(s.pose.deltas||{}))descriptor(d);
  flipX(s.camera.dir);if(s.highlight.side==='right')s.highlight.side='left';else if(s.highlight.side==='left')s.highlight.side='right';
  s.shadow.joints=s.shadow.joints.map(sideName);for(const b of s.shadow.blobs||[])b.j=sideName(b.j);
  for(const p of s.props||[])flipX(p.at);
  for(const p of s.qa.pins||[])p.c=sideName(p.c);
  for(const p of s.qa.straight||[])p.j=p.j.replace(/left|right/g,v=>v==='left'?'right':'left');
  return s;
}
