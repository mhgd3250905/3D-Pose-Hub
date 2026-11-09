import json
exec(open('gen5.py').read().split('V=[]')[0])
P=[('b1',dict(c=.2,k=.45,a=-12),dict(c=.2,k=.45,a=0)),('b2',dict(c=.2,k=.3,a=-12),dict(c=.2,k=.3,a=0)),
('b3',dict(c=.3,k=.45,a=-12),dict(c=.2,k=.45,a=0,b=10)),('b4',dict(c=.3,k=.3,a=-12),dict(c=.2,k=.45,a=0,b=-10)),
('b5',dict(c=.25,k=.3,a=-20),dict(c=.25,k=.3,a=-8)),('b6',dict(c=.15,k=.3,a=-12),dict(c=.15,k=.3,a=5)),
('b7',dict(c=.1,k=.3,a=-12),dict(c=.1,k=.3,a=10)),('b8',dict(c=0,k=.3,a=-12),dict(c=0,k=.3,a=15))]
V=[var(n,L,R) for n,L,R in P]
json.dump([{'id':'forearms-A','variants':V}],open('jobs-r5b.json','w'))
