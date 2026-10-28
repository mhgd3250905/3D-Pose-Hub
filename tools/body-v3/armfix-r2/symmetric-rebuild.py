"""Rebuild c1r2 with the missing right-hand scale applied before subdivision.

CPU-only. Historical sources are read from a pinned Git commit, never modified.
The pre-scale rig/frame is reconstructed from the unmodified c1 right mesh;
rounded historic joint coordinates mean this is a measured reconstruction,
not a byte-identical reproduction of a lost workstation intermediate.
"""
import argparse, base64, copy, hashlib, json, subprocess
from pathlib import Path
import numpy as np
from scipy.optimize import brentq

REPO=Path(__file__).resolve().parents[3]
REV="d448b0b22a4f41285ba52b9cfd43d7bfad7750af"
MODEL="hands-native-c1r2-symmetric-r1"
S=.851

def sha(raw):return hashlib.sha256(raw.replace(b"\r\n",b"\n")).hexdigest()
def historical(path):return subprocess.check_output(["git","show",REV+":"+path],cwd=REPO)
def unpack(s,t,k):return np.frombuffer(base64.b64decode(s),t).reshape(-1,k)
def positions(d):return np.array(d["pos"]["lo"])+unpack(d["pos"]["u16"],"<u2",3)*d["pos"]["scale"]
def b64(a):return base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
def ss(x):u=np.clip(x,0,1);return u*u*(3-2*u)
def sm(x):return 1+(S-1)*ss(x/.035)
def writej(p,d):p.write_text(json.dumps(d,separators=(",",":"))+"\n",encoding="utf-8")

def main():
 ap=argparse.ArgumentParser();ap.add_argument("--rest",type=Path,required=True);ap.add_argument("--out",type=Path,default=REPO/"drill-anim/models"/MODEL);args=ap.parse_args()
 out=args.out;out.mkdir(parents=True,exist_ok=True)
 if (out/"hands-base.json").exists():raise SystemExit("Use a fresh output path; candidates are immutable")
 hp="drill-anim/models/hands-native-c1/";source={p:historical(p) for p in [hp+"hands-base.json",hp+"hands-rig.json","tools/body-v3/hands-c/build_c.py","tools/body-v3/hands-c/build_c1r2.py","tools/body-v3/hands-c/frame.py"]}
 d=json.loads(source[hp+"hands-base.json"]);rig=json.loads(source[hp+"hands-rig.json"]);X=positions(d)
 J=unpack(d["joints"]["u8"],"u1",4);W=unpack(d["weights"]["u8"],"u1",4);dom=np.array(d["bones"])[J[np.arange(len(J)),W.argmax(1)]]
 aa=[];bb=[]
 for f,v in rig["fingers"].items():
  old=[]
  for j in np.array(v["joints"]):
   x=brentq(lambda x:x*sm(x)-j[0],0,.4);old.append(j/sm(x))
  old=np.array(old)
  for k in range(3):
   pts=X[(dom==f"v2p_R_{f}{k+1}")&(X[:,0]<0)]*[-1,1,1]
   if len(pts)>20:aa.append((old[k]+old[k+1])/2);bb.append(pts.mean(0))
 A=np.array(aa);B=np.array(bb);ca=A.mean(0);cb=B.mean(0);U,sv,Vt=np.linalg.svd((A-ca).T@(B-cb));R=Vt.T@np.diag([1,1,np.sign(np.linalg.det(Vt.T@U.T))])@U.T;t=cb-R@ca
 # Refine the scale centre from paired distal vertices. At x >= 35 mm the
 # historical mapping is globally affine: left = S*mirrored_right+(1-S)*t.
 half=d["seam"]["first"]//2
 distal=np.array([name.startswith("v2p_L_") and name[-1] in "23" and "thumb" not in name for name in dom[:half]])
 centres=(X[:half][distal]-S*X[half:half*2][distal]*[-1,1,1])/(1-S)
 t_fit=np.median(centres,axis=0);frame_initial=t.copy();t=t_fit
 ids=np.where(X[:,0]<0)[0];L=(X[ids]*[-1,1,1]-t)@R;L2=L*sm(L[:,0])[:,None]
 # Original rootBlendM=.028 branch, with wristRadial=width=palmThickness=1.
 ring=X[d["seam"]["first"]:];ring=ring[ring[:,0]<0]*[-1,1,1];lr=(ring-t)@R;c0=lr[:,1:].mean(0);th=np.arctan2(lr[:,2]-c0[1],lr[:,1]-c0[0]);rad=np.linalg.norm(lr[:,1:]-c0,axis=1);order=np.argsort(th);th=th[order];rad=rad[order]
 m=(L[:,0]>0)&(L[:,0]<.028);xx=L[m,0];Q=L2[m,1:];bins=np.linspace(0,.028,15);cbins=np.array([L2[np.abs(L[:,0]-b)<.002,1:].mean(0) for b in bins]);assert np.isfinite(cbins).all()
 cx=np.stack([np.interp(xx,bins,cbins[:,0]),np.interp(xx,bins,cbins[:,1])],1);w=ss(xx/.028)[:,None];c=c0+(cx-c0)*w;D=Q-cx;ang=np.arctan2(D[:,1],D[:,0]);radius=np.linalg.norm(D,axis=1);r0=np.interp(ang,np.r_[th-2*np.pi,th,th+2*np.pi],np.r_[rad,rad,rad]);rn=r0+(radius-r0)*w[:,0];L2[m,1:]=c+np.stack([np.cos(ang),np.sin(ang)],1)*rn[:,None]
 Y=X.copy();Y[ids]=(L2@R.T+t)*[-1,1,1];Y[d["seam"]["first"]:]=X[d["seam"]["first"]:]
 # Preserve original c1 quantizer so its left and seam packed coordinates stay exact.
 q=np.round((Y-d["pos"]["lo"])/d["pos"]["scale"]);assert q.min()>=0 and q.max()<=65535
 corrected=copy.deepcopy(d);corrected["pos"]["u16"]=b64(q.astype("<u2"))
 rest=json.loads(args.rest.read_text(encoding="utf-8"));stage=source["tools/body-v3/hands-c/build_c1r2.py"].decode()
 stage=stage.replace("REPO='/workspace/ph/';M=REPO+'drill-anim/models/'", "REPO=str(repo_path)+'/' ;M=REPO+'drill-anim/models/'")
 stage=stage.replace("SRC=M+'hands-native-c1/';OUT=M+'hands-native-c1r2/';XE=float(sys.argv[1]) if len(sys.argv)>1 else 0.010", "SRC=M+'hands-native-c1/';OUT=str(output_path)+'/' ;XE=.010")
 stage=stage.replace("rest=json.load(open('/workspace/hands-src/rest/rest.json'))", "rest=rest_input")
 stage=stage.replace("d=json.load(open(SRC+'hands-base.json'));B=len(d['bones'])", "d=corrected_input;B=len(d['bones'])")
 env={"repo_path":REPO,"output_path":out,"rest_input":rest,"corrected_input":corrected};exec(compile(stage,"historical-build_c1r2.py","exec"),env)
 generated=json.loads((out/"hands-base.json").read_text());old=json.loads((REPO/"drill-anim/models/hands-native-c1r2/hands-base.json").read_text());P=positions(generated);O=positions(old)
 # Retain the frozen quantizer and exact left/seam encoded positions.
 # Runtime weld identifiers remain identical; no re-quantization drift at the seam.
 final=np.array(env["P"],copy=True);final[O[:,0]>0]=O[O[:,0]>0];final[old["seam"]["first"]:]=O[old["seam"]["first"]:]
 # Paired interior vertices share MakeHuman topology. Remove residual left/right
 # wrist-fit asymmetry with a smoothstep correspondence correction in 0..35 mm;
 # beyond 35 mm the target is the frozen corrected left shape mirrored exactly.
 # Seam zipper edges have different topology and are deliberately not paired.
 from scipy.spatial.transform import Rotation
 lh=rest["bones"]["leftHand"];T=Rotation.from_quat(lh["q"]).as_matrix()
 pairs={i:i+half for i in range(half)}
 mid=env["mid"]
 for (a,b),idx in mid.items():
  if a<half and b<half:
   other=mid.get((a+half,b+half))
   if other is not None:pairs[idx]=other
 correction=[]
 for li,ri in pairs.items():
  x=((final[li]-lh["p"])@T)[0];weight=float(ss(x/.035))
  before=final[ri].copy();final[ri]+=(final[li]*[-1,1,1]-final[ri])*weight;correction.append(float(np.linalg.norm(final[ri]-before)))
 correspondence={"pairedInteriorVerticesPerSide":len(pairs),"blendHandLocalM":[0,.035],"maxCorrectionMm":max(correction)*1000,"reason":"Original left/right wrist zipper fitting introduced small interior asymmetry; shared interior topology permits exact distal mirror while preserving each wrist seam."}
 quant=np.round((final-old["pos"]["lo"])/old["pos"]["scale"]);assert quant.min()>=0 and quant.max()<=65535
 generated["pos"]={**old["pos"],"u16":b64(quant.astype("<u2"))};P=positions(generated)
 # Recompute the changed right normals, including shared limb seam normals.
 normalP=P.copy();first=old["seam"]["first"];body=np.array(rest["meshes"]["Coach_Body"]["P"]).reshape(-1,3)
 normalP[first:]=body[np.array(old["seam"]["vid"])];hn=env["an"](normalP,env["FF"]);length=np.linalg.norm(hn,axis=1);assert length.min()>0
 normals=hn/length[:,None];packed=unpack(old["nrm"]["i8"],"i1",3).copy();right=P[:,0]<0;packed[right]=np.round(normals[right]*127).astype("i1")
 limbPacked=unpack(old["limbsNrm"]["i8"],"i1",3).copy()
 for k,li in enumerate(generated["limbsNrm"]["idx"]):
  if not right[first+k]:continue
  v=hn[first+k]+env["ln"][li];v/=np.linalg.norm(v);packed[first+k]=np.round(v*127).astype("i1");limbPacked[k]=packed[first+k]
 generated["nrm"]={"i8":b64(packed)};generated["limbsNrm"]["i8"]=b64(limbPacked)
 generated["source"]+=" symmetric-r1: missing right c1 scale applied before the original subdivision/wrist rebuild; rounded historic frame reconstructed and affine centre refined from paired distal points."
 generated["report"]["symmetricR1"]={"frameRotation":R.tolist(),"frameCentre":t.tolist(),"initialFrameCentre":frame_initial.tolist(),"distalAffineResidualMaxMm":float(np.linalg.norm(X[:half][distal]-(S*X[half:half*2][distal]*[-1,1,1]+(1-S)*t),axis=1).max()*1000),"correspondence":correspondence,"leftReproductionMaxMm":float(np.linalg.norm(P[O[:,0]>0]-O[O[:,0]>0],axis=1).max()*1000)}
 # Keep the frozen rig byte-identical: it was already scaled for both sides.
 writej(out/"hands-base.json",generated);(out/"hands-rig.json").write_bytes((REPO/"drill-anim/models/hands-native-c1r2/hands-rig.json").read_bytes())
 provenance={"gitCommit":REV,"historicalLfSha256":{p:sha(raw) for p,raw in source.items()},"restCapture":{"path":str(args.rest.resolve()),"sha256":hashlib.sha256(args.rest.read_bytes()).hexdigest()},"recipe":{"scale":S,"bandM":.035,"rootBlendM":.028,"wristRadial":1,"wristRebuildEndM":.010},"reconstruction":generated["report"]["symmetricR1"]}
 writej(out/"build-provenance.json",provenance);print(json.dumps(provenance["reconstruction"],indent=2))
if __name__=="__main__":main()
