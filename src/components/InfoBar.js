import React, { Component } from "react";
import { STEP } from "../utilities/dict";

class InfoBar extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const currentPlayer =
      this.props.step < this.props.unitsCount - 1
        ? this.props.players[0]
        : this.props.step < this.props.unitsCount
        ? this.props.players[1]
        : "";
    return (
      <div className="info-container">
        <div>Step: {this.props.step}</div>
        <div>
          {currentPlayer.name} {STEP[this.props.step]}
        </div>
      </div>
    );
  }
}

export default InfoBar;
