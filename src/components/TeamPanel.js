import React, { Component } from 'react'
import Unit from './Unit'

class TeamPanel extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const units = this.props.units
    const playerIndex = this.props.playerIndex
    const selectedUnit = this.props.selectedUnit
    let selected = false
    return (
      <div className='teamPanel-container'>
        <div className='teamPanel'>
          {
            units.map((unit, unit_index) => {
              selected = selectedUnit.playerNumber === playerIndex && selectedUnit.unitNumber === unit_index
              return (
                <div key={unit_index} className="teamPanel-box">
                  { unit.life < 1 ? <div className={`unitPanel-foreground p${playerIndex + 1}${selected ? ' selected':''}`}></div> : null}
                  <Unit unit={unit} playerIndex={playerIndex} displayUnitInfo />
                  <div className={`unitPanel-background p${playerIndex + 1}${selected ? ' selected':''}`}></div>
                </div>)
            })
          }
        </div>
      </div>
    )
  }
}

export default TeamPanel