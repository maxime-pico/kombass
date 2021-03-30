import React, { Component } from 'react'
import UnitSelector from './UnitSelector'

class TaskForceSelector extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const units = this.props.units
    return (
      <div className="taskForceSelector-container">
        {
          units.map((unit, unit_index) => {
            return  <UnitSelector key={unit_index} unit={unit} unitIndex={unit_index} playerIndex={this.props.player} _circleUnit={this.props._circleUnit}/>
          })
        }
      </div>
    )
  }
}

export default TaskForceSelector