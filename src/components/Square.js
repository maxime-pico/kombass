import React, { Component } from 'react'
import Unit from './Unit'
import Flag from './Flag'
import {AUDIO} from '../utilities/dict'

class Square extends Component {
  constructor(props){
    super(props);
    this.state = {
      selected: this.props.selected,
      boom: false,
    }
    this._boom = this._boom.bind(this);
  }

  squareRef = React.createRef()

  _boom(e){
    this.props._screenShake()
    var audio = new Audio()
	  audio.src = AUDIO.boom
    audio.play()
    this.setState({boom: true})
  }

  _clickedSquare(square){
    const playerNumber = this.props.step < 5 ? 0 : 1
    if (this.props.step !== 10){
      if (this.props.isReachable && !this.props.isForbidden){
        if(this.props.step === -1){
          this.props._placeUnit(this.props.player, this.props.selectedUnit.unitNumber, this.props.col, this.props.row)
        }else{
          this.props._changeStep(this.props.step)
          this.props._changePosition(playerNumber, this.props.selectedUnit.unitNumber, this.props.col, this.props.row)
        }
      }
    }
  }

  componentDidUpdate() {
    if(this.state.boom){
      setTimeout(()=>{this.setState({boom: false})}, 1000)
      window.removeEventListener('boom', this._boom)
    }
  }

  render() {
    const unit = this.props.unit
    const ghostUnit = this.props.ghostUnit
    const playerIndex = this.props.playerIndex

    if(ghostUnit && !this.state.boom){
      if(this.props.futureUnits && this.props.futureUnits[playerIndex][ghostUnit[1]].life <1){
        window.addEventListener('boom', this._boom)
      }
    }

    const containsFlag = this.props.containsFlag
    const bgcol = containsFlag[0] ? this.props.players[0].color : containsFlag[1] ? this.props.players[1].color : ''
    const isReachable = this.props.isReachable
    const isForbidden = this.props.isForbidden
    const isInDanger = this.props.isInDanger
    const isFlagZone = this.props.isFlagZone
    return (
      <div className='square-container'>
        <div
          ref={this.squareRef}
          className={`square${unit || ghostUnit ? ' active' : ''}${this.props.selected && unit ? ' selected' : ''}${ isForbidden ? ' forbidden' : ''}${bgcol ? ' contains-flag' : ''}${isFlagZone ? ' flag-zone' : ''}${this.state.boom ? ' boom':''}`}
          onClick={() => this._clickedSquare(this.square)}
          onTouchEnd={void(0)}
        >
          <div className={`square-inside${isReachable ? ' reachable' : ''}`}>
            { unit ? <Unit unit={unit[0]} playerIndex={playerIndex} />: '' }
            { ghostUnit ? <Unit unit={ghostUnit[0]} playerIndex={playerIndex} />: '' }
            { bgcol && !ghostUnit && !unit ? <Flag containsFlag={containsFlag}/>: ''}
            { isInDanger.map((danger, danger_id) => 
              isInDanger[danger_id] && !unit && !ghostUnit && danger_id !== 2 ? <div className="danger" style={{backgroundColor: this.props.players[danger_id].color}}></div> : null
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Square