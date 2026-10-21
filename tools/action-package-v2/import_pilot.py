"""Attach verified render/composite references to catalog drafts; never approve reviews.

python tools/action-package-v2/import_pilot.py --root F:/PoseHub-v2-pilot
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

REPO=Path(__file__).resolve().parents[2]
SKINS=['realistic','tech-white','neon-night','neon-night-b','hologram']
PEAKS={'w-dead-bug':56,'h-chair-step-up':66,'h-db-curl':60,'glute-max-A':63,'s-frog':114,'h-catcow-quad':39}


def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))
def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_bytes((json.dumps(data,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))


def ref(root,path,**metadata):
    raw=path.read_bytes()
    return {'root':'media','path':path.relative_to(root).as_posix(),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),**metadata}


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root',type=Path,required=True)
    a=ap.parse_args();root=a.root.resolve()
    derived=read(root/'manifests/derivatives.json')
    imported=[]
    for action,peak in PEAKS.items():
        path=REPO/'catalog/v2/actions'/f'{action}.json'
        package=read(path)
        media=[];masters={}
        def asset(value,skin,kind,**metadata):
            record={**value,**metadata,'skin':skin,'kind':kind,'modelVersion':'1.0.0-rc2'}
            media.append(record)
            return record
        for skin in SKINS:
            directory=root/'masters'/skin/action
            manifest=read(directory/'layer-manifest.json')
            if not manifest['complete'] or manifest['frameCount']!=240:
                raise ValueError(f'{action}/{skin}: incomplete masters cannot be attached')
            if manifest['spec']['sha256']!=package['source']['spec']['sha256']:
                raise ValueError(f'{action}/{skin}: source spec differs from the catalog draft')
            value={k:manifest[k] for k in ('geometrySha256','occlusionSha256')}
            value['measurement']=ref(root,directory/'layer-manifest.json')
            for layer,key in [('body','bodyProps'),('highlight','highlightMask'),('shadow','shadow')]:
                source=manifest.get('layers',{}).get(key,{})
                shared=source.get('sharedFrom')
                if shared:
                    value[key]={'sharedFrom':shared}
                    continue
                sequence=manifest['sequences'][layer]
                sequence_path=root/sequence['path']
                if ref(root,sequence_path)['sha256']!=sequence['sha256']:
                    raise ValueError('Frame sequence changed after rendering')
                layer_meta={'width':1080,'height':1080,'durationSeconds':8,'frameCount':240,'fps':30,'alpha':True}
                if key=='highlightMask':layer_meta.update(grayscale=True,occlusionAware=True)
                value[key]={'sequence':sequence,**layer_meta}
                asset(sequence,skin,f'master.{layer}',**layer_meta)
            masters[skin]=value
        package['masters']['skins']=masters
        package['source'].setdefault('keyMoments',{}).update(start=0,peak=peak/30,end=8)
        package['derivatives']['variants']=[{k:v for k,v in item.items() if k!='actionId'}
            for item in derived['variants'] if item['actionId']==action]
        compositor=REPO/'tools/action-package-v2/composite.py'
        package['derivatives']['compositor']={**ref(REPO,compositor),'root':'repo'}
        package['derivatives']['transparentCovers']=derived['transparentCovers'][action]
        for item in package['derivatives']['variants']:
            skin=item['skin']
            for kind in ['video','cover','thumbnail']:
                asset(item[kind],skin,kind)
            for keyframe in item['keyframes']:asset(keyframe['asset'],skin,'keyframe',phase=keyframe['phase'])
            if item.get('framing'):
                # The framing recipe is metadata, not a raster asset, and stays in derivatives.provenance.
                package['derivatives'].setdefault('provenance',{})['framing']=item.pop('framing')
                package['derivatives']['framingId']='fixed-square-'+package['derivatives']['provenance']['framing']['sha256'][:16]
        for skin,image in package['derivatives']['transparentCovers'].items():asset(image,skin,'transparentCover')
        # Include optional authoritative QA records only when an operator has written them.
        qa=root/'qa/reviews'/f'{action}.json'
        if qa.exists():
            record=read(qa)
            if record.get('id')!=action or record.get('specSha256')!=package['source']['spec']['sha256']:
                raise ValueError(f'{action}: review record is for a different source')
            if record.get('sourceQa'):package['source']['qa']=record['sourceQa']
            if record.get('loopReview'):package['masters']['loopReview']=record['loopReview']
        target=root/'manifests'/f'{action}.json'
        write(target,{'format':'action-package-media-manifest@2','id':action,'modelVersion':'1.0.0-rc2','assets':media})
        package['validation']['manifest']=ref(root,target)
        package['status']='review'
        write(path,package)
        imported.append(action)
    write(root/'manifests/import-summary.json',{'format':'pose-hub-pilot-import@2','ids':imported,
          'note':'Media references attached. This tool does not grant technical, content, listening, or user approval.'})
    print('Imported drafts: '+', '.join(imported))


if __name__=='__main__':main()
