import React, { Component } from 'react'
import Unit from './Unit'

class TaskForceSelector extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const units = this.props.units
    console.log(units)
    return (
      <div className="taskForceSelector-container">
        {
          units.map((unit, unit_index) => {
            return <div className="taskForceSelector-unit"> <Unit key={unit_index} unit={unit} playerIndex={this.props.player} /> </div>
          })
        }
      </div>
    )
  }
}

export default TaskForceSelector