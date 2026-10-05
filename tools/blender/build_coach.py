"""Create a zero-budget sports character from the official Snow mesh.

Run with Blender 4.5 --background --factory-startup snow_v4.2.blend --python ...
The source file is read only. Only derived workspace assets are saved.
"""
import bpy, bmesh, json, math, sys
from collections import defaultdict
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion

sys.path.insert(0,str(Path(__file__).resolve().parent))
from fix_coach_clothing import apply_coach_clothing_fix
from fix_coach_joints import repair_coach_joint_records
from prepare_coach_hands import prepare_training_hands
from style_coach_hair import style_coach_hair
from refine_coach_ankles import refine_coach_ankles
from style_coach_outfit import style_coach_outfit
from fix_coach_hem import relax_coach_hem

ROOT=Path(__file__).resolve().parents[2]
ASSET=ROOT/'assets'/'coach'
PUBLIC=ROOT/'public'/'coach'
OUTPUT=ROOT/'output'/'blender'
for path in (ASSET,PUBLIC,OUTPUT): path.mkdir(parents=True,exist_ok=True)

def srgb(value):
    return value/12.92 if value<=.04045 else ((value+.055)/1.055)**2.4

def material(name,hex_color,roughness=.65,sss=0):
    rgb=tuple(srgb(((hex_color>>shift)&255)/255) for shift in (16,8,0))
    mat=bpy.data.materials.new(name)
    mat.use_nodes=True
    bsdf=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value=(*rgb,1)
    bsdf.inputs['Roughness'].default_value=roughness
    bsdf.inputs['Metallic'].default_value=0
    if 'Subsurface Weight' in bsdf.inputs: bsdf.inputs['Subsurface Weight'].default_value=sss
    if 'Subsurface Scale' in bsdf.inputs: bsdf.inputs['Subsurface Scale'].default_value=.04
    if 'Subsurface Radius' in bsdf.inputs: bsdf.inputs['Subsurface Radius'].default_value=(1,.45,.3)
    if 'Specular IOR Level' in bsdf.inputs: bsdf.inputs['Specular IOR Level'].default_value=.28
    mat.diffuse_color=(*rgb,1)
    return mat

skin=material('Coach • warm matte skin',0xD8A488,.64,.075)
skin_darker=material('Coach • soft ear and crease color',0xBE846C,.7,.05)
upper_lip=material('Coach • natural upper lip',0xB77563,.7,.03)
lower_lip=material('Coach • natural lower lip',0xCF8D79,.65,.04)
hair=material('Coach • matte dark brown buzzcut',0x3C2D27,.88)
shirt=material('Coach • light grey training tee',0xBFC2C6,.92)
trim=material('Coach • soft grey sleeve details',0x999DA3,.94)
shorts=material('Coach • plain black training shorts',0x101114,.97)
sole=material('Coach • ivory sneaker soles',0xE7E6DB,.8)
shoe=material('Coach • warm white sneakers',0xF4F0E5,.73)
shoe_detail=material('Coach • sneaker panels',0xB4C4B4,.78)
white=material('Coach • ivory eye white',0xF7F6ED,.24)
iris=material('Coach • hazel iris',0x7A7753,.38)
pupil=material('Coach • deep brown pupil',0x251E1B,.3)
teeth=material('Coach • teeth',0xF5F0DF,.38)
gum=material('Coach • mouth interior',0x7B4C45,.83)

source_scene=bpy.context.scene
source_rig=bpy.data.objects['RIG-Snow']
source_scene.frame_set(1)
# Blender's built-in constraints and drivers work without running bundled UI scripts.
for side in ('L','R'):
    control=source_rig.pose.bones.get('ACT-Lips_Corner.'+side)
    if control:
        # The local Y direction is upward for these authored smile controls.
        control.location.y=.010
source_scene.view_layers[0].update()

def source_point(name,tail=False):
    bone=source_rig.pose.bones[name]
    return source_rig.matrix_world @ (bone.tail if tail else bone.head)

landmarks={
    'pelvis':source_point('DEF-Spine'),
    'torso':(source_point('DEF-UpperArm_1.L')+source_point('DEF-UpperArm_1.R'))*.5,
    'neck':source_point('DEF-Neck'), 'head':source_point('DEF-Head'),
}
for side,label in (('L','left'),('R','right')):
    for key,bone in [('Shoulder','DEF-UpperArm_1.'),('Elbow','DEF-Forearm_1.'),('Wrist','DEF-Wrist.'),('Hip','DEF-Thigh_1.'),('Knee','DEF-Knee_1.'),('Ankle','DEF-Foot.')]:
        landmarks[label+key]=source_point(bone+side)

bone_pivots={'pelvis':landmarks['pelvis'],'torso':landmarks['torso'],'neck':landmarks['neck'],'head':landmarks['head']}
for side in ('left','right'):
    for name,key in [('Scapula','Shoulder'),('UpperArm','Shoulder'),('Forearm','Elbow'),('Hand','Wrist'),('Thigh','Hip'),('Patella','Knee'),('Shin','Knee'),('Foot','Ankle')]:
        bone_pivots[side+name]=landmarks[side+key]

def map_group(name):
    if not name.startswith('DEF-'): return None
    if any(part in name for part in ('Hips','Hip_Center')): return 'pelvis'
    if any(part in name for part in ('Spine','RibCage','Chest')): return 'torso'
    if name=='DEF-Neck': return 'neck'
    for suffix,side in (('.L','left'),('.R','right')):
        if not name.endswith(suffix): continue
        if 'UpperArm' in name: return side+'UpperArm'
        if 'Forearm' in name: return side+'Forearm'
        if 'Wrist' in name or 'Finger' in name: return side+'Hand'
        if 'Shoulder' in name: return side+'Scapula'
        if 'Thigh' in name: return side+'Thigh'
        if 'Knee' in name: return side+'Shin'
        if 'Foot' in name or 'Toes' in name: return side+'Foot'
    return 'head'

items=[
    ('GEO-snow-body','Coach_Body',[skin]),
    ('GEO-snow-head','Coach_Face',[skin,skin_darker,upper_lip,lower_lip]),
    ('GEO-snow-hair_base','Coach_Hair',[hair]),
    ('GEO-snow-eyebrows','Coach_Brows',[hair]),
    ('GEO-snow-eye_anim','Coach_Eyes',[white,iris,pupil]),
    ('GEO-snow-eye_dots','Coach_Eye_Glints',[white]),
    ('GEO-snow-shirt','Coach_Training_Tee',[shirt,trim]),
    ('GEO-snow-pants','Coach_Training_Shorts',[shorts,trim]),
    ('GEO-snow-shoes_base','Coach_Sneakers',[shoe,shoe_detail]),
    ('GEO-snow-shoes_bottom','Coach_Soles',[sole]),
    ('GEO-snow-shoes_parts','Coach_Shoe_Details',[shoe_detail,shoe]),
    ('GEO-snow-teeth_upper','Coach_Upper_Teeth',[teeth]),
    ('GEO-snow-teeth_lower','Coach_Lower_Teeth',[teeth]),
    ('GEO-snow-gums_upper','Coach_Upper_Gums',[gum]),
    ('GEO-snow-gums_lower','Coach_Lower_Gums',[gum]),
    ('GEO-snow-tongue','Coach_Tongue',[gum]),
]

mesh_records=[]
# The original long trousers also hid the bare feet. Revealing the calves
# must not reveal those feet through the sneaker soles. Start from the
# original above-collar mask, then restore the genuine closed foot with
# smooth Shin/Foot weights and fit its covered surface inside the white shoe.
shoe_skin_floor=min(landmarks['leftAnkle'].z,landmarks['rightAnkle'].z)+.010
body_visibility_report={}
hand_surface_report={}
joint_surface_report={}
clothing_surface_report={}
hair_style_report={}

for source_name,name,mats in items:
    ob=bpy.data.objects[source_name]
    # Reveal real skin on the calves that the original long trousers concealed.
    for mod in ob.modifiers:
        if mod.type=='SUBSURF':
            # Snow's quality toggle drives these values back to zero.
            for prop in ('levels','render_levels'):
                try: mod.driver_remove(prop)
                except Exception: pass
            level=2 if source_name in ('GEO-snow-head','GEO-snow-hair_base','GEO-snow-eye_anim') else 1
            mod.levels=level
            mod.render_levels=level
        if source_name=='GEO-snow-body' and mod.type=='MASK':
            mod.show_viewport=False
            mod.show_render=False
        if mod.type=='NODES': mod.show_viewport=False
    ob.hide_viewport=False
    ob.hide_render=False
    ob.hide_set(False)
    for col in ob.users_collection: col.hide_viewport=False
source_scene.view_layers[0].update()
depsgraph=bpy.context.evaluated_depsgraph_get()

for source_name,name,mats in items:
    source=bpy.data.objects[source_name]
    evaluated=source.evaluated_get(depsgraph)
    mesh=bpy.data.meshes.new_from_object(evaluated,preserve_all_data_layers=True,depsgraph=depsgraph)
    group_names={g.index:g.name for g in source.vertex_groups}
    original_positions=[v.co.copy() for v in mesh.vertices] if name=='Coach_Body' else None
    if name=='Coach_Body':
        hand_surface_report=prepare_training_hands(mesh,group_names,source_rig,source.matrix_world,landmarks)
    saved=[]
    visibility=[]
    body_mask=next((m for m in source.modifiers if m.type=='MASK' and m.name=='Mask Body'),None)
    for vertex in mesh.vertices:
        weights=defaultdict(float)
        if any(part in name for part in ('Face','Hair','Brows','Eyes','Glints','Teeth','Gums','Tongue')):
            weights['head']=1
        elif any(part in name for part in ('Sneakers','Soles','Shoe_Details')):
            weights['leftFoot' if vertex.co.x>0 else 'rightFoot']=1
        else:
            for group in vertex.groups:
                target=map_group(group_names.get(group.group,''))
                if target: weights[target]+=group.weight
            if not weights:
                p=vertex.co
                side='left' if p.x>=0 else 'right'
                weights['torso' if p.z>1.0 else side+'Thigh' if p.z<.79 else 'pelvis']=1
        total=sum(weights.values()) or 1
        saved.append({k:v/total for k,v in weights.items() if v>1e-6})
        mask=next((g.weight for g in vertex.groups if group_names.get(g.group)=='mask'),0)
        source_visible=(1-mask if body_mask and body_mask.invert_vertex_group else mask)>.5
        calf_visible=shoe_skin_floor<=vertex.co.z<.622
        visibility.append(vertex.co.z>=shoe_skin_floor and (source_visible or calf_visible))
    if name=='Coach_Body':
        joint_surface_report=repair_coach_joint_records(mesh,saved,visibility,landmarks,
            original_positions=original_positions)
        body_visibility_report={'initial_skin_cutoff_height':shoe_skin_floor,
            'shoe_covered_vertices_excluded':sum(not visibility[v.index] and v.co.z<shoe_skin_floor for v in mesh.vertices),
            'visible_skin_vertices':sum(visibility),
            'exposed_calf_vertices':sum(visibility[v.index] and shoe_skin_floor<=v.co.z<.622 for v in mesh.vertices),
            'internal_foot_skin_restored':sum(side['source_foot_skin_vertices_restored'] for side in joint_surface_report['sides'].values())}
    mesh_records.append((name,mesh,saved,mats,source.matrix_world.copy(),visibility))

scene=bpy.data.scenes.new('Flare • friendly training coach')
bpy.context.window.scene=scene
coach_collection=bpy.data.collections.new('COACH • real Snow surfaces')
scene.collection.children.link(coach_collection)
rig_data=bpy.data.armatures.new('Coach_Deform_Skeleton')
rig=bpy.data.objects.new('Coach_Rig',rig_data)
coach_collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name,pivot in bone_pivots.items():
    bone=rig.data.edit_bones.new(name)
    bone.head=pivot
    bone.tail=pivot+Vector((0,0,.07))
bpy.ops.object.mode_set(mode='OBJECT')
rig.show_in_front=True
rig.data.display_type='STICK'
rig['source']='Snow Rig © Blender Foundation | studio.blender.org'
rig['license']='CC BY 4.0'
rig['purpose']='Friendly Flare teaching character; source weights consolidated into 20 deform bones with local clothing, ankle and natural-wrist transitions.'
coach_meshes=[]

for name,mesh,saved,mats,world,visibility in mesh_records:
    ob=bpy.data.objects.new(name,mesh)
    coach_collection.objects.link(ob)
    ob.matrix_world=world
    # Keep the interpolated source weights; remove all source group indices.
    bm=bmesh.new();bm.from_mesh(mesh)
    layer=bm.verts.layers.deform.active
    if layer:
        for vert in bm.verts: vert[layer].clear()
    bm.to_mesh(mesh);bm.free()
    for bone_name in bone_pivots: ob.vertex_groups.new(name=bone_name)
    for index,weights in enumerate(saved):
        for bone_name,weight in weights.items():
            ob.vertex_groups[bone_name].add([index],weight,'REPLACE')
    # Blender clears polygon material indices when clearing material slots.
    original_material_indices=[p.material_index for p in mesh.polygons]
    mesh.materials.clear()
    for mat in mats: mesh.materials.append(mat)
    for polygon in mesh.polygons:
        polygon.use_smooth=True
        polygon.material_index=min(original_material_indices[polygon.index],len(mats)-1)
        if len(mats)==1: polygon.material_index=0
        elif name=='Coach_Training_Tee':
            # A narrow grey cuff on both sleeves, using actual garment polygons.
            center=polygon.center
            polygon.material_index=1 if abs(center.x)>.286 else 0
        elif name=='Coach_Training_Shorts': polygon.material_index=0
        elif name=='Coach_Sneakers': polygon.material_index=0
        elif name=='Coach_Shoe_Details': polygon.material_index=0
    if name=='Coach_Body':
        bm=bmesh.new();bm.from_mesh(mesh);bm.verts.ensure_lookup_table()
        covered=[face for face in bm.faces if not all(visibility[v.index] for v in face.verts)]
        bmesh.ops.delete(bm,geom=covered,context='FACES')
        bm.to_mesh(mesh);bm.free()
    if name=='Coach_Training_Shorts':
        bm=bmesh.new();bm.from_mesh(mesh)
        bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),
            dist=.00001,plane_co=(0,0,.620),plane_no=(0,0,1),clear_inner=True,clear_outer=False)
        bm.to_mesh(mesh);bm.free()
        # Continuous widening keeps the crotch midline from crossing itself.
        # The central gusset follows the pelvis; each cuff follows its thigh.
        clothing_surface_report=apply_coach_clothing_fix(ob,rig)
        solid=ob.modifiers.new('Soft finished garment hem','SOLIDIFY')
        solid.thickness=.003
        solid.offset=0
        bpy.context.view_layer.objects.active=ob
        bpy.ops.object.modifier_apply(modifier=solid.name)
    arm=ob.modifiers.new('Coach • source skinning','ARMATURE')
    arm.object=rig
    arm.use_deform_preserve_volume=False
    ob.parent=rig
    ob['source']='Modified from Snow Rig, Blender Foundation (CC BY 4.0)'
    coach_meshes.append(ob)

hair_style_report=style_coach_hair(
    next(ob for ob in coach_meshes if ob.name=='Coach_Hair'),
    next(ob for ob in coach_meshes if ob.name=='Coach_Face'),rig=rig,material=hair)
ankle_collar_report=refine_coach_ankles(
    next(ob for ob in coach_meshes if ob.name=='Coach_Body'),rig)
hem_overlap_report=relax_coach_hem(
    next(ob for ob in coach_meshes if ob.name=='Coach_Training_Tee'))

# Remove the unused source scene from this derived file. Its original .blend
# stays untouched alongside the source license and checksums.
bpy.data.scenes.remove(source_scene)
for ob in list(bpy.data.objects):
    if ob not in coach_meshes and ob!=rig:
        bpy.data.objects.remove(ob,do_unlink=True)
for collection in list(bpy.data.collections):
    if collection!=coach_collection and collection.users==0: bpy.data.collections.remove(collection)

def three(point): return [round(point.x,7),round(point.z,7),round(-point.y,7)]
web_data={'source':'Snow Rig © Blender Foundation | studio.blender.org',
    'license':'CC BY 4.0','height':1.9,
    'landmarks':{name:three(p) for name,p in landmarks.items()},
    'bones':[{'name':name,'pivot':three(p)} for name,p in bone_pivots.items()],
    'bodyFront':[0,0,1], 'boneCount':len(bone_pivots),
    'notes':'Real Snow mesh and authored weights; face baked to a gentle expression, hair restyled as a short buzzcut. Flare is a teaching reconstruction.'}
(PUBLIC/'coach-rig.json').write_text(json.dumps(web_data,indent=2),encoding='utf-8')

# Export the bind pose. The browser provides standing and Flare poses from
# these measured pivots, so skin and clothing always share the same skeleton.
bpy.ops.object.select_all(action='DESELECT')
outfit_report=style_coach_outfit(coach_meshes)
rig.select_set(True)
for ob in coach_meshes: ob.select_set(True)
bpy.context.view_layer.objects.active=rig
bpy.ops.export_scene.gltf(filepath=str(PUBLIC/'flare-coach.glb'),export_format='GLB',
    use_selection=True,export_animations=False,export_yup=True,
    export_apply=False,export_skins=True,export_all_influences=False,
    export_cameras=False,export_lights=False,export_extras=True)

def set_absolute(name,target,rotation):
    bone=rig.pose.bones[name]
    bone.matrix=Matrix.Translation(target) @ rotation.to_matrix().to_4x4() @ bone.bone.matrix_local.to_quaternion().to_matrix().to_4x4()

I=Quaternion((1,0,0,0))
for name,p in bone_pivots.items(): set_absolute(name,p,I)
for side,sign in (('left',1),('right',-1)):
    shoulder=landmarks[side+'Shoulder']
    q=Quaternion((0,1,0),sign*math.radians(66))
    elbow=shoulder+q@(landmarks[side+'Elbow']-shoulder)
    wrist=elbow+q@(landmarks[side+'Wrist']-landmarks[side+'Elbow'])
    set_absolute(side+'UpperArm',shoulder,q)
    set_absolute(side+'Forearm',elbow,q)
    set_absolute(side+'Hand',wrist,q)
    set_absolute(side+'Scapula',shoulder,I)
    hip=landmarks[side+'Hip']
    leg_q=Quaternion((0,1,0),sign*math.radians(-5))
    knee=hip+leg_q@(landmarks[side+'Knee']-hip)
    ankle=knee+leg_q@(landmarks[side+'Ankle']-landmarks[side+'Knee'])
    set_absolute(side+'Thigh',hip,leg_q)
    set_absolute(side+'Patella',knee,leg_q)
    set_absolute(side+'Shin',knee,leg_q)
    set_absolute(side+'Foot',ankle,leg_q)
scene.view_layers[0].update()

studio=bpy.data.collections.new('STUDIO • cameras and soft lighting')
scene.collection.children.link(studio)

def add_to_studio(ob):
    for col in list(ob.users_collection): col.objects.unlink(ob)
    studio.objects.link(ob)

def aim(ob,point): ob.rotation_euler=(Vector(point)-ob.location).to_track_quat('-Z','Y').to_euler()

def area(name,loc,power,size,color):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size;data.color=color
    ob=bpy.data.objects.new(name,data);studio.objects.link(ob);ob.location=loc;aim(ob,(0,0,1.0));return ob

area('Key • large warm window',(-3,-4,5),480,4.5,(1,.91,.80))
area('Fill • soft daylight',(3,-2,3),190,3.5,(.84,.92,1))
area('Rim • shoulder separation',(1.8,3,4),500,3.0,(.94,1,.91))
world=bpy.data.worlds.new('Warm studio ambient');world.use_nodes=True
background=next(n for n in world.node_tree.nodes if n.type=='BACKGROUND')
background.inputs['Color'].default_value=(.77,.81,.72,1)
background.inputs['Strength'].default_value=.35
scene.world=world
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.008))
floor=bpy.context.object;floor.name='Studio seamless floor';add_to_studio(floor)
floor.data.materials.append(material('Studio • soft warm ivory',0xE9ECE1,.88))

camera_data=bpy.data.cameras.new('Coach • portrait camera')
camera=bpy.data.objects.new('Coach • portrait camera',camera_data);studio.objects.link(camera)
camera.location=(2.7,-5.5,2.30);aim(camera,(0,0,.94))
camera_data.type='ORTHO';camera_data.ortho_scale=2.32;camera_data.lens=68
scene.camera=camera
scene.render.resolution_x=1152;scene.render.resolution_y=1152;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=True
try:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type='OPTIX';prefs.get_devices()
    for device in prefs.devices: device.use=device.type=='OPTIX'
    scene.cycles.device='GPU'
except Exception as err:
    print('GPU fallback: '+str(err));scene.cycles.device='CPU'
try:
    scene.view_settings.view_transform='AgX'
    scene.view_settings.look='AgX - Medium High Contrast'
except Exception: pass
scene.view_settings.exposure=0

notes=bpy.data.texts.new('READ ME • free coach and usage')
notes.write('Flare Friendly Coach\n\nSource: Snow Rig © Blender Foundation | studio.blender.org\nLicense: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/\n\nModified locally: light grey matte cotton tee, plain matte black training shorts, matte warm skin, hazel eyes, simple standing pose, consolidated 20-bone web rig, studio lighting. A short matte buzzcut follows the original scalp surface, replacing the curls and bun. Original surfaces are reused. Shorts widen continuously across the central gusset, with a local pelvis weight transition. Natural palms retain their arch and thickness, with fingers gently opened using original finger joints. A shared palm translation preserves the existing contact offset. Wrist skin blends locally around the original joint; internal shoe skin and ankle weights connect the calf to the shoe collar. All 20 rest joints retain their original names, order and positions. The original production rig remains in assets/blender-studio-source/snow-rig-v4/Snow/snow_v4.2.blend.\n\nWeb GLB is the neutral bind pose; coach-motion.js drives standing and Flare teaching poses. Muscle details are a separate BodyParts3D reference, not anatomically registered to this cartoon character. No purchases or paid services.\n')

scene.render.filepath=str(OUTPUT/'coach-preview.png')
# Make the saved file open on the standing coach in material preview.
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);bpy.context.view_layer.objects.active=rig
for screen in bpy.data.screens:
    for space_area in screen.areas:
        if space_area.type=='VIEW_3D':
            space_area.spaces.active.shading.type='MATERIAL'
            space_area.spaces.active.region_3d.view_distance=3.0
            space_area.spaces.active.region_3d.view_location=(0,0,.95)
bpy.ops.wm.save_as_mainfile(filepath=str(ASSET/'flare-coach.blend'))
bpy.ops.render.render(write_still=True)

camera.location=(.64,-2.6,1.73);aim(camera,(0,-.025,1.63));camera_data.ortho_scale=.66
scene.render.filepath=str(OUTPUT/'coach-portrait.png')
bpy.ops.render.render(write_still=True)

report={'blend':str(ASSET/'flare-coach.blend'),'glb':str(PUBLIC/'flare-coach.glb'),
    'preview':str(OUTPUT/'coach-preview.png'),'portrait':str(OUTPUT/'coach-portrait.png'),
    'bones':len(bone_pivots),'meshes':len(coach_meshes),
    'vertices':sum(len(o.data.vertices) for o in coach_meshes),
    'polygons':sum(len(o.data.polygons) for o in coach_meshes),
    'shoe_skin_mask':body_visibility_report,
    'open_training_hands':hand_surface_report,
    'joint_transitions':joint_surface_report,
    'training_shorts':clothing_surface_report,
    'hair_style':hair_style_report,
    'ankle_collar_refinement':ankle_collar_report,
    'hem_overlap':hem_overlap_report,
    'outfit':outfit_report,
    'cost':0,'source':'Snow, Blender Foundation, CC BY 4.0'}
(OUTPUT/'coach-build.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print('COACH_BUILD='+json.dumps(report))
