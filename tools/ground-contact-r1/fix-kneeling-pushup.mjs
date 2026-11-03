// h-kneeling-pushup: both tucked-toe feet planted 71 mm further back (pole +35.5 mm) so the armfix-r2 legs open up and the
// knee skin rests on y=0 instead of 60 mm under it. Pelvis path, hands and push-up timing unchanged.
export function fix(s){for(const k of ['left','right']){const F=s.pose.base.feet[k];F.at[0]=+(F.at[0]+0.071).toFixed(4);F.pole[0]=+(F.pole[0]+0.0355).toFixed(4);}}
