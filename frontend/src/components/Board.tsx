import React, { useCallback, useContext, useMemo, useRef, useState } from "react";
import Square from "./Square";
import Embuscade from "./Embuscade";
import { IUnit, ISelectedUnit } from "../types";
import gameContext, { dispatchCustomEvent } from "../gameContext";

interface BoardProps {
  placement: boolean;
  _screenShake: () => void;
}

function Board(props: BoardProps) {
  // Placement was false by default
  const {
    _changeStep,
    _changePosition,
    _placeUnit,
    animationPhase,
    boardLength,
    boardWidth,
    flags,
    futureUnits,
    isPlayer,
    placedUnits,
    placementZone,
    ready,
    selectedUnit,
    step,
    terrain,
    units,
    unitsCount,
    waitingForMoves,
  } = useContext(gameContext);

  const terrainSet = new Set(terrain.map((t: { x: number; y: number }) => `${t.x},${t.y}`));
  const isTerrainSquare = (col: number, row: number) => terrainSet.has(`${col},${row}`);

  // BFS flood-fill: returns set of squares reachable via adjacent steps.
  // Uses Manhattan distance from origin as the range constraint (not step count),
  // matching the arrow pathfinding logic — allows detour paths around terrain.
  const _bfsReachableSet = (unit: IUnit, flagToAvoid: any): Set<string> => {
    const reachable = new Set<string>();
    const sx = unit.x, sy = unit.y;
    const queue: [number, number][] = [[sx, sy]];
    const visited = new Set<string>([`${sx},${sy}`]);
    reachable.add(`${sx},${sy}`);
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        const key = `${nx},${ny}`;
        if (visited.has(key)) continue;
        if (nx < 0 || nx >= boardWidth || ny < 0 || ny >= boardLength) continue;
        if (Math.abs(nx - sx) + Math.abs(ny - sy) > unit.speed) continue;
        if (isTerrainSquare(nx, ny)) continue;
        if (flagToAvoid) {
          if (Math.abs(nx - (flagToAvoid.originX ?? flagToAvoid.x)) + Math.abs(ny - (flagToAvoid.originY ?? flagToAvoid.y)) <= 3) continue;
        }
        visited.add(key);
        reachable.add(key);
        queue.push([nx, ny]);
      }
    }
    return reachable;
  };

  const _isReachable = (
    unit: IUnit,
    col: number,
    row: number,
    placement: boolean,
    bfsSet?: Set<string>
  ) => {
    let isReachable = false;
    if (isTerrainSquare(col, row)) return false;
    const ownFlag = flags[isPlayer];
    if (placement) {
      const flagZone = ownFlag
        ? Math.abs(col - (ownFlag.originX ?? ownFlag.x)) + Math.abs(row - (ownFlag.originY ?? ownFlag.y)) <= 3
        : false;
      isReachable = isPlayer
        ? col > boardWidth - placementZone - 1
        : col < placementZone;
      isReachable = isReachable && !flagZone;
    } else {
      if (bfsSet) {
        isReachable = bfsSet.has(`${col},${row}`);
      } else {
        const x = unit ? unit.x : 999;
        const y = unit ? unit.y : 999;
        const speed = unit ? unit.speed : -1;
        const flagZone =
          ownFlag && !unit?.hasFlag
            ? Math.abs(col - (ownFlag.originX ?? ownFlag.x)) + Math.abs(row - (ownFlag.originY ?? ownFlag.y)) <= 3
            : false;
        isReachable = unit
          ? Math.abs(x - col) + Math.abs(y - row) <= speed && !flagZone
          : false;
      }
    }
    return isReachable;
  };

  // Manhattan-reachable but not BFS-reachable (for dimmed visual)
  const _isManhattanOnlyReachable = (
    unit: IUnit,
    col: number,
    row: number,
    bfsSet?: Set<string>
  ) => {
    if (!unit || !bfsSet) return false;
    if (isTerrainSquare(col, row)) return false;
    const ownFlag = flags[isPlayer];
    const flagZone =
      ownFlag && !unit?.hasFlag
        ? Math.abs(col - (ownFlag.originX ?? ownFlag.x)) + Math.abs(row - (ownFlag.originY ?? ownFlag.y)) <= 3
        : false;
    const manhattanReachable = Math.abs(unit.x - col) + Math.abs(unit.y - row) <= unit.speed && !flagZone;
    return manhattanReachable && !bfsSet.has(`${col},${row}`);
  };

  const _opponentCanReach = (
    units: Array<IUnit>,
    col: number,
    row: number,
    placement: boolean
  ) => {
    let opponentCanReach = false;
    let opponentFlag = flags[(isPlayer + 1) % 2];
    if (!placement) {
      units.forEach((unit) => {
        let x = unit ? unit.x : 999;
        let y = unit ? unit.y : 999;
        let speed = unit ? unit.speed : -1;
        let life = unit ? unit.life : -1;
        let opponentFlagZone =
          Math.abs(col - (opponentFlag.originX ?? opponentFlag.x)) + Math.abs(row - (opponentFlag.originY ?? opponentFlag.y)) <= 3;
        opponentCanReach =
          opponentCanReach ||
          (Math.abs(x - col) + Math.abs(y - row) <= speed &&
            !opponentFlagZone &&
            life > 0);
      });
    }
    return opponentCanReach;
  };

  type BorderInfo = { top: boolean; right: boolean; bottom: boolean; left: boolean };

  // Helper: compute perimeter borders from a set of reachable squares
  const _computeReachGrid = (reachable: Set<string>) => {
    const borders = new Map<string, BorderInfo>();
    reachable.forEach((key) => {
      const [c, r] = key.split(",").map(Number);
      borders.set(key, {
        top: !reachable.has(`${c},${r - 1}`),
        right: !reachable.has(`${c + 1},${r}`),
        bottom: !reachable.has(`${c},${r + 1}`),
        left: !reachable.has(`${c - 1},${r}`),
      });
    });
    return { borders };
  };

  // Merge multiple per-unit border maps: OR borders so each unit keeps its own perimeter
  const _mergeReachGrids = (grids: Array<{ borders: Map<string, BorderInfo> }>) => {
    const merged = new Map<string, BorderInfo>();
    for (const grid of grids) {
      grid.borders.forEach((b, key) => {
        const existing = merged.get(key);
        if (existing) {
          merged.set(key, {
            top: existing.top || b.top,
            right: existing.right || b.right,
            bottom: existing.bottom || b.bottom,
            left: existing.left || b.left,
          });
        } else {
          merged.set(key, { ...b });
        }
      });
    }
    return { borders: merged };
  };

  // Hovered unit tracking: { playerNumber, unitIndex }
  const [hoveredUnit, setHoveredUnit] = useState<{ player: number; index: number } | null>(null);
  const onUnitHover = useCallback((player: number, index: number) => {
    setHoveredUnit({ player, index });
    dispatchCustomEvent('unitHover', { player, index });
  }, []);
  const onUnitHoverEnd = useCallback(() => {
    setHoveredUnit(null);
    dispatchCustomEvent('unitHover', null);
  }, []);

  // Hovered square tracking for movement arrow
  const [hoveredSquare, setHoveredSquare] = useState<{ col: number; row: number } | null>(null);
  const onSquareHover = useCallback((col: number, row: number) => setHoveredSquare({ col, row }), []);
  const onSquareHoverEnd = useCallback(() => setHoveredSquare(null), []);

  // Ref to store the current arrow path coordinates for animation
  const arrowPathCoordsRef = useRef<Array<{ x: number; y: number }>>([]);

  // Arrow path types
  type Direction = 'up' | 'down' | 'left' | 'right';
  type ArrowSegment =
    | { type: 'start'; to: Direction }
    | { type: 'body'; from: Direction; to: Direction }
    | { type: 'head'; from: Direction };

  // Compute movement arrow path from selected unit to hovered square
  const arrowPath = useMemo(() => {
    const empty = new Map<string, ArrowSegment>();
    if (step < 0 || step >= unitsCount || !hoveredSquare || props.placement || animationPhase.isAnimating) {
      arrowPathCoordsRef.current = [];
      return empty;
    }

    const unit = units[isPlayer]?.[selectedUnit.unitNumber];
    if (!unit) return empty;

    const sx = unit.x, sy = unit.y;
    const tx = hoveredSquare.col, ty = hoveredSquare.row;

    if (sx === tx && sy === ty) return empty;

    const ownFlag = flags[isPlayer];

    const isBlocked = (nx: number, ny: number): boolean => {
      if (nx < 0 || nx >= boardWidth || ny < 0 || ny >= boardLength) return true;
      if (Math.abs(nx - sx) + Math.abs(ny - sy) > unit.speed) return true;
      if (isTerrainSquare(nx, ny)) return true;
      if (ownFlag && !unit.hasFlag) {
        if (Math.abs(nx - (ownFlag.originX ?? ownFlag.x)) + Math.abs(ny - (ownFlag.originY ?? ownFlag.y)) <= 3) return true;
      }
      return false;
    };

    const isForbiddenSquare = (nx: number, ny: number): boolean => {
      return futureUnits[isPlayer].some((u, idx) =>
        u && idx !== selectedUnit.unitNumber && u.x === nx && u.y === ny
      );
    };

    // BFS shortest Manhattan path
    const startKey = `${sx},${sy}`;
    const targetKey = `${tx},${ty}`;
    const targetReachable = !isBlocked(tx, ty) && !isForbiddenSquare(tx, ty);
    const bfsQueue: [number, number][] = [[sx, sy]];
    const visited = new Set<string>([startKey]);
    const parent = new Map<string, string>();
    let bestTarget = { col: sx, row: sy, dist: Math.abs(sx - tx) + Math.abs(sy - ty) };
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];

    let found = false;
    while (bfsQueue.length > 0) {
      const [cx, cy] = bfsQueue.shift()!;
      const key = `${cx},${cy}`;
      if (key === targetKey && targetReachable) { found = true; break; }

      const distToTarget = Math.abs(cx - tx) + Math.abs(cy - ty);
      if (distToTarget < bestTarget.dist && key !== startKey) {
        bestTarget = { col: cx, row: cy, dist: distToTarget };
      }

      for (const [ddx, ddy] of dirs) {
        const nx = cx + ddx, ny = cy + ddy;
        const nKey = `${nx},${ny}`;
        if (visited.has(nKey)) continue;
        if (isBlocked(nx, ny)) continue;
        if (isForbiddenSquare(nx, ny) && !(nKey === targetKey && targetReachable)) continue;
        visited.add(nKey);
        parent.set(nKey, key);
        bfsQueue.push([nx, ny]);
      }
    }

    // Reconstruct path
    const endKey = found ? targetKey : `${bestTarget.col},${bestTarget.row}`;
    if (endKey === startKey) return empty;

    const path: { col: number; row: number }[] = [];
    let cur = endKey;
    while (cur !== startKey) {
      const [c, r] = cur.split(',').map(Number);
      path.unshift({ col: c, row: r });
      cur = parent.get(cur)!;
    }

    if (path.length === 0) {
      arrowPathCoordsRef.current = [];
      return empty;
    }

    // Store path coordinates (including origin) for animation use
    arrowPathCoordsRef.current = [
      { x: sx, y: sy },
      ...path.map(p => ({ x: p.col, y: p.row })),
    ];

    const dirBetween = (from: { col: number; row: number }, to: { col: number; row: number }): Direction => {
      if (to.col > from.col) return 'right';
      if (to.col < from.col) return 'left';
      if (to.row > from.row) return 'down';
      return 'up';
    };

    const origin = { col: sx, row: sy };
    const segMap = new Map<string, ArrowSegment>();

    // Start segment on unit's square
    segMap.set(`${sx},${sy}`, { type: 'start', to: dirBetween(origin, path[0]) });

    // Body segments
    for (let i = 0; i < path.length - 1; i++) {
      const prev = i === 0 ? origin : path[i - 1];
      const curr = path[i];
      const next = path[i + 1];
      segMap.set(`${curr.col},${curr.row}`, {
        type: 'body',
        from: dirBetween(curr, prev),
        to: dirBetween(curr, next),
      });
    }

    // Head segment
    const last = path[path.length - 1];
    const prevOfLast = path.length >= 2 ? path[path.length - 2] : origin;
    segMap.set(`${last.col},${last.row}`, {
      type: 'head',
      from: dirBetween(last, prevOfLast),
    });

    return segMap;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredSquare, step, unitsCount, units, isPlayer, selectedUnit, flags, boardWidth, boardLength, futureUnits, terrain, props.placement, animationPhase.isAnimating]);

  // Wrap _changePosition to include the current arrow path for animation
  const _changePositionWithPath = useCallback(
    (playerNumber: number, unitNumber: number, x: number, y: number) => {
      _changePosition(playerNumber, unitNumber, x, y, arrowPathCoordsRef.current.length > 0 ? [...arrowPathCoordsRef.current] : undefined);
    },
    [_changePosition]
  );

  // Precompute opponent per-unit grids and merged grid
  const { opponentReachGrid, opponentPerUnitGrids } = useMemo(() => {
    const opponentPlayer = (isPlayer + 1) % 2;
    const opponentUnits = units[opponentPlayer];
    const emptyResult = { opponentReachGrid: { borders: new Map<string, BorderInfo>() }, opponentPerUnitGrids: new Map<number, { borders: Map<string, BorderInfo> }>() };
    if (!opponentUnits || props.placement) return emptyResult;

    const opponentFlag = flags[opponentPlayer];
    const allGrids: Array<{ borders: Map<string, BorderInfo> }> = [];
    const perUnit = new Map<number, { borders: Map<string, BorderInfo> }>();
    opponentUnits.forEach((unit, index) => {
      if (!unit || unit.life <= 0) return;
      const flagToAvoid = opponentFlag;
      const reachable = _bfsReachableSet(unit, flagToAvoid);
      if (reachable.size > 0) {
        const grid = _computeReachGrid(reachable);
        allGrids.push(grid);
        perUnit.set(index, grid);
      }
    });
    return {
      opponentReachGrid: allGrids.length > 0 ? _mergeReachGrids(allGrids) : { borders: new Map<string, BorderInfo>() },
      opponentPerUnitGrids: perUnit,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, isPlayer, boardLength, boardWidth, flags, props.placement]);

  // Precompute own unmoved per-unit grids and merged grid
  const { ownUnmovedReachGrid, ownPerUnitGrids } = useMemo(() => {
    const emptyResult = { ownUnmovedReachGrid: { borders: new Map<string, BorderInfo>() }, ownPerUnitGrids: new Map<number, { borders: Map<string, BorderInfo> }>() };
    const ownUnits = units[isPlayer];
    if (!ownUnits || props.placement || step < 0 || step >= unitsCount) return emptyResult;

    const ownFlag = flags[isPlayer];
    const allGrids: Array<{ borders: Map<string, BorderInfo> }> = [];
    const perUnit = new Map<number, { borders: Map<string, BorderInfo> }>();
    ownUnits.forEach((unit, index) => {
      if (index < step || !unit || unit.life <= 0) return;
      const flagToAvoid = ownFlag && !unit.hasFlag ? ownFlag : null;
      const reachable = _bfsReachableSet(unit, flagToAvoid);
      if (reachable.size > 0) {
        const grid = _computeReachGrid(reachable);
        allGrids.push(grid);
        perUnit.set(index, grid);
      }
    });
    return {
      ownUnmovedReachGrid: allGrids.length > 0 ? _mergeReachGrids(allGrids) : { borders: new Map<string, BorderInfo>() },
      ownPerUnitGrids: perUnit,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, isPlayer, boardLength, boardWidth, flags, props.placement, step, unitsCount, terrain]);

  // Get the hovered unit's individual reach grid
  const hoveredReachGrid = useMemo(() => {
    if (!hoveredUnit) return null;
    const opponentPlayer = (isPlayer + 1) % 2;
    if (hoveredUnit.player === opponentPlayer) {
      return opponentPerUnitGrids.get(hoveredUnit.index) || null;
    }
    if (hoveredUnit.player === isPlayer) {
      return ownPerUnitGrids.get(hoveredUnit.index) || null;
    }
    return null;
  }, [hoveredUnit, isPlayer, opponentPerUnitGrids, ownPerUnitGrids]);

  // BFS reachable set for the currently selected unit (movement phase only)
  const selectedUnitBfsSet = useMemo(() => {
    if (props.placement || step < 0 || step >= unitsCount) return undefined;
    const unit = units[isPlayer]?.[selectedUnit.unitNumber];
    if (!unit || unit.life <= 0) return undefined;
    const ownFlag = flags[isPlayer];
    const flagToAvoid = ownFlag && !unit.hasFlag ? ownFlag : null;
    return _bfsReachableSet(unit, flagToAvoid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, isPlayer, selectedUnit.unitNumber, step, unitsCount, flags, props.placement, boardWidth, boardLength, terrain]);

  // placement was default false
  const _isForbidden = (
    unit: IUnit,
    col: number,
    row: number,
    placement: boolean
  ) => {
    const unitNumber = selectedUnit?.unitNumber;
    const ownFlag = flags[isPlayer];
    let isForbidden = false;

    if (isTerrainSquare(col, row)) return true;

    if (placement) {
      units[isPlayer].forEach((unit, unit_index) => {
        if (placedUnits[isPlayer][unit_index]) {
          isForbidden = isForbidden || (unit.x === col && unit.y === row);
        }
      });
      if (ownFlag && ownFlag.x !== -1) {
        isForbidden =
          isForbidden ||
          Math.abs(col - (ownFlag.originX ?? ownFlag.x)) + Math.abs(row - (ownFlag.originY ?? ownFlag.y)) <= 3;
      }
      isForbidden = isPlayer
        ? isForbidden || col <= boardWidth - placementZone - 1
        : isForbidden || col >= placementZone;
    } else {
      futureUnits[isPlayer].forEach((unit, unit_index) => {
        if (unit && unitNumber !== unit_index) {
          isForbidden = isForbidden || (unit.x === col && unit.y === row);
        }
      });
      if (!units[isPlayer][unitNumber]?.hasFlag) {
        if (ownFlag && ownFlag.x !== -1) {
          isForbidden =
            isForbidden ||
            Math.abs(col - (ownFlag.originX ?? ownFlag.x)) + Math.abs(row - (ownFlag.originY ?? ownFlag.y)) <= 3;
        }
      }
    }
    return isForbidden;
  };

  const _isFlagZone = (col: number, row: number) => {
    let isFlagZone = false;

    flags.forEach((flag) => {
      const fx = flag.originX ?? flag.x;
      const fy = flag.originY ?? flag.y;
      isFlagZone =
        isFlagZone || Math.abs(col - fx) + Math.abs(row - fy) <= 3;
    });

    return isFlagZone;
  };

  // Determines whether current square should display a danger bubble or not
  // the "danger bubble" is the visual indicator showing the damage radius of a unit
  // returns an array of boolean where:
  // first cell determines if it's a player zero unit creating danger
  // second cell determines if it's a player one unit creating danger
  // third cell determines ??? I removed it, I couldn't read the code
  const _unitInRange = (col: number, row: number, unit: IUnit, ux: number, uy: number): boolean => {
    if (unit.range > 1) {
      return Math.abs(col - ux) + Math.abs(row - uy) <= unit.range;
    } else {
      return Math.abs(col - ux) ** 2 + Math.abs(row - uy) ** 2 <= 2;
    }
  };

  const _notInFlagZone = (col: number, row: number): boolean => {
    const flag1 = flags[0];
    const notInReachFlag1 =
      flag1 &&
      flag1.x !== -1 &&
      !(Math.abs(col - (flag1.originX ?? flag1.x)) + Math.abs(row - (flag1.originY ?? flag1.y)) <= 3);
    const flag2 = flags[1];
    const notInReachFlag2 =
      flag2 &&
      flag2.x !== -1 &&
      !(Math.abs(col - (flag2.originX ?? flag2.x)) + Math.abs(row - (flag2.originY ?? flag2.y)) <= 3);
    return !!(notInReachFlag1 && notInReachFlag2);
  };

  const _isInDanger = (col: number, row: number, placement: boolean) => {
    let isInDanger = [false, false];
    const currentUnit = selectedUnit.unitNumber;

    if (placement) return isInDanger;

    if (isTerrainSquare(col, row)) return isInDanger;

    if (!_notInFlagZone(col, row)) return isInDanger;

    // During animation, compute danger from animation queue positions
    if (animationPhase.isAnimating) {
      const { queue, currentAnimationIndex, animationSubPhase, deadUnits } = animationPhase;

      // Build set of all units in the animation queue
      const inQueueSet = new Set(queue.map(a => `${a.player}_${a.unitIndex}`));

      // Already-animated units: danger at their destination
      for (let i = 0; i < currentAnimationIndex; i++) {
        const anim = queue[i];
        if (deadUnits.has(`${anim.player}_${anim.unitIndex}`)) continue;
        if (_unitInRange(col, row, anim.unit, anim.toX, anim.toY)) {
          isInDanger[anim.player] = true;
        }
      }

      // Current unit: depends on sub-phase
      if (currentAnimationIndex < queue.length && animationSubPhase !== 'moving') {
        const current = queue[currentAnimationIndex];
        const [cx, cy] = animationSubPhase === 'pre-move'
          ? [current.fromX, current.fromY]
          : [current.toX, current.toY];
        if (_unitInRange(col, row, current.unit, cx, cy)) {
          isInDanger[current.player] = true;
        }
      }

      // Not-yet-animated units in the queue: use ORIGIN positions (they haven't moved yet)
      for (let i = currentAnimationIndex + 1; i < queue.length; i++) {
        const anim = queue[i];
        if (_unitInRange(col, row, anim.unit, anim.fromX, anim.fromY)) {
          isInDanger[anim.player] = true;
        }
      }

      // Units NOT in the queue at all (didn't move): use units[] pre-round positions
      units.forEach((player, player_index) => {
        player.forEach((unit, unit_index) => {
          if (inQueueSet.has(`${player_index}_${unit_index}`)) return;
          if (!unit || unit.life <= 0) return;
          if (_unitInRange(col, row, unit, unit.x, unit.y)) {
            isInDanger[player_index] = true;
          }
        });
      });

      return isInDanger;
    }

    // Normal (non-animation) logic
    // Future units (already moved by current player)
    futureUnits.forEach((player, player_index) => {
      player.forEach((unit, unit_index) => {
        if (unit && isPlayer === player_index) {
          if (_unitInRange(col, row, unit, unit.x, unit.y)) {
            isInDanger[player_index] = true;
          }
        }
      });
    });

    // Current units
    units.forEach((player, player_index) => {
      player.forEach((unit, unit_index) => {
        if (
          (step === unitsCount && player_index !== isPlayer) ||
          step !== unitsCount
        ) {
          if (
            unit &&
            unit.life > 0 &&
            (player_index !== isPlayer || unit_index >= currentUnit) &&
            ready[player_index]
          ) {
            if (_unitInRange(col, row, unit, unit.x, unit.y)) {
              isInDanger[player_index] = true;
            }
          }
        }
      });
    });

    return isInDanger;
  };

  // Compute CSS classes for danger zone rendering during animation
  const _getDangerClasses = (col: number, row: number, isInDanger: boolean[]): string => {
    if (!isInDanger.some(Boolean)) return '';
    if (!animationPhase.isAnimating) return 'in-danger';

    const classes = ['in-danger'];
    const { queue, currentAnimationIndex, animationSubPhase, boomQueue } = animationPhase;

    if (currentAnimationIndex < queue.length && animationSubPhase !== 'moving') {
      const current = queue[currentAnimationIndex];
      const [cx, cy] = animationSubPhase === 'pre-move'
        ? [current.fromX, current.fromY]
        : [current.toX, current.toY];

      const isCurrentUnitZone = _notInFlagZone(col, row) &&
        _unitInRange(col, row, current.unit, cx, cy);

      if (isCurrentUnitZone && animationSubPhase === 'scanning') {
        classes.push('danger-scanning');
      }
    }

    if (animationSubPhase === 'targeting') {
      const hasBoom = boomQueue.some(
        b => b.afterAnimationIndex === currentAnimationIndex && b.x === col && b.y === row
      );
      if (hasBoom) {
        classes.push('danger-targeting');
      }
    }

    return classes.join(' ');
  };

  // Determines whether a square's danger overlay should be highlighted (brighter)
  // per player. Highlighted when the source unit is selected, hovered, or animated.
  const _isDangerHighlighted = (col: number, row: number): boolean[] => {
    const highlighted = [false, false];
    if (!_notInFlagZone(col, row)) return highlighted;

    // During animation: highlight the currently-animated unit's danger zone
    if (animationPhase.isAnimating) {
      const { queue, currentAnimationIndex, animationSubPhase } = animationPhase;
      if (currentAnimationIndex < queue.length && animationSubPhase !== 'moving') {
        const current = queue[currentAnimationIndex];
        const [cx, cy] = animationSubPhase === 'pre-move'
          ? [current.fromX, current.fromY]
          : [current.toX, current.toY];
        if (_unitInRange(col, row, current.unit, cx, cy)) {
          highlighted[current.player] = true;
        }
      }
      return highlighted;
    }

    // Hovered unit
    if (hoveredUnit) {
      const hPlayer = hoveredUnit.player;
      const hUnits = units[hPlayer];
      if (hUnits && hUnits[hoveredUnit.index]) {
        const hu = hUnits[hoveredUnit.index];
        if (hu.life > 0 && _unitInRange(col, row, hu, hu.x, hu.y)) {
          highlighted[hPlayer] = true;
        }
      }
    }

    // Selected unit (during movement phase)
    if (step >= 0 && step < unitsCount) {
      const selUnit = units[isPlayer]?.[selectedUnit.unitNumber];
      if (selUnit && selUnit.life > 0 && _unitInRange(col, row, selUnit, selUnit.x, selUnit.y)) {
        highlighted[isPlayer] = true;
      }
    }

    return highlighted;
  };

  // Determines whether current square (row, col) contains a unit or not and if so
  // what type it is and if it should be displayed
  const _containsUnits = (
    units: Array<IUnit>,
    col: number,
    row: number,
    player: number,
    placement: boolean,
    ghost: boolean
  ) => {
    // initialise vars
    const currentUnit = selectedUnit.unitNumber;
    let unitContained = null;
    let unitNumber = null;
    let display = false;

    // During animation phase, we need to handle display differently:
    // - Show own units at original positions (from units array)
    // - Hide ghost units while animations play (to avoid duplicates)
    const isAnimatingCombat = animationPhase.isAnimating && step === unitsCount;
    const shouldUseOriginalPositions =
      isAnimatingCombat && player === isPlayer && !ghost;
    const shouldHideGhosts = isAnimatingCombat && ghost;

    // for each unit in the current player array
    units.forEach((unit, index) => {
      let isPlaced = placement ? placedUnits[player][index] : true;

      // only continue if we are considering units that have not been moved or placed yet
      if (placement || ghost || index >= currentUnit || player !== isPlayer) {
        // only continue if the unit we look at is supposed to be in current square
        if (
          unit &&
          unit.x === col &&
          unit.y === row &&
          (unit.life > 0 || ghost) &&
          isPlaced
        ) {
          // in that case, let square know that there is indeed a unit of current player
          unitContained = unit;
          unitNumber = index;

          // Check if unit is dead during animation
          const unitKey = `${player}_${index}`;
          const isDeadDuringAnimation = isAnimatingCombat && animationPhase.deadUnits.has(unitKey);

          // During animation, show own units at original positions and hide ghosts
          if (isDeadDuringAnimation) {
            display = false; // Hide units that died during animation
          } else if (shouldHideGhosts) {
            display = false; // Hide ghost units during animation
          } else if (shouldUseOriginalPositions) {
            display = true; // Show own units at original positions
          } else {
            display =
              ((ghost || !ready[player]) && player !== isPlayer) ||
              (step === unitsCount && !ghost && player === isPlayer) ||
              (waitingForMoves[isPlayer] && !ghost && player === isPlayer)
                ? false // Hide: ghosts of opponent, opponent units if not ready, own units during combat or when waiting for opponent
                : true;
          }
        }
      }
    });

    // Dim non-active own units during movement phase
    const isMovementPhase = !placement && !ghost && player === isPlayer && step < unitsCount;
    const opacity = isMovementPhase && unitNumber !== null && unitNumber !== selectedUnit.unitNumber ? 0.4 : 1;

    return {
      unit: unitContained,
      unitNumber: unitNumber,
      playerNumber: player,
      display: display,
      opacity: opacity,
    };
  };

  const _containsFlag = (col: number, row: number) => {
    const flag1 = flags[0];
    const flag2 = flags[1];
    // Check if any future unit has picked up a dropped flag
    const flagCarried = [false, false];
    for (let p = 0; p < 2; p++) {
      if (futureUnits[p]) {
        for (const u of futureUnits[p]) {
          if (u && u.hasFlag && u.life > 0) {
            flagCarried[(p + 1) % 2] = true;
            break;
          }
        }
      }
    }
    const containsFlag = [];
    containsFlag[0] = flag1.x === col && flag1.y === row && flag1.inZone && !flagCarried[0];
    containsFlag[1] = flag2.x === col && flag2.y === row && flag2.inZone && !flagCarried[1];
    return containsFlag;
  };

  const _isSelected = (
    col: number,
    row: number,
    selectedUnit: ISelectedUnit
  ) => {
    const unit = units[selectedUnit.playerNumber]?.[selectedUnit.unitNumber];
    return unit && unit.x === col && unit.y === row;
  };

  const renderSquare = (col: number, row: number) => {
    const placement = props.placement;
    const unit = units[isPlayer]?.[selectedUnit.unitNumber];
    const containsUnitsPlayer = _containsUnits(
      units[isPlayer],
      col,
      row,
      isPlayer,
      placement,
      false
    );
    const containsUnitsOpponent = _containsUnits(
      units[(isPlayer + 1) % 2],
      col,
      row,
      (isPlayer + 1) % 2,
      placement,
      false
    );
    const containsUnits =
      containsUnitsPlayer.unit && containsUnitsPlayer.display
        ? containsUnitsPlayer
        : containsUnitsOpponent.unit && containsUnitsOpponent.display
        ? containsUnitsOpponent
        : { unit: null, unitNumber: null, playerNumber: -1, display: false, opacity: 1 };
    let containsGhostUnits = {
      unit: null,
      unitNumber: null,
      playerNumber: -1,
      display: false,
    };
    let containsOpponentGhostUnits = {
      unit: null,
      unitNumber: null,
      playerNumber: -1,
      display: false,
    };
    let containsGhostUnitsPlayer = {
      unit: null,
      unitNumber: null,
      playerNumber: -1,
      display: false,
    };
    let containsGhostUnitsOpponent = {
      unit: null,
      unitNumber: null,
      playerNumber: -1,
      display: false,
    };

    if (!placement) {
      containsGhostUnitsPlayer = _containsUnits(
        futureUnits[isPlayer],
        col,
        row,
        isPlayer,
        placement,
        true
      );
      containsGhostUnitsOpponent = _containsUnits(
        futureUnits[(isPlayer + 1) % 2],
        col,
        row,
        (isPlayer + 1) % 2,
        placement,
        true
      );
      containsGhostUnits =
        containsGhostUnitsPlayer.unit && containsGhostUnitsPlayer.display
          ? containsGhostUnitsPlayer
          : {
              unit: null,
              unitNumber: null,
              playerNumber: -1,
              display: false,
            };
      containsOpponentGhostUnits = containsGhostUnitsOpponent || {
        unit: null,
        unitNumber: null,
        playerNumber: -1,
        display: false,
      };
    }

    const containsFlag = _containsFlag(col, row);
    const isReachable = _isReachable(unit, col, row, placement, selectedUnitBfsSet);
    const manhattanOnlyReachable = !placement && _isManhattanOnlyReachable(unit, col, row, selectedUnitBfsSet);
    const key = `${col},${row}`;
    const opponentCanReach = opponentReachGrid.borders.has(key);
    const opponentReachBorders = opponentReachGrid.borders.get(key) || null;
    const opponentReachCorners = null; // corners disabled for now
    const ownReachBorders = ownUnmovedReachGrid.borders.get(key) || null;
    const hoveredReachBorders = hoveredReachGrid?.borders.get(key) || null;
    const isForbidden = _isForbidden(unit, col, row, placement);
    const isInDanger = _isInDanger(col, row, placement);
    const dangerClasses = _getDangerClasses(col, row, isInDanger);
    const dangerHighlighted = _isDangerHighlighted(col, row);
    const isFlagZone = _isFlagZone(col, row);
    return (
      <Square
        _changePosition={_changePositionWithPath}
        _changeStep={_changeStep}
        _placeUnit={_placeUnit}
        _screenShake={props._screenShake}
        boardWidth={boardWidth}
        col={col}
        containsFlag={containsFlag}
        ghostUnit={containsGhostUnits}
        containsOpponentGhostUnits={containsOpponentGhostUnits}
        isFlagZone={isFlagZone}
        isForbidden={isForbidden}
        isTerrain={isTerrainSquare(col, row)}
        isInDanger={isInDanger}
        dangerClasses={dangerClasses}
        dangerHighlighted={dangerHighlighted}
        isReachable={isReachable}
        manhattanOnlyReachable={manhattanOnlyReachable}
        opponentCanReach={opponentCanReach}
        opponentReachBorders={opponentReachBorders}
        opponentReachCorners={opponentReachCorners}
        ownReachBorders={ownReachBorders}
        hoveredReachBorders={hoveredReachBorders}
        onUnitHover={onUnitHover}
        onUnitHoverEnd={onUnitHoverEnd}
        onSquareHover={onSquareHover}
        onSquareHoverEnd={onSquareHoverEnd}
        arrowSegment={arrowPath.get(`${col},${row}`) || null}
        key={`${col} ${row}`}
        row={row}
        selected={_isSelected(col, row, selectedUnit)}
        unit={containsUnits}
      />
    );
  };

  return (
    <div
      className={`board p${isPlayer + 1}`}
      style={{
        pointerEvents: animationPhase.isAnimating ? 'none' : 'auto',
      }}
      onMouseLeave={onSquareHoverEnd}
    >
      <Embuscade />
      {Array(boardLength)
        .fill(Array(boardWidth).fill(null))
        .map((row: any, row_index: number) =>
          row.map((column: any, column_index: number) =>
            renderSquare(column_index, row_index)
          )
        )}
    </div>
  );
}

export default Board;
