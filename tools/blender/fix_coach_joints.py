"""Repair Snow-derived wrist and sneaker-collar transitions before clipping.

Build integration (Blender coordinates, metres):
  original_positions = [v.co.copy() for v in mesh.vertices]
  ... prepare_training_hands / construct saved weights and visibility ...
  report = repair_coach_joint_records(mesh, saved, visibility, landmarks,
                                     original_positions=original_positions)

This module never reads/saves an asset or changes a bone. It operates on the
caller's full evaluated body mesh and record arrays, before covered faces are
removed. The source Snow file and the existing 20-bone rig remain untouched.
"""
from mathutils import Vector


def _smooth(value):
    value=max(0.0,min(1.0,value))
    return value*value*(3.0-2.0*value)


def _replace_pair(weights, first, second, first_fraction):
    total=weights.get(first,0.0)+weights.get(second,0.0)
    if total<.50: return False
    weights.pop(first,None);weights.pop(second,None)
    if total*first_fraction>1e-6: weights[first]=total*first_fraction
    if total*(1.0-first_fraction)>1e-6: weights[second]=total*(1.0-first_fraction)
    scale=sum(weights.values())
    for key in list(weights): weights[key]/=scale
    return True


def repair_coach_joint_records(mesh, saved, visibility, landmarks,
        original_positions=None, wrist_forearm_start=-.018,
        wrist_hand_end=.022, ankle_foot_end=-.035, ankle_shin_start=.050,
        ankle_inside_scale=.58, ankle_fit_end=.035,
        restore_wrist_shape=False):
    """Update skin, normalized two-bone weights and collar visibility in place.

    saved: one {deformBoneName: weight} dict per mesh vertex.
    visibility: one bool per vertex; other body/clothing masks are retained.
    landmarks: original Blender-space wrist/elbow/ankle/knee measurements.
    original_positions: optional original skin positions before finger prep.
    Wrist blending is localized around the original joint, not the forearm.
    """
    if len(saved)!=len(mesh.vertices) or len(visibility)!=len(mesh.vertices):
        raise ValueError('Joint repair requires full, unclipped body records.')
    if original_positions is not None and len(original_positions)!=len(mesh.vertices):
        raise ValueError('Original wrist positions no longer match this mesh.')
    report={'units':'Blender metres','vertices':len(mesh.vertices),'sides':{}}
    for side,sign in (('left',1),('right',-1)):
        wrist=Vector(landmarks[side+'Wrist'])
        elbow=Vector(landmarks[side+'Elbow'])
        ankle=Vector(landmarks[side+'Ankle'])
        knee=Vector(landmarks[side+'Knee'])
        forearm_axis=(wrist-elbow).normalized()
        calf_axis=(knee-ankle).normalized()
        palm_axis=Vector((sign*.9825314437,-.1778348194,.0548337404)).normalized()
        hand=side+'Hand'; forearm=side+'Forearm'
        foot=side+'Foot'; shin=side+'Shin'
        stats={'wrist_weights_changed':0,'wrist_vertices_smoothed':0,
            'maximum_wrist_restore':0.0,'ankle_weights_changed':0,
            'source_foot_skin_vertices_restored':0,'source_foot_vertices_fitted':0,
            'maximum_foot_fit':0.0}
        for vertex,weights in zip(mesh.vertices,saved):
            index=vertex.index
            source=Vector(original_positions[index]) if original_positions is not None else vertex.co.copy()
            if weights.get(hand,0.0)+weights.get(forearm,0.0)>.50:
                along=(source-wrist).dot(forearm_axis)
                if wrist_forearm_start-.020<along<.050:
                    fraction=_smooth((along-wrist_forearm_start)/(wrist_hand_end-wrist_forearm_start))
                    if _replace_pair(weights,hand,forearm,fraction): stats['wrist_weights_changed']+=1
                    if restore_wrist_shape and original_positions is not None:
                        palm_along=(source-wrist).dot(palm_axis)
                        if -.060<palm_along<.025:
                            # Preserve the original wrist contour. The hand
                            # prep rotates only fingers, never planes the skin.
                            retain=_smooth((palm_along+.055)/.080)
                            point=source.lerp(vertex.co,retain)
                            movement=(point-vertex.co).length
                            if movement>1e-7:
                                vertex.co=point
                                stats['wrist_vertices_smoothed']+=1
                                stats['maximum_wrist_restore']=max(stats['maximum_wrist_restore'],movement)
            if weights.get(foot,0.0)+weights.get(shin,0.0)>.50:
                height=(source-ankle).dot(calf_axis)
                if height<ankle_shin_start+.010:
                    fraction=1.0-_smooth((height-ankle_foot_end)/(ankle_shin_start-ankle_foot_end))
                    if _replace_pair(weights,foot,shin,fraction): stats['ankle_weights_changed']+=1
                # Keep the genuine closed foot and ankle surface, instead of
                # clipping a disconnected ring above the sneaker collar.
                # The source barefoot extends below the white sole, so fit
                # its covered part *inside* the shoe with a smooth positive
                # contraction around the existing ankle pivot.  The visible
                # shin, shoe mesh, pivot and bone length do not change.
                if height<ankle_fit_end:
                    factor=1.0-(1.0-ankle_inside_scale)*(1.0-_smooth((height+.010)/(ankle_fit_end+.010)))
                    point=ankle+(source-ankle)*factor
                    movement=(point-vertex.co).length
                    if movement>1e-7:
                        vertex.co=point
                        stats['source_foot_vertices_fitted']+=1
                        stats['maximum_foot_fit']=max(stats['maximum_foot_fit'],movement)
                if height<.030 and not visibility[index]:
                    visibility[index]=True
                    stats['source_foot_skin_vertices_restored']+=1
        report['sides'][side]=stats
    mesh.update()
    if mesh.has_custom_normals:
        mesh.normals_split_custom_set([(0,0,0)]*len(mesh.loops))
    report['parameters']={
        'wrist_forearm_start':wrist_forearm_start,'wrist_hand_end':wrist_hand_end,
        'ankle_foot_end':ankle_foot_end,'ankle_shin_start':ankle_shin_start,
        'ankle_inside_scale':ankle_inside_scale,'ankle_fit_end':ankle_fit_end,
        'natural_palm_surface_preserved':True,
    }
    return report
