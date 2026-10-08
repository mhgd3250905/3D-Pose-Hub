"""Local, reversible sculpting of Snow's mature skin for white study mode."""
import bpy, bmesh, math
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

def smooth(value):
    t = max(0.0, min(1.0, value))
    return t*t*(3-2*t)

def neutralize_body(body):
    """Relax only the authored navel and central front groin surface."""
    bm = bmesh.new(); bm.from_mesh(body.data); bm.verts.ensure_lookup_table()
    original = [v.co.copy() for v in bm.verts]
    regions = {'navel': [], 'groin': []}
    for vertex in bm.verts:
        p = vertex.co
        if p.y < -.045:
            navel = math.sqrt((p.x/.060)**2+((p.z-1.03)/.065)**2)
            if navel < 1: regions['navel'].append((vertex.index, 1-smooth(navel)))
        if p.y < .01 and .65 < p.z < .96:
            groin = math.sqrt((p.x/.058)**2+((p.z-.795)/.15)**2)
            if groin < 1: regions['groin'].append((vertex.index, .72*(1-smooth(groin))))
    stats = {}
    for name, entries in regions.items():
        selected = [bm.verts[index] for index, _ in entries]
        start = {v.index: v.co.copy() for v in selected}
        for _ in range(110 if name == 'navel' else 55):
            bmesh.ops.smooth_vert(bm, verts=selected, factor=.6, use_axis_x=False, use_axis_y=True, use_axis_z=False)
        for index, factor in entries:
            bm.verts[index].co = start[index].lerp(bm.verts[index].co, factor)
        stats[name] = {'vertices': len(entries), 'maximum_shift_m': max(((bm.verts[i].co-original[i]).length for i, _ in entries), default=0)}
    # Restore a continuous belly contour rather than leaving a percentage of
    # the source indentation. Fit only the unaffected surrounding mature skin.
    samples=[]
    for vertex in bm.verts:
        x,y,z=vertex.co
        if y < -.055 and abs(x)<.080 and .935<z<1.13 and (abs(x)>.029 or abs(z-1.02)>.05):
            t=z-1.02; samples.append(([1,x*x,t,t*t],y))
    coefficients=np.linalg.lstsq(np.array([s[0] for s in samples]),np.array([s[1] for s in samples]),rcond=None)[0]
    for vertex in bm.verts:
        x,y,z=vertex.co
        radius=math.sqrt((x/.056)**2+((z-1.02)/.064)**2)
        if y<-.045 and radius<1:
            t=z-1.02;target=float(np.dot(coefficients,[1,x*x,t,t*t]))
            factor=1-smooth((radius-.48)/.52)
            vertex.co.y=y+(target-y)*factor
    stats['navel']['maximum_shift_m']=max(((v.co-original[v.index]).length for v in bm.verts if abs(v.co.x)<.06 and .95<v.co.z<1.09),default=0)
    bm.to_mesh(body.data); bm.free(); body.data.update()
    return {'method':'Local Y-only skin relaxation with fixed surrounding skin; no new body primitives, rest bones or hand/foot changes.', 'regions':stats}

def _components(edges):
    pending = set(edges); result = []
    while pending:
        first = pending.pop(); group = [first]; queue = list(first.verts)
        while queue:
            vertex = queue.pop()
            for edge in vertex.link_edges:
                if edge in pending:
                    pending.remove(edge); group.append(edge); queue.extend(edge.verts)
        result.append(group)
    return result

def build_blank_head(body, face, rig, collection):
    """Sculpt a blank mask from Snow's own face + bare head/ear skin.

    Preserve the authored head silhouette and ears, erase the facial relief
    against a curve fitted to the original cheeks/forehead, then locally voxel
    weld the existing complementary skin parts to remove their hair-hidden
    seam. No sphere or replacement head is created.
    """
    face_bm = bmesh.new(); face_bm.from_mesh(face.data)
    samples = []
    for vertex in face_bm.verts:
        x, y, z = vertex.co
        if y < -.075 and ((.063 < abs(x) < .085 and 1.51 < z < 1.705) or (abs(x) < .07 and 1.705 < z < 1.74) or (abs(x) < .075 and 1.475 < z < 1.515)):
            t = z-1.61
            samples.append(([1, x*x, t, t*t, x*x*t], y))
    coefficient = np.linalg.lstsq(np.array([s[0] for s in samples]), np.array([s[1] for s in samples]), rcond=None)[0]
    erased = 0; maximum = 0
    for vertex in face_bm.verts:
        x, y, z = vertex.co
        if y >= -.055 or not 1.47 < z < 1.755 or abs(x) >= .10: continue
        factor = (1-smooth((abs(x)-.076)/.024))*smooth((z-1.47)/.038)*(1-smooth((z-1.715)/.040))
        if factor <= 0: continue
        t = z-1.61
        target = float(np.dot(coefficient, [1, x*x, t, t*t, x*x*t]))
        target = max(-.150, min(-.072, target))
        change = abs((target-y)*factor)
        vertex.co.y = y+(target-y)*factor
        erased += 1; maximum = max(maximum, change)
    # The two eye openings and authored throat termination become closed
    # neutral skin; the outer head/body borders are welded with the actual
    # matching source skin below, not filled with an invented head.
    filled = []
    for group in _components([e for e in face_bm.edges if e.is_boundary]):
        if len(group) == 96:
            bmesh.ops.holes_fill(face_bm, edges=group, sides=0)
            filled.append(len(group))
    face_mesh = bpy.data.meshes.new('Snow neutral face sculpture source')
    face_bm.to_mesh(face_mesh); face_bm.free()

    cap_bm = bmesh.new(); cap_bm.from_mesh(body.data)
    bmesh.ops.bisect_plane(cap_bm, geom=list(cap_bm.verts)+list(cap_bm.edges)+list(cap_bm.faces),
                          plane_co=(0,0,1.44), plane_no=(0,0,1), dist=.000001, clear_inner=True, clear_outer=False)
    cap_mesh = bpy.data.meshes.new('Snow authored bare skull and ears')
    cap_bm.to_mesh(cap_mesh); cap_bm.free()
    neck_points = [v.co.copy() for v in cap_mesh.vertices]+[v.co.copy() for v in face_mesh.vertices]
    neck_faces = [list(p.vertices) for p in cap_mesh.polygons]+[[i+len(cap_mesh.vertices) for i in p.vertices] for p in face_mesh.polygons]
    neck_reference = BVHTree.FromPolygons(neck_points, neck_faces, all_triangles=False)
    head_bm = bmesh.new(); head_bm.from_mesh(cap_mesh); head_bm.from_mesh(face_mesh)
    bmesh.ops.remove_doubles(head_bm, verts=list(head_bm.verts), dist=.0005)
    for group in _components([e for e in head_bm.edges if e.is_boundary]):
        bmesh.ops.holes_fill(head_bm, edges=group, sides=0)
    bmesh.ops.recalc_face_normals(head_bm, faces=list(head_bm.faces))
    data = bpy.data.meshes.new('Coach neutral Snow head skin')
    head_bm.to_mesh(data); head_bm.free()
    head = bpy.data.objects.new('Coach_Study_Head', data)
    collection.objects.link(head)
    bpy.ops.object.select_all(action='DESELECT'); head.select_set(True); bpy.context.view_layer.objects.active=head
    remesh = head.modifiers.new('Weld authored Snow head skin', 'REMESH')
    remesh.mode = 'VOXEL'; remesh.voxel_size = .0032; remesh.use_smooth_shade=True
    bpy.ops.object.modifier_apply(modifier=remesh.name)
    relax = head.modifiers.new('Soften neutral head surface', 'SMOOTH')
    relax.factor=.5; relax.iterations=12
    bpy.ops.object.modifier_apply(modifier=relax.name)
    hm=bmesh.new();hm.from_mesh(head.data)
    forehead=[v for v in hm.verts if 1.65<v.co.z<1.79 and abs(v.co.x)<.105 and v.co.y<-.025]
    for _ in range(30):
        bmesh.ops.smooth_vert(hm,verts=forehead,factor=.65,use_axis_x=True,use_axis_y=True,use_axis_z=True)
    hm.to_mesh(head.data);hm.free()
    for vertex in head.data.vertices:
        if vertex.co.z < 1.525:
            point, _, _, distance = neck_reference.find_nearest(vertex.co)
            if point is not None and distance < .018:
                vertex.co = vertex.co.lerp(point, 1-smooth((vertex.co.z-1.50)/.025))
    # Preserve the exact authored collar bib in the body mesh. Keeping the
    # separate thin patch overlapped under the head causes z fighting; weld
    # its actual boundary into the mature body and let the blank head start
    # on the natural neck instead of on the chin.
    hm=bmesh.new();hm.from_mesh(head.data)
    bmesh.ops.bisect_plane(hm,geom=list(hm.verts)+list(hm.edges)+list(hm.faces),plane_co=(0,0,1.47),plane_no=(0,0,1),dist=.000001,clear_inner=True,clear_outer=False)
    lower=bmesh.new();lower.from_mesh(cap_mesh);lower.from_mesh(face.data)
    bmesh.ops.bisect_plane(lower,geom=list(lower.verts)+list(lower.edges)+list(lower.faces),plane_co=(0,0,1.475),plane_no=(0,0,1),dist=.000001,clear_inner=False,clear_outer=True)
    lower_mesh=bpy.data.meshes.new('Snow exact lower neck and collar bib')
    lower.to_mesh(lower_mesh);lower.free()
    hm.to_mesh(head.data);hm.free()
    decimate=head.modifiers.new('Neutral head mobile surface budget','DECIMATE')
    decimate.decimate_type='COLLAPSE';decimate.ratio=.48;decimate.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=decimate.name)
    for polygon in head.data.polygons: polygon.use_smooth=True
    head.vertex_groups.clear()
    for bone in rig.data.bones: head.vertex_groups.new(name=bone.name)
    head.vertex_groups['head'].add(list(range(len(head.data.vertices))), 1, 'REPLACE')
    armature=head.modifiers.new('Coach • original head bone', 'ARMATURE')
    armature.object=rig; armature.use_deform_preserve_volume=False
    head.parent=rig
    head['source']='Snow Rig © Blender Foundation | studio.blender.org — CC BY 4.0'
    head['study_derivative']='Featureless mannequin sculpture of the same authored Snow bare skull, ears, face and neck. No separate eyes, brows, hair or mouth parts.'
    # White body keeps the natural shoulders, arms and neck, but the source
    # skull/ears now live in the single blank head. The 20 mm neck overlap
    # protects against a visible split while using the original head bone.
    body_bm=bmesh.new(); body_bm.from_mesh(body.data)
    before=len(body_bm.faces)
    bmesh.ops.bisect_plane(body_bm, geom=list(body_bm.verts)+list(body_bm.edges)+list(body_bm.faces),
                          plane_co=(0,0,1.46), plane_no=(0,0,1), dist=.000001, clear_inner=False, clear_outer=True)
    # The cap below 1.46 already belongs to the retained original body;
    # append just the higher section and the unchanged source face bib.
    cap_lower=bmesh.new();cap_lower.from_mesh(cap_mesh)
    bmesh.ops.bisect_plane(cap_lower,geom=list(cap_lower.verts)+list(cap_lower.edges)+list(cap_lower.faces),plane_co=(0,0,1.46),plane_no=(0,0,1),dist=.000001,clear_inner=True,clear_outer=False)
    bmesh.ops.bisect_plane(cap_lower,geom=list(cap_lower.verts)+list(cap_lower.edges)+list(cap_lower.faces),plane_co=(0,0,1.475),plane_no=(0,0,1),dist=.000001,clear_inner=False,clear_outer=True)
    append=bpy.data.meshes.new('Snow neck continuation');cap_lower.to_mesh(append);cap_lower.free()
    body_bm.from_mesh(append)
    bib=bmesh.new();bib.from_mesh(face.data)
    bmesh.ops.bisect_plane(bib,geom=list(bib.verts)+list(bib.edges)+list(bib.faces),plane_co=(0,0,1.475),plane_no=(0,0,1),dist=.000001,clear_inner=False,clear_outer=True)
    bib_mesh=bpy.data.meshes.new('Snow exact collar bib');bib.to_mesh(bib_mesh);bib.free()
    body_bm.from_mesh(bib_mesh)
    bmesh.ops.remove_doubles(body_bm,verts=[v for v in body_bm.verts if v.co.z>1.435],dist=.000005)
    rings=[]
    for group in _components([e for e in body_bm.edges if e.is_boundary]):
        vertices={v for e in group for v in e.verts}
        if vertices and max(v.co.z for v in vertices)<1.43 and len(vertices)>90:
            rings.append(list(vertices))
    if len(rings)!=2: raise ValueError(f'Expected the two original Snow collar seam rings: {[len(r) for r in rings]}.')
    rings.sort(key=len)
    small,large=rings
    center=sum((v.co for v in large),Vector())/len(large)
    angle=lambda v: math.atan2(v.co.y-center.y,v.co.x-center.x)
    small.sort(key=angle);large.sort(key=angle)
    for vertex in small:vertex.co.z-=.0006
    a=b=0;added=0
    while a<len(small) or b<len(large):
        aa=angle(small[(a+1)%len(small)])+(2*math.pi if a+1>=len(small) else 0) if a<len(small) else float('inf')
        bb=angle(large[(b+1)%len(large)])+(2*math.pi if b+1>=len(large) else 0) if b<len(large) else float('inf')
        triangle=(small[a%len(small)],small[(a+1)%len(small)],large[b%len(large)]) if aa<bb else (small[a%len(small)],large[(b+1)%len(large)],large[b%len(large)])
        try:body_bm.faces.new(triangle);added+=1
        except ValueError:pass
        if aa<bb:a+=1
        else:b+=1
    curve=KDTree(len(large))
    for index,vertex in enumerate(large):curve.insert(vertex.co,index)
    curve.balance()
    affected=[];saved={};distance={}
    body_bm.verts.ensure_lookup_table();body_bm.verts.index_update()
    for vertex in body_bm.verts:
        if 1.30<vertex.co.z<1.46 and abs(vertex.co.x)<.19:
            _,_,d=curve.find(vertex.co)
            if d<.024:
                affected.append(vertex);saved[vertex.index]=vertex.co.copy();distance[vertex.index]=d
    for _ in range(30):
        bmesh.ops.smooth_vert(body_bm,verts=affected,factor=.55,use_axis_x=True,use_axis_y=True,use_axis_z=True)
    for vertex in affected:
        vertex.co=saved[vertex.index].lerp(vertex.co,1-smooth(distance[vertex.index]/.024))
    for face in body_bm.faces:face.smooth=True
    bmesh.ops.recalc_face_normals(body_bm,faces=list(body_bm.faces))
    body_bm.to_mesh(body.data); body_bm.free(); body.data.update()
    if body.data.has_custom_normals:body.data.normals_split_custom_set([(0,0,0)]*len(body.data.loops))
    return head, {'method':'Same source face relief fitted to mature cheek/forehead skin; closed original eye/throat openings; existing bare skull/ears voxel welded and gently relaxed.',
                  'source_face_samples':len(samples), 'facial_vertices_sculpted':erased, 'maximum_face_relief_change_m':maximum,
                  'closed_feature_loops':filled, 'voxel_size_m':.0032, 'head_decimate_ratio':.48, 'head_vertices':len(head.data.vertices),
                  'head_faces':len(head.data.polygons), 'body_faces_before_head_split':before, 'body_faces_after_head_split':len(body.data.polygons),
                  'head_bone':'head', 'body_cut_height_m':1.475, 'source_head_cut_height_m':1.44, 'head_start_height_m':1.47,
                  'collar_seam_bridge_triangles':added, 'collar_relaxed_vertices':len(affected), 'separate_feature_objects':0}
