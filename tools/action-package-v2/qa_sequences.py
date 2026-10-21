"""Measure complete master sequences and report anomalies without granting approval."""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image


def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--root',type=Path,required=True);a=ap.parse_args();root=a.root
    results=[]
    for path in sorted((root/'masters').glob('*/*/layer-manifest.json')):
        m=json.loads(path.read_text(encoding='utf-8'))
        if not m['complete']:raise ValueError('Incomplete masters are not production sequences')
        frames=json.loads((root/m['sequences']['body']['path']).read_text(encoding='utf-8'))['frames']
        areas=[];differences=[];empty=[];edge=[];last=None
        for f in frames:
            with Image.open(root/f['path']) as im:rgba=np.asarray(im.convert('RGBA')).copy()
            alpha=rgba[:,:,3];areas.append(int(np.count_nonzero(alpha)))
            if not areas[-1]:empty.append(f['frame'])
            if np.any(alpha[0]) or np.any(alpha[-1]) or np.any(alpha[:,0]) or np.any(alpha[:,-1]):edge.append(f['frame'])
            if last is not None:
                # Premultiplied comparison ignores arbitrary RGB in fully transparent pixels.
                premul=rgba.astype(np.float32);premul[:,:,:3]*=premul[:,:,3:4]/255
                old=last.astype(np.float32);old[:,:,:3]*=old[:,:,3:4]/255
                differences.append(float(np.mean(np.abs(premul-old))))
            last=rgba
        ratios=[max(x,y)/max(1,min(x,y)) for x,y in zip(areas,areas[1:])]
        spikes=[i+1 for i,x in enumerate(ratios) if x>1.75]
        results.append({'actionId':m['actionId'],'skin':m['skin'],'specSha256':m['spec']['sha256'],
            'sourceSha256':m['sourceSha256'],'frames':len(frames),'emptyFrames':empty,'canvasEdgeFrames':edge,
            'alphaAreaMin':min(areas),'alphaAreaMax':max(areas),'suddenAreaChangeFrames':spikes,
            'adjacentMeanPremultipliedRgbaMax':max(differences,default=0),
            'note':'Area/pixel outliers are triage signals. Moving limbs can change area; no automatic posture/prop-flicker approval.'})
    report={'format':'pose-hub-sequence-qa@2','renders':results,'automaticApproval':False}
    out=root/'qa/full-sequences.json';out.write_bytes((json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps({'renders':len(results),'empty':sum(len(x['emptyFrames']) for x in results),
       'edge':sum(len(x['canvasEdgeFrames']) for x in results),'areaOutliers':sum(len(x['suddenAreaChangeFrames']) for x in results)}))


if __name__=='__main__':main()
