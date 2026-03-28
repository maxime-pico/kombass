import React, { useState, useEffect, useContext } from "react";
import Unit from "./Unit";
import Flag from "./Flag";
import { AUDIO } from "../utilities/dict";
import { IUnit } from "../App";
import gameContext, { isCustomEvent } from "../gameContext";

interface SquareProps {
  _changePosition: (
    playerNumber: number,
    unitNumber: number,
    x: number,
    y: number,
  ) => void;
  _changeStep: (step: number, direction: -1 | 1) => void;
  _placeUnit: (unitNumber: number, col: number, row: number) => void;
  _screenShake: () => void;
  boardWidth: number;
  col: number;
  containsFlag: Array<boolean>;
  ghostUnit: {
    unit: IUnit | null;
    unitNumber: number | null;
    playerNumber: number;
    display: boolean;
  };
  containsOpponentGhostUnits: {
    unit: IUnit | null;
    unitNumber: number | null;
    playerNumber: number;
    display: boolean;
  };
  isFlagZone: boolean;
  isForbidden: boolean;
  isTerrain: boolean;
  isInDanger: Array<boolean>;
  dangerClasses: string;
  dangerHighlighted: boolean[];
  isReachable: boolean;
  manhattanOnlyReachable: boolean;
  opponentCanReach: boolean;
  opponentReachBorders: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  } | null;
  opponentReachCorners: {
    tl: boolean;
    tr: boolean;
    bl: boolean;
    br: boolean;
  } | null;
  ownReachBorders: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  } | null;
  hoveredReachBorders: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  } | null;
  onUnitHover: (player: number, index: number) => void;
  onUnitHoverEnd: () => void;
  onSquareHover: (col: number, row: number) => void;
  onSquareHoverEnd: () => void;
  arrowSegment: {
    type: 'start'; to: 'up' | 'down' | 'left' | 'right';
  } | {
    type: 'body'; from: 'up' | 'down' | 'left' | 'right'; to: 'up' | 'down' | 'left' | 'right';
  } | {
    type: 'head'; from: 'up' | 'down' | 'left' | 'right';
  } | null;
  row: number;
  selected: boolean;
  unit: {
    unit: IUnit | null;
    unitNumber: number | null;
    playerNumber: number;
    display: boolean;
    opacity: number;
  };
}

function Square(props: SquareProps) {
  const {
    animationPhase,
    isPlayer,
    players,
    selectedUnit,
    step,
    unitsCount,
    boardLength,
    boardWidth,
  } = useContext(gameContext);
  const [boom, setBoom] = useState(false);
  const [damage, setDamage] = useState<number | null>(null);
  const [animatedUnit, setAnimatedUnit] = useState<{
    player: 0 | 1;
    unitIndex: number;
    transform: string;
    animation?: string;
  } | null>(null);
  const [lightAnimState, setLightAnimState] = useState<
    "rearing" | "galloping" | null
  >(null);
  const [mediumAnimState, setMediumAnimState] = useState<
    "raising" | "marching" | null
  >(null);
  const [heavyAnimState, setHeavyAnimState] = useState<
    "raising" | "marching" | null
  >(null);
  // Extract unit and ghostUnit at the top
  const unit = props.unit;
  const ghostUnit = props.ghostUnit;
  const { _screenShake, col, row, containsOpponentGhostUnits } = props;

  const _clickedSquare = () => {
    if (step !== unitsCount) {
      if (props.isReachable && !props.isForbidden) {
        if (step === -1) {
          props._placeUnit(selectedUnit.unitNumber, col, row);
        } else {
          props._changeStep(step, 1);
          props._changePosition(isPlayer, selectedUnit.unitNumber, col, row);
        }
      }
    }
  };

  // Add animate_unit event listener with proper cleanup
  useEffect(() => {
    const handleAnimateUnit = (e: Event) => {
      if (!isCustomEvent(e)) throw new Error("not a custom event");
      const { player, unitIndex, toX, toY, path } = e.detail;

      // Check if this unit is at the current square (original position)
      if (
        unit?.unit &&
        player === unit.playerNumber &&
        unitIndex === unit.unitNumber
      ) {
        const finalTransform = `translate(${(toX - col) * 100}%, ${(toY - row) * 100}%)`;

        // Build keyframes for path-based animation (or single-step for straight line)
        const pathPoints: Array<{ x: number; y: number }> = path && path.length > 1
          ? path
          : [{ x: col, y: row }, { x: toX, y: toY }];

        const keyframeSteps = pathPoints.map((p: { x: number; y: number }) =>
          `translate(${(p.x - col) * 100}%, ${(p.y - row) * 100}%)`
        );

        // Generate unique keyframe name and inject CSS
        const animName = `path-${player}-${unitIndex}-${Date.now()}`;
        const keyframeCSS = keyframeSteps.map((t, i) => {
          const pct = pathPoints.length <= 1 ? 100 : Math.round((i / (pathPoints.length - 1)) * 100);
          return `${pct}% { transform: ${t}; }`;
        }).join('\n');
        const styleEl = document.createElement('style');
        styleEl.textContent = `@keyframes ${animName} { ${keyframeCSS} }`;
        document.head.appendChild(styleEl);

        const unitType = unit.unit.unitType ?? 0;

        const startSlide = () => {
          setAnimatedUnit({
            player,
            unitIndex,
            transform: finalTransform,
            animation: `${animName} 0.8s linear forwards`,
          });
        };

        const cleanupSlide = () => {
          // Switch from animation to transform so unit stays at final position
          setAnimatedUnit({ player, unitIndex, transform: finalTransform });
          setTimeout(() => styleEl.remove(), 100);
        };

        if (unitType === 0) {
          setLightAnimState("galloping");
          startSlide();
          setTimeout(() => {
            setLightAnimState(null);
            cleanupSlide();
          }, 800);
        } else if (unitType === 1) {
          setMediumAnimState("marching");
          startSlide();
          setTimeout(() => {
            setMediumAnimState(null);
            cleanupSlide();
          }, 800);
        } else if (unitType === 2) {
          setHeavyAnimState("marching");
          startSlide();
          setTimeout(() => {
            setHeavyAnimState(null);
            cleanupSlide();
          }, 800);
        } else {
          setAnimatedUnit({
            player,
            unitIndex,
            transform: finalTransform,
            animation: `${animName} 0.5s ease-in-out forwards`,
          });
          setTimeout(() => {
            cleanupSlide();
          }, 500);
        }
      }
    };

    if (unit?.unit && animationPhase.isAnimating) {
      document.addEventListener("animate_unit", handleAnimateUnit);

      return () => {
        document.removeEventListener("animate_unit", handleAnimateUnit);
      };
    }
  }, [
    unit?.unit,
    unit?.playerNumber,
    unit?.unitNumber,
    animationPhase.isAnimating,
    col,
    row,
    boardWidth,
    boardLength,
  ]);

  // Add embuscade_raise event listener — raise animation before boom
  useEffect(() => {
    type RaiseUnit = { player: number; unitIndex: number; unitType: number; x: number; y: number };
    const handleEmbuscadeRaise = (e: Event) => {
      if (!isCustomEvent(e)) throw new Error("not a custom event");
      const { units } = e.detail as { units: RaiseUnit[] };

      // For animated units (moved to boom location): match by player+unitIndex on origin square
      if (animatedUnit) {
        const match = units.find((u: RaiseUnit) => u.player === animatedUnit.player && u.unitIndex === animatedUnit.unitIndex);
        if (match) {
          if (match.unitType === 0) setLightAnimState("rearing");
          else if (match.unitType === 1) setMediumAnimState("raising");
          else if (match.unitType === 2) setHeavyAnimState("raising");
          return;
        }
      }
      // For ghost/stationary units: match by position
      const atThisSquare = units.filter((u: RaiseUnit) => u.x === col && u.y === row);
      if (atThisSquare.length > 0 && (ghostUnit.unit || containsOpponentGhostUnits.unit)) {
        const gUnit = ghostUnit.unit || containsOpponentGhostUnits.unit;
        const gUnitType = gUnit?.unitType ?? 0;
        if (gUnitType === 0) setLightAnimState("rearing");
        else if (gUnitType === 1) setMediumAnimState("raising");
        else if (gUnitType === 2) setHeavyAnimState("raising");
      }
    };

    if (animationPhase.isAnimating) {
      document.addEventListener("embuscade_raise", handleEmbuscadeRaise);
      return () => {
        document.removeEventListener("embuscade_raise", handleEmbuscadeRaise);
      };
    }
  }, [animationPhase.isAnimating, animatedUnit, ghostUnit.unit, containsOpponentGhostUnits.unit, col, row]);

  // Reset animated unit when animation ends
  useEffect(() => {
    if (!animationPhase.isAnimating && animatedUnit) {
      setAnimatedUnit(null);
      setLightAnimState(null);
      setMediumAnimState(null);
      setHeavyAnimState(null);
    }
  }, [animationPhase.isAnimating, animatedUnit]);

  // Add boom event listener with proper cleanup
  useEffect(() => {
    // Only add listener if this square should respond to boom events
    if (
      (ghostUnit.unit ||
        containsOpponentGhostUnits.unit ||
        animationPhase.isAnimating) &&
      !boom
    ) {
      const handleBoom = (e: Event) => {
        if (!isCustomEvent(e)) throw new Error("not a custom event");
        if (e.detail.x === col && e.detail.y === row) {
          _screenShake();
          const audio = new Audio();
          audio.src = AUDIO.boom;
          audio.play();
          setBoom(true);
          if (e.detail.damage > 0) setDamage(e.detail.damage);
        }
      };

      document.addEventListener("boom", handleBoom);

      return () => {
        document.removeEventListener("boom", handleBoom);
      };
    }
  }, [
    ghostUnit.unit,
    containsOpponentGhostUnits.unit,
    animationPhase.isAnimating,
    boom,
    col,
    row,
    _screenShake,
  ]);

  // Reset boom animation after 1 second
  useEffect(() => {
    if (boom) {
      const timeout = setTimeout(() => {
        setBoom(false);
        setDamage(null);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [boom]);

  const _getArrowClass = (seg: NonNullable<SquareProps['arrowSegment']>): string => {
    if (seg.type === 'start') return `arrow-start-${seg.to}`;
    if (seg.type === 'head') return `arrow-head-${seg.from}`;
    // Body: determine if straight or corner
    const { from, to } = seg;
    if ((from === 'left' && to === 'right') || (from === 'right' && to === 'left')) return 'arrow-body-horizontal';
    if ((from === 'up' && to === 'down') || (from === 'down' && to === 'up')) return 'arrow-body-vertical';
    // Corner: from-to
    return `arrow-corner-${from}-${to}`;
  };

  const containsFlag = props.containsFlag;
  const bgcol = containsFlag[0]
    ? players[0].color
    : containsFlag[1]
      ? players[1].color
      : "";
  const isReachable = props.isReachable;
  const opponentCanReach = props.opponentCanReach;
  const opponentReachBorders = props.opponentReachBorders;
  const opponentReachCorners = props.opponentReachCorners;
  const ownReachBorders = props.ownReachBorders;
  const isForbidden = props.isForbidden;
  const isInDanger = props.isInDanger;
  const isFlagZone = props.isFlagZone;
  return (
    <div
      className={`square-container${unit?.unit || (ghostUnit?.unit && !animationPhase.isAnimating) ? " has-unit" : ""}`}
      style={{ width: `${100 / props.boardWidth}%` }}
      data-testid={`square-${col}-${row}`}
    >
      <div
        className={`square${
          unit.unit || (ghostUnit.unit && !animationPhase.isAnimating)
            ? " active"
            : ""
        }${props.selected && unit.unit ? " selected" : ""}${
          isForbidden && !animationPhase.isAnimating && !props.isTerrain
            ? " forbidden"
            : ""
        }${props.isTerrain ? " terrain" : ""}${bgcol ? " contains-flag" : ""}${isFlagZone ? " flag-zone" : ""}${
          boom ? " boom" : ""
        }`}
        onClick={() => _clickedSquare()}
        onTouchEnd={void 0}
        onMouseEnter={() => props.onSquareHover(col, row)}
        onMouseLeave={() => props.onSquareHoverEnd()}
      >
        <div
          onMouseEnter={() => unit?.unit && unit.unitNumber !== null && props.onUnitHover(unit.playerNumber, unit.unitNumber)}
          onMouseLeave={() => unit?.unit && props.onUnitHoverEnd()}
          className={`square-inside${
            isReachable && !animationPhase.isAnimating ? " reachable" : ""
          }${
            props.manhattanOnlyReachable && !animationPhase.isAnimating ? " manhattan-only-reachable" : ""
          } ${
            opponentCanReach && !animationPhase.isAnimating
              ? " opponent-reach-fill"
              : ""
          }${
            opponentReachBorders &&
            !animationPhase.isAnimating &&
            (opponentReachBorders.top ||
              opponentReachBorders.right ||
              opponentReachBorders.bottom ||
              opponentReachBorders.left)
              ? ` opponent-reach-border${opponentReachBorders.top ? " orb-top" : ""}${opponentReachBorders.right ? " orb-right" : ""}${opponentReachBorders.bottom ? " orb-bottom" : ""}${opponentReachBorders.left ? " orb-left" : ""}`
              : ""
          }${
            ownReachBorders &&
            !animationPhase.isAnimating &&
            (ownReachBorders.top ||
              ownReachBorders.right ||
              ownReachBorders.bottom ||
              ownReachBorders.left)
              ? ` own-reach-border${ownReachBorders.top ? " own-top" : ""}${ownReachBorders.right ? " own-right" : ""}${ownReachBorders.bottom ? " own-bottom" : ""}${ownReachBorders.left ? " own-left" : ""}`
              : ""
          }${
            ownReachBorders && !animationPhase.isAnimating && !isReachable
              ? " own-reach-fill"
              : ""
          }${
            ""
          }`}
          style={{
            ...(animatedUnit
              ? animatedUnit.animation
                ? {
                    animation: animatedUnit.animation,
                  }
                : {
                    transform: animatedUnit.transform,
                    transition: `transform ${lightAnimState || mediumAnimState || heavyAnimState ? "0.8s linear" : "0.5s ease-in-out"}`,
                  }
              : {}),
          }}
        >
          {unit?.unit ? (
            <Unit
              unit={unit.unit}
              playerIndex={unit.playerNumber}
              displayUnitInfo={true}
              compact={true}
              isGhost={false}
              opacity={unit.opacity}
              animationState={animatedUnit ? lightAnimState : null}
              mediumAnimationState={animatedUnit ? mediumAnimState : null}
              heavyAnimationState={animatedUnit ? heavyAnimState : null}
            />
          ) : (
            ""
          )}
          {ghostUnit?.unit ? (
            <Unit
              unit={ghostUnit.unit}
              playerIndex={ghostUnit.playerNumber}
              displayUnitInfo={true}
              compact={true}
              isGhost={false}
            />
          ) : (
            ""
          )}
          {bgcol && !ghostUnit.unit && !unit.unit ? (
            <Flag containsFlag={containsFlag} withPlayer={false} />
          ) : (
            ""
          )}
        </div>
        {props.dangerClasses && (!unit.unit || animationPhase.isAnimating) && isInDanger.map(
          (danger, playerIdx) => danger && (
            <div
              key={playerIdx}
              className={`danger-overlay danger-p${playerIdx} ${props.dangerClasses}${props.dangerHighlighted[playerIdx] ? ' danger-highlighted' : ''}`}
              style={{ "--danger-color": players[playerIdx].color } as React.CSSProperties}
            />
          )
        )}
        {props.hoveredReachBorders && !animationPhase.isAnimating &&
          (props.hoveredReachBorders.top || props.hoveredReachBorders.right || props.hoveredReachBorders.bottom || props.hoveredReachBorders.left) && (
          <div className={`hovered-reach-border${props.hoveredReachBorders.top ? " hrb-top" : ""}${props.hoveredReachBorders.right ? " hrb-right" : ""}${props.hoveredReachBorders.bottom ? " hrb-bottom" : ""}${props.hoveredReachBorders.left ? " hrb-left" : ""}`} />
        )}
        {props.arrowSegment && !animationPhase.isAnimating && (
          <div className={`move-arrow ${_getArrowClass(props.arrowSegment)}`} />
        )}
        {damage ? <div className="floating-damage">-{damage}</div> : null}
        {opponentReachCorners && !animationPhase.isAnimating && (
          <>
            {opponentReachCorners.tl && (
              <div className="orb-corner orb-corner-tl" />
            )}
            {opponentReachCorners.tr && (
              <div className="orb-corner orb-corner-tr" />
            )}
            {opponentReachCorners.bl && (
              <div className="orb-corner orb-corner-bl" />
            )}
            {opponentReachCorners.br && (
              <div className="orb-corner orb-corner-br" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Square;
