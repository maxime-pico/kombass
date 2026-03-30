import type { IUnit, IFlag, UnitConfig } from "../types";

interface ReconnectData {
  playerNumber: 0 | 1;
  isAdmin: boolean;
  boardWidth: number;
  boardLength: number;
  placementZone: number;
  unitsCount: number;
  units: Array<Array<IUnit>>;
  futureUnits?: Record<number, Array<IUnit>>;
  flags: Array<IFlag>;
  terrain?: Array<{ x: number; y: number }>;
  flagStayInPlace?: boolean;
  unitConfig?: UnitConfig;
  round: number;
  step: number;
}

export function buildReconnectionState(data: ReconnectData) {
  const { playerNumber, unitsCount } = data;
  const opponentNumber = (playerNumber === 0 ? 1 : 0) as 0 | 1;

  // Reconstruct futureUnits
  const futureUnits: Array<Array<IUnit>> = [
    Array(unitsCount).fill(null),
    Array(unitsCount).fill(null),
  ];
  if (data.futureUnits?.[playerNumber]) {
    futureUnits[playerNumber] = data.futureUnits[playerNumber];
  }
  if (data.futureUnits?.[opponentNumber]) {
    futureUnits[opponentNumber] = data.futureUnits[opponentNumber];
  }

  // Find first living unit
  const myUnits = data.units?.[playerNumber] || [];
  let firstLivingUnitIndex = 0;
  for (let i = 0; i < unitsCount; i++) {
    if (myUnits[i]?.life > 0) {
      firstLivingUnitIndex = i;
      break;
    }
  }

  return {
    playerIndex: playerNumber,
    isAdmin: data.isAdmin,
    boardWidth: data.boardWidth,
    boardLength: data.boardLength,
    placementZone: data.placementZone,
    unitsCount,
    units: data.units,
    futureUnits,
    flags: data.flags,
    ready: [true, true] as [boolean, boolean],
    terrain: data.terrain || [],
    flagStayInPlace: data.flagStayInPlace ?? false,
    unitConfig: data.unitConfig || undefined,
    round: data.round,
    step: data.futureUnits?.[playerNumber] ? unitsCount : data.step,
    isInRoom: true,
    gameStarted: true,
    selectedUnit: data.futureUnits?.[playerNumber]
      ? { playerNumber: -1, unitNumber: -1 }
      : { playerNumber, unitNumber: firstLivingUnitIndex },
    waitingForMoves: (() => {
      const wfm = [false, false];
      wfm[playerNumber] = data.futureUnits?.[playerNumber] != null;
      wfm[opponentNumber] = data.futureUnits?.[opponentNumber] != null;
      return wfm;
    })(),
    bufferOpponentUnits: Array(unitsCount).fill(null),
    futureUnitsHistory: [] as Array<Array<IUnit>>,
    placedUnits: [
      Array(unitsCount).fill(true),
      Array(unitsCount).fill(true),
    ],
    isSyncing: false,
  };
}

interface RestoredGameState {
  gameState: {
    game: {
      boardWidth: number;
      boardLength: number;
      placementZone: number;
      unitsCount: number;
      terrain?: Array<{ x: number; y: number }>;
      flagStayInPlace?: boolean;
      unitConfig?: UnitConfig;
      round: number;
      roomId?: string;
      step: number;
    };
    players: Array<{
      playerNumber: number;
      units: Array<IUnit>;
      futureUnits: Array<IUnit> | null;
      flag: IFlag;
    }>;
  };
  playerNumber: number;
  isAdmin: boolean;
}

export function buildRestoredState(message: RestoredGameState, currentRoomId: string) {
  const { gameState, playerNumber, isAdmin } = message;
  const { game, players } = gameState;

  const myPlayer = players.find((p) => p.playerNumber === playerNumber)!;
  const opponentPlayer = players.find((p) => p.playerNumber !== playerNumber)!;

  // Reconstruct units array [player0Units, player1Units]
  const units: Array<Array<IUnit>> = [[], []];
  units[playerNumber] = myPlayer.units;
  units[(playerNumber + 1) % 2] = opponentPlayer.units;

  // Reconstruct futureUnits array
  const futureUnits: Array<Array<IUnit>> = [
    Array(game.unitsCount).fill(null),
    Array(game.unitsCount).fill(null),
  ];
  if (myPlayer.futureUnits) {
    futureUnits[playerNumber] = myPlayer.futureUnits;
  }
  if (opponentPlayer.futureUnits) {
    futureUnits[(playerNumber + 1) % 2] = opponentPlayer.futureUnits;
  }

  // Reconstruct flags array
  const flags: Array<IFlag> = [
    { x: 0, y: Math.floor(game.boardLength / 2), originX: 0, originY: Math.floor(game.boardLength / 2), inZone: false },
    { x: game.boardWidth - 1, y: Math.floor(game.boardLength / 2), originX: game.boardWidth - 1, originY: Math.floor(game.boardLength / 2), inZone: false },
  ];
  flags[playerNumber] = myPlayer.flag;
  flags[(playerNumber + 1) % 2] = opponentPlayer.flag;

  // Find first living unit for selectedUnit
  let firstLivingUnitIndex = 0;
  for (let i = 0; i < game.unitsCount; i++) {
    if (myPlayer.units[i]?.life > 0) {
      firstLivingUnitIndex = i;
      break;
    }
  }

  return {
    playerIndex: playerNumber as 0 | 1,
    isAdmin,
    boardWidth: game.boardWidth,
    boardLength: game.boardLength,
    placementZone: game.placementZone,
    unitsCount: game.unitsCount,
    units,
    futureUnits,
    flags,
    ready: [true, true] as [boolean, boolean],
    terrain: game.terrain || [],
    flagStayInPlace: game.flagStayInPlace ?? false,
    unitConfig: game.unitConfig || undefined,
    round: game.round,
    roomId: game.roomId || currentRoomId,
    step: myPlayer.futureUnits !== null ? game.unitsCount : game.step,
    isInRoom: true,
    gameStarted: true,
    selectedUnit: myPlayer.futureUnits !== null
      ? { playerNumber: -1, unitNumber: -1 }
      : { playerNumber, unitNumber: firstLivingUnitIndex },
    waitingForMoves: [
      myPlayer.futureUnits !== null,
      opponentPlayer.futureUnits !== null,
    ],
    bufferOpponentUnits: Array(game.unitsCount).fill(null),
    futureUnitsHistory: [] as Array<Array<IUnit>>,
    placedUnits: [
      Array(game.unitsCount).fill(true),
      Array(game.unitsCount).fill(true),
    ],
    isSyncing: false,
  };
}
