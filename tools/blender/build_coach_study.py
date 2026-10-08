"""Restore Snow's source skin for the Flutter white muscle study actor.

Run on the retained original snow_v4.2.blend with Blender --background.
The source and clothed coach are read-only. This creates a separate derivative
with the same authored body, prepared hands, footwear and 20 deform bones.
"""
import bpy, bmesh, hashlib, json, sys
from collections import defaultdict
from pathlib import Path
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).resolve().parent))
from prepare_coach_hands import prepare_training_hands
from fix_coach_joints import repair_coach_joint_records
from refine_coach_ankles import refine_coach_ankles
from sculpt_coach_study import neutralize_body, build_blank_head

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/blender-studio-source/snow-rig-v4/Snow/snow_v4.2.blend'
CLOTHED = ROOT / 'assets/coach/flare-coach.blend'
BLEND = ROOT / 'assets/coach/flare-coach-study.blend'
GLB = ROOT / 'app/scene/source/coach/flare-coach-study.glb'
BODY_GLB = ROOT / 'app/scene/source/coach/flare-coach-study-body.glb'
HEAD_GLB = ROOT / 'app/scene/source/coach/flare-coach-study-head.glb'
OUT = ROOT / 'output/coach-study-20261008'
OUT.mkdir(parents=True, exist_ok=True)
GLB.parent.mkdir(parents=True, exist_ok=True)

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
original_hashes = {str(p.relative_to(ROOT)): sha(p) for p in (SOURCE, CLOTHED, ROOT/'public/coach/flare-coach.glb', ROOT/'public/coach/coach-rig.json')}
if Path(bpy.data.filepath).resolve() != SOURCE.resolve():
    raise ValueError('Open the retained original Snow source before this script.')

source_scene = bpy.context.scene
source_rig = bpy.data.objects['RIG-Snow']
source_body = bpy.data.objects['GEO-snow-body']
source_scene.frame_set(1)
for side in ('L', 'R'):
    control = source_rig.pose.bones.get('ACT-Lips_Corner.'+side)
    if control: control.location.y = .010
for collection in bpy.data.collections: collection.hide_viewport = False
source_body.hide_viewport = False
source_body.hide_render = False
source_body.hide_set(False)
for mod in source_body.modifiers:
    if mod.type == 'MASK':
        mod.show_viewport = False
        mod.show_render = False
    if mod.type == 'NODES': mod.show_viewport = False
    if mod.type == 'SUBSURF':
        for prop in ('levels', 'render_levels'):
            try: mod.driver_remove(prop)
            except Exception: pass
        mod.levels = mod.render_levels = 1
source_scene.view_layers[0].update()
depsgraph = bpy.context.evaluated_depsgraph_get()
mesh = bpy.data.meshes.new_from_object(source_body.evaluated_get(depsgraph), preserve_all_data_layers=True, depsgraph=depsgraph)
mesh.name = 'Coach_Study_Source_Full_Skin'
source_world = [list(row) for row in source_body.matrix_world]
groups = {group.index: group.name for group in source_body.vertex_groups}
rig_data = json.loads((ROOT/'public/coach/coach-rig.json').read_text(encoding='utf-8'))
landmarks = {name: Vector((p[0], -p[2], p[1])) for name, p in rig_data['landmarks'].items()}

def map_group(name):
    if not name.startswith('DEF-'): return None
    if any(part in name for part in ('Hips', 'Hip_Center')): return 'pelvis'
    if any(part in name for part in ('Spine', 'RibCage', 'Chest')): return 'torso'
    if name == 'DEF-Neck': return 'neck'
    for suffix, side in (('.L', 'left'), ('.R', 'right')):
        if not name.endswith(suffix): continue
        if 'UpperArm' in name: return side+'UpperArm'
        if 'Forearm' in name: return side+'Forearm'
        if 'Wrist' in name or 'Finger' in name: return side+'Hand'
        if 'Shoulder' in name: return side+'Scapula'
        if 'Thigh' in name: return side+'Thigh'
        if 'Knee' in name: return side+'Shin'
        if 'Foot' in name or 'Toes' in name: return side+'Foot'
    return 'head'

original_positions = [vertex.co.copy() for vertex in mesh.vertices]
hand_report = prepare_training_hands(mesh, groups, source_rig, source_body.matrix_world, landmarks)
weights = []
for vertex in mesh.vertices:
    consolidated = defaultdict(float)
    for group in vertex.groups:
        target = map_group(groups.get(group.group, ''))
        if target: consolidated[target] += group.weight
    if not consolidated:
        p = vertex.co
        side = 'left' if p.x >= 0 else 'right'
        consolidated['torso' if p.z > 1.0 else side+'Thigh' if p.z < .79 else 'pelvis'] = 1
    total = sum(consolidated.values()) or 1
    weights.append({name: weight/total for name, weight in consolidated.items() if weight > 1e-6})
visibility = [True] * len(mesh.vertices)
joint_report = repair_coach_joint_records(mesh, weights, visibility, landmarks, original_positions=original_positions)
source_counts = {'vertices': len(mesh.vertices), 'polygons': len(mesh.polygons), 'loops': len(mesh.loops)}
# This is an authored complete skin: retain every source face, including all
# torso/hip/thigh faces previously trimmed away beneath the tee and shorts.
bm = bmesh.new(); bm.from_mesh(mesh)
deform = bm.verts.layers.deform.active
if deform:
    for vertex in bm.verts: vertex[deform].clear()
bm.to_mesh(mesh); bm.free()
mesh.materials.clear()
for polygon in mesh.polygons: polygon.use_smooth = True
temporary = OUT/'prepared-source-body.blend'
bpy.data.libraries.write(str(temporary), {mesh}, fake_user=True, compress=True)

bpy.ops.wm.open_mainfile(filepath=str(CLOTHED))
scene = bpy.context.scene
rig = bpy.data.objects['Coach_Rig']
rest_before = {bone.name: [list(row) for row in bone.matrix_local] for bone in rig.data.bones}
pose_before = {bone.name: bone.matrix.copy() for bone in rig.pose.bones}
old_body = bpy.data.objects['Coach_Body']
old_counts = {'vertices': len(old_body.data.vertices), 'polygons': len(old_body.data.polygons)}
collection = old_body.users_collection[0]
bpy.data.objects.remove(old_body, do_unlink=True)
for name in ('Coach_Training_Tee', 'Coach_Training_Shorts'):
    bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
with bpy.data.libraries.load(str(temporary), link=False) as (src, dst):
    dst.meshes = ['Coach_Study_Source_Full_Skin']
body = bpy.data.objects.new('Coach_Body', dst.meshes[0])
collection.objects.link(body)
from mathutils import Matrix
body.matrix_world = Matrix(source_world)
# Blender 4.5 can retain source vertex-group names on an evaluated mesh even
# after clearing its deform values. Canonicalize names/indices before joining
# same-source neck parts, so index 3 consistently means the web head bone.
body.vertex_groups.clear()
for bone in rig.data.bones: body.vertex_groups.new(name=bone.name)
for index, saved in enumerate(weights):
    for name, weight in saved.items(): body.vertex_groups[name].add([index], weight, 'REPLACE')
armature = body.modifiers.new('Coach • source skinning', 'ARMATURE')
armature.object = rig
armature.use_deform_preserve_volume = False
body.parent = rig
body['source'] = 'Snow Rig © Blender Foundation | studio.blender.org — CC BY 4.0'
body['study_derivative'] = 'All authored source skin faces restored; tee and shorts removed; original prepared hand and footwear transitions retained.'
ankle_report = refine_coach_ankles(body, rig)
def align_face_seam(body, face):
    """Match Snow's existing neck/upper-chest split to its rigid baked face.

    The authored head includes a small neck/chest bib, rigid in the existing
    compact web rig. Its body seam was formerly hidden under the tee. Retain
    that face unchanged, align only the mating body boundary to the same
    authored curve and blend the boundary's head weights over 45 mm.
    """
    bm = bmesh.new(); bm.from_mesh(body.data)
    boundary = {v.index for edge in bm.edges if edge.is_boundary for v in edge.verts if v.co.z < 1.5}
    bm.free()
    fbm = bmesh.new(); fbm.from_mesh(face.data)
    edges = [(face.matrix_world@edge.verts[0].co, face.matrix_world@edge.verts[1].co)
             for edge in fbm.edges if edge.is_boundary and all(v.co.z < 1.43 for v in edge.verts)]
    fbm.free()
    if len(boundary) != 104 or len(edges) != 200:
        raise ValueError(f'Unexpected original Snow head/body seam topology: {len(boundary)} body, {len(edges)} face.')
    inverse = body.matrix_world.inverted()
    def nearest(point):
        best = None; distance = float('inf')
        for a, b in edges:
            delta = b-a
            t = max(0, min(1, (point-a).dot(delta)/delta.length_squared))
            candidate = a+delta*t
            value = (point-candidate).length
            if value < distance: best, distance = candidate, value
        return best, distance
    maximum_shift = 0; changed = 0
    head_group = body.vertex_groups['head']
    for vertex in body.data.vertices:
        point = body.matrix_world@vertex.co
        if not 1.25 < point.z < 1.5: continue
        target, distance = nearest(point)
        if vertex.index in boundary:
            maximum_shift = max(maximum_shift, distance)
            vertex.co = inverse@target
            fraction = 1
        elif distance < .045:
            t = min(1, distance/.045)
            fraction = 1-t*t*(3-2*t)
        else: continue
        saved = {body.vertex_groups[g.group].name:g.weight for g in vertex.groups}
        for name, weight in saved.items(): body.vertex_groups[name].add([vertex.index], weight*(1-fraction), 'REPLACE')
        head_group.add([vertex.index], saved.get('head', 0)*(1-fraction)+fraction, 'REPLACE')
        changed += 1
    body.data.update()
    return {'method':'Same Snow mating boundary curve aligned to existing baked face; 45 mm smooth head weight transition.',
            'boundary_vertices':len(boundary), 'weight_vertices':changed, 'maximum_boundary_shift_m':maximum_shift,
            'face_unchanged':True, 'faces_added':0, 'faces_deleted':0, 'blend_width_m':.045}
seam_report = align_face_seam(body, bpy.data.objects['Coach_Face'])
neutral_body_report = neutralize_body(body)
face=bpy.data.objects['Coach_Face']
face.vertex_groups.clear()
for bone in rig.data.bones:face.vertex_groups.new(name=bone.name)
face.vertex_groups['head'].add(list(range(len(face.data.vertices))),1,'REPLACE')
head, neutral_head_report = build_blank_head(body, bpy.data.objects['Coach_Face'], rig, collection)
for name in ('Coach_Face','Coach_Hair','Coach_Brows','Coach_Eyes','Coach_Eye_Glints','Coach_Upper_Teeth','Coach_Lower_Teeth','Coach_Upper_Gums','Coach_Lower_Gums','Coach_Tongue'):
    bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
normalized_vertices = 0
restored_neck_weights=0
for vertex in body.data.vertices:
    saved = sorted(((group.group, group.weight) for group in vertex.groups if group.weight > 1e-6), key=lambda item: -item[1])
    if not saved:
        if not (vertex.co.z>1.30 and abs(vertex.co.x)<.20):
            raise ValueError('Unexpected unweighted vertex outside the source neck bib.')
        body.vertex_groups['head'].add([vertex.index],1,'REPLACE')
        restored_neck_weights+=1
        saved=[(body.vertex_groups['head'].index,1)]
    if len(saved) > 4:
        normalized_vertices += 1
        for group in body.vertex_groups: group.remove([vertex.index])
        total = sum(weight for _, weight in saved[:4])
        for index, weight in saved[:4]: body.vertex_groups[index].add([vertex.index], weight/total, 'REPLACE')
seam_report['four_influence_vertices_normalized'] = normalized_vertices
seam_report['source_head_neck_weights_restored']=restored_neck_weights
coach_meshes = [ob for ob in scene.objects if ob.type == 'MESH' and ob.name.startswith('Coach_')]
neutral = bpy.data.materials.new('Coach • neutral white study surface')
neutral.use_nodes = True
bsdf = next(node for node in neutral.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
bsdf.inputs['Base Color'].default_value = (.72, .74, .77, 1)
bsdf.inputs['Roughness'].default_value = .72
bsdf.inputs['Metallic'].default_value = 0
bsdf.inputs['Specular IOR Level'].default_value = .28
for ob in coach_meshes:
    ob.data.materials.clear()
    ob.data.materials.append(neutral)
    for polygon in ob.data.polygons: polygon.material_index = 0

for bone in rig.pose.bones: bone.matrix_basis.identity()
scene.view_layers[0].update()
bpy.ops.object.select_all(action='DESELECT')
rig.select_set(True)
for ob in coach_meshes: ob.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB', use_selection=True,
    export_animations=False, export_yup=True, export_apply=False, export_skins=True,
    export_all_influences=False, export_cameras=False, export_lights=False, export_extras=True)
for ob in coach_meshes: ob.select_set(False)
body.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(BODY_GLB), export_format='GLB', use_selection=True,
    export_animations=False, export_yup=True, export_apply=False, export_skins=True,
    export_all_influences=False, export_cameras=False, export_lights=False, export_extras=True)
body.select_set(False); head.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(HEAD_GLB), export_format='GLB', use_selection=True,
    export_animations=False, export_yup=True, export_apply=False, export_skins=True,
    export_all_influences=False, export_cameras=False, export_lights=False, export_extras=True)
bind_body_matrix = [list(row) for row in body.matrix_world]
bind_body_bounds = [[min((body.matrix_world@vertex.co)[axis] for vertex in body.data.vertices),
                     max((body.matrix_world@vertex.co)[axis] for vertex in body.data.vertices)] for axis in range(3)]
for bone in rig.pose.bones: bone.matrix = pose_before[bone.name]
scene.view_layers[0].update()
notes = bpy.data.texts.new('READ ME • unclothed white study derivative')
notes.write('Snow Rig © Blender Foundation | studio.blender.org, CC BY 4.0.\nSame mature source body, same 20 original web rest bones and landmarks and shoes. The original skin is restored instead of hiding clothes over clipped skin. Local navel/groin relaxation and a soft blank head sculpted from the same Snow face, skull, ears and neck. Facial relief is removed; no eye/brow/mouth/hair objects remain in the study derivative. Existing hand/wrist/ankle preparation reapplied. Separate study derivative only; original clothed coach and original source .blend retained unchanged. No new rig or procedural body/head primitives. No purchases or paid services.\n')
scene.render.resolution_x = 800
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.cycles.use_denoising = True
try:
    preferences = bpy.context.preferences.addons['cycles'].preferences
    preferences.compute_device_type = 'OPTIX'
    preferences.get_devices()
    for device in preferences.devices: device.use = device.type == 'OPTIX'
    scene.cycles.device = 'GPU'
except Exception: scene.cycles.device = 'CPU'
camera = scene.camera
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 2.25
camera.location = (0, -5.5, 1.14)
camera.rotation_euler = (Vector((0, 0, .98))-camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = str(OUT/'front.png')
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND))
bpy.ops.render.render(write_still=True)
camera.location = (.36,-3,1.68)
camera.rotation_euler = (Vector((0,-.01,1.61))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.ortho_scale=.54
scene.render.filepath=str(OUT/'head.png')
bpy.ops.render.render(write_still=True)
camera.location = (0, 5.5, 1.14)
camera.data.ortho_scale=2.25
camera.rotation_euler = (Vector((0, 0, .98))-camera.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = str(OUT/'back.png')
bpy.ops.render.render(write_still=True)
report = {
    'source': 'Snow Rig © Blender Foundation | studio.blender.org', 'license': 'CC BY 4.0', 'cost': 0,
    'blend': str(BLEND), 'glb': str(GLB), 'glb_bytes': GLB.stat().st_size, 'glb_sha256': sha(GLB),
    'body_glb': str(BODY_GLB), 'body_glb_bytes': BODY_GLB.stat().st_size, 'body_glb_sha256': sha(BODY_GLB),
    'head_glb': str(HEAD_GLB), 'head_glb_bytes': HEAD_GLB.stat().st_size, 'head_glb_sha256': sha(HEAD_GLB),
    'body_matrix_blender': bind_body_matrix, 'body_bounds_blender_xyz': bind_body_bounds,
    'source_body_counts': source_counts, 'clothed_trimmed_body_counts': old_counts,
    'retained_source_faces': len(body.data.polygons) == source_counts['polygons'],
    'body_vertices': len(body.data.vertices), 'body_polygons': len(body.data.polygons),
    'removed_garments': ['Coach_Training_Tee', 'Coach_Training_Shorts'],
    'meshes': [ob.name for ob in coach_meshes], 'bones': [bone.name for bone in rig.data.bones],
    'rest_bones_exactly_unchanged': rest_before == {bone.name: [list(row) for row in bone.matrix_local] for bone in rig.data.bones},
    'original_files_unchanged': all(sha(ROOT/name) == value for name, value in original_hashes.items()),
    'original_file_sha256': original_hashes, 'hands': hand_report, 'joints': joint_report, 'ankle': ankle_report, 'head_body_seam': seam_report,
    'neutral_body':neutral_body_report, 'neutral_head':neutral_head_report,
    'front_render': str(OUT/'front.png'), 'back_render': str(OUT/'back.png'),
    'head_render':str(OUT/'head.png'),
    'notes': 'Presentation surface derivative, not anatomical registration. Full same Snow body; no bone re-rigging.'}
(OUT/'build-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('COACH_STUDY_BUILD='+json.dumps({k: report[k] for k in ('glb', 'glb_bytes', 'body_vertices', 'body_polygons', 'retained_source_faces', 'rest_bones_exactly_unchanged', 'original_files_unchanged')}), flush=True)
