import json,re,csv,collections
G=json.load(open('grp.json'));cat=G['cat'];med=G['med'];g=G['g']
c2={o['id']:o for o in json.load(open('c2.json'))}  # keyed by id; file-level need
import os
# c2 keyed by spec id; files with mismatched id: h-knee-hug-r2 etc -> map file->entry by reading order
c2l=json.load(open('c2.json'));files=sorted(f[:-3] for f in os.listdir('ph/drill-anim/specs') if f.endswith('.js'))
F={o['file']:o for o in c2l}
snap={a['id'] for a in json.load(open('snap.json'))['actions']}
pr15={'h-bent-knee-calf-raise-rr7':'PR15交付+手部r3外观确认(hand-r3-approval-20261023.md)','h-chair-single-leg-hip-thrust-rr8':'PR15交付+手部r3外观确认','h-fixed-bar-vertical-pull-rr7':'PR15七项交付(pr15-local-repair-delivery-20261024.md)，动作待审','h-kneeling-instep-stretch-rr6':'PR15七项交付，动作待审','h-db-overhead-triceps-extension-rr4':'PR15七项交付，动作待审','h-wall-palm-lift-rr5':'PR15七项交付，动作待审','h-kneeling-thread-needle-rr1':'PR15七项交付，低位小范围候选'}
def rk(f):
  m=re.search(r'-(rr?)(\d+)$',f);return (0,0) if not m else ((1 if m.group(1)=='r' else 2),int(m.group(2)))
rows=[];flags=[]
for a in sorted(g):
  vs=sorted(g[a],key=rk);ref=set()
  for src,d in (('catalog 0.3.0',cat),('media 0.2.0',med)):
    p=d.get(a)
    if p:ref.add(os.path.basename(p)[:-3])
  best=None;why=''
  pv=[v for v in vs if v in pr15]
  if pv:best=pv[-1];why=pr15[best]
  elif ref:
    best=sorted(ref,key=rk)[-1];why='、'.join(s for s,d in (('catalog 0.3.0',cat),('media 0.2.0 已发布',med)) if d.get(a))+' 引用'
  else:
    best=vs[-1];why='无确认/引用，取最新修订（待审）' if len(vs)>1 else '唯一版本'
  newer=[v for v in vs if rk(v)>rk(best)]
  if a=='s-frog':best='s-frog-r3';why='动作包v2六动作试制r2样片经开哥确认(pilot-approval-20261021.md)；catalog/media仍指 s-frog-r2';flags.append((a,'试制确认r3 vs 已发布r2'))
  elif newer:flags.append((a,f'选 {best}（引用版），但有更新未引用修订 {",".join(newer)}'))
  if a=='t-half-straddle':why='verify.mjs 标注 stopped（未接受）';flags.append((a,'已停用，是否计入'))
  if a.startswith('a-'):flags.append((a,'HipLab 自测静图集，是否算独立动作'))
  e=F[best]
  rows.append([a,best+'.js',why,';'.join(v for v in vs if v!=best),'是' if e['nat'] else '否',e['cat'],'是' if a in cat else '否','是' if a in med else '否','是' if a in snap else '否'])
w=csv.writer(open('actions-best.csv','w',encoding='utf-8-sig'));w.writerow(['action','best_spec','依据','其他版本','是否新手','手部类别','是否在catalog0.3.0','是否在media0.2.0','是否在v2全库189'])
w.writerows(rows)
print(len(rows));C=collections.Counter
print(C(r[0].split('-')[0] if not re.match(r'^[a-z]-',r[0]) else r[0][:2] for r in rows))
print('new/old',C(r[4] for r in rows));print(C(r[5] for r in rows))
print('in cat',sum(r[6]=='是' for r in rows),'in snap',sum(r[8]=='是' for r in rows))
print('snap not in groups',sorted(snap-set(g)));print('groups not in snap',sorted(set(g)-snap))
for f in flags:print(f)
print('multi',sum(1 for a in g if len(g[a])>1))
