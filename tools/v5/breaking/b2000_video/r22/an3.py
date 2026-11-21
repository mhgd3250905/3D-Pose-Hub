import json,numpy as np
from fkj import *
from scipy.spatial.transform import Rotation as R
a=json.load(open('anim-2000-r22d.json'));F=a['frames']
print('rest LP feet',LP['leftFoot'],LP['leftShin'], 'restQ foot', json.load(open(REST))['restQ'].get('leftFoot') if isinstance(json.load(open(REST))['restQ'],dict) else '')
def e(q): return np.round(R.from_quat(q).as_euler('XYZ',degrees=True),0)
for f in range(0,914,12):
    fr=F[f]
    sp=R.from_quat(fr['q']['spineLower'])*R.from_quat(fr['q']['spineUpper'])*R.from_quat(fr['q']['torso'])
    print(f,'lock',fr['lock'],'spine',e(sp.as_quat()),'LF',e(fr['q']['leftFoot']),'RF',e(fr['q']['rightFoot']))
