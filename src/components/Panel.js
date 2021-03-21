import React, { Component } from 'react'

class Panel extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    return (
      <div className='panel'>
        <button className={`${this.props.step !== 10 ? 'inactive' : 'active'}`} onClick={() => this.props.step === 10 ? this.props._applyMoves() : null}>
          Fight!
        </button>
      </div>
    )
  }
}

export default Panel