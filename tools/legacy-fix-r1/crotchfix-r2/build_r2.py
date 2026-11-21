# crotchfix-v5-r2 patch builder (legacy-fix-r1 b3r2, 2026-11-21). Offline, numpy/scipy only; writes nothing but --out.
#   CF_DUMPS=<dir with mesh.json from dump.mjs --mesh> python3 build_r2.py --out tools/v5/runtime/model/crotchfix-v5-r2.weights.json
# r2 = r1 unchanged in method and numbers (biharmonic re-weighting of pelvis/spineLower/leftThigh/rightThigh inside the R 0.18 m ball
# around the crotch point, see crotchfix-v5-r1.js) + ONE extra local pass only at the back edge of that ball: a second biharmonic solve
# in a 0.08 m ball centred on the top of the gluteal cleft (pelvis-bind offset (0,-0.03,-0.12) m, i.e. where the r1 ball's back edge
# cuts the buttocks), with the r1 weights as the fixed boundary everywhere outside it. Nothing outside that small ball differs from r1.
# Why: on deep seated straddles / butterfly the r1 ball's back edge sat exactly on the cleft top -> a 29-35 mm ridge there.
# Self-check: the r1 solve here must reproduce tools/v5/runtime/model/crotchfix-v5-r1.weights.json byte for byte, else it stops.
import sys,os,json,pickle,argparse
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from v5lib import *
import geo,wsolve2
from patch import make_patch
REPO=os.path.abspath(os.path.join(os.path.dirname(__file__),'../../..'))
R1={'R':0.18,'seam':False,'inner':False}
BACK={'C':[0,-0.03,-0.12],'R':0.08}
ap=argparse.ArgumentParser();ap.add_argument('--out',required=True);a=ap.parse_args()
M=prep(load_mesh());G=groin_setup(M);g=geo.build(M,2)
W1,_=wsolve2.solve(g,G['pel0'],R1)
p1,_=make_patch(M,g,W1,R1,'crotchfix-v5-r1')
ref=json.load(open(os.path.join(REPO,'tools/v5/runtime/model/crotchfix-v5-r1.weights.json')))
assert p1==ref,'r1 not reproduced: dump/model differs'
g2=dict(g);g2['W']=W1
W2,_=wsolve2.solve(g2,G['pel0'],dict(seam=False,inner=False,C=tuple(BACK['C']),R=BACK['R']))
p2,_=make_patch(M,g,W2,{'r1':R1,'backEdge':BACK},'crotchfix-v5-r2')
json.dump(p2,open(a.out,'w'),separators=(',',':'))
print(json.dumps({'out':a.out,'count':p2['count'],'r1count':p1['count'],'origChecksum':p2['origChecksum']}))
