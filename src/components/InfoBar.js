import React, { Component } from 'react'
import {STEP} from '../utilities/dict'

class InfoBar extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    const currentPlayer = this.props.step < 4 ? this.props.players[0] : this.props.step < 10 ? this.props.players[1] : ''
    return (
      <div>
        <div>Step: {this.props.step}</div>
        <div> {currentPlayer.name} {STEP[this.props.step]}</div>
      </div>
    )
  }
}

export default InfoBar