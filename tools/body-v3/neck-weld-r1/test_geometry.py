"""Focused topology checks for the experimental neck-weld tools."""
import unittest

import numpy as np

from analyze_cross_sections import cross_section
from build_candidate import monotone_bridge


class GeometryTests(unittest.TestCase):
    def test_section_distinguishes_closed_and_open_contours(self):
        vertices = np.array([[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1],
                             [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]], dtype=float)
        faces = np.array([[0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5],
                          [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]])
        section = cross_section(vertices, faces, 0)
        self.assertEqual(len(section['components']), 1)
        self.assertTrue(section['components'][0]['closed'])
        self.assertAlmostEqual(section['components'][0]['length_mm'], 8000)
        self.assertFalse(cross_section(vertices, faces[:-1], 0)['components'][0]['closed'])
        self.assertEqual(cross_section(vertices, faces, 2)['components'], [])

    def test_bridge_preserves_both_rings_and_faces_outward(self):
        def ring(count, radius, y):
            theta = np.arange(count) * 2 * np.pi / count
            return np.c_[radius * np.cos(theta), np.full(count, y), .006 + radius * np.sin(theta)]
        a, b = ring(9, .07, 1.46), ring(13, .06, 1.48)
        faces = monotone_bridge(a, b)
        self.assertEqual(len(faces), len(a) + len(b))
        vertices = np.vstack([a, b])
        edges = np.sort(np.vstack([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]]), axis=1)
        unique, counts = np.unique(edges, axis=0, return_counts=True)
        boundary = unique[counts == 1]
        expected = {tuple(sorted((i, (i + 1) % len(a)))) for i in range(len(a))}
        expected |= {tuple(sorted((len(a) + i, len(a) + (i + 1) % len(b)))) for i in range(len(b))}
        self.assertEqual(set(map(tuple, boundary)), expected)
        normals = np.cross(vertices[faces[:, 1]] - vertices[faces[:, 0]],
                           vertices[faces[:, 2]] - vertices[faces[:, 0]])
        radial = vertices[faces].mean(axis=1)
        radial[:, 1] = 0
        radial[:, 2] -= .006
        self.assertTrue(np.all(np.einsum('ij,ij->i', normals, radial) > 0))


if __name__ == '__main__':
    unittest.main()
