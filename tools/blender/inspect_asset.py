import bpy
import json
import sys
from pathlib import Path
from mathutils import Vector

root = Path(__file__).resolve().parents[2]
result = []
for ob in bpy.data.objects:
    item = {'name': ob.name, 'type': ob.type, 'location': list(ob.location), 'collections': [c.name for c in ob.users_collection]}
    if ob.type == 'MESH':
        bounds = [ob.matrix_world @ Vector(p) for p in ob.bound_box]
        item.update(vertices=len(ob.data.vertices), faces=len(ob.data.polygons),
            bounds=[[min(p[i] for p in bounds) for i in range(3)], [max(p[i] for p in bounds) for i in range(3)]],
            materials=[m.name if m else None for m in ob.data.materials],
            modifiers=[{'name': m.name, 'type': m.type} for m in ob.modifiers],
            shape_keys=[k.name for k in ob.data.shape_keys.key_blocks] if ob.data.shape_keys else [],
            groups=[g.name for g in ob.vertex_groups])
    elif ob.type == 'ARMATURE':
        item.update(bones=[b.name for b in ob.data.bones], deform_bones=[b.name for b in ob.data.bones if b.use_deform])
    result.append(item)
out = root / 'output' / 'blender'
out.mkdir(parents=True, exist_ok=True)
name = Path(bpy.data.filepath).stem
(out / (name + '-inventory.json')).write_text(json.dumps(result, indent=2), encoding='utf-8')
print('FLARE_SOURCE_INVENTORY=' + json.dumps({'objects': len(result), 'meshes': len([i for i in result if i['type']=='MESH']), 'armatures': [i['name'] for i in result if i['type']=='ARMATURE'], 'path': str(out / (name + '-inventory.json'))}))
