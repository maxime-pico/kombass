import React, { Component } from 'react'

class Square extends Component {
  constructor(props){
    super(props);
    this.state = {
      selected: false,
    }
  }

  _clickedSquare(turn){
    const playerNumber = this.props.turn % 2
    if (this.props.step === 0 || this.props.step === 2){
      if (this.props.player === this.props.players[playerNumber]){
        this.props._changeStep(this.props.step)
        this.setState({
          selected: true,
        })
        this.props._setSelectedUnit(playerNumber, this.props.unit[1])
      }
    }
    if (this.props.step === 1 || this.props.step === 3){
      if (this.props.isReachable[playerNumber][this.props.selectedUnit.unitNumber]){
        this.props._changeStep(this.props.step)
        this.props._changePosition(playerNumber, this.props.selectedUnit.unitNumber, this.props.col, this.props.row)
        this.props._nextTurn(turn)
      }
    }
  }

  render() {
    const unit = this.props.unit
    const player = this.props.player
    return (
      <div
        className={`square${player ? ' active' : ''}${this.state.selected && player ? ' selected' : ''}${(this.props.isReachable[0].find(e => e) || this.props.isReachable[1].find(e => e)) ? ' reachable' : ''}`}
        onClick={() => this._clickedSquare(this.props.turn)}
        style={{backgroundColor: unit && player.color}}
      >
        {
          unit ?
            `Life: ${unit[0].life} Speed: ${unit[0].speed}` :
            `(${this.props.col}, ${this.props.row})`
        }
      </div>
    )
  }
}

export default Square