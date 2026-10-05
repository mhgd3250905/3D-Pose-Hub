import bpy, json
from pathlib import Path
from mathutils import Vector

root=Path(__file__).resolve().parents[2]
rig=bpy.data.objects['RIG-Snow']
selected={}
for ob in bpy.data.objects:
    if not ob.name.startswith('GEO-'): continue
    selected[ob.name]={'hide_render':ob.hide_render, 'hide_viewport':ob.hide_viewport,
        'hidden':ob.hide_get(), 'collections':[c.name for c in ob.users_collection],
        'modifiers':[{'name':m.name,'type':m.type,'viewport':m.show_viewport,'render':m.show_render,
                      'levels':getattr(m,'levels',None),'render_levels':getattr(m,'render_levels',None),
                      'group':getattr(m,'vertex_group',None)} for m in ob.modifiers],
        'materials':[s.name for s in ob.material_slots],
        'bounds':[[round(min((ob.matrix_world@Vector(v))[i] for v in ob.bound_box),6) for i in range(3)],
                  [round(max((ob.matrix_world@Vector(v))[i] for v in ob.bound_box),6) for i in range(3)]],
        'matrix':[list(row) for row in ob.matrix_world]}
bones={}
for b in rig.pose.bones:
    if (b.name.startswith('DEF-') and any(s in b.name for s in ['Hips','Spine','RibCage','Chest','Neck','Head','Shoulder','UpperArm','Forearm','Wrist','Thigh','Knee','Foot','Toes','Hip_Center'])) or b.name in ['MSTR-Torso','MSTR-Head','MSTR-Mouth']:
        bones[b.name]={'head':list(rig.matrix_world@b.head),'tail':list(rig.matrix_world@b.tail),'parent':b.parent.name if b.parent else None,'rotation':list(b.rotation_euler),'matrix':[list(r) for r in b.matrix]}
info={'frame':bpy.context.scene.frame_current,'objects':selected,'bones':bones,
      'face_controls':[b.name for b in rig.pose.bones if any(s in b.name.lower() for s in ['mouth','smile','corner','eye','jaw']) and not b.name.startswith(('DEF-','MCH-','STR-','ORG-','LTC-'))],
      'materials':[m.name for m in bpy.data.materials],
      'collections':[{'name':c.name,'hide_render':c.hide_render,'hide_viewport':c.hide_viewport} for c in bpy.data.collections]}
out=root/'output'/'blender'/'snow-details.json'
out.write_text(json.dumps(info,indent=2))
print(json.dumps({'frame':info['frame'],'path':str(out),'bones':{n:{k:v for k,v in b.items() if k in ('head','tail')} for n,b in bones.items()},'face_controls':info['face_controls']}))
