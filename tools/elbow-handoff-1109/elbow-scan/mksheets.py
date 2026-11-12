import json,subprocess,os
J=json.load(open('/workspace/work/elbow-scan/jobs.json'))
os.chdir('/workspace/work/elbow-scan')
for k in range(0,len(J),6):
    rows=[]
    for j in J[k:k+6]:
        p=f"png/{j['id']}-{j['side']}"
        if not os.path.exists(p+'-prod.png'):continue
        lab='\n'.join(j['id'].split('-'))+f"\n{j['side'][0].upper()} {j['ratio']:.2f}\nt={j['t']}\nelb {j['elbow']:.0f}"
        os.makedirs('sheetsrc',exist_ok=True)
        for v in ['prod','close']:
            d=f"sheetsrc/{k}-{j['id']}-{j['side']}-t{v}.png"
            if not os.path.exists(d):os.symlink(os.path.abspath(f"{p}-{v}.png"),d)
        rows.append(f"{lab}:sheetsrc/{k}-{j['id']}-{j['side']}-tprod.png,sheetsrc/{k}-{j['id']}-{j['side']}-tclose.png")
    n=k//6+1
    subprocess.run(['python3','/workspace/work/pose-batch-1108/sheet.py',f'flagged-{n}.png',f'elbow pinch worst sides {k+1}-{k+len(J[k:k+6])} (ratio<0.85)',*rows])
