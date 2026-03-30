import React from "react";
import { UNITS } from "../utilities/dict";
import Flag from "./Flag";
import { IUnit } from "../types";
import AnimatedLightUnit from "./AnimatedLightUnit";
import AnimatedMediumUnit from "./AnimatedMediumUnit";
import AnimatedHeavyUnit from "./AnimatedHeavyUnit";

interface UnitProps {
  unit: IUnit | null;
  playerIndex: number | null;
  displayUnitInfo: boolean;
  isGhost: boolean;
  compact?: boolean;
  animationState?: "galloping" | "rearing" | null;
  mediumAnimationState?: "raising" | "marching" | null;
  heavyAnimationState?: "raising" | "marching" | null;
  opacity?: number;
}

function Unit(props: UnitProps) {
  const unit = props.unit || {
    strength: 0,
    speed: 0,
    x: 0,
    y: 0,
    life: 0,
    hasFlag: false,
    unitType: 0,
  };
  let isGhost = props.isGhost ? " ghost" : "";
  const playerIndex = props.playerIndex || 0;
  const hasFlag = unit?.hasFlag;
  const unitSprite = UNITS[unit ? (unit.unitType ?? 0) : 0]?.svg[playerIndex || 0];
  const displayUnitInfo = props.displayUnitInfo ? true : false;
  let containsFlag = [];
  containsFlag[(playerIndex + 1) % 2] = hasFlag;

  const isAnimatedLight = (unit.unitType ?? 0) === 0 && !!props.animationState;
  const isAnimatedMedium = (unit.unitType ?? 0) === 1 && !!props.mediumAnimationState;
  const isAnimatedHeavy = (unit.unitType ?? 0) === 2 && !!props.heavyAnimationState;

  return (
    <div className={`unit${hasFlag ? " has-flag" : ""}${isGhost}${props.opacity !== undefined && props.opacity < 1 ? " dimmed" : ""}`}>
      <div className={`unit-sprite${hasFlag ? " mirror" : ""}`}>
        {isAnimatedLight ? (
          <AnimatedLightUnit
            playerIndex={playerIndex}
            animationState={props.animationState!}
          />
        ) : isAnimatedMedium ? (
          <AnimatedMediumUnit
            playerIndex={playerIndex}
            animationState={props.mediumAnimationState!}
          />
        ) : isAnimatedHeavy ? (
          <AnimatedHeavyUnit
            playerIndex={playerIndex}
            animationState={props.heavyAnimationState!}
          />
        ) : (
          <img src={unitSprite} alt="player unit" />
        )}
      </div>
      {displayUnitInfo ? (
        <div className="unit-info">{props.compact ? `HP:${unit.life}` : `HP:${unit.life} S:${unit.strength}`}</div>
      ) : null}
      {hasFlag ? <Flag containsFlag={containsFlag} withPlayer={true} /> : null}
    </div>
  );
}

export default Unit;
