import React, { useContext, useEffect, useRef } from "react";
import gameContext from "../gameContext";
import socketService from "../services/socketService";
import gameService from "../services/gameService";
import { gamePost } from "../services/api";
import { playPingSound } from "../utilities/sound";
import { IUnit } from "../types";

interface PanelProps {
  round: number;
}

function Panel(props: PanelProps) {
  const {
    animationPhase,
    bufferOpponentUnits,
    playerIndex,
    roomId,
    step,
    futureUnits,
    unitsCount,
    waitingForMoves,
    applyBufferedMoves,
    applyMoves,
    setWaitingForMoves,
    undoMove,
    updateMovesListener,
    updateOpponentUnits,
  } = useContext(gameContext);

  const sendMoves = async () => {
    try {
      const res = await gamePost(roomId, "moves", {
        futureUnits: futureUnits[playerIndex],
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
        setWaitingForMoves(true, playerIndex);
      } else {
        // Second submitter — combat happened, set opponent's futureUnits from response
        updateOpponentUnits(data.futureUnits[(playerIndex + 1) % 2]);
        setWaitingForMoves(true, playerIndex);
        setWaitingForMoves(true, (playerIndex + 1) % 2);
      }
    } catch (error) {
      console.error("Submit moves request failed:", error);
    }
  };

  const waitingRef = useRef(waitingForMoves);
  useEffect(() => { waitingRef.current = waitingForMoves; }, [waitingForMoves]);

  useEffect(() => {
    if (socketService.socket) {
      // Listen for combat_results (when we submitted first and opponent submits second)
      gameService.onCombatResults(
        socketService.socket,
        (data: { futureUnits: Array<Array<IUnit>>; combatResult: any; winner?: number }) => {
          if (waitingRef.current[playerIndex]) playPingSound();
          updateOpponentUnits(data.futureUnits[(playerIndex + 1) % 2]);
          setWaitingForMoves(true, (playerIndex + 1) % 2);
        }
      );

      // Listen for moves_submitted (opponent submitted first, we haven't yet)
      gameService.onMovesSubmitted(socketService.socket, () => {
        // Opponent submitted — no action needed, we still need to submit our own
      });
    }
  }, [updateOpponentUnits, setWaitingForMoves, playerIndex]);

  return (
    <div className="panel">
      {step === unitsCount && waitingForMoves[playerIndex] && (
        <button
          className={`fight-button ${
            animationPhase.isAnimating
              ? "inactive"
              : waitingForMoves[(playerIndex + 1) % 2]
              ? "active"
              : "inactive"
          }`}
          onClick={() => {
            if (step === unitsCount && !animationPhase.isAnimating) {
              applyMoves().then(() => {
                document.removeEventListener(
                  "ready_for_moves",
                  waitingForMoves
                );
                console.log("apply moves with buffer being");
                console.log(bufferOpponentUnits);
                if (
                  bufferOpponentUnits.filter((unit) => unit !== null).length
                ) {
                  setWaitingForMoves(true, (playerIndex + 1) % 2);
                }
              });
            }
          }}
          disabled={!waitingForMoves[(playerIndex + 1) % 2] || animationPhase.isAnimating}
        >
          {animationPhase.isAnimating
            ? "FIGHTING..."
            : waitingForMoves[(playerIndex + 1) % 2]
            ? "FIGHT!"
            : "WAITING FOR OPPONENT TO MOVE THEIR ASS"}
        </button>
      )}
      {step === unitsCount && !waitingForMoves[playerIndex] && (
        <button
          className="fight-button confirm"
          onClick={() => {
            if (step === unitsCount && !animationPhase.isAnimating) {
              sendMoves();
            }
          }}
          disabled={animationPhase.isAnimating}
        >
          CONFIRM MOVES
        </button>
      )}
      {step !== 0 && !waitingForMoves[playerIndex] && (
        <button
          className="undo-button"
          onClick={() => undoMove()}
          disabled={animationPhase.isAnimating}
        >
          Undo
        </button>
      )}
    </div>
  );
}

export default Panel;
