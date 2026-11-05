"""手相对前臂「固定拧转」清单（pose-fix r1）。读 elbow-audit scan-fast 的原始逐帧数据（theta = 手相对前臂绕前臂长轴的拧转，度）。
每侧：fixed = 整段里 |theta| 的最小值（全程一直存在的拧转，即固定拧转）；med = |theta 中位数|；max = |theta| 最大值。
Usage: python3 hand-fixed-twist.py scan.json [more.json ...] out.csv   （后给的文件覆盖同 id）"""
import json, sys, csv
def unwrap(xs):
    out=[]
    for x in xs:
        if out:
            while x-out[-1]>180: x-=360
            while x-out[-1]<-180: x+=360
        out.append(x)
    return out
*ins,outp=sys.argv[1:]; recs={}
for f in ins:
    d=json.load(open(f)); 
    for e in (d if isinstance(d,list) else d.values()): recs[e['id']]=e
rows=[]
for id,e in recs.items():
    r={'id':id,'spec':e.get('spec',''),'wristTwist':e.get('wristTwist','')}
    worst=0
    for s,k in (('left','l'),('right','r')):
        th=[q[s]['theta'] for q in e['rows'] if q.get(s) and q[s].get('theta') is not None]
        if not th: continue
        u=unwrap(th); 
        # bring the unwrapped series to the branch nearest 0 by its median
        m=sorted(u)[len(u)//2]; sh=round(m/360)*360; u=[v-sh for v in u]
        a=[abs(v) for v in u]; m=sorted(u)[len(u)//2]
        r[k+'_fixed']=round(min(a),1); r[k+'_med']=round(abs(m),1); r[k+'_max']=round(max(a),1)
        worst=max(worst,min(a))
    r['fixedMax']=round(worst,1); r['flag']='>120' if worst>120 else ('>90' if worst>90 else '')
    rows.append(r)
rows.sort(key=lambda r:-r['fixedMax'])
keys=['id','fixedMax','flag','l_fixed','l_med','l_max','r_fixed','r_med','r_max','wristTwist','spec']
with open(outp,'w',newline='') as f:
    w=csv.DictWriter(f,keys,extrasaction='ignore'); w.writeheader(); w.writerows(rows)
print(len(rows),'actions; fixed>120:',sum(r['fixedMax']>120 for r in rows),'fixed>90:',sum(r['fixedMax']>90 for r in rows))
for r in rows[:15]: print(r['id'],r['fixedMax'],r.get('l_fixed'),r.get('r_fixed'),r.get('l_max'),r.get('r_max'))
