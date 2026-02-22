import React from "react";
import { SPRITES } from "../utilities/dict";

interface FlagProps {
  containsFlag: Array<boolean>;
  withPlayer: boolean;
}

function Flag(props: FlagProps) {
  const containsFlag = props.containsFlag;
  const withPlayer = props.withPlayer;
  const flagP1 = containsFlag[0];
  const flagP2 = containsFlag[1];
  const flag = flagP1 ? SPRITES.flag[0] : flagP2 ? SPRITES.flag[1] : false;
  return flag ? (
    <img
      className={`flag-image${withPlayer ? " with-player" : ""} ${
        withPlayer && flagP1 ? " mirror" : ""
      }`}
      src={flag}
      alt="Flag"
    />
  ) : null;
}

export default Flag;
