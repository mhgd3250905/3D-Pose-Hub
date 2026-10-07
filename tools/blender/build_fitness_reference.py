"""Build an independent static fitness reference from official CC0 source mesh.

Run local Blender with --background --factory-startup --python this_file.
Source body and clothing-derived surface are real source meshes. The derived
face is locally softened; separate source eyes remain in the original library.
No anatomy registration, procedural human primitives, rig, or animation is added.
"""
import bpy
import bmesh
import hashlib
import json
import math
import struct
import sys
from pathlib import Path
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/blender-studio-source/human-base-meshes-v1.4.1/human-base-meshes-bundle-v1.4.1/human_base_meshes_bundle.blend'
SOURCE_ZIP = ROOT / 'assets/blender-studio-source/human-base-meshes-bundle-v1.4.1.zip'
OUTPUT = ROOT / 'output/fitness-reference-20261007'
ASSET = ROOT / 'assets/coach/fitness-reference.blend'
GLB = ROOT / 'public/anatomy/fitness-reference.glb'
META = ROOT / 'public/anatomy/fitness-reference.json'
for directory in (OUTPUT, ASSET.parent, GLB.parent):
    directory.mkdir(parents=True, exist_ok=True)


def file_hash(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


monitored = [SOURCE, SOURCE_ZIP]
monitored += [ROOT / 'public/anatomy' / name for name in
              ('manifest.json', 'muscles.bin', 'bones.bin', 'skin.bin',
               'skin-manifest.json', 'muscle-reference.glb', 'muscle-reference.json')]
monitored += [ROOT / 'public/coach' / name for name in
              ('flare-coach.glb', 'coach-rig.json', 'flare-sequence.json')]
before = {str(path.relative_to(ROOT)): file_hash(path) for path in monitored}
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))


def mesh_hash(mesh):
    positions = [value for vertex in mesh.vertices for value in vertex.co]
    indices = [value for face in mesh.polygons for value in face.vertices]
    return hashlib.sha256(struct.pack('<' + 'f' * len(positions), *positions)
                          + struct.pack('<' + 'I' * len(indices), *indices)).hexdigest()


names = ['GEO-body_male_realistic', 'GEO-body_male_realistic.eye.L',
         'GEO-body_male_realistic.eye.R']
sources = [bpy.data.objects[name] for name in names]
raw_hashes = {obj.name: mesh_hash(obj.data) for obj in sources}
source_counts = {obj.name: {'vertices': len(obj.data.vertices), 'faces': len(obj.data.polygons)}
                 for obj in sources}
scene = bpy.data.scenes.new('Independent fitness reference')
bpy.context.window.scene = scene
copies = []
for source in sources:
    obj = source.copy()
    obj.data = source.data.copy()
    scene.collection.objects.link(obj)
    obj.parent = None
    obj.matrix_world = source.matrix_world.copy()
    obj.hide_render = False
    obj.hide_viewport = False
    obj.hide_select = False
    obj.hide_set(False)
    for modifier in obj.modifiers:
        if modifier.type == 'MULTIRES':
            modifier.levels = 1
            modifier.render_levels = 1
    copies.append(obj)
bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()
evaluated = copies[0].evaluated_get(depsgraph)
corners = [copies[0].matrix_world @ Vector(corner) for corner in evaluated.bound_box]
low = Vector(tuple(min(v[i] for v in corners) for i in range(3)))
high = Vector(tuple(max(v[i] for v in corners) for i in range(3)))
placement = Matrix.Translation(Vector((-(low.x + high.x) / 2, 0, -low.z)))
for obj in copies:
    evaluated = obj.evaluated_get(depsgraph)
    data = bpy.data.meshes.new_from_object(evaluated, preserve_all_data_layers=True, depsgraph=depsgraph)
    data.transform(placement @ obj.matrix_world)
    obj.modifiers.clear()
    obj.matrix_world = Matrix.Identity(4)
    obj.data = data


def smoothstep(low, high, value):
    t = min(1.0, max(0.0, (value - low) / (high - low)))
    return t * t * (3 - 2 * t)


body = copies[0]
body.name = 'Fitness_Body_Surface'
derived_source_positions = [vertex.co.copy() for vertex in body.data.vertices]
# The authored body already has a closed eye/face surface (no boundary edges).
# Relax only its anterior facial patch into a low-detail mannequin surface.
# This initial smoothing does not add a head or primitive. Deep pocket faces
# are replaced later using their own rim vertices; no body registration occurs.
head_bm = bmesh.new()
head_bm.from_mesh(body.data)
assert not any(edge.is_boundary for edge in head_bm.edges)
head_bm.free()
face_weights = []
for point in derived_source_positions:
    face_weights.append((1 - smoothstep(.058, .079, abs(point.x)))
                        * smoothstep(1.445, 1.478, point.z)
                        * (1 - smoothstep(1.630, 1.660, point.z))
                        * (1 - smoothstep(-.090, -.020, point.y)))
face_indices = [index for index, weight in enumerate(face_weights) if weight > 0]
neighbors = [set() for _ in body.data.vertices]
for edge in body.data.edges:
    a, b = edge.vertices
    neighbors[a].add(b)
    neighbors[b].add(a)
points = [point.copy() for point in derived_source_positions]
for _ in range(100):
    following = {}
    for index in face_indices:
        if not neighbors[index]:
            continue
        average = sum((points[j] for j in neighbors[index]), Vector()) / len(neighbors[index])
        delta = (average - points[index]) * (.55 * face_weights[index])
        delta.x *= .5
        delta.z *= .5
        following[index] = points[index] + delta
    for index, point in following.items():
        points[index] = point
for index in face_indices:
    body.data.vertices[index].co = points[index]
body.data.update()
# Removing the near-touching independent eye surfaces also removes the
# fine depth conflict visible in WebGL. The closed source face remains whole.
for obj in copies[1:]:
    bpy.data.objects.remove(obj, do_unlink=True)
copies = [body]
privacy_count = 0
# Only the derived surface under clothing is softened. The source stays exact.
for vertex in body.data.vertices:
    point = vertex.co
    weight = ((1 - smoothstep(.055, .095, abs(point.x)))
              * smoothstep(.69, .735, point.z)
              * (1 - smoothstep(.89, .965, point.z)))
    envelope = -.055 - .055 * smoothstep(.83, .965, point.z)
    if weight > 0 and point.y < envelope:
        point.y += (envelope - point.y) * weight
        privacy_count += 1
body.data.update()

def material(name, color, roughness, specular=.20):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = 0
    shader.inputs['Specular IOR Level'].default_value = specular
    return mat


skin = material('Soft porcelain · full skin', (.63, .65, .68), .67)
cloth = material('Matte midnight sports shorts', (.017, .031, .062), .89, .14)
for index, obj in enumerate(copies):
    obj.data.materials.clear()
    obj.data.materials.append(skin)
    for face in obj.data.polygons:
        face.use_smooth = True
    obj['source'] = 'Blender Studio Human Base Meshes'
    obj['sourceId'] = names[index]
    obj['license'] = 'CC0-1.0'
    obj['partRole'] = 'body-surface' if index == 0 else 'cosmetic-face'
    obj['role'] = obj['partRole']
    obj['referencePose'] = True
    obj['anatomicalRegistration'] = 'independent'

# Athletic clothing is a relaxed copy of the source pelvic/thigh surface.
# Plane slicing leaves an even waist and leg hems; it never cuts the body.
short_data = body.data.copy()
shorts = bpy.data.objects.new('Fitness_Sports_Shorts', short_data)
scene.collection.objects.link(shorts)
bm = bmesh.new()
bm.from_mesh(short_data)
for plane_z, clear_inner, clear_outer in ((1.005, False, True), (.665, True, False)):
    bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces),
                          dist=1e-6, plane_co=(0, 0, plane_z), plane_no=(0, 0, 1),
                          clear_inner=clear_inner, clear_outer=clear_outer)
bmesh.ops.delete(bm, geom=[face for face in bm.faces
                          if abs(face.calc_center_median().x) > .225], context='FACES')
bmesh.ops.delete(bm, geom=[vertex for vertex in bm.verts if not vertex.link_faces], context='VERTS')
for vertex in bm.verts:
    point = vertex.co
    sign = 1 if point.x >= 0 else -1
    leg_center = sign * .087 * (1 - smoothstep(.76, .87, point.z))
    outward = Vector((point.x - leg_center, point.y, 0))
    if outward.length > 1e-6:
        point += outward.normalized() * .011
    point.x *= 1.025
# Remove fine muscle/skin folds from the cloth while keeping even cut edges.
interior = [vertex for vertex in bm.verts
            if .669 < vertex.co.z < 1.001 and all(len(edge.link_faces) == 2 for edge in vertex.link_edges)]
for _ in range(8):
    bmesh.ops.smooth_vert(bm, verts=interior, factor=.34, use_axis_x=True,
                         use_axis_y=True, use_axis_z=True)
# A relaxed front panel covers the same-source under-clothing central contour.
# This is clothing shaping, not an inserted body part or a cut in the body.
for vertex in bm.verts:
    point = vertex.co
    weight = ((1 - smoothstep(.055, .105, abs(point.x)))
              * smoothstep(.695, .745, point.z)
              * (1 - smoothstep(.895, .985, point.z)))
    envelope = -.120 - .015 * smoothstep(.80, .985, point.z)
    if point.y < 0 and point.y > envelope:
        point.y += (envelope - point.y) * weight
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
bm.to_mesh(short_data)
bm.free()
short_data.materials.clear()
short_data.materials.append(cloth)
for face in short_data.polygons:
    face.use_smooth = True
thickness = shorts.modifiers.new('Source-derived cloth edge thickness', 'SOLIDIFY')
thickness.thickness = .0018
thickness.offset = 1
shorts['source'] = 'Blender Studio Human Base Meshes'
shorts['sourceId'] = 'GEO-body_male_realistic'
shorts['partRole'] = 'clothing'
shorts['role'] = 'clothing'
shorts['derivation'] = 'Copy of original pelvic/thigh surface; plane-cut, relaxed and smoothed athletic garment.'
copies.append(shorts)

# Keep the complete derived body below this opaque garment, without skin poke-
# through caused by cloth relaxation. Visible torso, legs, and all source files
# remain unchanged; the retained hidden surface is not an anatomy measurement.
garment_clearance_count = 0
for vertex in body.data.vertices:
    point = vertex.co
    if abs(point.x) > .225:
        continue
    weight = (smoothstep(.666, .715, point.z)
              * (1 - smoothstep(.965, 1.004, point.z)))
    if weight <= 0:
        continue
    center = (1 if point.x >= 0 else -1) * .087 * (1 - smoothstep(.76, .87, point.z))
    factor = 1 - .08 * weight
    point.x = center + (point.x - center) * factor
    point.y *= factor
    garment_clearance_count += 1
body.data.update()

changed_body_vertices = []
changed_face_vertices = []
changed_under_garment_vertices = []
for index, (source_point, vertex) in enumerate(zip(derived_source_positions, body.data.vertices)):
    if (source_point - vertex.co).length > 1e-8:
        in_garment = abs(source_point.x) <= .225 and .665 <= source_point.z <= 1.005
        in_face = face_weights[index] > 0
        assert in_garment or in_face
        changed_body_vertices.append(index)
        if in_face:
            changed_face_vertices.append(index)
        else:
            changed_under_garment_vertices.append(index)
whole_body_bm = bmesh.new()
whole_body_bm.from_mesh(body.data)
# A topologically closed socket still has a deep visual cavity. Replace only
# those interior eye/mouth pocket faces by caps using their own original rim
# vertices; no new head, body primitive, or decorative eye is introduced.
feature_regions = [(-.0328, 1.5793, .019, .012),
                   (.0330, 1.5793, .019, .012),
                   (0, 1.5100, .040, .025)]


def inside_feature(point):
    if point.y >= .025:
        return False
    return any(((point.x - x) / rx) ** 2 + ((point.z - z) / rz) ** 2 < 1
               for x, z, rx, rz in feature_regions)


pocket_faces = [face for face in whole_body_bm.faces
                if inside_feature(face.calc_center_median())]
face_pocket_count = len(pocket_faces)
triangles_before_face_caps = sum(len(face.verts) - 2 for face in whole_body_bm.faces)
removed_pocket_triangles = sum(len(face.verts) - 2 for face in pocket_faces)
bmesh.ops.delete(whole_body_bm, geom=pocket_faces, context='FACES_ONLY')
rim_edges = [edge for edge in whole_body_bm.edges if edge.is_boundary]
assert all(all(vertex.co.z > 1.44 for vertex in edge.verts) for edge in rim_edges)
closed_pockets = bmesh.ops.holes_fill(whole_body_bm, edges=rim_edges, sides=0)['faces']
face_cap_count = len(closed_pockets)
added_cap_triangles = sum(len(face.verts) - 2 for face in closed_pockets)
for face in closed_pockets:
    face.smooth = True
bmesh.ops.triangulate(whole_body_bm, faces=closed_pockets)
bmesh.ops.recalc_face_normals(whole_body_bm, faces=list(whole_body_bm.faces))
assert not any(edge.is_boundary for edge in whole_body_bm.edges)
whole_body_bm.to_mesh(body.data)
whole_body_bm.free()
body.data.update()

assert all(mesh_hash(source.data) == raw_hashes[source.name] for source in sources)
raw_geometry_verified = True
# The saved derivative contains only this working reference, not the source library.
for obj in list(bpy.data.objects):
    if obj not in copies:
        bpy.data.objects.remove(obj, do_unlink=True)
for original_scene in list(bpy.data.scenes):
    if original_scene != scene:
        bpy.data.scenes.remove(original_scene)
bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=False, do_recursive=True)

scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 720
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.world = bpy.data.worlds.new('Quiet slate studio')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.055, .075, .10, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .42
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -.12


def aim(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


for name, position, energy, size in (
        ('Wide soft key', (-2.5, -3, 3.5), 190, 3),
        ('Soft front fill', (2.5, -2, 2.3), 100, 2.5),
        ('Back shape light', (1.5, 2, 3), 260, 3)):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy
    data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    aim(obj, (0, 0, .95))
camera_data = bpy.data.cameras.new('Fitness review camera')
camera_data.type = 'ORTHO'
camera = bpy.data.objects.new('Fitness review camera', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.ortho_scale = 1.96
for label, position in (('front', (.12, -4, .87)), ('back', (.12, 4, .87))):
    camera.location = position
    aim(camera, (0, 0, .85))
    scene.render.filepath = str(OUTPUT / (label + '.png'))
    if '--skip-render' not in sys.argv:
        bpy.ops.render.render(write_still=True)
camera_data.ortho_scale = .70
camera.location = (.70, -3, 1.50)
aim(camera, (0, 0, 1.38))
scene.render.resolution_x = 900
scene.render.resolution_y = 1000
scene.render.filepath = str(OUTPUT / 'portrait.png')
if '--skip-render' not in sys.argv:
    bpy.ops.render.render(write_still=True)
if '--preview-only' in sys.argv:
    assert before == {str(path.relative_to(ROOT)): file_hash(path) for path in monitored}
    print('FITNESS_PREVIEW_READY', str(OUTPUT))
    raise SystemExit(0)

parts = []
all_positions = []
for obj in copies:
    evaluated = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    data = evaluated.to_mesh()
    positions = [obj.matrix_world @ vertex.co for vertex in data.vertices]
    all_positions.extend(positions)
    parts.append({'name': obj.name, 'sourceId': obj.get('sourceId'),
                  'partRole': obj['partRole'], 'role': obj['role'],
                  'vertices': len(data.vertices),
                  'triangles': sum(len(face.vertices) - 2 for face in data.polygons)})
    evaluated.to_mesh_clear()
bounds_min = [min(p.x for p in all_positions), min(p.z for p in all_positions), -max(p.y for p in all_positions)]
bounds_max = [max(p.x for p in all_positions), max(p.z for p in all_positions), -min(p.y for p in all_positions)]
assert abs(bounds_min[1]) < 1e-5
assert abs(bounds_min[0] + bounds_max[0]) < .003
assert 1.67 < bounds_max[1] < 1.72
assert parts[0]['triangles'] == triangles_before_face_caps - removed_pocket_triangles + added_cap_triangles
assert len(parts) == 2 and all(math.isfinite(value) for bound in (bounds_min, bounds_max) for value in bound)
bpy.ops.object.select_all(action='DESELECT')
for obj in copies:
    obj.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB', use_selection=True,
                          export_apply=True, export_yup=True, export_animations=False,
                          export_cameras=False, export_lights=False, export_extras=True)
camera.location = (.12, -4, .87)
aim(camera, (0, 0, .85))
camera_data.ortho_scale = 1.96
scene.render.resolution_x = 720
bpy.ops.wm.save_as_mainfile(filepath=str(ASSET), check_existing=False)
after = {str(path.relative_to(ROOT)): file_hash(path) for path in monitored}
assert before == after
metadata = {
    'source': 'Blender Studio Human Base Meshes', 'sourceVersion': '1.4.1',
    'sourceId': 'GEO-body_male_realistic', 'sourceUrl': 'https://www.blender.org/download/demo-files/',
    'license': 'CC0-1.0', 'units': 'meters', 'upAxis': '+Y', 'frontAxis': '+Z',
    'referencePose': True, 'bodyRegistration': 'independent',
    'bounds': {'min': bounds_min, 'max': bounds_max}, 'parts': parts,
    'triangles': sum(part['triangles'] for part in parts), 'sourceBaseGeometry': source_counts,
    'glbBytes': GLB.stat().st_size, 'glbSha256': file_hash(GLB),
    'modifications': [
        'Original authored Multires level 1 evaluated on the derivative only; original full body retained; separate source eyes removed from this derivative.',
        'All source parts uniformly translated to center X and feet Y=0; source Blender -Y becomes GLB front +Z.',
        'Neutral low-gloss porcelain skin; local smoothing of the closed source anterior face into a low-detail mannequin; no new head or facial anatomy.',
        'Deep eye/mouth cavity faces replaced by local caps using their original boundary vertices: ' + str(face_pocket_count) + ' pocket faces, ' + str(face_cap_count) + ' caps.',
        'Localized under-garment private contour softening on derived body only: ' + str(privacy_count) + ' vertices.',
        'Source pelvic/thigh surface copied, cut to even waist/leg hems, relaxed and smoothed into opaque matte dark-blue shorts.',
        'Complete retained body surface below opaque shorts reduced for garment clearance only: ' + str(garment_clearance_count) + ' vertices; visible torso/limbs unaffected.'
    ],
    'limits': [
        'Static functional body reference; no motion rig, animations, internal muscles, or measured muscle activation.',
        'Not BodyParts3D and not precisely registered to its internal structures or the Snow motion actor.',
        'Own body and clothing surface colour indicates functional location, including covered hip regions; eyes are omitted from this derivative; never an anatomical muscle boundary.'
    ],
    'checks': {'sourceFilesUnchanged': True, 'sourceRawGeometryUnchanged': raw_geometry_verified,
               'completeBody': True, 'independentEyesIncluded': False, 'separateEyeMeshCount': 0,
               'closedBodySurface': True, 'derivedClothing': True,
               'finiteBounds': True, 'feetOnGround': True, 'centeredX': True,
               'bodyOutsideFaceAndGarmentUnchanged': True,
               'changedDerivedFaceVertices': len(changed_face_vertices),
               'changedDerivedVerticesUnderGarment': len(changed_under_garment_vertices)},
    'sourceHashesBefore': before, 'sourceHashesAfter': after,
}
META.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', 'utf-8')
(OUTPUT / 'checks.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', 'utf-8')
print('FITNESS_REFERENCE_COMPLETE', json.dumps({'glbBytes': metadata['glbBytes'],
      'triangles': metadata['triangles'], 'bounds': metadata['bounds'], 'checks': metadata['checks']}))
