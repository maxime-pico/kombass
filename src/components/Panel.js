import React, { Component } from 'react'

class Panel extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    return (
      <div className='panel'>
        <button onClick={() => this.props.step === 4 ? this.props._applyMoves() : null}>
          Fight!
        </button>
      </div>
    )
  }
}

export default Panel