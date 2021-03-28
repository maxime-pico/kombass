import React, { Component } from 'react'
import {SPRITES} from '../utilities/dict'

class Unit extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const unit = this.props.unit[0]
    const playerIndex = this.props.playerIndex
    const hasFlag = this.props.unit.hasFlag
    const unitSprite = SPRITES[playerIndex][unit.strength-1]
    return (
      <div className='unit'>
        <div className='unit-sprite'>
          <img src={unitSprite} alt="player unit" />
        </div>
        <div className='unit-info'>
          {`${unit.life} ${hasFlag ? 'F' : ''}`}
        </div>
      </div>
    )
  }
}

export default Unit