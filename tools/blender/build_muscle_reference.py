"""Build a static fitness reference from the local, original BodyParts3D Skin.

Only derived outputs are written. The full body retains its original faces
and atlas coordinates outside limited privacy and head appearance treatments. No Snow geometry,
rig, procedural human primitives, muscle mesh, or missing anatomy is added.
Run Blender 4.5 with --background --factory-startup --python this_file.
"""
import bpy
import bmesh
import hashlib
import json
import math
import struct
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[2]
ANATOMY = ROOT / 'public' / 'anatomy'
ASSET = ROOT / 'assets' / 'coach'
OUTPUT = ROOT / 'output' / 'muscle-reference-20261007'
for directory in (ASSET, OUTPUT):
    directory.mkdir(parents=True, exist_ok=True)

SOURCE_FILES = ['manifest.json', 'bones.bin', 'bones.bin.gz', 'muscles.bin',
                'muscles.bin.gz', 'skin-manifest.json', 'skin.bin', 'skin.bin.gz']


def hashes():
    return {name: hashlib.sha256((ANATOMY / name).read_bytes()).hexdigest()
            for name in SOURCE_FILES}


before_hashes = hashes()
manifest = json.loads((ANATOMY / 'skin-manifest.json').read_text('utf-8'))
part = next(item for item in manifest['parts'] if item['id'] == 'FJ2810')
payload = (ANATOMY / 'skin.bin').read_bytes()
assert len(payload) == manifest['chunks'][part['chunk']]['bytes']
assert before_hashes['skin.bin'] == manifest['chunks'][part['chunk']]['sha256']
values = struct.unpack_from('<' + 'f' * part['vertexCount'] * 3, payload, part['positions'])
indices = struct.unpack_from('<' + 'I' * part['indexCount'], payload, part['indices'])
original = [Vector(values[i:i + 3]) for i in range(0, len(values), 3)]
source_faces = [indices[i:i + 3] for i in range(0, len(indices), 3)]
seen_faces = set();faces = []
for face in source_faces:
    key = tuple(sorted(face))
    if key not in seen_faces:
        faces.append(face);seen_faces.add(key)
duplicate_faces_removed = len(source_faces) - len(faces)
vertices = [point.copy() for point in original]


def smoothstep(low, high, value):
    t = min(1.0, max(0.0, (value - low) / (high - low)))
    return t * t * (3.0 - 2.0 * t)


# A limited source-derived privacy adaptation, never a change to the source
# asset. Preserve topology and the front/back body silhouette everywhere else.
# Compress only the forward low-central protrusion into a smooth envelope.
privacy_weights = []
for i, point in enumerate(vertices):
    lateral = 1.0 - smoothstep(.045, .090, abs(point.x))
    vertical = smoothstep(.690, .750, point.y) * (1.0 - smoothstep(.905, .965, point.y))
    forward = smoothstep(.005, .040, point.z)
    weight = lateral * vertical * forward
    privacy_weights.append(weight)
    if weight <= 0:
        continue
    envelope = .050 + .050 * smoothstep(.750, .945, point.y)
    point.z -= max(0.0, point.z - envelope) * weight

# Smooth that treatment locally on the original topology. Boundary vertices
# remain exact; there is no central deletion, cap, or inserted body part.
neighbors = [set() for _ in vertices]
for a, b, c in faces:
    neighbors[a].update((b, c));neighbors[b].update((a, c));neighbors[c].update((a, b))
for _ in range(6):
    next_z = [point.z for point in vertices]
    for i, weight in enumerate(privacy_weights):
        if weight <= 0 or not neighbors[i]:
            continue
        average = sum(vertices[j].z for j in neighbors[i]) / len(neighbors[i])
        next_z[i] = vertices[i].z + .28 * weight * (average - vertices[i].z)
    for i, value in enumerate(next_z):
        vertices[i].z = value

# Keep a calm, low-detail mannequin head rather than exposing the scan's eye
# cavities and small facial folds. Only the same-source front head surface is
# softened; torso, limbs and all anatomical muscle coordinates are unchanged.
head_weights = []
for point in vertices:
    weight = (1.0 - smoothstep(.050, .078, abs(point.x))) * smoothstep(1.485, 1.520, point.y)
    weight *= (1.0 - smoothstep(1.630, 1.665, point.y)) * smoothstep(.006, .024, point.z)
    head_weights.append(weight)
    if weight > 0:
        quiet_front = .067 - .012 * min(1.0, abs(point.x) / .078) ** 2
        point.z += (quiet_front - point.z) * weight
for _ in range(18):
    next_z = [point.z for point in vertices]
    for i, weight in enumerate(head_weights):
        if weight > 0 and neighbors[i]:
            average = sum(vertices[j].z for j in neighbors[i]) / len(neighbors[i])
            next_z[i] += .42 * weight * (average - next_z[i])
    for i, value in enumerate(next_z):
        vertices[i].z = value

changed = [(vertices[i] - point).length for i, point in enumerate(original)]
assert all(changed[i] == 0 for i in range(len(changed)) if privacy_weights[i] == 0 and head_weights[i] == 0)
assert len(vertices) == part['vertexCount'] and len(source_faces) * 3 == part['indexCount']


def atlas_to_blender(point):
    # Blender Z-up; the standard glTF exporter restores atlas +Y-up, +Z front.
    return (point.x, -point.z, point.y)


def material(name, hex_color, roughness):
    def linear(value):
        return value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4
    rgb = tuple(linear(((hex_color >> shift) & 255) / 255) for shift in (16, 8, 0))
    result = bpy.data.materials.new(name);result.use_nodes = True
    shader = result.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*rgb, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = 0
    shader.inputs['Specular IOR Level'].default_value = .25
    result.diffuse_color = (*rgb, 1)
    return result


bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
body_material = material('Reference · opaque soft grey', 0xB3BDC7, .90)
body_material.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = .16
shorts_material = material('Reference · matte navy athletic shorts', 0x1B2E46, .95)
body_mesh = bpy.data.meshes.new('FJ2810 · full Skin derived privacy copy')
body_mesh.from_pydata([atlas_to_blender(point) for point in vertices], [], faces)
body_mesh.update()
face_bm = bmesh.new();face_bm.from_mesh(body_mesh)
face_vertices = [vertex for vertex in face_bm.verts if abs(vertex.co.x) < .082 and 1.480 < vertex.co.z < 1.670 and vertex.co.y < -.002]
bmesh.ops.remove_doubles(face_bm, verts=face_vertices, dist=.00001)
face_edges = [edge for edge in face_bm.edges if edge.is_boundary and
              all(abs(vertex.co.x) < .075 and 1.500 < vertex.co.z < 1.645 and vertex.co.y < -.002 for vertex in edge.verts)]
face_closed = len(bmesh.ops.holes_fill(face_bm, edges=face_edges, sides=0)['faces'])
face_bm.normal_update();face_bm.to_mesh(body_mesh);face_bm.free();body_mesh.update()
body = bpy.data.objects.new('BodyParts3D · complete fitness reference', body_mesh)
bpy.context.collection.objects.link(body);body.data.materials.append(body_material)
for polygon in body_mesh.polygons:
    polygon.use_smooth = True
body['sourcePartId'] = 'FJ2810';body['sourceConceptId'] = 'FMA7163'
body['sourceName'] = 'Skin';body['sourceCommit'] = manifest['sourceCommit']
body['referenceOnly'] = True;body['privacyAdaptation'] = True;body['partRole'] = 'body-surface'

# The original atlas contains the eyes even though the application's curated
# muscle/bone export omits them. Reuse the real same-coordinate outer structures
# rather than placing spheres or adapting a different character's eyes.
upstream_directory = ROOT / '.reference' / 'human-atlas' / 'public' / 'models'
upstream_manifest = json.loads((upstream_directory / 'atlas.json').read_text('utf-8'))
eye_ids = set()  # The final simplified mannequin has no visible eye structures.
eye_parts = [item for item in upstream_manifest['parts'] if item['id'] in eye_ids]
assert len(eye_parts) == len(eye_ids)
eye_chunks = {item['chunk'] for item in eye_parts}
eye_buffers = {chunk: (upstream_directory / Path(upstream_manifest['chunks'][chunk]['url']).name).read_bytes()
               for chunk in eye_chunks}
eye_source_hashes = {'atlas.json': hashlib.sha256((upstream_directory / 'atlas.json').read_bytes()).hexdigest()}
eye_source_hashes.update({Path(upstream_manifest['chunks'][chunk]['url']).name: hashlib.sha256(buffer).hexdigest()
                         for chunk, buffer in eye_buffers.items()})
eye_white = material('Reference · soft ivory source sclera', 0xF4F1E9, .50)
eye_iris = material('Reference · muted brown source iris', 0x4D4032, .65)
eye_objects = []
for eye_part in eye_parts:
    eye_payload = eye_buffers[eye_part['chunk']]
    eye_values = struct.unpack_from('<' + 'f' * eye_part['vertexCount'] * 3, eye_payload, eye_part['positions'])
    eye_indices = struct.unpack_from('<' + 'I' * eye_part['indexCount'], eye_payload, eye_part['indices'])
    eye_points = [atlas_to_blender(Vector(eye_values[i:i + 3])) for i in range(0, len(eye_values), 3)]
    eye_mesh = bpy.data.meshes.new(eye_part['id'] + ' · ' + eye_part['name'])
    eye_mesh.from_pydata(eye_points, [], [eye_indices[i:i + 3] for i in range(0, len(eye_indices), 3)])
    eye_mesh.update()
    eye = bpy.data.objects.new('BodyParts3D · ' + eye_part['name'], eye_mesh)
    bpy.context.collection.objects.link(eye)
    eye_mesh.materials.append(eye_iris if 'iris' in eye_part['name'].lower() else eye_white)
    for polygon in eye_mesh.polygons:
        polygon.use_smooth = True
    eye['sourcePartId'] = eye_part['id'];eye['sourceConceptId'] = eye_part['conceptId'];eye['sourceName'] = eye_part['name']
    eye['referenceAppearance'] = True;eye['partRole'] = 'reference-eye';eye_objects.append(eye)

# A close-cropped, quiet hairstyle derived from the actual Skin scalp, not an
# anatomical addition. The cosmetic surface retains the reference head shape.
scalp_faces = []
def scalp_line(x, z):
    return 1.607 + .050 * smoothstep(-.035, .050, z) + .008 * smoothstep(.050, .070, abs(x))

for face in faces:
    center = sum((original[index] for index in face), Vector()) / 3
    hairline = scalp_line(center.x, center.z)
    if center.y > hairline:
        scalp_faces.append(face)
hair_mesh = bpy.data.meshes.new('Original Skin scalp-derived close crop')
hair_mesh.from_pydata([atlas_to_blender(point) for point in original], [], scalp_faces);hair_mesh.update()
hair_bm = bmesh.new();hair_bm.from_mesh(hair_mesh)
bmesh.ops.delete(hair_bm, geom=[vertex for vertex in hair_bm.verts if not vertex.link_faces], context='VERTS')
head_surface = BVHTree.FromPolygons([atlas_to_blender(point) for point in original], faces, all_triangles=True)
head_center = Vector((0, .030, 1.648))
for vertex in hair_bm.verts:
    if vertex.is_boundary:
        vertex.co.z = scalp_line(vertex.co.x, -vertex.co.y)
        direction = (vertex.co - head_center).normalized()
        hit, _, _, _ = head_surface.ray_cast(head_center, direction, .3)
        if hit is not None and hit.z > 1.575:
            vertex.co = hit
hair_bm.normal_update()
for vertex in hair_bm.verts:
    vertex.co += vertex.normal * .0035
hair_bm.to_mesh(hair_mesh);hair_bm.free();hair_mesh.update()
hair = bpy.data.objects.new('Cosmetic · Skin-derived dark brown close crop', hair_mesh)
bpy.context.collection.objects.link(hair);hair_mesh.materials.append(material('Reference · quiet dark brown hair', 0x241B15, .94))
for polygon in hair_mesh.polygons:
    polygon.use_smooth = True
hair['sourcePartId'] = 'FJ2810';hair['sourceName'] = 'Skin-derived cosmetic scalp';hair['anatomicalStructure'] = False;hair['partRole'] = 'cosmetic-hair'
hair_bm = bmesh.new();hair_bm.from_mesh(hair_mesh)
bmesh.ops.remove_doubles(hair_bm, verts=list(hair_bm.verts), dist=.00001)
bmesh.ops.recalc_face_normals(hair_bm, faces=list(hair_bm.faces))
hair_bm.to_mesh(hair_mesh);hair_bm.free();hair_mesh.update()
hair_soften = hair.modifiers.new('Soft scalp-derived hairline', 'SUBSURF')
hair_soften.levels = 1;hair_soften.render_levels = 1
hair_fit = hair.modifiers.new('Keep cosmetic hair outside the original head', 'SHRINKWRAP')
hair_fit.target = body;hair_fit.wrap_method = 'NEAREST_SURFACEPOINT';hair_fit.offset = .007
# A cosmetic scalp tone underneath the source-derived hair makes the hairline
# continuous even over the original atlas's tiny seams. This is vertex colour,
# not a change to the head or body coordinates and not an anatomical label.
appearance = body_mesh.color_attributes.new(name='Reference appearance', type='FLOAT_COLOR', domain='POINT')
body_rgb = body_material.diffuse_color[:3]
hair_rgb = hair_mesh.materials[0].diffuse_color[:3]
for i, mesh_vertex in enumerate(body_mesh.vertices):
    point = Vector((mesh_vertex.co.x, mesh_vertex.co.z, -mesh_vertex.co.y))
    weight = smoothstep(scalp_line(point.x, point.z) - .005,
                        scalp_line(point.x, point.z) + .003, point.y)
    colour = tuple(body_rgb[axis] * (1 - weight) + hair_rgb[axis] * weight for axis in range(3))
    appearance.data[i].color = (*colour, 1)
colour_node = body_material.node_tree.nodes.new('ShaderNodeVertexColor');colour_node.layer_name = appearance.name
body_material.node_tree.links.new(colour_node.outputs['Color'], body_material.node_tree.nodes['Principled BSDF'].inputs['Base Color'])

# Derive clothing from this same complete skin, rather than fitting Snow or
# constructing a body from primitives. Include enough original faces before
# cutting so the waist and both leg openings can be bisected cleanly.
cloth_faces = []
for face in faces:
    center = sum((vertices[index] for index in face), Vector()) / 3
    if .585 < center.y < 1.035 and abs(center.x) < .205:
        cloth_faces.append(face)
cloth_mesh = bpy.data.meshes.new('Skin-derived shorts surface')
cloth_mesh.from_pydata([atlas_to_blender(point) for point in vertices], [], cloth_faces)
cloth_mesh.update()
bm = bmesh.new();bm.from_mesh(cloth_mesh)
bmesh.ops.delete(bm, geom=[vertex for vertex in bm.verts if not vertex.link_faces], context='VERTS')
for height, above in ((.995, True), (.645, False)):
    geometry = list(bm.verts) + list(bm.edges) + list(bm.faces)
    bmesh.ops.bisect_plane(bm, geom=geometry, dist=.000001,
                          plane_co=(0, 0, height), plane_no=(0, 0, 1),
                          clear_outer=above, clear_inner=not above)
# The coordinate band also touches the inner wrists. Keep only the connected
# pelvis/leg surface; clothing must not leave detached dark strips on the arms.
remaining = set(bm.faces);components = []
while remaining:
    first = remaining.pop();component = {first};stack = [first]
    while stack:
        face = stack.pop()
        for edge in face.edges:
            for adjacent in edge.link_faces:
                if adjacent in remaining:
                    remaining.remove(adjacent);component.add(adjacent);stack.append(adjacent)
    components.append(component)
kept_faces = set()
for component in components:
    component_vertices = {vertex for face in component for vertex in face.verts}
    mean_abs_x = sum(abs(vertex.co.x) for vertex in component_vertices) / len(component_vertices)
    if mean_abs_x < .19:
        kept_faces.update(component)
bmesh.ops.delete(bm, geom=[face for face in bm.faces if face not in kept_faces], context='FACES')
bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.00001)
# Replace the source's intimate folds only on the garment with a quiet front
# cloth panel, using its own existing boundary. The complete body is retained.
front_faces = []
for face in bm.faces:
    center = face.calc_center_median()
    if abs(center.x) < .095 and .705 < center.z < .945 and center.y < -.004:
        front_faces.append(face)
bmesh.ops.delete(bm, geom=front_faces, context='FACES_ONLY')
bmesh.ops.delete(bm, geom=[edge for edge in bm.edges if not edge.link_faces], context='EDGES')
panel_edges = [edge for edge in bm.edges if edge.is_boundary]
panel_result = bmesh.ops.holes_fill(bm, edges=panel_edges, sides=0)
front_panel_faces = len(panel_result['faces'])
assert front_panel_faces > 0, 'Source-derived garment front panel was not closed.'
bmesh.ops.delete(bm, geom=[vertex for vertex in bm.verts if not vertex.link_faces], context='VERTS')
# Use the source garment topology; a few gentle smoothing passes soften atlas
# skin details and crotch folds into an understated training garment.
for _ in range(3):
    interior = [vertex for vertex in bm.verts if .647 < vertex.co.z < .993]
    bmesh.ops.smooth_vert(bm, verts=interior, factor=.15,
                         use_axis_x=True, use_axis_y=True, use_axis_z=True)
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces));bm.normal_update()
for vertex in bm.verts:
    vertex.co += vertex.normal * .009
    # Keep the dark cloth away from the skin across the low central front.
    x, y, height = vertex.co
    if abs(x) < .080 and .700 < height < .945 and y < 0:
        limit = .085 + .022 * smoothstep(.780, .945, height)
        vertex.co.y = min(vertex.co.y, -limit)
bm.to_mesh(cloth_mesh);bm.free();cloth_mesh.update()
shorts = bpy.data.objects.new('BodyParts3D Skin-derived · athletic shorts', cloth_mesh)
bpy.context.collection.objects.link(shorts);cloth_mesh.materials.append(shorts_material)
for polygon in cloth_mesh.polygons:
    polygon.use_smooth = True
shorts['sourcePartId'] = 'FJ2810';shorts['sourceName'] = 'Skin-derived clothing'
shorts['anatomicalStructure'] = False;shorts['partRole'] = 'clothing'
# Closed source-derived garment surfaces are softly remeshed to remove the
# original intimate folds and non-planar panel triangulation. This affects only
# clothing, never the original or derived body or anatomical muscle meshes.
remesh = shorts.modifiers.new('Source-derived soft garment surface', 'REMESH')
remesh.mode = 'VOXEL';remesh.voxel_size = .004;remesh.use_smooth_shade = True;remesh.adaptivity = .15
soften = shorts.modifiers.new('Understated fabric surface', 'SMOOTH');soften.factor = .7;soften.iterations = 4
reduce = shorts.modifiers.new('Lightweight garment', 'DECIMATE');reduce.ratio = .5
# Simple normalized offsets avoid the very large corrections that an
# even-thickness shell can produce on tightly folded original skin triangles.
depsgraph = bpy.context.evaluated_depsgraph_get()
cloth_evaluated = shorts.evaluated_get(depsgraph)
cloth_evaluated_mesh = cloth_evaluated.to_mesh()
assert all(abs(vertex.co.x) < .25 and .60 < vertex.co.z < 1.04 and abs(vertex.co.y) < .20
           for vertex in cloth_evaluated_mesh.vertices), 'Clothing modifier escaped local pelvis bounds.'
cloth_evaluated.to_mesh_clear()

scene = bpy.context.scene
scene.unit_settings.system = 'METRIC';scene.unit_settings.scale_length = 1
scene.render.engine = 'CYCLES';scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 640;scene.render.resolution_y = 900;scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG';scene.render.film_transparent = False
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.76, .79, .84, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .22
scene.view_settings.view_transform = 'AgX';scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -.35


def area(name, location, energy, size, color):
    light = bpy.data.lights.new(name, 'AREA');light.energy = energy;light.shape = 'DISK';light.size = size;light.color = color
    obj = bpy.data.objects.new(name, light);bpy.context.collection.objects.link(obj);obj.location = location
    obj.rotation_euler = (Vector((0, 0, .95)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj


area('Large soft key', (-2.5, -3.0, 3.1), 180, 3.0, (1.0, .97, .92))
area('Cool fill', (2.3, -1.0, 1.6), 70, 2.5, (.84, .91, 1.0))
area('Soft back light', (0, 2.5, 2.2), 180, 2.5, (.94, .97, 1.0))
floor_material = material('Render stage only', 0xD9DCE1, .9)
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.004))
floor = bpy.context.object;floor.name = 'Render floor · excluded from GLB';floor.data.materials.append(floor_material)
camera_data = bpy.data.cameras.new('Front and back review camera');camera_data.type = 'ORTHO';camera_data.ortho_scale = 1.93
camera = bpy.data.objects.new('Front and back review camera', camera_data);bpy.context.collection.objects.link(camera);scene.camera = camera


def position_camera(back=False):
    camera.location = (0, 4.0 if back else -4.0, .91)
    camera.rotation_euler = (Vector((0, 0, .89)) - camera.location).to_track_quat('-Z', 'Y').to_euler()


position_camera()
bpy.ops.wm.save_as_mainfile(filepath=str(ASSET / 'muscle-reference.blend'))
bpy.ops.object.select_all(action='DESELECT')
for model_object in [body, shorts, hair, *eye_objects]:
    model_object.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.export_scene.gltf(filepath=str(ANATOMY / 'muscle-reference.glb'), export_format='GLB', use_selection=True,
                          export_apply=True, export_yup=True, export_extras=True,
                          export_materials='EXPORT', export_animations=False, export_cameras=False, export_lights=False)
for name, back in (('front', False), ('back', True)):
    position_camera(back);scene.render.filepath = str(OUTPUT / (name + '.png'))
    bpy.ops.render.render(write_still=True)
scene.render.resolution_x = 720;scene.render.resolution_y = 720
camera_data.ortho_scale = .48;camera.location = (.24, -.78, 1.65)
camera.rotation_euler = (Vector((0, 0, 1.565)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = str(OUTPUT / 'portrait.png');bpy.ops.render.render(write_still=True)
scene.render.resolution_x = 640;scene.render.resolution_y = 900;camera_data.ortho_scale = 1.93
position_camera();bpy.ops.wm.save_as_mainfile(filepath=str(ASSET / 'muscle-reference.blend'))

after_hashes = hashes()
assert before_hashes == after_hashes, 'Original anatomy assets changed.'
assert eye_source_hashes == {name: hashlib.sha256((upstream_directory / name).read_bytes()).hexdigest()
                             for name in eye_source_hashes}, 'Original eye assets changed.'
depsgraph = bpy.context.evaluated_depsgraph_get()
evaluated = shorts.evaluated_get(depsgraph);evaluated_mesh = evaluated.to_mesh()
shorts_triangles = sum(len(polygon.vertices) - 2 for polygon in evaluated_mesh.polygons)
evaluated.to_mesh_clear()
body_bounds = [[min(point[axis] for point in vertices) for axis in range(3)],
               [max(point[axis] for point in vertices) for axis in range(3)]]
model_points = [];model_parts = []
for model_object in [body, shorts, hair, *eye_objects]:
    evaluated = model_object.evaluated_get(depsgraph);evaluated_mesh = evaluated.to_mesh()
    used = {index for polygon in evaluated_mesh.polygons for index in polygon.vertices}
    for index in used:
        world = model_object.matrix_world @ evaluated_mesh.vertices[index].co
        model_points.append((world.x, world.z, -world.y))
    model_parts.append({'name': model_object.name, 'sourcePartId': model_object.get('sourcePartId'),
                        'partRole': model_object.get('partRole'), 'vertices': len(used),
                        'triangles': sum(len(polygon.vertices) - 2 for polygon in evaluated_mesh.polygons)})
    evaluated.to_mesh_clear()
bounds = [[min(point[axis] for point in model_points) for axis in range(3)],
          [max(point[axis] for point in model_points) for axis in range(3)]]
metadata = {
    'id': 'bodyparts3d-fitness-reference', 'source': 'BodyParts3D', 'version': '4.0', 'sourceId': part['id'], 'sourcePartId': part['id'],
    'sourceConceptId': part['conceptId'], 'sourceName': 'Skin', 'sourceCommit': manifest['sourceCommit'],
    'sourceRepository': manifest['sourceRepository'], 'license': 'CC-BY-4.0',
    'attribution': 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
    'licenseUrl': 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
    'asset': '/anatomy/muscle-reference.glb', 'blend': 'assets/coach/muscle-reference.blend',
    'units': 'meters', 'referencePose': True, 'bounds': bounds,
    'triangles': sum(item['triangles'] for item in model_parts), 'modelParts': model_parts,
    'coordinates': {'units': 'meters', 'up': '+Y', 'anterior': '+Z', 'anatomicalLeft': '+X', 'bounds': bounds},
    'body': {'vertices': len(body_mesh.vertices), 'triangles': model_parts[0]['triangles'], 'bounds': body_bounds, 'allBodyRegionsPreserved': True,
             'sourceDuplicateFacesRemoved': duplicate_faces_removed, 'faceOpeningsClosed': face_closed},
    'shorts': {'triangles': shorts_triangles, 'source': 'Original Skin face subset, smoothed and offset as clothing',
               'frontPanelFaces': front_panel_faces, 'anatomicalStructure': False},
    'adaptations': ['Converted atlas coordinates to Blender and exported back to the original meter/Y-up coordinates.',
                    'All source body regions retained, including head, hands and feet; one exact duplicate face removed for a valid export, with no central hole or body cropping.',
                    'Localized low-central forward skin contour was compressed and smoothed only in this derived copy.',
                    'Same-source Skin pelvis and upper-leg surfaces were copied, a plain front garment panel filled its existing boundary, then surfaces were offset, softly remeshed and hemmed into matte navy sports shorts.',
                    'The same-source head front surface was softened and eye/nose openings were closed for a low-detail mannequin appearance; visible eye structures were omitted.',
                    'A dark brown cosmetic close crop was derived from the original Skin scalp, softly subdivided and fitted outside that unchanged head surface.',
                    'Cosmetic scalp vertex colour below the hair closes visual seams while preserving all head coordinates.',
                    'Opaque pale grey body material and matte navy garment; original muscle geometry and names were not edited.'],
    'partsSource': [{'id': part['id'], 'name': part['name'], 'role': 'full body surface'}] +
                   [{'id': item['id'], 'name': item['name'], 'role': 'same-coordinate reference eyes'} for item in eye_parts],
    'cosmetics': [{'name': hair.name, 'sourcePartId': 'FJ2810', 'role': 'cosmetic hair, not anatomy'},
                  {'name': shorts.name, 'sourcePartId': 'FJ2810', 'role': 'clothing, not anatomy'}],
    'privacy': {'changedVertices': sum(value > 0 and privacy_weights[i] > 0 for i, value in enumerate(changed)),
                'maximumChangeMeters': max(value for i, value in enumerate(changed) if privacy_weights[i] > 0),
                'boundsOfAllowedRegion': {'absXBelow': .090, 'yBetween': [.690, .965], 'frontZAbove': .005},
                'unchangedOutsidePrivacyAndHeadAppearance': True},
    'headAppearance': {'style': 'low-detail mannequin', 'visibleEyes': False, 'closedOpenings': face_closed,
                       'changedVertices': sum(value > 0 and head_weights[i] > 0 for i, value in enumerate(changed)),
                       'allowedRegion': {'absXBelow': .078, 'yBetween': [1.485, 1.665], 'frontZAbove': .006},
                       'bodyCoordinatesOutsidePrivacyAndHeadUnchanged': True},
    'limitations': ['Static adult male atlas reference; no animation rig or muscle activation measurements.',
                    'Not registered to Snow or to the current Flare pose.',
                    'No muscles, anatomical labels, eyes or expression controls were invented; the head is a simplified source-derived mannequin.',
                    'Privacy/clothing adaptations make the modified body surface unsuitable for precise anatomy measurements.',
                    'The original atlas muscle meshes remain separate and retain their original coordinates and identifiers.'],
    'renders': {'front': 'output/muscle-reference-20261007/front.png', 'back': 'output/muscle-reference-20261007/back.png',
                'portrait': 'output/muscle-reference-20261007/portrait.png'},
    'verification': {'sourceHashesBefore': before_hashes, 'sourceHashesAfter': after_hashes, 'sourceAssetsUnchanged': before_hashes == after_hashes,
                     'upstreamEyeSourceHashes': eye_source_hashes},
}
metadata['modifications'] = metadata['adaptations']
metadata['glbSha256'] = hashlib.sha256((ANATOMY / 'muscle-reference.glb').read_bytes()).hexdigest()
(ANATOMY / 'muscle-reference.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', 'utf-8')
(OUTPUT / 'build-checks.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', 'utf-8')
print('MUSCLE_REFERENCE_COMPLETE', json.dumps({'bodyTriangles': metadata['body']['triangles'], 'shortsTriangles': shorts_triangles,
                                            'privacyChangedVertices': metadata['privacy']['changedVertices'],
                                            'headAppearanceChangedVertices': metadata['headAppearance']['changedVertices'],
                                            'sourceAssetsUnchanged': before_hashes == after_hashes}))
