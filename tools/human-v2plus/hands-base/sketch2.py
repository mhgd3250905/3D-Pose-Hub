# thumb-web close-ups of the base hand (hands_fit.npz) on the v2 finger rig, offline LBS.  sketch2.py <out.jpg> [pose ...]
import sys
from PIL import Image
from sketch import *
if __name__=='__main__':
    poses=sys.argv[2:] or ['grip-bar','palm-floor']
    d=np.load('hands_fit.npz'); XB,FBm,Wf=d['X'],d['F'],d['Wf']; SK=[214,170,140]; rows=[]
    for pn in ['rest']+poses:
        pose={} if pn=='rest' else HJ['poses'][pn]; Bq=skin(XB,Wf,['leftHand']+FB,pose); r=[]
        for dv in ((0,1,0.001),(0,-1,0.001),(0.2,-0.3,1),(-0.6,-0.2,0.8)):
            r.append(label(raster([(Bq,FBm,SK,None)],dv,(0.08,-0.02,0.05),0.11,360),pn+' '+str(dv)))
        rows.append(np.concatenate(r,1))
    Image.fromarray(np.concatenate(rows,0)).save(sys.argv[1],quality=88); print('saved',sys.argv[1])
