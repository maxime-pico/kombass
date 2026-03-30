import React, { useContext, useState } from "react";
import gameContext from "../gameContext";

export function IntroScreen() {
  const { createRoom } = useContext(gameContext);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const handleJoin = () => {
    const code = joinCode.trim();
    if (!code) {
      setJoinError("Please enter a room code");
      return;
    }
    window.location.href = "/game/" + code;
  };

  return (
    <div className="introScreen-container">
      <div className="title">
        {"//"} Kombass {"//"}
      </div>
      <div className="subtitle">Are you sure you want to play?</div>
      <div>
        <button className="button active" onClick={() => createRoom()}>
          {" "}
          PLAY{" "}
        </button>
      </div>
      <div className="join-code-section">
        <div className="subtitle" style={{ fontSize: "1em", marginBottom: "0.5rem" }}>
          Or join with a room code:
        </div>
        <div className="join-code-input-row">
          <input
            type="text"
            className="join-code-input"
            placeholder="Enter code"
            value={joinCode}
            onChange={(e) => {
              setJoinCode(e.target.value);
              setJoinError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          />
          <button className="button active join-code-button" onClick={handleJoin}>
            JOIN
          </button>
        </div>
        {joinError && <div className="join-code-error">{joinError}</div>}
      </div>
    </div>
  );
}

export default IntroScreen;
