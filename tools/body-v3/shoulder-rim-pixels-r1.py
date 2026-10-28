"""Identify the rest shoulder rim component and its reference boundary."""
import hashlib,json,sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label,binary_dilation,distance_transform_edt
before,after,out=map(Path,sys.argv[1:]);
if out.exists():raise SystemExit('output already exists')
a=np.asarray(Image.open(before).convert('RGB'),float)[380:475,175:215];b=np.asarray(Image.open(after).convert('RGB'),float)[380:475,175:215]
orange=(b[:,:,0]>120)&(b[:,:,0]>b[:,:,1]*1.35)&(b[:,:,0]>b[:,:,2]*1.6);lab,count=label(orange,structure=np.ones((3,3),int))
if count!=1:raise ValueError('ROI is not a single component')
dark=np.linalg.norm(a-[42,44,50],axis=2)<np.linalg.norm(a-[51,54,61],axis=2);boundary=binary_dilation(dark)&binary_dilation(~dark);dist=distance_transform_edt(~boundary)[orange];yy,xx=np.where(orange)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
result={'beforeSha256':sha(before),'afterSha256':sha(after),'roi':[175,380,215,475],'orangeCount':int(orange.sum()),'components8Connected':int(count),'referenceBoundaryDistancePx':{'median':float(np.median(dist)),'p95':float(np.percentile(dist,95)),'max':float(dist.max()),'within1':int((dist<=1).sum()),'within2':int((dist<=2).sum())},'pixels':[[int(x+175),int(y+380)] for y,x in zip(yy,xx)]}
with out.open('x',encoding='utf-8') as f:json.dump(result,f,indent=2)
print(json.dumps({k:v for k,v in result.items() if k!='pixels'}))
