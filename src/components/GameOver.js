import React, { Component } from 'react'

class GameOver extends Component {
  constructor(props){
    super(props)
    this.state = {}
  }

  render(){
    return (
      <div className="gameOver-container">
        <div className="gameOver">
          <div className="title">
            Game Over
          </div>
          <div className="subtitle">
            {this.props.gameOver}
          </div>
          <div className="question-container">
            <div className="question">Don't tell me you think war is cool and you want to play again...</div>
            <button className="button active align-center" onClick={() => {window.location.reload()}}>PLAY AGAIN</button>
          </div>
        </div>
      </div>
    )
  }
}

export default GameOver