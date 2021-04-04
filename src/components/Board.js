import React, { Component } from 'react'
import Square from './Square'

class Board extends Component {
  constructor(props){
    super(props)
    this.state = {
      board: Array(21).fill(Array(22).fill(null)),
      placementZone: 5,
    }
  }

  _isReachable(unit, col, row, placement = false){
    let isReachable = false
    if (placement){
      const playerNumber = this.props.player
      const placementZone = this.state.placementZone
      const ownFlag = this.props.flags[playerNumber]
      const flagZone = ownFlag ? ((Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3)) : false
      isReachable = playerNumber ? (col > (this.state.board[0].length - placementZone -1)) : ( col < placementZone)
      isReachable = isReachable && !flagZone
    }else{
      const x = unit ? unit.x : false
      const y = unit ? unit.y : false
      const speed = unit ? unit.speed : -1
      const ownFlag = this.props.flags[this.props.selectedUnit.playerNumber]
      const flagZone = ownFlag && !unit.hasFlag ? ((Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3)) : false
      isReachable = unit ? (Math.abs(x - col) + Math.abs(y - row) <= speed) && !flagZone : false
    }
    return isReachable
  }
  
  _isForbidden(unit, col, row, placement = false){
    let playerNumber = this.props.selectedUnit.playerNumber
    const unitNumber = this.props.selectedUnit.unitNumber
    const ownFlag = this.props.flags[playerNumber]
    let isForbidden = false

    if (placement){
      playerNumber = this.props.player
      const placementZone = this.state.placementZone
      this.props.units[playerNumber].forEach((unit, unit_index) => {
        if (this.props.placedUnits[playerNumber][unit_index]){
          isForbidden = isForbidden || ((unit.x === col) && (unit.y === row))
        }
      })
      if (ownFlag && (ownFlag.x !== -1)){
          isForbidden = isForbidden || ((Math.abs(col - ownFlag.x) + Math.abs(row - ownFlag.y) <= 3))
      }
      isForbidden = playerNumber ? isForbidden || (col <= (this.state.board[0].length - placementZone -1)) : isForbidden || ( col >= placementZone)
    } else {  
      if (playerNumber !== -1){
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

  _isInDanger(col, row, placement = false){
    let isInDanger = [false, false]
    if (!placement){
      const playerNumber = this.props.selectedUnit.playerNumber
      const flag1 = this.props.flags[0]
      let inReachFlag1 = (flag1 && (flag1.x !== -1) && !(Math.abs(col - flag1.x) + Math.abs(row - flag1.y) <= 3))
      const flag2 = this.props.flags[1]
      let inReachFlag2 = (flag2 && (flag2.x !== -1) && !(Math.abs(col - flag2.x) + Math.abs(row - flag2.y) <= 3))
      if (playerNumber !== -1){
        this.props.units.forEach((player, player_index) => {
          player.forEach((unit, unit_index) => {
            if (inReachFlag1 && inReachFlag2 && unit.life > 0){
                isInDanger[player_index] = isInDanger[player_index] || ((Math.abs(col - unit.x) + Math.abs(row - unit.y) <= unit.strength))
            }
          })
        })
      }
    }
    return isInDanger
  }

  _containsUnits(units, col, row, player = null, placement = false){
    let unitContained = null
    let unitNumber = null
    units.forEach((unit, index) => {
      let isPlaced = placement ? this.props.placedUnits[player][index] : true
      if (unit.x === col && unit.y === row && (unit.life >0) && isPlaced){
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
    const player = this.props.player
    const placement = this.props.placement
    const unit = this.props.units[this.props.selectedUnit.playerNumber]?.[this.props.selectedUnit.unitNumber]
    const unitsp1 = player !== 1 ? this.props.units[0] : []
    const unitsp2 = this.props.units[1]
    const containsUnits1 = this._containsUnits(unitsp1, col, row, 0, placement)
    const containsUnits2 = this._containsUnits(unitsp2, col, row, 1, placement)
    const containsUnits = containsUnits1[0] ? containsUnits1 : containsUnits2[0] ? containsUnits2 : null
    const containsPlayer = containsUnits1[0] ? 0 : containsUnits2[0] ? 1 : null
    const containsFlag = this._containsFlag(col,row)
    const isReachable = this._isReachable(unit, col, row, placement)
    const isForbidden = this._isForbidden(unit, col, row, placement)
    const isInDanger = this._isInDanger(col, row, placement)
    const isFlagZone = this._isFlagZone(col, row)
    return (
      <Square
        key={`${col} ${row}`}
        col={col}
        row={row}
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
        _placeUnit={this.props._placeUnit}
        player={this.props.player}
      />
    )
  }
  
  render(){
    return (
      <div className={`board p${this.props.selectedUnit.playerNumber + 1}`}>
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