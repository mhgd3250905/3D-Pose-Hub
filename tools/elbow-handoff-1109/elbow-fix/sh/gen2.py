import json
exec(open('gen1.py').read().split('jobs=[]')[0])
v=[]
for c in [0.35,0.5,0.65]:
  for ae in [45,60]:
    for b in [-45,0,45]:
      v.append(mk(f'forearms-A__fa_e{ae}_b{b}_c{c}','forearms-A-r2-gc1-ht2.js',f"fixSide(s,'left',{-ae},{b},{c});fixSide(s,'right',{ae},{-b},{c});"))
json.dump([{'id':'forearms-A','variants':v}],open('jobs-s2.json','w'))
print(len(v))
