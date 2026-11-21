import sys, numpy as np
sys.argv = ['fit2v.py', '../r21/anim-2000-r21c.json', '/dev/null', '0']
src = open('fit2v.py').read().split("r0 = res(x0.ravel())")[0]
exec(src)
Z = np.load(sys_arg if False else 'd2.npz'); x = Z['x']
for k in range(20, NK):
    W, P, loc = pose(k, x[k]); u = P['leftForearm'] - P['leftUpperArm']; f = P['leftHand'] - P['leftForearm']
    e = np.degrees(np.arccos(u @ f / np.linalg.norm(u) / np.linalg.norm(f)))
    sh = {s: np.degrees(Rot.from_matrix(loc[s + 'Shin']).as_rotvec()) for s in ('left', 'right')}
    sh0 = {s: np.degrees(Rot.from_matrix(pose(k, np.zeros(NV))[2][s + 'Shin']).as_rotvec()) for s in ('left', 'right')}
    print(KA[k], KJ[k], 'dpel', np.round(x[k, :3], 2), 'elb %.0f' % e, 'hand err %.3f' % np.linalg.norm(P['leftHand'] - REF[k][1]['leftHand']), 'LH', LHLOCK[k], 'shin0 L', np.round(sh0['left']), 'R', np.round(sh0['right']), '-> L', np.round(sh['left']), 'R', np.round(sh['right']))
