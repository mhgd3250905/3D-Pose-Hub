// Current armfix-r2 authoring geometry. Old helpers and frozen specs remain intact.
export {build,keys,breath,lerp,add,sub,mul,norm,armDir} from '../lib/home-anim.mjs';
export {rot,rotAbout,restToWorld,footRotW,track,frames,sampler,sg,r4,DEG} from '../lib/ss-geo.mjs';
import {rotAbout,restToWorld,sg,r4,DEG} from '../lib/ss-geo.mjs';
import {armDir} from '../lib/home-anim.mjs';
export const TH=.409739814,SH=.416772719,UA=.2567805323,FA=.2280465039;
export const REST={pelvis:[0,.963525171859,.008228798312],waist:[0,1.08554168,.0040458],shoulderCenter:[0,1.370247,-.004196],head:[0,1.54221,.01087],hip:s=>[sg(s)*.081543,.915935171859,.003696798312],shoulder:s=>[sg(s)*.187907,1.370247,-.004196]};
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,k)=>a.map(x=>x*k);
export function leg(s,flex,knee,extra=[]){const H=REST.hip(s),f=flex*DEG,g=(flex-knee)*DEG;let K=add(H,mul([0,-Math.cos(f),Math.sin(f)],TH)),A=add(K,mul([0,-Math.cos(g),Math.sin(g)],SH));for(const [ax,d]of extra){K=rotAbout(K,H,ax,d);A=rotAbout(A,H,ax,d);}return {hip:H,knee:r4(K),ankle:r4(A)};}
export const restPtW=(h,P,p)=>r4(add(P,restToWorld(h,sub(p,REST.pelvis))));
export const armWrist=(s,phi,psi=0,AR=UA+FA,dx=0)=>{const S=REST.shoulder(s),d=armDir(s,phi,psi);return [S[0]+d[0]*AR-sg(s)*dx,S[1]+d[1]*AR,S[2]+d[2]*AR];};
