import React from "react";

interface IntroScreenProps {
  _defineSettings: () => void;
}

interface IntroScreenState {}

export function IntroScreen(props: IntroScreenProps) {
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
            props._defineSettings();
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
