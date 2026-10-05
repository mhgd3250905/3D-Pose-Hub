"""Render and measure shoe soles in the derived coach's neutral pose."""
import bpy, json, sys
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

root = Path(__file__).resolve().parents[2]
stage = sys.argv[-1] if '--' in sys.argv else 'before'
output = root / 'output' / 'blender'
scene = bpy.context.scene
rig = bpy.data.objects['Coach_Rig']
for bone in rig.pose.bones:
    bone.matrix_basis.identity()
scene.view_layers[0].update()

def bounds(ob):
    points = [ob.matrix_world @ v.co for v in ob.data.vertices]
    return {'min': [min(p[i] for p in points) for i in range(3)],
            'max': [max(p[i] for p in points) for i in range(3)]}

body = bpy.data.objects['Coach_Body']
sole = bpy.data.objects['Coach_Soles']
graphs = {}
depsgraph = bpy.context.evaluated_depsgraph_get()
for ob in (body, sole):
    evaluated = ob.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    points = [ob.matrix_world @ vertex.co for vertex in mesh.vertices]
    graphs[ob.name] = BVHTree.FromPolygons(points, [list(p.vertices) for p in mesh.polygons])
    evaluated.to_mesh_clear()

shoe_bounds = bounds(sole)
ray_count = body_in_front = 0
worst_protrusion = 0
for ix in range(160):
    x = shoe_bounds['min'][0] + (ix + .5) / 160 * (shoe_bounds['max'][0] - shoe_bounds['min'][0])
    for iy in range(160):
        y = shoe_bounds['min'][1] + (iy + .5) / 160 * (shoe_bounds['max'][1] - shoe_bounds['min'][1])
        origin = Vector((x, y, -.1))
        direction = Vector((0, 0, 1))
        sole_hit = graphs[sole.name].ray_cast(origin, direction)
        if sole_hit[0] is None:
            continue
        ray_count += 1
        body_hit = graphs[body.name].ray_cast(origin, direction)
        if body_hit[0] is not None and body_hit[0].z < sole_hit[0].z - .00005:
            body_in_front += 1
            worst_protrusion = max(worst_protrusion, sole_hit[0].z - body_hit[0].z)

report = {'stage': stage, 'body': {**bounds(body), 'vertices': len(body.data.vertices),
    'polygons': len(body.data.polygons),
    'vertices_below_shoe_top': sum(v.co.z < .095 for v in body.data.vertices),
    'calf_vertices': sum(.12 < v.co.z < .60 for v in body.data.vertices)},
    'soles': shoe_bounds, 'sneakers': bounds(bpy.data.objects['Coach_Sneakers']),
    'sole_underside_rays': ray_count, 'skin_underside_rays': body_in_front,
    'max_skin_protrusion_metres': worst_protrusion,
    'bones': len(rig.data.bones)}
report_path = output / ('coach-shoes-' + stage + '.json')
report_path.write_text(json.dumps(report, indent=2), encoding='utf-8')

floor = bpy.data.objects.get('Studio seamless floor')
if floor:
    floor.hide_render = True
camera = scene.camera
camera.location = (.14, -.38, -.46)
camera.rotation_euler = (Vector((0, -.085, .01)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.ortho_scale = .39
scene.render.resolution_x = 1152
scene.render.resolution_y = 864
data = bpy.data.lights.new('Diagnostic sole light', 'AREA')
data.energy = 12
data.size = .7
light = bpy.data.objects.new('Diagnostic sole light', data)
scene.collection.objects.link(light)
light.location = (.3, -.5, -.7)
light.rotation_euler = (Vector((0, -.085, .01)) - light.location).to_track_quat('-Z', 'Y').to_euler()
scene.render.filepath = str(output / ('coach-shoes-' + stage + '.png'))
scene.cycles.samples = 32
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == 'OPTIX'
    scene.cycles.device = 'GPU'
except Exception:
    scene.cycles.device = 'CPU'
bpy.ops.render.render(write_still=True)
print('COACH_SHOES=' + json.dumps(report))
