# grip pose helper: hand 'free' pose (frame world) that puts the baked power grip (#23 P.bakeGrip) around a given bar.
import json, numpy as np, sys
from scipy.spatial.transform import Rotation as Rot
import os
D = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'handframe.json')))   # P.bakeGrip(side) data + rest hand bone, from handframe-probe.js
PF = {'left': ([0.98253144, 0.05483374, 0.17783482], [0.06068526, -0.99777448, -0.02762938]),
      'right': ([-0.98253144, 0.05483374, 0.17783482], [-0.06068526, -0.99777448, -0.02762938])}
def local(side):
    # baked grip in the hand bone's LOCAL frame: c = handle centre, a = handle axis, pal = palmar direction (hand -> handle)
    d = D[side]; A = np.array(d['a'], float); P = np.array(d['pal'], float)
    return np.array(d['c'], float), A / np.linalg.norm(A), P / np.linalg.norm(P)
def frame(a, p):
    a = np.array(a, float); a /= np.linalg.norm(a); p = np.array(p, float); p = p - a * p.dot(a); p /= np.linalg.norm(p)
    return np.stack([a, p, np.cross(a, p)], 1)
def pose(side, bar, axis, palm):
    """Hand target {wrist, finger, normal} (frame 'world'; engine: hand bone world quat = E.handQ(finger, normal), whose
    palmFrame vectors are bone-local) so that the baked fist closes round the bar.
    bar: world point on the bar axis for the fist centre; axis: bar direction (sign = side the thumb wraps from);
    palm: world direction from the bar toward the palm (where the hand sits relative to the bar)."""
    c, A, P = local(side)
    R = frame(axis, -np.array(palm, float)) @ frame(A, P).T      # bone world rotation
    f, n = R @ np.array(PF[side][0]), R @ np.array(PF[side][1]); w = np.array(bar, float) - R @ c
    r = lambda v: [round(float(x), 4) for x in v]
    return {'wrist': r(w), 'finger': r(f), 'normal': r(n)}
if __name__ == '__main__':
    import ast
    side, bar, axis, palm = sys.argv[1], *[ast.literal_eval(x) for x in sys.argv[2:5]]
    print(json.dumps(pose(side, bar, axis, palm)))
