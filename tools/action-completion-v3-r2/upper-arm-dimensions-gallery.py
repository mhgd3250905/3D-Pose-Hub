"""Publish measured upper-arm diagnostics and byte-identical probe images locally."""
import hashlib
import html
import json
import shutil
from pathlib import Path

ROOT = Path('F:/PoseHub-v2-production/elbow-review-20261029')
SOURCE = ROOT / 'upper-arm-dimensions-r1'
OUT = Path('F:/PoseHub-v2-production/remaining32-template-r2-20261029/overnight/upper-arm-dimensions')


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    receipt = {'diagnosticOnly': True, 'userApproved': False, 'files': []}

    def copy(source, name):
        data = source.read_bytes()
        target = OUT / name
        if target.exists() and target.read_bytes() != data:
            raise ValueError('Preserve existing diagnostic artifact: ' + str(target))
        if not target.exists():
            shutil.copyfile(source, target)
        assert target.read_bytes() == data
        receipt['files'].append({'source': str(source), 'file': name,
                                 'sha256': hashlib.sha256(data).hexdigest()})
        return name

    before = ROOT / 'bear-arm-fullness-candidate-r2'
    after = ROOT / 'bear-arm-sleeve-color-control-r2'
    cameras = []
    identity = json.loads((after / 'geometry-identity-check.json').read_text())
    assert identity['maxMeshDeltaMm'] == 0 and identity['bonesIdentical']
    copy(after / 'geometry-identity-check.json', 'geometry-identity-check.json')
    for folder, label in [(before, 'with-cuff'), (after, 'without-cuff')]:
        probe = json.loads((folder / 'probe.json').read_text())
        assert probe['complete']
        view = next(s for s in probe['samples'] if s['frame'] == 60)['views']['right-front']
        cameras.append({key: view[key] for key in ('position', 'target', 'fov')})
        source = folder / view['file']
        assert hashlib.sha256(source.read_bytes()).hexdigest() == view['sha256']
        copy(source, label + '.png')
    assert cameras[0] == cameras[1], 'Camera must match for the sleeve control'
    links = []
    for source in sorted(SOURCE.iterdir()):
        if source.is_file() and source.suffix in ('.png', '.json', '.csv', '.md'):
            copy(source, source.name)
            links.append('<a href="'+html.escape(source.name)+'">'+html.escape(source.name)+'</a>')
    for required in ('neutral-sections.png', 'bear_t2-sections.png'):
        assert (OUT / required).exists(), required
    page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>大臂全段尺寸诊断</title>
<style>body{font:16px/1.65 system-ui,"Microsoft YaHei";background:#f5f6f8;color:#253347;margin:0}main{max-width:1080px;margin:auto;padding:24px}section{background:white;border:1px solid #dce2e9;padding:20px;border-radius:12px;margin:20px 0}h1{font-size:26px}h2{font-size:21px}img{width:100%;height:auto}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}figcaption{padding:8px 0}a{color:#315da7}.files{display:flex;gap:16px;flex-wrap:wrap}@media(max-width:650px){.pair{grid-template-columns:1fr}}</style>
<main><a href="../feedback-20261029/">返回关节反馈页</a><h1>大臂全段尺寸诊断</h1><p>此页用于定位收窄原因，不代表新模型通过验收。尺寸来自网格截面；不闭合或混入躯干的截面不纳入比较。</p>
<section><h2>袖口是否限制轮廓</h2><p>同一 r2 几何、姿态和镜头，仅去掉袖口颜色分界。采样顶点最大位移 0 mm，骨骼完全一致；原始截图按字节复制。</p><div class="pair"><figure><figcaption>当前 r2：保留袖口颜色</figcaption><img src="with-cuff.png"></figure><figure><figcaption>诊断对照：去掉袖口颜色</figcaption><img src="without-cuff.png"></figure></div></section>
<section><h2>量化结论</h2><p>左右大臂在一个横向方向均有先收窄、再变宽的变化，原始模型就存在。熊式第 60 帧的当前 r2 在距肩约 99 mm 处，A 向宽度左侧约 89.1 mm、右侧约 87.9 mm；到约 148 mm 处分别增至 93.6 mm、93.5 mm，差约 4.5 / 5.6 mm。</p><p>另一横向尺寸主要朝肘部逐渐收细；r2 截面积没有同等明显的中段谷值。因此证据更支持局部方向上的轮廓过渡问题，不能把整圈判为太细，也不能仅凭这些尺寸认定解剖比例错误。下一次调整应检查连续的上臂轮廓与袖口两侧过渡，避免继续叠加小范围补丁。</p></section>
<section><h2>肩到肘：静止姿态</h2><p>r0 为本轮大臂修订前，r1 为凸起收顺，r2 为局部补足。横向 A/B 是固定参考轴，不直接等同于解剖前后/内外。断线表示该截面不可可靠比较；靠肩部分与躯干混合，不能可靠作为独立上臂截面。</p><img src="neutral-sections.png"></section>
<section><h2>肩到肘：熊式支撑第 60 帧</h2><img src="bear_t2-sections.png"></section>
<section><h2>原始数据与量化报告</h2><div class="files">'''+''.join(links)+'''</div></section></main></html>'''
    (OUT / 'index.html').write_text(page, encoding='utf-8')
    (OUT / 'source-manifest.json').write_text(json.dumps(receipt, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'index':str(OUT / 'index.html'), 'files':len(receipt['files'])}))


if __name__ == '__main__':
    build()
