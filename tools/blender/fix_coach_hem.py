"""Add a soft, local overlap at the existing tee/shorts waistband.

Only Snow's existing lower tee vertices move. Materials, UVs, weights,
topology, shorts, other meshes and every rest bone remain unchanged.
"""
import bpy,json,math,sys
from pathlib import Path
from mathutils import Vector,Quaternion,Matrix

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output'/'outfit-hem'

def smooth(t):
    t=max(0.,min(1.,t));return t*t*(3.-2.*t)

def relax_coach_hem(tee,clearance=.009,fade_start=.980,fade_end=1.070,drop=.003):
    if tee.get('coach_hem_overlap_version')==1:
        return json.loads(tee['coach_hem_overlap_report'])
    world=tee.matrix_world;inverse=world.inverted();count=0;maximum=0.
    for vertex in tee.data.vertices:
        point=world@vertex.co
        influence=1.-smooth((point.z-fade_start)/(fade_end-fade_start))
        if influence<=0.:continue
        radial=Vector((point.x,point.y+.022,0.))
        if radial.length<.025:continue
        offset=radial.normalized()*(clearance*influence)
        offset.z=-drop*(1.-smooth((point.z-.885)/.065))
        vertex.co=inverse@(point+offset);count+=1;maximum=max(maximum,offset.length)
    tee.data.update()
    if tee.data.has_custom_normals:
        tee.data.normals_split_custom_set([(0,0,0)]*len(tee.data.loops))
    report={'version':1,'vertices_moved':count,'maximum_move_m':maximum,
        'clearance_m':clearance,'fade_height_m':[fade_start,fade_end],
        'lower_hem_drop_m':drop,'materials_uv_weights_topology_unchanged':True}
    tee['coach_hem_overlap_version']=1;tee['coach_hem_overlap_report']=json.dumps(report)
    return report

def render_local(stage):
    rig=bpy.data.objects['Coach_Rig'];scene=bpy.context.scene
    floor=bpy.data.objects.get('Studio seamless floor')
    if floor:floor.hide_render=True
    scene.render.resolution_x=900;scene.render.resolution_y=680;scene.render.resolution_percentage=100
    scene.cycles.samples=32
    try:
        p=bpy.context.preferences.addons['cycles'].preferences;p.compute_device_type='OPTIX';p.get_devices()
        for d in p.devices:d.use=d.type=='OPTIX'
        scene.cycles.device='GPU'
    except Exception:scene.cycles.device='CPU'
    conversion=Quaternion((1,0,0),math.pi/2)
    snapshots=json.loads((ROOT/'output'/'iteration-blue'/'ankle-snapshots.json').read_text(encoding='utf-8'))
    for snapshot in snapshots:
        for bone in snapshot['bones']:
            x,y,z,w=bone['deltaQuaternion'];q=conversion@Quaternion((w,x,y,z))@conversion.conjugated()
            p=bone['position'];target=Vector((p[0],-p[2],p[1]));pb=rig.pose.bones[bone['name']]
            pb.matrix=Matrix.Translation(target)@q.to_matrix().to_4x4()@pb.bone.matrix_local.to_quaternion().to_matrix().to_4x4()
        scene.view_layers[0].update()
        pelvis=rig.pose.bones['pelvis'];q=pelvis.matrix.to_quaternion()@pelvis.bone.matrix_local.to_quaternion().conjugated()
        center=pelvis.head+q@Vector((0,-.025,.055))
        sign=1 if snapshot['index']==2 else -1
        scene.camera.location=center+q@Vector((sign*.24,-.90,.12))
        scene.camera.rotation_euler=(center-scene.camera.location).to_track_quat('-Z','Y').to_euler()
        scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=.55
        scene.render.filepath=str(OUT/('hem-'+stage+'-step'+str(snapshot['index']+1)+'.png'))
        bpy.ops.render.render(write_still=True)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    stage=sys.argv[-1] if sys.argv[-1] in ['before','after'] else 'after'
    if stage=='before':render_local(stage);return
    rig=bpy.data.objects['Coach_Rig'];tee=bpy.data.objects['Coach_Training_Tee']
    matrices={bone.name:bone.matrix.copy() for bone in rig.pose.bones}
    rests={b.name:[list(row) for row in b.matrix_local] for b in rig.data.bones}
    report=relax_coach_hem(tee)
    for bone in rig.pose.bones:bone.matrix_basis.identity()
    bpy.context.view_layer.update();bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
    for ob in bpy.data.objects:
        if ob.type=='MESH' and ob.name.startswith('Coach_'):ob.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public'/'coach'/'flare-coach.glb'),export_format='GLB',
        use_selection=True,export_animations=False,export_yup=True,export_apply=False,
        export_skins=True,export_all_influences=False,export_cameras=False,export_lights=False,export_extras=True)
    for bone in rig.pose.bones:bone.matrix=matrices[bone.name]
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets'/'coach'/'flare-coach.blend'))
    report['all_twenty_rest_bones_unchanged']=rests=={b.name:[list(row) for row in b.matrix_local] for b in rig.data.bones}
    (OUT/'hem-repair.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('HEM_REPAIR='+json.dumps(report),flush=True)
    render_local(stage)

if __name__=='__main__':main()
