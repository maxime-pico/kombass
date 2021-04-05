import React, { Component } from 'react'
import Unit from './Unit'
import Flag from './Flag'

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
    this.setState({boom: true})
    this.props._screenShake()
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
      setTimeout(()=>{this.setState({boom: false})}, 500)
      window.removeEventListener('boom', this._boom)
    }
  }

  render() {
    const unit = this.props.unit
    if(unit && unit[2] && unit[0].life <1 && !this.state.boom){
      window.addEventListener('boom', this._boom)
    }
    const playerIndex = this.props.playerIndex
    const containsFlag = this.props.containsFlag
    const bgcol = containsFlag[0] ? this.props.players[0].color : containsFlag[1] ? this.props.players[1].color : ''
    const isReachable = this.props.isReachable
    const isForbidden = this.props.isForbidden
    const isInDanger = this.props.isInDanger[0] ? this.props.players[0].color : this.props.isInDanger[1] ? this.props.players[1].color : false
    const isFlagZone = this.props.isFlagZone
    return (
      <div
        ref={this.squareRef}
        className={`square${unit ? ' active' : ''}${this.props.selected && unit ? ' selected' : ''}${ isForbidden ? ' forbidden' : ''}${bgcol ? ' contains-flag' : ''}${isFlagZone ? ' flag-zone' : ''}${this.state.boom ? ' boom':''}`}
        onClick={() => this._clickedSquare(this.square)}
        onTouchEnd={void(0)}
      >
        <div className={`square-inside${isReachable ? ' reachable' : ''}`}>
          { unit ? <Unit unit={unit[0]} playerIndex={playerIndex} isGhost={unit[2]} />: '' }
          <Flag containsFlag={containsFlag}/>
          {/* { containsFlag[0] || containsFlag[1] ? <div className='flag' style={{backgroundColor: bgcol}}>F</div> : null} */}
          { isInDanger && !unit ?  <div className={`danger${this.props.isInDanger[2] ? ' ghost' : ''}`} style={{backgroundColor: isInDanger}}></div> : null }
        </div>
      </div>
    )
  }
}

export default Square