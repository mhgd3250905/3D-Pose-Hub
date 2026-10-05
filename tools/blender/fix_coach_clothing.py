"""Repair Snow-derived shorts before Solidify, without changing the rig.

Builder integration: after bisect_plane -> bm.to_mesh(mesh), replace the old
side-dependent widening loop with apply_coach_clothing_fix(ob, rig). Apply the
existing 3 mm Solidify once, then add the existing Armature modifier.

Standalone diagnostics read the official source pants into a temporary
collection, prepare a separate candidate mesh, and compare it against the
loaded derived shorts. They write only output/mesh-repair/clothing/.
The official source, production .blend/GLB/rig and pose snapshots are read only.
"""
import argparse
import collections
import json
import math
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Matrix, Quaternion, Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import intersect_ray_tri
from mathutils.kdtree import KDTree

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'output' / 'mesh-repair' / 'clothing'
SOURCE = ROOT / 'assets' / 'blender-studio-source' / 'snow-rig-v4' / 'Snow' / 'snow_v4.2.blend'


def smoothstep(low, high, value):
    t = max(0.0, min(1.0, (value - low) / (high - low)))
    return t * t * (3.0 - 2.0 * t)


def rig_signature(rig):
    return {bone.name: [list(row) for row in bone.matrix_local]
            for bone in rig.data.bones} if rig else None


def mesh_topology(mesh):
    neighbors = [set() for _ in mesh.vertices]
    faces_per_edge = collections.Counter()
    for face in mesh.polygons:
        for edge in face.edge_keys:
            faces_per_edge[tuple(sorted(edge))] += 1
    for edge in mesh.edges:
        a, b = edge.vertices
        neighbors[a].add(b)
        neighbors[b].add(a)
    remaining = set(range(len(mesh.vertices)))
    components = []
    while remaining:
        first = remaining.pop()
        stack, component = [first], [first]
        while stack:
            for neighbor in neighbors[stack.pop()]:
                if neighbor in remaining:
                    remaining.remove(neighbor)
                    component.append(neighbor)
                    stack.append(neighbor)
        components.append(len(component))
    tree = KDTree(len(mesh.vertices))
    for vertex in mesh.vertices:
        tree.insert(vertex.co, vertex.index)
    tree.balance()
    duplicates = sum(other > vertex.index
                     for vertex in mesh.vertices
                     for _, other, _ in tree.find_range(vertex.co, .000005))
    return {'vertices': len(mesh.vertices), 'polygons': len(mesh.polygons),
            'edges': len(mesh.edges), 'components': sorted(components, reverse=True),
            'boundary_edges': sum(count == 1 for count in faces_per_edge.values()),
            'nonmanifold_edges': sum(count > 2 for count in faces_per_edge.values()),
            'duplicate_pairs_within_5um': duplicates}


def weight_stats(obj):
    names = {group.index: group.name for group in obj.vertex_groups}
    center_count = center_both_thighs = wrong_side = 0
    gusset_count = gusset_both_thighs = midline_count = 0
    minimum_midline_pelvis = 1.0
    maximum_sum_error = 0.0
    maximum_influences = 0
    for vertex in obj.data.vertices:
        weights = {names[g.group]: g.weight for g in vertex.groups if g.weight > 1e-6}
        maximum_sum_error = max(maximum_sum_error, abs(sum(weights.values()) - 1.0))
        maximum_influences = max(maximum_influences, len(weights))
        if abs(vertex.co.x) < .025 and vertex.co.z < .87:
            center_count += 1
            center_both_thighs += (weights.get('leftThigh', 0) > 1e-4 and
                                  weights.get('rightThigh', 0) > 1e-4)
        # Cuff vertices at z=.62 are also near x=0. They are intentionally
        # excluded from the true gusset diagnostics, since they follow legs.
        if abs(vertex.co.x) < .025 and .785 < vertex.co.z < .875:
            gusset_count += 1
            gusset_both_thighs += (weights.get('leftThigh', 0) > 1e-4 and
                                   weights.get('rightThigh', 0) > 1e-4)
        if abs(vertex.co.x) < .0035 and .790 < vertex.co.z < .875:
            midline_count += 1
            minimum_midline_pelvis = min(minimum_midline_pelvis, weights.get('pelvis', 0))
        if vertex.co.x > .030:
            wrong_side += weights.get('rightThigh', 0) > 1e-4
        elif vertex.co.x < -.030:
            wrong_side += weights.get('leftThigh', 0) > 1e-4
    return {'center_vertices': center_count,
            'center_vertices_pulled_by_both_thighs': center_both_thighs,
            'true_gusset_vertices': gusset_count,
            'true_gusset_vertices_pulled_by_both_thighs': gusset_both_thighs,
            'midline_vertices': midline_count,
            'minimum_midline_pelvis_weight': minimum_midline_pelvis if midline_count else None,
            'opposite_thigh_influenced_vertices_outside_30mm': wrong_side,
            'max_weight_sum_error': maximum_sum_error,
            'max_influences': maximum_influences}


def apply_coach_clothing_fix(shorts, rig=None, width=1.08, depth=1.035):
    """Continuously widen a cropped outer mesh and anchor its gusset to pelvis.

    Input is Snow's evaluated, cropped shorts with consolidated Coach groups,
    BEFORE widening and Solidify. Coordinates are Blender Z-up, in meters.
    No vertices/faces/bones are added, deleted or moved between objects. UVs,
    material slots and the original fabric network remain intact.
    Returns a JSON-serializable audit for the builder's report.
    """
    if shorts.type != 'MESH':
        raise TypeError('shorts must be a mesh object')
    if shorts.get('coach_clothing_fix_version') == 2:
        return json.loads(shorts.get('coach_clothing_fix_report_json', '{}'))
    required = ('pelvis', 'leftThigh', 'rightThigh')
    if any(shorts.vertex_groups.get(name) is None for name in required):
        raise ValueError('Call after original groups have been consolidated to Coach groups')
    if any(modifier.type == 'SOLIDIFY' for modifier in shorts.modifiers):
        raise ValueError('Apply this fix before adding Solidify')
    mesh = shorts.data
    before_topology = mesh_topology(mesh)
    if before_topology['boundary_edges'] == 0:
        raise ValueError('Expected an outer garment mesh before applied Solidify')
    before_weights = weight_stats(shorts)
    before_rig = rig_signature(rig)
    before_indices = [tuple(face.vertices) for face in mesh.polygons]
    names = {group.index: group.name for group in shorts.vertex_groups}
    center_crossings = 0
    maximum_shift = 0.0
    changed_weights = 0
    maximum_discarded_weight = 0.0
    for vertex in mesh.vertices:
        original = vertex.co.copy()
        # The previous per-leg expression moved x=0 to -6.56 mm and the other
        # side towards +6.56 mm. A globally continuous positive scale cannot
        # reverse either side or create a zipper fold along the midline.
        taper = 1.0 - smoothstep(.865, .945, original.z)
        vertex.co.x *= 1.0 + (width - 1.0) * taper
        vertex.co.y *= 1.0 + (depth - 1.0) * taper
        if original.x * vertex.co.x < 0:
            center_crossings += 1
        maximum_shift = max(maximum_shift, (vertex.co - original).length)
        old = {names[g.group]: g.weight for g in vertex.groups if g.weight > 1e-7}
        # The continuous central fabric belongs primarily to the pelvis.
        # A narrow Gaussian alters only its authentic gusset; all authored
        # sleeve/hip blends are retained outside it. The original gusset's
        # lowest center vertex is z=.7915. Below .765 the near-midline inner
        # cuffs must follow their legs, not become anchored to the pelvis.
        gusset = math.exp(-((original.x / .018) ** 2)) * smoothstep(.765, .790, original.z)
        new = {name: weight * (1.0 - gusset) for name, weight in old.items()}
        new['pelvis'] = new.get('pelvis', 0.0) + gusset
        ordered = sorted(new.items(), key=lambda item: item[1], reverse=True)
        maximum_discarded_weight = max(maximum_discarded_weight,
                                      sum(weight for _, weight in ordered[4:]))
        new = dict(ordered[:4])
        total = sum(new.values())
        new = {name: weight / total for name, weight in new.items() if weight > 1e-7}
        if any(abs(new.get(name, 0) - old.get(name, 0)) > 1e-6
               for name in set(old) | set(new)):
            changed_weights += 1
        for assignment in list(vertex.groups):
            shorts.vertex_groups[assignment.group].remove([vertex.index])
        for name, weight in new.items():
            if weight > 1e-7:
                shorts.vertex_groups[name].add([vertex.index], weight, 'REPLACE')
    mesh.update()
    after_topology = mesh_topology(mesh)
    assert before_topology == after_topology, 'Clothing topology changed'
    assert before_indices == [tuple(face.vertices) for face in mesh.polygons], 'Fabric faces changed'
    assert before_rig == rig_signature(rig), 'Rig rest pivots changed'
    report = {'version': 2, 'before_solidify': True,
              'original_fabric_topology_preserved': True,
              'rig_rest_matrices_preserved': True,
              'bone_count': len(rig.data.bones) if rig else None,
              'topology': after_topology,
              'before_weights': before_weights, 'after_weights': weight_stats(shorts),
              'changed_weight_vertices': changed_weights,
              'max_discarded_weight_for_four_influences': maximum_discarded_weight,
              'max_geometry_shift_m': maximum_shift,
              'midline_crossings': center_crossings,
              'old_formula_midline_overlap_m': .082 * .08 * 2,
              'widening': {'width': width, 'depth': depth, 'waist_fade_z_m': [.865, .945]},
              'weight_transition': {'gaussian_width_m': .018,
                                    'gusset_anchor_z_m': [.765, .790],
                                    'authored_cuff_weights_preserved_below_z_m': .765}}
    shorts['coach_clothing_fix_version'] = 2
    # Nested dictionaries and null are awkward Blender ID properties. Keep
    # the builder-facing report as JSON instead of modifying rig properties.
    shorts['coach_clothing_fix_report_json'] = json.dumps(report)
    return report


def source_group(name):
    if not name.startswith('DEF-'):
        return None
    if 'Hips' in name or 'Hip_Center' in name:
        return 'pelvis'
    if 'Spine' in name or 'RibCage' in name or 'Chest' in name:
        return 'torso'
    if 'Thigh' in name:
        return 'leftThigh' if name.endswith('.L') else 'rightThigh'
    if 'Knee' in name:
        return 'leftShin' if name.endswith('.L') else 'rightShin'
    return None


def make_clean_candidate(original, rig):
    """Rebuild only the diagnostic shorts from read-only official Snow pants."""
    with bpy.data.libraries.load(str(SOURCE), link=False) as (available, loaded):
        loaded.objects = ['GEO-snow-pants', 'RIG-Snow']
    temporary = bpy.data.collections.new('Diagnostic source only - never exported')
    bpy.context.scene.collection.children.link(temporary)
    for obj in loaded.objects:
        if obj:
            temporary.objects.link(obj)
    pants = next(obj for obj in loaded.objects if obj and obj.name.startswith('GEO-snow-pants'))
    for modifier in pants.modifiers:
        if modifier.type == 'SUBSURF':
            for prop in ('levels', 'render_levels'):
                try:
                    modifier.driver_remove(prop)
                except Exception:
                    pass
            modifier.levels = modifier.render_levels = 1
        elif modifier.type in ('MASK', 'CORRECTIVE_SMOOTH', 'NODES'):
            modifier.show_viewport = modifier.show_render = False
    bpy.context.view_layer.update()
    graph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(pants.evaluated_get(graph),
                                          preserve_all_data_layers=True, depsgraph=graph)
    group_names = {group.index: group.name for group in pants.vertex_groups}
    saved = []
    for vertex in mesh.vertices:
        weights = collections.defaultdict(float)
        for group in vertex.groups:
            target = source_group(group_names.get(group.group, ''))
            if target:
                weights[target] += group.weight
        total = sum(weights.values())
        saved.append({key: value / total for key, value in weights.items()} if total else {'pelvis': 1.0})
    candidate = bpy.data.objects.new('Coach_Shorts_Repair_Candidate', mesh)
    original.users_collection[0].objects.link(candidate)
    candidate.matrix_world = original.matrix_world.copy()
    # Blender 4.5 also copies source vertex-group names with new_from_object.
    # Clear that registry before writing the remapped numerical deform indices.
    candidate.vertex_groups.clear()
    names = [bone.name for bone in rig.data.bones]
    for name in names:
        candidate.vertex_groups.new(name=name)
    bm = bmesh.new()
    bm.from_mesh(mesh)
    deform = bm.verts.layers.deform.verify()
    bm.verts.ensure_lookup_table()
    for vertex in bm.verts:
        vertex[deform].clear()
        for name, weight in saved[vertex.index].items():
            vertex[deform][names.index(name)] = weight
    bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces),
                          dist=.00001, plane_co=(0, 0, .620), plane_no=(0, 0, 1),
                          clear_inner=True, clear_outer=False)
    bm.to_mesh(mesh)
    bm.free()
    candidate.data.materials.clear()
    for material in original.data.materials:
        candidate.data.materials.append(material)
    for face in candidate.data.polygons:
        face.material_index = 0
        face.use_smooth = True
    report = apply_coach_clothing_fix(candidate, rig)
    solid = candidate.modifiers.new('Diagnostic same 3mm garment hem', 'SOLIDIFY')
    solid.thickness, solid.offset = .003, 0
    bpy.context.view_layer.objects.active = candidate
    candidate.select_set(True)
    bpy.ops.object.modifier_apply(modifier=solid.name)
    armature = candidate.modifiers.new('Diagnostic same 20-bone skinning', 'ARMATURE')
    armature.object = rig
    armature.use_deform_preserve_volume = False
    candidate.parent = rig
    temporary.hide_render = True
    temporary.hide_viewport = True
    report['after_same_solidify'] = mesh_topology(candidate.data)
    return candidate, report


def apply_snapshot(rig, snapshot):
    conversion = Quaternion((1, 0, 0), math.pi / 2)
    for record in snapshot['bones']:
        x, y, z, w = record['deltaQuaternion']
        delta = conversion @ Quaternion((w, x, y, z)) @ conversion.conjugated()
        target = Vector((record['position'][0], -record['position'][2], record['position'][1]))
        bone = rig.pose.bones[record['name']]
        bone.matrix = (Matrix.Translation(target) @ delta.to_matrix().to_4x4() @
                       bone.bone.matrix_local.to_quaternion().to_matrix().to_4x4())
    bpy.context.view_layer.update()


def crossing(a, b):
    for edge in ((0, 1), (1, 2), (2, 0)):
        start, end = a[edge[0]], a[edge[1]]
        direction = end - start
        length = direction.length
        if length < 1e-9:
            continue
        hit = intersect_ray_tri(*b, direction.normalized(), start, True)
        if hit is not None:
            distance = (hit - start).dot(direction.normalized())
            if 1e-7 < distance < length - 1e-7:
                return True
    return False


def posed_diagnostics(obj, rig):
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    rest = obj.data
    rest.calc_loop_triangles()
    positions = [vertex.co.copy() for vertex in mesh.vertices]
    triangles = [tuple(triangle.vertices) for triangle in mesh.loop_triangles]
    tree = BVHTree.FromPolygons(positions, triangles, all_triangles=True, epsilon=0)
    # Broad-phase candidates are followed by exact segment/triangle checks.
    # Shared-vertex neighbours are excluded. Coplanar contact is not counted
    # as a penetration; the report deliberately does not claim cloth physics.
    intersections = []
    broad = set(tuple(sorted(pair)) for pair in tree.overlap(tree) if pair[0] != pair[1])
    for first, second in sorted(broad):
        a_ids, b_ids = triangles[first], triangles[second]
        if set(a_ids) & set(b_ids):
            continue
        a = tuple(positions[index] for index in a_ids)
        b = tuple(positions[index] for index in b_ids)
        if crossing(a, b) or crossing(b, a):
            intersections.append([first, second])
    names = {group.index: group.name for group in obj.vertex_groups}
    matrices = {bone.name: (bone.matrix @ bone.bone.matrix_local.inverted()).to_3x3()
                for bone in rig.pose.bones}
    inversion_count = center_inversions = gusset_inversions = 0
    gusset_triangles = set()
    minimum_area_ratio = math.inf
    for index, triangle in enumerate(triangles):
        source = [rest.vertices[i].co for i in triangle]
        target = [positions[i] for i in triangle]
        normal = (source[1] - source[0]).cross(source[2] - source[0])
        posed_normal = (target[1] - target[0]).cross(target[2] - target[0])
        if normal.length < 1e-10:
            continue
        expected = Vector((0, 0, 0))
        for i in triangle:
            for group in rest.vertices[i].groups:
                if group.weight > 1e-7:
                    expected += matrices[names[group.group]] @ normal * (group.weight / 3)
        flipped = expected.dot(posed_normal) < -1e-12
        inversion_count += flipped
        centroid = sum(source, Vector()) / 3
        if abs(centroid.x) < .065 and .67 < centroid.z < .89:
            center_inversions += flipped
        if abs(centroid.x) < .025 and .785 < centroid.z < .875:
            gusset_triangles.add(index)
            gusset_inversions += flipped
        minimum_area_ratio = min(minimum_area_ratio, posed_normal.length / normal.length)
    result = {'vertices': len(positions), 'triangles': len(triangles),
              'non_adjacent_intersections': len(intersections),
              'intersection_examples': intersections[:12],
              'orientation_reversed_triangles': inversion_count,
              'crotch_orientation_reversed_triangles': center_inversions,
              'true_gusset_triangles': len(gusset_triangles),
              'true_gusset_orientation_reversed_triangles': gusset_inversions,
              'true_gusset_intersections': sum(a in gusset_triangles and b in gusset_triangles
                                              for a, b in intersections),
              'gusset_to_other_intersections': sum(a in gusset_triangles or b in gusset_triangles
                                                  for a, b in intersections),
              'minimum_triangle_area_ratio': minimum_area_ratio,
              'all_positions_finite': all(math.isfinite(c) for v in positions for c in v)}
    evaluated.to_mesh_clear()
    return result


def configure_render():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    try:
        preferences = bpy.context.preferences.addons['cycles'].preferences
        preferences.compute_device_type = 'OPTIX'
        preferences.get_devices()
        for device in preferences.devices:
            device.use = device.type == 'OPTIX'
        scene.cycles.device = 'GPU'
    except Exception:
        scene.cycles.device = 'CPU'
    floor = bpy.data.objects.get('Studio seamless floor')
    if floor:
        floor.hide_render = True


def render_crotch(rig, path, rear=False):
    scene = bpy.context.scene
    pelvis = rig.pose.bones['pelvis']
    skin = pelvis.matrix @ pelvis.bone.matrix_local.inverted()
    center = skin @ Vector((0, -.008, .79))
    view = Vector((.24, .87 if rear else -.87, -.48)).normalized()
    scene.camera.location = center + skin.to_3x3() @ view * 2
    scene.camera.rotation_euler = (center - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera.data.type = 'ORTHO'
    scene.camera.data.ortho_scale = .80
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    arguments = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument('--no-render', action='store_true')
    args = parser.parse_args(arguments)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    original = bpy.data.objects['Coach_Training_Shorts']
    rig = bpy.data.objects['Coach_Rig']
    original_signature = rig_signature(rig)
    original_mesh = original.data.copy()
    candidate, repair = make_clean_candidate(original, rig)
    snapshots = json.loads((ROOT / 'output' / 'pose-orientations' / 'render-bone-snapshots.json').read_text(encoding='utf-8'))
    report = {'input': bpy.data.filepath, 'original_source_read_only': str(SOURCE),
              'bone_count': len(rig.data.bones), 'repair': repair,
              'before_topology': mesh_topology(original.data),
              'before_weights': weight_stats(original), 'stress_poses': [],
              'method': 'Exact runtime bone snapshots; linear blend skinning; Cycles OptiX. No pose or joint change.'}
    if not args.no_render:
        configure_render()
    for snapshot in snapshots:
        apply_snapshot(rig, snapshot)
        row = {'id': snapshot['id'], 'before': posed_diagnostics(original, rig),
               'after': posed_diagnostics(candidate, rig), 'images': []}
        if not args.no_render and snapshot['id'] in ('flare-right-high-v', 'flare-rear-open', 'flare-left-high-v'):
            for variant, obj in (('before', original), ('after', candidate)):
                original.hide_render = obj != original
                candidate.hide_render = obj != candidate
                path = OUTPUT / (snapshot['id'] + '-' + variant + '.png')
                render_crotch(rig, path)
                row['images'].append(str(path))
        report['stress_poses'].append(row)
        print('CLOTHING_POSE=' + json.dumps(row), flush=True)
    report['rig_rest_matrices_unchanged'] = original_signature == rig_signature(rig)
    report['original_loaded_shorts_unchanged'] = (
        len(original.data.vertices) == len(original_mesh.vertices) and
        all((a.co - b.co).length == 0 for a, b in zip(original.data.vertices, original_mesh.vertices)))
    report['production_files_written'] = False
    (OUTPUT / 'clothing-stress.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('CLOTHING_STRESS=' + json.dumps({'report': str(OUTPUT / 'clothing-stress.json'),
          'poses': len(report['stress_poses']), 'bone_count': len(rig.data.bones)}), flush=True)


if __name__ == '__main__':
    main()
