import sys, math, numpy as np
sys.path.insert(0, '/workspace/work/pose-hub/tools/v5/breaking')
from armfix import pronation, humerus_twist
Z = np.load(sys.argv[1]); sd = sys.argv[2]; sg = 1 if sd == 'left' else -1; X3 = np.eye(3)[0]
n3 = lambda v: v / np.linalg.norm(v)
from scipy.spatial.transform import Rotation as Rot
for i in range(0, Z['P_pelvis'].shape[0], int(sys.argv[3]) if len(sys.argv) > 3 else 8):
    P = lambda j: Z['P_' + j][i]; W = lambda j: Z['W_' + j][i]
    e = n3(P(sd + 'Forearm') - P(sd + 'UpperArm')); f = n3(P(sd + 'Hand') - P(sd + 'Forearm'))
    el = math.degrees(math.acos(np.clip(e @ f, -1, 1)))
    hw = humerus_twist(W('torso'), sg, e, W(sd + 'UpperArm')[:, 2]); pr = pronation(W(sd + 'UpperArm'), W(sd + 'Forearm'), e, f)
    q = Rot.from_matrix(W(sd + 'Forearm').T @ W(sd + 'Hand')).as_quat(); v = q[:3] @ (sg * X3); ht = (math.degrees(2 * math.atan2(v, q[3])) + 180) % 360 - 180
    print('%.2fs f%.1f elb %3.0f hw %+4.0f pr %+4.0f ht %+4.0f handH %.2f' % (i / 120, 10118 + i / 4, el, hw, pr, ht, P(sd + 'Hand')[1]))
