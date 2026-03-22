#!/usr/bin/env python3
"""
Create animated heavy unit SVGs by reorganizing into animation groups.

Both P1 and P2 source SVGs use inkscape:label to identify groups:
  - "smoke" > "smoke alternate 1", "smoke alternate 2"
  - "tank" > "chain" > "inner", "wheels" > "wheels idle"/"wheels alternate", "outer"
  - "cannon" > "cannon idle", "cannon raised"
  - "soldier" > "helmet idle", "helmet alternate"

Output groups (with IDs):
  smoke-1, smoke-2 (alternating smoke frames)
  tank (hull + chain inner/outer, no wheels)
  wheels-idle, wheels-alt (from chain > wheels)
  cannon-idle (cannon raised is removed — only used as reference)
  soldier-body (body rects without helmets)
  helmet-idle, helmet-alt
"""

import re
import xml.etree.ElementTree as ET

INKSCAPE_NS = 'http://www.inkscape.org/namespaces/inkscape'
LABEL = f'{{{INKSCAPE_NS}}}label'
SVG = '{http://www.w3.org/2000/svg}'


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


def find_all_children_by_label(parent, label):
    """Find all direct children with the given inkscape:label."""
    return [child for child in parent if child.get(LABEL) == label]


def strip_inkscape(root):
    """Remove all inkscape/sodipodi attributes and elements from the tree."""
    for elem in list(root.iter()):
        for child in list(elem):
            if child.tag.startswith('{http://sodipodi'):
                elem.remove(child)
        for attr in list(elem.attrib):
            if 'inkscape' in attr or 'sodipodi' in attr or attr == '{http://www.w3.org/XML/1998/namespace}space':
                del elem.attrib[attr]
    for attr in list(root.attrib):
        if 'inkscape' in attr or 'sodipodi' in attr:
            del root.attrib[attr]


def wrap_with_transform(root, elem):
    """If elem has a transform, wrap it in a positioning group so CSS animations
    don't clobber the SVG translate. Returns the appended element."""
    transform = elem.get('transform')
    if transform:
        wrapper = ET.SubElement(root, f'{SVG}g', transform=transform)
        del elem.attrib['transform']
        wrapper.append(elem)
        return wrapper
    else:
        root.append(elem)
        return elem


def process_svg(input_file, output_file, prefix):
    """Process a heavy unit SVG using inkscape:label to identify groups."""
    with open(input_file) as f:
        content = f.read()

    content = namespace_classes(content, prefix)

    ET.register_namespace('', 'http://www.w3.org/2000/svg')
    ET.register_namespace('inkscape', INKSCAPE_NS)
    ET.register_namespace('sodipodi', 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd')

    root = ET.fromstring(content)

    # Collect all top-level children (excluding defs)
    children = []
    for child in list(root):
        if child.tag == f'{SVG}defs':
            continue
        children.append(child)
        root.remove(child)

    for child in children:
        label = child.get(LABEL, '')

        if label == 'smoke':
            smoke_transform = child.get('transform')
            # Extract smoke alternates
            alt1 = find_child_by_label(child, 'smoke alternate 1')
            alt2 = find_child_by_label(child, 'smoke alternate 2')

            if alt1 is not None:
                smoke1 = ET.Element(f'{SVG}g', id='smoke-1')
                if smoke_transform:
                    smoke1.set('transform', smoke_transform)
                for el in list(alt1):
                    smoke1.append(el)
                wrap_with_transform(root, smoke1)

            if alt2 is not None:
                smoke2 = ET.Element(f'{SVG}g', id='smoke-2')
                smoke2.set('style', 'opacity:0')
                if smoke_transform:
                    smoke2.set('transform', smoke_transform)
                for el in list(alt2):
                    smoke2.append(el)
                wrap_with_transform(root, smoke2)

        elif label == 'tank':
            tank_transform = child.get('transform')
            # Find chain group
            chain = find_child_by_label(child, 'chain')

            # Extract wheels from chain before building tank group
            wheels_idle_group = None
            wheels_alt_group = None

            if chain is not None:
                wheels = find_child_by_label(chain, 'wheels')
                if wheels is not None:
                    wheels_idle = find_child_by_label(wheels, 'wheels idle')
                    wheels_alt = find_child_by_label(wheels, 'wheels alternate')

                    wheels_transform = wheels.get('transform')

                    if wheels_idle is not None:
                        wheels_idle_group = ET.Element(f'{SVG}g', id='wheels-idle')
                        # Combine transforms: tank > chain > wheels
                        transforms = [t for t in [tank_transform, chain.get('transform'), wheels_transform] if t]
                        if transforms:
                            wheels_idle_group.set('transform', ' '.join(transforms))
                        for el in list(wheels_idle):
                            wheels_idle_group.append(el)

                    if wheels_alt is not None:
                        wheels_alt_group = ET.Element(f'{SVG}g', id='wheels-alt')
                        wheels_alt_group.set('style', 'opacity:0')
                        transforms = [t for t in [tank_transform, chain.get('transform'), wheels_transform] if t]
                        if transforms:
                            wheels_alt_group.set('transform', ' '.join(transforms))
                        for el in list(wheels_alt):
                            wheels_alt_group.append(el)

                    # Remove wheels from chain so tank group doesn't include them
                    chain.remove(wheels)

            # Build tank group (hull + chain inner/outer, no wheels)
            tank = ET.Element(f'{SVG}g', id='tank')
            if tank_transform:
                tank.set('transform', tank_transform)
            for el in list(child):
                tank.append(el)
            wrap_with_transform(root, tank)

            # Add wheels after tank
            if wheels_idle_group is not None:
                wrap_with_transform(root, wheels_idle_group)
            if wheels_alt_group is not None:
                wrap_with_transform(root, wheels_alt_group)

        elif label == 'cannon':
            cannon_transform = child.get('transform')
            cannon_idle = find_child_by_label(child, 'cannon idle')
            cannon_raised = find_child_by_label(child, 'cannon raised')

            if cannon_idle is not None:
                ci = ET.Element(f'{SVG}g', id='cannon-idle')
                if cannon_transform:
                    ci.set('transform', cannon_transform)
                for el in list(cannon_idle):
                    ci.append(el)
                wrap_with_transform(root, ci)

            # cannon raised is NOT output — only used as reference for CSS animation

        elif label == 'soldier':
            soldier_transform = child.get('transform')
            helmet_idle = find_child_by_label(child, 'helmet idle')
            helmet_alt = find_child_by_label(child, 'helmet alternate')

            # Remove helmets from soldier to create body-only group
            if helmet_idle is not None:
                child.remove(helmet_idle)
            if helmet_alt is not None:
                child.remove(helmet_alt)

            # Soldier body
            body = ET.Element(f'{SVG}g', id='soldier-body')
            if soldier_transform:
                body.set('transform', soldier_transform)
            for el in list(child):
                body.append(el)
            wrap_with_transform(root, body)

            # Helmet idle
            if helmet_idle is not None:
                hi = ET.Element(f'{SVG}g', id='helmet-idle')
                if soldier_transform:
                    hi.set('transform', soldier_transform)
                for el in list(helmet_idle):
                    hi.append(el)
                wrap_with_transform(root, hi)

            # Helmet alternate
            if helmet_alt is not None:
                ha = ET.Element(f'{SVG}g', id='helmet-alt')
                ha.set('style', 'opacity:0')
                if soldier_transform:
                    ha.set('transform', soldier_transform)
                for el in list(helmet_alt):
                    ha.append(el)
                wrap_with_transform(root, ha)

        else:
            # Keep other groups as-is
            root.append(child)

    # Strip all inkscape/sodipodi attributes
    strip_inkscape(root)

    # Write output
    ET.indent(root)
    tree = ET.ElementTree(root)
    tree.write(output_file, xml_declaration=False, encoding='unicode')

    # Count rects per group
    for gid in ('smoke-1', 'smoke-2', 'tank', 'wheels-idle', 'wheels-alt',
                'cannon-idle', 'soldier-body', 'helmet-idle', 'helmet-alt'):
        g = root.find(f".//{SVG}g[@id='{gid}']")
        count = sum(1 for _ in g.iter(f'{SVG}rect')) if g is not None else 0
        print(f"  {gid}: {count} rects")

    print(f"Created {output_file}")


if __name__ == '__main__':
    process_svg('heavy-p1.svg', 'heavy-p1-animated.svg', 'hp1')
    process_svg('heavy-p2.svg', 'heavy-p2-animated.svg', 'hp2')
