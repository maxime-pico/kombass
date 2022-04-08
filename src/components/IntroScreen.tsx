import React, { useContext } from "react";
import gameContext from "../gameContext";

export function IntroScreen() {
  const { _changeStep, step } = useContext(gameContext);
  return (
    <div className="introScreen-container">
      <div className="title">
        {"//"} Kombass {"//"}
      </div>
      <div className="subtitle">Are you sure you want to play?</div>
      <div>
        <button
          className="button active"
          onClick={() => {
            _changeStep(step, 1);
          }}
        >
          {" "}
          PLAY{" "}
        </button>
      </div>
    </div>
  );
}

export default IntroScreen;
