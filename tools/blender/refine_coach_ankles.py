"""Local collar repair on the existing Snow-derived skin and 20-bone rig.

Run on the current derived .blend, not the original Snow file. The old inner
foot contraction is retained below the heel; only the collar cross-section
and Foot/Shin weights change. No rest bone, shoe, hand or clothing is edited.
"""
import bpy,json,math,sys
from pathlib import Path
from mathutils import Vector,Quaternion,Matrix

ROOT=Path('E:/AII-3D/3D-Body')
OUT=ROOT/'output'/'iteration-blue'

def smooth(t):
    t=max(0.,min(1.,t));return t*t*(3.-2.*t)

def old_factor(h):
    return .58+.42*smooth((h+.010)/.045)

def original_height(h):
    if h>=.035:return h
    lo=min(-.2,h/.58-.02);hi=.035
    for _ in range(36):
        mid=(lo+hi)*.5
        if mid*old_factor(mid)<h:lo=mid
        else:hi=mid
    return (lo+hi)*.5

def refine_coach_ankles(body,rig):
    if body.get('coach_collar_refinement')==1:
        return json.loads(body['coach_collar_report'])
    world=body.matrix_world;inverse=world.inverted()
    report={'version':1,'source':'Existing mature Snow foot/calf skin',
        'geometry':'Restore radial collar width; retain old axial and deep internal-foot fit',
        'weights':'Foot rigid below +8mm, smooth Foot/Shin transition +8mm to +60mm',
        'sides':{}}
    for side in ['left','right']:
        ankle=rig.data.bones[side+'Foot'].head_local.copy()
        knee=rig.data.bones[side+'Shin'].head_local.copy()
        axis=(knee-ankle).normalized()
        foot=body.vertex_groups[side+'Foot'];shin=body.vertex_groups[side+'Shin']
        stats={'vertices_widened':0,'weights_changed':0,'maximum_radial_change':0.,'maximum_radius_ratio':1.}
        for vertex in body.data.vertices:
            weights={g.group:g.weight for g in vertex.groups}
            total=weights.get(foot.index,0.)+weights.get(shin.index,0.)
            if total<.99:continue
            point=world@vertex.co;offset=point-ankle
            fitted_height=offset.dot(axis);h=original_height(fitted_height)
            if not -.025<h<.065:continue
            # Invert only the known prior collar contraction. The axial fit
            # and deep foot stay unchanged, protecting the white shoe sole.
            if h<.035:
                previous=old_factor(h)
                desired=previous+(1.-previous)*smooth((h+.020)/.027)
                ratio=desired/previous
                radial=offset-axis*fitted_height
                point=point+radial*(ratio-1.)
                change=(point-world@vertex.co).length
                if change>1e-7:
                    vertex.co=inverse@point
                    stats['vertices_widened']+=1
                    stats['maximum_radial_change']=max(stats['maximum_radial_change'],change)
                    stats['maximum_radius_ratio']=max(stats['maximum_radius_ratio'],ratio)
            fraction=1.-smooth((h-.008)/.052)
            if abs(weights.get(foot.index,0.)-total*fraction)>1e-7:
                foot.add([vertex.index],total*fraction,'REPLACE')
                shin.add([vertex.index],total*(1.-fraction),'REPLACE')
                stats['weights_changed']+=1
        report['sides'][side]=stats
    body.data.update()
    if body.data.has_custom_normals:
        body.data.normals_split_custom_set([(0,0,0)]*len(body.data.loops))
    body['coach_collar_refinement']=1
    body['coach_collar_report']=json.dumps(report)
    return report

def setup_render():
    scene=bpy.context.scene
    scene.render.resolution_x=900;scene.render.resolution_y=640;scene.render.resolution_percentage=100
    scene.cycles.samples=32
    try:
        pref=bpy.context.preferences.addons['cycles'].preferences
        pref.compute_device_type='OPTIX';pref.get_devices()
        for device in pref.devices:device.use=device.type=='OPTIX'
        scene.cycles.device='GPU'
    except Exception:scene.cycles.device='CPU'
    return scene

def render_local(stage):
    scene=setup_render();rig=bpy.data.objects['Coach_Rig']
    floor=bpy.data.objects.get('Studio seamless floor')
    if floor:floor.hide_render=True
    conversion=Quaternion((1,0,0),math.pi/2)
    snapshots=json.loads((OUT/'ankle-snapshots.json').read_text(encoding='utf-8'))
    for snapshot in snapshots:
        for bone in snapshot['bones']:
            x,y,z,w=bone['deltaQuaternion']
            q=conversion@Quaternion((w,x,y,z))@conversion.conjugated()
            p=bone['position'];target=Vector((p[0],-p[2],p[1]))
            pb=rig.pose.bones[bone['name']]
            pb.matrix=Matrix.Translation(target)@q.to_matrix().to_4x4()@pb.bone.matrix_local.to_quaternion().to_matrix().to_4x4()
        scene.view_layers[0].update()
        side=snapshot['side'];foot=rig.pose.bones[side+'Foot']
        q=foot.matrix.to_quaternion()@foot.bone.matrix_local.to_quaternion().conjugated()
        center=foot.head+q@Vector((0,-.016,.018))
        sign=1 if side=='left' else -1
        scene.camera.location=center+q@Vector((sign*.21,-.15,.16))
        scene.camera.rotation_euler=(center-scene.camera.location).to_track_quat('-Z','Y').to_euler()
        scene.camera.data.type='ORTHO';scene.camera.data.ortho_scale=.33
        scene.render.filepath=str(OUT/('ankle-'+stage+'-'+side+'.png'))
        bpy.ops.render.render(write_still=True)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    stage=sys.argv[-1] if sys.argv[-1] in ['before','after'] else 'after'
    if stage=='before':render_local(stage);return
    rig=bpy.data.objects['Coach_Rig'];body=bpy.data.objects['Coach_Body']
    matrices={b.name:b.matrix.copy() for b in rig.pose.bones}
    rest_before={b.name:[list(row) for row in b.matrix_local] for b in rig.data.bones}
    rig_path=ROOT/'public'/'coach'/'coach-rig.json'
    rig_bytes=rig_path.read_bytes()
    report=refine_coach_ankles(body,rig)
    for bone in rig.pose.bones:bone.matrix_basis.identity()
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
    for ob in bpy.data.objects:
        if ob.type=='MESH' and ob.name.startswith('Coach_'):ob.select_set(True)
    bpy.context.view_layer.objects.active=rig
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'public'/'coach'/'flare-coach.glb'),export_format='GLB',
        use_selection=True,export_animations=False,export_yup=True,export_apply=False,
        export_skins=True,export_all_influences=False,export_cameras=False,export_lights=False,export_extras=True)
    for bone in rig.pose.bones:bone.matrix=matrices[bone.name]
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets'/'coach'/'flare-coach.blend'))
    report['all_twenty_rest_bones_unchanged']=rest_before=={b.name:[list(row) for row in b.matrix_local] for b in rig.data.bones}
    report['rig_json_byte_unchanged']=rig_path.read_bytes()==rig_bytes
    (OUT/'ankle-refinement.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('ANKLE_REFINEMENT='+json.dumps(report),flush=True)
    render_local(stage)

if __name__=='__main__':main()
