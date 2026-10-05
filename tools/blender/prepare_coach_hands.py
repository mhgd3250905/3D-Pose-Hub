"""Gently open the authored Snow fingers without flattening the palm.

Reuse original finger-joint pivots and skin weights to bake a relaxed open
hand into the compact web rig. Each phalanx rotates as a solid piece; the
palm, wrist, thumb pad, mesh topology and finger thickness are retained.
This module never saves the source character or changes the web skeleton.
"""
import math
from mathutils import Vector


def prepare_training_hands(mesh, group_names, source_rig, source_world, landmarks):
    inverse = source_world.inverted()
    original = [vertex.co.copy() for vertex in mesh.vertices]
    report = {}
    transforms = {}
    for side, suffix, sign in (('left', 'L', 1), ('right', 'R', -1)):
        normal = Vector((sign*.0606852567, .0276293809, -.9977744820)).normalized()
        records = []
        for digit in ('Thumb', 'Index', 'Middle', 'Ring', 'Pinky'):
            next_head = None
            for segment in (1, 2, 3):
                name = f'DEF-Finger_{digit}{segment}.{suffix}'
                bone = source_rig.pose.bones.get(name)
                if bone is None:
                    raise ValueError('Missing original Snow finger joint: ' + name)
                head = inverse @ (source_rig.matrix_world @ bone.head)
                tail = inverse @ (source_rig.matrix_world @ bone.tail)
                axis = tail-head
                length = axis.length
                direction = axis.normalized()
                # Keep the original knuckles and natural palm arch. Open the
                # two distal finger joints and lift the originally curled
                # thumb, preserving its sideways spread and pad thickness.
                if digit == 'Thumb' or segment > 1:
                    tangent = direction-normal*direction.dot(normal)
                    tangent.normalize()
                    # A small relaxed bend avoids a rigid ruler-straight hand.
                    curl = math.radians(2 if digit == 'Thumb' else 3)
                    direction = tangent*math.cos(curl)+normal*math.sin(curl)
                target_head = head.copy() if next_head is None else next_head.copy()
                rotation = axis.normalized().rotation_difference(direction)
                transforms[name] = (head, target_head, rotation, side)
                next_head = target_head+direction*length
                records.append({'bone': name, 'rotation_degrees': math.degrees(rotation.angle),
                                'length_m': length})
        report[side] = {'method': 'Original weighted finger joints gently opened; natural palm and wrist retained.',
                        'vertices_adjusted': 0, 'maximum_shift_m': 0.,
                        'phalanges': records, 'palm_projected_to_plane': False}
    for vertex, source in zip(mesh.vertices, original):
        movement = Vector((0., 0., 0.))
        owner = None
        for group in vertex.groups:
            transform = transforms.get(group_names.get(group.group, ''))
            if transform is None or group.weight <= 1e-7:
                continue
            head, target_head, rotation, owner = transform
            target = rotation @ (source-head)+target_head
            movement += (target-source)*group.weight
        if movement.length > 1e-7:
            vertex.co = source+movement
            report[owner]['vertices_adjusted'] += 1
            report[owner]['maximum_shift_m'] = max(report[owner]['maximum_shift_m'], movement.length)
    # Keep the contact offset of previously saved wrist poses. Move the
    # complete natural palm by one shared amount rather than changing its
    # local envelope, scaling its thickness or clamping individual points.
    # Only the short transition at the wrist interpolates that displacement.
    for side, sign in (('left', 1), ('right', -1)):
        wrist = inverse @ Vector(landmarks[side+'Wrist'])
        normal = Vector((sign*.0606852567, .0276293809, -.9977744820)).normalized()
        finger = Vector((sign*.9825314437, -.1778348194, .0548337404)).normalized()
        source_groups = {index for index, name in group_names.items()
                         if name.endswith('.L' if side == 'left' else '.R')
                         and ('Wrist' in name or 'Finger' in name)}
        weights = [sum(group.weight for group in vertex.groups if group.group in source_groups)
                   for vertex in mesh.vertices]
        depth = max((vertex.co-wrist).dot(normal) for vertex, weight in zip(mesh.vertices, weights)
                    if weight > .70)
        translation = max(0., depth-.025)
        moved = 0
        for vertex, weight in zip(mesh.vertices, weights):
            if weight <= .15:
                continue
            along = (vertex.co-wrist).dot(finger)
            fraction = max(0., min(1., (along+.020)/.045))
            fraction = fraction*fraction*(3.-2.*fraction)
            if fraction > 0.:
                vertex.co -= normal*(translation*fraction)
                moved += 1
        report[side].update({'palm_shared_translation_m': translation,
                            'contact_depth_m': .025, 'contact_transition_m': [-.020, .025],
                            'vertices_translated': moved,
                            'palm_shape_and_thickness_preserved': True})
    mesh.update()
    if mesh.has_custom_normals:
        mesh.normals_split_custom_set([(0, 0, 0)]*len(mesh.loops))
    return report
