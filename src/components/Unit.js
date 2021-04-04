import React, { Component } from 'react'
import {UNITS} from '../utilities/dict'
import Flag from './Flag'

class Unit extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const unit = this.props.unit
    const playerIndex = this.props.playerIndex
    const hasFlag = unit.hasFlag
    const unitSprite = UNITS[unit.strength-1].svg[playerIndex]
    const displayUnitInfo = this.props.displayUnitInfo ? true : false
    let containsFlag = [false, false]
    containsFlag[(playerIndex+1)%2] = hasFlag
    return (
      <div className={`unit${hasFlag ? ' has-flag':''}`}>
        <div className={`unit-sprite${hasFlag ? ' mirror' : ''}`}>
          <img src={unitSprite} alt="player unit" />
        </div>
        {
          displayUnitInfo ? (
            <div className='unit-info'>
              {`HP:${unit.life} S:${unit.strength} ${hasFlag ? ' F' : ''}`}
            </div>
          ):null
        }
        { hasFlag ? <Flag containsFlag={containsFlag} withPlayer={true} /> : null}
      </div>
    )
  }
}

export default Unit