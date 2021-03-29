import React, { Component } from 'react'
import Square from './Square'

class Board extends Component {
  constructor(props){
    super(props)
    this.state = {
      board: Array(21).fill(Array(26).fill(null)),
    }
  }

  _isReachable(unit, col, row){
    const x = unit ? unit.x : false
    const y = unit ? unit.y : false
    const speed = unit ? unit.speed : -1
    return unit ? (Math.abs(x - col) + Math.abs(y - row) <= speed) : false
  }
  
  _isForbidden(unit, col, row){
    const playerNumber = this.props.selectedUnit.playerNumber
    const unitNumber = this.props.selectedUnit.unitNumber
    const ownFlag = this.props.flags[playerNumber]
    let isForbidden = false
    if (playerNumber !== -1){
      this.props.units[playerNumber].forEach((unit, unit_index) => {
        if ((unitNumber !== unit_index)){
          isForbidden = isForbidden || ((unit.x === col) && (unit.y === row) && (unit.life > 0))
        }
      })
      this.props.futureUnits[playerNumber].forEach((unit, unit_index) => {
        if (unit && (unitNumber !== unit_index)){
          isForbidden = isForbidden || ((unit.x === col) && (unit.y === row) && (unit.life > 0))
        }
      })
      if(!this.props.units[playerNumber][unitNumber].hasFlag){
        if (ownFlag && (ownFlag.x !== -1)){
            isForbidden = isForbidden || ((Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3))
        }
      }
    }
    return isForbidden
  }

  _isFlagZone(col, row){
    const flags = this.props.flags
    let isFlagZone = false

    flags.forEach((flag, flag_index) => {
      isFlagZone = isFlagZone || ((Math.abs(col - flag.x) + Math.abs(row - flag.y) <= 3))
    })

    return isFlagZone
  }

  _isInDanger(col, row){
    let isInDanger = [false, false]
    const playerNumber = this.props.selectedUnit.playerNumber
    const ownFlag = this.props.flags[playerNumber]
    const unitNumber = this.props.selectedUnit.unitNumber
    if (playerNumber !== -1){
      this.props.units.forEach((player, player_index) => {
        player.forEach((unit, unit_index) => {
          if(!this.props.units[playerNumber][unitNumber].hasFlag){
            if (ownFlag && (ownFlag.x !== -1) && !(Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3) && unit.life > 0){
                isInDanger[player_index] = isInDanger[player_index] || ((Math.abs(col - unit.x) + Math.abs(row - unit.y) <= unit.strength))
            }
          }
        })
      })
    }
    return isInDanger
  }

  _containsUnits(units, col, row){
    let unitContained = null
    let unitNumber = null
    units.forEach((unit, index) => {
      if (unit.x === col && unit.y === row && (unit.life >0)){
        unitContained = unit
        unitNumber = index
      }
    })
    return [unitContained, unitNumber]
  }

  _containsFlag(col, row){
    const flag1 = this.props.flags[0]
    const flag2 = this.props.flags[1]
    const containsFlag = []
    containsFlag[0] = (flag1.x === col && flag1.y === row && flag1.inZone)
    containsFlag[1] = (flag2.x === col && flag2.y === row && flag2.inZone)
    return containsFlag
  }

  _isSelected(col, row, selectedUnit){
    const unit = this.props.units[selectedUnit.playerNumber]?.[selectedUnit.unitNumber]
    return unit && unit.x === col && unit.y === row
  }

  renderSquare(col,row) {
    const unit = this.props.units[this.props.selectedUnit.playerNumber]?.[this.props.selectedUnit.unitNumber]
    const unitsp1 = this.props.units[0]
    const unitsp2 = this.props.units[1]
    const containsUnits1 = this._containsUnits(unitsp1, col, row)
    const containsUnits2 = this._containsUnits(unitsp2, col, row)
    const containsUnits = containsUnits1[0] ? containsUnits1 : containsUnits2[0] ? containsUnits2 : null
    const containsPlayer = containsUnits1[0] ? 0 : containsUnits2[0] ? 1 : null
    const containsFlag = this._containsFlag(col,row)
    const isReachable = this._isReachable(unit, col, row)
    const isForbidden = this._isForbidden(unit, col, row)
    const isInDanger = this._isInDanger(col, row)
    const isFlagZone = this._isFlagZone(col, row)
    return (
      <Square
        key={`${col} ${row}`}
        col={col}
        row={row}
        _nextTurn={this.props._nextTurn}
        turn={this.props.turn}
        unit={containsUnits}
        playerIndex={containsPlayer}
        players={this.props.players}
        _changeStep={this.props._changeStep}
        step={this.props.step}
        _changePosition={this.props._changePosition}
        isReachable={isReachable}
        isForbidden={isForbidden}
        isInDanger={isInDanger}
        isFlagZone={isFlagZone}
        selected={this._isSelected(col, row, this.props.selectedUnit)}
        selectedUnit={this.props.selectedUnit}
        containsFlag={containsFlag}
      />
    )
  }
  
  render(){
    return (
      <div className='board'>
        {
          this.state.board.map((row, row_index) => (
            row.map((column, column_index) => (
              this.renderSquare(column_index, row_index)
            ))
          ))
        }
      </div>
    )
  }
}

export default Board