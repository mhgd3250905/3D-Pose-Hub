# M10f asset prep (run once): "Free Mannequin Head" by SPLiNER (Printables 1257615, CC BY 4.0) high-res STL -> assets/spliner-head-pts.npz
#   python3 prep_ready.py spliner1.stl   (the high-res STL from the Printables download; 128k verts, mm, up = +z, face toward -y)
#  Stores the vertex cloud (uint16-quantized, lo / scale in mm) with area-weighted outward vertex normals (int8): all head_e.py's
#  HD_FACE=ready point-cloud distance field needs. The lightweight STL (assets/spliner-mannequin-head-light.stl) is kept as the original.
import sys, numpy as np
b=open(sys.argv[1],'rb').read(); n=np.frombuffer(b[80:84],np.uint32)[0]
T=np.frombuffer(b[84:84+n*50],np.dtype([('n','<f4',3),('v','<f4',(3,3)),('a','<u2')]))['v'].astype(float)
V,inv=np.unique(T.reshape(-1,3).round(5),axis=0,return_inverse=True); F=inv.reshape(-1,3)
Fn=np.cross(V[F[:,1]]-V[F[:,0]],V[F[:,2]]-V[F[:,0]]); N=np.zeros_like(V)
for c in range(3): np.add.at(N,F[:,c],Fn)
N/=np.linalg.norm(N,axis=1,keepdims=True)
if np.einsum('ij,ij->i',N,V-V.mean(0)).mean()<0: N=-N
lo=V.min(0); sc=(V.max(0)-lo)/65535
np.savez_compressed('assets/spliner-head-pts.npz',P=np.round((V-lo)/sc).astype(np.uint16),lo=lo,scale=sc,N=np.round(N*127).astype(np.int8),
  source=np.array('Free Mannequin Head by SPLiNER, Printables 1257615, CC BY 4.0 (high-res STL, vertex cloud + normals)'))
print('verts',len(V),'faces',len(F),'bbox mm',lo.round(3),V.max(0).round(3))
