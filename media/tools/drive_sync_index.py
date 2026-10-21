#!/usr/bin/env python3
"""Build an offline material catalog using only verified Drive receipts for links.

Reads source plans/receipts without changing them. The optional registry uses an
explicit field allowlist so local paths and upload credentials never enter Git.
"""
from __future__ import annotations

import argparse
import csv
import html
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes((json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))


def drive_url(value, drive_id, folder=False):
    """Accept a receipt's persistent Drive URL; never retain upload/signed URLs."""
    if not re.fullmatch(r'[A-Za-z0-9_-]+', str(drive_id or '')):
        return None
    parsed = urlsplit(str(value or ''))
    if parsed.scheme != 'https' or parsed.netloc != 'drive.google.com':
        return None
    expected = f'/drive/folders/{drive_id}' if folder else f'/file/d/{drive_id}/view'
    if parsed.path.rstrip('/') != expected:
        return None
    return 'https://drive.google.com' + expected


def sanitized_folders(raw):
    root_id = raw.get('rootId')
    result = {'root': {'id': root_id, 'url': drive_url(raw.get('rootUrl'), root_id, True)},
              'categories': {}}
    for name, row in raw.get('categories', {}).items():
        folder_id = row.get('id')
        result['categories'][name] = {'id': folder_id, 'url': drive_url(row.get('url'), folder_id, True)}
    return result


def receipts_by_hash(directory):
    result = {}
    for path in sorted(Path(directory).glob('*.json')):
        row = read_json(path)
        if str(row.get('key', '')).startswith('index-') or row.get('role') == 'supplemental-media':
            # Mutable indexes keep IDs; their old verification must never prove
            # that a material payload has been backed up.
            continue
        if row.get('verified') is not True:
            continue
        sha = row.get('sha256', '')
        if not re.fullmatch('[0-9a-f]{64}', sha):
            continue
        url = drive_url(row.get('url'), row.get('driveId'))
        if not url:
            continue
        receipt = {key: row.get(key) for key in
                   ('driveId', 'bytes', 'sha256', 'mimeType', 'verifiedAt', 'verification')}
        receipt.update({'url': url, 'verified': True})
        result.setdefault(sha, []).append(receipt)
    return result


def index_links(directory):
    """Keep stable index identities without recursive index hashes or stale QA."""
    result = []
    for path in sorted(Path(directory).glob('*.json')):
        row = read_json(path)
        if not str(row.get('key', '')).startswith('index-'):
            continue
        url = drive_url(row.get('url'), row.get('driveId'))
        if not url:
            continue
        result.append({'key': row['key'], 'name': Path(row.get('fileName') or row.get('name') or path.stem).name,
                       'mimeType': row.get('mimeType'), 'id': row['driveId'],
                       'url': url, 'parentId': row.get('parentId')})
    return result


def supplemental_attachments(directory):
    """Supplemental physical-media archives are separate from action packages."""
    result = []
    for path in sorted(Path(directory).glob('*.json')):
        row = read_json(path)
        if row.get('role') != 'supplemental-media' or row.get('verified') is not True:
            continue
        url = drive_url(row.get('url'), row.get('driveId'))
        sha = row.get('sha256', '')
        size = row.get('bytes')
        if not url or not re.fullmatch('[0-9a-f]{64}', sha) or not isinstance(size, int) or size < 0:
            continue
        attachment = {key: row.get(key) for key in ('key', 'mimeType', 'parentId', 'bytes', 'sha256', 'verification')}
        attachment.update({'name': Path(row.get('fileName') or row.get('name') or path.stem).name,
                           'id': row['driveId'], 'url': url})
        if isinstance(row.get('actionIds'), list):
            attachment['actionIds'] = [value for value in row['actionIds'] if isinstance(value, str)
                                       and re.fullmatch(r'[A-Za-z0-9_@.-]+', value)]
        result.append(attachment)
    return result


def match_receipt(index, sha, size, video=False):
    candidates = [row for row in index.get(sha, [])
                  if row.get('bytes') == size and
                  (str(row.get('mimeType', '')).startswith('video/') if video
                   else not str(row.get('mimeType', '')).startswith('video/'))]
    return candidates[0] if candidates else None


def summarize(entries):
    registered = [row for row in entries if row['kind'] == 'registered']
    states = Counter(row['state'] for row in registered)
    return {'entries': len(entries), 'registeredActions': len({row['actionId'] for row in registered}),
            'registeredVideos': sum(row['greenCount'] > 0 for row in registered),
            'registeredStatic': states['static'], 'registeredStopped': states['stopped'],
            'registeredStates': dict(sorted(states.items())),
            'historicalExtras': sum(row['kind'] == 'historical-extra' for row in entries),
            'historicalVersions': sum(row['kind'] == 'historical-version' for row in entries),
            'verifiedPackages': sum(row['package']['verified'] for row in entries),
            'pendingPackages': sum(not row['package']['verified'] for row in entries),
            'alphaFrames': sum(row['alphaFrameCount'] for row in entries),
            'staticAlphaImages': sum(row['staticAlphaCount'] for row in entries),
            'verifiedGreenLinks': sum(g['verified'] for row in entries for g in row['greens'])}


def build_catalog(plan, receipts, folders, transport_plan=None, indexes=None, attachments=None):
    entries = []
    transports = {row['id']: row for row in (transport_plan or {}).get('entries', [])}
    for source in plan['entries']:
        action_id = source.get('actionId') or source['id']
        variant = source.get('variantLabel')
        kind = ('historical-version' if variant or action_id != source['id'] else
                'historical-extra' if source.get('category') == '历史示范与变体' else 'registered')
        row = {key: source.get(key) for key in
               ('id', 'name', 'category', 'state', 'variantLabel', 'contentHash', 'sha256', 'bytes')}
        row.update({'actionId': action_id, 'kind': kind})
        row['attachments'] = [item for item in (attachments or []) if action_id in item.get('actionIds', [])]
        for key in ('fileCount', 'alphaFrameCount', 'staticAlphaCount', 'glowMaskFrameCount', 'greenCount'):
            row[key] = source.get(key, 0)
        # Source paths in missing records are intentionally omitted from all public indexes.
        row['missing'] = [{key: item[key] for key in ('role', 'reason', 'expected', 'actual') if key in item}
                          for item in source.get('missing', [])]
        package = match_receipt(receipts, row['sha256'], row['bytes'])
        transport = transports.get(row['id'])
        if transport and (transport.get('sha256') != row['sha256'] or
                          transport.get('contentHash') != row['contentHash']):
            raise ValueError(f'Transport plan source differs from original plan: {row["id"]}')
        parts = transport.get('transportFiles', []) if transport else [{
            'bytes': row['bytes'], 'sha256': row['sha256'], 'partIndex': 1, 'partCount': 1,
            'fileName': Path(source['zipPath']).name}]
        row['transportFiles'] = []
        for part in parts:
            part_receipt = match_receipt(receipts, part['sha256'], part['bytes'])
            file = {key: part.get(key) for key in
                    ('fileName', 'bytes', 'sha256', 'md5', 'partIndex', 'partCount')}
            file.update(part_receipt or {'verified': False, 'status': 'pending'})
            row['transportFiles'].append(file)
        complete = bool(parts) and all(part['verified'] for part in row['transportFiles'])
        row['package'] = package or {'verified': complete, 'status': 'verified' if complete else 'pending',
                                    'source': 'transport-parts'}
        row['backupStatus'] = 'verified' if row['package']['verified'] else 'pending'
        row['greens'] = []
        for green in source.get('greenFiles', []):
            link = match_receipt(receipts, green.get('sha256'), green.get('bytes'), video=True)
            data = {key: green.get(key) for key in ('name', 'sha256', 'bytes')}
            data.update(link or {'verified': False, 'status': 'pending'})
            row['greens'].append(data)
        row['playbackStatus'] = ('not-applicable' if not row['greens'] else
                                 'verified' if all(g['verified'] for g in row['greens']) else 'pending')
        entries.append(row)
    summary = summarize(entries)
    summary.update({'transportFiles': sum(len(row['transportFiles']) for row in entries),
                    'verifiedTransportFiles': sum(part['verified'] for row in entries for part in row['transportFiles']),
                    'splitEntries': sum(len(row['transportFiles']) > 1 for row in entries),
                    'attachments': len(attachments or []),
                    'attachmentBytes': sum(item['bytes'] for item in (attachments or []))})
    return {'schema': 'pose-hub/private-drive-catalog@1', 'folders': folders, 'indexLinks': indexes or [],
            'attachments': attachments or [], 'summary': summary, 'entries': entries,
            'policy': '制作素材归档；访问权限以素材库当前共享设置为准。云端链接仅来自 verified 回执。上传不等于制作验收，缺项与停止状态保留。'}


def summary_text(summary):
    return (f"共 {summary['entries']} 个归档条目，不等于 {summary['entries']} 个动作。"
            f"主库存 {summary['registeredActions']} 个逻辑动作：{summary['registeredVideos']} 个有绿幕视频、"
            f"{summary['registeredStatic']} 个静态自测、{summary['registeredStopped']} 个停止制作。"
            f"另列 {summary['historicalExtras']} 个历史示范与变体、{summary['historicalVersions']} 个历史版本。"
            f"共 {summary.get('transportFiles', summary['entries'])} 个传输 ZIP 文件。"
            f"配套备份已校验 {summary['verifiedPackages']} 套，pending {summary['pendingPackages']} 套。"
            f"另有 {summary.get('attachments', 0)} 个已验证附加素材包，单独统计。")


def escape(value):
    return html.escape(str(value if value is not None else ''))


def render_html(catalog):
    rows = []
    for row in catalog['entries']:
        pack = row['package']
        if pack.get('url'):
            links = f'<a href="{escape(pack["url"])}" target="_blank" rel="noopener">下载完整配套 ZIP</a>'
        else:
            links = ' '.join(
                f'<a href="{escape(part["url"])}" target="_blank" rel="noopener">下载 ZIP {part["partIndex"]}/{part["partCount"]}</a>'
                if part['verified'] else f'<span class="pending">ZIP {part["partIndex"]}/{part["partCount"]}：pending</span>'
                for part in row['transportFiles'])
        green_links = [f'<a href="{escape(g["url"])}" target="_blank" rel="noopener">播放绿幕 {index}</a>'
                       if g['verified'] else f'<span class="pending">绿幕 {index}：pending</span>'
                       for index, g in enumerate(row['greens'], 1)]
        attachment_links = ' '.join(f'<a href="{escape(item["url"])}" target="_blank" rel="noopener">附加素材：{escape(item["name"])}</a>'
                                    for item in row.get('attachments', []))
        missing = '；'.join(' / '.join(str(v) for v in item.values()) for item in row['missing']) or '无已登记缺项'
        note = ('停止制作：仅归档元数据与已有证据，不提供动作成片。' if row['state'] == 'stopped' else
                '静态自测：透明静图，不是动画序列。' if row['state'] == 'static' else '')
        if len(row['transportFiles']) > 1:
            note += ' 下载全部 ZIP parts 并解压到同一目录；原全局校验清单用于完整集合。'
        text = ' '.join(str(row.get(k) or '') for k in ('id', 'actionId', 'name', 'category', 'variantLabel', 'state'))
        rows.append(f'''<article class="card" data-category="{escape(row['category'])}" data-state="{escape(row['state'])}" data-search="{escape(text.lower())}">
<h2>{escape(row['name'])}</h2><p class="badge">{escape(row['category'])} · {escape(row['state'])} · {escape(row['kind'])}</p>
<p class="badge">配套备份：{escape(row['backupStatus'])} · 独立播放：{escape(row['playbackStatus'])} · 配套包含绿幕 {row['greenCount']} 部</p>
<dl><dt>条目 ID</dt><dd>{escape(row['id'])}</dd><dt>原动作 ID</dt><dd>{escape(row['actionId'])}</dd>
<dt>版本</dt><dd>{escape(row['variantLabel'] or '当前库存')}</dd><dt>透明母帧</dt><dd>{row['alphaFrameCount']} 帧 / 静图 {row['staticAlphaCount']} 张 / 高亮遮罩 {row['glowMaskFrameCount']} 帧</dd>
<dt>配套 ZIP</dt><dd>{row['bytes']:,} bytes · {row['fileCount']} 文件</dd><dt>ZIP SHA-256</dt><dd class="hash">{escape(row['sha256'])}</dd></dl>
<p class="links">{links} {' '.join(green_links)} {attachment_links}</p><p>{escape(note)}</p><p class="missing">缺项：{escape(missing)}</p></article>''')
    options = ''.join(f'<option>{escape(c)}</option>' for c in sorted({r['category'] for r in catalog['entries']}))
    states = ''.join(f'<option>{escape(c)}</option>' for c in sorted({r['state'] for r in catalog['entries']}))
    attachment_section = ''
    if catalog.get('attachments'):
        attachment_section = '<section aria-label="附加素材"><h2>附加素材</h2><p>已完整回读验证的补充母图与 QA 归档，单独统计，不增加动作数或主配套包数。</p><ul>'
        attachment_section += ''.join(f'<li><a href="{escape(item["url"])}" target="_blank" rel="noopener">{escape(item["name"])}</a> · {item["bytes"]:,} bytes · <span class="hash">{escape(item["sha256"])}</span></li>' for item in catalog['attachments'])
        attachment_section += '</ul></section>'
    return '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pose-Hub 动作素材库</title><style>
*{box-sizing:border-box}body{font:16px/1.65 system-ui,sans-serif;margin:0;background:#f3f5f8;color:#17283b}main{max-width:1320px;margin:auto;padding:32px 20px}h1{margin:0}h2{font-size:20px;margin:0}header{margin-bottom:24px}.summary{max-width:1000px}.filters{display:flex;gap:12px;flex-wrap:wrap;background:white;padding:16px;border-radius:12px;position:sticky;top:0;z-index:1}input,select{font:inherit;padding:8px;border:1px solid #aebccc;border-radius:6px}input{flex:1;min-width:200px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:16px}.card{background:white;border:1px solid #dae1e9;border-radius:12px;padding:20px;min-width:0}.card[hidden]{display:none}.badge{font-size:13px;color:#49627d}dl{display:grid;grid-template-columns:90px 1fr;font-size:14px}dt{color:#586d83}dd{margin:0;overflow-wrap:anywhere}.hash{font:12px/1.6 monospace}.links{display:flex;gap:12px;flex-wrap:wrap}a{color:#075da8}.pending,.missing{color:#91551a}.missing{font-size:13px}#count{color:#49627d}footer{margin-top:32px;color:#49627d}
</style><main><header><h1>Pose-Hub 动作素材库</h1><p class="summary">''' + escape(summary_text(catalog['summary'])) + '''</p><p>制作归档 · E 盘原件保留 · 上传不等于 QA 验收。只有完成回读验证的文件显示云盘链接，未完成显示 pending。</p><p><a href="catalog.json" download>下载 JSON 目录</a> · <a href="动作目录.csv" download>下载 CSV 目录</a> · <a href="README.txt">使用说明</a></p></header>
''' + attachment_section + '''<div class="filters"><input id="q" type="search" aria-label="关键词" placeholder="搜索中文名称、动作 ID 或版本"><select id="category" aria-label="分类"><option value="">全部分类</option>''' + options + '''</select><select id="qa" aria-label="QA 状态"><option value="">全部 QA 状态</option>''' + states + '''</select></div><p id="count" aria-live="polite"></p><section class="grid">''' + ''.join(rows) + '''</section><footer>透明 PNG 母帧在配套 ZIP 中；包已验证即完成包内素材备份，独立播放 pending 不影响备份状态。绿幕与配套按素材库当前共享权限访问。停止制作条目仅保存元数据与证据。</footer></main><script>
const q=document.querySelector('#q'),c=document.querySelector('#category'),s=document.querySelector('#qa'),cards=[...document.querySelectorAll('.card')];function filter(){let count=0;for(const card of cards){const visible=(!c.value||card.dataset.category===c.value)&&(!s.value||card.dataset.state===s.value)&&card.dataset.search.includes(q.value.trim().toLowerCase());card.hidden=!visible;if(visible)count++;}document.querySelector('#count').textContent=`显示 ${count} / ${cards.length} 个归档条目`; }for(const e of [q,c,s]){e.addEventListener('input',filter);e.addEventListener('change',filter);}filter();</script></html>'''


def csv_safe(value):
    text = str(value if value is not None else '')
    return "'" + text if text.startswith(('=', '+', '-', '@')) else text


def write_outputs(catalog, output, registry=None):
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    write_json(output / 'catalog.json', catalog)
    (output / 'index.html').write_text(render_html(catalog), encoding='utf-8')
    with (output / '动作目录.csv').open('w', encoding='utf-8-sig', newline='') as stream:
        writer = csv.writer(stream)
        writer.writerow(['中文名称', '条目ID', '原动作ID', '分类', '版本', '条目类型', 'QA状态', '透明帧数', '透明静图数', '原ZIP字节数', '原ZIP_SHA256', 'ZIP下载链接', '绿幕播放链接', '缺项', '配套备份状态', '独立播放状态', '包内绿幕数', '传输ZIP明细', '附加素材链接'])
        for row in catalog['entries']:
            package_links = row['package'].get('url') or '; '.join(p.get('url', 'pending') for p in row['transportFiles'])
            writer.writerow([csv_safe(v) for v in [row['name'], row['id'], row['actionId'], row['category'], row['variantLabel'], row['kind'], row['state'], row['alphaFrameCount'], row['staticAlphaCount'], row['bytes'], row['sha256'], package_links, '; '.join(g.get('url', 'pending') for g in row['greens']), json.dumps(row['missing'], ensure_ascii=False), row['backupStatus'], row['playbackStatus'], row['greenCount'], json.dumps(row['transportFiles'], ensure_ascii=False), '; '.join(item['url'] for item in row.get('attachments', []))]])
    readme = summary_text(catalog['summary']) + '\n\n' + (
        '打开 index.html 可离线按分类、关键词、QA 状态筛选；目录另提供 catalog.json 与动作目录.csv。\n'
        '通过素材库共享链接访问，权限以云盘当前共享设置为准。绿幕链接直接播放；透明 PNG 母帧及规格、QA 证据在配套 ZIP 中。\n'
        '链接仅取自 verified 上传回执，并以 SHA-256 与字节数匹配。pending 表示尚未找到完成验证的回执，不表示源素材不存在。\n'
        '配套备份状态与独立播放状态分别记录：ZIP 已验证即完成包内素材备份，播放链接 pending 不影响已完成备份。\n'
        '多 ZIP 动作必须下载所有 parts，全部解压到同一目录；原 SHA256SUMS.txt 用于完整集合。所有 parts 校验通过后整套备份才为 verified。\n'
        '附加素材包保留选版清单外的已完成母图及 QA，按原动作 ID 关联，独立于主配套包和传输 ZIP 数统计。\n'
        '归档不改变 QA：review_required 仍待复核；static 为静图；stopped 仅元数据与已有证据，不自动恢复制作。\n'
        '保留 E 盘原件，收到用户整理请求后按内容指纹增量同步；不建立定时器，不覆盖旧包，不修改公开 published 版本。\n')
    (output / 'README.txt').write_text(readme, encoding='utf-8')
    if registry:
        record = {'schema': 'pose-hub/private-drive-sync@1', 'folders': catalog['folders'],
                  'summary': catalog['summary'], 'indexes': catalog.get('indexLinks', []),
                  'attachments': catalog.get('attachments', []), 'entries': []}
        for row in catalog['entries']:
            item = {key: row[key] for key in ('id', 'actionId', 'name', 'category', 'kind', 'state', 'variantLabel', 'contentHash', 'sha256', 'bytes', 'backupStatus', 'playbackStatus')}
            item['package'] = row['package']
            item['transportFiles'] = row['transportFiles']
            item['greens'] = row['greens']
            record['entries'].append(item)
        write_json(registry, record)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--receipts', type=Path, required=True)
    parser.add_argument('--folders', type=Path, required=True)
    parser.add_argument('--transport-plan', type=Path, help='Optional split ZIP transport plan')
    parser.add_argument('--output-dir', type=Path, help='Defaults to the plan directory')
    parser.add_argument('--registry', type=Path, help='Optional sanitized repository registry path')
    args = parser.parse_args()
    catalog = build_catalog(read_json(args.plan), receipts_by_hash(args.receipts), sanitized_folders(read_json(args.folders)),
                            read_json(args.transport_plan) if args.transport_plan else None, index_links(args.receipts),
                            supplemental_attachments(args.receipts))
    write_outputs(catalog, args.output_dir or args.plan.parent, args.registry)
    print(summary_text(catalog['summary']))


if __name__ == '__main__':
    main()
