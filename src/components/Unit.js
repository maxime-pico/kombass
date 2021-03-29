import React, { Component } from 'react'
import {SPRITES} from '../utilities/dict'
import Flag from './Flag'

class Unit extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const unit = this.props.unit[0]
    const playerIndex = this.props.playerIndex
    const hasFlag = unit.hasFlag
    const unitSprite = SPRITES[playerIndex][unit.strength-1]
    let containsFlag = [false, false]
    containsFlag[(playerIndex+1)%2] = hasFlag
    return (
      <div className={`unit${hasFlag ? ' has-flag':''}`}>
        <div className={`unit-sprite${hasFlag ? ' mirror' : ''}`}>
          <img src={unitSprite} alt="player unit" />
        </div>
        <div className='unit-info'>
          {`${unit.life}${hasFlag ? ' F' : ''}`}
        </div>
        { hasFlag ? <Flag containsFlag={containsFlag} withPlayer={true} /> : null}
      </div>
    )
  }
}

export default Unit