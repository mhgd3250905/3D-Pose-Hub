// h-short-side-plank: pelvis +26 mm (static hold) so the lower knee/shin and the support elbow/forearm skin rest on y=0.
export function fix(s){s.pose.base.pelvis[1]=+(s.pose.base.pelvis[1]+0.026).toFixed(6);}
