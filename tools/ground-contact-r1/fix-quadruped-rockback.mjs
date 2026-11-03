// h-quadruped-rockback: pelvis y +50 mm; hip pitch lowered 10 deg (start) -> 17 deg (fully rocked back), minus a 6p(1-p) mid-rock ease.
export function fix(s){const T=s.timeline.tracks;if(T.k0.length!==T.k2.length||T.k1.length!==T.k2.length)throw Error('track length');
  for(let i=0;i<T.k1.length;i++){const p=Math.min(1,Math.max(0,(T.k0[i][1]+0.434)/(-0.555+0.434)));T.k1[i][1]+=0.05;T.k2[i][1]-=10+7*p-6*p*(1-p);}}
