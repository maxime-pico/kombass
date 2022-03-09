import React, { Component } from "react";

class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div id="settings" className="settings-container">
        <div className="title">
          {"//"} Define Game Rules {"//"}
        </div>
        <br />
        <div className="subtitle">How large should the board be?</div>
        <div>
          Length:
          <input
            type="number"
            id="boardWidth"
            name="boardWidth"
            min="20"
            value={this.props.boardWidth}
            onChange={(e) =>
              this.props._setBoardSize(
                this.props.boardLength,
                parseInt(e.target.value)
              )
            }
          />
          Width
          <input
            type="number"
            id="boardLength"
            name="boardLength"
            min="20"
            value={this.props.boardLength}
            onChange={(e) =>
              this.props._setBoardSize(
                parseInt(e.target.value),
                this.props.boardWidth
              )
            }
          />
        </div>
        <br />
        <div className="subtitle">
          How far into the board can units be placed?
        </div>
        <div>
          <input
            type="number"
            id="placementZone"
            name="placementZone"
            min="1"
            value={this.props.placementZone}
            onChange={(e) => this.props._setPlacementZone(e.target.value)}
          />
        </div>
        <div className="subtitle">How many units per player?</div>
        <div>
          <input
            type="number"
            id="unitsCount"
            name="unitsCount"
            min="1"
            value={this.props.unitsCount}
            onChange={(e) => this.props._setUnitCount(parseInt(e.target.value))}
          />
        </div>
        <br />
        <div>
          <button
            className="button active"
            onClick={() => {
              this.props._selectUnits();
            }}
          >
            {" "}
            READY{" "}
          </button>
        </div>
      </div>
    );
  }
}

export default Settings;
