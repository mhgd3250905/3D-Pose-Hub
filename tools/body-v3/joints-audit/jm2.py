exec(open('/workspace/body-v3/ja.py').read())
import json
S={s:load(s) for s in['rest','squat','plank','fold','neckflex','neckext','neckrot']}
M0,B0=S['rest']
pairs=[('neck bottom Mesh001->torso','Mesh001','V2P_Base_Torso',1.3,1.47),('head opening->Mesh001','Toon_Mannequin_Head_v5','Mesh001',-9,9),('ankle limbs->Coach_Body','V2P_Base_Limbs','Coach_Body',-9,0.3),('knee? limbs top->torso','V2P_Base_Limbs','V2P_Base_Torso',0.6,1.2),('shoulder torso->limbs','V2P_Base_Torso','V2P_Base_Limbs',1.2,1.47)]
sel={}
for nm,a,b,y0,y1 in pairs:
  P,N,F=M0[a];bv=bverts(F,P);sel[nm]=bv[(P[bv,1]>y0)&(P[bv,1]<y1)]
out={}
for s,(M,B) in S.items():
  r={}
  for nm,a,b,_,_ in pairs:
    Pa,Na,Fa=M[a];Pb,Nb,Fb=M[b];bv=sel[nm];ub=used(Fb);d,i=cKDTree(Pb[ub]).query(Pa[bv]);j=ub[i];ang=np.degrees(np.arccos(np.clip((Na[bv]*Nb[j]).sum(1),-1,1)))
    r[nm]=dict(n=len(bv),gap_p50=round(float(np.median(d))*1e3,1),gap_p95=round(float(np.percentile(d,95))*1e3,1),gap_max=round(float(d.max())*1e3,1),nrm_p50=round(float(np.median(ang)),1),nrm_max=round(float(ang.max()),1))
  u=lambda a,b:(B[b]-B[a])/np.linalg.norm(B[b]-B[a])
  r['neck-head axis vs torso axis deg']=round(float(np.degrees(np.arccos(u('neck','head')@u('pelvis','torso')))),1)
  out[s]=r;print('==',s);[print(' ',k,v) for k,v in r.items()]
json.dump(out,open('/workspace/body-v3/joints-seams.json','w'),indent=1)
