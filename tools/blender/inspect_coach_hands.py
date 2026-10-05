"""Render the real derived coach in a measured web preset, without saving it."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector, Quaternion, Matrix

root=Path(__file__).resolve().parents[2]
output=root/'output'/'blender'
snapshots=json.loads((root/'output'/'pose-orientations'/'render-bone-snapshots.json').read_text(encoding='utf-8'))
snapshot=next(p for p in snapshots if p['id']=='flare-right-high-v')
rig=bpy.data.objects['Coach_Rig']
scene=bpy.context.scene
conversion=Quaternion((1,0,0),math.pi/2)
def blender_point(point): return Vector((point[0],-point[2],point[1]))
for record in snapshot['bones']:
    x,y,z,w=record['deltaQuaternion']
    delta=conversion @ Quaternion((w,x,y,z)) @ conversion.conjugated()
    bone=rig.pose.bones[record['name']]
    bone.matrix=Matrix.Translation(blender_point(record['position'])) @ delta.to_matrix().to_4x4() @ bone.bone.matrix_local.to_quaternion().to_matrix().to_4x4()
scene.view_layers[0].update()

body=bpy.data.objects['Coach_Body']
evaluated=body.evaluated_get(bpy.context.evaluated_depsgraph_get())
mesh=evaluated.to_mesh()
minimum={side:1e9 for side in ('left','right')}
for vertex in mesh.vertices:
    for side in minimum:
        weight=sum(g.weight for g in vertex.groups if body.vertex_groups[g.group].name==side+'Hand')
        if weight>.7: minimum[side]=min(minimum[side],(body.matrix_world@vertex.co).z)
evaluated.to_mesh_clear()
report={'pose':snapshot['id'],'actual_hand_min_height':minimum,'ground_plane_height':0,
    'expected_support_height':.006,'source':'Exact GLB pose delta snapshot applied to the derived 20-bone Blender rig.'}

floor=bpy.data.objects['Studio seamless floor']
floor.location.z=0
camera=scene.camera
def aim(point): camera.rotation_euler=(Vector(point)-camera.location).to_track_quat('-Z','Y').to_euler()
scene.render.resolution_x=1152
scene.render.resolution_y=864
scene.cycles.samples=48
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='OPTIX';prefs.get_devices()
    for device in prefs.devices: device.use=device.type=='OPTIX'
    scene.cycles.device='GPU'
except Exception: scene.cycles.device='CPU'

# Friendly complete reference, followed by the actual planted hand.
camera.location=(2.6,-3.9,1.7)
aim((0,0,.65));camera.data.ortho_scale=2.5
scene.render.filepath=str(output/'coach-high-v-open-hands.png')
bpy.ops.render.render(write_still=True)

hand=rig.pose.bones['rightHand'].head
center=hand+Vector((-.095,-.012,-.021))
camera.location=center+Vector((-.30,-.38,.18))
aim(center);camera.data.ortho_scale=.365
scene.render.filepath=str(output/'coach-palm-support.png')
bpy.ops.render.render(write_still=True)

floor.hide_render=True
camera.location=center+Vector((-.10,-.27,-.35))
aim(center);camera.data.ortho_scale=.345
data=bpy.data.lights.new('Palm underside diagnostic fill','AREA')
data.energy=12;data.size=.7
light=bpy.data.objects.new('Palm underside diagnostic fill',data);scene.collection.objects.link(light)
light.location=center+Vector((.05,-.25,-.45))
light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath=str(output/'coach-open-palm.png')
bpy.ops.render.render(write_still=True)
(output/'coach-hands-render.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('COACH_HAND_RENDER='+json.dumps(report))
