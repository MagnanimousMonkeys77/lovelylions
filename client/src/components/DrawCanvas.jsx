import React from 'react';

class DrawCanvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      brushWidth: 7,
      width: 900,
      height: 450,
      erasing: false,
      eColor: 'transparent',
      dColor: '#33adff',
      bodyPart: "head"
    };

    this.drawingPoints = [];
    this.isDrawing = false;
    this.scrollLeft = 0;
    this.scrollTop = 0;
  }

  onEraserClick() {
    this.setState({
      erasing: true,
      eColor: '#33adff',
      dColor: 'transparent'
    })
  }

  onDrawClick() {
    this.setState({
      erasing: false,
      eColor: 'transparent',
      dColor: '#33adff'
    })
  }

  updateBrushWidth(event) {
    this.setState({
      brushWidth: event.target.value
    })
  }

  startDraw(event) {
    var left = event.clientX - this.offsetLeft + this.scrollLeft;
    var top = event.clientY - this.offsetTop + this.scrollTop;
    this.isDrawing = true;
    this.addToDrawingEvents(left, top, true);
    this.redraw();
  }

  endDraw(event) {
    this.isDrawing = false;

    if(this.drawingPoints.length) {
      this.stackPointsBack.push(this.drawingPoints.slice());
    }

    this.drawingPoints = [];
  }

  drawing(event) {
    var left = event.clientX - this.offsetLeft + this.scrollLeft;
    var top = event.clientY - this.offsetTop + this.scrollTop;
    if (this.isDrawing) {
      this.addToDrawingEvents(left, top, true); // holds the coordinates of the drawing
      this.redraw();
    }
  }

  touchDrawing(event) {
    event.preventDefault();
    var left = event.touches[0].clientX - this.offsetLeft + this.scrollLeft;
    var top = event.touches[0].clientY - this.offsetTop + this.scrollTop;
    if (this.isDrawing) {
      this.addToDrawingEvents(left, top, true);
      this.redraw();
    }
  }


  addToDrawingEvents(x, y, drag) {
    this.drawingPoints.push({x: x, y: y, drag: drag})
  }

  redraw(undo) {

    if(undo) {
      this.context.lineCap = 'round';
      this.context.beginPath();
      this.context.moveTo(this.drawingPoints[0].x, this.drawingPoints[0].y);
      this.drawingPoints.forEach(({x, y}) => {
        this.context.lineTo(x, y);
      });

      this.context.stroke();
      return;
    }

    if (this.drawingPoints.length === 1) {
      this.context.beginPath();
      this.context.strokeStyle = '#000000 ';
      this.context.arc(this.drawingPoints[0].x, this.drawingPoints[0].y, Math.floor(this.state.brushWidth / 2), 0, Math.PI * 2);
      this.context.fill();
    } else {
      for (var i = 0; i < this.drawingPoints.length; i++) {

        if(this.drawingPoints.length > 300) {
          debugger;
        }
        this.context.beginPath();
        this.state.erasing ? this.context.globalCompositeOperation = 'destination-out' : this.context.globalCompositeOperation = 'source-over';
        this.context.strokeStyle = "#000000 ";
        this.context.lineJoin = 'round';
        this.context.lineWidth = this.state.brushWidth;

        if (this.drawingPoints[i].drag && i) {
          this.context.moveTo(this.drawingPoints[i - 1].x, this.drawingPoints[i - 1].y);
        } else {
          this.context.moveTo(this.drawingPoints[i].x, this.drawingPoints[i].y);
        }
        this.context.lineTo(this.drawingPoints[i].x, this.drawingPoints[i].y);
        this.context.closePath();
      }
    this.context.stroke();

    }
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.state.width, this.state.height);
    this.drawingPoints = [];
    this.context.save();
    this.setState({
      eColor: 'transparent',
      dColor: '#33adff'
    })
  }

  submitImage(event) {
    var userImage = {};
    userImage[this.state.bodyPart] = {path: this.canvas.toDataURL("image/png")}
    this.props.generateImage(userImage);
  }

  changePart(event) {
    this.setState({bodyPart: event.target.value}, ()=>{
      if (this.state.bodyPart === 'head') { this.props.fixHead() }
      if (this.state.bodyPart === 'torso') { this.props.fixHead(); this.props.fixTorso() }
      if (this.state.bodyPart === 'legs') { this.props.fixHead(); this.props.fixLegs() }
    });
  }

  componentDidMount() {
    //selects the DOM elements and exposes the HTML 5 canvas context obj
    this.canvas = document.getElementById('canvas');
    this.mouse = document.getElementById('mouseCursor');
    this.context = this.canvas.getContext('2d');
    // debugger;
    this.context.shadowColor = 'black';
    this.context.shadowBlur = 5;
    this.offsetLeft = this.canvas.offsetLeft;
    this.offsetTop = this.canvas.offsetTop;
    window.onresize = (event => {
      this.offsetLeft = this.canvas.offsetLeft;
      this.offsetTop = this.canvas.offsetTop;
    }).bind(this);
    document.addEventListener('scroll', (event) => {
      this.scrollLeft = document.body.scrollLeft;
      this.scrollTop = document.body.scrollTop;
    });

    this.stackPointsBack = [];
    this.stackPointsForwards = [];

  }

  undo() {
    if(!this.stackPointsBack.length) {
      return;
    }

    this.clearCanvas();

    this.stackPointsForwards.push(this.stackPointsBack.pop());

    this.stackPointsBack.forEach(arr => {
      this.drawingPoints = arr;

      this.redraw(true);
      this.redraw(true);
      this.redraw(true);
      this.drawingPoints = [];
    })
  }

  redo() {
    if(!this.stackPointsForwards.length) {
      return;
    }

    this.stackPointsBack.push(this.stackPointsForwards.pop());
    this.drawingPoints = this.stackPointsBack[this.stackPointsBack.length - 1];
    this.redraw(true);
    this.redraw(true);
    this.redraw(true);
    this.drawingPoints = [];
  }

  render () {
    //sets cursor styling
    var style = {};
    this.state.erasing ? style.cursor = 'url(eraser.cur) 15 15, auto' : style.cursor = 'crosshair';
    return (
      <div className ="draw-canvas">
        <div>
          <canvas
            style={style}
            onMouseLeave={this.endDraw.bind(this)}
            onMouseDown={this.startDraw.bind(this)}
            onMouseMove={this.drawing.bind(this)}
            onTouchMove={this.touchDrawing.bind(this)}
            onTouchStart={this.startDraw.bind(this)}
            onMouseUp={this.endDraw.bind(this)} onTouchEnd={this.endDraw.bind(this)}
            id='canvas' width={this.state.width} height={this.state.height}>
          </canvas>
          <img className="overlay" src="paper.png" width="900px" height="450px" />
          <img className="overlay outline" src={this.state.bodyPart + '.png'} />
        </div>
        <div className="button-cluster">
          <button onClick={this.undo.bind(this)}>Undo</button>
          <button onClick={this.redo.bind(this)}>Redo</button>
          <button onClick={this.clearCanvas.bind(this)}>Clear</button>

          {/*<input style={{'marginRight': '20px'}} className="clearBtn" onClick={this.clearCanvas.bind(this)} type='button' value="Clear"></input>*/}
          <img style={{'backgroundColor': this.state.eColor, 'marginRight': '20px'}} onClick={this.onEraserClick.bind(this)} className="eraser" src="erasericon.png"></img>
          <img style={{'backgroundColor': this.state.dColor, 'marginRight': '20px'}} onClick={this.onDrawClick.bind(this)} className="drawBrush" src="brushicon.png"></img>
          <select onChange={this.changePart.bind(this)}>
            <option value="head">head</option>
            <option value="torso">torso</option>
            <option value="legs">legs</option>
          </select>
          <button id='doneButton' onClick={this.submitImage.bind(this)}>Done</button>
          {/*<input onClick={this.submitImage.bind(this)} type="button" value="Done"/>*/}
          <span>Brush size: {this.state.brushWidth}</span>
          <input
            onChange={this.updateBrushWidth.bind(this)}
            value={this.state.brushWidth}
            type="range" min="5" max="25" step="1" />
        </div>
        <div className="button-cluster">

        </div>
      </div>
      )
  }
}

export default DrawCanvas;
