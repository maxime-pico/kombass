import React, { Component } from 'react'
import TaskForceSelector from './TaskForceSelector'

class UnitSelection extends Component {
  constructor(props){
    super(props)
    this.state = {
      player: 0,
      errors: false,
    }
  }

  _checkForViolation(units){
    const unitCount = [0, 0, 0]
    units.forEach((unit) => {
      unitCount[unit.life - 1] = unitCount[unit.life - 1] +  1
    })
    const violations = unitCount.filter(count => count > 3)
    if (violations.length > 0){
      this.setState({
        errors: true,
      })
    } else{
      if (this.state.player === 0){
        this.setState({
          player: 1,
        })
      }else{
        this.props._placeUnits()
      }
    }
    return true
  }

  render(){
    const units = this.props.units[this.state.player]
    return (
      <div className="unitSelection-container">
        <div> Compose your Task Force </div>
        <TaskForceSelector units={units} player={this.state.player} _circleUnit={this.props._circleUnit} />
        <div className="error">{ this.state.errors ? 'Max three units per type!' : ''}</div>
        <div> <button className="button" onClick={() => {this._checkForViolation(units)}} > { this.state.player === 0 ? 'NEXT' : 'START'} </button> </div>
      </div>
    )
  }
}

export default UnitSelection