import React, { Component } from 'react'
import Square from './Square'

class Board extends Component {
  constructor(props){
    super(props)
    this.state = {
      board: Array(21).fill(Array(32).fill(null)),
    }
  }

  _isReachable(col, row){
    const unit = this.props.units[this.props.selectedUnit.playerNumber]?.[this.props.selectedUnit.unitNumber]
    const x = unit ? unit.x : false
    const y = unit ? unit.y : false
    const speed = unit ? unit.speed : -1
    return unit ? (Math.abs(x - col) + Math.abs(y - row) <= speed) : false
  }

  _containsUnits(units, col, row){
    let unitContained = null
    let unitNumber = null
    units.forEach((unit, index) => {
      if (unit.x === col && unit.y === row && unit.life){
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
    containsFlag[0] = (flag1.x === col && flag1.y === row )
    containsFlag[1] = (flag2.x === col && flag2.y === row )
    return containsFlag
  }

  _isSelected(col, row, selectedUnit){
    const unit = this.props.units[selectedUnit.playerNumber]?.[selectedUnit.unitNumber]
    return unit && unit.x === col && unit.y === row
  }

  renderSquare(col,row) {
    const unitsp1 = this.props.units[0]
    const unitsp2 = this.props.units[1]
    const containsUnits1 = this._containsUnits(unitsp1, col, row)
    const containsUnits2 = this._containsUnits(unitsp2, col, row)
    const containsUnits = containsUnits1[0] ? containsUnits1 : containsUnits2[0] ? containsUnits2 : null
    const containsPlayer = containsUnits1[0] ? this.props.players[0] : containsUnits2[0] ? this.props.players[1] : null
    const containsFlag = this._containsFlag(col,row)
    const isReachable = this._isReachable(col, row)
    return (
      <Square
        key={`${col} ${row}`}
        col={col}
        row={row}
        _nextTurn={this.props._nextTurn}
        turn={this.props.turn}
        unit={containsUnits}
        player={containsPlayer}
        players={this.props.players}
        _changeStep={this.props._changeStep}
        step={this.props.step}
        _changePosition={this.props._changePosition}
        isReachable={isReachable}
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