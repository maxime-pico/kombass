import React, { Component } from 'react'
import {SPRITES} from '../utilities/dict'

class Flag extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const containsFlag = this.props.containsFlag
    const flagP1 = containsFlag[0]
    const flagP2 = containsFlag[1]
    const flag = flagP1 ? SPRITES[0][3] : flagP2 ? SPRITES[1][3] : false
    return flag ? (<img className={`flag-image${this.props.withPlayer ? ' with-player' : ''}`} src={flag} alt="Flag" />) : null
  }
}

export default Flag