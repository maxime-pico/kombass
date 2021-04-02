import React, { Component } from 'react'

class IntroScreen extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    return (
      <div className="introScreen-container">
        <div className="title">// Kombass //</div>
        <div className="subtitle">Are you sure you want to play?</div>
        <div>
          <button className="button active" onClick={()=> {this.props._selectUnits()}}> PLAY </button>
        </div>
      </div>
    )
  }
}

export default IntroScreen