
import os as _os
REPO = _os.path.abspath(_os.path.join(_os.path.dirname(__file__), '../../..'))
WORK = _os.environ.get('HV3_WORK', _os.path.join(REPO, 'output/human-v3-work'))
import numpy as np, preview, sys, colorsys
d = np.load(WORK + '/out/rest.npz'); Y = np.load(WORK + '/out/posed_bp.npy'); NB = len(Y)
T = d['T']; T = T[(T < NB).all(1)]
lab = np.load(sys.argv[1])[sys.argv[2]]
rng = np.random.RandomState(3); pal = np.array([colorsys.hsv_to_rgb((i * 0.618) % 1, 0.75 if i % 2 else 0.95, 0.95 if i % 3 else 0.7) for i in range(64)]); pal[0] = [0.55, 0.55, 0.55]
lt = lab[T]; fl = np.array([np.bincount(r).argmax() for r in lt])
preview.shade(Y, T, cols=pal[fl], views=('front', 'back', 'side'), out=sys.argv[3], size=6)
print(np.bincount(lab[lab > 0]))
