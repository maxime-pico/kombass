import React, { Component } from 'react'
import Unit from './Unit'

class UnitToPlace extends Component {
  constructor(props){
    super(props)
    this.state = {
      errors: false,
    }
  }

  render(){
    const unit = this.props.unit
    const playerIndex = this.props.playerIndex
    const selected = this.props.selected
    return (
      <div className={`unitPlacement-box${selected ? ' selected':''}`}>
        <div className="unitPlacement-background"></div>
        <Unit unit={unit} playerIndex={playerIndex}/>
      </div>
              
    )
  }
}

export default UnitToPlace