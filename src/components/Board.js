import React, { Component } from 'react'
import Square from './Square'

class Board extends Component {
  constructor(props){
    super(props)
    this.state = {
      board: Array(11).fill(Array(16).fill(null)),
    }
  }

  _isReachable(col, row, x, y, speed){
    return x && (Math.abs(x - col) + Math.abs(y - row) <= speed)
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

  renderSquare(col,row) {
    const unitsp1 = this.props.units[0]
    const unitsp2 = this.props.units[1]
    const containsUnits1 = this._containsUnits(unitsp1, col, row)
    const containsUnits2 = this._containsUnits(unitsp2, col, row)
    const containsUnits = containsUnits1[0] ? containsUnits1 : containsUnits2[0] ? containsUnits2 : null
    const containsPlayer = containsUnits1[0] ? this.props.players[0] : containsUnits2[0] ? this.props.players[1] : null
    const isReachable = this.props.units.map((player, player_index) => (
      player.map((unit, unit_index) => (
        this._isReachable(col, row, unit.x, unit.y, unit.speed)
      ))
    ))
    console.log(col, row, isReachable)
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
        selectedUnit={this.props.selectedUnit}
        _setSelectedUnit={this.props._setSelectedUnit}
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