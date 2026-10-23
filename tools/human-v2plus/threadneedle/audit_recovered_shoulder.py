"""CPU-only bounded diagnosis against hash-verified DOT128 recovery.

Run from the recovered CPU workspace; no archive or production writes.
The optional output must be a fresh JSON file.
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np

sys.dont_write_bytecode = True
sys.path.insert(0, "PoseHub-Dot-Deliveries/preflight-127-repair-r5")
import path_fixed as P
from patch_math import p, strict_pairs

B, C, Rot = P.B, P.C, P.Rot
raw = B.F["SRCMODELS"]["Mesh005"]
nt = len(B.torso.bind)
F = p["F"]
selected = np.array(sorted(set(p["face_ids"]) | {11257,11837,20613,20619,31881,31891,41243,41249}))
outside = np.setdiff1d(np.arange(len(F)), selected)


def old_skin(T, mesh):
    Q = np.array([T.get(n, (np.eye(3), np.zeros(3)))[0] for n in mesh["names"]])
    t = np.array([T.get(n, (np.eye(3), np.zeros(3)))[1] for n in mesh["names"]])
    J, W = mesh["J"], mesh["W"]
    A = (Q[J] * W[:, :, None, None]).sum(1)
    b = (t[J] * W[:, :, None]).sum(1)
    return np.einsum("nij,nj->ni", A, mesh["bind"]) + b


def inspect(label, X):
    si, shared, cp = strict_pairs(X, F[selected], F[selected], True)
    ex, _, cp2 = strict_pairs(X, F[selected], F[outside])
    tri = X[F[selected]]
    areas = np.linalg.norm(np.cross(tri[:, 1]-tri[:, 0], tri[:, 2]-tri[:, 0]), axis=1)
    r = {"candidate": label, "internalCrossings": len(si), "externalCrossings": len(ex),
         "sharedFeatureExtendedCrossings": int((shared > 0).sum()),
         "coplanarOverlap": cp+cp2, "minYmm": float(X[np.unique(F), 1].min()*1000),
         "minimumDoubleAreaM2": float(areas.min()),
         "internalSourceExamples": selected[si[:8]].tolist(),
         "externalSourceExamples": [[int(selected[a]), int(outside[b])] for a,b in ex[:8]]}
    print(json.dumps(r), flush=True)
    return r


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    out = Path(args.output)
    if out.exists():
        raise FileExistsError(out)
    results = [inspect("calibrated-rest", p["V"])]
    s = P.geometry(1)
    for name, roll in [("original-roll", s["roll"]),
                       ("without-extra-25deg", s["roll"]-np.deg2rad(25)),
                       ("shortest-swing-no-axial-roll", 0.)]:
        T = dict(s["T"])
        Q = s["Qbase"] @ Rot.from_rotvec(C.axis * roll).as_matrix()
        T["leftUpperArm"] = Q, s["S"]-Q@B.rig["leftShoulder"]
        tv, ov = B.torso.points(T), old_skin(T, raw)
        # Runtime seam owners are authoritative. Every duplicate gets its actual owner.
        for a,b in p["G"]["pairs"]:
            tv[a] = ov[b]
        X = np.vstack([tv, ov])
        results.append(inspect(name+"-without-legacy-corrective", X))
        results[-1]["upperArmRollDegrees"] = float(np.rad2deg(roll))
        results[-1]["shoulderBand"] = C.tri_band(tv,B.torso.ix,C.smask)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps({"kind":"cpu-diagnosis-not-runtime-acceptance", "results":results},indent=2),encoding="utf-8")


if __name__ == "__main__":
    main()
