import React, { Component } from 'react'
import {STEP} from '../utilities/dict'

class InfoBar extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const currentPlayer = this.props.step < 4 ? this.props.players[this.props.turn % 2] : ''
    return (
      <div>
        <div>Turn: {this.props.turn}</div>
        <div> {currentPlayer.name} {STEP[this.props.step]}</div>
      </div>
    )
  }
}

export default InfoBar