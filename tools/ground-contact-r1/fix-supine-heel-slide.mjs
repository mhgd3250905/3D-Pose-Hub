// h-supine-heel-slide: both floor hands slide 57 mm toward the feet so the armfix-r2 arm lies straighter and the
// elbows/forearms rest on y=0 instead of 19 mm under it.
export function fix(s){for(const k of ['left','right'])s.pose.base.hands[k].at[0]=+(s.pose.base.hands[k].at[0]+0.057).toFixed(4);}
