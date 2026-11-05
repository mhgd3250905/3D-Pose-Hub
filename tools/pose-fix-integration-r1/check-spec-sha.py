#!/usr/bin/env python3
"""全量核对：每个生产配方的 specSha256Lf 与 spec 文件（CRLF→LF 后）的 SHA-256 一致，并检查 spec 里 import 的本地文件存在。
用法：python3 tools/pose-fix-integration-r1/check-spec-sha.py   （仓库根目录）"""
import hashlib, json, pathlib, re, sys
root = pathlib.Path(__file__).resolve().parents[2]
recs = sorted((root/'catalog/production/remaining219-r1/recipes').glob('*.json')) + sorted((root/'catalog/production/remaining32-r4/groups').glob('*/*.json'))
bad, warn, missing_imp, ids = [], [], [], set()
def imports(p, seen):
    if p in seen: return
    seen.add(p)
    for m in re.finditer(r"""(?:import|from)\s*(?:[^'"]*?from\s*)?['"](\.{1,2}/[^'"]+)['"]""", p.read_text(encoding='utf-8')):
        q = (p.parent/m.group(1)).resolve()
        if not q.exists(): missing_imp.append(f'{p.relative_to(root)} -> {m.group(1)}')
        elif q.suffix in ('.js', '.mjs'): imports(q, seen)
for r in recs:
    d = json.loads(r.read_text(encoding='utf-8')); ids.add(d['id'])
    sp = root/d['spec']
    if not sp.exists(): bad.append((d['id'], 'spec missing', d['spec'])); continue
    h = hashlib.sha256(sp.read_bytes().replace(b'\r\n', b'\n')).hexdigest()
    if h != d.get('specSha256Lf'): bad.append((d['id'], 'sha mismatch', d['spec'], h, d.get('specSha256Lf')))
    sel = d.get('source', {}).get('selectedSpec')
    if sel and sel != d['spec']: warn.append((d['id'], 'selectedSpec != spec（main 已如此，仅提示）', sel, d['spec']))
    imports(sp, set())
print(json.dumps({'recipes': len(recs), 'uniqueIds': len(ids), 'mismatch': bad, 'warnings': warn, 'missingImports': sorted(set(missing_imp))}, ensure_ascii=False, indent=1))
sys.exit(1 if bad or missing_imp else 0)
