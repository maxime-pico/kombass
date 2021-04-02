import React, { Component } from 'react'
import Unit from './Unit'
import Flag from './Flag'

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
      if (this.props.isReachable && !this.props.isForbidden){
        if(this.props.step === -1){
          this.props._placeUnit(this.props.player, this.props.selectedUnit.unitNumber, this.props.col, this.props.row)
        }else{
          this.props._changeStep(this.props.step, turn, playerNumber, this.props.selectedUnit.unitNumber, this.props.col, this.props.row)
          this.props._changePosition(playerNumber, this.props.selectedUnit.unitNumber, this.props.col, this.props.row)
          this.props._nextTurn(turn)
        }
      }
    }
  }

  render() {
    const unit = this.props.unit
    const playerIndex = this.props.playerIndex
    const containsFlag = this.props.containsFlag
    const bgcol = containsFlag[0] ? this.props.players[0].color : containsFlag[1] ? this.props.players[1].color : ''
    const isReachable = this.props.isReachable
    const isForbidden = this.props.isForbidden
    const isInDanger = this.props.isInDanger[0] ? this.props.players[0].color : this.props.isInDanger[1] ? this.props.players[1].color : false
    const isFlagZone = this.props.isFlagZone
    return (
      <div
        className={`square${unit ? ' active' : ''}${this.props.selected && unit ? ' selected' : ''}${ isForbidden ? ' forbidden' : ''}${bgcol ? ' contains-flag' : ''}${isFlagZone ? ' flag-zone' : ''}`}
        onClick={() => this._clickedSquare(this.props.turn)}
      >
        <div className={`square-inside${isReachable ? ' reachable' : ''}`}>
          { unit ? <Unit unit={unit[0]} playerIndex={playerIndex} /> : '' }
          <Flag containsFlag={containsFlag}/>
          {/* { containsFlag[0] || containsFlag[1] ? <div className='flag' style={{backgroundColor: bgcol}}>F</div> : null} */}
          { isInDanger && !unit ?  <div className='danger' style={{backgroundColor: isInDanger}}></div> : null }
        </div>
      </div>
    )
  }
}

export default Square