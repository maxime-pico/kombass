import React, { useContext, useEffect } from "react";
import gameContext from "../gameContext";
import socketService from "../services/socketService";
import gameService from "../services/gameService";
import { gamePost } from "../services/api";
import { playPingSound } from "../utilities/sound";
import { IUnit } from "../App";

interface PanelProps {
  round: number;
}

function Panel(props: PanelProps) {
  const {
    animationPhase,
    bufferOpponentUnits,
    isPlayer,
    roomId,
    step,
    futureUnits,
    unitsCount,
    waitingForMoves,
    _applyBufferedMoves,
    _applyMoves,
    _setWaitingForMoves,
    _undoMove,
    _updateMovesListener,
    _updateOpponentUnits,
    _waitingForMoves,
  } = useContext(gameContext);

  const _sendMoves = async () => {
    try {
      const res = await gamePost(roomId, "moves", {
        futureUnits: futureUnits[isPlayer],
        round: props.round,
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Submit moves failed:", data.error);
        return;
      }
      const data = await res.json();

      if (data.waiting) {
        // First submitter — wait for combat_results socket event
        _setWaitingForMoves(true, isPlayer);
      } else {
        // Second submitter — combat happened, set opponent's futureUnits from response
        _updateOpponentUnits(data.futureUnits[(isPlayer + 1) % 2]);
        _setWaitingForMoves(true, isPlayer);
        _setWaitingForMoves(true, (isPlayer + 1) % 2);
      }
    } catch (error) {
      console.error("Submit moves request failed:", error);
    }
  };

  useEffect(() => {
    if (socketService.socket) {
      // Listen for combat_results (when we submitted first and opponent submits second)
      gameService.onCombatResults(
        socketService.socket,
        (data: { futureUnits: Array<Array<IUnit>>; combatResult: any; winner?: number }) => {
          playPingSound();
          _updateOpponentUnits(data.futureUnits[(isPlayer + 1) % 2]);
          _setWaitingForMoves(true, (isPlayer + 1) % 2);
        }
      );

      // Listen for moves_submitted (opponent submitted first, we haven't yet)
      gameService.onMovesSubmitted(socketService.socket, () => {
        // Opponent submitted — no action needed, we still need to submit our own
      });
    }
  }, [_updateOpponentUnits, _setWaitingForMoves, isPlayer]);

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
