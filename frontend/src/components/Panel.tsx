import React, { useContext, useEffect } from "react";
import gameContext from "../gameContext";
import socketService from "../services/socketService";
import gameService from "../services/gameService";
import { IUnit } from "../App";

interface PanelProps {
  round: number;
}

function Panel(props: PanelProps) {
  const {
    animationPhase,
    bufferOpponentUnits,
    isPlayer,
    step,
    futureUnits,
    unitsCount,
    waitingForMoves,
    _applyBufferedMoves,
    _applyMoves,
    _setWaitingForMoves,
    _undoMove,
    _updateMovesListener,
    _waitingForMoves,
  } = useContext(gameContext);

  const _sendMoves = () => {
    if (socketService.socket) {
      gameService
        .sendMoves(socketService.socket, futureUnits[isPlayer], props.round)
        .then(() => {
          _setWaitingForMoves(true, isPlayer);
          _applyBufferedMoves();
        });
    }
  };

  const _updateMoves = () => {
    if (socketService.socket) {
      gameService.onUpdateMoves(
        socketService.socket,
        (update: { units: Array<IUnit>; round: number }) => {
          _updateMovesListener(update);
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
            animationPhase.isAnimating
              ? "inactive"
              : waitingForMoves[(isPlayer + 1) % 2]
              ? "active"
              : "inactive"
          }`}
          onClick={() => {
            if (step === unitsCount && !animationPhase.isAnimating) {
              _applyMoves().then(() => {
                document.removeEventListener(
                  "ready_for_moves",
                  _waitingForMoves
                );
                console.log("apply moves with buffer being");
                console.log(bufferOpponentUnits);
                if (
                  bufferOpponentUnits.filter((unit) => unit !== null).length
                ) {
                  _setWaitingForMoves(true, (isPlayer + 1) % 2);
                }
              });
            }
          }}
          disabled={!waitingForMoves[(isPlayer + 1) % 2] || animationPhase.isAnimating}
        >
          {animationPhase.isAnimating
            ? "FIGHTING..."
            : waitingForMoves[(isPlayer + 1) % 2]
            ? "FIGHT!"
            : "WAITING FOR OPPONENT TO MOVE THEIR ASS"}
        </button>
      )}
      {step === unitsCount && !waitingForMoves[isPlayer] && (
        <button
          className="fight-button confirm"
          onClick={() => {
            if (step === unitsCount && !animationPhase.isAnimating) {
              _sendMoves();
            }
          }}
          disabled={animationPhase.isAnimating}
        >
          CONFIRM MOVES
        </button>
      )}
      {step !== 0 && !waitingForMoves[isPlayer] && (
        <button
          className="undo-button"
          onClick={() => _undoMove()}
          disabled={animationPhase.isAnimating}
        >
          Undo
        </button>
      )}
    </div>
  );
}

export default Panel;
