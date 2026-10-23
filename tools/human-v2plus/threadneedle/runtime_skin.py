"""Exact CPU palette evaluation from an actual browser rest capture.

Preserves each influence's bind-space transform. Inverting a weighted matrix
once and treating its result as shared canonical skin is not equivalent when
the bones have different reset transforms.
"""
import json
from pathlib import Path
import numpy as np


class RuntimeSkin:
    def __init__(self, record):
        self.names = record['bones']
        self.J = np.array(record['joints']).reshape(-1,4).astype(int)
        self.W = np.array(record['weights']).reshape(-1,4)
        self.bind = np.array(record['bindPositions']).reshape(-1,3)
        self.rest = np.array(record['points']).reshape(-1,3)
        self.ix = np.array(record['index']).reshape(-1,3)
        self.palette = np.array(record['skinMatrices']).reshape(-1,4,4).transpose(0,2,1)
        self.pre = np.array(record['pre']).reshape(4,4).T
        self.preInverse = np.linalg.inv(self.pre)
        self.homogeneous = np.c_[self.bind,np.ones(len(self.bind))]
        self.boneWorld=np.array(record['boneWorld']).reshape(-1,4,4).transpose(0,2,1)

    def use_canonical_frame(self, pivots):
        """Convert reset palette to Snow's original parallel-bone frame.

        motion.reset() is an arms-down pose, not the GLB bind pose. Spine helper
        world matrices already represent canonical deltas (identity in bind).
        """
        canonical=np.repeat(np.eye(4)[None],len(self.names),axis=0)
        for i,name in enumerate(self.names):
            if name in pivots:canonical[i,:3,3]=pivots[name]
            elif name not in ('spineLower','spineUpper'):
                raise ValueError('Missing canonical bone '+name)
        relative=canonical@np.linalg.inv(self.boneWorld)
        self.palette=self.pre@relative@self.preInverse@self.palette
        return self

    def points(self, transforms):
        D=np.repeat(np.eye(4)[None],len(self.names),axis=0)
        for i,name in enumerate(self.names):
            if name in transforms:
                D[i,:3,:3],D[i,:3,3]=transforms[name]
        palette=self.pre@D@self.preInverse@self.palette
        blend=(palette[self.J]*self.W[:,:,None,None]).sum(1)
        return np.einsum('nij,nj->ni',blend,self.homogeneous)[:,:3]


def load_capture(file):
    data=json.loads(Path(file).read_text(encoding='utf-8'))
    meshes={name:RuntimeSkin(record) for name,record in data['meshes'].items()}
    for name,mesh in meshes.items():
        error=np.linalg.norm(mesh.points({})-mesh.rest,axis=1).max()
        if error>1e-7:raise ValueError(f'{name}: reset replay error {error} m')
    return meshes
