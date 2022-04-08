import React, { useContext, useEffect } from "react";
import gameContext from "../gameContext";
import socketService from "../services/socketService";
import gameService from "../services/gameService";
import { IUnit } from "../App";

function Panel() {
  const {
    isPlayer,
    step,
    futureUnits,
    unitsCount,
    waitingForMoves,
    _applyMoves,
    _setWaitingForMoves,
    _undoMove,
    _updateOpponentUnits,
  } = useContext(gameContext);

  const _sendMoves = () => {
    if (socketService.socket) {
      gameService
        .sendMoves(socketService.socket, futureUnits[isPlayer])
        .then(() => {
          _setWaitingForMoves(true, isPlayer);
        });
    }
  };

  const _updateMoves = () => {
    if (socketService.socket) {
      gameService.onUpdateMoves(
        socketService.socket,
        (opponentUnits: Array<IUnit>) => {
          _updateOpponentUnits(opponentUnits);
          _setWaitingForMoves(true, (isPlayer + 1) % 2);
        }
      );
    }
  };

  useEffect(() => {
    _updateMoves();
  }, []);

  return (
    <div className="panel">
      {step === unitsCount && waitingForMoves[isPlayer] && (
        <button
          className={`fight-button ${
            waitingForMoves[(isPlayer + 1) % 2] ? "active" : "inactive"
          }`}
          onClick={() => {
            if (step === unitsCount) {
              _applyMoves();
            }
          }}
          disabled={!waitingForMoves[(isPlayer + 1) % 2]}
        >
          {waitingForMoves[(isPlayer + 1) % 2]
            ? "FIGHT!"
            : "WAITING FOR OPPONENT TO MOVE THEIR ASS"}
        </button>
      )}
      {step === unitsCount && !waitingForMoves[isPlayer] && (
        <button
          className="fight-button confirm"
          onClick={() => {
            if (step === unitsCount) {
              _sendMoves();
            }
          }}
        >
          CONFIRM MOVES
        </button>
      )}
      {step !== 0 && !waitingForMoves[isPlayer] && (
        <button className="undo-button" onClick={() => _undoMove()}>
          Undo
        </button>
      )}
    </div>
  );
}

export default Panel;
