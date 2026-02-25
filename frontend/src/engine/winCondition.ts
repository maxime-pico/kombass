import { IUnit, IFlag } from "../App";

export interface WinResult {
  gameOver: string;
  winner: number | null;
  loser: number | null;
}

/**
 * Pure function to check win conditions.
 * Extracted from Game.tsx _isGameOver.
 *
 * Win conditions:
 * - Flag capture: a unit with hasFlag=true and life > 0 is within Manhattan distance ≤ 3 of its OWN flag
 * - Unit elimination: all units on one side have life ≤ 0
 */
export function checkWinCondition(
  units: IUnit[][],
  flags: IFlag[],
  unitsCount: number,
  playerNames: [string, string] = ["P1", "P2"]
): WinResult {
  let deadUnits = [0, 0];
  let isFlagInZone = [false, false];

  units.forEach((playerUnits, player_index) => {
    let ownFlag = flags[player_index];
    playerUnits.forEach((unit) => {
      deadUnits[player_index] =
        unit?.life > 0 ? deadUnits[player_index] : deadUnits[player_index] + 1;
      let flagInZone =
        unit?.hasFlag &&
        unit?.life > 0 &&
        Math.abs(unit.x - ownFlag.x) + Math.abs(unit.y - ownFlag.y) <= 3;
      isFlagInZone[player_index] = isFlagInZone[player_index] || flagInZone;
    });
  });

  let gameOver = "";
  let winner: number | null = null;
  let loser: number | null = null;

  if (
    isFlagInZone[0] ||
    isFlagInZone[1] ||
    deadUnits[0] > unitsCount - 1 ||
    deadUnits[1] > unitsCount - 1
  ) {
    if (isFlagInZone[0] && isFlagInZone[1]) {
      gameOver =
        "Good job fuckers, you both did it at the same time, now what?";
    } else {
      if (isFlagInZone[0] || isFlagInZone[1]) {
        winner = isFlagInZone[0] ? 0 : 1;
        loser = Math.abs(1 - winner);
        gameOver = `${playerNames[winner]} won! Suck it ${playerNames[loser]}...`;
      }
    }
    if (
      deadUnits[0] > unitsCount - 1 &&
      deadUnits[1] > unitsCount - 1
    ) {
      gameOver =
        'Oh wow, you guys anihilated each other! Nice! Who\'s going to "save the world" now???';
    } else {
      if (
        deadUnits[0] > unitsCount - 1 ||
        deadUnits[1] > unitsCount - 1
      ) {
        winner = deadUnits[0] ? 1 : 0;
        loser = Math.abs(1 - winner);
        gameOver = `${playerNames[winner]} destroyed ${playerNames[loser]}!! Time for some "democratic elections"`;
      }
    }
  }

  return { gameOver, winner, loser };
}
