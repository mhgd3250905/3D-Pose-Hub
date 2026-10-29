#!/usr/bin/env python3
"""Read pinned Git sources and emit a queue; never restore or edit repository files.

Usage: python tools/action-completion-v3-r2/build-remaining219-queue-r1.py --repo PATH --output PATH.json
Dependency coverage: literal relative ESM imports/exports, import(), and require().
Source bytes are never executed. Missing files are reported, not restored.
"""
import argparse
import hashlib
import json
import posixpath
import re
import subprocess
from collections import Counter
from pathlib import Path

INVENTORY = 'catalog/inventory/actions-20261028-r1.json'
PLAN = 'catalog/production/remaining32-r4/plan.json'
IMPORT = re.compile(r'''(?:from\s*|import\s*\(|import\s*|require\s*\()\s*["']([^"']+)''')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def lf(data):
    return data.replace(b'\r\n', b'\n')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def generate(repo):
    def git(*args, data=None):
        return subprocess.run(['git', '-C', str(repo), *args], input=data,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              check=True).stdout

    def objects(pairs):
        wire = git('cat-file', '--batch', data=('\n'.join(c + ':' + p for c, p in pairs) + '\n').encode())
        offset = 0
        found = {}
        for pair in pairs:
            end = wire.index(b'\n', offset)
            header = wire[offset:end].decode().split()
            require(len(header) == 3 and header[1] == 'blob', 'Missing/non-blob pinned source: ' + str(pair))
            size = int(header[2])
            raw = wire[end + 1:end + 1 + size]
            require(len(raw) == size, 'Truncated Git blob: ' + str(pair))
            require(hashlib.sha1(b'blob ' + str(size).encode() + b'\0' + raw).hexdigest() == header[0],
                    'Git blob identity mismatch: ' + str(pair))
            found[pair] = (header[0], raw)
            offset = end + size + 2
        require(offset == len(wire), 'Unexpected cat-file trailing bytes')
        return found

    inv_raw = (repo / INVENTORY).read_bytes()
    plan_raw = (repo / PLAN).read_bytes()
    inv = json.loads(inv_raw)
    plan = json.loads(plan_raw)
    pins = inv['sourcePins']
    cat_commit = pins['baselineCatalogCommit']
    cat_path = pins['baselineCatalogPath']
    cat_blob, cat_raw = objects([(cat_commit, cat_path)])[(cat_commit, cat_path)]
    catalog = json.loads(cat_raw)
    records = [r for r in inv['records'] if r['group'] == 'delivered-219']
    ids = {r['id'] for r in records}
    done = {r['id'] for r in plan['actions']}
    dynamic = {r['id'] for r in inv['records'] if r['group'] in
               ('delivered-219', 'legacy-dynamic-candidate', 'new-pr23-draft')}
    cats = {r['id']: r for r in catalog['actions']}
    require(len(records) == len(ids) == len(catalog['actions']) == len(cats) == 219, 'Expected 219 unique selected IDs')
    require(len(plan['actions']) == len(done) == 32, 'Expected 32 unique current templates')
    require(len(dynamic) == 251 and not ids & done and dynamic - done == ids,
            '251 minus 32 does not equal the exact delivered 219')
    require(ids == set(cats), 'Catalog/inventory stable ID mismatch')
    group_counts = dict(Counter(r['group'] for r in inv['records'] if r['id'] in done))
    require(group_counts == {'legacy-dynamic-candidate': 24, 'new-pr23-draft': 8}, 'Unexpected 32 group composition')

    entries = {}
    graph = {}
    roots = {}
    selected_commits = Counter()
    for r in records:
        d = r['deliveredSource']
        a = cats[r['id']]
        require(r['inDelivered219'] and d['stableId'] == r['id'], 'Unstable ID: ' + r['id'])
        require(a['source']['spec'] == d['source']['spec'], 'Catalog/source mismatch: ' + r['id'])
        require(d['path'] == a['source']['spec']['path'], 'Selected path mismatch: ' + r['id'])
        require(a['revision'] == Path(d['path']).stem, 'Selected revision/path mismatch: ' + r['id'])
        pair = (d['verifiedSourceTreeCommit'], d['path'])
        roots[r['id']] = pair
        selected_commits[pair[0]] += 1

    pending = set(roots.values())
    while pending:
        batch = objects(sorted(pending))
        entries.update(batch)
        pending = set()
        for (commit, path), (blob, raw) in batch.items():
            deps = set()
            for name in IMPORT.findall(raw.decode('utf-8')):
                if not name.startswith('.'):
                    continue
                child = posixpath.normpath(posixpath.join(posixpath.dirname(path), name))
                require(not child.startswith('../') and not child.startswith('/'), 'Dependency escapes repository')
                deps.add((commit, child))
            graph[(commit, path)] = sorted(deps)
            pending.update(pair for pair in deps if pair not in entries)

    for r in records:
        d = r['deliveredSource']
        blob, raw = entries[roots[r['id']]]
        require(blob == d['gitBlob'] and sha(lf(raw)) == d['sha256Lf'], 'Pinned blob/LF hash mismatch: ' + r['id'])
        require(a_hash := cats[r['id']]['source']['spec']['sha256'], 'Missing catalog hash')
        representations = {'raw': sha(raw), 'lf': sha(lf(raw)),
                           'crlf': sha(lf(raw).replace(b'\n', b'\r\n'))}
        require(a_hash in representations.values(), 'Catalog source hash mismatch: ' + r['id'])
        explicit_lf = cats[r['id']]['source']['spec'].get('lfSha256')
        require(explicit_lf is None or explicit_lf == sha(lf(raw)), 'Catalog LF hash mismatch: ' + r['id'])

    # A path can be safely restored only when all selected commits agree on its bytes.
    paths = {}
    for (commit, path), (blob, raw) in sorted(entries.items()):
        if path in paths:
            require(paths[path]['gitBlob'] == blob, 'Conflicting pinned dependency versions: ' + path)
            paths[path]['verifiedSourceTreeCommits'].append(commit)
            continue
        local = repo / path
        exists = local.is_file()
        local_lf = sha(lf(local.read_bytes())) if exists else None
        same = local_lf == sha(lf(raw)) if exists else None
        paths[path] = {'path': path, 'gitBlob': blob, 'sha256Raw': sha(raw), 'sha256Lf': sha(lf(raw)),
                       'verifiedSourceTreeCommits': [commit], 'existsInWorkspace': exists,
                       'workspaceSha256Lf': local_lf, 'workspaceMatchesPinnedLf': same,
                       'availability': 'missing' if not exists else ('present-matching' if same else 'present-conflicting')}

    def closure(start):
        visited = set()
        pending = list(graph[start])
        while pending:
            pair = pending.pop()
            if pair in visited or pair == start:
                continue
            visited.add(pair)
            pending.extend(graph[pair])
        return sorted(visited)

    def pinned(pair):
        commit, path = pair
        f = paths[path]
        return {'path': path, 'ref': commit, 'gitBlob': f['gitBlob'], 'sha256Lf': f['sha256Lf'],
                'sha256Raw': f['sha256Raw'], 'availability': f['availability']}

    actions = []
    for r in records:
        a = cats[r['id']]
        d = r['deliveredSource']
        actions.append({'stableId': r['id'], 'family': r['family'], 'nameZh': r['nameZh'],
                        'selectedSpecId': a['revision'], 'selectedSource': pinned(roots[r['id']]),
                        'recordedSourceCommit': d['source']['commit'],
                        'recordedSourceBranch': d['source'].get('branch'),
                        'recordedSourceCommitTreeAvailable': d['recordedSourceCommitTreeAvailable'],
                        'catalogRef': pins['baselineCatalogRef'], 'catalogCommit': cat_commit,
                        'catalogPath': cat_path, 'historicalModel': d['source'].get('model'),
                        'catalogSourceSpec': a['source']['spec'],
                        'catalogShaMatchingRepresentations': [name for name, digest in
                            {'raw': sha(entries[roots[r['id']]][1]),
                             'lf': sha(lf(entries[roots[r['id']]][1])),
                             'crlf': sha(lf(entries[roots[r['id']]][1]).replace(b'\n', b'\r\n'))}.items()
                            if digest == a['source']['spec']['sha256']],
                        'dependencies': [pinned(pair) for pair in closure(roots[r['id']])],
                        'equipment': a.get('equipment'), 'muscleGroups': a.get('muscleGroups'),
                        'rhythm': a.get('rhythm'), 'historicalRecommendation': r.get('historicalRecommendation'),
                        'templateStatus': 'pending-template-adaptation', 'newProductionSelection': 'not-selected',
                        'userAccepted': False, 'releaseEligible': False})
    missing = [paths[p] for p in sorted(paths) if not paths[p]['existsInWorkspace']]
    conflicts = [paths[p] for p in sorted(paths) if paths[p]['availability'] == 'present-conflicting']
    selected_paths = {pair[1] for pair in roots.values()}
    return {'format': 'pose-hub-remaining219-source-queue@1',
            'scope': 'Historical selected sources for the next template adaptation; not production approval.',
            'selectionPolicy': 'Fixed catalog and inventory pins; preserve stable IDs verbatim; never choose maximum rN.',
            'observedRepositoryHead': git('rev-parse', 'HEAD').decode().strip(),
            'inputs': {'inventory': {'path': INVENTORY, 'sha256': sha(inv_raw)},
                       'completed32Plan': {'path': PLAN, 'sha256': sha(plan_raw)},
                       'catalog': {'path': cat_path, 'commit': cat_commit, 'gitBlob': cat_blob, 'sha256': sha(cat_raw)}},
            'counts': {'dynamicIds': 251, 'completed32Ids': 32, 'remainingIds': 219, 'intersection': 0,
                       'completed32Groups': group_counts, 'selectedSourceCommits': dict(sorted(selected_commits.items())),
                       'dependencyClosureRefPathPairs': len(entries), 'dependencyClosureUniquePaths': len(paths),
                       'missingSelectedSourcePaths': sum(p in selected_paths for p in (f['path'] for f in missing)),
                       'missingClosureFiles': len(missing), 'conflictingWorkspaceFiles': len(conflicts)},
            'actions': actions, 'files': [paths[p] for p in sorted(paths)],
            'missingFiles': missing, 'conflictingWorkspaceFiles': conflicts,
            'recoveryPolicy': 'No restoration performed. Future recovery must read pinned Git bytes, verify blob/LF SHA, '
                              'create only absent paths exclusively, skip matching paths, and block conflicting paths.',
            'dependencyCoverage': 'Literal relative module references only; no source execution, asset discovery, or rendering.',
            'userAccepted': False, 'releaseEligible': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    repo = args.repo.resolve(strict=True)
    output = args.output.resolve()
    require(output not in {(repo / INVENTORY).resolve(), (repo / PLAN).resolve()}, 'Output cannot overwrite input')
    queue = generate(repo)
    require(output.parent.is_dir(), 'Output parent must already exist')
    with output.open('x', encoding='utf-8', newline='\n') as stream:
        stream.write(json.dumps(queue, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'output': str(output), 'sha256': sha(output.read_bytes()), 'counts': queue['counts']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
