import React, { Component } from 'react'
import TaskForceSelector from './TaskForceSelector'

class UnitSelection extends Component {
  constructor(props){
    super(props)
    this.state = {
      player: 0,
    }
  }

  render(){
    return (
      <div className="unitSelection-container">
        <div> Compose your Task Force </div>
        <TaskForceSelector units={this.props.units[this.state.player]} player={this.state.player} />
        <div> <button onClick={() => {this.props._startGame()}} > START </button> </div>
      </div>
    )
  }
}

export default UnitSelection