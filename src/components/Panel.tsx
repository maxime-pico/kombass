import React from "react";

interface PanelProps {
  step: number;
  unitsCount: number;
  _applyMoves: () => void;
  _undoMove: () => void;
}

function Panel(props: PanelProps) {
  return (
    <div className="panel">
      {props.step === props.unitsCount * 2 ? (
        <button
          className="fight-button active"
          onClick={() => {
            if (props.step === props.unitsCount * 2) {
              props._applyMoves();
            }
          }}
        >
          FIGHT!
        </button>
      ) : null}
      {props.step !== 0 ? (
        <button className="undo-button" onClick={() => props._undoMove()}>
          Undo
        </button>
      ) : null}
    </div>
  );
}

export default Panel;
