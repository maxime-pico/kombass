#!/usr/bin/env python3
"""
Create animated medium unit SVGs by reorganizing into animation groups.

Both P1 and P2 source SVGs use inkscape:label to identify groups:
  - "soldier back", "soldier middle", "soldier front" (top-level)
  - "weapon", "left leg", "right leg", "hand center" (nested inside each soldier)

The script extracts weapons and legs from each soldier group so they can be
animated independently via CSS.

Output groups (z-order): soldierback, weapon-back, soldiermiddle, weapon-middle,
  body-front, weapon-front, left-leg, right-leg
"""

import re
import xml.etree.ElementTree as ET

INKSCAPE_NS = 'http://www.inkscape.org/namespaces/inkscape'
LABEL = f'{{{INKSCAPE_NS}}}label'


def namespace_classes(content, prefix):
    """Rename cls-N to {prefix}-cls-N in both style defs and class attributes."""
    content = re.sub(r'\.cls-(\d+)', rf'.{prefix}-cls-\1', content)
    content = re.sub(r'class="cls-(\d+)"', rf'class="{prefix}-cls-\1"', content)
    return content


def find_child_by_label(parent, label):
    """Find a direct child with the given inkscape:label."""
    for child in parent:
        if child.get(LABEL) == label:
            return child
    return None


def strip_inkscape(root):
    """Remove all inkscape/sodipodi attributes and elements from the tree."""
    # Remove sodipodi elements
    SVG = '{http://www.w3.org/2000/svg}'
    for elem in list(root.iter()):
        # Remove sodipodi children
        for child in list(elem):
            if child.tag.startswith('{http://sodipodi'):
                elem.remove(child)
        # Remove inkscape/sodipodi/xml:space attributes
        for attr in list(elem.attrib):
            if 'inkscape' in attr or 'sodipodi' in attr or attr == '{http://www.w3.org/XML/1998/namespace}space':
                del elem.attrib[attr]
    # Remove namespace declarations from root
    for attr in list(root.attrib):
        if 'inkscape' in attr or 'sodipodi' in attr:
            del root.attrib[attr]


def process_svg(input_file, output_file, prefix):
    """Process a medium unit SVG using inkscape:label to identify groups."""
    with open(input_file) as f:
        content = f.read()

    content = namespace_classes(content, prefix)

    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    ET.register_namespace('inkscape', INKSCAPE_NS)
    ET.register_namespace('sodipodi', 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd')

    root = ET.fromstring(content)
    SVG = '{http://www.w3.org/2000/svg}'

    # Collect all top-level children (excluding defs)
    children = []
    for child in list(root):
        if child.tag == f'{SVG}defs':
            continue
        children.append(child)
        root.remove(child)

    left_leg_group = ET.Element(f'{SVG}g', id='left-leg')
    right_leg_group = ET.Element(f'{SVG}g', id='right-leg')

    soldier_config = {
        'soldier back': ('soldierback', 'weapon-back', False),
        'soldier middle': ('soldiermiddle', 'weapon-middle', False),
        'soldier front': ('body-front', 'weapon-front', True),
    }

    for child in children:
        label = child.get(LABEL, '')
        config = soldier_config.get(label)

        if config is None:
            root.append(child)
            continue

        body_id, weapon_id, is_front = config

        # Find and extract labeled children
        weapon = find_child_by_label(child, 'weapon')
        left_leg = find_child_by_label(child, 'left leg')
        right_leg = find_child_by_label(child, 'right leg')
        hand_center = find_child_by_label(child, 'hand center')

        # Remove hand center (not needed in output)
        if hand_center is not None:
            child.remove(hand_center)

        # Remove weapon from parent, copy parent transform
        if weapon is not None:
            child.remove(weapon)
            parent_transform = child.get('transform')
            if parent_transform:
                weapon.set('transform', parent_transform)

        if is_front:
            # Extract legs from front soldier only, preserving parent transform
            parent_transform = child.get('transform')
            if left_leg is not None:
                child.remove(left_leg)
                if parent_transform:
                    left_leg_group.set('transform', parent_transform)
                for el in list(left_leg):
                    left_leg_group.append(el)
            if right_leg is not None:
                child.remove(right_leg)
                if parent_transform:
                    right_leg_group.set('transform', parent_transform)
                for el in list(right_leg):
                    right_leg_group.append(el)
        else:
            # Back/middle: keep legs as part of the body group (no animation)
            pass

        # Set body group ID. If there's a transform, wrap in a positioning
        # group so CSS animations don't clobber the SVG translate.
        child.set('id', body_id)
        parent_transform = child.get('transform')
        if parent_transform:
            wrapper = ET.SubElement(root, f'{SVG}g', transform=parent_transform)
            del child.attrib['transform']
            wrapper.append(child)
        else:
            root.append(child)

        # Append weapon as sibling (same wrapping logic)
        if weapon is not None:
            weapon.set('id', weapon_id)
            weapon_transform = weapon.get('transform')
            if weapon_transform:
                wrapper = ET.SubElement(root, f'{SVG}g', transform=weapon_transform)
                del weapon.attrib['transform']
                wrapper.append(weapon)
            else:
                root.append(weapon)

    # Legs go last — wrap in positioning group if they have a transform
    for leg_group in (left_leg_group, right_leg_group):
        leg_transform = leg_group.get('transform')
        if leg_transform:
            wrapper = ET.SubElement(root, f'{SVG}g', transform=leg_transform)
            del leg_group.attrib['transform']
            wrapper.append(leg_group)
        else:
            root.append(leg_group)

    # Strip all inkscape/sodipodi attributes
    strip_inkscape(root)

    # Write output
    ET.indent(root)
    tree = ET.ElementTree(root)
    tree.write(output_file, xml_declaration=False, encoding='unicode')

    # Count rects per group
    for gid in ('soldierback', 'weapon-back', 'soldiermiddle', 'weapon-middle',
                'body-front', 'weapon-front', 'left-leg', 'right-leg'):
        g = root.find(f".//{SVG}g[@id='{gid}']")
        count = sum(1 for _ in g.iter(f'{SVG}rect')) if g is not None else 0
        print(f"  {gid}: {count} rects")

    print(f"Created {output_file}")


if __name__ == '__main__':
    process_svg('medium-p1.svg', 'medium-p1-animated.svg', 'mp1')
    process_svg('medium-p2.svg', 'medium-p2-animated.svg', 'mp2')
