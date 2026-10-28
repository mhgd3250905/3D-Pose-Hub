"""Meaningful CPU tests for exact clipping and the emitted neutral recipe."""
from pathlib import Path
import argparse
import importlib.util
import json
import unittest
import numpy as np
import build


class ClipTests(unittest.TestCase):
    def test_closed_cube_cut_keeps_one_ring_and_shared_edge_recipes(self):
        p = np.array([[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
                      [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]], float)
        f = np.array([[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],
                      [3,7,6],[3,6,2],[0,4,7],[0,7,3],[1,2,6],[1,6,5]])
        data, q = build.clipped_mesh(p, f, {'left': {'canonical': p, 'cut': 0., 'keepSign': -1,
                                                   'roi': np.ones(len(p), bool)}})
        ring = data['boundary']['left']['vertexIds']
        self.assertEqual(len(ring), 8)
        self.assertTrue(np.all(q[:,1] <= 1e-12))
        self.assertTrue(np.allclose(q[ring,1], 0, atol=1e-12))
        cuts = [r for r in data['vertices'] if len(r['source']) == 2]
        edges = [tuple(sorted(i for i,w in r['source'])) for r in cuts]
        self.assertEqual(len(edges), len(set(edges)))
        # Any affine source attribute is exactly reconstructed by source recipes.
        attr = p @ np.array([[1,2,3],[4,2,1],[3,5,7.]]) + [2,3,5]
        reconstructed = build.evaluate_recipe(data['vertices'], attr)
        self.assertTrue(np.allclose(reconstructed, q @ np.array([[1,2,3],[4,2,1],[3,5,7.]])+[2,3,5]))


def check_recipe(path):
    path = path.resolve()
    d = json.loads(path.read_text(encoding='utf-8'))
    def source_path(record):
        return path.parent / Path(record['file'])
    result = {'recipe': str(path), 'recipeSha256': build.pin(path)['sha256'], 'sides': {}}
    for source in [d['sources']['limbReference'], d['sources']['neutral'], *d['sources']['hands'].values()]:
        assert build.pin(source_path(source))['sha256'] == source['sha256'], 'Source pin drift'
    neutral = json.loads(source_path(d['sources']['neutral']).read_text(encoding='utf-8'))
    source_limb = np.array(neutral['limbWorld']).reshape(-1,3)
    mesh = d['meshes']['limbs']
    lp = build.evaluate_recipe(mesh['vertices'], source_limb)
    for side in ['left','right']:
        hsource = json.loads(source_path(d['sources']['hands'][side]).read_text(encoding='utf-8'))
        original = np.array(hsource['positions']).reshape(-1,3)
        hm = d['meshes']['hands'][side]
        hp = build.evaluate_recipe(hm['vertices'], original)
        for item in [mesh, hm]:
            for rec in item['vertices']:
                assert len(rec['source']) in (1,2)
                assert abs(sum(w for i,w in rec['source'])-1) < 1e-12
                assert all(0 <= i < item['sourceVertices'] and w > 0 for i,w in rec['source'])
            idx = np.array(item['retainedIndex']).reshape(-1,3)
            assert idx.min() >= 0 and idx.max() < len(item['vertices'])
        direct = {rec['source'][0][0]: j for j,rec in enumerate(hm['vertices']) if len(rec['source']) == 1}
        protected = np.where(original[:,1] >= .020)[0]
        assert all(i in direct and np.array_equal(hp[direct[i]], original[i]) for i in protected)
        bridge = d['bridge'][side]
        bp = np.array([v['canonicalRest'] for v in bridge['vertices']])
        for row in bridge['rows']:
            assert np.max(np.abs(bp[row['vertexIds'],1]-row['y'])) < 1e-10
        matrix = np.array(d['neutralFrames'][side]['canonicalToWorldRowMajor']).reshape(4,4)
        canonical_limb = build.transform(lp, np.linalg.inv(matrix))
        endpoint_errors = []
        for key, values in [('limb', canonical_limb), ('hand', hp)]:
            row = bridge['rows'][bridge['endpointRows'][key]]
            endpoint_errors.extend(np.linalg.norm(build.sample(values,bridge['vertices'][i][key+'Map'])-bp[i]) for i in row['vertexIds'])
        assert max(endpoint_errors) < 1e-12
        spec = importlib.util.spec_from_file_location('independent_geometry', build.REPO/'tools/body-v3/webxr-grasp-qa-r1/check.py')
        checker = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(checker)
        bf = np.array(bridge['indices']).reshape(-1,3)
        crossings = checker.self_crossings(bp,bf,checker.weld_ids(bp))
        assert not crossings['properCrossingPairs'] and not crossings['coplanarOverlapPairs'], 'Neutral bridge intersects itself'
        report = build.validate_assembly(lp,np.array(mesh['retainedIndex']).reshape(-1,3),hp,np.array(hm['retainedIndex']).reshape(-1,3),bridge,matrix)
        report.update({'maximumEndpointRecipeErrorM': float(max(endpoint_errors)),
                       'protectedHandVerticesExact': len(protected),
                       'properBridgeSelfCrossings': len(crossings['properCrossingPairs']),
                       'coplanarBridgeOverlaps': len(crossings['coplanarOverlapPairs']),
                       'sourcePinsVerified': True, 'allSourceRecipesPositiveAndNormalized': True})
        result['sides'][side] = report
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--recipe', type=Path)
    parser.add_argument('--report', type=Path)
    args = parser.parse_args()
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(ClipTests)
    test = unittest.TextTestRunner(verbosity=2).run(suite)
    if not test.wasSuccessful():
        raise SystemExit(1)
    if args.recipe:
        report = check_recipe(args.recipe)
        if args.report:
            with args.report.open('x',encoding='utf8') as stream:
                json.dump(report,stream,indent=2)
        print(json.dumps(report,indent=2))
