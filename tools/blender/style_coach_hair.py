"""Make a close, ordinary buzz cut from Snow's authored scalp base.

Builder API: style_coach_hair(hair, head, rig=None, material=None) -> audit.
Call after Coach mesh/20-bone weight creation and before GLB export. Only
the hair object receives new mesh data. Face and all rest bones stay intact.

Diagnostic CLI reads the derived .blend, renders local before/after portraits,
and writes only output/buzzcut/. It never saves a production blend or GLB.
"""
import json
import math
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'output' / 'buzzcut'


def smoothstep(value):
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def hairline_height(x, y):
    """A rounded forehead, short temples and natural higher nape, in meters.

    Blender coordinates are Z-up, face points towards -Y. The surface itself
    always comes from Snow's real head, never an ellipsoid or compressed bun.
    """
    angle = abs(math.atan2(x, -(y + .024)))
    # A quiet curved forehead with slightly higher corners, no long fringe
    # and no exaggerated fade. The sides end above the ear/long sideburns.
    knots = ((0.0, 1.665), (.52, 1.673), (1.16, 1.630),
             (1.62, 1.612), (2.35, 1.584), (math.pi, 1.575))
    for (a, h0), (b, h1) in zip(knots, knots[1:]):
        if angle <= b:
            t = smoothstep((angle - a) / (b - a))
            return h0 + (h1 - h0) * t
    return knots[-1][1]


def rig_signature(rig):
    return {bone.name: [list(row) for row in bone.matrix_local]
            for bone in rig.data.bones} if rig else None


def bounds(mesh):
    points = [vertex.co for vertex in mesh.vertices]
    return {'min': [min(point[axis] for point in points) for axis in range(3)],
            'max': [max(point[axis] for point in points) for axis in range(3)]}


def topology(mesh):
    neighbors = [set() for vertex in mesh.vertices]
    edge_faces = {}
    for polygon in mesh.polygons:
        for key in polygon.edge_keys:
            key = tuple(sorted(key))
            edge_faces[key] = edge_faces.get(key, 0) + 1
    for edge in mesh.edges:
        a, b = edge.vertices
        neighbors[a].add(b)
        neighbors[b].add(a)
    remaining = set(range(len(mesh.vertices)))
    components = []
    while remaining:
        first = remaining.pop()
        stack, count = [first], 1
        while stack:
            for other in neighbors[stack.pop()]:
                if other in remaining:
                    remaining.remove(other)
                    stack.append(other)
                    count += 1
        components.append(count)
    mesh.calc_loop_triangles()
    return {'vertices': len(mesh.vertices), 'polygons': len(mesh.polygons),
            'triangles': len(mesh.loop_triangles),
            'components': sorted(components, reverse=True),
            'boundary_edges': sum(count == 1 for count in edge_faces.values()),
            'nonmanifold_edges': sum(count > 2 for count in edge_faces.values())}


def buzz_material(original):
    mat = original.copy() if original else bpy.data.materials.new('Coach • buzz cut')
    mat.name = 'Coach • deep brown matte buzz cut'
    mat.use_nodes = True
    rgb = tuple((((0x3C2D27 >> shift) & 255) / 255) for shift in (16, 8, 0))
    linear = tuple(value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4
                   for value in rgb)
    node = next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    node.inputs['Base Color'].default_value = (*linear, 1)
    node.inputs['Roughness'].default_value = .88
    node.inputs['Metallic'].default_value = 0
    if 'Specular IOR Level' in node.inputs:
        node.inputs['Specular IOR Level'].default_value = .2
    mat.diffuse_color = (*linear, 1)
    return mat


def style_coach_hair(hair, head, rig=None, material=None):
    """Remove curls/bun and retain Snow's complete original short scalp base.

    Inputs are the builder's Coach_Hair and Coach_Face, with their final rest
    coordinates and Armature modifier. A supplied shared material is reused
    as is, allowing the builder to make brows match. Returns a JSON audit.
    """
    if hair.type != 'MESH' or head.type != 'MESH':
        raise TypeError('hair and head must be mesh objects')
    if hair.get('coach_buzzcut_version') == 4:
        return json.loads(hair.get('coach_buzzcut_report_json', '{}'))
    if rig and 'head' not in rig.data.bones:
        raise ValueError('Expected the unchanged Coach head bone')
    original_hair = topology(hair.data)
    original_hair_bounds = bounds(hair.data)
    before_rig = rig_signature(rig)
    face_positions = [vertex.co.copy() for vertex in head.data.vertices]
    face_indices = [tuple(polygon.vertices) for polygon in head.data.polygons]

    # Snow's face intentionally has no complete rear skull. The largest
    # authored hair component is its continuous scalp cover; the other 11
    # disconnected components are long curls/bun. Retain that real surface.
    mesh = hair.data.copy()
    mesh.name = 'Snow authored scalp base • ordinary buzz cut'
    bm = bmesh.new()
    bm.from_mesh(mesh)
    remaining = set(bm.verts)
    components = []
    while remaining:
        first = remaining.pop()
        stack, component = [first], {first}
        while stack:
            current = stack.pop()
            for edge in current.link_edges:
                other = edge.other_vert(current)
                if other in remaining:
                    remaining.remove(other)
                    stack.append(other)
                    component.add(other)
        components.append(component)
    largest = max(components, key=len)
    discard = [vertex for component in components if component is not largest for vertex in component]
    if discard:
        bmesh.ops.delete(bm, geom=discard, context='VERTS')
    original_scalp_top = max(vertex.co.z for vertex in bm.verts)
    # First version deliberately keeps the authored scalp network. Its
    # original rear/nape seals the intentionally incomplete face surface.
    # No shrinkwrap, whole-head clipping or compressed long-hair geometry.
    bm.normal_update()
    # A uniform 4 mm short-hair layer covers the small original forehead
    # skin overlap that used to be hidden by the removed curl components.
    for vertex in bm.verts:
        vertex.co += vertex.normal * .004
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()

    # The rough, matte material gives this first version a short-hair feel.
    # No micrograin, new texture dependency or additional strand geometry.
    for polygon in mesh.polygons:
        polygon.material_index = 0
        polygon.use_smooth = True
    mesh.materials.clear()
    mat = material or buzz_material(hair.data.materials[0] if hair.data.materials else None)
    mesh.materials.append(mat)
    hair.data = mesh
    # The scalp moves rigidly with the existing head bone. No new bones or
    # altered pivots: the face and the cap use exactly the same head motion.
    hair.vertex_groups.clear()
    bone_names = [bone.name for bone in rig.data.bones] if rig else ['head']
    for name in bone_names:
        hair.vertex_groups.new(name=name)
    hair.vertex_groups['head'].add(list(range(len(mesh.vertices))), 1.0, 'REPLACE')
    if rig and not any(modifier.type == 'ARMATURE' and modifier.object == rig
                       for modifier in hair.modifiers):
        armature = hair.modifiers.new('Coach • existing head skinning', 'ARMATURE')
        armature.object = rig
    assert before_rig == rig_signature(rig), 'Rest skeleton changed'
    assert face_indices == [tuple(p.vertices) for p in head.data.polygons], 'Face topology changed'
    assert all((a - b.co).length == 0 for a, b in zip(face_positions, head.data.vertices)), 'Face changed'
    report = {'version': 4, 'method': 'Keep original Snow continuous short scalp base; remove all 11 curls/bun; 4mm normal layer',
              'previous_hair': original_hair, 'previous_bounds': original_hair_bounds,
              'buzzcut': topology(mesh), 'buzzcut_bounds': bounds(mesh),
              'scalp_geometry_deformation_m': .004,
              'original_scalp_top_m': original_scalp_top,
              'grain_max_amplitude_m': 0.0,
              'long_hair_components_retained': 0,
              'face_positions_and_topology_unchanged': True,
              'rig_rest_matrices_unchanged': True,
              'bone_count': len(rig.data.bones) if rig else None,
              'head_weight': 1.0,
              'all_positions_finite': all(math.isfinite(c) for vertex in mesh.vertices for c in vertex.co),
              'material': {'name': mat.name, 'no_remote_texture_dependencies': True}}
    hair['coach_buzzcut_version'] = 4
    hair['coach_buzzcut_report_json'] = json.dumps(report)
    return report


def configure_render():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 32
    scene.cycles.use_denoising = True
    scene.render.resolution_x = scene.render.resolution_y = 1000
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


def render_portrait(path, direction):
    scene = bpy.context.scene
    center = Vector((0, -.025, 1.577))
    scene.camera.location = center + Vector(direction).normalized() * 2.6
    scene.camera.rotation_euler = (center - scene.camera.location).to_track_quat('-Z', 'Y').to_euler()
    scene.camera.data.type = 'ORTHO'
    scene.camera.data.ortho_scale = .635
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    hair = bpy.data.objects['Coach_Hair']
    head = bpy.data.objects['Coach_Face']
    rig = bpy.data.objects['Coach_Rig']
    for bone in rig.pose.bones:
        bone.matrix_basis.identity()
    bpy.context.view_layer.update()
    report = style_coach_hair(hair, head, rig)
    repaired_data = hair.data
    # The diagnostic portrait uses the same dark brown for the original
    # authored brows; their geometry/expression are untouched.
    brows = bpy.data.objects.get('Coach_Brows')
    if brows:
        brows.data.materials[0] = repaired_data.materials[0]
    configure_render()
    views = {'front': (0, -1, .04), 'side': (1, -.10, .02), 'rear': (0, 1, .03)}
    report['images'] = []
    for name, direction in views.items():
        path = OUTPUT / ('portrait-' + name + '-after.png')
        render_portrait(path, direction)
        report['images'].append(str(path))
    report['input'] = bpy.data.filepath
    report['production_files_written'] = False
    (OUTPUT / 'buzzcut-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('BUZZCUT=' + json.dumps(report), flush=True)


if __name__ == '__main__':
    main()
