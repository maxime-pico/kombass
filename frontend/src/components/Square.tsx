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
  row: number;
  selected: boolean;
  unit: {
    unit: IUnit | null;
    unitNumber: number | null;
    playerNumber: number;
    display: boolean;
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
      const { player, unitIndex, toX, toY } = e.detail;

      // Check if this unit is at the current square (original position)
      if (
        unit?.unit &&
        player === unit.playerNumber &&
        unitIndex === unit.unitNumber
      ) {
        const xTranslate = (toX - col) * 100;
        const yTranslate = (toY - row) * 100;
        const transform = `translate(${xTranslate}%, ${yTranslate}%)`;

        const unitType = unit.unit.unitType ?? 0;

        if (unitType === 0) {
          // Light: rear first, then gallop + slide
          setLightAnimState("rearing");
          setAnimatedUnit({ player, unitIndex, transform: "" });
          setTimeout(() => {
            setLightAnimState("galloping");
            setAnimatedUnit({ player, unitIndex, transform });
            setTimeout(() => {
              setLightAnimState(null);
            }, 800);
          }, 800);
        } else if (unitType === 1) {
          // Medium: raise weapon first, then march + slide
          setMediumAnimState("raising");
          setAnimatedUnit({ player, unitIndex, transform: "" });
          setTimeout(() => {
            setMediumAnimState("marching");
            setAnimatedUnit({ player, unitIndex, transform });
            setTimeout(() => {
              setMediumAnimState(null);
            }, 800);
          }, 800);
        } else if (unitType === 2) {
          // Heavy: raise cannon first, then march + slide
          setHeavyAnimState("raising");
          setAnimatedUnit({ player, unitIndex, transform: "" });
          setTimeout(() => {
            setHeavyAnimState("marching");
            setAnimatedUnit({ player, unitIndex, transform });
            setTimeout(() => {
              setHeavyAnimState(null);
            }, 800);
          }, 800);
        } else {
          setAnimatedUnit({ player, unitIndex, transform });
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
      className="square-container"
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
      >
        <div
          onMouseEnter={() => unit?.unit && unit.unitNumber !== null && props.onUnitHover(unit.playerNumber, unit.unitNumber)}
          onMouseLeave={() => unit?.unit && props.onUnitHoverEnd()}
          className={`square-inside${
            isReachable && !animationPhase.isAnimating ? " reachable" : ""
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
              ? {
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
