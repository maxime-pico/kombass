import { CombatInput } from "./combatEngine";
import { IAnimationItem, IBoomEvent } from "../App";

/**
 * Pure function that builds the animation queue from combat state.
 * Extracted from App.tsx _buildAnimationQueue.
 *
 * Animation logic:
 * - Filter out dead units (life ≤ 0)
 * - Sort by y ascending, then x ascending
 * - Interleave both players' animations
 */
export function buildAnimationQueue(input: CombatInput): IAnimationItem[] {
  const { units, futureUnits, isPlayer } = input;
  const myUnits = units[isPlayer];
  const myFutureUnits = futureUnits[isPlayer];
  const opponentNumber = (isPlayer + 1) % 2;
  const opponentUnits = units[opponentNumber];
  const opponentFutureUnits = futureUnits[opponentNumber];

  // Build arrays for each player
  const player1Animations: IAnimationItem[] = myUnits
    .map((unit, index) => ({
      player: isPlayer,
      unitIndex: index,
      unit: myFutureUnits[index],
      fromX: unit.x,
      fromY: unit.y,
      toX: myFutureUnits[index]?.x ?? unit.x,
      toY: myFutureUnits[index]?.y ?? unit.y,
    }))
    .filter((item) => item.unit && item.unit.life > 0) // Dead units don't animate
    .sort((a, b) => {
      if (a.fromY !== b.fromY) return a.fromY - b.fromY; // y ascending
      return a.fromX - b.fromX; // then x ascending
    });

  const player2Animations: IAnimationItem[] = opponentUnits
    .map((unit, index) => ({
      player: opponentNumber as 0 | 1,
      unitIndex: index,
      unit: opponentFutureUnits[index],
      fromX: unit.x,
      fromY: unit.y,
      toX: opponentFutureUnits[index]?.x ?? unit.x,
      toY: opponentFutureUnits[index]?.y ?? unit.y,
    }))
    .filter((item) => item.unit && item.unit.life > 0)
    .sort((a, b) => {
      if (a.fromY !== b.fromY) return a.fromY - b.fromY;
      return a.fromX - b.fromX;
    });

  // Interleave arrays: P1[0], P2[0], P1[1], P2[1], ...
  const queue: IAnimationItem[] = [];
  const maxLength = Math.max(player1Animations.length, player2Animations.length);
  for (let i = 0; i < maxLength; i++) {
    if (player1Animations[i]) queue.push(player1Animations[i]);
    if (player2Animations[i]) queue.push(player2Animations[i]);
  }

  return queue;
}

/**
 * Pure function that builds the boom queue from animation queue and combat state.
 * Extracted from App.tsx _buildBoomQueue.
 *
 * Boom logic:
 * - Iterate through all unit pairs that have animations
 * - Check if in combat range (asymmetric: each unit checks its own strength formula)
 * - Check if in flag zone (invincible)
 * - Create booms at both units' final positions
 * - Deduplicate booms at same location (use max trigger index)
 */
export function buildBoomQueue(
  input: CombatInput,
  animationQueue: IAnimationItem[]
): IBoomEvent[] {
  const { futureUnits, flags, isPlayer } = input;
  const myFutureUnits = futureUnits[isPlayer];
  const opponentNumber = (isPlayer + 1) % 2;
  const opponentFutureUnits = futureUnits[opponentNumber];

  // Helper: Find animation index for a unit
  const findAnimationIndex = (player: number, unitIndex: number): number => {
    return animationQueue.findIndex(
      (anim) => anim.player === player && anim.unitIndex === unitIndex
    );
  };

  // Temporary map to collect booms by location
  // Key: "x_y", Value: Array of trigger indices for booms at that location
  const boomsByLocation = new Map<string, Array<number>>();

  // Helper: Add boom to map
  const addBoom = (x: number, y: number, triggerIndex: number) => {
    const key = `${x}_${y}`;
    if (!boomsByLocation.has(key)) {
      boomsByLocation.set(key, []);
    }
    boomsByLocation.get(key)!.push(triggerIndex);
  };

  // ORIGINAL PAIR-BASED LOGIC: Iterate through all unit pairs
  myFutureUnits.forEach((myUnit, my_unit_index) => {
    if (!myUnit || myUnit.life <= 0) return;

    const myAnimIndex = findAnimationIndex(isPlayer, my_unit_index);
    if (myAnimIndex === -1) return;

    opponentFutureUnits.forEach((opponentUnit, opponent_unit_index) => {
      if (!opponentUnit || opponentUnit.life <= 0) return;

      const opponentAnimIndex = findAnimationIndex(
        opponentNumber,
        opponent_unit_index
      );
      if (opponentAnimIndex === -1) return;

      const a = myUnit.x;
      const b = myUnit.y;
      const x = opponentUnit.x;
      const y = opponentUnit.y;

      // Check if in flag zone (invincible)
      let inFlagZone = false;
      flags.forEach((flag) => {
        inFlagZone = inFlagZone || Math.abs(a - flag.x) + Math.abs(b - flag.y) <= 3;
        inFlagZone = inFlagZone || Math.abs(x - flag.x) + Math.abs(y - flag.y) <= 3;
      });

      if (inFlagZone) return;

      // Calculate distance
      const xdistance = Math.abs(a - x);
      const ydistance = Math.abs(b - y);

      // Combat range logic — match isInCombatRange from combatEngine.ts exactly
      // Both Light (range=1): symmetric Euclidean squared ≤ 2
      if (myUnit.range === 1 && opponentUnit.range === 1) {
        const inRange = xdistance ** 2 + ydistance ** 2 <= 2;
        if (inRange) {
          const triggerIndex = Math.max(myAnimIndex, opponentAnimIndex);
          addBoom(a, b, triggerIndex);
          addBoom(x, y, triggerIndex);
        }
        return;
      }

      // Attacker is Light (range=1): Euclidean squared ≤ 1
      // Medium/Heavy: Manhattan distance ≤ range
      const myHitsOpp =
        myUnit.range === 1
          ? xdistance ** 2 + ydistance ** 2 <= 1
          : xdistance + ydistance <= myUnit.range;
      const oppHitsMe =
        opponentUnit.range === 1
          ? xdistance ** 2 + ydistance ** 2 <= 1
          : xdistance + ydistance <= opponentUnit.range;
      const inRange = myHitsOpp || oppHitsMe;

      if (inRange) {
        // Boom trigger index is max of both units' animation indices
        const triggerIndex = Math.max(myAnimIndex, opponentAnimIndex);

        // Add booms at both units' locations
        addBoom(a, b, triggerIndex);
        addBoom(x, y, triggerIndex);
      }
    });
  });

  // DEDUPLICATION: For each location, create single boom with max trigger index
  const boomQueue: IBoomEvent[] = [];
  boomsByLocation.forEach((triggerIndices, locationKey) => {
    const [x, y] = locationKey.split("_").map(Number);
    const maxTriggerIndex = Math.max(...triggerIndices);

    boomQueue.push({
      afterAnimationIndex: maxTriggerIndex,
      x,
      y,
    });
  });

  return boomQueue;
}
