# gen.py <before15.json> <id> <baseSpecRel> <newId> <mode:even|hand0> <sides> [recipeIn]
# writes drill-anim/specs/<newId>.js: time-varying elbowTwist table (deg) per side, ET = theta - theta' from the measured scan.
import json,sys,hashlib,pathlib
src,id,base,nid,mode,sides=sys.argv[1:7]; rin=sys.argv[7] if len(sys.argv)>7 else None
e=json.load(open(src))[id]
def unwrap(xs):
    out=[]
    for x in xs:
        if out:
            while x-out[-1]>180: x-=360
            while x-out[-1]<-180: x+=360
        out.append(x)
    return out
tab={}
for s in sides.split(','):
    th=unwrap([r[s]['theta'] for r in e['rows']]); so=unwrap([r[s]['solved'] for r in e['rows']])
    T=[a+b for a,b in zip(th,so)]
    if mode=='even2':
        w=lambda x:(x+180)%360-180
        T=unwrap([w(a+b) for a,b in zip(th,so)])
    if mode.startswith('even'): tgt=[x/2 for x in T]               # hand-vs-forearm = forearm roll = half the total
    else: tgt=[float(mode.split(":")[1])*(1 if s=="right" else -1)]*len(T)   # hand0:<deg> (right; left mirrored) constant hand-vs-forearm, forearm takes the rest
    et=[a-b for a,b in zip(th,tgt)]
    # keep the branch nearest 0 on average
    et=unwrap(et)
    m=sorted(et)[len(et)//2]; sh=round(m/360)*360; et=[x-sh for x in et]
    tab[s]=[[r['t'],round(x,1)] for r,x in zip(e['rows'],et)]
    print(s,'ET range',min(et),max(et))
js=f"""// {nid} (pose-fix r6, 2026-11-05): time-varying forearm roll (elbowTwist, deg) measured on armfix-r2 so the hand no longer
// counter-rolls against its forearm (mode {mode}; see docs/reviews/pose-fix-r1 r6). Hand positions/orientations, grip, props,
// poles, timing and camera unchanged; only the forearm roll about its own long axis changes.
import base from './{pathlib.Path(base).name}';
import {{ track }} from '../lib/ss-geo.mjs';
const s = structuredClone(base);
s.id = '{nid}';
const DUR = s.timeline.duration, TAB = {json.dumps(tab,separators=(',',':'))};
const lin = K => t => {{ t = ((t % DUR) + DUR) % DUR; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {{ const [a, x] = K[i - 1], [b, y] = K[i]; return x + (y - x) * (t - a) / (b - a); }} return K[K.length - 1][1]; }};
for (const [side, K] of Object.entries(TAB)) {{
  const k = 'ht1_' + side, b0 = s.pose.base.hands[side].elbowTwist ?? 0;
  s.timeline.tracks[k] = track(DUR, t => b0 + lin(K)(t));
  s.pose.base.hands[side].elbowTwist = 0;
  for (const d of Object.values(s.pose.deltas || {{}})) if (d.hands?.[side]?.elbowTwist !== undefined) throw Error('delta already drives elbowTwist');
  s.pose.deltas = {{ ...(s.pose.deltas || {{}}), [k]: {{ hands: {{ [side]: {{ elbowTwist: 1 }} }} }} }};
}}
export default s;
"""
sp=f'drill-anim/specs/{nid}.js'; pathlib.Path('/workspace/work/pose-fix-wt/'+sp).write_text(js)
if rin:
    r=json.load(open('/workspace/work/pose-fix-wt/'+rin)); r['spec']=sp
    r['specSha256Lf']=hashlib.sha256(js.encode().replace(b'\r\n',b'\n')).hexdigest()
    if isinstance(r.get('source'),dict) and 'selectedSpec' in r['source']: r['source']['selectedSpec']=sp
    json.dump(r,open(f'/workspace/work/pose-fix-r6/rc/{id}.json','w'),ensure_ascii=False,indent=2)
print('wrote',sp)
