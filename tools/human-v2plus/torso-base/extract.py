from blendread import Blend
import numpy as np, struct, sys
B=Blend('hbm.blend')
for b in B.of_code('OB'):
    o=b[5]; name=B.get('ID',B.get('Object',o,'id'),'name')
    if name=='OBGEO-body_male_realistic': break
me=B.byptr[B.get('Object',o,'data')][5]
L={l['name'] or l['type']:l for cd in ('vdata','edata','pdata','ldata') for l in B.cdlayers(B.get('Mesh',me,cd))}
V=np.frombuffer(B.data(L['position']['data']),np.float32).reshape(-1,3).astype(np.float64)
cv=np.frombuffer(B.data(L['.corner_vert']['data']),np.int32)
po=np.frombuffer(B.data(B.get('Mesh',me,'poly_offset_indices')),np.int32)
md=B.data(L[19]['data']); n=len(cv); D=[]
for i in range(n):
    tot,lvl,dp,hp=struct.unpack_from('<iiQQ',md,i*24)
    D.append(np.frombuffer(B.data(dp),np.float32).reshape(-1,3))
print('verts',V.shape,'loops',n,'polys',len(po)-1,'grid',D[0].shape, 'sizes',set(len(po[1:]-po[:-1]) for _ in [0]), np.unique(po[1:]-po[:-1],return_counts=True))
D=np.array(D); print('disp abs mean',np.abs(D).mean((0,1)),'max',np.abs(D).max((0,1)), 'p99', np.percentile(np.abs(D).reshape(-1,3),99,axis=0))
print('bbox',V.min(0),V.max(0))
# vertex groups
np.savez('male_raw.npz',V=V,cv=cv,po=po,D=D.astype(np.float32))
