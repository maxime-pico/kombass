import { IUnit, IFlag } from "../types";
import type { CombatInput, CombatResult } from "../types";
export type { CombatInput, CombatResult };

/**
 * Check if two units are in combat range, from the attacker's perspective.
 * Light (range=1) uses Euclidean squared: dx² + dy² ≤ 1
 * Medium/Heavy use Manhattan distance: |dx| + |dy| ≤ range
 *
 * When both are Light (range=1), both use Euclidean squared ≤ 2.
 */
export function isInCombatRange(
  attackerX: number,
  attackerY: number,
  attackerStrength: number,
  attackerRange: number,
  defenderX: number,
  defenderY: number,
  defenderStrength: number,
  defenderRange: number
): boolean {
  const dx = Math.abs(attackerX - defenderX);
  const dy = Math.abs(attackerY - defenderY);

  // Light (range=1): Euclidean squared ≤ 2 (hits diagonals)
  if (attackerRange === 1) {
    return dx ** 2 + dy ** 2 <= 2;
  }

  // Attacker is Medium/Heavy: Manhattan distance ≤ range
  return dx + dy <= attackerRange;
}

/**
 * Check if a position is within any flag's protection zone (Manhattan distance ≤ 3).
 */
export function isInFlagZone(x: number, y: number, flags: IFlag[]): boolean {
  return flags.some((flag) => {
    const fx = flag.originX ?? flag.x;
    const fy = flag.originY ?? flag.y;
    return Math.abs(x - fx) + Math.abs(y - fy) <= 3;
  });
}

/**
 * Pure function that calculates combat results.
 * Extracted from App.tsx _calculateCombatResults.
 *
 * Combat rules:
 * - Each unit deals damage equal to its strength to opponents in range
 * - If EITHER combatant is in a flag zone, no damage is dealt in that pair
 * - Damage is accumulated simultaneously (not cascading)
 * - Dead units (life ≤ 0) from previous state are preserved as-is
 * - Flag capture/return is tracked via hasFlag property
 */
export function calculateCombatResults(input: CombatInput): CombatResult {
  const { units, futureUnits, playerIndex, unitsCount, flagStayInPlace } = input;
  let flags = [...input.flags];
  const opponentNumber = ((playerIndex + 1) % 2) as 0 | 1;

  let myFutureUnits = [...futureUnits[playerIndex]];
  let futureOpponentUnits = [...futureUnits[opponentNumber]];

  myFutureUnits.forEach((myUnit, myUnitIdx) => {
    let life = myUnit?.life;
    let strength = myUnit?.strength;
    let damageTaken = 0;
    let x = myUnit?.x;
    let y = myUnit?.y;

    futureOpponentUnits.forEach((opponentUnit, unitIdx) => {
      // Only consider living units at beginning of turn
      if (units[opponentNumber][unitIdx]?.life > 0) {
        let a = opponentUnit?.x;
        let b = opponentUnit?.y;
        let opponentStrength = opponentUnit?.strength;
        let opponentRange = opponentUnit?.range;
        let myRange = myUnit?.range;

        // Check if opponent can hit me (embuscade)
        const canOpponentHitMe = isInCombatRange(a, b, opponentStrength, opponentRange, x, y, strength, myRange);
        // Check if I can hit opponent (embuscadeBack)
        const canIHitOpponent = isInCombatRange(x, y, strength, myRange, a, b, opponentStrength, opponentRange);

        // Check if either unit is in a flag zone (zone stays at origin)
        let inFlagZone = false;
        flags.forEach((flag) => {
          const fx = flag.originX ?? flag.x;
          const fy = flag.originY ?? flag.y;
          inFlagZone =
            inFlagZone ||
            Math.abs(x - fx) + Math.abs(y - fy) <= 3 ||
            Math.abs(a - fx) + Math.abs(b - fy) <= 3;
        });

        // Trace log for pair evaluation (test mode only)
        if (import.meta.env.VITE_TEST_MODE === "true") {
          console.log(
            `[COMBAT] P0U${myUnitIdx}(str=${strength},life=${life}) vs P1U${unitIdx}(str=${opponentStrength},life=${opponentUnit?.life}): canHit=${canIHitOpponent} canBeHit=${canOpponentHitMe} inFlagZone=${inFlagZone}`
          );
        }

        if (!inFlagZone) {
          // Apply damage to opponent
          if (canIHitOpponent) {
            opponentUnit = {
              ...opponentUnit,
              x: a,
              y: b,
              life: opponentUnit?.life - strength,
            };
            futureOpponentUnits[unitIdx] = opponentUnit;
          }
          // Accumulate damage to my unit
          if (canOpponentHitMe) {
            damageTaken = damageTaken + opponentStrength;
          }
        }

        // Trace log final life (test mode only)
        if (import.meta.env.VITE_TEST_MODE === "true") {
          console.log(
            `[COMBAT] P0U${myUnitIdx} final life after opponent U${unitIdx}: ${life - damageTaken}`
          );
        }
      } else {
        opponentUnit = { ...units[opponentNumber][unitIdx] };
        futureOpponentUnits[unitIdx] = opponentUnit;
      }
    });

    myUnit = {
      ...myUnit,
      life: life - damageTaken,
    };
    myFutureUnits[myUnitIdx] = myUnit;
  });

  // Make sure no units end up missing
  units[playerIndex].forEach((myUnit, myUnitIdx) => {
    if (myUnit?.life < 1) myFutureUnits[myUnitIdx] = myUnit;
    if (myUnit === null)
      myFutureUnits[myUnitIdx] = {
        x: -1,
        y: -1,
        life: -1,
        strength: 0,
        range: 0,
        speed: 0,
        hasFlag: false,
        unitType: 0,
      };
  });

  // Build result
  let newFutureUnits: IUnit[][] = [];
  newFutureUnits[playerIndex] = myFutureUnits;
  newFutureUnits[opponentNumber] = futureOpponentUnits;

  // Check how to update flags as a result
  units.forEach((playerUnits, pIdx) => {
    playerUnits.forEach((element, index) => {
      if (!element) return;
      if (element.life < 1) return;  // Skip already-dead units from prior rounds
      let hadFlag = element.hasFlag;
      let opponentFlag = flags[(pIdx + 1) % 2];
      if (hadFlag && newFutureUnits[pIdx][index]?.life < 1) {
        if (flagStayInPlace) {
          // Drop flag at the dead unit's future position
          const deadUnit = newFutureUnits[pIdx][index];
          opponentFlag = { ...flags[(pIdx + 1) % 2], x: deadUnit.x, y: deadUnit.y, inZone: true };
        } else {
          // Return flag to home base (origin)
          const orig = flags[(pIdx + 1) % 2];
          opponentFlag = { ...orig, x: orig.originX ?? orig.x, y: orig.originY ?? orig.y, inZone: true };
        }
        flags[(pIdx + 1) % 2] = opponentFlag;
      } else if (
        !hadFlag &&
        newFutureUnits[pIdx][index]?.hasFlag &&
        newFutureUnits[pIdx][index]?.life > 0
      ) {
        opponentFlag = { ...flags[(pIdx + 1) % 2], inZone: false };
        flags[(pIdx + 1) % 2] = opponentFlag;
      }
    });
  });

  // Find first living unit to start next round
  let firstLivingUnitIndex = 0;
  for (let i = 0; i < unitsCount; i++) {
    if (myFutureUnits[i]?.life > 0) {
      firstLivingUnitIndex = i;
      break;
    }
  }

  return {
    newFutureUnits,
    flags,
    firstLivingUnitIndex,
  };
}
