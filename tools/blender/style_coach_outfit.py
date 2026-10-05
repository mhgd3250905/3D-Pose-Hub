"""Light grey tee and plain black shorts; materials only, no rig/mesh edits."""
import bpy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output' / 'outfit'


def linear(value):
    return value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4


def cloth_material(mat, name, color, roughness, specular, sheen):
    rgb = tuple(linear(((color >> shift) & 255) / 255) for shift in (16, 8, 0))
    mat.name = name
    mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1)
    bsdf.inputs['Metallic'].default_value = 0
    bsdf.inputs['Roughness'].default_value = roughness
    for socket, value in [('Specular IOR Level', specular), ('Sheen Weight', sheen),
                          ('Sheen Roughness', .9), ('Coat Weight', 0), ('Subsurface Weight', 0)]:
        if socket in bsdf.inputs:
            bsdf.inputs[socket].default_value = value
    # glTF stores sheen in its color factor, without a separate weight. Avoid
    # exporting the default white tint, which would turn black fabric grey.
    if 'Sheen Tint' in bsdf.inputs:
        bsdf.inputs['Sheen Tint'].default_value = (*(channel * sheen for channel in rgb), 1)
    mat.diffuse_color = (*rgb, 1)
    return {'name': name, 'srgb': f'#{color:06x}', 'roughness': roughness,
            'specular': specular, 'sheen': sheen}


def style_coach_outfit(objects):
    objects = {obj.name: obj for obj in objects}
    tee = objects['Coach_Training_Tee']
    shorts = objects['Coach_Training_Shorts']
    # Sleeve trim may also be used by sneaker parts. Give the garment its own
    # material before changing the palette, leaving those other objects intact.
    for obj in (tee, shorts):
        for index, mat in enumerate(obj.data.materials):
            if mat.users > 1:
                obj.data.materials[index] = mat.copy()
    report = {'geometry_modified': False, 'texture_added': False, 'materials': []}
    report['materials'].append(cloth_material(tee.data.materials[0],
        'Coach - light grey matte cotton tee', 0xBFC2C6, .92, .18, .12))
    if len(tee.data.materials) > 1:
        report['materials'].append(cloth_material(tee.data.materials[1],
            'Coach - soft grey sleeve trim', 0x999DA3, .94, .15, .08))
    report['materials'].append(cloth_material(shorts.data.materials[0],
        'Coach - plain black training shorts', 0x101114, .97, .10, .045))
    return report


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rig = bpy.data.objects['Coach_Rig']
    meshes = [obj for obj in bpy.data.objects if obj.type == 'MESH' and obj.name.startswith('Coach_')]
    matrices = {bone.name: bone.matrix.copy() for bone in rig.pose.bones}
    report = style_coach_outfit(meshes)
    for note in bpy.data.texts:
        if note.name.startswith('READ ME'):
            text = note.as_string().replace('midnight tee, moss training shorts,',
                'light grey matte cotton tee, plain matte black training shorts,')
            note.clear()
            note.write(text)
    for bone in rig.pose.bones:
        bone.matrix_basis.identity()
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.export_scene.gltf(filepath=str(ROOT / 'public' / 'coach' / 'flare-coach.glb'),
        export_format='GLB', use_selection=True, export_animations=False, export_yup=True,
        export_apply=False, export_skins=True, export_all_influences=False,
        export_cameras=False, export_lights=False, export_extras=True)
    for bone in rig.pose.bones:
        bone.matrix = matrices[bone.name]
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'assets' / 'coach' / 'flare-coach.blend'))
    (OUT / 'material-change.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('OUTFIT=' + json.dumps(report), flush=True)


if __name__ == '__main__':
    main()
