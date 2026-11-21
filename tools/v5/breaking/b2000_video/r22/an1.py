import json,numpy as np
from fkj import *
a=json.load(open('anim-2000-r22d.json'));F=a['frames']
rest=json.load(open(REST)); print('rest keys',list(rest.keys())[:5])
for f in range(380,520,6):
    W,P=fk(F[f]); print(f,'lock',F[f].get('lock'),'RH',np.round(P['rightHand'],3),'LH',np.round(P['leftHand'],3))
