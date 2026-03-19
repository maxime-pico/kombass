import { GamePhase, IUnit, IFlag } from "../../../shared/types";
import { GameState } from "./gameStateMachine";

/**
 * Convert DB game + players into a pure GameState for the state machine.
 */
export function dbToGameState(game: any): GameState {
  const players = (game.players || []).sort((a: any, b: any) => a.playerNumber - b.playerNumber);

  const units: IUnit[][] = [[], []];
  const futureUnits: (IUnit[] | null)[] = [null, null];
  const flags: IFlag[] = [
    { x: 0, y: 10, originX: 0, originY: 10, inZone: true },
    { x: 21, y: 10, originX: 21, originY: 10, inZone: true },
  ];
  const isReady: [boolean, boolean] = [false, false];

  for (const p of players) {
    const pn = p.playerNumber as 0 | 1;
    units[pn] = (p.units as IUnit[]) || [];
    futureUnits[pn] = p.futureUnits as IUnit[] | null;
    if (p.flag && typeof p.flag === "object" && "x" in p.flag) {
      flags[pn] = p.flag as IFlag;
    }
    isReady[pn] = p.isReady ?? false;
  }

  const statusToPhase: Record<string, GamePhase> = {
    LOBBY: GamePhase.LOBBY,
    PLACEMENT: GamePhase.PLACEMENT,
    ACTIVE: GamePhase.ACTIVE,
    COMPLETED: GamePhase.COMPLETED,
    ABANDONED: GamePhase.ABANDONED,
  };

  return {
    phase: statusToPhase[game.status] || GamePhase.LOBBY,
    round: game.currentRound ?? 0,
    units,
    futureUnits,
    flags,
    isReady,
    unitsCount: game.unitsCount ?? 5,
    boardWidth: game.boardWidth ?? 22,
    boardLength: game.boardLength ?? 21,
    placementZone: game.placementZone ?? 5,
    flagStayInPlace: game.flagStayInPlace ?? false,
    winner: null,
  };
}
