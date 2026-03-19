import { UnitConfig } from "./types";

export const UNITS = [
  { name: "light", strength: 1, range: 1, speed: 3, life: 1 },
  { name: "medium", strength: 2, range: 2, speed: 2, life: 2 },
  { name: "heavy", strength: 3, range: 3, speed: 1, life: 3 },
];

export const defaultUnitConfig = (): UnitConfig => ({
  light: {
    strength: UNITS[0].strength,
    range: UNITS[0].range,
    speed: UNITS[0].speed,
    life: UNITS[0].life,
  },
  medium: {
    strength: UNITS[1].strength,
    range: UNITS[1].range,
    speed: UNITS[1].speed,
    life: UNITS[1].life,
  },
  heavy: {
    strength: UNITS[2].strength,
    range: UNITS[2].range,
    speed: UNITS[2].speed,
    life: UNITS[2].life,
  },
});
