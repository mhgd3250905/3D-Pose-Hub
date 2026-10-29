"""Build the user-feedback comparison page from unchanged probe PNGs and saved clips.

Only complete probe captures are admitted. Rejected ankle join-r1 experiments are
never used as baselines. This page records provenance, not user acceptance.
"""
import argparse
import datetime
import hashlib
import html
import json
import os
import shutil
from pathlib import Path


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def complete_probe(folder):
    report = folder / 'probe.json'
    if not report.exists():
        return None
    data = read(report)
    return data if data.get('complete') is True else None


def same_camera(left, right):
    try:
        return all(len(left[key]) == len(right[key]) == 3 for key in ('position', 'target')) and all(abs(a-b) < 1e-8 for key in ('position', 'target')
                   for a, b in zip(left[key], right[key])) and abs(left['fov']-right['fov']) < 1e-8
    except (KeyError, TypeError):
        return False


def build(overnight, ankles, elbows, ankle_candidate='join-r2', ankle_status='rejected'):
    if '/' in ankle_candidate or '\\' in ankle_candidate or not ankle_candidate.startswith('join-r'):
        raise ValueError('Ankle candidate must be an explicit join-rN directory suffix')
    out = overnight / 'feedback-20261029'
    assets = out / 'assets'
    assets.mkdir(parents=True, exist_ok=True)
    manifest = {'format': 'pose-hub-feedback-comparison@1',
                'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'status': 'mixed-revision-states-see-per-action-status', 'userReviewed': False,
                'releaseEligible': False, 'images': [], 'comparisons': [], 'videos': []}

    def copy_image(folder, view, label):
        source = (folder / view['file']).resolve()
        if not source.is_relative_to(folder.resolve()) or source.suffix.lower() != '.png':
            raise ValueError('Probe PNG must remain within its capture folder')
        checksum = digest(source)
        if checksum != view['sha256']:
            raise ValueError('Probe image changed: ' + str(source))
        target = assets / (label + '-' + source.stem + '-' + checksum[:16] + '.png')
        if target.exists():
            if digest(target) != checksum:
                raise ValueError('Existing comparison copy differs: ' + str(target))
        else:
            shutil.copyfile(source, target)
        if digest(target) != checksum:
            raise ValueError('Byte-preserving copy failed')
        relative = target.relative_to(out).as_posix()
        manifest['images'].append({'source': str(source), 'copy': relative,
                                   'sha256': checksum, 'bytes': source.stat().st_size,
                                   'imageProcessing': 'none'})
        return relative

    overrides_file = Path(__file__).resolve().parents[2]/'catalog/production/remaining32-r2/review-overrides.json'
    overrides = read(overrides_file).get('actions', {}) if overrides_file.exists() else {}

    definitions = [
        ('bridge', '臀桥过头伸臂 · 脚踝', ankles/'bridge-baseline-r1', ankles/('bridge-'+ankle_candidate)),
        ('bear', '熊式支撑 · 脚踝', ankles/'bear-baseline-r1', ankles/('bear-'+ankle_candidate)),
        ('lsit', 'L 撑 ↔ 团身 · 肘部', elbows/'baseline-r1', elbows/'candidate-r1'),
        ('flare', '侧撑定格 · 肘部复核', elbows/'flare-baseline-r2', elbows/'flare-candidate-r2'),
    ]
    arm_candidate = elbows/'bear-arm-contour-candidate-r1'
    if complete_probe(arm_candidate):
        definitions.append(('bear-arm','熊式支撑 · 大臂后侧轮廓',elbows/'bear-arm-contour-baseline-r2',arm_candidate))
    fullness_candidate = elbows/'bear-arm-fullness-candidate-r2'
    if complete_probe(fullness_candidate):
        definitions.append(('bear-arm-fullness','熊式支撑 · 大臂后侧饱满度',elbows/'bear-arm-contour-candidate-r1',fullness_candidate))
    continuity_candidate = elbows/'bear-arm-continuity-candidate-r3'
    if complete_probe(continuity_candidate):
        definitions.append(('bear-arm-continuity','熊式支撑 · 大臂连续轮廓',fullness_candidate,continuity_candidate))
    labels = {'full': '完整姿态', 'left-outer': '脚踝外侧', 'left-inner': '脚踝内侧',
              'left-mouth': '鞋口', 'left-front': '左肘正侧', 'left-back': '左肘背侧',
              'right-front': '右肘正侧'}
    sections = []
    for key, title, baseline_folder, candidate_folder in definitions:
        baseline, candidate = complete_probe(baseline_folder), complete_probe(candidate_folder)
        rejected = key in ('bridge', 'bear') and ankle_status == 'rejected'
        arm_accepted = key == 'bear-arm-continuity' and overrides.get('h-bear-plank', {}).get('upperArmReview', {}).get('status') == 'accepted'
        candidate_label = '当前试版 · 未通过，继续修正' if rejected else '修订候选 · 待验收'
        if arm_accepted: candidate_label = 'r3 · 大臂轮廓已确认收尾'
        entry = {'id': key, 'title': title, 'baseline': str(baseline_folder),
                 'candidate': str(candidate_folder), 'candidateComplete': candidate is not None,
                 'candidateReviewStatus': 'rejected' if rejected else 'awaiting-user-review',
                 'userReviewed': False, 'pairs': []}
        if arm_accepted:
            entry.update(candidateReviewStatus='accepted-upper-arm-scope', userReviewed=True, approval=overrides['h-bear-plank']['upperArmReview'])
        manifest['comparisons'].append(entry)
        section = '<section id="'+key+'"><h2>'+html.escape(title)+'</h2>'
        if arm_accepted:
            section += '<p class="state">大臂轮廓 r3 已确认收尾 · 保留轻微表面波纹，当前版不再修整。</p>'
        elif rejected:
            section += '<p class="pending">当前脚踝试版未通过：仍有上端折角和鞋口横带，正在继续修正。下方仅用于问题对照。</p>'
        else:
            section += '<p class="state">修订候选待你验收</p>' if candidate else '<p class="pending">修订候选尚在生成，稍后更新。</p>'
        if key == 'bear-arm-continuity':
            section += '<p>r3 根据全段测量连续调整大臂中上段，连同袖口上下过渡一起修顺。两侧同规则，保留此前接环修正；这里对照上一版 r2 与本次 r3，验收状态见上方。</p>'
        if key in ('bridge', 'bear') and not rejected:
            section += '<p class="pending">脚踝近景仅展示已捕获的关键姿态。鞋口仍有浅凹纹和明暗变化，是否接受还需要你确认。</p>'
        if not baseline:
            sections.append(section+'<p>原始对照暂不可用。</p></section>')
            continue
        candidates = {s['frame']: s for s in candidate.get('samples', [])} if candidate else {}
        shown_samples = [s for s in baseline['samples'] if s['frame'] in candidates]
        entry['capturedFramesShown'] = [s['frame'] for s in shown_samples]
        entry['imageScope'] = 'captured-key-poses-only' if key in ('bridge', 'bear') else 'captured-probe-poses'
        for number, sample in enumerate(shown_samples):
            frame, at = sample['frame'], sample['time']
            current = candidates.get(frame)
            preferred = 'left-outer' if key in ('bridge', 'bear') else ('right-front' if key in ('bear-arm','bear-arm-fullness','bear-arm-continuity') else 'left-front')
            views = sorted(set(sample['views']) & set(current['views']), key=lambda name: (name != preferred, name == 'full', name))
            for index, name in enumerate(views):
                original = sample['views'][name]
                replacement = current.get('views', {}).get(name) if current else None
                left = copy_image(baseline_folder, original, key+'-original')
                right = copy_image(candidate_folder, replacement, key+'-candidate') if replacement else None
                matched = same_camera(original, replacement) if replacement else False
                pair = {'frame': frame, 'timeSeconds': at, 'view': name, 'baselineImage': left,
                        'candidateImage': right, 'sameCamera': matched}
                entry['pairs'].append(pair)
                open_attr = ' open' if number == min(1, len(shown_samples)-1) and index == 0 else ''
                camera_label = ' · 同角度对照' if matched else (' · 视角有差异' if replacement else '')
                section += f'<details{open_attr}><summary>{at:g} 秒 · {('大臂后侧视角 · '+name) if key in ('bear-arm','bear-arm-fullness','bear-arm-continuity') else labels.get(name, html.escape(name))}{camera_label}</summary><div class="pair">'
                before_label = '上一版 r2：局部补足' if key == 'bear-arm-continuity' else ('上一版：收顺凸起' if key == 'bear-arm-fullness' else '原始预览（问题版）')
                section += '<figure><figcaption>'+before_label+'</figcaption><a target="_blank" href="'+left+'"><img loading="lazy" src="'+left+'" alt="原始'+html.escape(title)+'"></a></figure>'
                if right:
                    section += '<figure><figcaption>'+candidate_label+'</figcaption><a target="_blank" href="'+right+'"><img loading="lazy" src="'+right+'" alt="候选'+html.escape(title)+'"></a></figure>'
                else:
                    section += '<figure><figcaption>修订候选</figcaption><div class="placeholder">等待对应姿态输出</div></figure>'
                section += '</div></details>'
        sections.append(section+'</section>')

    videos = []
    for action, attempt, title in [
        ('h-inner-thigh', 'attempt07', '侧卧内收抬腿 · 放松手型'),
        ('t-lsit-tuck', 'attempt07', 'L 撑 ↔ 团身 · 肘部'),
        ('t-flare-side-hold', 'attempt08', '侧撑定格 · 肘部复核'),
        ('h-bridge-overhead', 'attempt08', '臀桥过头伸臂 · 脚踝'),
        ('h-bear-plank', 'attempt08', '熊式支撑 · 大臂与脚踝'),
    ]:
        resolved_review = overrides.get(action, {}).get('candidateVisualReview') if overrides.get(action, {}).get('resolved') else None
        if resolved_review:
            review_path = Path(resolved_review)
            if review_path.parent.parent.name == action and review_path.parents[2].resolve() == overnight.resolve() and review_path.exists():
                attempt = review_path.parent.name
        capture = overnight/action/attempt/'capture.json'
        video = capture.parent/'review/preview.mp4'
        if not capture.exists() or not video.exists() or not read(capture).get('complete'):
            continue
        relative = Path(os.path.relpath(video, out)).as_posix()
        poster = capture.parent/'main/main-0000.png'
        poster_copy = copy_image(capture.parent, {'file':'main/main-0000.png', 'sha256':digest(poster)}, action+'-'+attempt) if poster.exists() else None
        poster_attr = ' poster="'+poster_copy+'"' if poster_copy else ''
        rejected_video = action in ('h-bridge-overhead','h-bear-plank') and ankle_status == 'rejected'
        change_request = overrides.get(action, {})
        needs_revision = bool(change_request) and not change_request.get('resolved', False)
        video_state = ('需修正 · '+change_request.get('reason', '用户已提出进一步修订')) if needs_revision else ('当前试版未通过 · 继续修正' if rejected_video else '修订预览 · 待你验收')
        accepted_arm = change_request.get('upperArmReview', {})
        if accepted_arm.get('status') == 'accepted' and accepted_arm.get('attempt') == attempt:
            video_state = '大臂轮廓 r3 已确认收尾 · 其他项目按各自验收记录'
        videos.append('<article><h3>'+title+'</h3><p class="state">'+html.escape(video_state)+'</p><video controls loop muted playsinline preload="none"'+poster_attr+' src="'+relative+'"></video><div class="speeds"><button onclick="speed(this,.5)">半速</button><button onclick="speed(this,1)">正常</button></div></article>')
        manifest['videos'].append({'id': action, 'attempt': attempt, 'source': str(video),
                                   'link': relative, 'sha256': digest(video), 'userReviewed': False,
                                   'candidateReviewStatus':'rejected' if rejected_video else 'awaiting-user-review'})

    page = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>手型与关节反馈 · 修订对照</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f6f8;color:#253347;font:16px/1.6 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1120px;margin:auto;padding:24px}h1{font-size:27px}h2{font-size:22px;margin:0}h3{font-size:18px;margin:0}a{color:#315da7}nav{display:flex;gap:16px;flex-wrap:wrap;margin:20px 0}.intro{color:#67758a}section,article{background:white;border:1px solid #dce2e9;border-radius:12px;padding:20px;margin:22px 0}.state{color:#4d677d;font-size:14px;margin:5px 0 16px}.pending{color:#92661c;background:#fff4df;padding:10px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:10px 0}figcaption{font-weight:600;padding:6px 0}img{display:block;width:100%;height:auto;background:#edf0f4}summary{cursor:pointer;font-weight:600;padding:10px 0}details{border-top:1px solid #e5e9ee}.placeholder{aspect-ratio:1;display:grid;place-items:center;background:#edf0f4;color:#738094}.videos{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}.videos article{margin:0}video{display:block;width:100%;background:#edf0f4}button{border:1px solid #ccd5df;background:white;padding:7px 12px;border-radius:7px;cursor:pointer}.speeds{display:flex;gap:8px;margin-top:10px}footer{font-size:14px;color:#788493;margin:24px 0}@media(max-width:650px){main{padding:14px}.pair{grid-template-columns:1fr}section{padding:14px}}
</style><main><h1>手型与关节反馈 · 修订对照</h1><p class="intro">这里集中查看放松手型、脚踝、肘部和大臂轮廓的调整。页面保留原始对照与当前修订，状态以各项标注为准；低清近景可点开查看原图。</p><nav><a href="../index.html">返回 30 动作验收页</a><a href="#clips">完整动作</a><a href="#bridge">臀桥脚踝</a><a href="#bear">熊式脚踝</a><a href="#bear-arm">熊式大臂后侧</a><a href="#bear-arm-fullness">大臂局部饱满度</a><a href="#bear-arm-continuity">大臂连续轮廓 r3</a><a href="#lsit">L 撑肘部</a><a href="#flare">侧撑肘部</a></nav>'''
    page += '<h2 id="clips">完整动作预览</h2><div class="videos">'+''.join(videos)+'</div>'+''.join(sections)
    page += '''<footer>对照 PNG 按原始字节复制，未裁切、重绘或调色。“原始预览”采用本轮修订前的截图；未通过的中间试版不会替代原始版本。<br><a href="comparison-manifest.json">查看对照来源与校验记录</a></footer></main><script>function speed(b,s){let v=b.closest('article').querySelector('video');v.playbackRate=s;v.play()}document.addEventListener('play',e=>{if(e.target.tagName==='VIDEO')document.querySelectorAll('video').forEach(v=>{if(v!==e.target)v.pause()})},true)</script></html>'''
    (out/'index.html').write_text(page, encoding='utf-8')
    (out/'comparison-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'index':str(out/'index.html'), 'completeComparisons':sum(c['candidateComplete'] for c in manifest['comparisons']),
                      'videos':len(manifest['videos']), 'copiedPngs':len(manifest['images'])}, ensure_ascii=True))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--overnight', type=Path, default=Path('F:/PoseHub-v2-production/remaining32-template-r2-20261029/overnight'))
    parser.add_argument('--ankles', type=Path, default=Path('F:/PoseHub-v2-production/ankle-review-20261029'))
    parser.add_argument('--elbows', type=Path, default=Path('F:/PoseHub-v2-production/elbow-review-20261029'))
    parser.add_argument('--ankle-candidate', default='join-r2')
    parser.add_argument('--ankle-status', choices=['rejected', 'candidate'], default='rejected')
    args = parser.parse_args()
    build(args.overnight, args.ankles, args.elbows, args.ankle_candidate, args.ankle_status)
