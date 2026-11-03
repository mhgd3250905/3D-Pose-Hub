// h-quadruped-open: quadruped base pelvis +63 mm, hip pitch 12.778 -> 7.778 deg (thigh vertical, knee skin on y=0).
export function fix(s){const b=s.pose.base;b.pelvis[1]=+(b.pelvis[1]+0.063).toFixed(6);b.hips.rot[0][1]=+(b.hips.rot[0][1]-5).toFixed(3);}
