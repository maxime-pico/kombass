import React, { Component } from "react";

class Panel extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="panel">
        {this.props.step === this.props.unitsCount * 2 ? (
          <button
            className="fight-button active"
            onClick={() => {
              if (this.props.step === this.props.unitsCount * 2) {
                this.props._applyMoves();
              }
            }}
          >
            FIGHT!
          </button>
        ) : null}
        {this.props.step !== 0 ? (
          <button
            className="undo-button"
            onClick={() => this.props._undoMove()}
          >
            Undo
          </button>
        ) : null}
      </div>
    );
  }
}

export default Panel;
