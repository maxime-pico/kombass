import React, { Component } from 'react'

class Square extends Component {
  constructor(props){
    super(props);
    this.state = {
      selected: this.props.selected,
    }
  }

  _clickedSquare(turn){
    const playerNumber = this.props.step < 5 ? 0 : 1
    if (this.props.step !== 10){
      if (this.props.isReachable){
        this.props._changeStep(this.props.step)
        this.props._changePosition(playerNumber, this.props.selectedUnit.unitNumber, this.props.col, this.props.row)
        this.props._nextTurn(turn)
      }
    }
  }

  render() {
    const unit = this.props.unit
    const player = this.props.player
    const containsFlag = this.props.containsFlag
    const bgcol = containsFlag[0] ? this.props.players[0].color : containsFlag[1] ? this.props.players[1].color : ''
    const isReachable = this.props.isReachable
    return (
      <div
        className={`square${player ? ' active' : ''}${this.props.selected && player ? ' selected' : ''}${ isReachable ? ' reachable' : ''}${bgcol ? ' contains-flag' : ''}`}
        onClick={() => this._clickedSquare(this.props.turn)}
        style={{backgroundColor: `${unit ? player.color : ''}`}}
      >
        {
          unit ? (
            `${unit[0].life} ${unit[0].speed} ${unit[0].hasFlag ? 'F' : ''}`
          ):
            ''
        }
        { containsFlag[0] || containsFlag[1] ? <div className='flag' style={{backgroundColor: bgcol}}>F</div> : null}
      </div>
    )
  }
}

export default Square