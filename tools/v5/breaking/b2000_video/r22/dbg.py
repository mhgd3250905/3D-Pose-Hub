import json,numpy as np
from fkj import *
n=json.load(open('anim-2000-r22e.json'))['frames']
for f in (204,206,208):
    W,P=fk(n[f])
    print(f,'elb',round(elbow(W,P,'right')),'sh->wr',round(np.linalg.norm(P['rightHand']-P['rightUpperArm']),3),'wr',np.round(P['rightHand'],3),'thigh',np.round(P['rightThigh'],3),np.round(P['rightShin'],3),'pelvis',np.round(P['pelvis'],3))
