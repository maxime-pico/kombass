import React, { Component } from 'react'
import {SPRITES} from '../utilities/dict'

class Flag extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const containsFlag = this.props.containsFlag
    const withPlayer = this.props.withPlayer
    const flagP1 = containsFlag[0]
    const flagP2 = containsFlag[1]
    const flag = flagP1 ? SPRITES.flag[0] : flagP2 ? SPRITES.flag[1] : false
    return flag ? (<img className={`flag-image${withPlayer ? ' with-player' : ''} ${withPlayer && flagP1 ? ' mirror' : ''}`} src={flag} alt="Flag" />) : null
  }
}

export default Flag