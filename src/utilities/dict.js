const STEP = [
  'Move your unit!',
  'Move your unit!',
  'Move your unit!',
  'Move your unit!',
  'Move your unit!',
  'Move your unit!',
  'Move your unit!',
  'Move your unit!',
  'Move your unit!',
  'Move your unit!',
  'Fight!',
]

const UNITS = [
  {
    name: 'light',
    strength: 1,
    speed: 3,
    life: 1,
    svg: ['/sprites/light-p1.svg', '/sprites/light-p2.svg']
  },
  {
    name: 'medium',
    strength: 2,
    speed: 2,
    life: 2,
    svg: ['/sprites/medium-p1.svg', '/sprites/medium-p2.svg']
  },
  {
    name: 'heavy',
    strength: 3,
    speed: 1,
    life: 3,
    svg: ['/sprites/heavy-p1.svg', '/sprites/heavy-p2.svg']
  },
]

const SPRITES = {
  flag: ['/sprites/flag-p1.svg', '/sprites/flag-p2.svg']
}

export {STEP, SPRITES, UNITS}